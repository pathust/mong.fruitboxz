import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { SearchX, LayoutGrid, List } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { useCatalog, mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const deferredQuery = useDeferredValue(query)
  const { loading: catalogLoading } = useCatalog()
  const [results, setResults] = useState([])
  const [mode, setMode] = useState('empty')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  useEffect(() => {
    if (!deferredQuery.trim()) {
      return
    }
    const controller = new AbortController()
    const startLoadingTimer = window.setTimeout(() => setLoading(true), 0)
    apiFetch(`/store/search?q=${encodeURIComponent(deferredQuery)}&limit=24`, { signal: controller.signal })
      .then((data) => {
        startTransition(() => {
          setResults(data.hits || [])
          setMode(data.mode || 'meilisearch')
        })
      })
      .catch(() => {
        // Fallback to basic products endpoint if search fails
        apiFetch(`/store/products?q=${encodeURIComponent(deferredQuery)}&limit=24`, { signal: controller.signal })
          .then((data) => {
            startTransition(() => {
              setResults((data.products || []).map(mapProduct))
              setMode('fallback')
            })
          })
          .catch(() => {
            if (!controller.signal.aborted) {
              startTransition(() => {
                setResults([])
                setMode('error')
              })
            }
          })
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => {
      controller.abort()
      window.clearTimeout(startLoadingTimer)
    }
  }, [deferredQuery])

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end mb-8">
        <div>
          <h1 className="page-title text-4xl">Tìm kiếm</h1>
          {query && (
            <p className="product-meta mt-2 text-[15px] text-[#7b6f60]">
              Kết quả cho "<span className="font-semibold text-primary">{query}</span>" - {(query ? results : []).length} sản phẩm
              {mode === 'fallback' && <span className="ml-2 text-[#9b876b]">đang dùng fallback catalog</span>}
            </p>
          )}
        </div>

        {query && results.length > 0 && (
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
        )}
      </div>

      {loading || catalogLoading ? (
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
      ) : !query ? (
        <div className="rounded-[28px] border border-dashed border-[#eadfcd] bg-[#fffaf3] px-6 py-16 text-center">
          <p className="section-title text-[24px]">Nhập từ khóa để bắt đầu</p>
          <p className="product-meta mt-2 text-[15px] text-[#7d705f]">Bạn có thể tìm theo tên sản phẩm, loại trái cây hoặc danh mục quà tặng.</p>
        </div>
      ) : (query ? results : []).length === 0 ? (
        <div className="rounded-[28px] border border-[#eadfcd] bg-white px-6 py-16 text-center shadow-[0_18px_38px_-30px_rgba(74,49,24,0.3)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1e7] text-primary">
            <SearchX className="h-8 w-8" />
          </div>
          <p className="section-title mt-5 text-[24px]">Không tìm thấy sản phẩm phù hợp</p>
          <p className="product-meta mt-2 text-[15px] text-[#7f7160]">Thử đổi từ khóa hoặc duyệt toàn bộ catalog hiện có.</p>
          <Link to="/products" className="inline-flex mt-5 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">
            Xem tất cả sản phẩm
          </Link>
        </div>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
          {(query ? results : []).map(product => <ProductCard key={product.id} product={product} viewMode={viewMode} />)}
        </div>
      )}
    </div>
  )
}
