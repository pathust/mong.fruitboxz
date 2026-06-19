import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { UpdateOrderStatusBody } from "../../../../../middlewares/validation"
import { sendInternalError } from "../../../../../../lib/api-error"

export async function POST(req: MedusaRequest<UpdateOrderStatusBody>, res: MedusaResponse) {
  const { id } = req.params
  const { status, payment_status, fulfillment_status } = req.validatedBody

  const orderModuleService = req.scope.resolve(Modules.ORDER)

  try {
    const [order] = await orderModuleService.listOrders({ id }, { take: 1 })
    if (!order) return res.status(404).json({ message: "Order not found" })

    const updatePayload: {
      id: string
      status?: string
      metadata?: Record<string, unknown>
    } = { id }
    if (status) updatePayload.status = status

    // In Medusa V2, we might not be able to update protected fields directly,
    // so we store our custom fulfillment/payment statuses in metadata for simple tracking
    if (payment_status || fulfillment_status) {
      updatePayload.metadata = {
        ...(order.metadata || {}),
      }
      if (payment_status) updatePayload.metadata.payment_status = payment_status
      if (fulfillment_status) updatePayload.metadata.fulfillment_status = fulfillment_status
    }

    const updated = await orderModuleService.updateOrders([updatePayload])

    res.json({ order: Array.isArray(updated) ? updated[0] : updated })
  } catch (error: unknown) {
    sendInternalError(req, res, error, "Unable to update order status", "ORDER_STATUS_UPDATE_FAILED")
  }
}
