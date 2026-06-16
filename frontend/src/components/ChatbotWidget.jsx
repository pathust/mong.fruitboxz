import { useEffect, useRef, useState } from 'react'
import { Bot, LoaderCircle, MessageCircle, SendHorizonal, Sparkles, X } from 'lucide-react'
import { apiFetch } from '../lib/api'

const QUICK_PROMPTS = [
  'Gợi ý hộp quà trái cây',
  'Phí ship Hà Nội tính thế nào?',
  'Sản phẩm bán chạy hôm nay',
  'Tôi muốn trái cây cắt sẵn để biếu',
]

function normalize(raw = '') {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function buildLocalReply(message) {
  const text = normalize(message)
  if (/(phi ship|ship|giao hang|van chuyen)/.test(text)) {
    return 'Phí ship Hà Nội được tính theo quận/huyện. Một số quận nội thành có tuyến nhanh từ 18.000đ; khu vực xa hơn sẽ ước tính theo khoảng cách hoặc dùng bảng phí an toàn khi service tạm gián đoạn.'
  }
  if (/(hop qua|qua tang|bieu|gift)/.test(text)) {
    return 'Bạn có thể chọn hộp quà trái cây trong catalog hoặc nhắn ngân sách, số lượng và thời gian giao. Mọng sẽ ưu tiên hộp đẹp, dễ biếu và hợp mùa.'
  }
  if (/(cat san|an lien|trai cay cat|trai cay got)/.test(text)) {
    return 'Mọng có trái cây cắt sẵn và các phần tiện dùng trong ngày. Bạn có thể tìm theo loại trái cây hoặc nhu cầu như ăn nhẹ, biếu tặng, văn phòng.'
  }
  if (/(ban chay|hot|goi y|san pham)/.test(text)) {
    return 'Bạn có thể xem các sản phẩm nổi bật trên trang chủ hoặc tìm trực tiếp theo tên trái cây. Khi backend hoạt động, mình sẽ gợi ý sản phẩm cụ thể kèm ảnh và giá.'
  }
  return 'Mình có thể hỗ trợ về sản phẩm, hộp quà, trái cây cắt sẵn và phí giao hàng. Backend hiện chưa phản hồi, bạn vui lòng thử lại sau.'
}

export default function ChatbotWidget() {
  const [enabled, setEnabled] = useState(true)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Mình có thể hỗ trợ về sản phẩm, hộp quà, phí giao hàng và thông tin cửa hàng.',
      suggestions: [],
    },
  ])
  const bodyRef = useRef(null)

  useEffect(() => {
    apiFetch('/store/custom?mode=homepage')
      .then((data) => {
        setEnabled(data?.settings?.chatbot_enabled !== false)
      })
      .catch(() => setEnabled(true))
  }, [])

  useEffect(() => {
    if (!bodyRef.current) return
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, open])

  const sendMessage = async (input) => {
    const message = (input || draft).trim()
    if (!message || loading) return

    setDraft('')
    setMessages((prev) => [...prev, { id: `${Date.now()}-user`, role: 'user', content: message }])
    setLoading(true)

    try {
      const response = await apiFetch('/store/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({ message }),
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-bot`,
          role: 'assistant',
          content: response.answer,
          suggestions: response.suggestions || [],
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-fallback`,
          role: 'assistant',
          content: buildLocalReply(message),
          suggestions: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!enabled) return null

  return (
    <>
      {open && (
        <div className="fixed inset-x-4 bottom-24 z-[70] md:right-6 md:left-auto md:bottom-6 md:w-[380px]">
          <div className="overflow-hidden rounded-[28px] border border-[#eadfcd] bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] shadow-[0_28px_70px_-34px_rgba(75,49,22,0.45)]">
            <div className="flex items-center justify-between border-b border-[#efe4d4] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_16px_32px_-20px_rgba(234,90,42,0.9)]">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="product-title text-[15px] text-[#3e3528]">Mọng Assistant</p>
                  <p className="product-meta text-[12px] text-[#7a6e60]">FAQ, catalog, shipping</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[#7a6e60] hover:bg-[#f6ecde]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={bodyRef} className="max-h-[60vh] space-y-4 overflow-y-auto px-4 py-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-[#eddcc7] bg-white px-3 py-1.5 text-left text-[12px] font-semibold text-[#6e5b45] transition hover:border-primary hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={message.role === 'user'
                    ? 'max-w-[85%] rounded-[22px] rounded-br-md bg-primary px-4 py-3 text-sm font-medium text-white shadow-[0_18px_42px_-26px_rgba(234,90,42,0.8)]'
                    : 'max-w-[90%] rounded-[22px] rounded-bl-md border border-[#f0e4d3] bg-white px-4 py-3 text-sm text-[#4f463d] shadow-[0_18px_42px_-32px_rgba(70,48,27,0.28)]'
                  }>
                    <p className="leading-6">{message.content}</p>
                    {message.suggestions?.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {message.suggestions.map((item) => (
                          <a key={item.id} href={`/products/${item.slug || item.handle || item.id}`} className="flex items-center gap-3 rounded-2xl border border-[#f2e8db] bg-[#fffaf5] p-2 transition hover:border-primary">
                            <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#f7f0e6]">
                              <img src={item.thumbnail || '/media/placeholder.svg'} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#3c352d]">{item.title}</p>
                              <p className="text-xs text-primary">
                                {item.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price) : 'Xem chi tiết'}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-full border border-[#f0e4d3] bg-white px-4 py-2 text-sm text-[#7a6e60] shadow-sm">
                    <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                    <span>Đang tìm câu trả lời...</span>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                sendMessage()
              }}
              className="border-t border-[#efe4d4] bg-white/85 px-4 py-4 backdrop-blur"
            >
              <div className="flex items-end gap-3 rounded-[24px] border border-[#eddcc7] bg-[#fffaf4] px-4 py-3 shadow-inner">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={1}
                  placeholder="Bạn đang cần tìm gì cho hôm nay?"
                  className="min-h-[24px] flex-1 resize-none bg-transparent text-sm text-[#40362d] placeholder:text-[#a29484] focus:outline-none"
                />
                <button type="submit" disabled={loading || !draft.trim()} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition disabled:cursor-not-allowed disabled:opacity-50">
                  <SendHorizonal className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-24 right-4 z-[60] flex h-14 items-center gap-2 rounded-full bg-primary px-4 text-white shadow-[0_26px_46px_-28px_rgba(234,90,42,0.95)] transition hover:translate-y-[-1px] hover:bg-primary-dark md:bottom-6 md:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden text-sm font-semibold md:inline">{open ? 'Đóng trợ lý' : 'Hỏi Mọng'}</span>
        {!open && <Sparkles className="hidden h-4 w-4 md:inline" />}
      </button>
    </>
  )
}
