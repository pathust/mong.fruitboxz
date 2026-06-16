import { useState, useEffect } from "react"
import { useAdminAuth } from "../../context/AdminAuthContext"
import { useToast } from "../../components/ui/ToastProvider"
import { AdminError, AdminLoading } from "../../components/admin/AdminStates"

export default function Settings() {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    site_name: "",
    tagline: "",
    footer_about: "",
    email: "",
    phone: "",
    address: "",
    opening_hours: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    contact_title: "",
    contact_intro: "",
    about_title: "",
    about_intro: "",
    about_image: "",
    about_story_title: "",
    about_story: "",
    about_story_secondary: "",
    about_reasons_title: "",
    about_reasons_json: "",
    custom_box_types_json: "",
    custom_box_product_slugs: "",
    about_us: "",
    delivery_info: "",
    shipping_policy_text: "Mọng giao hàng trong Hà Nội theo khu vực. Phí ship được hiển thị trước khi đặt hàng và có thể thay đổi theo khoảng cách thực tế.",
    shipping_fee_formula_note: "Quận nội thành tuyến nhanh dùng Fast District Fee. Các quận còn lại tính Base Fee + khoảng cách x Fee Per Km, sau đó kẹp trong Min/Max Fee.",
    payment_policy_text: "Mọng hỗ trợ COD và chuyển khoản. Đơn hàng được xác nhận trước khi giao.",
    privacy_policy_text: "Thông tin khách hàng chỉ dùng để xử lý đơn hàng, giao hàng và chăm sóc sau bán.",
  })

  useEffect(() => {
    api("/admin/settings")
      .then(d => {
        if (d.settings && Object.keys(d.settings).length > 0) {
          setForm(prev => ({
            ...prev,
            ...d.settings,
            custom_box_product_slugs: d.settings.custom_box_product_slugs || d.settings.custom_box_product_handles || "",
          }))
        }
      })
      .catch((err) => setError(err?.message || "Không tải được settings."))
      .finally(() => setLoading(false))
  }, [api])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api("/admin/settings", { method: "PUT", body: JSON.stringify(form) })
      pushToast("Đã lưu settings.", "success")
    } catch (err) {
      pushToast(err?.message || "Không lưu được settings.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLoading title="Đang tải settings..." description="Đang đọc cấu hình website và shipping engine." />
  if (error) return <AdminError message={error} onRetry={() => window.location.reload()} />

  return (
    <div className="max-w-5xl space-y-6">
      <div className="admin-panel p-6">
        <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a08d79]">Storefront controls</p>
        <h1 className="page-title mt-2 text-[30px]">Website Settings</h1>
        <p className="product-meta mt-2 max-w-2xl text-[14px]">Thông tin thương hiệu, liên hệ và shipping engine dùng chung cho website.</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card space-y-5 p-6">
        <h2 className="section-title border-b border-[#efe4d4] pb-3 text-[20px]">General</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Site Name</label>
            <input value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Tagline</label>
            <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Footer About</label>
            <textarea value={form.footer_about} onChange={e => setForm({ ...form, footer_about: e.target.value })} rows={3} className="admin-input w-full px-4 py-2.5" />
          </div>
        </div>

        <h2 className="section-title border-b border-[#efe4d4] pb-3 pt-4 text-[20px]">Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Opening Hours</label>
            <input value={form.opening_hours} onChange={e => setForm({ ...form, opening_hours: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Facebook URL</label>
            <input value={form.facebook} onChange={e => setForm({ ...form, facebook: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Instagram URL</label>
            <input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">TikTok URL</label>
            <input value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
        </div>

        <h2 className="section-title border-b border-[#efe4d4] pb-3 pt-4 text-[20px]">Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Contact Title</label>
            <input value={form.contact_title} onChange={e => setForm({ ...form, contact_title: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Contact Intro</label>
            <input value={form.contact_intro} onChange={e => setForm({ ...form, contact_intro: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">About Title</label>
            <input value={form.about_title} onChange={e => setForm({ ...form, about_title: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">About Story Title</label>
            <input value={form.about_story_title} onChange={e => setForm({ ...form, about_story_title: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">About Intro</label>
            <textarea value={form.about_intro} onChange={e => setForm({ ...form, about_intro: e.target.value })} rows={3} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">About Image URL</label>
            <input value={form.about_image} onChange={e => setForm({ ...form, about_image: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">About Story</label>
            <textarea value={form.about_story} onChange={e => setForm({ ...form, about_story: e.target.value })} rows={4} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">About Story Secondary</label>
            <textarea value={form.about_story_secondary} onChange={e => setForm({ ...form, about_story_secondary: e.target.value })} rows={4} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Reasons Title</label>
            <input value={form.about_reasons_title} onChange={e => setForm({ ...form, about_reasons_title: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Reasons JSON</label>
            <textarea value={form.about_reasons_json} onChange={e => setForm({ ...form, about_reasons_json: e.target.value })} rows={6} className="admin-input w-full px-4 py-2.5 font-mono text-xs" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">About Us</label>
          <textarea value={form.about_us} onChange={e => setForm({ ...form, about_us: e.target.value })} rows={5} className="admin-input w-full px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Delivery Info</label>
          <textarea value={form.delivery_info} onChange={e => setForm({ ...form, delivery_info: e.target.value })} rows={5} className="admin-input w-full px-4 py-2.5" />
        </div>

        <h2 className="section-title border-b border-[#efe4d4] pb-3 pt-4 text-[20px]">Custom Box</h2>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Box Types JSON</label>
          <textarea value={form.custom_box_types_json} onChange={e => setForm({ ...form, custom_box_types_json: e.target.value })} rows={8} className="admin-input w-full px-4 py-2.5 font-mono text-xs" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Allowed Product Slugs</label>
          <textarea value={form.custom_box_product_slugs} onChange={e => setForm({ ...form, custom_box_product_slugs: e.target.value })} rows={4} className="admin-input w-full px-4 py-2.5" />
        </div>

        <h2 className="section-title border-b border-[#efe4d4] pb-3 pt-4 text-[20px]">Policies</h2>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Shipping Policy</label>
          <textarea value={form.shipping_policy_text} onChange={e => setForm({ ...form, shipping_policy_text: e.target.value })} rows={5} className="admin-input w-full px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Payment Policy</label>
          <textarea value={form.payment_policy_text} onChange={e => setForm({ ...form, payment_policy_text: e.target.value })} rows={4} className="admin-input w-full px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Privacy Policy</label>
          <textarea value={form.privacy_policy_text} onChange={e => setForm({ ...form, privacy_policy_text: e.target.value })} rows={4} className="admin-input w-full px-4 py-2.5" />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="admin-button-primary px-6 py-2.5 text-sm disabled:opacity-50">{saving ? "Saving..." : "Save Settings"}</button>
        </div>
      </form>
    </div>
  )
}
