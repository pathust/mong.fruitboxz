import { useState } from 'react'
import { CheckCircle2, Clock, Facebook, Instagram, LoaderCircle, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function Contact() {
  const { settings, loading, error } = useSiteSettings()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setSubmitError('')
    try {
      await apiFetch('/store/contact', { method: 'POST', body: form })
      setSent(true)
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setSubmitError(err?.message || 'Không gửi được lời nhắn.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="min-h-[420px] flex items-center justify-center text-primary"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-600">{error}</div>

  const contactItems = [
    { value: settings?.address, icon: MapPin },
    { value: settings?.phone, detail: settings?.opening_hours, icon: Phone },
    { value: settings?.email, icon: Mail },
  ].filter((item) => item.value)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">Liên hệ</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-secondary mb-4">{settings?.contact_title}</h1>
        <p className="text-gray-500 text-lg">{settings?.contact_intro}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          {sent ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-8 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold text-green-700 text-lg mb-2">Gửi thành công!</h3>
              <p className="text-green-600">Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Họ và tên</label>
                  <input type="text" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Số điện thoại</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Lời nhắn</label>
                <textarea required minLength={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm" rows={5} />
              </div>
              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
              <button type="submit" disabled={sending} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60">
                {sending ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-secondary text-lg mb-4">Thông tin liên hệ</h3>
            <div className="space-y-4">
              {contactItems.map(({ value, detail, icon: Icon }) => (
                <div key={value} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary">{value}</p>
                    {detail && <p className="text-sm text-gray-400 flex items-center gap-1 mt-1"><Clock className="h-3.5 w-3.5" />{detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(settings?.facebook || settings?.instagram) && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-secondary text-lg mb-4">Kết nối với chúng tôi</h3>
              <div className="flex gap-3">
                {settings.facebook && <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:opacity-90"><Facebook className="h-5 w-5" /></a>}
                {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white hover:opacity-90"><Instagram className="h-5 w-5" /></a>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
