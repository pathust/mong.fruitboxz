import { useEffect, useMemo, useState } from "react"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Link } from "react-router-dom"
import { Plus, Trash2, Save, Settings } from "lucide-react"
import ImagePicker from "../../../components/admin/ImagePicker"
import RichTextEditor from "../../../components/admin/RichTextEditor"
import { AdminError, AdminLoading } from "../../../components/admin/AdminStates"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { useToast } from "../../../components/ui/ToastProvider"

const configs = {
  about: {
    eyebrow: "CMS / Về chúng tôi",
    title: "Về chúng tôi",
    description: "Quản lý nội dung trang /about-us.",
    preview: "/about-us",
    fields: [
      { key: "about_title", label: "Tiêu đề", type: "text" },
      { key: "about_intro", label: "Mở đầu", type: "textarea", rows: 3 },
      { key: "about_image", label: "Ảnh giới thiệu", type: "image" },
      { key: "about_story_title", label: "Tiêu đề câu chuyện", type: "text" },
      { key: "about_story", label: "Nội dung câu chuyện", type: "richtext" },
      { key: "about_reasons_title", label: "Tiêu đề lý do chọn Mọng", type: "text" },
      { key: "about_reasons_json", label: "Danh sách lý do chọn Mọng", type: "reasons" },
    ],
  },
  blog: {
    eyebrow: "CMS / Trang Blog",
    title: "Trang Blog",
    description: "Quản lý nội dung hiển thị ở phần giới thiệu đầu trang /blog.",
    preview: "/blog",
    fields: [
      { key: "blog_eyebrow", label: "Eyebrow (Chữ nhỏ trên cùng)", type: "text" },
      { key: "blog_title", label: "Tiêu đề chính", type: "text" },
      { key: "blog_intro", label: "Mô tả ngắn", type: "textarea", rows: 3 },
    ],
  },
  contact: {
    eyebrow: "CMS / Liên hệ",
    title: "Liên hệ",
    description: "Quản lý thông tin hiển thị ở trang /contact và footer.",
    preview: "/contact",
    fields: [
      { key: "contact_title", label: "Tiêu đề trang liên hệ", type: "text" },
      { key: "contact_intro", label: "Mô tả trang liên hệ", type: "textarea", rows: 3 },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Số điện thoại", type: "text" },
      { key: "address", label: "Địa chỉ", type: "textarea", rows: 3 },
      { key: "opening_hours", label: "Giờ mở cửa", type: "text" },
      { key: "facebook", label: "Facebook URL", type: "text" },
      { key: "instagram", label: "Instagram URL", type: "text" },
      { key: "tiktok", label: "TikTok URL", type: "text" },
    ],
  },
  customBox: {
    eyebrow: "Bán hàng / Hộp tự chọn",
    title: "Hộp tự chọn",
    description: "Quản lý loại hộp, giá nền, số món tối đa và danh sách sản phẩm được chọn.",
    preview: "/custom-box/hop-qua-trai-cay-tu-chon",
    fields: [
      { key: "custom_box_types_json", label: "Các loại hộp", type: "boxTypes" },
      { key: "custom_box_product_slugs", label: "Product slugs được phép chọn", type: "textarea", rows: 5 },
    ],
  },
  paymentPolicy: {
    eyebrow: "CMS / Chính sách thanh toán",
    title: "Chính sách thanh toán",
    description: "Quản lý nội dung hiển thị ở trang /payment-policy.",
    preview: "/payment-policy",
    fields: [
      { key: "payment_policy_html", label: "Nội dung chính sách", type: "richtext" },
    ],
  },
  privacyPolicy: {
    eyebrow: "CMS / Chính sách bảo mật",
    title: "Chính sách bảo mật",
    description: "Quản lý nội dung hiển thị ở trang /privacy-policy.",
    preview: "/privacy-policy",
    fields: [
      { key: "privacy_policy_html", label: "Nội dung chính sách", type: "richtext" },
    ],
  },
  shippingPolicy: {
    eyebrow: "CMS / Chính sách vận chuyển",
    title: "Chính sách vận chuyển",
    description: "Quản lý nội dung hiển thị ở trang /shipping-policy.",
    preview: "/shipping-policy",
    fields: [
      { key: "shipping_policy_html", label: "Nội dung chính sách", type: "richtext" },
    ],
  },
}

const defaultValues = {
  about_reasons_json: "[]",
  custom_box_types_json: "[]",
  custom_box_product_slugs: "",
}

const iconOptions = [
  { value: "quality", label: "Chất lượng" },
  { value: "gift", label: "Quà tặng" },
  { value: "delivery", label: "Giao hàng" },
]

function parseList(value) {
  try {
    const parsed = value ? JSON.parse(value) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function updateListField(form, key, nextItems) {
  return { ...form, [key]: JSON.stringify(nextItems) }
}

function ReasonListEditor({ value, onChange }) {
  const items = parseList(value)
  const updateItem = (index, patch) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }
  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index))
  const addItem = () => onChange([...items, { icon: "quality", title: "", description: "" }])

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-[#eadfcd] bg-[#fffaf4] p-4">
          <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
            <select value={item.icon || "quality"} onChange={(e) => updateItem(index, { icon: e.target.value })} className="admin-input px-4 py-2.5">
              {iconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <input value={item.title || ""} onChange={(e) => updateItem(index, { title: e.target.value })} placeholder="Tiêu đề" className="admin-input px-4 py-2.5" />
            <button type="button" onClick={() => removeItem(index)} className="admin-button-secondary h-11 px-4 text-sm text-red-500 hover:text-red-600" aria-label="Xóa lý do">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <textarea value={item.description || ""} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="Mô tả ngắn" rows={2} className="admin-input mt-3 w-full px-4 py-2.5" />
        </div>
      ))}
      <button type="button" onClick={addItem} className="admin-button-secondary px-4 py-2 text-sm">
        <Plus className="h-4 w-4" />
        Thêm lý do
      </button>
    </div>
  )
}

