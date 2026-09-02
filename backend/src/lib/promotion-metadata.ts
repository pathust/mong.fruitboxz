import type SiteModuleService from "../modules/site/service"
import type { ServiceScope } from "./module-services"

export type PromotionMetadata = {
  min_order_value?: number | null
  max_discount?: number | null
  usage_limit?: number | null
  starts_at?: string | null
  ends_at?: string | null
  [key: string]: unknown
}

const promotionMetadataKey = (promotionId: string) => `promotion:${promotionId}:metadata`

export async function getPromotionMetadata(
  siteService: SiteModuleService,
  promotionId: string
): Promise<PromotionMetadata> {
  const [rows] = await siteService.listAndCountSiteSettings({
    key: promotionMetadataKey(promotionId),
  })
  return (rows?.[0]?.value as PromotionMetadata | undefined) || {}
}

export async function updatePromotionMetadata(
  siteService: SiteModuleService,
  promotionId: string,
  metadata: PromotionMetadata
): Promise<PromotionMetadata> {
  const key = promotionMetadataKey(promotionId)
  const [rows] = await siteService.listAndCountSiteSettings({ key })

  if (rows?.[0]) {
    await siteService.updateSiteSettings({ id: rows[0].id, value: metadata })
  } else {
    await siteService.createSiteSettings({ key, value: metadata })
  }

  return metadata
}

// Counts how many orders used a given promotion code. Medusa's core Order
// model has no built-in promotion-usage relation for our custom checkout
// flow, so usage is tracked ad hoc via order.metadata.promotion_code — this
// pulls every order's id+metadata and filters in JS rather than a
// server-side JSON filter, since no other route in this codebase filters
// query.graph by a metadata sub-field and this hasn't been verified to
// work reliably; cost grows with total order count, acceptable at this
// store's scale but worth revisiting with a real usage counter if order
// volume grows significantly.
export async function countPromotionUsage(scope: ServiceScope, promotionCode: string): Promise<number> {
  const query = scope.resolve<{ graph(input: unknown): Promise<{ data: unknown[] }> }>("query")
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "metadata"],
  })
  return (data as Array<{ metadata?: Record<string, unknown> | null }>)
    .filter((order) => order.metadata?.promotion_code === promotionCode)
    .length
}
