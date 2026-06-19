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
import type SiteModuleService from "../modules/site/service"
