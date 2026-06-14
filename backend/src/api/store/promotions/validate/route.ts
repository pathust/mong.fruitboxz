import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import { getPromotionMetadata } from "../../../../lib/promotion-metadata"

const ValidateSchema = z.object({
  code: z.string().min(1, "Mã giảm giá không hợp lệ"),
  subtotal: z.number().min(0, "Subtotal phải lớn hơn hoặc bằng 0"),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = ValidateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: parsed.error.format()
    })
  }

  const { code, subtotal } = parsed.data
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

  const promotion = promotions[0] as any
  const siteService = req.scope.resolve("site")
  const promotionMetadata = await getPromotionMetadata(siteService, promotion.id)

  // Validate limits and dates from campaign
  if (promotion.campaign) {
    const now = new Date()

    // 1. Validate Expiry Dates
    if (promotion.campaign.starts_at && new Date(promotion.campaign.starts_at) > now) {
      return res.status(400).json({ message: "Mã giảm giá chưa tới thời gian áp dụng" })
    }
    if (promotion.campaign.ends_at && new Date(promotion.campaign.ends_at) < now) {
      return res.status(400).json({ message: "Mã giảm giá đã hết hạn sử dụng" })
    }

    // 2. Validate Usage Limit
    if (promotion.campaign.budget?.type === "usage" && promotion.campaign.budget.limit > 0) {
      const limit = promotion.campaign.budget.limit
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
        if (usedCount >= limit) {
          return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" })
        }
      } catch (e) {
        console.error("Failed to query order usage limit:", e)
        // Fallback or ignore if query graph fails
      }

      (promotion as any).remaining_usages = Math.max(0, limit - usedCount)
    }
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
    remaining_usages: (promotion as any).remaining_usages
  })
}
