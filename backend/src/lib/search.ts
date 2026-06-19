import { Modules } from "@medusajs/framework/utils"
import type { ServiceScope } from "./module-services"

export type ProductRecord = {
  id: string
  handle?: string | null
  title?: string | null
  description?: string | null
  thumbnail?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | Date | null
  updated_at?: string | Date | null
  images?: Array<{ url?: string | null }>
  categories?: Array<{ id: string; name?: string | null; handle?: string | null }>
  variants?: Array<{
    id: string
    title?: string | null
    manage_inventory?: boolean
    allow_backorder?: boolean
    inventory_quantity?: number
    prices?: Array<{ amount?: number | null; currency_code?: string | null }>
  }>
}

export type ProductSearchOptions = {
  category?: string
  priceRange?: string
  sort?: "price:asc" | "price:desc" | "created_at:desc" | "sales_count:desc"
  limit?: number
  offset?: number
}

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

function pickProductPrice(product: ProductRecord) {
  const amounts = (product?.variants || [])
    .map((variant) => {
      const price = (variant?.prices || []).find((entry) => entry?.currency_code === "vnd") || variant?.prices?.[0]
      return Number(price?.amount || 0)
    })
    .filter((value: number) => value > 0)
  return amounts.length ? Math.min(...amounts) : 0
}

function getPriceRange(price: number) {
  if (price < 100000) return "under-100"
  if (price <= 300000) return "100-300"
  if (price <= 500000) return "300-500"
  return "over-500"
}

function isVariantInStock(variant: NonNullable<ProductRecord["variants"]>[number]) {
  return !variant.manage_inventory || Boolean(variant.allow_backorder) || Number(variant.inventory_quantity || 0) > 0
}

export function buildProductDocument(product: ProductRecord) {
  const slug = product.handle || product.id
  const price = pickProductPrice(product)
  const variants = (product.variants || []).map((variant) => ({
    id: variant.id,
    title: variant.title || "Default",
    price: Number(variant.prices?.find((entry) => entry.currency_code === "vnd")?.amount || variant.prices?.[0]?.amount || 0),
    in_stock: isVariantInStock(variant),
  }))
  const categories = (product.categories || []).map((category) => ({
    id: category.id,
    name: category.name || "",
    handle: category.handle || category.id,
  }))
  const metadataIngredients = product.metadata?.ingredients
  const ingredients = Array.isArray(metadataIngredients)
    ? metadataIngredients.filter((value): value is string => typeof value === "string")
    : []
  const inStock = variants.length === 0 || variants.some((variant) => variant.in_stock)
  return {
    id: product.id,
    medusa_id: product.id,
    slug,
    name: product.title || "San pham",
    title: product.title || "San pham",
    description: product.description || "",
    thumbnail: product.thumbnail || product.images?.[0]?.url || "",
    images: (product.images || []).map((image) => image.url).filter(Boolean),
    variants,
    categories,
    ingredients,
    status: product.status || "draft",
    category_names: categories.map((category) => category.name).filter(Boolean),
    category_slugs: categories.map((category) => category.handle).filter(Boolean),
    categoryIds: categories.map((category) => category.id),
    price,
    price_min: price,
    price_range: getPriceRange(price),
    in_stock: inStock,
    inStock,
    origin: typeof product.metadata?.origin === "string" ? product.metadata.origin : "",
    sales_count: Number(product.metadata?.sales_count || 0),
    created_at: product.created_at ? new Date(product.created_at).toISOString() : new Date().toISOString(),
    updated_at: product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString(),
  }
}

type MeiliTask = { taskUid?: number; status?: string }
type MeiliStats = { numberOfDocuments?: number }

async function meiliRequest<T = unknown>(path: string, init?: RequestInit): Promise<T | null> {
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
  return response.json() as Promise<T>
}

