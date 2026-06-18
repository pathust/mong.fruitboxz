import { useState, useEffect } from "react"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowUpRight, BadgeDollarSign, BarChart3, Download, PieChart, TrendingUp, WalletCards } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { getOrderCode } from "../../../lib/orderCodes"

function formatVnd(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0)
}

function formatShortVnd(n) {
  const value = Number(n) || 0
  if (Math.abs(value) >= 1000000000) return `${Math.round(value / 100000000) / 10} tỷ`
  if (Math.abs(value) >= 1000000) return `${Math.round(value / 100000) / 10}tr`
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`
  return `${value}`
}

function paymentLabel(status) {
  const labels = {
    paid: "Đã thu",
    captured: "Đã thu",
    not_paid: "Chưa thu",
    awaiting: "Chờ thu",
    refunded: "Hoàn tiền",
    canceled: "Đã hủy",
  }
  return labels[status] || status.replace(/_/g, " ")
}

function orderStatusLabel(status) {
  const labels = {
    pending: "Chờ xử lý",
    completed: "Hoàn tất",
    canceled: "Đã hủy",
    archived: "Lưu trữ",
    requires_action: "Cần xử lý",
  }
  return labels[status] || status.replace(/_/g, " ")
}

function ChartCard({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`admin-card p-6 ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="section-title text-[20px]">{title}</h2>
        {Icon && <Icon className="h-5 w-5 text-[#b09c84]" />}
      </div>
      {children}
    </div>
  )
}

