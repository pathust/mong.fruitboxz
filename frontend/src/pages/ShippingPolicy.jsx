import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const DEFAULT_POLICY_HTML = `
  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">1. Phạm vi giao hàng</h2>
    <p>Mọng Fruitbox giao hàng trên toàn địa bàn thành phố Hà Nội và các tỉnh lân cận.</p>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">2. Thời gian giao hàng</h2>
    <ul class="list-disc pl-6 mt-2 space-y-2">
      <li><strong>Nội thành Hà Nội:</strong> Giao trong vòng 2-4 giờ kể từ khi xác nhận đơn hàng</li>
      <li><strong>Ngoại thành Hà Nội:</strong> Giao trong vòng 24 giờ</li>
      <li><strong>Các tỉnh khác:</strong> 2-3 ngày làm việc</li>
    </ul>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">3. Phí vận chuyển</h2>
    <p>Một số quận nội thành dùng tuyến nhanh. Các khu vực còn lại được tính theo phí cơ bản cộng khoảng cách giao hàng, có giới hạn phí tối thiểu và tối đa.</p>
    <ul class="list-disc pl-6 mt-2 space-y-2">
      <li>Phí ship được hiển thị trong checkout trước khi đặt hàng.</li>
      <li>Quận nội thành tuyến nhanh áp dụng mức phí nhanh đã cấu hình.</li>
      <li>Khu vực xa hơn được ước tính theo khoảng cách hoặc bảng phí an toàn.</li>
    </ul>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">4. Kiểm tra hàng khi nhận</h2>
    <p>Khách hàng có quyền kiểm tra sản phẩm trước khi thanh toán. Vui lòng thông báo ngay cho nhân viên giao hàng nếu sản phẩm không đúng yêu cầu hoặc có dấu hiệu hư hỏng.</p>
  </section>
`

export default function ShippingPolicy() {
  const [policyHtml, setPolicyHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/store/custom?mode=homepage')
      .then((data) => {
        setPolicyHtml(data.settings?.shipping_policy_html || DEFAULT_POLICY_HTML)
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
      <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8 text-center">Chính sách vận chuyển</h1>

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
