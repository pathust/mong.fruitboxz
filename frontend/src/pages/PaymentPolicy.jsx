import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const DEFAULT_POLICY = 'Mọng Fruitbox chấp nhận thanh toán tiền mặt khi nhận hàng và chuyển khoản theo xác nhận đơn.'

export default function PaymentPolicy() {
  const [policy, setPolicy] = useState(DEFAULT_POLICY)

  useEffect(() => {
    apiFetch('/store/custom?mode=homepage')
      .then((data) => setPolicy(data.settings?.payment_policy_text || DEFAULT_POLICY))
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">Chính sách thanh toán</span>
      </nav>

      <h1 className="text-3xl font-bold text-secondary mb-8">Chính sách thanh toán</h1>

      <div className="bg-white rounded-xl p-8 shadow-sm space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">1. Hình thức thanh toán</h2>
          <p>{policy}</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Tiền mặt:</strong> Thanh toán khi nhận hàng (COD)</li>
            <li><strong>Chuyển khoản ngân hàng:</strong> Chuyển khoản qua tài khoản ngân hàng của Mọng Fruitbox</li>
            <li><strong>Ví điện tử:</strong> Momo, ZaloPay, VNPay</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">2. Thông tin tài khoản ngân hàng</h2>
          <div className="bg-background rounded-lg p-4 space-y-2">
            <p><strong>Ngân hàng:</strong> Vietcombank</p>
            <p><strong>Chủ tài khoản:</strong> Mọng Fruitbox</p>
            <p><strong>Số tài khoản:</strong> 1234 5678 9012</p>
            <p><strong>Chi nhánh:</strong> Hà Nội</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">3. Quy trình thanh toán</h2>
          <ol className="list-decimal pl-6 mt-2 space-y-2">
            <li>Khách hàng đặt hàng trên website hoặc liên hệ hotline</li>
            <li>Mọng Fruitbox xác nhận đơn hàng và thông báo tổng tiền</li>
            <li>Khách hàng thanh toán theo hình thức đã chọn</li>
            <li>Mọng Fruitbox giao hàng và xuất hóa đơn (nếu có yêu cầu)</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">4. Chính sách hoàn tiền</h2>
          <p>Trong trường hợp đơn hàng không thể giao hoặc có sai sót từ Mọng Fruitbox, chúng tôi sẽ hoàn lại 100% số tiền khách hàng đã thanh toán trong vòng 3-5 ngày làm việc.</p>
        </section>
      </div>
    </div>
  )
}
