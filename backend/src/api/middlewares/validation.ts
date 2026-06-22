import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import type { MiddlewareRoute } from "@medusajs/framework/http"
import { z } from "zod"

const optionalText = z.string().trim().nullable().optional()

export const BannerBodySchema = z.object({
  title: z.string().trim().max(200).default(""),
  subtitle: optionalText,
  image: optionalText,
  link: optionalText,
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})
export type BannerBody = z.infer<typeof BannerBodySchema>

export const BlogCategoryBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalText,
})
export type BlogCategoryBody = z.infer<typeof BlogCategoryBodySchema>

export const BlogPostBodySchema = z.object({
  title: z.string().trim().min(1).max(240),
  slug: z.string().trim().min(1).max(260).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: optionalText,
  content: optionalText,
  image: optionalText,
  author: optionalText,
  category_id: z.string().trim().min(1).nullable().optional(),
  published: z.boolean().optional(),
  published_at: z.union([z.string().datetime(), z.date(), z.null()]).optional(),
})
export type BlogPostBody = z.infer<typeof BlogPostBodySchema>

export const ChatbotFaqBodySchema = z.object({
  enabled: z.boolean().optional(),
  faqs: z.array(z.object({
    id: z.string().optional(),
    question: z.string().trim().min(1).max(500),
    answer: z.string().trim().min(1).max(5000),
    keywords: z.array(z.string().trim().min(1).max(100)).default([]),
  })).max(200).default([]),
})
export type ChatbotFaqBody = z.infer<typeof ChatbotFaqBodySchema>

export const CheckoutBodySchema = z.object({
  items: z.array(z.object({
    variant_id: z.string().min(1, "Thiếu variant_id"),
    quantity: z.number().int().min(1, "Số lượng phải lớn hơn 0").default(1),
    product_id: z.string().optional(),
    title: z.string().optional(),
    variantLabel: z.string().optional(),
    image: z.string().optional(),
    frontend_item_id: z.string().optional(),
    id: z.string().optional(),
  })).min(1, "Giỏ hàng trống"),
  shipping: z.object({
    name: z.string().trim().min(1, "Thiếu tên người nhận"),
    phone: z.string().trim().min(9).max(13).regex(/^(\+84|84|0)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])[0-9]{7}$|^(\+84|84|0)[0-9]{9,10}$/),
    address: z.string().trim().min(5),
    city: z.string().optional(),
    district: z.string().optional(),
    email: z.string().email().optional(),
    note: z.string().max(2000).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }),
  idempotency_key: z.string().trim().min(8).max(200).optional(),
  promotion_code: z.string().trim().max(100).optional(),
})
export type CheckoutBody = z.infer<typeof CheckoutBodySchema>

export const InventoryLevelBodySchema = z.object({
  inventory_item_id: z.string().min(1),
  location_id: z.string().min(1),
  stocked_quantity: z.number().min(0),
})
export type InventoryLevelBody = z.infer<typeof InventoryLevelBodySchema>

export const MediaUploadBodySchema = z.object({
  filename: z.string().trim().min(1).max(255),
  data: z.string().min(1).max(14_000_000, "Image payload is too large"),
})
export type MediaUploadBody = z.infer<typeof MediaUploadBodySchema>

export const PermissionBodySchema = z.object({
  name: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+\.[a-z0-9-]+$/),
  description: optionalText,
})
export type PermissionBody = z.infer<typeof PermissionBodySchema>

export const PromotionMetadataBodySchema = z.object({
  metadata: z.record(z.string(), z.unknown()).default({}),
})
export type PromotionMetadataBody = z.infer<typeof PromotionMetadataBodySchema>

export const PromotionValidationBodySchema = z.object({
  code: z.string().trim().min(1).max(100),
  subtotal: z.number().min(0),
})
export type PromotionValidationBody = z.infer<typeof PromotionValidationBodySchema>

export const RoleBodySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: optionalText,
  permissions: z.array(z.string().min(1)).optional(),
}).refine((body) => Object.keys(body).length > 0, "At least one field is required")
export type RoleBody = z.infer<typeof RoleBodySchema>

export const RolePermissionsBodySchema = z.object({ permission_ids: z.array(z.string().min(1)) })
export type RolePermissionsBody = z.infer<typeof RolePermissionsBodySchema>

export const SettingsBodySchema = z.record(z.string(), z.unknown())
export type SettingsBody = z.infer<typeof SettingsBodySchema>

export const CustomSettingsBodySchema = z.object({ settings: SettingsBodySchema })
export type CustomSettingsBody = z.infer<typeof CustomSettingsBodySchema>

export const ShippingQuoteBodySchema = z.object({
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(120).optional(),
  district: z.string().trim().max(120).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
})
export type ShippingQuoteBody = z.infer<typeof ShippingQuoteBodySchema>

export const UpdateOrderStatusBodySchema = z.object({
  status: z.string().trim().min(1).optional(),
  payment_status: z.string().trim().min(1).optional(),
  fulfillment_status: z.string().trim().min(1).optional(),
}).refine((body) => Object.values(body).some(Boolean), "At least one status is required")
export type UpdateOrderStatusBody = z.infer<typeof UpdateOrderStatusBodySchema>

