import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { status, payment_status, fulfillment_status } = req.body as any

  if (!status && !payment_status && !fulfillment_status) {
    return res.status(400).json({ message: "At least one status is required" })
  }

  const orderModuleService = req.scope.resolve(Modules.ORDER)

  try {
    const [order] = await orderModuleService.listOrders({ id }, { take: 1 })
    if (!order) return res.status(404).json({ message: "Order not found" })

    const updatePayload: any = { id }
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

    const updated = await (orderModuleService as any).updateOrders([updatePayload])

    res.json({ order: Array.isArray(updated) ? updated[0] : updated })
  } catch (err: any) {
    res.status(500).json({ message: err.message })
  }
}
