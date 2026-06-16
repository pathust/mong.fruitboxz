import { Modules } from "@medusajs/framework/utils"

function getHost() {
  return process.env.MEILI_HOST?.replace(/\/$/, "") || ""
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    ...(process.env.MEILI_MASTER_KEY ? { Authorization: `Bearer ${process.env.MEILI_MASTER_KEY}` } : {}),
  }
}

function getIndexUid() {
  return process.env.MEILI_PRODUCT_INDEX || "products"
}

function getIndexUrl() {
  return `${getHost()}/indexes/${getIndexUid()}`
}

function normalize(raw?: string) {
  return (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function pickProductPrice(product: any) {
  const amounts = (product?.variants || [])
    .map((variant: any) => {
      const price = (variant?.prices || []).find((entry: any) => entry?.currency_code === "vnd") || variant?.prices?.[0]
      return Number(price?.amount || 0)
    })
    .filter((value: number) => value > 0)
  return amounts.length ? Math.min(...amounts) : 0
}

export function buildProductDocument(product: any) {
  const slug = product.handle || product.id
  return {
    id: product.id,
    slug,
    title: product.title || "San pham",
    description: product.description || "",
    thumbnail: product.thumbnail || product.images?.[0]?.url || "",
    status: product.status || "draft",
    category_names: (product.categories || []).map((category: any) => category.name).filter(Boolean),
    category_slugs: (product.categories || []).map((category: any) => category.handle).filter(Boolean),
    price_min: pickProductPrice(product),
    updated_at: product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString(),
  }
}

async function meiliRequest(path: string, init?: RequestInit) {
  const host = getHost()
  if (!host) throw new Error("MeiliSearch is not configured")
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), Number(process.env.MEILI_TIMEOUT_MS || 2500))
  const response = await fetch(`${host}${path}`, {
    ...init,
    signal: controller.signal,
    headers: {
      ...getHeaders(),
      ...(init?.headers || {}),
    },
  }).finally(() => clearTimeout(timeout))
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(body || `Meili request failed with ${response.status}`)
  }
  if (response.status === 204) return null
  return response.json()
}

async function waitForTask(taskUid?: number) {
  if (typeof taskUid !== "number") return

  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const task = await meiliRequest(`/tasks/${taskUid}`).catch(() => null)
    if (!task || ["succeeded", "failed", "canceled"].includes(task.status)) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

export async function ensureProductIndex() {
  if (!getHost()) return false
  await meiliRequest("/indexes", {
    method: "POST",
    body: JSON.stringify({ uid: getIndexUid(), primaryKey: "id" }),
  }).catch(() => null)

  await Promise.all([
    meiliRequest(`/indexes/${getIndexUid()}/settings/searchable-attributes`, {
      method: "PUT",
      body: JSON.stringify(["title", "description", "category_names", "category_slugs", "slug"]),
    }),
    meiliRequest(`/indexes/${getIndexUid()}/settings/filterable-attributes`, {
      method: "PUT",
      body: JSON.stringify(["status", "category_slugs"]),
    }),
    meiliRequest(`/indexes/${getIndexUid()}/settings/sortable-attributes`, {
      method: "PUT",
      body: JSON.stringify(["updated_at", "price_min"]),
    }),
    meiliRequest(`/indexes/${getIndexUid()}/settings/displayed-attributes`, {
      method: "PUT",
      body: JSON.stringify([
        "id",
        "slug",
        "title",
        "description",
        "thumbnail",
        "status",
        "category_names",
        "category_slugs",
        "price_min",
        "updated_at",
      ]),
    }),
  ])

  return true
}

export async function replaceProductIndex(products: any[]) {
  const ensured = await ensureProductIndex().catch(() => false)
  if (!ensured) return { enabled: false, indexed: 0 }

  const documents = products
    .map(buildProductDocument)
    .filter((doc) => doc.status === "published")

  const deleteTask = await meiliRequest(`/indexes/${getIndexUid()}/documents`, { method: "DELETE" }).catch(() => null)
  await waitForTask(deleteTask?.taskUid)

  if (documents.length) {
    const addTask = await meiliRequest(`/indexes/${getIndexUid()}/documents`, {
      method: "POST",
      body: JSON.stringify(documents),
    })
    await waitForTask(addTask?.taskUid)
  }
  return { enabled: true, indexed: documents.length }
}

export async function upsertProductDocument(product: any) {
  const ensured = await ensureProductIndex().catch(() => false)
  if (!ensured) return { enabled: false }
  const doc = buildProductDocument(product)
  if (doc.status !== "published") {
    const task = await meiliRequest(`/indexes/${getIndexUid()}/documents/${doc.id}`, { method: "DELETE" }).catch(() => null)
    await waitForTask(task?.taskUid)
    return { enabled: true, indexed: false }
  }
  const task = await meiliRequest(`/indexes/${getIndexUid()}/documents`, {
    method: "POST",
    body: JSON.stringify([doc]),
  })
  await waitForTask(task?.taskUid)
  return { enabled: true, indexed: true }
}

export async function removeProductDocument(productId: string) {
  const ensured = await ensureProductIndex().catch(() => false)
  if (!ensured) return { enabled: false }
  const task = await meiliRequest(`/indexes/${getIndexUid()}/documents/${productId}`, { method: "DELETE" }).catch(() => null)
  await waitForTask(task?.taskUid)
  return { enabled: true }
}

export async function searchProducts(query: string, category?: string, limit = 12, offset = 0) {
  if (!getHost()) return null
  return meiliRequest(`/indexes/${getIndexUid()}/search`, {
    method: "POST",
    body: JSON.stringify({
      q: query || "",
      limit,
      offset,
      filter: category ? `category_slugs = "${escapeFilterValue(category)}" AND status = "published"` : `status = "published"`,
      sort: ["updated_at:desc"],
    }),
  }).catch(() => null)
}

export async function getSearchStatus() {
  if (!getHost()) return { configured: false, enabled: false, online: false, indexed_documents: 0 }
  const stats = await meiliRequest(`/indexes/${getIndexUid()}/stats`).catch(() => null)
  if (!stats) {
    return {
      configured: true,
      enabled: false,
      online: false,
      indexed_documents: 0,
      index: getIndexUid(),
      host: getHost(),
    }
  }
  return {
    configured: true,
    enabled: true,
    online: true,
    indexed_documents: stats.numberOfDocuments || 0,
    index: getIndexUid(),
    host: getHost(),
  }
}

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function listProductsForSearch(scope: any) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const products: any[] = []
  const take = 200
  let skip = 0

  while (true) {
    const { data: page } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "handle",
        "title",
        "description",
        "thumbnail",
        "status",
        "updated_at",
        "categories.name",
        "categories.handle",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "images.url"
      ],
      pagination: { skip, take },
    })
    products.push(...(page || []))
    if (!page || page.length < take) break
    skip += take
  }

  return products
}

export async function findFallbackProducts(scope: any, query: string, category?: string, limit = 12) {
  const normalized = normalize(query)
  const products = await listProductsForSearch(scope)
  return products
    .map(buildProductDocument)
    .filter((doc) => doc.status === "published")
    .filter((doc) => {
      if (category && !doc.category_slugs.includes(category)) return false
      if (!normalized) return true
      const haystack = normalize([doc.title, doc.description, doc.slug, ...doc.category_names].join(" "))
      return haystack.includes(normalized)
    })
    .slice(0, limit)
}

export function isSearchEnabled() {
  return Boolean(getHost())
}
