import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import ImagePicker from "../../../components/admin/ImagePicker"

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CategoryForm() {
  const { api } = useAdminAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", slug: "", description: "", image: "" })
  const [showImagePicker, setShowImagePicker] = useState(false)

  useEffect(() => {
    if (!isNew) {
      api(`/admin/product-categories/${id}`)
        .then(d => {
          const c = d.product_category
          setForm({
            name: c.name || "",
            slug: slugify(c.handle || c.name || ""),
            description: c.description || "",
            image: c.metadata?.image || ""
          })
        })
        .finally(() => setLoading(false))
    }
  }, [id, isNew, api])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name,
        handle: slugify(form.slug || form.name),
        description: form.description,
        is_active: true,
        metadata: { image: form.image }
      }

      if (isNew) {
        await api("/admin/product-categories", { method: "POST", body: JSON.stringify(body) })
      } else {
        await api(`/admin/product-categories/${id}`, { method: "POST", body: JSON.stringify(body) })
      }
      navigate("/admin/categories")
    } catch (err) {
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-6">{isNew ? "Add Category" : "Edit Category"}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Name</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Thumbnail Image</label>
          <div className="flex items-center gap-4">
            {form.image && (
              <img src={form.image} alt="Thumbnail" className="h-16 w-16 rounded-xl object-cover border border-gray-200" />
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
          <label className="block text-sm font-medium text-secondary mb-1">Slug (đường dẫn)</label>
          <input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="hop-qua-trai-cay" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50">{saving ? "Saving..." : isNew ? "Create Category" : "Save Changes"}</button>
          <button type="button" onClick={() => navigate("/admin/categories")} className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
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
    </div>
  )
}
