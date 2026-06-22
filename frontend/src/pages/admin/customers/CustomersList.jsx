import { useCallback, useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
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
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Bán hàng</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Khách hàng
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý hồ sơ và lịch sử mua hàng của khách.</p>
          </div>
        </div>
      </AdminHeaderPortal>

      <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eadfcd]">
          <AdminListFilters disableSticky={true}
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Tìm khách hàng..."
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
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
              <tr>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Liên hệ</th>
                <th className="px-5 py-4 text-center">Số đơn</th>
                <th className="px-5 py-4 text-right">Tổng chi tiêu</th>
                <th className="px-5 py-4 text-right">Ngày tham gia</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-[#8d7f6f]">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-[#8d7f6f]">Không tìm thấy khách hàng nào</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#fffaf4]/50 transition-colors align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f1e7da] flex items-center justify-center text-[#8d7f6f] font-extrabold text-lg">
                          {customer.first_name?.[0] || customer.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-secondary text-[15px]">
                            {customer.first_name} {customer.last_name}
                          </div>
                          {!customer.first_name && !customer.last_name && (
                            <div className="font-medium text-[#8d7f6f] italic text-xs">
                              Chưa cập nhật tên
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs text-[#8d7f6f] font-medium">
                            <Mail className="w-3.5 h-3.5 text-[#d4c5b3]" /> {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-xs text-[#8d7f6f] font-medium">
                            <Phone className="w-3.5 h-3.5 text-[#d4c5b3]" /> {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-[#fffaf4] text-[#8d7f6f] border border-[#eadfcd] text-xs font-bold">
                        {customer.total_orders}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-primary">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-[#8d7f6f] font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#d4c5b3]" />
                        {formatDate(customer.created_at)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="p-2 text-[#a08d79] hover:text-primary rounded-xl hover:bg-[#fffaf4] border border-transparent hover:border-[#eadfcd] inline-flex transition-colors"
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
