import { useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Tags } from "lucide-react"
import { Pencil, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"
export default function CategoriesList() {
  const { api } = useAdminAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    api("/admin/product-categories?limit=50")
      .then(d => setCategories(d.product_categories || []))

      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return
    await api(`/admin/product-categories/${id}`, { method: "DELETE" })
    setCategories(prev => prev.filter(c => c.id !== id))
  }
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => filterBySearch(category, query, ["name", "description"]))
  }, [categories, query])
  if (loading) return <div className="text-center py-12 text-secondary-light">Đang tải dữ liệu...</div>
  return (
    <div>
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Tags className="w-5 h-5 text-primary" /> Danh mục
            </h1>
          </div>
          <Link to="/admin/categories/new" className="admin-button-primary px-4 py-2 text-sm">+ Thêm danh mục</Link>
        </div>
      </AdminHeaderPortal>
      <AdminListFilters
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm theo tên hoặc mô tả..."
        showing={filteredCategories.length}
        total={categories.length}
        onReset={() => setQuery("")}
      />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-secondary-light">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCategories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-secondary">{c.name}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/categories/${c.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteCategory(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
