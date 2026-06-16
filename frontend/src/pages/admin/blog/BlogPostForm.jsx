import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ImagePicker from "../../../components/admin/ImagePicker"
import RichTextEditor from "../../../components/admin/RichTextEditor"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { useToast } from "../../../components/ui/ToastProvider"
import { AdminLoading } from "../../../components/admin/AdminStates"

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const emptyPost = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  image: "",
  author: "Mọng Fruitbox",
  category: "",
  published: true,
}

export default function BlogPostForm() {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [form, setForm] = useState(emptyPost)

  useEffect(() => {
    if (!isNew) {
      api(`/admin/blog-posts/${id}`)
        .then((data) => setForm({ ...emptyPost, ...(data.blog_post || {}) }))
        .finally(() => setLoading(false))
    }
  }, [api, id, isNew])

  const previewPath = useMemo(() => form.slug || slugify(form.title), [form.slug, form.title])

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === "title" && (!current.slug || current.slug === slugify(current.title))) {
        next.slug = slugify(value)
      }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, slug: previewPath }
      const url = isNew ? "/admin/blog-posts" : `/admin/blog-posts/${id}`
      await api(url, { method: "POST", body: JSON.stringify(payload) })
      pushToast("Đã lưu bài viết.", "success")
      navigate("/admin/blog")
    } catch (err) {
      pushToast(err?.message || "Không lưu được bài viết.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoading title="Đang tải bài viết..." description="Đang đọc nội dung từ backend." />

  return (
    <div className="max-w-5xl space-y-6">
      <div className="admin-panel p-6">
        <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a08d79]">CMS / Blog</p>
        <h1 className="page-title mt-2 text-[30px]">{isNew ? "Thêm bài viết" : "Sửa bài viết"}</h1>
        <p className="product-meta mt-2 text-[14px]">Đường dẫn storefront: /blog/{previewPath || "slug"}</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-bold text-secondary">Tiêu đề</label>
            <input required value={form.title} onChange={(e) => setField("title", e.target.value)} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-secondary">Slug</label>
            <input required value={form.slug} onChange={(e) => setField("slug", slugify(e.target.value))} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-secondary">Tác giả</label>
            <input value={form.author} onChange={(e) => setField("author", e.target.value)} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-secondary">Danh mục</label>
            <input value={form.category} onChange={(e) => setField("category", e.target.value)} className="admin-input w-full px-4 py-2.5" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-secondary">Ảnh đại diện</label>
          <div className="flex flex-wrap items-center gap-4">
            {form.image && <img src={form.image} alt="" className="h-20 w-36 rounded-xl border border-[#eadfcd] object-cover" />}
            <button type="button" onClick={() => setShowImagePicker(true)} className="admin-button-secondary px-4 py-2 text-sm">
              {form.image ? "Đổi ảnh" : "Chọn ảnh"}
            </button>
            {form.image && <button type="button" onClick={() => setField("image", "")} className="text-sm font-bold text-red-500">Xóa ảnh</button>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-secondary">Tóm tắt</label>
          <textarea value={form.excerpt} onChange={(e) => setField("excerpt", e.target.value)} rows={3} className="admin-input w-full px-4 py-2.5" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-secondary">Nội dung bài viết</label>
          <RichTextEditor value={form.content} onChange={(value) => setField("content", value)} minHeight={360} />
          <p className="product-meta mt-2 text-xs">Soạn nội dung trực tiếp bằng toolbar, không cần nhập HTML thủ công.</p>
        </div>

        <label className="flex items-center gap-2 text-sm font-bold text-secondary">
          <input type="checkbox" checked={form.published} onChange={(e) => setField("published", e.target.checked)} />
          Published
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="admin-button-primary px-6 py-2.5 text-sm disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu bài viết"}</button>
          <button type="button" onClick={() => navigate("/admin/blog")} className="admin-button-secondary px-6 py-2.5 text-sm">Hủy</button>
        </div>
      </form>

      {showImagePicker && (
        <ImagePicker
          selected={form.image}
          onClose={() => setShowImagePicker(false)}
          onSelect={(value) => {
            setField("image", value)
            setShowImagePicker(false)
          }}
        />
      )}
    </div>
  )
}
