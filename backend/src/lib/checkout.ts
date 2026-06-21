import { Modules } from "@medusajs/framework/utils"
import type { ServiceScope } from "../lib/module-services"
import { getPromotionMetadata } from "../lib/promotion-metadata"

export async function processCheckoutPromotions({
  scope,
  siteService,
  promotion_code,
  normalizedItems,
  originalSubtotal
}: {
  scope: ServiceScope
  siteService: any
  promotion_code?: string
  normalizedItems: any[]
  originalSubtotal: number
}) {
  let discountAmount = 0
  let appliedPromotionCode = null

  if (promotion_code) {
    const promotionModuleService = scope.resolve(Modules.PROMOTION)
    const promotions = await promotionModuleService.listPromotions({
      code: promotion_code.toUpperCase()
    }, { relations: ["application_method", "campaign", "campaign.budget"], take: 1 })

    if (promotions && promotions.length > 0) {
      const promo = promotions[0] as any
      const promotionMetadata = await getPromotionMetadata(siteService, promo.id)
      const startsAt = promotionMetadata.starts_at || promo.campaign?.starts_at
      const endsAt = promotionMetadata.ends_at || promo.campaign?.ends_at
      const usageLimit = Number(promotionMetadata.usage_limit || promo.campaign?.budget?.limit || 0)

      let isValid = true
      const now = new Date()
      if (startsAt && new Date(startsAt) > now) {
        isValid = false
      }
      if (endsAt && new Date(endsAt) < now) {
        isValid = false
      }
      if (usageLimit > 0) {
        const query = scope.resolve("query")
        const { data } = await query.graph({
          entity: "order",
          fields: ["id", "metadata"],
        })
        const usedCount = (data as Array<{ metadata?: Record<string, unknown> | null }>)
          .filter((order) => order.metadata?.promotion_code === promo.code)
          .length
        if (usedCount >= usageLimit) {
          isValid = false
        }
      }

      const minOrderValue = Number(promotionMetadata.min_order_value || 0)
      if (minOrderValue > 0 && originalSubtotal < minOrderValue) {
        throw new Error(`Mã giảm giá yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(minOrderValue)}đ`)
      }

      if (!isValid) {
        throw new Error("Mã giảm giá đã hết hạn hoặc hết lượt sử dụng")
      }

      const appMethod = promo.application_method
      if (appMethod) {
        const maxDiscount = Number(promotionMetadata.max_discount || 0)
        if (appMethod.type === "fixed") {
          discountAmount = Math.min(Number(appMethod.value), originalSubtotal)
        } else if (appMethod.type === "percentage") {
          discountAmount = Math.round(originalSubtotal * (Number(appMethod.value) / 100))
          if (maxDiscount > 0 && discountAmount > maxDiscount) {
            discountAmount = maxDiscount
          }
        }
        appliedPromotionCode = promo.code
      }
    }
  }

  // Proportional discount allocation
  if (discountAmount > 0 && originalSubtotal > 0) {
    const discountRatio = discountAmount / originalSubtotal
    let totalDiscountAllocated = 0

    for (let i = 0; i < normalizedItems.length; i++) {
      const item = normalizedItems[i]
      if (i === normalizedItems.length - 1) {
        const remainingDiscount = discountAmount - totalDiscountAllocated
        const discountPerUnit = Math.round(remainingDiscount / item.quantity)
        item.unit_price = Math.max(0, item.unit_price - discountPerUnit)
      } else {
        const itemTotalDiscount = Math.round((item.unit_price * item.quantity) * discountRatio)
        const discountPerUnit = Math.round(itemTotalDiscount / item.quantity)
        item.unit_price = Math.max(0, item.unit_price - discountPerUnit)
        totalDiscountAllocated += (discountPerUnit * item.quantity)
      }
    }
  }

  return {
    discountAmount,
    appliedPromotionCode,
    items: normalizedItems
  }
}
