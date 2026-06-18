import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Image } from "lucide-react"
import ImagePicker from "../../../components/admin/ImagePicker"
import ProductPicker from "../../../components/admin/ProductPicker"
import { X } from "lucide-react"

export default function BannerForm() {
  const { api } = useAdminAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", subtitle: "", image: "", link: "", active: true })
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

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

  if (loading) return <div className="text-center py-12 text-secondary-light">Đang tải dữ liệu...</div>

  return (
    <div className="max-w-2xl">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Nội dung & Media</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" /> {isNew ? "Thêm mới" : "Chỉnh sửa"} Banner
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Thêm mới hoặc chỉnh sửa banner.</p>
          </div>
          <button type="button" onClick={handleSubmit} disabled={saving} className="admin-button-primary px-4 py-2 text-sm">
            {saving ? "Đang lưu..." : "Lưu Banner"}
          </button>
        </div>
      </AdminHeaderPortal>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required placeholder="e.g. Khuyến mãi Cam vàng" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Subtitle</label>
          <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="e.g. Giảm giá 50% hôm nay" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Quick Link Product</label>
          <button
            type="button"
            onClick={() => setShowProductPicker(true)}
            className="w-full text-left px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white hover:bg-gray-50 text-gray-700 flex justify-between items-center"
          >
            <span>-- Choose a product to auto-fill image and link --</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Image</label>
          <div className="flex items-center gap-4">
            {form.image && (
              <button type="button" onClick={() => setPreviewOpen(true)} className="overflow-hidden rounded-xl border border-gray-200 transition hover:border-primary hover:shadow-sm" title="Xem ảnh banner">
                <img src={form.image} alt="Banner" className="h-16 w-32 object-cover" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-secondary"
            >
              {form.image ? "Change Image" : "Choose Image"}
            </button>
            {form.image && (
              <button
                type="button"
                onClick={() => setForm({ ...form, image: "" })}
                className="text-red-500 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
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

      {showImagePicker && (
        <ImagePicker
          onClose={() => setShowImagePicker(false)}
          onSelect={(val) => {
            setForm({ ...form, image: val })
            setShowImagePicker(false)
          }}
          selected={form.image}
        />
      )}

      {showProductPicker && (
        <ProductPicker
          onClose={() => setShowProductPicker(false)}
          onSelect={(p) => {
            setForm(f => ({
              ...f,
              image: p.thumbnail || f.image,
              link: `/products/${p.slug || p.handle || p.id}`
            }))
            setShowProductPicker(false)
          }}
        />
      )}

      {previewOpen && form.image && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="font-semibold text-secondary">{form.title || "Ảnh banner"}</p>
              <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-secondary" aria-label="Đóng xem ảnh">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto bg-gray-950 p-3">
              <img src={form.image} alt={form.title || "Ảnh banner"} className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
