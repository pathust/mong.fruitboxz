import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { useCatalog, mapProduct } from '../context/CatalogContext'
import { apiFetch } from '../lib/api'
import { LayoutGrid, List, Filter } from 'lucide-react'

export default function Products() {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  const { categories } = useCatalog()
  const limit = viewMode === 'grid' ? 16 : 12

  const filterCats = [
    { value: '', label: 'Tất cả' },
    ...categories.map(c => ({ value: c.id, label: c.displayName || c.name })),
  ]

  const priceRanges = [
    { value: '', label: 'Mọi mức giá' },
    { value: 'under-100', label: 'Dưới 100.000đ' },
    { value: '100-300', label: '100.000đ - 300.000đ' },
    { value: '300-500', label: '300.000đ - 500.000đ' },
    { value: 'over-500', label: 'Trên 500.000đ' },
  ]

  // Fetch ALL products ONCE
  useEffect(() => {
    let mounted = true
    async function fetchAllProducts() {
      try {
        setLoading(true)
        const url = `/store/products?limit=1000&fields=id,handle,title,thumbnail,*images,*variants,*variants.prices,+variants.inventory_quantity,*categories`
        const res = await apiFetch(url)
        if (mounted) {
          setAllProducts((res.products || []).map(mapProduct))
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (mounted) setLoading(false)
      }
    }

    const timer = window.setTimeout(() => fetchAllProducts(), 0)
    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [])

  // Filter and Sort
  const { filteredProducts, total } = (() => {
    let result = [...allProducts]

    if (selectedCategory) {
      result = result.filter(p => p.categoryIds?.includes(selectedCategory))
    }

    if (priceRange) {
      result = result.filter(p => {
        if (!p.price) return false
        if (priceRange === 'under-100') return p.price < 100000
        if (priceRange === '100-300') return p.price >= 100000 && p.price <= 300000
        if (priceRange === '300-500') return p.price >= 300000 && p.price <= 500000
        if (priceRange === 'over-500') return p.price > 500000
        return true
      })
    }

    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0))
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0))
    }

    return { filteredProducts: result, total: result.length }
  })()

  const totalPages = Math.ceil(total / limit)
  const products = filteredProducts.slice((page - 1) * limit, page * limit)

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, priceRange, sortBy, limit])

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-10">
      <div className="mb-6">
        <h1 className="page-title text-3xl md:text-5xl">Sản phẩm</h1>
        <p className="text-gray-500 mt-1 text-sm">Khám phá bộ sưu tập trái cây tươi ngon ({total} sản phẩm)</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Mobile Filter Toggle */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <button 
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 product-meta px-4 py-2 bg-white border border-[#e8e0d3] rounded-lg text-secondary text-sm"
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>
          
          <div className="flex items-center p-1 bg-[#f8f4ed] rounded-lg border border-[#e8e0d3] shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`w-full md:w-64 shrink-0 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white rounded-xl p-5 border border-[#efe7dc] sticky top-24">
            
            <div className="mb-8">
              <h3 className="product-meta font-bold text-secondary text-lg mb-4">Danh mục</h3>
              <div className="space-y-2">
                {filterCats.map(cat => (
                  <label key={cat.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="category"
                        checked={selectedCategory === cat.value}
                        onChange={() => {
                          setSelectedCategory(cat.value)
                          setPage(1)
                          if (window.innerWidth < 768) setShowMobileFilters(false)
                        }}
                        className="peer appearance-none w-5 h-5 rounded border border-[#e8e0d3] checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                      />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className={`text-sm transition-colors ${selectedCategory === cat.value ? 'text-primary font-medium' : 'text-gray-600 group-hover:text-primary'}`}>
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="product-meta font-bold text-secondary text-lg mb-4">Mức giá</h3>
              <div className="space-y-2">
                {priceRanges.map(r => (
                  <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <input 
                        type="radio" 
                        name="price"
                        checked={priceRange === r.value}
                        onChange={() => {
                          setPriceRange(r.value)
                          setPage(1)
                          if (window.innerWidth < 768) setShowMobileFilters(false)
                        }}
                        className="peer appearance-none w-5 h-5 rounded-full border border-[#e8e0d3] checked:border-primary checked:border-[6px] transition-all cursor-pointer bg-white"
                      />
                    </div>
                    <span className={`text-sm transition-colors ${priceRange === r.value ? 'text-primary font-medium' : 'text-gray-600 group-hover:text-primary'}`}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Actions Desktop */}
          <div className="hidden md:flex justify-between items-center mb-6">
            <div className="flex items-center p-1 bg-[#f8f4ed] rounded-lg border border-[#e8e0d3] shrink-0">
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
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(1)
                }}
                className="product-meta px-4 py-2 bg-white border border-[#e8e0d3] rounded-lg text-secondary text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Mặc định</option>
                <option value="price-asc">Giá: Thấp → Cao</option>
                <option value="price-desc">Giá: Cao → Thấp</option>
              </select>
            </div>
          </div>

          {/* Mobile Sort */}
          <div className="md:hidden flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
              className="product-meta px-3 py-1.5 bg-white border border-[#e8e0d3] rounded-lg text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Mặc định</option>
              <option value="price-asc">Giá: Thấp → Cao</option>
              <option value="price-desc">Giá: Cao → Thấp</option>
            </select>
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
      </div>
    </div>
  )
}
