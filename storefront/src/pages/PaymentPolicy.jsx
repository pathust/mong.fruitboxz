import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

const DEFAULT_POLICY_HTML = `
  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">1. Hình thức thanh toán</h2>
    <p>Mọng Fruitbox chấp nhận thanh toán tiền mặt khi nhận hàng và chuyển khoản theo xác nhận đơn.</p>
    <ul class="list-disc pl-6 mt-2 space-y-2">
      <li><strong>Tiền mặt:</strong> Thanh toán khi nhận hàng (COD)</li>
      <li><strong>Chuyển khoản ngân hàng:</strong> Chuyển khoản qua tài khoản ngân hàng của Mọng Fruitbox</li>
      <li><strong>Ví điện tử:</strong> Momo, ZaloPay, VNPay</li>
    </ul>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">2. Thông tin tài khoản ngân hàng</h2>
    <div class="bg-[#fffaf4] border border-[#eadfcd] rounded-lg p-4 space-y-2">
      <p><strong>Ngân hàng:</strong> Vietcombank</p>
      <p><strong>Chủ tài khoản:</strong> Mọng Fruitbox</p>
      <p><strong>Số tài khoản:</strong> 1234 5678 9012</p>
      <p><strong>Chi nhánh:</strong> Hà Nội</p>
    </div>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">3. Quy trình thanh toán</h2>
    <ol class="list-decimal pl-6 mt-2 space-y-2">
      <li>Khách hàng đặt hàng trên website hoặc liên hệ hotline</li>
      <li>Mọng Fruitbox xác nhận đơn hàng và thông báo tổng tiền</li>
      <li>Khách hàng thanh toán theo hình thức đã chọn</li>
      <li>Mọng Fruitbox giao hàng và xuất hóa đơn (nếu có yêu cầu)</li>
    </ol>
  </section>

  <section>
    <h2 class="text-xl font-semibold text-secondary mb-3">4. Chính sách hoàn tiền</h2>
    <p>Trong trường hợp đơn hàng không thể giao hoặc có sai sót từ Mọng Fruitbox, chúng tôi sẽ hoàn lại 100% số tiền khách hàng đã thanh toán trong vòng 3-5 ngày làm việc.</p>
  </section>
`

export default function PaymentPolicy() {
  const [policyHtml, setPolicyHtml] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/store/custom?mode=homepage')
      .then((data) => {
        setPolicyHtml(data.settings?.payment_policy_html || DEFAULT_POLICY_HTML)
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
      <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-8 text-center">Chính sách thanh toán</h1>

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
