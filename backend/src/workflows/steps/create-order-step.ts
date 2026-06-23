import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { CreateOrderDTO } from "@medusajs/framework/types"

export type CreateOrderInput = CreateOrderDTO

export const createOrderStep = createStep(
  "create-order-step",
  async (input: CreateOrderInput, { container }) => {
    const orderModuleService = container.resolve(Modules.ORDER)
    const order = await orderModuleService.createOrders(input)
    return new StepResponse(order, order.id)
  },
  async (id: string, { container }) => {
    const orderModuleService = container.resolve(Modules.ORDER)
    await orderModuleService.deleteOrders([id])
  }
)
