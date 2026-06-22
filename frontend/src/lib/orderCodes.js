export function getOrderCode(order) {
  if (!order) return "MONG-UNKNOWN"
  if (order.metadata?.order_code) return order.metadata.order_code

  const rawId = String(order.id || "")
  const suffix = rawId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "000000"
  const date = order.created_at ? new Date(order.created_at) : null
  const datePart = date && !Number.isNaN(date.getTime())
    ? date.toISOString().slice(0, 10).replace(/-/g, "")
    : "LOCAL"

  return `MONG-${datePart}-${suffix}`
}
