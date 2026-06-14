import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { useCatalog, mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
import { LayoutGrid, List } from 'lucide-react'

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const { categories } = useCatalog()
  const limit = viewMode === 'grid' ? 16 : 12

  const filterCats = [
    { value: '', label: 'Tất cả' },
    ...categories.map(c => ({ value: c.id, label: c.displayName || c.name })),
  ]

  useEffect(() => {
    let mounted = true

    async function fetchProducts() {
      try {
        const offset = (page - 1) * limit
        let url = `/store/products?limit=${limit}&offset=${offset}&fields=id,handle,title,thumbnail,*images,*variants,*variants.prices,*categories`

        if (selectedCategory) {
          url += `&category_id[]=${selectedCategory}`
        }

        if (sortBy === 'price-asc') {
          url += '&order=price'
        } else if (sortBy === 'price-desc') {
          url += '&order=-price'
        }

        const res = await apiFetch(url)
        if (mounted) {
          setProducts((res.products || []).map(mapProduct))
          setTotal(res.count || 0)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (mounted) setLoading(false)
      }
    }

    const timer = window.setTimeout(() => {
      setLoading(true)
      fetchProducts()
    }, 0)
    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [page, selectedCategory, sortBy, limit])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-10">
      <div className="mb-6">
        <h1 className="page-title text-3xl md:text-5xl">Sản phẩm</h1>
        <p className="text-gray-500 mt-1 text-sm">Khám phá bộ sưu tập trái cây tươi ngon ({total} sản phẩm)</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {filterCats.map(cat => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value)
                  setPage(1)
                }}
                className={`product-meta px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white'
                    : 'bg-white text-secondary border border-[#e8e0d3] hover:border-primary/30'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-[#f8f4ed] rounded-lg border border-[#e8e0d3]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              title="Dạng danh sách"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full md:w-48">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="product-meta w-full px-4 py-2.5 bg-white border border-[#e8e0d3] rounded-lg text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Mặc định</option>
              <option value="price-asc">Giá: Thấp → Cao</option>
              <option value="price-desc">Giá: Cao → Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
          {Array.from({ length: viewMode === 'grid' ? 8 : 4 }).map((_, index) => (
            <div key={index} className={`rounded-[24px] border border-[#efe4d4] bg-white p-3 ${viewMode === 'list' ? 'flex gap-4 items-center' : ''}`}>
              <div className={`${viewMode === 'list' ? 'w-1/3 aspect-square' : 'aspect-[4/5] w-full'} animate-soft-pulse rounded-[20px] bg-[#f8efe2]`} />
              <div className={`${viewMode === 'list' ? 'w-2/3 space-y-3' : 'w-full'}`}>
                <div className={`h-4 w-3/4 animate-soft-pulse rounded-full bg-[#f2e6d7] ${viewMode === 'grid' ? 'mt-3' : ''}`} />
                <div className="h-4 w-1/2 animate-soft-pulse rounded-full bg-[#f2e6d7] mt-2" />
                {viewMode === 'list' && (
                  <div className="h-4 w-1/3 animate-soft-pulse rounded-full bg-[#f2e6d7] mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid gap-3 md:gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Không có sản phẩm nào</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#e8e0d3] text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 hover:text-primary transition-colors"
          >
            &lt;
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  page === p
                    ? 'bg-primary text-white shadow-md'
                    : 'text-secondary hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-[#e8e0d3] text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/5 hover:text-primary transition-colors"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}
