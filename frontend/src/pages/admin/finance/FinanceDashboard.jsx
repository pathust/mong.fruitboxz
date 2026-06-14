import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowUpRight, BadgeDollarSign, Download, TrendingUp, WalletCards } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"

function formatVnd(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0)
}

export default function FinanceDashboard() {
  const { api } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    unpaid: 0,
    revenue7d: [],
    recentOrders: []
  })

  useEffect(() => {
    async function loadFinanceData() {
      try {
        setLoading(true)
        const analytics = await api("/admin/custom?mode=dashboard").catch(() => null)
        const recent = await api("/admin/orders?limit=10").catch(() => ({ orders: [] }))

        setStats({
          revenue: analytics?.metrics?.revenue_total || 0,
          profit: analytics?.metrics?.profit_total || 0,
          unpaid: analytics?.metrics?.unpaid_total || 0,
          revenue7d: analytics?.revenue_7d || [],
          recentOrders: recent?.orders || []
        })
      } catch (error) {
        console.error("Failed to load finance data", error)
      } finally {
        setLoading(false)
      }
    }
    loadFinanceData()
  }, [api])

  const maxRevenue = Math.max(...(stats.revenue7d.map(d => d.revenue) || [0]), 1)

  return (
    <div className="space-y-6">
      <div className="admin-panel p-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a08d79]">Finance Management</p>
          <h1 className="page-title mt-2 text-[30px]">Doanh thu & Công nợ</h1>
          <p className="product-meta mt-2 max-w-2xl text-[14px] text-[#766957]">
            Thống kê tài chính, theo dõi lợi nhuận và quản lý các khoản công nợ của khách hàng.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="admin-button-secondary px-5 py-3 text-sm">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="admin-card p-5 transition hover:-translate-y-0.5 hover:border-primary/45">
          <div className="mb-5 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e7] text-primary">
              <WalletCards className="h-5 w-5" />
            </span>
          </div>
          <p className="product-meta mt-1 text-sm text-[#766957]">Tổng doanh thu</p>
          <p className="text-3xl font-extrabold text-[#3e3528]">{formatVnd(stats.revenue)}</p>
        </div>

        <div className="admin-card p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/45">
          <div className="mb-5 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="product-meta mt-1 text-sm text-[#766957]">Tổng lợi nhuận</p>
          <p className="text-3xl font-extrabold text-[#3e3528]">{formatVnd(stats.profit)}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-2">
            Biên lợi nhuận: {stats.revenue > 0 ? Math.round((stats.profit / stats.revenue) * 100) : 0}%
          </p>
        </div>

        <div className="admin-card p-5 transition hover:-translate-y-0.5 hover:border-red-500/45">
          <div className="mb-5 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <Link to="/admin/orders" className="text-sm font-semibold text-red-600 hover:underline">
              Thu hồi nợ
            </Link>
          </div>
          <p className="product-meta mt-1 text-sm text-[#766957]">Tổng công nợ</p>
          <p className="text-3xl font-extrabold text-[#3e3528]">{formatVnd(stats.unpaid)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="admin-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="section-title text-[20px]">Biểu đồ doanh thu (7 ngày)</h2>
            <BadgeDollarSign className="h-5 w-5 text-[#b09c84]" />
          </div>

          <div className="h-[250px] flex items-end gap-2 sm:gap-4 mt-8 pt-4 border-t border-[#eadfcd]">
            {stats.revenue7d.length === 0 && !loading && (
              <div className="w-full text-center text-sm text-[#8a7a67]">Chưa có dữ liệu giao dịch</div>
            )}

            {stats.revenue7d.map((day, i) => {
              const heightPercent = Math.max((day.revenue / maxRevenue) * 100, 2);
              return (
                <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full bg-primary/20 rounded-t-md transition-all duration-500 group-hover:bg-primary/40 relative"
                    style={{ height: `${heightPercent}%` }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#3e3528] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {formatVnd(day.revenue)}
                    </div>
                  </div>
                  <span className="mt-3 text-[10px] font-bold text-[#8a7a67] uppercase tracking-wider">{day.date.split("-").slice(1).join("/")}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="admin-card flex flex-col p-6">
          <h2 className="section-title mb-4 text-[20px]">Dòng tiền gần đây</h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {stats.recentOrders.length === 0 && !loading && (
              <p className="text-sm text-[#8a7a67]">Không có giao dịch nào.</p>
            )}
            {stats.recentOrders.slice(0, 7).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#fffaf4] border border-transparent hover:border-[#eadfcd] transition-colors">
                <div className="min-w-0 pr-3">
                  <Link to={`/admin/orders/${order.id}`} className="block truncate text-sm font-bold text-[#43382b] hover:text-primary">
                    #{order.id.split("-")[0]}
                  </Link>
                  <p className="truncate text-xs text-[#8a7a67]">{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-[#43382b]">{formatVnd(order.total_amount)}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    order.payment_status === "paid" ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {order.payment_status === "paid" ? "Đã thu" : "Công nợ"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#eadfcd]">
            <Link to="/admin/orders" className="flex items-center justify-center gap-2 text-sm font-bold text-primary hover:underline">
              Xem tất cả đơn hàng
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
