import { AuthenticatedMedusaRequest, MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { getGlobalSettings } from "../../../lib/global-settings"
import type { CheckoutBody } from "../../middlewares/validation"
import { resolveSiteService } from "../../../lib/module-services"
import { sendInternalError } from "../../../lib/api-error"
import { checkoutOrderWorkflow } from "../../../workflows/checkout-order"

export async function POST(req: MedusaStoreRequest<CheckoutBody>, res: MedusaResponse) {
  const { items, shipping, idempotency_key, promotion_code } = req.validatedBody

  const orderModuleService = req.scope.resolve(Modules.ORDER)
  const storeModuleService = req.scope.resolve(Modules.STORE)
  const regionModuleService = req.scope.resolve(Modules.REGION)
  const siteService = resolveSiteService(req.scope)
  const settings = await getGlobalSettings(siteService)

  const names = shipping.name.trim().split(/\s+/)
  const first_name = names[0] || ""
  const customerEmail = shipping.email?.toLowerCase().trim() || first_name.toLowerCase() + "@example.com"
  const customerId = req.auth_context?.actor_id

  // Idempotency Check with Security (IDOR fix)
  if (idempotency_key) {
    const filters: any = {
      "metadata.idempotency_key": idempotency_key
    }
    
    // SECURITY FIX: Restrict lookup to the current user or guest email to prevent guessing idempotency_key
    if (customerId) {
      filters.customer_id = customerId
    } else {
      filters.email = customerEmail
    }

    const existingOrders = await orderModuleService.listOrders(filters, { take: 1 })

    if (existingOrders && existingOrders.length > 0) {
      // Return existing order to avoid duplicate processing
      return res.json({
        order: existingOrders[0],
        message: "Order already processed (idempotent request)",
        summary: null // Real summary could be reconstructed if needed
      })
    }
  }

  const [store] = await storeModuleService.listStores()
  const regions = await regionModuleService.listRegions({ currency_code: "vnd" }, { take: 1 })
  const region = regions[0]

  try {
    const { result } = await checkoutOrderWorkflow(req.scope).run({
      input: {
        items,
        shipping,
        idempotency_key,
        promotion_code,
        region_id: region?.id,
        sales_channel_id: store?.default_sales_channel_id,
        customer_id: customerId,
        default_cost_percent: Number(settings.default_cost_percent ?? 50)
      }
    });

    return res.json(result)
  } catch (error: any) {
    const logger = req.scope.resolve<{ error(message: string, error?: unknown): void }>("logger")
    logger.error("Failed to checkout order", error)
    
    // Pass through explicit step errors
    if (error.message && (error.message.includes("vượt quá số lượng") || error.message.includes("Không tìm thấy sản phẩm") || error.message.includes("chưa được cấu hình giá") || error.message.includes("mã giảm giá"))) {
      return res.status(400).json({ message: error.message })
    }
    
    return sendInternalError(req, res, error, "Không thể tạo đơn hàng", "ORDER_CREATE_FAILED")
  }
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const filters = { customer_id: req.auth_context.actor_id }

  const orders = await orderModuleService.listOrders(filters, {
    relations: ["items", "shipping_address"],
    order: { created_at: "DESC" },
    take: 50,
  })

  res.json({ orders })
}
