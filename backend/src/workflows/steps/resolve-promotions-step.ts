import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { resolveSiteService } from "../../lib/module-services"
import { processCheckoutPromotions } from "../../lib/checkout"

export type ResolvePromotionsInput = {
  promotion_code?: string
  normalizedItems: Array<{ quantity: number; unit_price: number }>
  originalSubtotal: number
}

export const resolvePromotionsStepId = "resolve-promotions-step"

export const resolvePromotionsStep = createStep(
  resolvePromotionsStepId,
  async (input: ResolvePromotionsInput, { container }) => {
    const siteService = resolveSiteService(container)

    const promotionResult = await processCheckoutPromotions({
      scope: container,
      siteService,
      promotion_code: input.promotion_code,
      normalizedItems: input.normalizedItems,
      originalSubtotal: input.originalSubtotal
    })

    return new StepResponse({
      discountAmount: promotionResult.discountAmount,
      appliedPromotionCode: promotionResult.appliedPromotionCode
    })
  }
)
