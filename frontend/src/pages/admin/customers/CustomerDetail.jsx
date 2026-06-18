import { useCallback, useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Mail, Phone, Calendar, ShoppingBag, MapPin, LoaderCircle, Users } from "lucide-react"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { getOrderCode } from "../../../lib/orderCodes"

export default function CustomerDetail() {
  const { id } = useParams()
  const { api } = useAdminAuth()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api(`/admin/customers/${id}?fields=*orders,*orders.items`)
      if (res?.customer) {
        let totalSpent = 0
        let totalOrders = (res.customer.orders || []).length
        for (const o of (res.customer.orders || [])) {
          for (const item of (o.items || [])) {
            totalSpent += (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)
          }
        }
        setCustomer({ ...res.customer, total_spent: totalSpent, total_orders: totalOrders })
      }
    } catch (error) {
      console.error("Failed to fetch customer:", error)
    } finally {
      setLoading(false)
    }
  }, [api, id])

  useEffect(() => {
    const timer = window.setTimeout(fetchCustomer, 0)
    return () => window.clearTimeout(timer)
  }, [fetchCustomer])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString("vi-VN")
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải thông tin khách hàng...</div>
  }

  if (!customer) {
    return <div className="p-8 text-center text-red-500">Không tìm thấy khách hàng</div>
  }

  const name = customer.first_name || customer.last_name
    ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
    : "Chưa cập nhật tên"

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Chi tiết khách hàng
            </h1>
          </div>
          <Link to="/admin/customers" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>
        </div>
      </AdminHeaderPortal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-700 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10">
              <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-3xl mb-4">
                {customer.first_name?.[0] || customer.email?.[0]?.toUpperCase() || "U"}
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
              <p className="text-gray-500 text-sm mt-1">Khách hàng từ {formatDate(customer.created_at).split(" ")[1]}</p>
            </div>

            <div className="p-6 space-y-4">
              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-medium">Email</div>
                    <div className="text-gray-900 dark:text-white">{customer.email}</div>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-medium">Số điện thoại</div>
                    <div className="text-gray-900 dark:text-white">{customer.phone}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <div className="text-blue-100 text-sm font-medium uppercase mb-1">Tổng chi tiêu</div>
            <div className="text-3xl font-bold">{formatCurrency(customer.total_spent)}</div>
            <div className="mt-4 pt-4 border-t border-blue-400/30 flex justify-between items-center">
              <span className="text-blue-100">Số đơn hàng</span>
              <span className="font-bold text-xl">{customer.total_orders}</span>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử đơn hàng</h3>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {(!customer.orders || customer.orders.length === 0) ? (
                <div className="p-8 text-center text-gray-500">Chưa có đơn hàng nào</div>
              ) : (
                customer.orders.map((order) => {
                  let orderTotal = 0
                  for (const item of (order.items || [])) {
                    orderTotal += (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)
                  }

                  return (
                    <div key={order.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Link to={`/admin/orders/${order.id}`} className="font-bold text-blue-600 hover:underline">
                            {getOrderCode(order)}
                          </Link>
                          <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(order.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(orderTotal)}</div>
                          <div className="text-sm">
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                              order.status === "completed" ? "bg-green-100 text-green-700" :
                              order.status === "canceled" ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {order.status === "completed" ? "Hoàn thành" :
                               order.status === "canceled" ? "Đã hủy" : "Đang xử lý"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                        {(order.items || []).map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">{item.quantity}x</span> {item.title}
                            </div>
                            <div className="text-gray-500">
                              {formatCurrency(item.unit_price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
