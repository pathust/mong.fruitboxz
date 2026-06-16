import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { ShoppingCart } from 'lucide-react'

export default function ProductCard({ product, viewMode = 'grid' }) {
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [added, setAdded] = useState(false)

  const image = product.thumbnail || product.images?.[0] || '/media/58645746-dfac-4e9f-8914-649ea9576caf.jpeg'
  const variants = product.variants?.length
    ? product.variants
    : [{ price: product.price ?? product.price_min ?? null }]
  const variant = variants[selectedVariant]
  const price = variant?.price ?? variant?.prices?.[0]?.amount ?? product.price ?? product.price_min ?? null
  const hasPrice = typeof price === 'number' && price > 0
  const originalPrice = variant?.prices?.[1]?.amount || null
  const isOutOfStock = product.inStock === false || product.stock === 0 || !hasPrice
  const discount = product.discount || (originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0)
  const productSlug = product.slug || product.id

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (isOutOfStock) return
    addItem({
      id: product.id,
      title: product.title,
      price,
      image,
      quantity: 1,
      slug: productSlug,
      variantLabel: variant?.label || '',
      variantId: variant?.id || null,
      productId: product.medusa_id || null,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  if (viewMode === 'list') {
    return (
      <article className="group rounded-2xl glass-panel p-3 hover-lift transition-all flex flex-row h-full">
        <Link to={`/products/${productSlug}`} className="w-1/3 md:w-1/4 shrink-0 rounded-xl overflow-hidden relative bg-gradient-to-br from-[#f8f4ed] to-[#fffaf3]">
          <div className="relative h-full aspect-square md:aspect-auto">
            <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            {discount > 0 && <span className="absolute left-2 top-2 text-[10px] font-bold gradient-badge px-2.5 py-1 rounded-full shadow-sm">-{discount}%</span>}
            {isOutOfStock && <span className="absolute right-2 top-2 text-[10px] font-semibold bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full">Hết hàng</span>}
          </div>
        </Link>

        <div className="pl-4 md:pl-5 flex flex-col justify-between flex-1">
          <div>
            <Link to={`/products/${productSlug}`}>
              <h3 className="product-title text-[15px] md:text-[17px] text-[#3f3a34] hover:text-primary transition-colors line-clamp-2 leading-[1.3]">{product.title}</h3>
            </Link>

            <div className="mt-1.5 flex items-end gap-2.5">
              <span className={`product-price text-[15px] md:text-[17px] ${hasPrice ? 'text-primary drop-shadow-sm' : 'text-gray-400'}`}>
                {hasPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'Hết hàng'}
              </span>
              {hasPrice && originalPrice && originalPrice > price && (
                <span className="product-meta text-[12px] text-gray-400 line-through mb-[2px]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}</span>
              )}
            </div>

            {product.description && (
              <p className="mt-2.5 text-[13px] text-gray-500 line-clamp-2 hidden md:block leading-relaxed">{product.description}</p>
            )}

            {variants.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-3.5">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); setSelectedVariant(i) }}
                    className={`product-meta text-[11px] px-3 py-1.5 rounded-lg border transition-all ${i === selectedVariant ? 'border-primary bg-primary text-white shadow-md shadow-primary/20' : 'border-[#eadfcd] bg-white/50 text-[#7a644f] hover:border-primary/50 hover:bg-white'}`}
                  >
                    {v.label || v.title || v.size || `Loại ${i + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`product-meta mt-4 w-fit px-6 py-2.5 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#ea5a2a] to-[#d44a1e] text-white hover:shadow-lg hover:shadow-primary/30 btn-glow hover:-translate-y-0.5'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {added ? 'Đã thêm' : isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </article>
    )
  }

  return (
    <article className="group rounded-2xl glass-panel p-3 hover-lift transition-all flex flex-col h-full bg-white/60">
      <Link to={`/products/${productSlug}`} className="block relative overflow-hidden rounded-xl aspect-[4/5] bg-gradient-to-br from-[#f8f4ed] to-[#fffaf3]">
        <img src={image} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        {discount > 0 && <span className="absolute left-2 top-2 text-[10px] font-bold gradient-badge px-2.5 py-1 rounded-full shadow-sm">-{discount}%</span>}
        {isOutOfStock && <span className="absolute right-2 top-2 text-[10px] font-semibold bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full">Hết hàng</span>}
      </Link>

      <div className="mt-3 flex flex-col flex-1">
        <Link to={`/products/${productSlug}`}>
          <h3 className="product-title text-[14px] md:text-[15px] text-[#3f3a34] line-clamp-2 min-h-[2.8rem] hover:text-primary transition-colors leading-[1.3]">{product.title}</h3>
        </Link>
        <div className="mt-1.5 flex items-end gap-2.5">
          <span className={`product-price text-[15px] md:text-[16px] ${hasPrice ? 'text-primary drop-shadow-sm' : 'text-gray-400'}`}>
            {hasPrice ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price) : 'Hết hàng'}
          </span>
          {hasPrice && originalPrice && originalPrice > price && (
            <span className="product-meta text-[11px] text-gray-400 line-through mb-[1px]">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}</span>
          )}
        </div>

        {variants.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {variants.slice(0, 3).map((v, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setSelectedVariant(i) }}
                className={`product-meta text-[10px] px-2.5 py-1 rounded-lg border transition-all ${i === selectedVariant ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20' : 'border-[#eadfcd] bg-white/50 text-[#7a644f] hover:border-primary/50'}`}
              >
                {v.label || v.title || v.size || `Loại ${i + 1}`}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`product-meta w-full py-2.5 rounded-full text-[12px] font-bold transition-all flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#fffaf4] text-primary border border-primary/20 hover:bg-gradient-to-r hover:from-[#ea5a2a] hover:to-[#d44a1e] hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            {added ? 'Đã thêm' : isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </article>
  )
}
