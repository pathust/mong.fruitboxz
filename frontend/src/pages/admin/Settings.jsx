import { useEffect, useState } from "react"
import { Save, Settings as SettingsIcon, Link as LinkIcon, MapPin, Phone, Mail, Clock, ShieldCheck, Truck, CreditCard } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"
import { AdminHeaderPortal } from "../../components/admin/AdminHeaderPortal"

export default function Settings() {
  const { api } = useAdminAuth()
  const [form, setForm] = useState({
    email: "", phone: "", address: "", opening_hours: "",
    facebook: "", instagram: "", tiktok: "",
    shipping_policy_text: "", payment_policy_text: "", privacy_policy_text: ""
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api("/admin/store-settings")
      .then(d => {
        if (d.settings) {
          setForm(prev => ({ ...prev, ...d.settings }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await api("/admin/store-settings", {
        method: "POST",
        body: JSON.stringify(form)
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      alert("Lỗi lưu cấu hình: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-[#a08d79]"><div className="h-8 w-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />Đang tải dữ liệu...</div>

  return (
    <div className="space-y-6 pb-20">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" /> Cài đặt chung
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý thông tin liên hệ của cửa hàng.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="admin-button-primary px-4 py-2 text-sm flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </AdminHeaderPortal>

      {success && (
        <div className="admin-card p-4 bg-green-50/50 border-green-200 text-green-700 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <ShieldCheck className="w-5 h-5 text-green-500" /> Cập nhật thông tin thành công!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Thông tin Cửa hàng */}
        <div className="admin-card overflow-hidden">
          <div className="border-b border-[#eadfcd] bg-gradient-to-r from-[#fffaf4] to-white px-6 py-5">
            <h2 className="text-lg font-extrabold text-secondary flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Thông tin Cửa hàng
            </h2>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email liên hệ</label>
              <input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="contact@fruitboxz.com" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Số điện thoại</label>
              <input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="090..." />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Địa chỉ Cửa hàng</label>
              <input value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="123 Đường ABC, Quận X..." />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Giờ mở cửa</label>
              <input value={form.opening_hours || ""} onChange={e => setForm({ ...form, opening_hours: e.target.value })} className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Thứ 2 - Chủ Nhật: 8:00 - 22:00" />
            </div>
          </div>
        </div>

        {/* Mạng Xã Hội */}
        <div className="admin-card overflow-hidden">
          <div className="border-b border-[#eadfcd] bg-gradient-to-r from-[#fffaf4] to-white px-6 py-5">
            <h2 className="text-lg font-extrabold text-secondary flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" /> Mạng xã hội
            </h2>
          </div>
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider">Facebook URL</label>
              <input value={form.facebook || ""} onChange={e => setForm({ ...form, facebook: e.target.value })} className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider">Instagram URL</label>
              <input value={form.instagram || ""} onChange={e => setForm({ ...form, instagram: e.target.value })} className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider">TikTok URL</label>
              <input value={form.tiktok || ""} onChange={e => setForm({ ...form, tiktok: e.target.value })} className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="https://tiktok.com/..." />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
