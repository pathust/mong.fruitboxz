import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Package, Plus, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import ImagePicker from "../../../components/admin/ImagePicker"
import RecipeManager from "./RecipeManager"

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildVariantSku(baseSlug, variant, index) {
  return slugify(variant.sku || `${baseSlug}-${variant.title || `variant-${index + 1}`}`)
}

export default function ProductForm() {
  const { api } = useAdminAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isNew = !id
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [variantId, setVariantId] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(null)
  const [form, setForm] = useState({
    title: "", slug: "", description: "", status: "draft",
    category_ids: [], images: [], thumbnail: "",
    variants: [{ title: "Standard", price: 0, cost_price: 0, sku: "", id: null }]
  })

  useEffect(() => {
    api("/admin/product-categories?limit=50")
      .then(d => setCategories(d.product_categories || []))
      .catch(() => {})
    if (!isNew) {
      api(`/admin/products/${id}`)
        .then(d => {
          const p = d.product

          if (p.variants && p.variants.length > 0) {
            setVariantId(p.variants[0].id)
          }

          const loadedVariants = p.variants?.map(v => ({
            id: v.id,
            title: v.title || "Standard",
            sku: slugify(v.sku || ""),
            price: Number(v.calculated_price?.calculated_amount ?? v.prices?.[0]?.amount ?? 0),
            cost_price: Number(v.metadata?.cost_price ?? 0)
          })) || [{ title: "Standard", price: 0, cost_price: 0, sku: "", id: null }]

          setForm({
            title: p.title || "",
            slug: slugify(p.handle || p.title || ""),
            description: p.description || "",
            status: p.status || "draft",
            category_ids: p.categories?.map(c => c.id) || [],
            images: p.images?.map(i => i.url) || [],
            thumbnail: p.thumbnail || "",
            variants: loadedVariants,
          })
        })
        .finally(() => setLoading(false))
    }
  }, [id, isNew, api])

  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { title: "", price: 0, cost_price: 0, sku: "", id: null }]
    }))
  }

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  const updateVariant = (index, field, value) => {
    const newVariants = [...form.variants]
    newVariants[index][field] = value
    setForm({ ...form, variants: newVariants })
  }

  const updateTitle = (value) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: current.slug ? current.slug : slugify(value),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.variants.length === 0) {
      alert("Phải có ít nhất 1 phân loại!")
      return
    }
    setSaving(true)
    try {
      const baseSlug = slugify(form.slug || form.title)
      if (!baseSlug) {
        alert("Slug không hợp lệ. Vui lòng nhập tên sản phẩm hoặc slug.")
        setSaving(false)
        return
      }

      if (isNew) {
        await api("/admin/products", {
          method: "POST",
          body: JSON.stringify({
            title: form.title,
            handle: baseSlug,
            description: form.description,
            status: form.status,
            category_ids: form.category_ids,
            images: form.images.map(url => ({ url })),
            thumbnail: form.thumbnail,
            options: [{ title: "Default", values: form.variants.map((v, i) => v.title || `Variant ${i+1}`) }],
            variants: form.variants.map((v, i) => ({
              title: v.title || `Variant ${i+1}`,
              sku: buildVariantSku(baseSlug, v, i),
              options: { Default: v.title || `Variant ${i+1}` },
              prices: [{ amount: Number(v.price) || 0, currency_code: "vnd" }],
              metadata: { cost_price: v.cost_price || 0 },
            })),
          }),
        })
      } else {
        const existing = await api(`/admin/products/${id}`)

        // 1. Update basic info
        await api(`/admin/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: form.title,
            handle: baseSlug,
            description: form.description,
            status: form.status,
            images: form.images.map(url => ({ url })),
            thumbnail: form.thumbnail,
          }),
        })

        // 2. Manage variants
        const existingVariants = existing?.product?.variants || []

        for (let i = 0; i < form.variants.length; i++) {
          const v = form.variants[i]
          const vTitle = v.title || `Variant ${i+1}`

          if (v.id) {
            // Update existing variant
            const ev = existingVariants.find(x => x.id === v.id)
            const priceId = ev?.prices?.[0]?.id
            const pricesData = priceId
              ? [{ id: priceId, amount: Number(v.price) || 0, currency_code: "vnd" }]
              : [{ amount: Number(v.price) || 0, currency_code: "vnd" }]

            await api(`/admin/products/${id}/variants/${v.id}`, {
              method: "POST",
              body: JSON.stringify({
                title: vTitle,
                sku: buildVariantSku(baseSlug, v, i),
                prices: pricesData,
                metadata: { cost_price: v.cost_price || 0 },
              }),
            }).catch(console.error)
          } else {
            // Add new variant
            await api(`/admin/products/${id}/variants`, {
              method: "POST",
              body: JSON.stringify({
                title: vTitle,
                sku: buildVariantSku(baseSlug, v, i),
                prices: [{ amount: Number(v.price) || 0, currency_code: "vnd" }],
                metadata: { cost_price: v.cost_price || 0 },
                options: { Default: vTitle }
              }),
            }).catch(console.error)
          }
        }

        // 3. Delete removed variants
        const formVariantIds = form.variants.map(v => v.id).filter(Boolean)
        for (const ev of existingVariants) {
          if (!formVariantIds.includes(ev.id)) {
            await api(`/admin/products/${id}/variants/${ev.id}`, { method: "DELETE" }).catch(console.error)
          }
        }
      }
      navigate("/admin/products")
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Đang tải dữ liệu...</div>

  return (
    <div className="max-w-4xl">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Bán hàng</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> {isNew ? "Thêm mới" : "Chỉnh sửa"} sản phẩm
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Tạo mới hoặc cập nhật thông tin sản phẩm.</p>
          </div>
          <button type="button" onClick={handleSubmit} disabled={saving} className="admin-button-primary px-4 py-2 text-sm">
            {saving ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>
        </div>
      </AdminHeaderPortal>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Tên sản phẩm</label>
            <input value={form.title} onChange={e => updateTitle(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Slug (đường dẫn)</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="ten-san-pham" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <p className="mt-1 text-xs text-gray-500">Slug sẽ được tự chuẩn hóa, ví dụ: hop-trai-cay-tuoi.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Trạng thái</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="draft">Bản nháp (Draft)</option>
              <option value="published">Xuất bản (Published)</option>
              <option value="unpublished">Đã ẩn (Unpublished)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Mô tả chi tiết</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Danh mục (Categories)</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={form.category_ids.includes(cat.id)} onChange={() => setForm({ ...form, category_ids: form.category_ids.includes(cat.id) ? form.category_ids.filter(c => c !== cat.id) : [...form.category_ids, cat.id] })} />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          {/* VARIANTS MANAGER */}
          <div className="md:col-span-2 mt-4">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Phân loại (Variants)</h3>
                <p className="text-xs text-gray-500 mt-1">Sản phẩm có thể có nhiều phân loại theo hộp, kg, size...</p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition text-sm font-medium border border-green-200"
              >
                <Plus className="w-4 h-4" /> Thêm phân loại
              </button>
            </div>

            <div className="space-y-3">
              {form.variants.map((v, i) => (
                <div key={i} className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 relative group">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tên phân loại (VD: Hộp 1kg)</label>
                    <input value={v.title} onChange={e => updateVariant(i, 'title', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Standard" required />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Giá bán (₫)</label>
                    <input type="number" min={0} value={v.price} onChange={e => updateVariant(i, 'price', Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Giá vốn (₫)</label>
                    <input type="number" min={0} value={v.cost_price} onChange={e => updateVariant(i, 'cost_price', Number(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div className="flex-1 min-w-[100px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">SKU (mã tồn kho)</label>
                    <input value={v.sku} onChange={e => updateVariant(i, 'sku', slugify(e.target.value))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Tự tạo nếu trống" />
                    <p className="mt-1 text-[11px] text-gray-400">Tự chuẩn hóa như slug.</p>
                  </div>

                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="absolute -top-2 -right-2 bg-white text-red-500 hover:text-white hover:bg-red-500 border border-gray-200 rounded-full p-1.5 shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {v.price > 0 && v.cost_price > 0 && (
                    <div className="w-full text-xs text-green-600 mt-1">
                      Biên lợi nhuận: {Math.round((1 - v.cost_price / v.price) * 100)}% • Lãi gộp {(v.price - v.cost_price).toLocaleString()}₫/sp
                    </div>
                  )}

                  <div className="w-full mt-2 pt-2 border-t border-gray-200">
                    {(!isNew && v.id) ? (
                      <RecipeManager variantId={v.id} productId={id} />
                    ) : (
                      <div className="text-[13px] text-amber-600 font-medium py-3 px-4 bg-amber-50 rounded-lg border border-amber-100 mt-2">
                        Vui lòng lưu lại sản phẩm để có thể cài đặt nguyên liệu cho phân loại này.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 mt-4 border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-secondary mb-1">Ảnh sản phẩm</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
                  <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ))}
              <button type="button" onClick={() => { setPickerTarget("images"); setShowPicker(true) }} className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary text-2xl">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Ảnh đại diện (Thumbnail)</label>
            <div className="flex items-center gap-3">
              {form.thumbnail ? (
                <>
                  <img src={form.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                  <button type="button" onClick={() => { setPickerTarget("thumbnail"); setShowPicker(true) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Đổi ảnh</button>
                  <button type="button" onClick={() => setForm({ ...form, thumbnail: "" })} className="text-red-500 text-sm">Xoá</button>
                </>
              ) : (
                <button type="button" onClick={() => { setPickerTarget("thumbnail"); setShowPicker(true) }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Chọn ảnh</button>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50">{saving ? "Đang lưu..." : isNew ? "Tạo sản phẩm" : "Lưu thay đổi"}</button>
          <button type="button" onClick={() => navigate("/admin/products")} className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Huỷ bỏ</button>
        </div>
      </form>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-secondary">Chọn hình ảnh</h2>
              <button type="button" onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <ImagePicker
              selected={pickerTarget === "thumbnail" ? form.thumbnail : form.images}
              onSelect={(val) => {
                if (pickerTarget === "thumbnail") {
                  setForm({ ...form, thumbnail: val })
                } else {
                  setForm({ ...form, images: Array.isArray(val) ? val : [val] })
                }
                setShowPicker(false)
              }}
              multiple={pickerTarget === "images"}
            />
          </div>
        </div>
      )}
    </div>
  )
}
