import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { useCatalog, mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'

function HomeMiniCard({ product, onAdd }) {
  const image = product.thumbnail || product.images?.[0] || '/images/58645746-dfac-4e9f-8914-649ea9576caf.jpeg'
  const price = product.variants?.[0]?.price ?? product.price ?? null
  const hasPrice = typeof price === 'number' && price > 0
  const originalPrice = product.variants?.[0]?.prices?.[1]?.amount || null
  const discount = product.discount || (originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0)

  return (
    <article className="group glass-panel rounded-2xl p-3 transition-all hover-lift flex flex-col h-full bg-white/60">
      <Link to={`/products/${product.handle || product.id}`} className="block relative overflow-hidden rounded-xl aspect-[4/5] bg-gradient-to-br from-[#f8f4ed] to-[#fffaf3]">
        <img src={image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        {discount > 0 && <span className="absolute left-2 top-2 text-[10px] font-bold gradient-badge px-2.5 py-1 rounded-full shadow-sm">-{discount}%</span>}
        {!hasPrice && <span className="absolute right-2 top-2 text-[10px] font-semibold bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-full">Hết hàng</span>}
      </Link>
      <div className="flex flex-col flex-1 mt-3">
        <Link to={`/products/${product.handle || product.id}`}>
          <h3 className="product-title text-[13px] md:text-[14px] leading-[1.3] text-[#3f3a34] line-clamp-2 min-h-[2.6rem] transition-colors group-hover:text-primary">{product.title}</h3>
        </Link>
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div className="flex flex-col">
             <span className={`product-price text-[14px] md:text-[15px] ${hasPrice ? 'text-primary' : 'text-gray-400'}`}>
              {hasPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'Liên hệ'}
             </span>
             {hasPrice && originalPrice && originalPrice > price && (
               <span className="product-meta text-[11px] text-gray-400 line-through">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}</span>
             )}
          </div>
          <button disabled={!hasPrice} onClick={() => onAdd(product, image, price)} className="h-8 w-8 rounded-full bg-gradient-to-br from-[#ef6840] to-[#d44a1e] text-white text-lg flex items-center justify-center leading-none disabled:opacity-40 transition-transform hover:scale-110 active:scale-95 shadow-md shadow-primary/30">+</button>
        </div>
      </div>
    </article>
  )
}

export default function Home() {
  const { t } = useLanguage()
  const { addItem } = useCart()
  const { categories } = useCatalog()
  const [banners, setBanners] = useState([])
  const [activeBanner, setActiveBanner] = useState(0)

  const [categoryData, setCategoryData] = useState([])

  useEffect(() => {
    let mounted = true
    apiFetch('/store/custom?mode=homepage')
      .then((data) => {
        if (mounted && data?.banners?.length > 0) {
          setBanners(data.banners)
        }
      })
      .catch(() => {})

    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  useEffect(() => {
    let mounted = true

    async function loadFeatured() {
      if (!categories || categories.length === 0) return

      try {
        const prioritySlugs = ['trai-cay-cat-san', 'hop-mix-goi-y', 'hoa-qua-dam']
        const sortedCategories = [...categories].sort((a, b) => {
          const aIndex = prioritySlugs.indexOf(a.slug)
          const bIndex = prioritySlugs.indexOf(b.slug)

          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return 0
        })

        const promises = sortedCategories.map(cat =>
          apiFetch(`/store/products?limit=12&category_id[]=${cat.id}&fields=id,handle,title,thumbnail,*images,*variants,*variants.prices,*categories`)
        )
        const results = await Promise.all(promises)

        if (!mounted) return

        const newData = sortedCategories.map((cat, i) => ({
          category: cat,
          products: (results[i].products || []).map(mapProduct)
        })).filter(item => item.products.length > 0) // Only keep categories that have products

        setCategoryData(newData)
      } catch (err) {
        console.error("Failed to load featured products", err)
      }
    }

    loadFeatured()
    return () => { mounted = false }
  }, [categories])

  const addQuick = (product, image, price) => {
    if (!price) return
    addItem({
      id: product.id,
      title: product.title,
      price,
      image,
      quantity: 1,
      variantId: product.variants?.[0]?.id || null,
      productId: product.medusa_id || null,
    })
  }

  const currentBanner = banners.length > 0 ? banners[activeBanner] : null
  const defaultBanner = {
    title: 'Trái cây tươi',
    subtitle: 'theo mùa',
    image: '/mong_logo-removebg.png',
    link: '/products'
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fffaf4] via-[#fff1e0] to-[#ffe5cf] min-h-[500px] flex items-center">
        {/* Floating background elements */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-[#ffd8bc]/60 to-[#ffb680]/20 rounded-full blur-3xl float-anim" style={{ animationDelay: '0s' }}></div>
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-gradient-to-tr from-[#ffcc99]/40 to-transparent rounded-full blur-3xl float-anim" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-[1240px] mx-auto px-4 py-12 md:py-20 relative z-10 w-full">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="relative z-10 flex flex-col justify-center animate-fadeIn">
              <span className="inline-block px-3 py-1 bg-white/60 backdrop-blur-md border border-white/50 text-[#d86f4a] text-[11px] tracking-[0.18em] uppercase mb-5 font-bold rounded-full w-fit shadow-sm">Premium Quality</span>

              <div className="relative h-[120px] md:h-[160px] mb-2">
                {banners.length > 0 ? banners.map((banner, idx) => (
                  <div key={banner.id || idx} className={`absolute inset-0 transition-all duration-1000 ease-out ${idx === activeBanner ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-4 z-0 pointer-events-none'}`}>
                    <h1 className="page-title text-[46px] md:text-[68px] leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-[#3a3126] to-[#7a644f] drop-shadow-sm">{defaultBanner.title}<br /><span className="text-[#ea5a2a]">{defaultBanner.subtitle}</span></h1>
                  </div>
                )) : (
                  <div className="absolute inset-0 opacity-100 z-10">
                    <h1 className="page-title text-[46px] md:text-[68px] leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-[#3a3126] to-[#7a644f] drop-shadow-sm">{defaultBanner.title}<br /><span className="text-[#ea5a2a]">{defaultBanner.subtitle}</span></h1>
                  </div>
                )}
              </div>

              <p className="product-meta mt-2 text-[15px] md:text-[18px] leading-relaxed text-[#5a4e3d] max-w-[90%]">Trái cây nhập khẩu chuẩn vị, tươi mới mỗi ngày. Dịch vụ quà tặng cao cấp trao gửi yêu thương.</p>
              <div className="mt-8 flex gap-4 relative z-20">
                <Link to={(currentBanner?.link || defaultBanner.link)} className="btn-glow px-8 py-3.5 rounded-full bg-gradient-to-r from-[#ea5a2a] to-[#d44a1e] text-white text-[15px] font-bold shadow-lg shadow-primary/30">{t('heroCtaBuy')}</Link>
                <Link to="/categories" className="px-8 py-3.5 rounded-full glass-panel text-[#6f5b3f] text-[15px] font-bold transition-all hover:bg-white/80 hover:shadow-md">{t('heroCtaExplore')}</Link>
              </div>

              {banners.length > 1 && (
                <div className="flex gap-2.5 mt-10">
                  {banners.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveBanner(idx)} className={`h-2 rounded-full transition-all duration-500 ease-out ${idx === activeBanner ? 'w-10 bg-gradient-to-r from-[#ea5a2a] to-[#d44a1e] shadow-sm' : 'w-2 bg-[#d1baa0]/50 hover:bg-[#d1baa0]'}`} aria-label={`Go to slide ${idx + 1}`} />
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex justify-center animate-product-hero">
              <div className="relative w-full max-w-[460px] aspect-square">
                {/* Decorative circle */}
                <div className="absolute inset-0 rounded-full border border-white/40 bg-white/20 backdrop-blur-3xl animate-soft-pulse shadow-2xl shadow-[#ea5a2a]/10" />

                <div className="absolute inset-4 rounded-full overflow-hidden border-4 border-white/80 shadow-inner">
                  {banners.length > 0 ? banners.map((banner, idx) => (
                     <img key={banner.id || idx} src={banner.image} alt={banner.title} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} />
                  )) : (
                     <img src={defaultBanner.image} alt="Hero" className="w-full h-full object-cover bg-white" />
                  )}
                </div>

                {/* Floating badge */}
                <div className="absolute -right-4 top-12 glass-panel-darker px-4 py-3 rounded-2xl flex items-center gap-3 float-anim shadow-xl" style={{ animationDelay: '1s' }}>
                   <div className="bg-[#10b981] text-white p-2 rounded-full shadow-md">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <div>
                     <p className="text-[12px] font-bold text-[#3a3126]">Tươi mới 100%</p>
                     <p className="text-[10px] text-[#7a644f]">Giao hàng 2h</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categoryData.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          Đang tải sản phẩm...
        </div>
      ) : (
        categoryData.map(({ category, products }, index) => (
          <section key={category.id} className={`py-8 md:py-10 ${index % 2 === 0 ? 'bg-white' : 'bg-[#faf7f2]'}`}>
            <div className="max-w-[1240px] mx-auto px-4">
              <div className="flex items-end justify-between mb-4">
                <h2 className="section-title text-[24px] md:text-[28px]">{category.displayName || category.name}</h2>
                <Link to={`/categories/${category.slug}`} className="text-primary text-sm font-medium">{t('viewMore')} →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {products.map((p) => <HomeMiniCard key={p.id} product={p} onAdd={addQuick} />)}
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  )
}
