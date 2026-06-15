import { useEffect, useMemo, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
import { useSiteSettings } from '../hooks/useSiteSettings'

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
}).format(value || 0)

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export default function CustomBox() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { settings, loading: settingsLoading, error: settingsError } = useSiteSettings()
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [selected, setSelected] = useState([])

  const boxTypes = useMemo(
    () => parseJson(settings?.custom_box_types_json, []),
    [settings?.custom_box_types_json]
  )
  const allowedHandles = useMemo(
    () => (settings?.custom_box_product_handles || '').split(',').map((item) => item.trim()).filter(Boolean),
    [settings?.custom_box_product_handles]
  )
  const box = boxTypes.find((item) => item.slug === slug)

  useEffect(() => {
    let mounted = true
    apiFetch('/store/products?limit=100&fields=id,handle,title,thumbnail,*images,*variants,*variants.prices')
      .then((data) => {
        if (!mounted) return
        const mapped = (data?.products || [])
          .map(mapProduct)
          .filter((product) => product.price && (!allowedHandles.length || allowedHandles.includes(product.handle)))
        setProducts(mapped)
      })
      .catch((err) => {
        if (mounted) setProductsError(err?.message || 'Không tải được sản phẩm từ backend.')
      })
      .finally(() => {
        if (mounted) setProductsLoading(false)
      })

    return () => { mounted = false }
  }, [allowedHandles])

  const total = Number(box?.base_price || 0) + selected.reduce((sum, id) => {
    const product = products.find((item) => item.medusa_id === id)
    return sum + Number(product?.price || 0)
  }, 0)

  const toggleProduct = (id) => {
    if (!box) return
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < Number(box.max_items) ? [...current, id] : current
    )
  }

  const handleAddToCart = () => {
    if (!box || selected.length === 0) return
    const firstProduct = products.find((item) => item.medusa_id === selected[0])
    addItem({
      id: `custom-${slug}-${Date.now()}`,
      title: `${box.name} (${selected.length} loại)`,
      price: total,
      image: firstProduct?.thumbnail || '',
      quantity: 1,
      metadata: { custom_box_slug: slug, selected_product_ids: selected },
    })
  }

  if (settingsLoading || productsLoading) {
    return <div className="min-h-[420px] flex items-center justify-center text-primary"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
  }

  if (settingsError || productsError) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-600">{settingsError || productsError}</div>
  }

  if (!box) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">Cấu hình hộp tự chọn này chưa có trên backend.</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">{box.name}</span>
      </nav>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-secondary mb-3">{box.name}</h1>
        <p className="text-gray-500">{box.description}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {products.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">Backend chưa cấu hình sản phẩm cho hộp tự chọn.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((product) => {
                const isSelected = selected.includes(product.medusa_id)
                return (
                  <button
                    key={product.medusa_id}
                    onClick={() => toggleProduct(product.medusa_id)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 bg-white hover:border-primary/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-full aspect-square overflow-hidden rounded-lg mb-2 bg-accent">
                      {product.thumbnail && <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />}
                    </div>
                    <p className="text-sm font-medium text-secondary line-clamp-2">{product.title}</p>
                    <p className="text-primary font-semibold text-sm mt-1">{formatPrice(product.price)}</p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
            <h3 className="font-semibold text-secondary text-lg mb-4">Giỏ của bạn</h3>
            {selected.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Chưa chọn loại quả nào</p>
            ) : (
              <div className="space-y-3 mb-4">
                {selected.map((id) => {
                  const product = products.find((item) => item.medusa_id === id)
                  return (
                    <div key={id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-secondary line-clamp-2">{product?.title}</span>
                      <span className="text-sm text-primary font-medium whitespace-nowrap">{formatPrice(product?.price)}</span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hộp:</span>
                <span>{formatPrice(box.base_price)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-secondary">Tổng:</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            <button onClick={handleAddToCart} disabled={selected.length === 0} className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-primary/70 disabled:cursor-not-allowed">
              Thêm vào giỏ hàng
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Đã chọn {selected.length}/{box.max_items} loại</p>
          </div>
        </div>
      </div>
    </div>
  )
}
