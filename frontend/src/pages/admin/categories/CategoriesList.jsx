import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Pencil, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
export default function CategoriesList() {
  const { api } = useAdminAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

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
  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Categories</h1>
        <Link to="/admin/categories/new" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark">+ Add Category</Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-secondary-light">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Handle</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-secondary">{c.name}</td>
                <td className="px-4 py-3 text-secondary-light">{c.handle}</td>
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
