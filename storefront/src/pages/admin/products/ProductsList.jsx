import { useState, useEffect } from "react"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Link } from "react-router-dom"
import { PackagePlus, ChevronLeft, ChevronRight, Pencil, Trash2, Package } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters } from "../../../components/admin/AdminListFilters"

function formatVnd(n) {
  if (!n || n <= 0) return "Hết hàng"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

function pickProductImage(p) {
  if (p.thumbnail) return p.thumbnail
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images[0]?.url || p.images[0]
  }
  return "/mong_logo-removebg.png"
}

function minVariantPrice(p) {
  const variants = p.variants || []
  const prices = variants
    .map((v) => {
      const amount = v?.calculated_price?.calculated_amount
        ?? v?.prices?.[0]?.amount
        ?? v?.prices?.[0]?.calculated_amount
      return Number(amount) || 0
    })
    .filter((x) => x > 0)
  if (!prices.length) return null
  return Math.min(...prices)
}

export default function ProductsList() {
  const { api } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [allProducts, setAllProducts] = useState([])

  // Pagination state
  const [offset, setOffset] = useState(0)
  const limit = 20

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setOffset(0) // Reset to page 1 on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  // Fetch categories for filter
  useEffect(() => {
    api("/admin/product-categories?limit=100")
      .then(d => {
        if (d.product_categories) {
          setCategories(d.product_categories.map(c => ({ value: c.id, label: c.name })))
        }
      })
      .catch(() => {})
  }, [api])

  // Fetch ALL products ONCE
  useEffect(() => {
    let mounted = true
    const timer = window.setTimeout(() => {
      setLoading(true)
      const url = `/admin/products?fields=id,title,status,thumbnail,*images,*variants,*variants.prices,*categories,created_at&limit=1000`
      api(url)
        .then(d => {
          if (mounted) setAllProducts(d.products || [])
        })
        .catch(() => {})
        .finally(() => { if (mounted) setLoading(false) })
    }, 0)
    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [api])

  // Client-side filtering
  const { filteredProducts, total } = (() => {
    let result = [...allProducts]

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      result = result.filter(p => p.title?.toLowerCase().includes(q))
    }

    if (status !== "all") {
      result = result.filter(p => p.status === status)
    }

    if (categoryFilter !== "all") {
      result = result.filter(p => p.categories?.some(c => c.id === categoryFilter))
    }

    if (priceFilter !== "all") {
      result = result.filter(p => {
        const minPrice = minVariantPrice(p)
        if (minPrice === null) return false
        if (priceFilter === 'under-100') return minPrice < 100000
        if (priceFilter === '100-300') return minPrice >= 100000 && minPrice <= 300000
        if (priceFilter === '300-500') return minPrice >= 300000 && minPrice <= 500000
        if (priceFilter === 'over-500') return minPrice > 500000
        return true
      })
    }

    return { filteredProducts: result, total: result.length }
  })()

  // Pagination slice
  const products = filteredProducts.slice(offset, offset + limit)

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return
    await api(`/admin/products/${id}`, { method: "DELETE" })
    setAllProducts(prev => prev.filter(p => p.id !== id))
  }

  const handlePrevPage = () => {
    setOffset(Math.max(0, offset - limit))
  }

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit)
    }
  }

  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit) || 1

  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Bán hàng</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Sản phẩm
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý danh mục và các sản phẩm của cửa hàng.</p>
          </div>
        
      </div>
      </AdminHeaderPortal>

      <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#eadfcd] bg-[#fffaf4]/30">
          <AdminListFilters
            actions={
              <>
                <Link to="/admin/products/new" className="admin-button-primary px-5 py-3 text-sm">
                  <PackagePlus className="h-4 w-4" />
                  Thêm sản phẩm
                </Link>
              </>
            }
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm sản phẩm..."
        showing={products.length}
        total={total}
        onReset={() => {
          setQuery("")
          setStatus("all")
          setCategoryFilter("all")
          setPriceFilter("all")
          setOffset(0)
        }}
        filters={[
          {
            label: "Trạng thái",
            value: status,
            onChange: (value) => {
              setStatus(value)
              setOffset(0)
            },
            options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "proposed", label: "Proposed" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            label: "Danh mục",
            value: categoryFilter,
            onChange: (value) => {
              setCategoryFilter(value)
              setOffset(0)
            },
            options: [
              { value: "all", label: "Tất cả danh mục" },
              ...categories
            ],
          },
          {
            label: "Khoảng giá",
            value: priceFilter,
            onChange: (value) => {
              setPriceFilter(value)
              setOffset(0)
            },
            options: [
              { value: "all", label: "Mọi mức giá" },
              { value: "under-100", label: "Dưới 100.000đ" },
              { value: "100-300", label: "100.000đ - 300.000đ" },
              { value: "300-500", label: "300.000đ - 500.000đ" },
              { value: "over-500", label: "Trên 500.000đ" },
            ],
          },
        ]}
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-secondary-light">Đang tải dữ liệu...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
                <tr>
                  <th className="text-left px-5 py-4 font-bold">Sản phẩm</th>
                  <th className="text-left px-5 py-4 font-bold">Danh mục</th>
                  <th className="text-left px-5 py-4 font-bold">Giá từ</th>
                  <th className="text-left px-5 py-4 font-bold">Phân loại</th>
                  <th className="text-left px-5 py-4 font-bold">Trạng thái</th>
                  <th className="text-right px-5 py-4 font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadfcd]/50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-[#fffaf4]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={pickProductImage(p)}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={e => { e.currentTarget.src = "/mong_logo-removebg.png" }}
                          />
                        </div>
                        <span className="font-medium text-secondary">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-secondary">
                      {p.categories?.length > 0 ? p.categories.map(c => c.name).join(', ') : <span className="text-gray-400 italic">Chưa phân loại</span>}
                    </td>
                    <td className="px-5 py-4 text-secondary">{formatVnd(minVariantPrice(p))}</td>
                    <td className="px-5 py-4 text-secondary-light">{p.variants?.length || 0} phân loại</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`admin-status ${p.status === "published" ? "bg-[#e8f6e9] text-[#2f7a37]" : "bg-[#f1eadf] text-[#766957]"}`}>{p.status}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/products/${p.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Sửa">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-secondary-light">Không có sản phẩm nào</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-[#eadfcd] px-6 py-4 bg-[#fffaf4]/20">
            <p className="text-sm text-[#8a7a67]">
              Hiển thị {offset + 1} - {Math.min(offset + limit, total)} trên tổng số {total} sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={offset === 0}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#efe4d4] bg-white text-[#43382b] transition disabled:opacity-50 hover:bg-[#fffaf4]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-[#43382b]">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={offset + limit >= total}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#efe4d4] bg-white text-[#43382b] transition disabled:opacity-50 hover:bg-[#fffaf4]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
