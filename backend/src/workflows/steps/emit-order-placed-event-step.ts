import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export const emitOrderPlacedEventStep = createStep(
  "emit-order-placed-event-step",
  async (orderId: string, { container }) => {
    const eventBus = container.resolve(Modules.EVENT_BUS)
    await eventBus.emit({
      name: "order.placed",
      data: { id: orderId }
    })
    return new StepResponse(true, null)
  },
  async (compensationData: any, { container }) => {
    // Events cannot be easily undone, so we do nothing.
    return
  }
)
