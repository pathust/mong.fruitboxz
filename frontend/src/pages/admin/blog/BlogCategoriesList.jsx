import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { useToast } from "../../../components/ui/ToastProvider"
import { AdminLoading, AdminEmpty, AdminError } from "../../../components/admin/AdminStates"

export default function BlogCategoriesList() {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchCategories = () => {
    setLoading(true)
    api("/admin/blog-categories")
      .then(data => setCategories(data.blog_categories || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCategories()
  }, [api])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục blog "${name}"? Các bài viết thuộc danh mục này sẽ bị trống danh mục.`)) return

    setDeleting(id)
    try {
      await api(`/admin/blog-categories/${id}`, { method: "DELETE" })
      pushToast("Đã xóa danh mục", "success")
      fetchCategories()
    } catch (err) {
      pushToast(err?.message || "Không thể xóa danh mục", "error")
      setDeleting(null)
    }
  }

  if (loading) return <AdminLoading title="Đang tải danh mục blog..." />
  if (error) return <AdminError message={error} onRetry={fetchCategories} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between admin-panel p-6">
        <div>
          <h1 className="page-title text-[30px]">Danh mục Blog</h1>
          <p className="product-meta mt-2 text-[14px]">Quản lý các chủ đề bài viết</p>
        </div>
        <Link to="/admin/blog-categories/new" className="admin-button-primary px-6 py-2.5 text-sm w-fit">
          Thêm danh mục
        </Link>
      </div>

      {categories.length === 0 ? (
        <AdminEmpty
          title="Chưa có danh mục blog nào"
          message="Tạo danh mục để phân loại các bài viết trên blog của bạn."
        >
          <Link to="/admin/blog-categories/new" className="admin-button-primary px-6 py-2.5 text-sm">
            Thêm danh mục
          </Link>
        </AdminEmpty>
      ) : (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fcfaf8] border-b border-[#eadfcd] product-meta">
              <tr>
                <th className="px-6 py-4 font-bold text-secondary">Tên danh mục</th>
                <th className="px-6 py-4 font-bold text-secondary">Đường dẫn (Slug)</th>
                <th className="px-6 py-4 font-bold text-secondary text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#fff8f0] transition-colors">
                  <td className="px-6 py-4 font-medium text-secondary">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link to={`/admin/blog-categories/${cat.id}/edit`} className="text-primary hover:text-primary-dark font-medium">Sửa</Link>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={deleting === cat.id}
                        className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {deleting === cat.id ? "Đang xóa..." : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
