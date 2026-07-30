import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { SHIPPING_MODULE } from "../../modules/shipping"
import ShippingModuleService from "../../modules/shipping/service"
import { resolveSiteService } from "../../lib/module-services"
import { getGlobalSettings } from "../../lib/global-settings"

export type ResolveShippingInput = {
  shipping: {
    address: string
    city: string
    district: string
    lat?: number
    lng?: number
  }
}

export const resolveShippingStepId = "resolve-shipping-step"

export const resolveShippingStep = createStep(
  resolveShippingStepId,
  async (input: ResolveShippingInput, { container }) => {
    const shippingService: ShippingModuleService = container.resolve(SHIPPING_MODULE)
    const siteService = resolveSiteService(container)
    const settings = await getGlobalSettings(siteService)

    const quote = await shippingService.resolveShippingQuote(input.shipping, settings)

    return new StepResponse({ quote })
  }
)
