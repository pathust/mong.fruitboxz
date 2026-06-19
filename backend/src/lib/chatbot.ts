import { findFallbackProducts, searchProducts } from "./search"
import type { ServiceScope } from "./module-services"

type Faq = {
  question: string
  answer: string
  keywords?: string[]
}

type ProductSuggestionSource = {
  id: string
  slug: string
  title: string
  thumbnail: string
  price_min: number
}

const DEFAULT_FAQS = [
  {
    question: "Phí ship Hà Nội tính thế nào?",
    answer: "Phí ship được tính theo khu vực giao hàng tại Hà Nội. Một số quận nội thành có tuyến nhanh từ 18.000đ; khu vực xa hơn hệ thống sẽ ước tính theo khoảng cách và luôn hiển thị trước khi bạn đặt hàng.",
    keywords: ["phi ship", "phí ship", "giao hang", "giao hàng", "ship", "van chuyen", "vận chuyển"],
  },
  {
    question: "Mọng có trái cây cắt sẵn không?",
    answer: "Có. Mọng tập trung vào trái cây tươi, phần cắt sẵn tiện dùng và các hộp quà trái cây. Bạn có thể tìm theo nhu cầu như hộp quà, trái cây cắt sẵn, hoặc tên loại trái cây.",
    keywords: ["cat san", "cắt sẵn", "trai cay cat", "trái cây cắt", "an lien", "ăn liền"],
  },
  {
    question: "Tôi muốn đặt hộp quà trái cây",
    answer: "Bạn có thể chọn các sản phẩm hộp quà trong catalog hoặc nhắn rõ ngân sách, số lượng và thời gian giao. Mọng sẽ ưu tiên gợi ý các hộp đẹp, dễ biếu và phù hợp mùa.",
    keywords: ["hop qua", "hộp quà", "qua tang", "quà tặng", "bieu", "biếu"],
  },
  {
    question: "Liên hệ cửa hàng",
    answer: "Bạn có thể gọi hotline 0945.204.432 để được tư vấn nhanh về sản phẩm, đơn gấp hoặc đơn số lượng lớn.",
    keywords: ["hotline", "lien he", "liên hệ", "so dien thoai", "số điện thoại"],
  },
]

function normalize(raw?: string) {
  return (raw || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function isFaq(value: unknown): value is Faq {
  if (!value || typeof value !== "object") return false
  const faq = value as Record<string, unknown>
  return typeof faq.question === "string" && typeof faq.answer === "string"
}

function getFaqs(settings: Record<string, unknown>) {
  const faqs = Array.isArray(settings.chatbot_faqs) ? settings.chatbot_faqs.filter(isFaq) : []
  return [...faqs, ...DEFAULT_FAQS].filter((item) => item?.question && item?.answer)
}

function scoreFaqMatch(message: string, faq: Faq) {
  const normalizedMessage = normalize(message)
  const normalizedQuestion = normalize(faq.question)
  if (!normalizedMessage || !normalizedQuestion) return 0
  if (normalizedMessage === normalizedQuestion) return 100
  if (normalizedMessage.includes(normalizedQuestion) || normalizedQuestion.includes(normalizedMessage)) return 80
  const keywords = Array.isArray(faq.keywords) ? faq.keywords.map(normalize).filter(Boolean) : []
  if (keywords.some((keyword) => normalizedMessage.includes(keyword))) return 70
  return 0
}

function mapHitToSuggestion(hit: ProductSuggestionSource) {
  return {
    id: hit.id,
    slug: hit.slug,
    title: hit.title,
    thumbnail: hit.thumbnail,
    price: hit.price_min,
  }
}

export async function buildChatbotReply({
  message,
  scope,
  settings,
}: {
  message: string
  scope: ServiceScope
  settings: Record<string, unknown>
}) {
  const trimmed = (message || "").trim()
  if (!trimmed) {
    return {
      mode: "empty",
      answer: "Bạn nhắn mình nhu cầu về sản phẩm, hộp quà hoặc giao hàng nhé.",
      suggestions: [],
    }
  }

  const faqs = getFaqs(settings)
  const faqMatch = faqs
    .map((faq) => ({ faq, score: scoreFaqMatch(trimmed, faq) }))
    .sort((a, b) => b.score - a.score)[0]

  if (faqMatch?.score >= 70) {
    return {
      mode: "faq",
      answer: faqMatch.faq.answer,
      suggestions: [],
    }
  }

  const searchResult = await searchProducts(trimmed, { limit: 4 }).catch(() => null)
  const hits = searchResult?.hits?.map(mapHitToSuggestion) || []

  if (hits.length > 0) {
    return {
      mode: "catalog",
      answer: "Mình tìm được vài sản phẩm khá khớp với nhu cầu của bạn.",
      suggestions: hits,
    }
  }

  const fallbackHits = await findFallbackProducts(scope, trimmed, { limit: 4 }).catch(() => [])
  if (fallbackHits.length > 0) {
    return {
      mode: "catalog-fallback",
      answer: "Mình chưa dùng được search service lúc này, nhưng vẫn tìm được vài gợi ý từ catalog hiện có.",
      suggestions: fallbackHits.map(mapHitToSuggestion),
    }
  }

  const phone = typeof settings.phone === "string" ? settings.phone : "0945.204.432"
  return {
    mode: "fallback",
    answer: `Mình chưa chắc câu trả lời này từ dữ liệu hiện có. Bạn có thể gọi hotline ${phone} hoặc để lại câu hỏi cụ thể hơn về sản phẩm, giao hàng, hay hộp quà.`,
    suggestions: [],
  }
}
