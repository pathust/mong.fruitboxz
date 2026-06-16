import { useCallback, useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { Users, MoreVertical, Mail, Phone, Calendar } from "lucide-react"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"

export default function CustomersList() {
  const { api } = useAdminAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [orderFilter, setOrderFilter] = useState("all")
  const [spendFilter, setSpendFilter] = useState("all")

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api("/admin/customers?fields=*orders,*orders.items")
      if (res?.customers) {
        const processed = res.customers.map(c => {
          let totalSpent = 0
          let totalOrders = (c.orders || []).length
          for (const o of (c.orders || [])) {
            for (const item of (o.items || [])) {
              totalSpent += (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)
            }
          }
          return { ...c, total_orders: totalOrders, total_spent: totalSpent }
        })
        setCustomers(processed)
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(fetchCustomers, 0)
    return () => window.clearTimeout(timer)
  }, [fetchCustomers])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("vi-VN")
  }

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const passesSearch = filterBySearch(customer, searchTerm, [
        "email",
        "phone",
        (item) => `${item.first_name || ""} ${item.last_name || ""}`,
      ])
      const passesOrders =
        orderFilter === "all" ||
        (orderFilter === "none" && customer.total_orders === 0) ||
        (orderFilter === "has_orders" && customer.total_orders > 0) ||
        (orderFilter === "repeat" && customer.total_orders >= 2)
      const passesSpend =
        spendFilter === "all" ||
        (spendFilter === "zero" && customer.total_spent === 0) ||
        (spendFilter === "under_500k" && customer.total_spent > 0 && customer.total_spent < 500000) ||
        (spendFilter === "over_500k" && customer.total_spent >= 500000)

      return passesSearch && passesOrders && passesSpend
    })
  }, [customers, searchTerm, orderFilter, spendFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Khách hàng
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý thông tin và lịch sử mua hàng của khách hàng
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <AdminListFilters
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Tìm theo tên, email, SĐT..."
            showing={filteredCustomers.length}
            total={customers.length}
            onReset={() => {
              setSearchTerm("")
              setOrderFilter("all")
              setSpendFilter("all")
            }}
            filters={[
              {
                label: "Số đơn",
                value: orderFilter,
                onChange: setOrderFilter,
                options: [
                  { value: "all", label: "Tất cả số đơn" },
                  { value: "none", label: "Chưa mua" },
                  { value: "has_orders", label: "Đã mua" },
                  { value: "repeat", label: "Mua lặp lại" },
                ],
              },
              {
                label: "Chi tiêu",
                value: spendFilter,
                onChange: setSpendFilter,
                options: [
                  { value: "all", label: "Tất cả chi tiêu" },
                  { value: "zero", label: "0đ" },
                  { value: "under_500k", label: "Dưới 500k" },
                  { value: "over_500k", label: "Từ 500k" },
                ],
              },
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Khách hàng</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Liên hệ</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-center">Số đơn</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Tổng chi tiêu</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Ngày tham gia</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Không tìm thấy khách hàng nào</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          {customer.first_name?.[0] || customer.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {customer.first_name} {customer.last_name}
                          </div>
                          {!customer.first_name && !customer.last_name && (
                            <div className="font-medium text-gray-900 dark:text-white italic">
                              Chưa cập nhật tên
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="w-3 h-3" /> {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium">
                        {customer.total_orders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(customer.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 inline-flex transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
