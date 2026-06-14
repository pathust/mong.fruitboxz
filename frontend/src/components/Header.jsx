import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle, Search, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useCatalog } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCategories, setShowCategories] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchHits, setSearchHits] = useState([])
  const { cart } = useCart()
  const { customer, logout } = useAuth()
  const { lang, setLang, t } = useLanguage()
  const { categories } = useCatalog()
  const navigate = useNavigate()
  const deferredSearchQuery = useDeferredValue(searchQuery.trim())
  const menuCategories = useMemo(
    () => categories.slice(0, 12).map((c) => ({ slug: c.slug, label: c.displayName || c.name })),
    [categories]
  )

  const adminUserStr = localStorage.getItem("admin_user")
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null
  const displayUser = customer || adminUser

  const isAdminAuth = !!localStorage.getItem("admin_token")

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setMenuOpen(false)
  }
  const links = [
    { to: '/', label: t('home') },
    { to: '/categories', label: t('categories') },
    { to: '/custom-box/hop-qua-trai-cay-tu-chon', label: t('customBox') },
    { to: '/blog', label: t('blog') },
    { to: '/about-us', label: t('about') },
    { to: '/contact', label: t('contact') },
  ]
  useEffect(() => {
    if (!searchOpen || !deferredSearchQuery) {
      return
    }
    const controller = new AbortController()
    const startLoadingTimer = window.setTimeout(() => setSearchLoading(true), 0)
    apiFetch(`/store/search?q=${encodeURIComponent(deferredSearchQuery)}&limit=6`, { signal: controller.signal })
      .then((data) => {
        startTransition(() => setSearchHits(data.hits || []))
      })
      .catch(() => setSearchHits([]))
      .finally(() => {
        if (!controller.signal.aborted) setSearchLoading(false)
      })
    return () => {
      controller.abort()
      window.clearTimeout(startLoadingTimer)
    }
  }, [deferredSearchQuery, searchOpen])
  return (
    <header className="sticky top-0 z-50 glass-panel-darker border-b border-white/40">
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="h-[78px] lg:h-[84px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <img src="/mong_logo-removebg.png" alt="Mọng" className="h-28 w-auto object-contain translate-y-2" />
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-[14px] text-[#5f5548]">
            <div className="relative" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
              <Link to="/products" className="px-4 py-2 rounded-full hover:bg-white/60 transition-all inline-flex items-center gap-1.5 font-bold hover-lift">
                {t('products')}
                <span className={`text-xs transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`}>▾</span>
              </Link>
              {showCategories && (
                <div className="absolute left-0 top-[calc(100%+8px)] w-[720px] glass-panel-darker rounded-3xl border border-white/60 shadow-2xl p-4 grid grid-cols-3 gap-2 animate-fadeIn origin-top-left">
                  {menuCategories.map((cat) => (
                    <Link key={cat.slug} to={`/categories/${cat.slug}`} className="px-4 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-white/80 hover:to-white/40 text-sm font-semibold text-[#46423d] transition-all hover:translate-x-1">
                      {cat.label}
                    </Link>
                  ))}
                  <div className="col-span-3 pt-3 mt-1 border-t border-gray-200/50">
                    <Link to="/products" className="block text-center px-4 py-3 rounded-xl bg-gradient-to-r from-[#ea5a2a]/10 to-[#d44a1e]/10 text-primary font-bold hover:from-[#ea5a2a]/20 hover:to-[#d44a1e]/20 transition-all btn-glow">
                      {t('viewAllProducts')} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="px-4 py-2 rounded-full hover:bg-white/60 transition-all font-bold hover-lift">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-[#5f5548]">
            <div className="hidden lg:flex items-center gap-1 mr-1">
              <button
                onClick={() => setLang('vi')}
                className={`h-8 px-2.5 text-xs rounded-md border ${lang === 'vi' ? 'bg-[#f0e2cc] text-[#6f5b3f] border-[#e2d0b3]' : 'border-[#e1d6c6] hover:bg-white/60'}`}
              >
                VI
              </button>
              <button
                onClick={() => setLang('en')}
                className={`h-8 px-2.5 text-xs rounded-md border ${lang === 'en' ? 'bg-[#f0e2cc] text-[#6f5b3f] border-[#e2d0b3]' : 'border-[#e1d6c6] hover:bg-white/60'}`}
              >
                EN
              </button>
            </div>
            <button onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} className="lg:hidden h-8 px-2.5 text-xs border border-[#e1d6c6] rounded-md hover:bg-white/60 font-bold">{lang.toUpperCase()}</button>
            <button onClick={() => setSearchOpen(!searchOpen)} className="h-10 w-10 rounded-full hover:bg-white/60 flex items-center justify-center transition-all hover-lift" aria-label="search">
              <Search className="h-5 w-5" />
            </button>
            <div className="h-6 w-[1px] bg-[#e6ded1] mx-1 hidden sm:block"></div>
            {displayUser ? (
              <Link to={customer ? "/account" : "/admin"} className="hidden sm:flex items-center gap-2 px-4 h-10 rounded-full hover:bg-white/60 transition-all text-sm font-bold text-[#5f5548] hover-lift" aria-label="account">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span className="max-w-[100px] truncate">{displayUser.email?.split('@')[0] || 'Tài khoản'}</span>
              </Link>
            ) : (
              <Link to="/auth/login" className="h-10 w-10 rounded-full hover:bg-white/60 transition-all hidden sm:flex items-center justify-center hover-lift" aria-label="account">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </Link>
            )}
            {displayUser && (
              <button onClick={() => {
                if (customer) logout();
                if (adminUser) {
                  localStorage.removeItem('admin_token')
                  localStorage.removeItem('admin_user')

                }
                window.location.reload();
              }} className="h-10 w-10 rounded-full hover:bg-white/60 transition-all hidden sm:flex items-center justify-center text-red-500/80 hover:text-red-600 hover-lift" aria-label="logout" title={t('logout')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
              </button>
            )}
            <Link to="/cart" className="relative h-10 w-10 rounded-full bg-gradient-to-br from-[#ea5a2a] to-[#d44a1e] text-white flex items-center justify-center transition-all hover-lift shadow-lg shadow-primary/30" aria-label="cart">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" /></svg>
              {cart.count > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 bg-black text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse-slow border-2 border-white">
                  {cart.count > 9 ? '9+' : cart.count}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden h-10 w-10 rounded-full hover:bg-white/60 flex items-center justify-center transition-all" aria-label="menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {searchOpen && (
          <div className="pb-4 animate-fadeIn">
            <form onSubmit={handleSearch} className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8a77]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full rounded-[22px] border border-[#e6ded1] bg-white px-11 py-3 text-sm text-[#41372f] shadow-[0_16px_30px_-28px_rgba(73,49,27,0.45)] focus:border-primary focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8d7d69] hover:bg-[#f7ede1]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </form>
            <div className="mt-3 overflow-hidden rounded-[24px] border border-[#eadfcd] bg-white shadow-[0_20px_44px_-32px_rgba(73,48,28,0.45)]">
              {!searchQuery ? (
                <div className="px-4 py-4">
                  <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a3907b]">Danh mục nổi bật</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {menuCategories.slice(0, 6).map((category) => (
                      <Link
                        key={category.slug}
                        to={`/categories/${category.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="rounded-full border border-[#eadfcd] bg-[#fffaf3] px-3 py-2 text-sm font-semibold text-[#675948] transition hover:border-primary hover:text-primary"
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : searchLoading ? (
                <div className="flex items-center gap-3 px-4 py-5 text-sm text-[#7d6f5f]">
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  <span>Đang tìm sản phẩm phù hợp...</span>
                </div>
              ) : (searchOpen && deferredSearchQuery ? searchHits : []).length ? (
                <div className="divide-y divide-[#f1e7da]">
                  {(searchOpen && deferredSearchQuery ? searchHits : []).map((item) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.handle}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#fff8f0]"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#f7eee1]">
                        <img src={item.thumbnail || '/images/placeholder.svg'} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#3d342c]">{item.title}</p>
                        <p className="product-meta text-[12px] text-primary">
                          {item.price_min ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price_min) : 'Xem chi tiết'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-5 text-sm text-[#7d6f5f]">
                  Không thấy sản phẩm phù hợp. Nhấn Enter để xem trang kết quả đầy đủ.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {menuOpen && (
        <div className="lg:hidden border-t border-[#e6ded1] bg-white">
          <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-auto">
            <Link to="/products" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1]">{t('products')}</Link>
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1]">
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100" />

            {isAdminAuth && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1] text-primary font-medium">Quản trị (Admin)</Link>
            )}

            {displayUser ? (
              <>
                <Link to={customer ? "/account" : "/admin"} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1] text-[#5f5548] font-medium">
                  👤 {displayUser.email?.split('@')[0] || 'Tài khoản'}
                </Link>
                <button onClick={() => {
                  if (customer) logout();
                  if (adminUser) {
                    localStorage.removeItem('admin_token')
                    localStorage.removeItem('admin_user')

                  }
                  setMenuOpen(false)
                  window.location.reload()
                }} className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#fbf7f1] text-red-500">
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1]">{t('login')}</Link>
                <Link to="/auth/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1]">{t('register')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}