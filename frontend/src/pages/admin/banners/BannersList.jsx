import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Pencil, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"

export default function BannersList() {
  const { api } = useAdminAuth()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api("/admin/banners")
      .then(d => setBanners(d.banners || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return
    await api(`/admin/banners/${id}`, { method: "DELETE" })
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Banners</h1>
        <Link to="/admin/banners/new" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark">+ Add Banner</Link>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-secondary-light">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Subtitle</th>
              <th className="text-left px-4 py-3 font-medium">Active</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {banners.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-secondary">{b.title}</td>
                <td className="px-4 py-3 text-secondary-light">{b.subtitle}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{b.active ? "Yes" : "No"}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/banners/${b.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteBanner(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
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

export function BannerForm() {
  const { api } = useAdminAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", subtitle: "", image: "", link: "", active: true })

  useEffect(() => {
    if (!isNew) {
      api(`/admin/banners/${id}`)
        .then(d => setForm({ title: d.banner.title, subtitle: d.banner.subtitle || "", image: d.banner.image || "", link: d.banner.link || "", active: d.banner.active ?? true }))
        .finally(() => setLoading(false))
    }
  }, [id, isNew, api])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const method = isNew ? "POST" : "PUT"
      const url = isNew ? "/admin/banners" : `/admin/banners/${id}`
      await api(url, { method, body: JSON.stringify(form) })
      navigate("/admin/banners")
    } catch (err) {
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-6">{isNew ? "Add Banner" : "Edit Banner"}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Title</label>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Subtitle</label>
          <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Image URL</label>
          <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Link</label>
          <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="rounded" />
          <label htmlFor="active" className="text-sm text-secondary">Active</label>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50">{saving ? "Saving..." : isNew ? "Create Banner" : "Save Changes"}</button>
          <button type="button" onClick={() => navigate("/admin/banners")} className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
        </div>
      </form>
    </div>
  )
}
