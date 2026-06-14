import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import { useCatalog, mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
export default function ProductDetail() {
  const { slug } = useParams()
  const { addItem } = useCart()

  const [selectedVariant, setSelectedVariant] = useState(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [ingredients, setIngredients] = useState([])
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: 0 })
  const [reviews, setReviews] = useState([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewError, setReviewError] = useState('')
  const heroRef = useRef(null)
  const buyButtonRef = useRef(null)
  const { products } = useCatalog() // we'll use this for related fallback or just ignore
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch(`/store/products?handle=${slug}&fields=id,handle,title,thumbnail,*images,*variants,*variants.prices,*categories,description`)
      .then((res) => {
        if (mounted && res.products && res.products.length > 0) {
          const p = mapProduct(res.products[0])
          // We also need description since mapProduct drops it in the current version!
          // Wait, mapProduct in CatalogContext doesn't include description?
          // I will manually map it here to ensure description is passed.
          setProduct({ ...p, description: res.products[0].description })
        } else if (mounted) {
          setProduct(null)
        }
      })
      .catch(() => {
        if (mounted) setProduct(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [slug])
  useEffect(() => {
    if (!product) return
    apiFetch(`/store/ingredients/${product.handle || product.id}`)
      .then((data) => setIngredients(data.ingredients || []))
      .catch(() => setIngredients([]))

    apiFetch(`/store/reviews/${product.handle || product.id}`)
      .then((data) => {
        setReviews(data.reviews || [])
        setReviewSummary(data.summary || { count: 0, average: 0 })
      })
      .catch(() => {
        setReviews([])
        setReviewSummary({ count: 0, average: 0 })
      })
  }, [product])
  useEffect(() => {
    if (!product) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    const rafId = window.requestAnimationFrame(() => {
      heroRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      window.setTimeout(() => {
        buyButtonRef.current?.focus({ preventScroll: true })
      }, 220)
    })

    // SEO Meta Tags update
    const previousTitle = document.title
    const metaDesc = document.querySelector('meta[name="description"]')
    const previousDesc = metaDesc ? metaDesc.getAttribute('content') : ''

    document.title = `${product.title} | Mong Fruitboxz`
    if (metaDesc) {
      metaDesc.setAttribute('content', product.description ? product.description.substring(0, 160) : `Mua ${product.title} tươi ngon tại Mong Fruitboxz`)
    }

    return () => {
      window.cancelAnimationFrame(rafId)
      // Restore SEO tags on unmount
      document.title = previousTitle
      if (metaDesc) metaDesc.setAttribute('content', previousDesc || '')
    }
  }, [slug, product])
  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto px-4 py-16 text-center">
        <div className="text-gray-400">Đang tải sản phẩm...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Sản phẩm không tìm thấy</h1>
        <p className="text-gray-500 mb-8">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa</p>
        <Link to="/products" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
          Quay lại sản phẩm
        </Link>
      </div>
    )
  }
  const images = product.images?.length > 0 ? product.images : [product.thumbnail]
  const currentImage = images[selectedImage] || images[0]
  const variants = product.variants || []
  const currentVariant = variants[selectedVariant] || variants[0] || {}
  const price = currentVariant.price ?? currentVariant.prices?.[0]?.amount ?? null
  const hasPrice = typeof price === 'number' && price > 0
  const originalPrice = currentVariant.prices?.[1]?.amount ?? null
  const discount = product.discount || (hasPrice && originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0)
  const related = (products || [])
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4)
  const handleAddToCart = () => {
    if (!hasPrice) return
    addItem({
      id: product.id,
      title: product.title,
      price,
      image: currentImage || product.thumbnail,
      quantity: quantity,
      variantId: currentVariant?.id || null,
      productId: product.medusa_id || null,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }
  const variantLabel = (v) => v.label || v.title || (v.size ? `Size ${v.size}${v.weight ? ` ${v.weight}` : ''}` : '')
  const submitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    try {
      const token = localStorage.getItem('customer_token')
      if (!token) {
        setReviewError('Vui lòng đăng nhập để đánh giá')
        return
      }
      await apiFetch(`/store/reviews/${product.handle || product.id}`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          product_id: product.id,
          product_title: product.title,
        }),
      })
      const latest = await apiFetch(`/store/reviews/${product.handle || product.id}`)
      setReviews(latest.reviews || [])
      setReviewSummary(latest.summary || { count: 0, average: 0 })
      setReviewForm({ rating: 5, comment: '' })
    } catch (err) {
      setReviewError(err.message || 'Không gửi được đánh giá')
    }
  }
  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 md:py-8 animate-fadeIn">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary">Sản phẩm</Link>
        <span>/</span>
        <span className="text-secondary font-medium">{product.title}</span>
      </nav>
      <div ref={heroRef} className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 scroll-mt-24 animate-product-hero">
        <div>
          <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-[#efe7dc] mb-3">
            <img
              src={currentImage}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-white bg-primary/80 px-2.5 py-0.5 rounded-full">{product.category}</span>
          </div>
          <h1 className="product-title text-[30px] md:text-[38px] text-secondary mb-4">{product.title}</h1>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="product-price text-[30px] leading-none text-primary">
              {hasPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'Hết hàng'}
            </span>
            {hasPrice && originalPrice && originalPrice > price && (
              <>
                <span className="text-gray-400 line-through text-lg">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                </span>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">-{discount}%</span>
              </>
            )}
          </div>
          {variants.length > 1 && (
            <div className="mb-6">
              <p className="product-meta text-sm text-secondary mb-2.5 font-semibold">Chọn loại:</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(i)}
                    className={`product-meta px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                      selectedVariant === i
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-primary/50'
                    }`}
                  >
                    {variantLabel(v) || `Size ${i + 1}`}
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {(v.price ?? v.prices?.[0]?.amount) ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.price ?? v.prices?.[0]?.amount) : 'Hết hàng'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center border border-gray-200 rounded-xl h-12 bg-white">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="px-4 h-full text-secondary hover:text-primary transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <span className="product-meta px-2 text-secondary min-w-[2.5rem] text-center font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="px-4 h-full text-secondary hover:text-primary transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <button
              ref={buyButtonRef}
              onClick={handleAddToCart}
              disabled={!hasPrice}
              className={`flex-1 h-12 rounded-xl font-semibold text-center transition-all flex items-center justify-center gap-2 ${
                addedToCart
                  ? 'bg-green-500 text-white'
                  : hasPrice ? 'bg-primary text-white hover:bg-primary-dark shadow-md hover:shadow-lg' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {addedToCart ? '✓ Đã thêm vào giỏ' : hasPrice ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Thêm vào giỏ hàng
                </>
              ) : 'Hết hàng'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-accent rounded-xl border border-[#efe7dc] mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs text-secondary"><b>Giao hàng nhanh chóng</b><br />Giao hoả tốc nội thành Hà Nội</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs text-secondary"><b>Cam kết chất lượng</b><br />Trái cây tươi ngon, bảo hành</span>
            </div>
          </div>
          {product.description && (
            <div className="bg-[#fcfaf7] rounded-xl p-5 border border-[#efe7dc]">
              <h3 className="font-semibold text-secondary mb-2">Mô tả sản phẩm</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <section className="bg-white rounded-xl p-5 border border-[#efe7dc]">
          <h2 className="section-title text-[22px] mb-3">Thành phần</h2>
          {ingredients.length === 0 ? (
            <p className="text-sm text-gray-500">Đang cập nhật thành phần</p>
          ) : (
            <ul className="space-y-2">
              {ingredients.map((item) => (
                <li key={item} className="text-sm text-secondary">• {item}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="bg-white rounded-xl p-5 border border-[#efe7dc]">
          <h2 className="section-title text-[22px] mb-1">Đánh giá</h2>
          <p className="text-sm text-gray-500 mb-3">⭐ {reviewSummary.average || 0}/5 ({reviewSummary.count} đánh giá)</p>
          <form onSubmit={submitReview} className="space-y-2 mb-4">
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((star) => <option key={star} value={star}>{star} sao</option>)}
            </select>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="Chia sẻ cảm nhận sau khi mua"
            />
            {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm">Gửi đánh giá</button>
          </form>
          <div className="space-y-2 max-h-52 overflow-auto">
            {reviews.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-2.5">
                <p className="text-xs text-gray-500">{"⭐".repeat(r.rating)} • {new Date(r.created_at).toLocaleDateString('vi-VN')}</p>
                <p className="text-sm text-secondary">{r.comment || 'Không có bình luận'}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-sm text-gray-500">Chưa có đánh giá nào</p>}
          </div>
        </section>
      </div>
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-secondary mb-6">Sản phẩm liên quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
