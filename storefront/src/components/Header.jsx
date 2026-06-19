import { startTransition, useDeferredValue, useEffect, useMemo, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LoaderCircle, Minus, Plus, Search, Trash2, X } from 'lucide-react'
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const catTimeoutRef = useRef(null)
  const cartTimeoutRef = useRef(null)
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

  const handleCatEnter = () => {
    if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current)
    setShowCategories(true)
  }

  const handleCatLeave = () => {
    catTimeoutRef.current = setTimeout(() => setShowCategories(false), 300)
  }

  const handleCartEnter = () => {
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current)
    setCartPreviewOpen(true)
  }

  const handleCartLeave = () => {
    cartTimeoutRef.current = setTimeout(() => setCartPreviewOpen(false), 300)
  }

  const handleCartFocus = () => {
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current)
    setCartPreviewOpen(true)
  }

  useEffect(() => {
    return () => {
      if (catTimeoutRef.current) clearTimeout(catTimeoutRef.current)
      if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current)
    }
  }, [])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchHits, setSearchHits] = useState([])
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false)
  const { cart, removeItem, updateQuantity } = useCart()
  const { customer, logout } = useAuth()
  const { t } = useLanguage()
  const { categories } = useCatalog()
  const navigate = useNavigate()
  const location = useLocation()
  const deferredSearchQuery = useDeferredValue(searchQuery.trim())
  const menuCategories = useMemo(
    () => categories.slice(0, 12).map((c) => ({ slug: c.slug, label: c.displayName || c.name })),
    [categories]
  )

  const adminUserStr = localStorage.getItem("admin_user")
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null
  const displayUser = customer || adminUser

  const isAdminAuth = !!localStorage.getItem("admin_token")
  const subtotal = cart.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)
  const previewItems = cart.items.slice(-4).reverse()
  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value) || 0)
  const getCartItemLink = (item) => {
    if (item.metadata?.custom_box_slug) return `/custom-box/${item.metadata.custom_box_slug}`
    return `/products/${item.slug || item.handle || item.id}`
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setMenuOpen(false)
  }
  const links = [
    { to: '/categories', label: t('categories') },
    { to: '/custom-box/hop-qua-trai-cay-tu-chon', label: t('customBox') },
    { to: '/blog', label: t('blog') },
    { to: '/about-us', label: t('about') },
    { to: '/contact', label: t('contact') },
  ]
  const isActivePath = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }
  const navLinkClass = (to) => {
    const active = isActivePath(to)
    return [
      'relative px-4 py-2 rounded-full transition-colors duration-200 font-bold',
      'hover:bg-white/60 hover:text-primary',
      'after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-primary after:transition-opacity after:duration-200',
      active ? 'text-primary after:opacity-100' : 'after:opacity-0',
    ].join(' ')
  }
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
            <img src="/mong_logo-removebg.png" alt="Mọng" className="h-24 w-auto object-contain translate-y-1" />
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-[14px] text-[#5f5548]">
            <Link to="/" className={navLinkClass('/')}>
              {t('home')}
            </Link>
            <div className="relative" onMouseEnter={handleCatEnter} onMouseLeave={handleCatLeave}>
              <Link to="/products" className={`${navLinkClass('/products')} inline-flex items-center gap-1.5`}>
                {t('products')}
                <span className={`text-xs transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`}>▾</span>
              </Link>
              {showCategories && (
                <div className="absolute left-0 top-[calc(100%+8px)] w-[720px] bg-white rounded-3xl border border-[#eadfcd] shadow-[0_24px_70px_-34px_rgba(64,42,22,0.55)] p-4 grid grid-cols-3 gap-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left z-50">
                  {menuCategories.map((cat) => (
                    <Link key={cat.slug} to={`/categories/${cat.slug}`} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#5f5548] transition-colors hover:bg-[#fffaf4] hover:text-primary">
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
              <Link key={link.to} to={link.to} className={navLinkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-[#5f5548]">
            <button onClick={() => setSearchOpen(!searchOpen)} className="h-10 w-10 rounded-full hover:bg-white/60 flex items-center justify-center transition-all hover-card" aria-label="search">
              <Search className="h-5 w-5" />
            </button>
            <div className="h-6 w-[1px] bg-[#e6ded1] mx-1 hidden sm:block"></div>
            {displayUser ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)} 
                  className="flex h-10 items-center gap-2 rounded-full border border-[#eadfcd] bg-[#fffaf4] px-4 text-sm font-bold text-[#5f5548] shadow-[0_10px_24px_-20px_rgba(76,47,22,0.65)] transition-all hover:border-primary/45 hover:bg-white hover:text-primary hover-card" 
                  aria-label="account"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="max-w-[100px] truncate">{displayUser.email?.split('@')[0] || t('account')}</span>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 origin-top-right rounded-2xl border border-[#eadfcd] bg-white p-2 shadow-[0_24px_70px_-34px_rgba(64,42,22,0.55)] animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {t('accountNav')}
                    </div>
                    <Link 
                      to={customer ? "/account" : "/auth/login"} 
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5f5548] transition-colors hover:bg-[#fffaf4] hover:text-primary"
                    >
                      {t('accountInfo')}
                    </Link>
                    {isAdminAuth && (
                      <Link 
                        to="/admin" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#5f5548] transition-colors hover:bg-[#fffaf4] hover:text-primary"
                      >
                        {t('goToAdmin')}
                      </Link>
                    )}
                    <div className="my-1 h-[1px] w-full bg-gray-100" />
                    <button 
                      onClick={() => {
                        if (customer) logout();
                        if (adminUser) {
                          localStorage.removeItem('admin_token')
                          localStorage.removeItem('admin_user')
                        }
                        setUserMenuOpen(false)
                        window.location.reload();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth/login" className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#eadfcd] bg-[#fffaf4] text-[#5f5548] shadow-[0_10px_24px_-20px_rgba(76,47,22,0.65)] transition-all hover:border-primary/45 hover:bg-white hover:text-primary hover-card sm:flex" aria-label="account">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </Link>
            )}

            <div
              className="group/cart relative"
              onMouseEnter={handleCartEnter}
              onMouseLeave={handleCartLeave}
              onFocusCapture={handleCartFocus}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) handleCartLeave()
              }}
            >
              <Link
                to="/cart"
                className="relative h-10 w-10 rounded-full bg-gradient-to-br from-[#ea5a2a] to-[#d44a1e] text-white flex items-center justify-center transition-all hover-card shadow-lg shadow-primary/30"
                aria-label={`${t('cartTitle')} - ${cart.count}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" /></svg>
                {cart.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 bg-black text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse-slow border-2 border-white" aria-live="polite">
                    {cart.count > 9 ? '9+' : cart.count}
                  </span>
                )}
              </Link>

              <div className={`absolute right-0 top-[calc(100%+12px)] z-50 hidden w-[380px] origin-top-right rounded-3xl border border-[#eadfcd] bg-white shadow-[0_24px_70px_-34px_rgba(64,42,22,0.55)] transition-all duration-200 lg:block ${cartPreviewOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`} role="dialog" aria-label={t('Xem nhanh giỏ hàng')}>
                <div className="absolute -top-2 right-5 h-4 w-4 rotate-45 border-l border-t border-[#eadfcd] bg-white" aria-hidden="true" />
                <div className="relative overflow-hidden rounded-3xl">
                  <div className="flex items-center justify-between border-b border-[#f1e7da] bg-[#fffaf4] px-5 py-4">
                    <div>
                      <p className="text-sm font-extrabold text-[#43382b]">{t('cartTitle')}</p>
                      <p className="product-meta mt-0.5 text-[12px]">{cart.count} {t('sản phẩm đã thêm')}</p>
                    </div>
                    <Link to="/cart" onClick={() => setCartPreviewOpen(false)} className="text-xs font-bold text-primary hover:text-primary-dark">
                      {t('viewAllProducts')}
                    </Link>
                  </div>

                  {cart.items.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4ea] text-primary">
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      </div>
                      <p className="font-bold text-[#43382b]">{t('emptyCart')}</p>
                      <p className="product-meta mt-1 text-[12px]">{t('emptyCartSub')}</p>
                      <Link to="/products" onClick={() => setCartPreviewOpen(false)} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark">
                        {t('Mua sắm ngay')}
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[330px] overflow-y-auto">
                        {previewItems.map((item) => (
                          <div key={item.id} className="flex gap-3 border-b border-[#f7eee2] px-5 py-4 last:border-b-0">
                            <Link to={getCartItemLink(item)} onClick={() => setCartPreviewOpen(false)} className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#f7eee1]">
                              <img src={item.image || '/mong_logo-removebg.png'} alt={item.title} className="h-full w-full object-cover" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/mong_logo-removebg.png' }} />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <div className="flex gap-2">
                                <Link to={getCartItemLink(item)} onClick={() => setCartPreviewOpen(false)} className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-[#3f352b] hover:text-primary">
                                  {item.title}
                                </Link>
                                <button type="button" onClick={() => removeItem(item.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#b74b2c] transition hover:bg-[#fff1ea]" aria-label={`${t('Xóa')} ${item.title}`}>
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              {item.variantLabel && <p className="product-meta mt-1 text-[11px]">{item.variantLabel}</p>}
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <div className="flex h-8 items-center overflow-hidden rounded-full border border-[#eadfcd] bg-[#fffaf4]">
                                  <button type="button" onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)} className="flex h-full w-8 items-center justify-center text-[#6c5b49] hover:text-primary" aria-label={t('Giảm số lượng')}>
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="min-w-7 text-center text-xs font-bold text-[#43382b]">{item.quantity}</span>
                                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex h-full w-8 items-center justify-center text-[#6c5b49] hover:text-primary" aria-label={t('Tăng số lượng')}>
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <p className="text-[11px] font-semibold text-[#9a8b79]">{formatCurrency(item.price)} / {t('món')}</p>
                                  <p className="product-price text-sm text-primary">{formatCurrency(item.price * item.quantity)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-[#eadfcd] bg-[#fffaf4] px-5 py-4">
                        <div className="mb-3 flex items-end justify-between">
                          <span className="product-meta text-sm font-bold text-[#5d5246]">{t('subtotal')}</span>
                          <span className="product-price text-[20px] text-primary">{formatCurrency(subtotal)}</span>
                        </div>
                        <p className="mb-4 text-[12px] font-medium text-[#8b7b68]">{t('Giỏ hàng chỉ để xem và chỉnh món. Đặt hàng sẽ tiếp tục ở bước thanh toán.')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Link to="/cart" onClick={() => setCartPreviewOpen(false)} className="flex min-h-11 items-center justify-center rounded-full border border-[#dfcfba] bg-white text-sm font-bold text-[#5d5246] transition hover:border-primary hover:text-primary">
                            {t('viewCart')}
                          </Link>
                          <Link to="/checkout" onClick={() => setCartPreviewOpen(false)} className="flex min-h-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark">
                            {t('checkout')}
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
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
                  <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a3907b]">{t('searchFeatured')}</p>
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
                  <span>{t('searchSearching')}</span>
                </div>
              ) : (searchOpen && deferredSearchQuery ? searchHits : []).length ? (
                <div className="divide-y divide-[#f1e7da]">
                  {(searchOpen && deferredSearchQuery ? searchHits : []).map((item) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.slug || item.handle || item.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-[#fff8f0]"
                    >
                      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#f7eee1]">
                        <img src={item.thumbnail || '/media/placeholder.svg'} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#3d342c]">{item.title}</p>
                        <p className="product-meta text-[12px] text-primary">
                          {item.price_min ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price_min) : t('viewDetail')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-5 text-sm text-[#7d6f5f]">
                  {t('searchNotFound')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {menuOpen && (
        <div className="lg:hidden border-t border-[#e6ded1] bg-white">
          <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-auto">
            <Link to="/" onClick={() => setMenuOpen(false)} className={`block px-3 py-2 rounded-lg hover:bg-[#fbf7f1] ${isActivePath('/') ? 'text-primary underline underline-offset-4 decoration-2' : ''}`}>{t('home')}</Link>
            <Link to="/products" onClick={() => setMenuOpen(false)} className={`block px-3 py-2 rounded-lg hover:bg-[#fbf7f1] ${isActivePath('/products') ? 'text-primary underline underline-offset-4 decoration-2' : ''}`}>{t('products')}</Link>
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className={`block px-3 py-2 rounded-lg hover:bg-[#fbf7f1] ${isActivePath(link.to) ? 'text-primary underline underline-offset-4 decoration-2' : ''}`}>
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100" />

            {isAdminAuth && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1] text-primary font-medium">{t('adminNav')}</Link>
            )}

            {displayUser ? (
              <>
                <Link to={customer ? "/account" : "/admin"} onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-[#fbf7f1] text-[#5f5548] font-medium">
                  👤 {displayUser.email?.split('@')[0] || t('account')}
                </Link>

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
