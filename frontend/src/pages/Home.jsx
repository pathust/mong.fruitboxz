import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react'
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
  const [isHeroPaused, setIsHeroPaused] = useState(false)

  const [categoryData, setCategoryData] = useState([])
  const defaultBanner = {
    title: 'Trái cây tươi theo mùa',
    subtitle: 'Chọn nhanh hộp trái cây, quà tặng và món cắt sẵn được chuẩn bị mỗi ngày.',
    image: '/mong_logo-removebg.png',
    link: '/products'
  }
  const heroSlides = banners.length > 0 ? banners : [defaultBanner]
  const normalizedActiveBanner = activeBanner % heroSlides.length
  const currentBanner = heroSlides[normalizedActiveBanner] || defaultBanner
  const hasMultipleBanners = heroSlides.length > 1

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
    if (!hasMultipleBanners || isHeroPaused) return
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [hasMultipleBanners, heroSlides.length, isHeroPaused])

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

  const goToBanner = (index) => {
    setActiveBanner((index + heroSlides.length) % heroSlides.length)
  }

  return (
    <div>
      <section
        className="relative overflow-hidden border-b border-[#f0e6d4] bg-[#fffaf4]"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
      >
        <div className="max-w-[1240px] mx-auto px-4 py-8 sm:py-10 md:py-14 lg:py-16 relative z-10 w-full">
          <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-8 lg:gap-12 items-center">
            <div className="relative z-10 flex flex-col justify-center animate-fadeIn">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#f0e6d4] text-primary text-[11px] uppercase mb-5 font-bold rounded-full w-fit shadow-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Tươi mỗi ngày
              </span>

              <div className={`relative mb-2 ${hasMultipleBanners ? 'min-h-[210px] sm:min-h-[230px] lg:min-h-[250px]' : ''}`}>
                {heroSlides.map((banner, idx) => {
                  const title = banner.title?.trim() || defaultBanner.title
                  const subtitle = banner.subtitle?.trim() || defaultBanner.subtitle
                  return (
                    <div
                      key={banner.id || idx}
                      className={`transition-all duration-700 ease-out ${idx === normalizedActiveBanner ? 'relative opacity-100 translate-y-0 z-10' : 'absolute inset-x-0 top-0 opacity-0 translate-y-3 z-0 pointer-events-none'}`}
                      aria-hidden={idx !== normalizedActiveBanner}
                    >
                      <h1 className="page-title text-[38px] sm:text-[46px] md:text-[56px] lg:text-[64px] leading-[1.08] text-[#2f2a24] max-w-[660px]">
                        {title}
                      </h1>
                      <p className="product-meta mt-5 text-[15px] sm:text-[16px] md:text-[18px] leading-relaxed text-[#5a4e3d] max-w-[600px]">
                        {subtitle}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 relative z-20">
                <Link to={(currentBanner?.link || defaultBanner.link)} className="btn-glow min-h-12 px-7 py-3 rounded-full bg-gradient-to-r from-[#ea5a2a] to-[#d44a1e] text-white text-[15px] font-bold shadow-lg shadow-primary/30 inline-flex items-center justify-center gap-2">
                  {t('heroCtaBuy')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/categories" className="min-h-12 px-7 py-3 rounded-full bg-white border border-[#eadfcd] text-[#5b4a39] text-[15px] font-bold transition-all hover:bg-[#fcf6ed] hover:shadow-md inline-flex items-center justify-center gap-2">
                  {t('heroCtaExplore')}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-6 flex overflow-x-auto scrollbar-hide gap-2.5 max-w-[660px] pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
                {[
                  { icon: BadgeCheck, label: 'Trái cây chọn lọc' },
                  { icon: Clock, label: 'Sơ chế trong ngày' },
                  { icon: Sparkles, label: 'Quà tặng chỉn chu' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex min-w-max items-center gap-2 rounded-xl border border-[#eadfcd] bg-white px-3 py-2 text-[13px] font-bold text-[#5b4a39] shadow-sm sm:min-w-0">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {hasMultipleBanners && (
                <div className="flex items-center gap-3 mt-7">
                  <button onClick={() => goToBanner(normalizedActiveBanner - 1)} className="h-10 w-10 rounded-full border border-[#eadfcd] bg-white text-[#5b4a39] transition-all hover:bg-[#fcf6ed] hover:text-primary flex items-center justify-center" aria-label="Previous slide">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="flex gap-2.5">
                    {heroSlides.map((_, idx) => (
                      <button key={idx} onClick={() => goToBanner(idx)} className={`h-3 rounded-full transition-all duration-300 ease-out ${idx === normalizedActiveBanner ? 'w-10 bg-primary shadow-sm' : 'w-3 bg-[#d1baa0]/60 hover:bg-[#d1baa0]'}`} aria-label={`Go to slide ${idx + 1}`} />
                    ))}
                  </div>
                  <button onClick={() => goToBanner(normalizedActiveBanner + 1)} className="h-10 w-10 rounded-full border border-[#eadfcd] bg-white text-[#5b4a39] transition-all hover:bg-[#fcf6ed] hover:text-primary flex items-center justify-center" aria-label="Next slide">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex justify-center animate-product-hero">
              <div className="relative w-full overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_28px_70px_-46px_rgba(76,47,22,0.55)] aspect-[4/3] sm:aspect-[16/10] lg:aspect-[5/4]">
                {heroSlides.map((banner, idx) => {
                  const image = banner.image || defaultBanner.image
                  const isDefaultImage = image === defaultBanner.image
                  return (
                    <img
                      key={banner.id || idx}
                      src={image}
                      alt={banner.title || defaultBanner.title}
                      className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${idx === normalizedActiveBanner ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.02] z-0'} ${isDefaultImage ? 'object-contain p-10 bg-white' : 'object-cover'}`}
                    />
                  )
                })}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/35 via-black/10 to-transparent p-4 sm:p-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-2 text-[12px] font-bold text-[#3a3126] shadow-lg backdrop-blur-md">
                    <BadgeCheck className="h-4 w-4 text-[#10b981]" aria-hidden="true" />
                    Tươi mới 100% · Giao hàng nhanh
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
