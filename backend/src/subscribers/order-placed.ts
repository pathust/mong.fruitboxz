import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  
  logger.info(`[Queue] Tiến trình nền: Chuẩn bị gửi email xác nhận cho đơn hàng ${data.id}`)
  
  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "email", "total", "items.*", "shipping_address.*"],
      filters: { id: data.id }
    })
    
    if (!orders || orders.length === 0) {
      logger.warn(`Không tìm thấy đơn hàng ${data.id} để gửi email.`)
      return
    }
    
    const order = orders[0] as any
    const email = order.email
    
    // Simulate formatting an email template
    const emailHtml = `
      <h1>Cảm ơn bạn đã đặt hàng tại Mọng Fruitboxz!</h1>
      <p>Mã đơn hàng: ${order.id}</p>
      <p>Tổng tiền: ${new Intl.NumberFormat("vi-VN").format(order.total || 0)}đ</p>
      <p>Sản phẩm: ${order.items?.length || 0} món</p>
      <p>Người nhận: ${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}</p>
    `
    
    // TODO: Connect to Resend/SendGrid when API keys are available
    logger.info(`[Email Service Mock] Đã gửi email xác nhận đến: ${email}`)
    logger.debug(`[Email Content]\n${emailHtml}`)
    
  } catch (error) {
    logger.error(`[Queue] Lỗi khi gửi email xác nhận đơn hàng ${data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