async function waitForTask(taskUid?: number) {
  if (typeof taskUid !== "number") return

  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const task = await meiliRequest<MeiliTask>(`/tasks/${taskUid}`).catch(() => null)
    if (!task || ["succeeded", "failed", "canceled"].includes(task.status)) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

let ensureProductIndexPromise: Promise<boolean> | null = null

async function configureProductIndex() {
  if (!getHost()) return false
  await meiliRequest("/indexes", {
    method: "POST",
    body: JSON.stringify({ uid: getIndexUid(), primaryKey: "id" }),
  }).catch(() => null)

  const settingsTask = await meiliRequest<MeiliTask>(`/indexes/${getIndexUid()}/settings`, {
    method: "PUT",
    body: JSON.stringify({
      searchableAttributes: ["name", "description", "variants.title", "categories.name", "ingredients"],
      filterableAttributes: ["status", "categories.id", "price_range", "in_stock", "origin"],
      sortableAttributes: ["price", "created_at", "sales_count"],
      rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"],
    }),
  })
  await waitForTask(settingsTask?.taskUid)

  return true
}

export async function ensureProductIndex() {
  if (!ensureProductIndexPromise) {
    ensureProductIndexPromise = configureProductIndex().catch(() => {
      ensureProductIndexPromise = null
      return false
    })
  }
  return ensureProductIndexPromise
}

export async function replaceProductIndex(products: ProductRecord[]) {
  const ensured = await ensureProductIndex().catch(() => false)
  if (!ensured) return { enabled: false, indexed: 0 }

  const documents = products
    .map(buildProductDocument)
    .filter((doc) => doc.status === "published")

  const deleteTask = await meiliRequest<MeiliTask>(`/indexes/${getIndexUid()}/documents`, { method: "DELETE" }).catch(() => null)
  await waitForTask(deleteTask?.taskUid)

  if (documents.length) {
    const addTask = await meiliRequest<MeiliTask>(`/indexes/${getIndexUid()}/documents`, {
      method: "POST",
      body: JSON.stringify(documents),
    })
    await waitForTask(addTask?.taskUid)
  }
  return { enabled: true, indexed: documents.length }
}

export async function upsertProductDocument(product: ProductRecord) {
  const ensured = await ensureProductIndex().catch(() => false)
  if (!ensured) return { enabled: false }
  const doc = buildProductDocument(product)
  if (doc.status !== "published") {
    const task = await meiliRequest<MeiliTask>(`/indexes/${getIndexUid()}/documents/${doc.id}`, { method: "DELETE" }).catch(() => null)
    return { enabled: true, indexed: false, task_uid: task?.taskUid }
  }
  const task = await meiliRequest<MeiliTask>(`/indexes/${getIndexUid()}/documents`, {
    method: "POST",
    body: JSON.stringify([doc]),
  })
  return { enabled: true, indexed: true, task_uid: task?.taskUid }
}

export async function removeProductDocument(productId: string) {
  const ensured = await ensureProductIndex().catch(() => false)
  if (!ensured) return { enabled: false }
  const task = await meiliRequest<MeiliTask>(`/indexes/${getIndexUid()}/documents/${productId}`, { method: "DELETE" }).catch(() => null)
  return { enabled: true, task_uid: task?.taskUid }
}

export async function searchProducts(query: string, options: ProductSearchOptions = {}) {
  if (!getHost()) return null
  const { category, priceRange, sort = "created_at:desc", limit = 12, offset = 0 } = options
  const filters = [`status = "published"`]
  if (category) filters.push(`categories.id = "${escapeFilterValue(category)}"`)
  if (priceRange) filters.push(`price_range = "${escapeFilterValue(priceRange)}"`)
  return meiliRequest<{ hits: ReturnType<typeof buildProductDocument>[]; estimatedTotalHits?: number }>(`/indexes/${getIndexUid()}/search`, {
    method: "POST",
    body: JSON.stringify({
      q: query || "",
      limit,
      offset,
      filter: filters.join(" AND "),
      sort: [sort],
    }),
  }).catch(() => null)
}

export async function getSearchStatus() {
  if (!getHost()) return { configured: false, enabled: false, online: false, indexed_documents: 0 }
  const stats = await meiliRequest<MeiliStats>(`/indexes/${getIndexUid()}/stats`).catch(() => null)
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

export async function listProductsForSearch(scope: ServiceScope): Promise<ProductRecord[]> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const products: ProductRecord[] = []
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
        "metadata",
        "created_at",
        "updated_at",
        "categories.id",
        "categories.name",
        "categories.handle",
        "variants.id",
        "variants.title",
        "variants.manage_inventory",
        "variants.allow_backorder",
        "variants.inventory_quantity",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "images.url"
      ],
      pagination: { skip, take },
    })
    products.push(...((page || []) as ProductRecord[]))
    if (!page || page.length < take) break
    skip += take
  }

  return products
}

export async function findFallbackProducts(scope: ServiceScope, query: string, options: ProductSearchOptions = {}) {
  const normalized = normalize(query)
  const { category, priceRange, sort = "created_at:desc", limit = 12, offset = 0 } = options
  const products = await listProductsForSearch(scope)
  const documents = products
    .map(buildProductDocument)
    .filter((doc) => doc.status === "published")
    .filter((doc) => {
      if (category && !doc.categories.some((item) => item.id === category)) return false
      if (priceRange && doc.price_range !== priceRange) return false
      if (!normalized) return true
      const haystack = normalize([doc.title, doc.description, doc.slug, ...doc.category_names].join(" "))
      return haystack.includes(normalized)
    })
  if (sort === "price:asc") documents.sort((a, b) => a.price - b.price)
  if (sort === "price:desc") documents.sort((a, b) => b.price - a.price)
  if (sort === "sales_count:desc") documents.sort((a, b) => b.sales_count - a.sales_count)
  if (sort === "created_at:desc") documents.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return documents.slice(offset, offset + limit)
}

export function isSearchEnabled() {
  return Boolean(getHost())
}
