import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const DEFAULT_POLICY = 'Mọng Fruitbox giao hàng trên toàn địa bàn thành phố Hà Nội và các tỉnh lân cận.'
const DEFAULT_FORMULA = 'Một số quận nội thành dùng tuyến nhanh. Các khu vực còn lại được tính theo phí cơ bản cộng khoảng cách giao hàng, có giới hạn phí tối thiểu và tối đa.'

export default function ShippingPolicy() {
  const [settings, setSettings] = useState({})

  useEffect(() => {
    apiFetch('/store/custom?mode=homepage')
      .then((data) => setSettings(data.settings || {}))
      .catch(() => {})
  }, [])

  const policy = settings.shipping_policy_text || DEFAULT_POLICY
  const formula = settings.shipping_fee_formula_note || DEFAULT_FORMULA

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">Chính sách vận chuyển</span>
      </nav>

      <h1 className="text-3xl font-bold text-secondary mb-8">Chính sách vận chuyển</h1>

      <div className="bg-white rounded-xl p-8 shadow-sm space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">1. Phạm vi giao hàng</h2>
          <p>{policy}</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">2. Thời gian giao hàng</h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Nội thành Hà Nội:</strong> Giao trong vòng 2-4 giờ kể từ khi xác nhận đơn hàng</li>
            <li><strong>Ngoại thành Hà Nội:</strong> Giao trong vòng 24 giờ</li>
            <li><strong>Các tỉnh khác:</strong> 2-3 ngày làm việc</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">3. Phí vận chuyển</h2>
          <p>{formula}</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Phí ship được hiển thị trong checkout trước khi đặt hàng.</li>
            <li>Quận nội thành tuyến nhanh áp dụng mức phí nhanh đã cấu hình trong admin.</li>
            <li>Khu vực xa hơn được ước tính theo khoảng cách hoặc fallback về bảng phí an toàn.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">4. Kiểm tra hàng khi nhận</h2>
          <p>Khách hàng có quyền kiểm tra sản phẩm trước khi thanh toán. Vui lòng thông báo ngay cho nhân viên giao hàng nếu sản phẩm không đúng yêu cầu hoặc có dấu hiệu hư hỏng.</p>
        </section>
      </div>
    </div>
  )
}
