import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function Footer() {
  const { t } = useLanguage()
  const { settings } = useSiteSettings()
  const siteSettings = settings || {}

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr_1fr_1.5fr] lg:pl-6">
          {/* Column 1 - About */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/mong_logo-removebg.png" alt="Mọng" className="h-14 w-auto object-contain" />
              <div>
                <span className="text-lg font-bold text-white">{siteSettings.site_name}</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              {siteSettings.footer_about}
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {siteSettings.address}
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {siteSettings.phone}
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {siteSettings.email}
              </p>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{t('quickLinks')}</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: t('home') },
                { to: '/products', label: t('products') },
                { to: '/categories', label: t('categories') },
                { to: '/blog', label: t('blog') },
                { to: '/about-us', label: t('about') },
                { to: '/contact', label: t('contact') },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Customer Support */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{t('support')}</h3>
            <ul className="space-y-2">
              {[
                { to: '/shipping-policy', label: t('Chính sách giao hàng') },
                { to: '/payment-policy', label: t('Chính sách thanh toán') },
                { to: '/privacy-policy', label: t('Chính sách bảo mật') },
                { to: '/order-history', label: t('Tra cứu đơn hàng') },
                { to: '/contact', label: t('contact') },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Social + Newsletter */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{t('followUs')}</h3>
            <div className="flex gap-3 mb-6">
              {siteSettings.instagram && <a href={siteSettings.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-500 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>}
              {siteSettings.tiktok && <a href={siteSettings.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gray-700 hover:bg-black rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>}
            </div>

            <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider">{t('newsletter')}</h3>
            <form onSubmit={e => e.preventDefault()} className="flex">
              <input
                type="email"
                placeholder={t('Email của bạn...')}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-md text-white text-sm placeholder-gray-400 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-r-md hover:bg-primary-dark transition-colors"
              >
                {t('Đăng ký')}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Mọng. {t('allRights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
