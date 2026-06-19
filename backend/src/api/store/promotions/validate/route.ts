import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getPromotionMetadata } from "../../../../lib/promotion-metadata"
import type { PromotionValidationBody } from "../../../middlewares/validation"
import { resolveSiteService } from "../../../../lib/module-services"

type PromotionRecord = {
  id: string
  code?: string | null
  application_method?: { type?: string | null; value?: number | string | null } | null
  campaign?: {
    starts_at?: string | Date | null
    ends_at?: string | Date | null
    budget?: { limit?: number | string | null } | null
  } | null
}

export async function POST(req: MedusaRequest<PromotionValidationBody>, res: MedusaResponse) {
  const { code, subtotal } = req.validatedBody
  const promotionModuleService = req.scope.resolve(Modules.PROMOTION)

  let promotions
  try {
    promotions = await promotionModuleService.listPromotions({
      code: code.toUpperCase()
    }, {
      relations: ["application_method", "campaign", "campaign.budget"],
      take: 1
    })
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống khi tra cứu mã giảm giá" })
  }

  if (!promotions || promotions.length === 0) {
    return res.status(404).json({ message: "Mã giảm giá không tồn tại hoặc đã hết hạn" })
  }

  const promotion = promotions[0] as PromotionRecord
  const siteService = resolveSiteService(req.scope)
  const promotionMetadata = await getPromotionMetadata(siteService, promotion.id)
  const startsAt = promotionMetadata.starts_at || promotion.campaign?.starts_at
  const endsAt = promotionMetadata.ends_at || promotion.campaign?.ends_at
  const usageLimit = Number(promotionMetadata.usage_limit || promotion.campaign?.budget?.limit || 0)
  const now = new Date()
  let remainingUsages: number | undefined

  // Validate limits and dates from custom metadata first, then legacy campaign fields.
  if (startsAt && new Date(startsAt) > now) {
    return res.status(400).json({ message: "Mã giảm giá chưa tới thời gian áp dụng" })
  }
  if (endsAt && new Date(endsAt) < now) {
    return res.status(400).json({ message: "Mã giảm giá đã hết hạn sử dụng" })
  }

  if (usageLimit > 0) {
    let usedCount = 0
    try {
      const query = req.scope.resolve("query")
      const { data } = await query.graph({
        entity: "order",
        fields: ["id", "metadata"],
      })
      usedCount = (data as Array<{ metadata?: Record<string, unknown> | null }>)
        .filter((order) => order.metadata?.promotion_code === promotion.code)
        .length
      if (usedCount >= usageLimit) {
        return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" })
      }
    } catch (e) {
      console.error("Failed to query order usage limit:", e)
    }

    remainingUsages = Math.max(0, usageLimit - usedCount)
  }

  // 3. Validate Minimum Order Value
  const minOrderValue = Number(promotionMetadata.min_order_value || 0)
  if (minOrderValue > 0 && subtotal < minOrderValue) {
    return res.status(400).json({
      message: `Mã giảm giá yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(minOrderValue)}đ`
    })
  }

  const appMethod = promotion.application_method
  if (!appMethod) {
    return res.status(400).json({ message: "Mã giảm giá bị lỗi cấu hình" })
  }

  let discountAmount = 0
  const maxDiscount = Number(promotionMetadata.max_discount || 0)

  if (appMethod.type === "fixed") {
    discountAmount = Number(appMethod.value)
    if (discountAmount > subtotal) {
      discountAmount = subtotal
    }
  } else if (appMethod.type === "percentage") {
    discountAmount = Math.round(subtotal * (Number(appMethod.value) / 100))
    if (maxDiscount > 0 && discountAmount > maxDiscount) {
      discountAmount = maxDiscount
    }
  }

  res.json({
    valid: true,
    code: promotion.code,
    type: appMethod.type,
    discount_amount: discountAmount,
    remaining_usages: remainingUsages
  })
}
