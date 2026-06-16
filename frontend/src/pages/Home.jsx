import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useCart } from '../context/CartContext'
import { useCatalog, mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../components/ui/carousel'

function HomeMiniCard({ product, onAdd }) {
  const image = product.thumbnail || product.images?.[0] || '/mong_logo-removebg.png'
  const price = product.variants?.[0]?.price ?? product.price ?? null
  const hasPrice = typeof price === 'number' && price > 0
  const originalPrice = product.variants?.[0]?.prices?.[1]?.amount || null
  const discount = product.discount || (originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0)
  const productSlug = product.slug || product.id

  return (
    <article className="group glass-panel rounded-2xl p-3 transition-all hover-card flex flex-col h-full bg-white/60">
      <Link to={`/products/${productSlug}`} className="block relative overflow-hidden rounded-xl aspect-[4/5] bg-gradient-to-br from-[#f8f4ed] to-[#fffaf3]">
        <img src={image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        {discount > 0 && <span className="absolute left-2 top-2 text-[10px] font-bold gradient-badge px-2.5 py-1 rounded-full shadow-sm">-{discount}%</span>}
        {!hasPrice && <span className="absolute right-2 top-2 text-[10px] font-semibold bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-full">Hết hàng</span>}
      </Link>
      <div className="flex flex-col flex-1 mt-3">
        <Link to={`/products/${productSlug}`}>
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

function HomeProductCarousel({ products, onAdd }) {
  return (
    <Carousel className="px-1 sm:px-3" opts={{ pageSize: 0.9 }}>
      <CarouselContent>
        {products.map((product) => (
          <CarouselItem key={product.id}>
            <HomeMiniCard product={product} onAdd={onAdd} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {products.length > 5 && (
        <>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </>
      )}
    </Carousel>
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
  const heroPrimaryLabel = currentBanner.link === '/about-us' ? 'Khám phá câu chuyện Mọng' : 'Xem món đặc biệt'
  const featuredProducts = categoryData
    .map(({ products }) => products[0])
    .filter(Boolean)
    .slice(0, 6)

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
    }, 6500)
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
      slug: product.slug || product.id,
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
        className="group relative isolate min-h-[520px] overflow-hidden bg-accent sm:min-h-[560px] lg:min-h-[600px]"
        onMouseEnter={() => setIsHeroPaused(true)}
        onMouseLeave={() => setIsHeroPaused(false)}
        onFocusCapture={() => setIsHeroPaused(true)}
        onBlurCapture={() => setIsHeroPaused(false)}
      >
        <div className="absolute inset-0 -z-20 bg-accent">
          {heroSlides.map((banner, idx) => {
            const image = banner.image || defaultBanner.image
            const isDefaultImage = image === defaultBanner.image
            return (
              <img
                key={banner.id || idx}
                src={image}
                alt=""
                className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-out ${idx === normalizedActiveBanner ? 'opacity-100' : 'opacity-0'} ${isDefaultImage ? 'object-contain p-16' : 'object-cover object-center'}`}
                aria-hidden="true"
              />
            )
          })}
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,250,244,0.94)_0%,rgba(255,250,244,0.80)_34%,rgba(255,250,244,0.16)_62%,rgba(255,250,244,0)_100%)]" />

        <div className="mx-auto flex min-h-[520px] w-full max-w-[1240px] items-end px-4 pb-16 pt-24 sm:min-h-[560px] sm:items-center sm:py-20 lg:min-h-[600px]">
          <div className="w-full max-w-[620px]" aria-live="polite">
            <div className="grid gap-4 sm:gap-5">
              <h1 className="line-clamp-3 min-h-[124px] font-['Quicksand','Segoe_UI',sans-serif] text-[38px] font-extrabold leading-[1.08] text-[#3a3126] sm:min-h-[142px] sm:text-[48px] lg:min-h-[188px] lg:text-[58px]">
                {currentBanner.title?.trim() || defaultBanner.title}
              </h1>
              <p className="line-clamp-3 min-h-[72px] max-w-[540px] font-['Quicksand','Segoe_UI',sans-serif] text-[15px] font-medium leading-relaxed text-[#695b49] sm:min-h-[78px] sm:text-[17px]">
                {currentBanner.subtitle?.trim() || defaultBanner.subtitle}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link to={(currentBanner?.link || defaultBanner.link)} className="btn-glow min-h-12 px-7 py-3 rounded-full bg-primary text-white text-[15px] font-bold shadow-lg shadow-primary/25 inline-flex items-center justify-center gap-2 hover:bg-primary-dark">
                  {heroPrimaryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/products" className="min-h-12 px-7 py-3 rounded-full border border-[#d8c7b3] bg-white/75 text-[#544638] text-[15px] font-bold backdrop-blur-md transition-colors hover:bg-white inline-flex items-center justify-center gap-2">
                  Xem sản phẩm
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </div>
          </div>
        </div>

        {hasMultipleBanners && (
          <>
            <div className="pointer-events-none absolute inset-x-4 top-1/2 z-20 flex -translate-y-1/2 items-center justify-between sm:inset-x-7">
              <button onClick={() => goToBanner(normalizedActiveBanner - 1)} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c7b3] bg-white/75 text-[#544638] opacity-45 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-primary hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary group-hover:opacity-100 group-focus-within:opacity-100" aria-label="Banner trước">
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button onClick={() => goToBanner(normalizedActiveBanner + 1)} className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c7b3] bg-white/75 text-[#544638] opacity-45 shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-primary hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary group-hover:opacity-100 group-focus-within:opacity-100" aria-label="Banner tiếp theo">
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-[#e5d7c7]" aria-hidden="true">
              <div
                className="h-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${((normalizedActiveBanner + 1) / heroSlides.length) * 100}%` }}
              />
            </div>
          </>
        )}
      </section>

      {featuredProducts.length > 0 && (
        <section className="bg-white py-10 md:py-14" aria-labelledby="featured-products-title">
          <div className="mx-auto max-w-[1240px] px-4">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 id="featured-products-title" className="section-title text-[26px] md:text-[32px]">Món nổi bật tại Mọng</h2>
                <p className="product-meta mt-2 text-sm">Những lựa chọn đang được khách hàng yêu thích.</p>
              </div>
              <Link to="/products" className="shrink-0 text-[15px] md:text-base font-bold text-primary hover:text-primary-dark transition-colors">Xem tất cả →</Link>
            </div>
            <HomeProductCarousel products={featuredProducts} onAdd={addQuick} />
          </div>
        </section>
      )}

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
                <Link to={`/categories/${category.slug}`} className="shrink-0 text-[15px] md:text-base font-bold text-primary hover:text-primary-dark transition-colors">{t('viewMore')} →</Link>
              </div>
              <HomeProductCarousel products={products} onAdd={addQuick} />
            </div>
          </section>
        ))
      )}
    </div>
  )
}
