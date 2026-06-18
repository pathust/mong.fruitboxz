import { useState, useEffect } from "react"
import { AdminHeaderPortal } from "../../components/admin/AdminHeaderPortal"
import { Link } from "react-router-dom"
import { AlertTriangle, ArrowUpRight, Bot, Image as ImageIcon, LayoutDashboard, Package, Plus, SearchCheck, ShoppingCart, TrendingUp, Users, WalletCards } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"

function formatVnd(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n) || 0)
}

export default function AdminDashboard() {
  const { api } = useAdminAuth()
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    users: 0,
    revenue: 0,
    profit: 0,
    unpaid: 0,
    ordersToday: 0,
    avgOrderValue: 0,
    status: {},
    topProducts: [],
    revenue7d: [],
  })
  const [services, setServices] = useState({ online: false, enabled: false, indexed_documents: 0, object_storage: false })

  useEffect(() => {
    async function load() {
      const [searchStatus, mediaStatus] = await Promise.all([
        api("/admin/search").catch(() => null),
        api("/admin/media").catch(() => null),
      ])
      if (searchStatus || mediaStatus) {
        setServices({
          online: Boolean(searchStatus?.online),
          enabled: Boolean(searchStatus?.enabled),
          indexed_documents: searchStatus?.indexed_documents || 0,
          object_storage: Boolean(mediaStatus?.object_storage),
        })
      }
      const analytics = await api("/admin/custom?mode=dashboard").catch(() => null)
      if (analytics) {
        setStats({
          products: analytics.metrics?.products || 0,
          orders: analytics.metrics?.orders || 0,
          users: analytics.metrics?.customers || 0,
          revenue: analytics.metrics?.revenue_total || 0,
          profit: analytics.metrics?.profit_total || 0,
          unpaid: analytics.metrics?.unpaid_total || 0,
          ordersToday: analytics.metrics?.orders_today || 0,
          avgOrderValue: analytics.metrics?.avg_order_value || 0,
          status: analytics.order_status || {},
          topProducts: analytics.top_products || [],
          revenue7d: analytics.revenue_7d || [],
        })
        return
      }

      const [products, orders, users] = await Promise.all([
        api("/admin/products?limit=1").catch(() => ({ count: 0 })),
        api("/admin/orders?limit=1").catch(() => ({ count: 0 })),
        api("/admin/users").catch(() => ({ users: [] })),
      ])
      setStats({
        products: products.count || 0,
        orders: orders.count || 0,
        users: users.users?.length || 0,
        revenue: 0,
        ordersToday: 0,
        avgOrderValue: 0,
        status: {},
        topProducts: [],
        revenue7d: [],
      })
    }
    load()
  }, [api])

  const cards = [
    { label: "Sản phẩm", value: stats.products, icon: Package, link: "/admin/products" },
    { label: "Đơn hàng", value: stats.orders, icon: ShoppingCart, link: "/admin/orders" },
    { label: "Khách hàng", value: stats.users, icon: Users, link: "/admin/users" },
    { label: "Doanh thu", value: formatVnd(stats.revenue), icon: WalletCards, link: "/admin/finance" },
    { label: "Lợi nhuận", value: formatVnd(stats.profit), icon: TrendingUp, link: "/admin/finance" },
    { label: "Công nợ", value: formatVnd(stats.unpaid), icon: AlertTriangle, link: "/admin/finance" },
  ]

  const quickActions = [
    { label: "Thêm sản phẩm", to: "/admin/products/new", icon: Package },
    { label: "Thêm danh mục", to: "/admin/categories/new", icon: Plus },
    { label: "Thêm Banner", to: "/admin/banners/new", icon: ImageIcon },
    { label: "Cấu hình tìm kiếm", to: "/admin/search", icon: SearchCheck },
  ]

  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Tổng quan</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" /> Bảng điều khiển
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Theo dõi sản phẩm, đơn hàng và các dịch vụ vận hành chính của hệ thống.</p>
          </div>
          
        </div>
      </AdminHeaderPortal>
      <div className="mb-6 flex justify-end">
        <Link to="/admin/orders" className="admin-button-primary px-5 py-3 text-sm">
            Xem đơn hàng
            <ArrowUpRight className="h-4 w-4" />
          </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => (
          <Link key={card.label} to={card.link} className="admin-card group p-5 transition hover:-translate-y-0.5 hover:border-primary/45">
            <div className="mb-5 flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1e7] text-primary">
                <card.icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#b09c84] transition group-hover:text-primary" />
            </div>
            <p className="text-3xl font-extrabold text-[#3e3528]">{card.value}</p>
            <p className="product-meta mt-1 text-sm">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="admin-card p-6">
          <h2 className="section-title mb-4 text-[20px]">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="admin-button-secondary px-4 py-3 text-sm">
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="admin-card p-6">
          <h2 className="section-title mb-4 text-[20px]">Tổng quan doanh thu</h2>
          <div className="space-y-3 text-sm text-[#766957]">
            <p><span className="font-bold text-[#43382b]">Đơn hôm nay:</span> {stats.ordersToday}</p>
            <p><span className="font-bold text-[#43382b]">AOV:</span> {formatVnd(stats.avgOrderValue)}</p>
            <p><span className="font-bold text-[#43382b]">Biên LN trung bình:</span> {stats.revenue > 0 ? Math.round((stats.profit / stats.revenue) * 100) : 0}%</p>
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-[#43382b]">Trạng thái đơn:</span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(stats.status).length > 0 ? (
                  Object.entries(stats.status).map(([k, v]) => (
                    <span key={k} className="bg-[#fff1e7] text-[#b09c84] px-2 py-0.5 rounded-md text-xs border border-[#efe4d4]">
                      {k}: <strong className="text-primary">{v}</strong>
                    </span>
                  ))
                ) : (
                  <span>N/A</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="admin-card p-6">
          <h2 className="section-title mb-4 text-[20px]">Sản phẩm bán chạy</h2>
          <div className="space-y-2">
            {stats.topProducts.length === 0 && <p className="text-sm text-[#8a7a67]">Chưa có dữ liệu</p>}
            {stats.topProducts.map((p) => (
              <div key={p.title} className="flex items-center justify-between rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm">
                <span className="font-semibold text-[#43382b]">{p.title}</span>
                <span className="text-[#8a7a67]">{p.qty} sp • {formatVnd(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card p-6">
          <h2 className="section-title mb-4 text-[20px]">Doanh thu 7 ngày qua</h2>
          <div className="space-y-2">
            {stats.revenue7d.length === 0 && <p className="text-sm text-[#8a7a67]">Chưa có dữ liệu</p>}
            {stats.revenue7d.map((d) => (
              <div key={d.date} className="flex items-center justify-between rounded-2xl bg-[#fffaf4] px-4 py-3 text-sm">
                <span className="font-semibold text-[#43382b]">{d.date}</span>
                <span className="text-[#8a7a67]">{formatVnd(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="admin-card p-6 lg:col-span-2">
          <h2 className="section-title mb-4 text-[20px]">Trạng thái hệ thống</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "MeiliSearch", value: services.online || services.enabled ? `Online, ${services.indexed_documents} docs` : "Chế độ dự phòng", icon: SearchCheck },
              { label: "Lưu trữ hình ảnh", value: services.object_storage ? "MinIO" : "Lưu trữ nội bộ", icon: ImageIcon },
              { label: "Chatbot", value: "FAQ + catalog", icon: Bot },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#efe4d4] bg-[#fffaf4] p-4">
                <item.icon className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-bold text-[#43382b]">{item.label}</p>
                <p className="product-meta mt-1 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
