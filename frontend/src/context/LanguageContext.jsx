/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)

const translations = {
  vi: {
    home: 'Trang chủ', products: 'Sản phẩm', categories: 'Danh mục', customBox: 'Hộp tự chọn', blog: 'Blog', about: 'Về chúng tôi', contact: 'Liên hệ',
    account: 'Tài khoản', logout: 'Đăng xuất', login: 'Đăng nhập', register: 'Đăng ký',
    searchPlaceholder: 'Tìm kiếm trái cây, hộp quà...',
    viewMore: 'Xem thêm', viewAllProducts: 'Xem tất cả sản phẩm',
    categorySectionSub: 'Danh sách nhóm sản phẩm', featuredSectionSub: 'Sản phẩm nổi bật hôm nay',
    heroCtaBuy: 'Mua ngay', heroCtaExplore: 'Khám phá', heroCtaCustomize: 'Tự chọn ngay',
    quickLinks: 'Liên kết nhanh', support: 'Hỗ trợ khách hàng', followUs: 'Theo dõi chúng tôi', newsletter: 'Đăng ký nhận tin',
    allRights: 'Tất cả quyền được bảo lưu.'
  },
  en: {
    home: 'Home', products: 'Products', categories: 'Categories', customBox: 'Custom Box', blog: 'Blog', about: 'About Us', contact: 'Contact',
    account: 'Account', logout: 'Logout', login: 'Login', register: 'Register',
    searchPlaceholder: 'Search fruits, gift boxes...',
    viewMore: 'View More', viewAllProducts: 'View all products',
    categorySectionSub: 'Product collections', featuredSectionSub: 'Featured products today',
    heroCtaBuy: 'Shop now', heroCtaExplore: 'Explore', heroCtaCustomize: 'Customize now',
    quickLinks: 'Quick Links', support: 'Customer Support', followUs: 'Follow Us', newsletter: 'Newsletter',
    allRights: 'All rights reserved.'
  },
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'vi')

  useEffect(() => {
    localStorage.setItem('lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({
    lang,
    setLang,
    t: (key) => translations[lang]?.[key] || translations.vi[key] || key,
  }), [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}