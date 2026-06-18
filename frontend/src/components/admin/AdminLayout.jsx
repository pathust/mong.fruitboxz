import { useState, useRef, useEffect } from "react"
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom"
import { ChevronLeft, ChevronRight, Languages, Bot, Boxes, ExternalLink, FileText, FolderKanban, Gauge, Gift, Image as ImageIcon, Info, LayoutTemplate, LogOut, Mail, Menu, Package, ScanSearch, Settings, Shield, ShoppingCart, Star, Users, X, WalletCards, Tag, Truck, Calculator, Leaf, Search, MessageSquare } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"

const navGroups = [
  {
    label: "Vận hành",
    items: [
      { label: "Tổng quan", path: "/admin", icon: Gauge, permission: null },
      { label: "Tài chính", path: "/admin/finance", icon: WalletCards, permission: null },
      { label: "Đơn hàng", path: "/admin/orders", icon: ShoppingCart, permission: "orders.read" },
      { label: "Sản phẩm", path: "/admin/products", icon: Package, permission: "products.read" },
      { label: "Nguyên liệu", path: "/admin/ingredients", icon: Leaf, permission: "products.read" },
      { label: "Tồn kho", path: "/admin/inventory", icon: Package, permission: "products.read" },
      { label: "Danh mục", path: "/admin/categories", icon: FolderKanban, permission: "categories.read" },
      { label: "Khuyến mãi", path: "/admin/promotions", icon: Tag, permission: "products.read" },
      { label: "Hộp tự chọn", path: "/admin/content/custom-box", icon: Gift, permission: "settings.read" },
      { label: "Banners", path: "/admin/banners", icon: LayoutTemplate, permission: "banners.read" },
    ],
  },
  {
    label: "Trải nghiệm",
    items: [
      { label: "Thư viện ảnh", path: "/admin/media", icon: ImageIcon, permission: "media.read" },
      { label: "Chatbot", path: "/admin/chatbot", icon: Bot, permission: "chatbot.read" },

    ],
  },
  {
    label: "Nội dung",
    items: [
      { label: "Bài viết Blog", path: "/admin/blog", icon: FileText, permission: "settings.read" },
      { label: "Danh mục Blog", path: "/admin/blog-categories", icon: FolderKanban, permission: "settings.read" },
      { label: "CS Thanh toán", path: "/admin/content/payment-policy", icon: FileText, permission: "orders.read" },
      { label: "CS Bảo mật", path: "/admin/content/privacy-policy", icon: Shield, permission: "orders.read" },
      { label: "CS Vận chuyển", path: "/admin/content/shipping-policy", icon: Truck, permission: "orders.read" },
    ],
  },
  {
    label: "Cấu hình hệ thống",
    items: [
      { label: "Cài đặt phí ship", path: "/admin/settings/shipping", icon: Truck, permission: "users.read" },
      { label: "Cài đặt định mức Cost", path: "/admin/settings/costs", icon: Calculator, permission: "users.read" },
      { label: "Cấu hình Tìm kiếm", path: "/admin/search", icon: Search, permission: "users.read" },
      { label: "Cài đặt chung", path: "/admin/settings", icon: Settings, permission: "users.read" },
    ],
  },
  {
    label: "Phân quyền",
    items: [
      { label: "Quản trị viên", path: "/admin/users", icon: Users, permission: "users.read" },
      { label: "Phân quyền", path: "/admin/roles", icon: Shield, permission: "roles.read" },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout, hasPermission } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/admin/login")
  }

  return (
    <div className="admin-surface flex h-screen overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#eadfcd] bg-[#fffaf3]/95 shadow-[28px_0_60px_-48px_rgba(71,45,21,0.55)] backdrop-blur-xl transition-all duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:w-20 w-72" : "w-72"}`}>
        {/* Desktop Sidebar Toggle Button */}
        <button 
          type="button" 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="hidden lg:flex absolute -right-3.5 top-7 h-7 w-7 items-center justify-center rounded-full border border-[#eadfcd] bg-white text-[#5d5246] shadow-sm hover:bg-gray-50 hover:text-primary transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className={`flex items-center border-b border-[#eadfcd] p-5 ${isCollapsed ? "lg:justify-center justify-between" : "justify-between"}`}>
          <Link to="/admin" className={`flex min-w-0 items-center gap-3 ${isCollapsed ? "lg:justify-center" : ""}`}>
            <img src="/mong_logo-removebg.png" alt="Mọng" className={`h-12 w-auto object-contain ${isCollapsed ? "lg:mx-auto" : ""}`} />
            <div className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-extrabold text-primary">Mọng Admin</p>
              <p className="truncate text-xs font-semibold text-[#8a7a67]">Quản lý cửa hàng</p>
            </div>
          </Link>
          <button type="button" onClick={() => setSidebarOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#766957] transition hover:bg-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto p-4 pb-28">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => !item.permission || hasPermission(item.permission))
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <p className={`mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#ad9b86] ${isCollapsed ? "lg:hidden" : ""}`}>{group.label}</p>
                <div className="space-y-1">
                  {visibleItems.map(item => {
                    const active = item.path === "/admin" 
                      ? location.pathname === "/admin" 
                      : (location.pathname === item.path || location.pathname.startsWith(item.path + "/"))
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
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-[#2c2018]/25 backdrop-blur-[2px] lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 sticky top-0 z-30 flex items-center gap-4 border-b border-[#eadfcd] bg-[#fffaf4]/86 px-4 py-4 backdrop-blur-xl lg:px-6">
          <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eadfcd] bg-white text-[#5d5246] lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          
          <div id="admin-header-portal" className="flex-1 flex items-center justify-between min-w-0">
            {/* Pages will inject their header here */}
            <div className="hidden empty:block">
              <p className="text-sm font-extrabold text-[#4d4339]">Trang quản trị</p>
              <p className="text-xs font-semibold text-[#8d7f6f]">Quản lý hệ thống</p>
            </div>
          </div>
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)} 
              className="flex h-10 items-center gap-2 rounded-full border border-[#eadfcd] bg-[#fffaf4] px-4 text-sm font-bold text-[#5f5548] shadow-[0_10px_24px_-20px_rgba(76,47,22,0.65)] transition-all hover:border-primary/45 hover:bg-white hover:text-primary hover-card" 
            >
              <Users className="w-5 h-5 text-primary" />
              <span className="max-w-[100px] truncate">{user?.email?.split('@')[0] || 'Quản trị'}</span>
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 origin-top-right rounded-2xl border border-[#eadfcd] bg-white p-2 shadow-[0_24px_70px_-34px_rgba(64,42,22,0.55)] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Thông tin tài khoản
                </div>
                <div className="px-3 pb-2 text-sm text-gray-600 truncate font-medium">
                  {user?.email}
                </div>
                <div className="my-1 h-[1px] w-full bg-gray-100" />
                <Link 
                  to="/" 
                  onClick={() => setUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5f5548] transition-colors hover:bg-[#fffaf4] hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  Storefront
                </Link>
                <div className="my-1 h-[1px] w-full bg-gray-100" />
                <button 
                  onClick={() => {
                    setUserMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