function BoxTypesEditor({ value, onChange }) {
  const items = parseList(value)
  const updateItem = (index, patch) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }
  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index))
  const addItem = () => onChange([...items, { slug: "", name: "", description: "", base_price: 0, max_items: 4 }])

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-2xl border border-[#eadfcd] bg-[#fffaf4] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-secondary">Loại hộp #{index + 1}</p>
            <button type="button" onClick={() => removeItem(index)} className="admin-button-secondary h-10 px-3 text-sm text-red-500 hover:text-red-600" aria-label="Xóa loại hộp">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input value={item.name || ""} onChange={(e) => updateItem(index, { name: e.target.value })} placeholder="Tên hộp" className="admin-input px-4 py-2.5" />
            <input value={item.slug || ""} onChange={(e) => updateItem(index, { slug: e.target.value })} placeholder="slug-duong-dan" className="admin-input px-4 py-2.5" />
            <input type="number" min="0" value={item.base_price ?? 0} onChange={(e) => updateItem(index, { base_price: Number(e.target.value) })} placeholder="Giá nền" className="admin-input px-4 py-2.5" />
            <input type="number" min="1" value={item.max_items ?? 4} onChange={(e) => updateItem(index, { max_items: Number(e.target.value) })} placeholder="Số món tối đa" className="admin-input px-4 py-2.5" />
          </div>
          <textarea value={item.description || ""} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="Mô tả loại hộp" rows={2} className="admin-input mt-3 w-full px-4 py-2.5" />
        </div>
      ))}
      <button type="button" onClick={addItem} className="admin-button-secondary px-4 py-2 text-sm">
        <Plus className="h-4 w-4" />
        Thêm loại hộp
      </button>
    </div>
  )
}

export default function ContentSettingsPage({ type }) {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const config = configs[type]
  const [form, setForm] = useState(defaultValues)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [imageField, setImageField] = useState(null)

  const keys = useMemo(() => config.fields.map((field) => field.key), [config.fields])

  useEffect(() => {
    let mounted = true
    api("/admin/settings")
      .then((data) => {
        if (!mounted) return
        const settings = data.settings || {}
        const next = { ...defaultValues }
        keys.forEach((key) => {
          next[key] = settings[key] ?? defaultValues[key] ?? ""
          if (key === "custom_box_product_slugs") {
            next[key] = settings.custom_box_product_slugs || settings.custom_box_product_handles || defaultValues[key] || ""
          }
        })
        setForm(next)
      })
      .catch((err) => {
        if (mounted) setError(err?.message || "Không tải được settings.")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [api, keys])

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api("/admin/settings", { method: "PUT", body: JSON.stringify(form) })
      pushToast("Đã lưu nội dung.", "success")
    } catch (err) {
      pushToast(err?.message || "Không lưu được nội dung.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoading title={`Đang tải ${config.title}...`} description="Đang đọc dữ liệu CMS từ backend." />
  if (error) return <AdminError message={error} onRetry={() => window.location.reload()} />

  return (
    <div className="max-w-5xl space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
          <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">{config.eyebrow}</p>
          <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> {config.title}
          </h1>
          <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">{config.description}</p>
        </div>
        <Link to={config.preview} target="_blank" className="admin-button-secondary px-4 py-2 text-sm">Xem storefront</Link>
      </div>
      </AdminHeaderPortal>

      <form onSubmit={handleSubmit} className="admin-card space-y-5 p-6">
        {config.fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-sm font-bold text-secondary">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={form[field.key] || ""}
                onChange={(e) => setField(field.key, e.target.value)}
                rows={field.rows || 4}
                className="admin-input w-full px-4 py-2.5"
              />
            ) : field.type === "richtext" ? (
              <RichTextEditor
                value={form[field.key] || ""}
                onChange={(val) => setField(field.key, val)}
                minHeight={300}
              />
            ) : field.type === "reasons" ? (
              <ReasonListEditor value={form[field.key]} onChange={(items) => setForm((current) => updateListField(current, field.key, items))} />
            ) : field.type === "boxTypes" ? (
              <BoxTypesEditor value={form[field.key]} onChange={(items) => setForm((current) => updateListField(current, field.key, items))} />
            ) : field.type === "image" ? (
              <div className="flex flex-wrap items-center gap-4">
                {form[field.key] && <img src={form[field.key]} alt="" className="h-24 w-36 rounded-xl border border-[#eadfcd] object-cover" />}
                <input value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)} className="admin-input min-w-[260px] flex-1 px-4 py-2.5" />
                <button type="button" onClick={() => setImageField(field.key)} className="admin-button-secondary px-4 py-2 text-sm">Chọn ảnh</button>
              </div>
            ) : (
              <input value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)} className="admin-input w-full px-4 py-2.5" />
            )}
          </div>
        ))}

        <div className="pt-2">
          <button type="submit" disabled={saving} className="admin-button-primary px-6 py-2.5 text-sm disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu nội dung"}
          </button>
        </div>
      </form>

      {imageField && (
        <ImagePicker
          selected={form[imageField]}
          onClose={() => setImageField(null)}
          onSelect={(value) => {
            setField(imageField, value)
            setImageField(null)
          }}
        />
      )}
    </div>
  )
}
