import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"

type ApiError = {
  code: string
  message: string
  details: unknown | null
}

type ApiEnvelope = {
  data: unknown | null
  error: ApiError | null
  meta: Record<string, unknown> | null
}

function isEnvelope(payload: unknown): payload is ApiEnvelope {
  if (!payload || typeof payload !== "object") return false
  const value = payload as Record<string, unknown>
  return "data" in value && "error" in value && "meta" in value
}

function getMeta(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null
  const value = payload as Record<string, unknown>
  const meta = ["count", "offset", "limit"].reduce<Record<string, unknown>>((result, key) => {
    if (value[key] !== undefined) result[key] = value[key]
    return result
  }, {})

  return Object.keys(meta).length ? meta : null
}

function normalizeData(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload ?? null
  const value = payload as Record<string, unknown>
  if (Array.isArray(value.items)) return value

  const listEntry = Object.entries(value).find(([, entry]) => Array.isArray(entry))
  if (!listEntry) return value
  const items = listEntry[1] as unknown[]

  return {
    ...value,
    items,
    count: typeof value.count === "number" ? value.count : items.length,
    offset: typeof value.offset === "number" ? value.offset : 0,
    limit: typeof value.limit === "number" ? value.limit : items.length,
  }
}

function getError(payload: unknown, statusCode: number): ApiError {
  const value = payload && typeof payload === "object"
    ? payload as Record<string, unknown>
    : {}
  const nested = value.error && typeof value.error === "object"
    ? value.error as Record<string, unknown>
    : {}
  const rawMessage = nested.message ?? value.message ?? value.error

  return {
    code: String(nested.code ?? value.code ?? value.type ?? `HTTP_${statusCode}`),
    message: typeof rawMessage === "string" ? rawMessage : "Request failed",
    details: nested.details ?? value.details ?? null,
  }
}

export function apiEnvelopeMiddleware(
  _req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const sendJson = res.json.bind(res)

  res.json = ((payload: unknown) => {
    if (isEnvelope(payload)) return sendJson(payload)

    if (res.statusCode >= 400) {
      return sendJson({ data: null, error: getError(payload, res.statusCode), meta: null })
    }

    const data = normalizeData(payload)
    return sendJson({ data, error: null, meta: getMeta(data) })
  }) as MedusaResponse["json"]

  next()
}

const customApiMatchers = [
  "/media/*",
  "/store/blog*",
  "/store/blog-categories*",
  "/store/catalog*",
  "/store/chatbot*",
  "/store/checkout*",
  "/store/contact*",
  "/store/custom*",
  "/store/geocode*",
  "/store/ingredients*",
  "/store/promotions/validate*",
  "/store/reviews*",
  "/store/search*",
  "/store/session-cart*",
  "/store/shipping/quote*",
  "/admin/banners*",
  "/admin/blog-categories*",
  "/admin/blog-posts*",
  "/admin/chatbot*",
  "/admin/custom*",
  "/admin/media*",
  "/admin/permissions*",
  "/admin/promotions/:id/metadata*",
  "/admin/reviews*",
  "/admin/roles*",
  "/admin/search*",
  "/admin/settings*",
  "/admin/users*",
]

export const apiEnvelopeMiddlewares: MiddlewareRoute[] = customApiMatchers.map((matcher) => ({
  matcher,
  middlewares: [apiEnvelopeMiddleware],
}))
