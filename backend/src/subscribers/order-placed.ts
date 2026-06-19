import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  logger.info(`[Queue] Tiến trình nền: Chuẩn bị gửi email xác nhận cho đơn hàng ${data.id}`)
  
  // TODO: Implement integration with email provider (e.g. Resend, Sendgrid)
  // const emailService = container.resolve("emailService")
  // await emailService.sendOrderConfirmation(data.id)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
