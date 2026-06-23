import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  createOrderStep,
  CreateOrderInput,
} from "./steps/create-order-step"
import { updateOrderCodeStep } from "./steps/update-order-code-step"
import { emitOrderPlacedEventStep } from "./steps/emit-order-placed-event-step"

export const checkoutOrderWorkflow = createWorkflow(
  "checkout-order",
  function (input: CreateOrderInput) {
    const order = createOrderStep(input)
    const updatedOrder = updateOrderCodeStep(order)
    emitOrderPlacedEventStep(order.id)
    return new WorkflowResponse(updatedOrder)
  }
)
