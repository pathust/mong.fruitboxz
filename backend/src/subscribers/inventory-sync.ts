import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function inventorySyncHandler({
  event: { data, name },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  if (name === "order.placed") {
    logger.info(`[Queue] Tiến trình nền: Bắt đầu đồng bộ tồn kho do có đơn hàng mới ${data.id}`)
    // TODO: Deduct inventory via InventoryModule
  } else {
    logger.info(`[Queue] Tiến trình nền: Cập nhật tồn kho sản phẩm ${data.id}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "product.updated"],
}
