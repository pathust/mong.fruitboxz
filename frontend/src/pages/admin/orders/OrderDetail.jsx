import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { getOrderCode } from "../../../lib/orderCodes"

// Transition guards: chỉ cho phép các chuyển trạng thái hợp lệ
const VALID_ORDER_TRANSITIONS = {
  pending: ["completed", "canceled"],
  completed: ["archived"],    // completed → canceled is invalid
  canceled: ["archived"],
  archived: [],
}
const VALID_PAYMENT_TRANSITIONS = {
  not_paid: ["partially_paid", "paid"],
  partially_paid: ["paid", "refunded"],
  paid: ["refunded"],
  refunded: [],
}
const VALID_FULFILLMENT_TRANSITIONS = {
  not_fulfilled: ["processing"],
  processing: ["shipped", "not_fulfilled"],
  shipped: ["delivered", "returned"],
  delivered: [],            // delivered → shipped is invalid
  returned: ["not_fulfilled"],
}

export default function OrderDetail() {
  const { api } = useAdminAuth()
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [settings, setSettings] = useState({ default_cost_percent: 50, packaging_cost: 5000, labor_cost_per_order: 10000 })

  useEffect(() => {
    Promise.all([
      api(`/admin/orders/${id}?fields=*items,*items.metadata,metadata,*shipping_address`).then(d => setOrder(d.order)).catch(() => {}),
      api("/admin/settings").then(d => {
        if (d.settings) setSettings(prev => ({ ...prev, ...d.settings }))
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [id, api])

  const [editStatus, setEditStatus] = useState(null)
  const [editPayment, setEditPayment] = useState(null)
  const [editFulfillment, setEditFulfillment] = useState(null)

  // Sync edit states when order data loads/changes
  useEffect(() => {
    if (order) {
      const timer = window.setTimeout(() => {
        setEditStatus(order.status || "pending")
        setEditPayment(order.metadata?.payment_status || "not_paid")
        setEditFulfillment(order.metadata?.fulfillment_status || "not_fulfilled")
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [order])

  const currentStatus = order?.status || "pending"
  const currentPayment = order?.metadata?.payment_status || "not_paid"
  const currentFulfillment = order?.metadata?.fulfillment_status || "not_fulfilled"
  const hasChanges = editStatus !== currentStatus || editPayment !== currentPayment || editFulfillment !== currentFulfillment

  const handleSaveStatus = async () => {
    // Validate transitions trước khi lưu
    if (editStatus !== currentStatus) {
      const allowedOrderTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || []
      if (!allowedOrderTransitions.includes(editStatus)) {
        alert(`Không thể chuyển trạng thái đơn từ "${currentStatus}" sang "${editStatus}"`)
        setEditStatus(currentStatus)
        return
      }
    }
    if (editPayment !== currentPayment) {
      const allowedPaymentTransitions = VALID_PAYMENT_TRANSITIONS[currentPayment] || []
      if (!allowedPaymentTransitions.includes(editPayment)) {
        alert(`Không thể chuyển trạng thái thanh toán từ "${currentPayment}" sang "${editPayment}"`)
        setEditPayment(currentPayment)
        return
      }
    }
    if (editFulfillment !== currentFulfillment) {
      const allowedFulfillmentTransitions = VALID_FULFILLMENT_TRANSITIONS[currentFulfillment] || []
      if (!allowedFulfillmentTransitions.includes(editFulfillment)) {
        alert(`Không thể chuyển trạng thái giao hàng từ "${currentFulfillment}" sang "${editFulfillment}"`)
        setEditFulfillment(currentFulfillment)
        return
      }
    }

    setUpdating(true)
    try {
      const payload = {}
      if (editStatus !== currentStatus) payload.status = editStatus
      if (editPayment !== currentPayment) payload.payment_status = editPayment
      if (editFulfillment !== currentFulfillment) payload.fulfillment_status = editFulfillment

      await api(`/admin/custom/orders/${id}/status`, {
        method: "POST",
        body: JSON.stringify(payload)
      })
      // Re-fetch full order
      const refreshed = await api(`/admin/orders/${id}?fields=*items,*items.metadata,metadata,*shipping_address`)
      if (refreshed.order) {
        setOrder(refreshed.order)
      }
    } catch (err) {
      alert("Lỗi cập nhật: " + err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>
  if (!order) return <div className="text-center py-12 text-red-500">Order not found</div>

  let orderCost = 0
  const defaultCostPercent = Number(settings.default_cost_percent ?? 50) / 100
  const packagingCost = Number(settings.packaging_cost ?? 5000)
  const laborCostPerOrder = Number(settings.labor_cost_per_order ?? 10000)

  if (order.items) {
    for (const item of order.items) {
      const cost = Number(item.metadata?.cost_price) || 0
      const price = Number(item.unit_price) || 0
      const qty = Number(item.quantity) || 0
      const effectiveCost = cost > 0 ? cost : Math.round(price * defaultCostPercent)
      orderCost += (effectiveCost + packagingCost) * qty
    }
    orderCost += laborCostPerOrder
  }
  const profit = (order.total || 0) - orderCost

  return (
    <div>
      <Link to="/admin/orders" className="text-primary hover:text-primary-dark text-sm mb-4 inline-block">&larr; Back to Orders</Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary">Order {getOrderCode(order)}</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-secondary mb-3">Trạng thái (Status)</h2>
          <div className="space-y-4 text-sm mb-4">
            <div className="flex items-center gap-3">
              <span className="text-secondary-light min-w-[120px]">Đơn hàng:</span>
              <select
                value={editStatus || "pending"}
                onChange={e => setEditStatus(e.target.value)}
                disabled={updating}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-primary flex-1"
              >
                <option value="pending">Chờ xác nhận (Pending)</option>
                <option value="completed">Đã hoàn thành (Completed)</option>
                <option value="canceled">Đã huỷ (Canceled)</option>
                <option value="archived">Đã lưu trữ (Archived)</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-secondary-light min-w-[120px]">Thanh toán:</span>
              <select
                value={editPayment || "not_paid"}
                onChange={e => setEditPayment(e.target.value)}
                disabled={updating}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-primary flex-1"
              >
                <option value="not_paid">Chưa thanh toán</option>
                <option value="partially_paid">Thanh toán 1 phần</option>
                <option value="paid">Đã thanh toán đủ</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-secondary-light min-w-[120px]">Giao hàng:</span>
              <select
                value={editFulfillment || "not_fulfilled"}
                onChange={e => setEditFulfillment(e.target.value)}
                disabled={updating}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-primary flex-1"
              >
                <option value="not_fulfilled">Chưa lấy hàng</option>
                <option value="processing">Đang chuẩn bị</option>
                <option value="shipped">Đang giao hàng</option>
                <option value="delivered">Đã giao thành công</option>
                <option value="returned">Khách hoàn trả</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveStatus}
            disabled={updating || !hasChanges}
            className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
              hasChanges
                ? 'bg-primary text-white hover:bg-primary-dark cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {updating ? "Đang lưu..." : hasChanges ? "💾 Lưu thay đổi" : "Không có thay đổi"}
          </button>

            <h2 className="font-semibold text-secondary mb-3 pt-4 border-t border-gray-50">Khách hàng & Tài chính</h2>
            <div className="space-y-3 text-sm">
              <p><span className="text-secondary-light min-w-[120px] inline-block">Email:</span> {order.email}</p>
              <p><span className="text-secondary-light min-w-[120px] inline-block">Ngày đặt:</span> {new Date(order.created_at).toLocaleDateString('vi-VN')}</p>

              {order.shipping_address && (
                <div className="bg-gray-50 p-4 rounded-xl mt-3 space-y-2 border border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">Thông tin nhận hàng</h3>
                  <p><span className="text-gray-500 min-w-[100px] inline-block">Họ Tên:</span> <span className="font-medium text-gray-900">{order.shipping_address.last_name || ""} {order.shipping_address.first_name || ""}</span></p>
                  <p><span className="text-gray-500 min-w-[100px] inline-block">SĐT:</span> <span className="font-medium text-gray-900">{order.shipping_address.phone}</span></p>
                  <p><span className="text-gray-500 min-w-[100px] inline-block">Địa chỉ:</span> <span className="text-gray-900">{order.shipping_address.address_1}{order.shipping_address.district ? `, ${order.shipping_address.district}` : ""}{order.shipping_address.city ? `, ${order.shipping_address.city}` : ""}</span></p>
                  {order.shipping_address.metadata?.note && (
                    <p className="pt-2 border-t border-gray-200 mt-2"><span className="text-gray-500 min-w-[100px] inline-block">Ghi chú:</span> <span className="text-orange-600 font-medium">{order.shipping_address.metadata.note}</span></p>
                  )}
                </div>
              )}

              {order.total !== undefined && (
              <>
                <p className="mt-4 pt-2 border-t border-gray-50 text-gray-800">
                  <span className="text-secondary-light min-w-[120px] inline-block">Doanh thu (Total):</span>
                  <span className="font-semibold text-base">{(order.total ?? 0).toLocaleString()} ₫</span>
                </p>
                <p className="text-gray-800">
                  <span className="text-secondary-light min-w-[120px] inline-block">Giá vốn (COGS):</span>
                  <span>{(orderCost ?? 0).toLocaleString()} ₫</span>
                </p>
                <p className="text-green-600">
                  <span className="min-w-[120px] inline-block">Lợi nhuận gộp:</span>
                  <span className="font-bold text-lg">{(profit ?? 0).toLocaleString()} ₫</span>
                </p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-secondary mb-3">Sản phẩm (Items)</h2>
          {order.items?.length > 0 ? (
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">SL: {item.quantity} | Giá vốn: {Number(item.metadata?.cost_price || 0).toLocaleString()} ₫</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{(item.total ?? (item.unit_price * item.quantity)).toLocaleString()} ₫</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-secondary-light">No items</p>}
        </div>
      </div>
    </div>
  )
}
