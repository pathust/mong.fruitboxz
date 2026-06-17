import { useState } from "react"
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom"
import { Bot, Boxes, ExternalLink, FileText, FolderKanban, Gauge, Gift, Image as ImageIcon, Info, LayoutTemplate, LogOut, Mail, Menu, Package, ScanSearch, Settings, Shield, ShoppingCart, Star, Users, X, WalletCards, Tag, Truck, Calculator, Leaf } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"

const navGroups = [
  {
    label: "Operate",
    items: [
      { label: "Dashboard", path: "/admin", icon: Gauge, permission: null },
      { label: "Finance", path: "/admin/finance", icon: WalletCards, permission: null },
      { label: "Orders", path: "/admin/orders", icon: ShoppingCart, permission: "orders.read" },
      { label: "Products", path: "/admin/products", icon: Package, permission: "products.read" },
      { label: "Ingredients", path: "/admin/ingredients", icon: Leaf, permission: "products.read" },
      { label: "Inventory", path: "/admin/inventory", icon: Package, permission: "products.read" },
      { label: "Categories", path: "/admin/categories", icon: FolderKanban, permission: "categories.read" },
      { label: "Promotions", path: "/admin/promotions", icon: Tag, permission: "products.read" },
      { label: "Banners", path: "/admin/banners", icon: LayoutTemplate, permission: "banners.read" },
    ],
  },
  {
    label: "Experience",
    items: [
      { label: "Media", path: "/admin/media", icon: ImageIcon, permission: "media.read" },
      { label: "Search", path: "/admin/search", icon: ScanSearch, permission: "search.read" },
      { label: "Chatbot", path: "/admin/chatbot", icon: Bot, permission: "chatbot.read" },
      { label: "Reviews", path: "/admin/reviews", icon: Star, permission: "reviews.read" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Bài viết Blog", path: "/admin/blog", icon: FileText, permission: "settings.read" },
      { label: "Danh mục Blog", path: "/admin/blog-categories", icon: FolderKanban, permission: "settings.read" },
      { label: "Trang Blog", path: "/admin/content/blog", icon: LayoutTemplate, permission: "settings.read" },
      { label: "Về chúng tôi", path: "/admin/content/about", icon: Info, permission: "settings.read" },
      { label: "Liên hệ", path: "/admin/content/contact", icon: Mail, permission: "settings.read" },
      { label: "Hộp tự chọn", path: "/admin/content/custom-box", icon: Gift, permission: "settings.read" },
    ],
  },
  {
    label: "Configure",
    items: [
      { label: "Settings", path: "/admin/settings", icon: Settings, permission: "settings.read" },
      { label: "Shipping", path: "/admin/settings/shipping", icon: Truck, permission: "settings.read" },
      { label: "Costs", path: "/admin/settings/costs", icon: Calculator, permission: "settings.read" },
    ],
  },
  {
    label: "Access",
    items: [
      { label: "Users", path: "/admin/users", icon: Users, permission: "users.read" },
      { label: "Roles", path: "/admin/roles", icon: Shield, permission: "roles.read" },
      { label: "Permissions", path: "/admin/permissions", icon: Boxes, permission: "permissions.read" },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/admin/login")
  }

  return (
    <div className="admin-surface flex h-screen overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#eadfcd] bg-[#fffaf3]/95 shadow-[28px_0_60px_-48px_rgba(71,45,21,0.55)] backdrop-blur-xl transition-all duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:w-20 w-72" : "w-72"}`}>
        <div className={`flex items-center border-b border-[#eadfcd] p-5 ${isCollapsed ? "lg:justify-center justify-between" : "justify-between"}`}>
          <Link to="/admin" className={`flex min-w-0 items-center gap-3 ${isCollapsed ? "lg:justify-center" : ""}`}>
            <img src="/mong_logo-removebg.png" alt="Mọng" className={`h-12 w-auto object-contain ${isCollapsed ? "lg:mx-auto" : ""}`} />
            <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-extrabold text-primary">Mọng Admin</p>
              <p className="truncate text-xs font-semibold text-[#8a7a67]">Fresh fruit operations</p>
            </div>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#766957] transition hover:bg-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto p-4 pb-28">
          {navGroups.map((group) => {
            const visibleItems = group.items
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <p className={`mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ad9b86] ${isCollapsed ? "lg:hidden" : ""}`}>{group.label}</p>
                <div className="space-y-1">
                  {visibleItems.map(item => {
                    const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/")
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={isCollapsed ? item.label : undefined}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center rounded-2xl py-3 text-sm font-bold transition-all ${isCollapsed ? "lg:justify-center lg:px-0 px-4 gap-3" : "gap-3 px-4"} ${active ? "bg-white text-primary shadow-[0_16px_34px_-26px_rgba(234,90,42,0.85)]" : "text-[#5d5246] hover:bg-white/75 hover:text-[#3f352b]"}`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className={`truncate ${isCollapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#eadfcd] bg-[#fffaf3]/95 p-4 backdrop-blur">
          <div className={`flex items-center ${isCollapsed ? "lg:justify-center lg:px-2" : "justify-between"} justify-between rounded-[18px] bg-white px-4 py-3 shadow-[0_14px_30px_-26px_rgba(84,58,30,0.4)]`}>
            <div className={`text-sm min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
              <p className="truncate font-bold text-[#4d4339]">{user?.email}</p>
              <p className="text-xs font-semibold text-[#9b8975]">Admin session</p>
            </div>
            <button type="button" onClick={handleLogout} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#c7643a] transition hover:bg-[#fff1ea]">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-[#2c2018]/25 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 sticky top-0 z-30 flex items-center gap-4 border-b border-[#eadfcd] bg-[#fffaf4]/86 px-4 py-4 backdrop-blur-xl lg:px-6">
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfcd] bg-white text-[#5d5246] lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <button type="button" className="hidden lg:inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfcd] bg-white text-[#5d5246] hover:bg-gray-50 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-[#4d4339]">Store operations</p>
            <p className="text-xs font-semibold text-[#8d7f6f]">Catalog, orders, media, search, chatbot, and shipping controls</p>
          </div>
          <Link to="/" className="admin-button-secondary hidden px-4 py-2 text-xs sm:inline-flex">
            <ExternalLink className="h-3.5 w-3.5" />
            Storefront
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
