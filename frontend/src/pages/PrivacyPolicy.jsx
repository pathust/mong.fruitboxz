import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const DEFAULT_POLICY_HTML = `
  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">1. Mục đích thu thập thông tin</h2>
    <p>Mọng Fruitbox chỉ thu thập thông tin cần thiết để xử lý đơn hàng, giao hàng và chăm sóc khách hàng.</p>
    <ul class="list-disc pl-6 mt-2 space-y-2">
      <li>Xử lý đơn hàng và giao hàng</li>
      <li>Liên lạc xác nhận thông tin đơn hàng</li>
      <li>Cung cấp thông tin khuyến mãi và chương trình ưu đãi</li>
      <li>Cải thiện chất lượng dịch vụ</li>
    </ul>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">2. Phạm vi sử dụng thông tin</h2>
    <p>Thông tin khách hàng chỉ được sử dụng trong nội bộ Mọng Fruitbox và không được chia sẻ cho bên thứ ba, trừ trường hợp pháp luật yêu cầu.</p>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">3. Thời gian lưu trữ</h2>
    <p>Thông tin khách hàng được lưu trữ trong suốt quá trình sử dụng dịch vụ và được xóa khi khách hàng yêu cầu hoặc khi không còn cần thiết cho mục đích thu thập.</p>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">4. Cam kết bảo mật</h2>
    <p>Mọng Fruitbox cam kết bảo vệ thông tin khách hàng bằng các biện pháp an ninh phù hợp, bao gồm mã hóa dữ liệu và kiểm soát truy cập nghiêm ngặt.</p>
  </section>
`

export default function PrivacyPolicy() {
  const [policyHtml, setPolicyHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/store/custom?mode=homepage')
      .then((data) => {
        setPolicyHtml(data.settings?.privacy_policy_html || DEFAULT_POLICY_HTML)
      })
      .catch(() => {
        setPolicyHtml(DEFAULT_POLICY_HTML)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8 text-center">Chính sách bảo mật</h1>

      <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-[#eadfcd]">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ) : (
          <div 
            className="prose prose-stone max-w-none text-gray-600 leading-relaxed
                       prose-h2:text-xl prose-h2:font-semibold prose-h2:text-secondary prose-h2:mb-4 prose-h2:mt-8
                       prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
                       prose-li:my-1 prose-p:my-3 prose-strong:text-secondary"
            dangerouslySetInnerHTML={{ __html: policyHtml }}
          />
        )}
      </div>
    </div>
  )
}