function DonutChart({ items, total, centerLabel }) {
  let cursor = 0
  const gradient = total > 0
    ? items.map((item) => {
      const start = cursor
      const size = (Number(item.value) || 0) / total * 360
      cursor += size
      return `${item.color} ${start}deg ${cursor}deg`
    }).join(", ")
    : "#eadfcd 0deg 360deg"

  return (
    <div className="flex flex-col items-center gap-5 md:flex-row">
      <div
        className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#a08d79]">{centerLabel}</span>
          <span className="text-lg font-extrabold text-[#3e3528]">{formatShortVnd(total)}</span>
        </div>
      </div>
      <div className="w-full space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-[#43382b]">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-bold text-[#766957]">{formatVnd(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBars({ items, emptyText, valueFormatter = (value) => value }) {
  const max = Math.max(...items.map(item => Number(item.value) || 0), 1)

  if (items.length === 0) {
    return <p className="text-sm text-[#8a7a67]">{emptyText}</p>
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = Math.max(((Number(item.value) || 0) / max) * 100, 4)
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-bold text-[#43382b]">{item.label}</span>
              <span className="shrink-0 text-xs font-semibold text-[#8a7a67]">{valueFormatter(item.value, item)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#f2eadf]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${width}%`, backgroundColor: item.color || "#c87946" }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function FinanceDashboard() {
  const { api } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    unpaid: 0,
    avgOrderValue: 0,
    ordersToday: 0,
    revenue7d: [],
    topProducts: [],
    orderStatus: {},
    paymentStatus: {},
    recentOrders: [],
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
          avgOrderValue: analytics?.metrics?.avg_order_value || 0,
          ordersToday: analytics?.metrics?.orders_today || 0,
          revenue7d: analytics?.revenue_7d || [],
          topProducts: analytics?.top_products || [],
          orderStatus: analytics?.order_status || {},
          paymentStatus: analytics?.payment_status || {},
          recentOrders: recent?.orders || [],
        })
      } catch (error) {
        console.error("Failed to load finance data", error)
      } finally {
        setLoading(false)
      }
    }
    loadFinanceData()
  }, [api])

  const estimatedCost = Math.max(stats.revenue - stats.profit, 0)
  const margin = stats.revenue > 0 ? Math.round((stats.profit / stats.revenue) * 100) : 0
  const maxDailyValue = Math.max(
    ...stats.revenue7d.flatMap(day => [Number(day.revenue) || 0, Math.max(Number(day.profit) || 0, 0)]),
    1
  )
  const financeMix = [
    { label: "Lợi nhuận", value: Math.max(stats.profit, 0), color: "#10b981" },
    { label: "Giá vốn & chi phí", value: estimatedCost, color: "#f59e0b" },
  ]
  const paymentItems = Object.entries(stats.paymentStatus).map(([status, value], index) => ({
    label: paymentLabel(status),
    value,
    color: ["#10b981", "#ef4444", "#f59e0b", "#64748b"][index % 4],
  }))
  const orderStatusItems = Object.entries(stats.orderStatus).map(([status, value], index) => ({
    label: orderStatusLabel(status),
    value,
    color: ["#c87946", "#10b981", "#ef4444", "#8b5cf6", "#64748b"][index % 5],
  }))
  const topProductItems = stats.topProducts.map((product, index) => ({
    label: product.title,
    value: product.revenue,
    qty: product.qty,
    color: ["#c87946", "#d99a62", "#e8b47d", "#10b981", "#60a5fa"][index % 5],
  }))

  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
          <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Finance Management</p>
          <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">Doanh thu & Công nợ</h1>
          <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">
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
      </AdminHeaderPortal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="admin-card p-5 transition hover:-translate-y-0.5 hover:border-primary/45 xl:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e7] text-primary">
              <WalletCards className="h-5 w-5" />
            </span>
          </div>
          <p className="product-meta mt-1 text-sm text-[#766957]">Tổng doanh thu</p>
          <p className="text-3xl font-extrabold text-[#3e3528]">{formatVnd(stats.revenue)}</p>
        </div>

        <div className="admin-card p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/45 xl:col-span-1">
          <div className="mb-5 flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <p className="product-meta mt-1 text-sm text-[#766957]">Tổng lợi nhuận</p>
          <p className="text-3xl font-extrabold text-[#3e3528]">{formatVnd(stats.profit)}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-2">Biên lợi nhuận: {margin}%</p>
        </div>

        <div className="admin-card p-5 transition hover:-translate-y-0.5 hover:border-red-500/45 xl:col-span-1">
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

        <div className="admin-card p-5 xl:col-span-1">
          <p className="product-meta text-sm text-[#766957]">Đơn hôm nay</p>
          <p className="mt-3 text-3xl font-extrabold text-[#3e3528]">{stats.ordersToday}</p>
          <p className="mt-2 text-xs font-semibold text-[#8a7a67]">Tính trên đơn chưa hủy</p>
        </div>

        <div className="admin-card p-5 xl:col-span-1">
          <p className="product-meta text-sm text-[#766957]">Giá trị đơn TB</p>
          <p className="mt-3 text-3xl font-extrabold text-[#3e3528]">{formatShortVnd(stats.avgOrderValue)}</p>
          <p className="mt-2 text-xs font-semibold text-[#8a7a67]">{formatVnd(stats.avgOrderValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Doanh thu & lợi nhuận 7 ngày" icon={BarChart3} className="xl:col-span-2">
          <div className="h-[290px] rounded-3xl border border-[#eadfcd] bg-[#fffaf4] px-4 pb-4 pt-8">
            {stats.revenue7d.length === 0 && !loading && (
              <div className="flex h-full items-center justify-center text-sm text-[#8a7a67]">Chưa có dữ liệu giao dịch</div>
            )}

            <div className="flex h-full items-end gap-3 sm:gap-5">
              {stats.revenue7d.map((day) => {
                const revenueHeight = Math.max(((Number(day.revenue) || 0) / maxDailyValue) * 100, 2)
                const profitHeight = Math.max((Math.max(Number(day.profit) || 0, 0) / maxDailyValue) * 100, 2)
                return (
                  <div key={day.date} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                    <div className="absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 rounded-xl bg-[#3e3528] px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      <p className="whitespace-nowrap font-bold">DT: {formatVnd(day.revenue)}</p>
                      <p className="whitespace-nowrap">LN: {formatVnd(day.profit)}</p>
                      <p className="whitespace-nowrap">Đơn: {day.orders || 0}</p>
                    </div>
                    <div className="flex h-[220px] w-full items-end justify-center gap-1.5">
                      <div
                        className="w-1/2 rounded-t-lg bg-primary/35 transition-all duration-500 group-hover:bg-primary/60"
                        style={{ height: `${revenueHeight}%` }}
                      />
                      <div
                        className="w-1/2 rounded-t-lg bg-emerald-400/60 transition-all duration-500 group-hover:bg-emerald-500"
                        style={{ height: `${profitHeight}%` }}
                      />
                    </div>
                    <span className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#8a7a67]">
                      {day.date.split("-").slice(1).join("/")}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-[#766957]">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary/50" />Doanh thu</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-400" />Lợi nhuận</span>
          </div>
        </ChartCard>

        <ChartCard title="Cơ cấu doanh thu" icon={PieChart}>
          <DonutChart items={financeMix} total={Math.max(stats.revenue, 0)} centerLabel="Doanh thu" />
          <div className="mt-5 rounded-2xl bg-[#fffaf4] p-4 text-sm text-[#766957]">
            <p><span className="font-bold text-[#43382b]">Công nợ:</span> {formatVnd(stats.unpaid)}</p>
            <p className="mt-1"><span className="font-bold text-[#43382b]">Biên LN:</span> {margin}%</p>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartCard title="Top sản phẩm theo doanh thu" icon={BadgeDollarSign}>
          <HorizontalBars
            items={topProductItems}
            emptyText="Chưa có dữ liệu sản phẩm."
            valueFormatter={(value, item) => `${item.qty} sp • ${formatShortVnd(value)}`}
          />
        </ChartCard>

        <ChartCard title="Trạng thái thanh toán" icon={PieChart}>
          <HorizontalBars
            items={paymentItems}
            emptyText="Chưa có dữ liệu thanh toán."
            valueFormatter={(value) => `${value} đơn`}
          />
        </ChartCard>

        <ChartCard title="Trạng thái đơn hàng" icon={BarChart3}>
          <HorizontalBars
            items={orderStatusItems}
            emptyText="Chưa có dữ liệu trạng thái đơn."
            valueFormatter={(value) => `${value} đơn`}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="admin-card flex flex-col p-6 lg:col-span-3">
          <h2 className="section-title mb-4 text-[20px]">Dòng tiền gần đây</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stats.recentOrders.length === 0 && !loading && (
              <p className="text-sm text-[#8a7a67]">Không có giao dịch nào.</p>
            )}
            {stats.recentOrders.slice(0, 9).map(order => {
              const paymentStatus = order.metadata?.payment_status || order.payment_status || "not_paid"
              return (
                <div key={order.id} className="flex items-center justify-between rounded-2xl bg-[#fffaf4] p-3 transition-colors hover:border-[#eadfcd]">
                  <div className="min-w-0 pr-3">
                    <Link to={`/admin/orders/${order.id}`} className="block truncate text-sm font-bold text-[#43382b] hover:text-primary">
                      {getOrderCode(order)}
                    </Link>
                    <p className="truncate text-xs text-[#8a7a67]">{new Date(order.created_at).toLocaleDateString("vi-VN")}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold text-[#43382b]">{formatVnd(order.total_amount)}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${
                      paymentStatus === "paid" || paymentStatus === "captured" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {paymentStatus === "paid" || paymentStatus === "captured" ? "Đã thu" : "Công nợ"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 border-t border-[#eadfcd] pt-4">
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