export const UserBodySchema = z.object({
  email: z.string().email().optional(),
  first_name: optionalText,
  last_name: optionalText,
  avatar_url: z.string().url().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine((body) => Object.keys(body).length > 0, "At least one field is required")
export type UserBody = z.infer<typeof UserBodySchema>

export const CreateUserBodySchema = z.object({
  email: z.string().email(),
  first_name: optionalText,
  last_name: optionalText,
})
export type CreateUserBody = z.infer<typeof CreateUserBodySchema>

export const UserRolesBodySchema = z.union([
  z.object({ roles: z.array(z.string().min(1)) }),
  z.object({ role_ids: z.array(z.string().min(1)) }),
])
export type UserRolesBody = z.infer<typeof UserRolesBodySchema>

const numberQuery = (fallback: number) => z.preprocess(
  (value) => value === undefined ? fallback : Number(value),
  z.number().finite()
)

export const NameFilterQuerySchema = z.object({ name: z.string().trim().max(120).optional() })
export type NameFilterQuery = z.infer<typeof NameFilterQuerySchema>

export const UserListQuerySchema = z.object({
  email: z.string().email().optional(),
  q: z.string().trim().max(200).optional(),
})
export type UserListQuery = z.infer<typeof UserListQuerySchema>

export const MediaListQuerySchema = z.object({ q: z.string().trim().max(200).optional() })
export type MediaListQuery = z.infer<typeof MediaListQuerySchema>

export const AdminCustomQuerySchema = z.object({
  mode: z.enum(["dashboard", "settings"]).default("dashboard"),
})
export type AdminCustomQuery = z.infer<typeof AdminCustomQuerySchema>

export const StoreCustomQuerySchema = z.object({
  mode: z.enum(["homepage", "site"]).default("homepage"),
})
export type StoreCustomQuery = z.infer<typeof StoreCustomQuerySchema>

export const ReverseGeocodeQuerySchema = z.object({
  lat: numberQuery(0).pipe(z.number().min(-90).max(90)),
  lng: numberQuery(0).pipe(z.number().min(-180).max(180)),
})
export type ReverseGeocodeQuery = z.infer<typeof ReverseGeocodeQuerySchema>

export const GeocodeSuggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(300),
  limit: numberQuery(6).pipe(z.number().int().min(1).max(8)),
})
export type GeocodeSuggestQuery = z.infer<typeof GeocodeSuggestQuerySchema>

export const SearchQuerySchema = z.object({
  q: z.string().trim().max(300).default(""),
  category: z.string().trim().max(120).optional(),
  limit: numberQuery(12).pipe(z.number().int().min(1).max(24)),
  offset: numberQuery(0).pipe(z.number().int().min(0).max(10_000)),
  price_range: z.enum(["under-100", "100-300", "300-500", "over-500"]).optional(),
  sort: z.enum(["price:asc", "price:desc", "created_at:desc", "sales_count:desc"]).default("created_at:desc"),
})
export type SearchQuery = z.infer<typeof SearchQuerySchema>

const bodyRoute = (matcher: string, schema: z.ZodType): MiddlewareRoute => ({
  matcher,
  method: "POST",
  middlewares: [validateAndTransformBody(schema)],
})

const queryRoute = (matcher: string, schema: z.ZodType, method: "GET" | "POST" = "GET"): MiddlewareRoute => ({
  matcher,
  method,
  middlewares: [validateAndTransformQuery(schema, {})],
})

export const customValidationMiddlewares: MiddlewareRoute[] = [
  queryRoute("/store/custom", StoreCustomQuerySchema),
  queryRoute("/store/geocode/reverse", ReverseGeocodeQuerySchema),
  queryRoute("/store/geocode/suggest", GeocodeSuggestQuerySchema),
  queryRoute("/store/search", SearchQuerySchema),
  queryRoute("/admin/custom", AdminCustomQuerySchema),
  queryRoute("/admin/custom", AdminCustomQuerySchema, "POST"),
  queryRoute("/admin/media", MediaListQuerySchema),
  queryRoute("/admin/permissions", NameFilterQuerySchema),
  queryRoute("/admin/roles", NameFilterQuerySchema),
  queryRoute("/admin/users", UserListQuerySchema),
  bodyRoute("/store/checkout", CheckoutBodySchema),
  bodyRoute("/store/promotions/validate", PromotionValidationBodySchema),
  bodyRoute("/store/shipping/quote", ShippingQuoteBodySchema),
  bodyRoute("/admin/banners", BannerBodySchema),
  bodyRoute("/admin/banners/:id", BannerBodySchema),
  bodyRoute("/admin/blog-categories", BlogCategoryBodySchema),
  bodyRoute("/admin/blog-categories/:id", BlogCategoryBodySchema),
  bodyRoute("/admin/blog-posts", BlogPostBodySchema),
  bodyRoute("/admin/blog-posts/:id", BlogPostBodySchema),
  bodyRoute("/admin/chatbot/faqs", ChatbotFaqBodySchema),
  bodyRoute("/admin/custom", CustomSettingsBodySchema),
  bodyRoute("/admin/custom/inventory", InventoryLevelBodySchema),
  bodyRoute("/admin/custom/orders/:id/status", UpdateOrderStatusBodySchema),
  bodyRoute("/admin/media/upload", MediaUploadBodySchema),
  bodyRoute("/admin/permissions", PermissionBodySchema),
  bodyRoute("/admin/permissions/:id", PermissionBodySchema),
  bodyRoute("/admin/promotions/:id/metadata", PromotionMetadataBodySchema),
  bodyRoute("/admin/roles", RoleBodySchema),
  bodyRoute("/admin/roles/:id", RoleBodySchema),
  bodyRoute("/admin/roles/:id/permissions", RolePermissionsBodySchema),
  bodyRoute("/admin/settings", SettingsBodySchema),
  bodyRoute("/admin/users", CreateUserBodySchema),
  bodyRoute("/admin/users/:id", UserBodySchema),
  bodyRoute("/admin/users/:id/roles", UserRolesBodySchema),
]
