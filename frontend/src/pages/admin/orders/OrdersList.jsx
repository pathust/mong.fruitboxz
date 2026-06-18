import { useMemo, useState, useEffect } from "react"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Link } from "react-router-dom"

import { ShoppingCart, Eye } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"
import { getOrderCode } from "../../../lib/orderCodes"

function getCustomerName(order) {
  const address = order.shipping_address || {}
  return [address.last_name, address.first_name].filter(Boolean).join(" ").trim()
}

function getCustomerAddress(order) {
  const address = order.shipping_address || {}
  return [address.address_1, address.province, address.city].filter(Boolean).join(", ")
}

export default function OrdersList() {
  const { api } = useAdminAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [fulfillmentStatus, setFulfillmentStatus] = useState("all")

  useEffect(() => {
    api("/admin/orders?limit=50&fields=id,email,status,total,created_at,metadata,*shipping_address")
      .then(d => setOrders(d.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [api])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const payment = order.metadata?.payment_status || "not_paid"
      const fulfillment = order.metadata?.fulfillment_status || "not_fulfilled"
      return (
        filterBySearch(order, query, [
          "email",
          "status",
          (item) => getOrderCode(item),
          (item) => getCustomerName(item),
          (item) => item.shipping_address?.phone,
          (item) => getCustomerAddress(item),
        ]) &&
        (status === "all" || order.status === status) &&
        (paymentStatus === "all" || payment === paymentStatus) &&
        (fulfillmentStatus === "all" || fulfillment === fulfillmentStatus)
      )
    })
  }, [orders, query, status, paymentStatus, fulfillmentStatus])

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>
  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e7] text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Fulfillment</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Orders
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Theo dõi đơn hàng, trạng thái và thông tin khách.</p>
          </div>
        </div>
      </div>
      </AdminHeaderPortal>

      <AdminListFilters
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm theo mã đơn, tên khách, SĐT, địa chỉ..."
        showing={filteredOrders.length}
        total={orders.length}
        onReset={() => {
          setQuery("")
          setStatus("all")
          setPaymentStatus("all")
          setFulfillmentStatus("all")
        }}
        filters={[
          {
            label: "Trạng thái đơn",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
              { value: "canceled", label: "Canceled" },
              { value: "requires_action", label: "Requires action" },
            ],
          },
          {
            label: "Thanh toán",
            value: paymentStatus,
            onChange: setPaymentStatus,
            options: [
              { value: "all", label: "Tất cả thanh toán" },
              { value: "not_paid", label: "Chưa TT" },
              { value: "partially_paid", label: "TT 1 phần" },
              { value: "paid", label: "Đã TT" },
              { value: "refunded", label: "Hoàn tiền" },
            ],
          },
          {
            label: "Giao hàng",
            value: fulfillmentStatus,
            onChange: setFulfillmentStatus,
            options: [
              { value: "all", label: "Tất cả giao hàng" },
              { value: "not_fulfilled", label: "Chưa giao" },
              { value: "processing", label: "Chuẩn bị" },
              { value: "shipped", label: "Đang giao" },
              { value: "delivered", label: "Đã giao" },
              { value: "returned", label: "Hoàn trả" },
            ],
          },
        ]}
      />

      <div className="admin-table overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 font-medium">STT</th>
              <th className="text-left px-4 py-3 font-medium">Mã đơn hàng</th>
              <th className="text-left px-4 py-3 font-medium">Khách hàng</th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-left px-4 py-3 font-medium">Thanh toán</th>
              <th className="text-left px-4 py-3 font-medium">Giao hàng</th>
              <th className="text-right px-4 py-3 font-medium">Tổng tiền</th>
              <th className="text-right px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1e7da]">
            {filteredOrders.map((o, index) => {
              const customerName = getCustomerName(o)
              const customerAddress = getCustomerAddress(o)
              return (
              <tr key={o.id}>
                <td className="px-4 py-3 font-semibold text-secondary-light">{index + 1}</td>
                <td className="px-4 py-3">
                  <Link to={`/admin/orders/${o.id}`} className="font-bold text-secondary hover:text-primary">
                    {getOrderCode(o)}
                  </Link>
                  <p className="mt-1 text-xs text-secondary-light">{new Date(o.created_at).toLocaleDateString("vi-VN")}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-secondary">{customerName || "Khách lẻ"}</p>
                  <div className="mt-1 space-y-0.5 text-xs text-secondary-light">
                    {o.shipping_address?.phone && <p>{o.shipping_address.phone}</p>}
                    {customerAddress && <p className="line-clamp-2 max-w-[280px]">{customerAddress}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`admin-status ${o.status === "completed" ? "bg-[#e8f6e9] text-[#2f7a37]" : o.status === "pending" ? "bg-[#fff4d8] text-[#9a6a16]" : "bg-[#f1eadf] text-[#766957]"}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const ps = o.metadata?.payment_status || 'not_paid'
                    const labels = { not_paid: 'Chưa TT', partially_paid: 'TT 1 phần', paid: 'Đã TT', refunded: 'Hoàn tiền' }
                    const colors = { not_paid: 'bg-[#fff4d8] text-[#9a6a16]', paid: 'bg-[#e8f6e9] text-[#2f7a37]', partially_paid: 'bg-[#e8f0fe] text-[#1a56db]', refunded: 'bg-[#fde8e8] text-[#c81e1e]' }
                    return <span className={`admin-status ${colors[ps] || 'bg-[#f1eadf] text-[#766957]'}`}>{labels[ps] || ps}</span>
                  })()}
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const fs = o.metadata?.fulfillment_status || 'not_fulfilled'
                    const labels = { not_fulfilled: 'Chưa giao', processing: 'Chuẩn bị', shipped: 'Đang giao', delivered: 'Đã giao', returned: 'Hoàn trả' }
                    const colors = { not_fulfilled: 'bg-[#fff4d8] text-[#9a6a16]', delivered: 'bg-[#e8f6e9] text-[#2f7a37]', shipped: 'bg-[#e8f0fe] text-[#1a56db]', processing: 'bg-[#f1eadf] text-[#766957]', returned: 'bg-[#fde8e8] text-[#c81e1e]' }
                    return <span className={`admin-status ${colors[fs] || 'bg-[#f1eadf] text-[#766957]'}`}>{labels[fs] || fs}</span>
                  })()}
                </td>
                <td className="px-4 py-3 text-right">{o.total ? `${(o.total).toLocaleString()} ₫` : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/orders/${o.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Xem">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
              )
            })}
            {filteredOrders.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-secondary-light">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
