import { useEffect, useState } from 'react'
import { Bot, CirclePlus, LoaderCircle, Trash2, Info, KeySquare, Sparkles, MessageSquareWarning } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useToast } from '../../components/ui/ToastProvider'
import { AdminEmpty, AdminError, AdminLoading } from '../../components/admin/AdminStates'

function createFaq() {
  return {
    question: '',
    answer: '',
    keywords: [],
  }
}

export default function ChatbotConsole() {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const [enabled, setEnabled] = useState(true)
  const [faqs, setFaqs] = useState([createFaq()])
  const [unanswered, setUnanswered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api('/admin/chatbot/faqs').catch((err) => ({ __error: err })),
      api('/admin/chatbot/unanswered').catch(() => null),
    ])
      .then(([faqData, unansweredData]) => {
        if (faqData?.__error) {
          setError(faqData.__error?.message || 'Không tải được cấu hình chatbot.')
          return
        }
        if (faqData) {
          setEnabled(faqData.enabled !== false)
          setFaqs(faqData.faqs?.length ? faqData.faqs : [createFaq()])
        }
        if (unansweredData) {
          setUnanswered(unansweredData.items || [])
        }
      })
      .finally(() => setLoading(false))
  }, [api])

  const updateFaq = (index, key, value) => {
    setFaqs((prev) => prev.map((item, current) => current === index ? { ...item, [key]: value } : item))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api('/admin/chatbot/faqs', {
        method: 'PUT',
        body: JSON.stringify({
          enabled,
          faqs: faqs
            .map((faq) => ({
              ...faq,
              question: faq.question.trim(),
              answer: faq.answer.trim(),
              keywords: String(faq.keywords || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            }))
            .filter((faq) => faq.question && faq.answer),
        }),
      })
      pushToast('Đã lưu cấu hình chatbot thành công.', 'success')
    } catch {
      pushToast('Lưu cấu hình thất bại. Vui lòng thử lại.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLoading title="Đang khởi tạo Console..." description="Đang tải dữ liệu FAQ và dữ liệu học của AI." />
  }

  if (error) {
    return <AdminError message={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Header Section */}
      <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-[#efe4d4] flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff4ea]/50 to-transparent pointer-events-none" />
        <div className="flex items-start gap-5 relative z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20 shrink-0">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-[#3f352b] tracking-tight">AI Chatbot Console</h1>
            <p className="mt-1.5 text-[15px] text-[#766957] font-medium max-w-lg">
              Quản lý kịch bản, quy tắc trả lời (FAQ) và theo dõi các câu hỏi mà AI chưa xử lý tốt để huấn luyện thêm.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 bg-[#fffaf4] p-2 pr-5 rounded-full border border-[#efe4d4]">
          <div className={`w-3 h-3 rounded-full ml-3 ${enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`} />
          <span className="text-sm font-semibold text-[#4f453b]">
            {enabled ? 'Chatbot đang hoạt động' : 'Đã tắt Chatbot'}
          </span>
          <button
            type="button"
            onClick={() => setEnabled((value) => !value)}
            className={`relative ml-2 h-7 w-12 rounded-full transition-colors duration-300 ease-in-out ${enabled ? 'bg-primary' : 'bg-[#d9cbbc]'}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ease-in-out shadow-sm ${enabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Guide Section */}
      <div className="bg-white rounded-[24px] border border-[#efe4d4] shadow-sm p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#fff4ea] to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
        
        <h2 className="text-[20px] font-bold text-[#3f352b] flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-[#fff4ea] text-primary flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          Hướng dẫn thiết lập Chatbot AI
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#c85b34] font-bold text-[15px]">
              <Bot className="w-4 h-4" /> 1. Cơ chế hoạt động
            </div>
            <p className="text-[14px] text-[#766957] leading-relaxed">
              Khi khách hỏi, Chatbot sẽ ưu tiên tìm trong <strong className="text-[#4f453b]">FAQ Rules</strong> trước. Nếu không có, nó tự động tìm các <strong className="text-[#4f453b]">Sản phẩm</strong> liên quan. Nếu vẫn không trả lời được, câu hỏi sẽ bị đẩy vào mục <strong className="text-[#4f453b]">Chưa xử lý tốt</strong>.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#c85b34] font-bold text-[15px]">
              <KeySquare className="w-4 h-4" /> 2. Tối ưu Từ khóa
            </div>
            <p className="text-[14px] text-[#766957] leading-relaxed">
              Tại mỗi câu hỏi FAQ, hãy nhập các từ khóa trọng tâm (cách nhau bởi dấu phẩy). Ví dụ: <code className="bg-[#fff4ea] text-primary px-1.5 py-0.5 rounded text-xs font-semibold">phí ship, vận chuyển</code>. AI sẽ dựa vào đây để bắt ý định siêu chuẩn xác!
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#c85b34] font-bold text-[15px]">
              <Sparkles className="w-4 h-4" /> 3. Huấn luyện liên tục
            </div>
            <p className="text-[14px] text-[#766957] leading-relaxed">
              Hãy thường xuyên kiểm tra mục <strong className="text-[#4f453b]">Câu hỏi chưa xử lý tốt</strong> ở dưới cùng. Dựa vào đó, bạn có thể bấm "Thêm FAQ" để dạy bot trả lời các tình huống thực tế hiệu quả hơn.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* FAQ Section (Left - Takes up 2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[24px] border border-[#efe4d4] shadow-sm p-6 md:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#efe4d4] pb-6">
              <div>
                <h2 className="text-[22px] font-bold text-[#3f352b]">FAQ Rules (Quy tắc trả lời)</h2>
                <p className="text-[14px] text-[#8a7a67] mt-1 font-medium">Kịch bản có sẵn để bot phản hồi ngay lập tức.</p>
              </div>
              <button
                type="button"
                onClick={() => setFaqs((prev) => [{ ...createFaq() }, ...prev])}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#fffaf4] text-[#c85b34] hover:bg-primary hover:text-white font-bold text-sm rounded-xl border border-[#f2d7cf] hover:border-primary transition-all shadow-sm shrink-0"
              >
                <CirclePlus className="h-5 w-5" />
                Thêm FAQ mới
              </button>
            </div>

            <div className="space-y-5">
              {faqs.map((faq, index) => (
                <div key={index} className="group relative rounded-[20px] border-2 border-transparent bg-[#fffaf4] hover:border-primary/20 hover:bg-white p-5 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white">
                    {faqs.length - index}
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 pl-3">
                    <h3 className="text-sm font-bold text-[#8a7a67] uppercase tracking-wider">Cấu hình Câu hỏi</h3>
                    <button
                      type="button"
                      onClick={() => setFaqs((prev) => prev.filter((_, current) => current !== index))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#f2d7cf] text-[#c85b34] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      title="Xóa FAQ này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4 pl-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#5d5246] ml-1">Câu hỏi mẫu của khách</label>
                        <input
                          value={faq.question}
                          onChange={(event) => updateFaq(index, 'question', event.target.value)}
                          placeholder="Ví dụ: Phí ship tính thế nào?"
                          className="w-full bg-white border border-[#eadfcd] rounded-xl px-4 py-3 text-[14px] text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[13px] font-semibold text-[#5d5246] ml-1">Từ khóa nhận diện (cách nhau bởi dấu phẩy)</label>
                        <input
                          value={Array.isArray(faq.keywords) ? faq.keywords.join(', ') : faq.keywords}
                          onChange={(event) => updateFaq(index, 'keywords', event.target.value)}
                          placeholder="Ví dụ: phí ship, vận chuyển, giao hàng"
                          className="w-full bg-white border border-[#eadfcd] rounded-xl px-4 py-3 text-[14px] text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-semibold text-[#5d5246] ml-1">Câu trả lời của Bot</label>
                      <textarea
                        value={faq.answer}
                        onChange={(event) => updateFaq(index, 'answer', event.target.value)}
                        placeholder="Nhập nội dung trả lời chi tiết và thân thiện cho khách hàng..."
                        rows={3}
                        className="w-full bg-white border border-[#eadfcd] rounded-xl px-4 py-3 text-[14px] text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-[#efe4d4] flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold text-[15px] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                {saving ? 'Đang lưu thiết lập...' : 'Lưu toàn bộ thay đổi'}
              </button>
            </div>
          </div>
        </div>

        {/* Unanswered Section (Right - Takes up 1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white rounded-[24px] border border-[#efe4d4] shadow-sm p-6 md:p-8 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#3f352b]">Cần huấn luyện thêm</h2>
                <p className="text-[13px] text-[#8a7a67] font-medium mt-0.5">Tin nhắn bot chưa hiểu được</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {unanswered.map((item) => (
                <div key={item.id} className="relative group rounded-2xl border border-[#efe4d4] bg-[#fffaf4] p-4 hover:border-primary/30 hover:bg-white transition-colors">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#f2d7cf] rounded-r-full group-hover:bg-primary transition-colors" />
                  <p className="text-[14px] font-semibold text-[#43382f] leading-snug pl-2">"{item.message}"</p>
                  <p className="text-[12px] font-medium text-[#a08d79] mt-2 pl-2">
                    {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN', { 
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
                    }) : 'No timestamp'}
                  </p>
                  
                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setFaqs((prev) => [{ ...createFaq(), question: item.message }, ...prev])
                        pushToast('Đã copy tin nhắn này sang FAQ Rules. Vui lòng kéo lên để điền câu trả lời!', 'success')
                      }}
                      className="p-2 bg-white rounded-lg shadow-sm border border-[#efe4d4] text-primary hover:bg-[#fff4ea] transition-colors"
                      title="Thêm vào FAQ"
                    >
                      <CirclePlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {!unanswered.length && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#3f352b] mb-2">Bot đang làm rất tốt!</h3>
                  <p className="text-[14px] text-[#8a7a67] max-w-[200px]">Chưa có câu hỏi nào làm khó được AI của bạn trong thời gian qua.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
