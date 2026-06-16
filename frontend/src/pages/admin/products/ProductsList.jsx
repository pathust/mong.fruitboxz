import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { PackagePlus, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters } from "../../../components/admin/AdminListFilters"

function formatVnd(n) {
  if (!n || n <= 0) return "Het hang"
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
}

function pickProductImage(p) {
  if (p.thumbnail) return p.thumbnail
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images[0]?.url || p.images[0]
  }
  return "/media/58645746-dfac-4e9f-8914-649ea9576caf.jpeg"
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
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [status, setStatus] = useState("all")

  // Pagination state
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 20

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setOffset(0) // Reset to page 1 on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      let url = `/admin/products?fields=id,title,status,thumbnail,images,variants,created_at&limit=${limit}&offset=${offset}`
      if (debouncedQuery) {
        url += `&q=${encodeURIComponent(debouncedQuery)}`
      }
      if (status !== "all") {
        url += `&status=${encodeURIComponent(status)}`
      }

      api(url)
        .then(d => {
          setProducts(d.products || [])
          setTotal(d.count || 0)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [api, offset, debouncedQuery, status])

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return
    await api(`/admin/products/${id}`, { method: "DELETE" })
    setProducts(prev => prev.filter(p => p.id !== id))
    setTotal(t => Math.max(0, t - 1))
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
      <div className="admin-panel flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a08d79]">Catalog</p>
          <h1 className="page-title mt-2 text-[30px]">Products</h1>
          <p className="product-meta mt-2 text-[14px]">
            {total} san pham
          </p>
        </div>
        <Link to="/admin/products/new" className="admin-button-primary px-5 py-3 text-sm">
          <PackagePlus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <AdminListFilters
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm theo tên sản phẩm..."
        showing={products.length}
        total={total}
        onReset={() => {
          setQuery("")
          setStatus("all")
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
        ]}
      />

      <div className="admin-table">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-secondary-light">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Gia tu</th>
                  <th className="text-left px-4 py-3 font-medium">Variants</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1e7da]">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={pickProductImage(p)}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={e => { e.currentTarget.src = "/media/58645746-dfac-4e9f-8914-649ea9576caf.jpeg" }}
                          />
                        </div>
                        <span className="font-medium text-secondary">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary">{formatVnd(minVariantPrice(p))}</td>
                    <td className="px-4 py-3 text-secondary-light">{p.variants?.length || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`admin-status ${p.status === "published" ? "bg-[#e8f6e9] text-[#2f7a37]" : "bg-[#f1eadf] text-[#766957]"}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
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
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary-light">No products found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-[#f1e7da] px-6 py-4">
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
