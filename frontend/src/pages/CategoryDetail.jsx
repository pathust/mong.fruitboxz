import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useCatalog, mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
import { LayoutGrid, List } from 'lucide-react'

export default function CategoryDetail() {
  const { categorySlug } = useParams()
  const { getCategory } = useCatalog()
  const category = getCategory(categorySlug)

  const [page, setPage] = useState(1)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const limit = viewMode === 'grid' ? 16 : 12

  useEffect(() => {
    // Reset page when category changes
    setPage(1)
  }, [categorySlug])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    async function fetchProducts() {
      if (!category) {
        // We'll let it try to fetch by assuming categorySlug is valid if category is missing
      }

      try {
        const offset = (page - 1) * limit
        let url = `/store/products?limit=${limit}&offset=${offset}&fields=id,handle,title,thumbnail,*images,*variants,*variants.prices,*categories`

        if (category) {
          url += `&category_id[]=${category.id}`
        } else {
          // Fallback: fetch categories first to find ID
          const catRes = await apiFetch('/store/product-categories')
          const found = (catRes.product_categories || []).find(c => c.handle === categorySlug)
          if (found) {
            url += `&category_id[]=${found.id}`
          } else {
            // Category not found
            if (mounted) {
              setProducts([])
              setTotal(0)
              setLoading(false)
            }
            return
          }
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

    fetchProducts()
    return () => { mounted = false }
  }, [categorySlug, page, category, limit])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-10">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <Link to="/categories" className="hover:text-primary">Danh mục</Link>
        <span>/</span>
        <span className="text-secondary">{category?.displayName || category?.name || 'Danh mục'}</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end mb-8">
        <div>
          <h1 className="page-title text-4xl md:text-5xl">{category?.displayName || category?.name || 'Danh mục'}</h1>
          <p className="product-meta text-gray-500 mt-1">{total} sản phẩm</p>
        </div>

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
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Không có sản phẩm trong danh mục này</p>
          <Link to="/products" className="inline-block mt-4 text-primary hover:text-primary-dark font-medium">Xem tất cả sản phẩm</Link>
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