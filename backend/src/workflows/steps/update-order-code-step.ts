import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

function generateOrderCode(order: { id?: string; created_at?: string | Date }) {
  const date = order.created_at ? new Date(order.created_at) : new Date()
  const datePart = Number.isNaN(date.getTime())
    ? "LOCAL"
    : date.toISOString().slice(0, 10).replace(/-/g, "")
  const suffix = String(order.id || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0")

  return `MONG-${datePart}-${suffix}`
}

export const updateOrderCodeStep = createStep(
  "update-order-code-step",
  async (order: any, { container }) => {
    const orderModuleService = container.resolve(Modules.ORDER)
    const orderCode = generateOrderCode(order)

    const updated = await orderModuleService.updateOrders([{
      id: order.id,
      metadata: {
        ...(order.metadata || {}),
        order_code: orderCode,
      },
    }])
    
    const responseOrder = Array.isArray(updated) ? updated[0] : updated
    return new StepResponse(responseOrder, {
      id: order.id,
      previousMetadata: order.metadata
    })
  },
  async (compensationData: any, { container }) => {
    if (!compensationData) return
    const orderModuleService = container.resolve(Modules.ORDER)
    await orderModuleService.updateOrders([{
      id: compensationData.id,
      metadata: compensationData.previousMetadata
    }])
  }
)
