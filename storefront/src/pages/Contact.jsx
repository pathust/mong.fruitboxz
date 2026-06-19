import { useState } from 'react'
import { CheckCircle2, Clock, Facebook, Instagram, LoaderCircle, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { useSiteSettings } from '../hooks/useSiteSettings'

export default function Contact() {
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

  const { settings } = useSiteSettings()
  
  const contactItems = [
    { value: settings?.address || '165 Phương Mai, Đống Đa, Hà Nội', label: 'Cửa hàng chính', icon: MapPin },
    { value: settings?.phone || '0869 277 365', detail: settings?.opening_hours || '8:00 - 22:00 hàng ngày', icon: Phone },
    { value: settings?.email || 'ume.fruits@gmail.com', icon: Mail },
  ]

  return (
    <div className="bg-[#fffaf4] min-h-screen pb-20">
      {/* Hero header */}
      <div className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0e5d5]/50 via-transparent to-[#fff8f0]/80 -z-10"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#eadfcd] to-transparent opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#eadfcd] bg-white/50 backdrop-blur-md mb-8">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Liên hệ với chúng tôi
            </span>
          </div>
          <h1 className="text-[40px] md:text-[56px] font-extrabold text-secondary leading-[1.15] tracking-tight mb-6">
            Mọng luôn sẵn sàng<br className="hidden md:block" /> lắng nghe bạn
          </h1>
          <p className="text-[#766957] max-w-2xl mx-auto text-lg md:text-xl leading-[1.8] font-medium">
            Dù là thắc mắc về đơn hàng, hay muốn tư vấn chọn quà tinh tế, đừng ngần ngại nhắn gửi. Mọng sẽ phản hồi bạn trong thời gian sớm nhất.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">


        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
          
          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[#eadfcd]/50">
              <h3 className="font-bold text-secondary text-2xl mb-8">Thông tin liên hệ</h3>
              <div className="space-y-6">
                {contactItems.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#fff8f0] rounded-2xl flex items-center justify-center flex-shrink-0 text-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        {item.label && <p className="text-sm font-bold text-[#a08d79] uppercase tracking-wider mb-1">{item.label}</p>}
                        <p className="font-medium text-secondary text-lg leading-snug">{item.value}</p>
                        {item.detail && <p className="text-sm text-[#766957] flex items-center gap-1 mt-1.5"><Clock className="h-3.5 w-3.5" />{item.detail}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-[2rem] p-8 md:p-10 text-white shadow-lg shadow-primary/20">
              <h3 className="font-bold text-xl mb-6">Kết nối với Mọng</h3>
              <div className="flex gap-4">
                {settings?.facebook && (
                  <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {settings?.instagram && (
                  <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div>
            {sent ? (
              <div className="bg-green-50 border border-green-100 rounded-[2rem] p-12 text-center h-full flex flex-col justify-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="font-bold text-green-800 text-2xl mb-3">Gửi thành công!</h3>
                <p className="text-green-700 text-lg">Cảm ơn bạn đã liên hệ. Mọng sẽ phản hồi qua email hoặc số điện thoại trong thời gian sớm nhất.</p>
                <button onClick={() => setSent(false)} className="mt-8 text-green-600 font-semibold hover:text-green-800 transition-colors">
                  Gửi thêm lời nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.03)] border border-[#eadfcd]/50 space-y-6">
                <h3 className="font-bold text-secondary text-2xl mb-2">Gửi lời nhắn</h3>
                <p className="text-[#766957] mb-8">Điền thông tin bên dưới để Mọng có thể hỗ trợ bạn tốt nhất.</p>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">Họ và tên <span className="text-red-500">*</span></label>
                    <input type="text" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-5 py-3.5 bg-[#fffaf4] border border-[#eadfcd] rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                    <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-5 py-3.5 bg-[#fffaf4] border border-[#eadfcd] rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium" placeholder="090 123 4567" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-5 py-3.5 bg-[#fffaf4] border border-[#eadfcd] rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">Lời nhắn <span className="text-red-500">*</span></label>
                  <textarea required minLength={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-5 py-3.5 bg-[#fffaf4] border border-[#eadfcd] rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium resize-none" rows={5} placeholder="Xin chào, tôi muốn hỏi về..." />
                </div>
                
                {submitError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{submitError}</p>}
                
                <button type="submit" disabled={sending} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 disabled:hover:shadow-none flex items-center justify-center gap-2">
                  {sending ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  {sending ? 'Đang gửi...' : 'Gửi lời nhắn'}
                </button>
              </form>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
