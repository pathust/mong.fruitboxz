import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ShoppingCart, Eye } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
export default function OrdersList() {
  const { api } = useAdminAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api("/admin/orders?limit=50&fields=id,display_id,email,status,total,created_at,metadata")
      .then(d => setOrders(d.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [api])
  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>
  return (
    <div className="space-y-6">
      <div className="admin-panel p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1e7] text-primary">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a08d79]">Fulfillment</p>
            <h1 className="page-title mt-2 text-[30px]">Orders</h1>
            <p className="product-meta mt-2 text-[14px]">Theo dõi đơn hàng, trạng thái và thông tin khách.</p>
          </div>
        </div>
      </div>
      <div className="admin-table overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Thanh toán</th>
              <th className="text-left px-4 py-3 font-medium">Giao hàng</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1e7da]">
            {orders.map(o => (
              <tr key={o.id}>
                <td className="px-4 py-3 font-medium text-secondary">#{o.display_id || o.id.slice(-8)}</td>
                <td className="px-4 py-3 text-secondary-light">{o.email || "—"}</td>
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
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-secondary-light">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}