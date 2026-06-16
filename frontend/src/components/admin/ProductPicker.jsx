import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"

export default function ProductPicker({ onClose, onSelect }) {
  const { api } = useAdminAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api('/admin/products?limit=100')
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  const filtered = search
    ? products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : products

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-[#eadfcd]">
          <h2 className="text-xl font-bold text-[#4c4238]">Chọn sản phẩm</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-[#eadfcd] bg-[#fffaf3]">
          <div className="flex items-center gap-2 rounded-2xl border border-[#eadfcd] bg-white px-4 py-3">
            <Search className="h-5 w-5 text-[#8b7966]" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[#4c4238] focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-[#f6eee2]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy sản phẩm nào.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p)}
                  className="group flex flex-col text-left bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-primary hover:shadow-md transition-all text-[#4c4238]"
                >
                  <div className="aspect-square bg-[#f8f4ed] w-full overflow-hidden">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{p.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
