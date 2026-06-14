import { useEffect, useState } from 'react'
import { Bot, CirclePlus, LoaderCircle, Trash2 } from 'lucide-react'
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
      pushToast('Đã lưu cấu hình chatbot.', 'success')
    } catch {
      pushToast('Không lưu được chatbot.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLoading title="Đang tải cấu hình chatbot..." description="Đang đọc FAQ rules và câu hỏi fallback." />
  }

  if (error) {
    return <AdminError message={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div className="space-y-6">
      <div className="admin-panel px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4ea] text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h1 className="page-title text-[28px]">Chatbot</h1>
              <p className="product-meta mt-2 text-[14px] text-[#766957]">Bot ưu tiên FAQ nội bộ, sau đó mới gợi ý catalog. Không đưa AI tự do vào critical path checkout.</p>
            </div>
          </div>
          <label className="admin-input inline-flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-[#4f453b]">Bật widget</span>
            <button
              type="button"
              onClick={() => setEnabled((value) => !value)}
              className={`relative h-7 w-12 rounded-full transition ${enabled ? 'bg-primary' : 'bg-[#d9cbbc]'}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-6' : 'left-1'}`} />
            </button>
          </label>
        </div>
      </div>

      <div className="admin-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title text-[22px]">FAQ Rules</h2>
          <button
            type="button"
            onClick={() => setFaqs((prev) => [...prev, createFaq()])}
            className="admin-button-secondary px-4 py-2 text-sm"
          >
            <CirclePlus className="h-4 w-4" />
            Thêm FAQ
          </button>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-[20px] border border-[#efe4d4] bg-[#fffaf4] p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                <input
                  value={faq.question}
                  onChange={(event) => updateFaq(index, 'question', event.target.value)}
                  placeholder="Câu hỏi"
                  className="admin-input px-4 py-3 text-sm"
                />
                <input
                  value={Array.isArray(faq.keywords) ? faq.keywords.join(', ') : faq.keywords}
                  onChange={(event) => updateFaq(index, 'keywords', event.target.value)}
                  placeholder="Từ khóa, phân tách bằng dấu phẩy"
                  className="admin-input px-4 py-3 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFaqs((prev) => prev.filter((_, current) => current !== index))}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#f2d7cf] px-4 text-[#c85b34] transition hover:bg-[#fff1ea]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={faq.answer}
                onChange={(event) => updateFaq(index, 'answer', event.target.value)}
                placeholder="Câu trả lời hiển thị cho khách"
                rows={4}
                className="admin-input mt-4 w-full px-4 py-3 text-sm leading-7"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="admin-button-primary mt-5 px-5 py-3 text-sm disabled:opacity-60"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Đang lưu...' : 'Lưu chatbot'}
        </button>
      </div>

      <div className="admin-card p-6">
        <h2 className="section-title text-[22px]">Câu hỏi chưa xử lý tốt</h2>
        <div className="mt-4 space-y-3">
          {unanswered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#efe4d4] bg-[#fffaf4] px-4 py-4">
              <p className="text-sm font-semibold text-[#43382f]">{item.message}</p>
              <p className="product-meta mt-1 text-[12px] text-[#8a7d6f]">
                {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'No timestamp'}
              </p>
            </div>
          ))}
          {!unanswered.length && (
            <AdminEmpty title="Chưa có câu hỏi fallback" message="Các câu hỏi chưa xử lý tốt sẽ xuất hiện ở đây để bạn bổ sung FAQ." />
          )}
        </div>
      </div>
    </div>
  )
}
