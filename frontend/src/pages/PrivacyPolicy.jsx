import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const DEFAULT_POLICY = 'Mọng Fruitbox chỉ thu thập thông tin cần thiết để xử lý đơn hàng, giao hàng và chăm sóc khách hàng.'

export default function PrivacyPolicy() {
  const [policy, setPolicy] = useState(DEFAULT_POLICY)

  useEffect(() => {
    apiFetch('/store/custom?mode=homepage')
      .then((data) => setPolicy(data.settings?.privacy_policy_text || DEFAULT_POLICY))
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">Chính sách bảo mật</span>
      </nav>

      <h1 className="text-3xl font-bold text-secondary mb-8">Chính sách bảo mật</h1>

      <div className="bg-white rounded-xl p-8 shadow-sm space-y-6 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">1. Mục đích thu thập thông tin</h2>
          <p>{policy}</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Xử lý đơn hàng và giao hàng</li>
            <li>Liên lạc xác nhận thông tin đơn hàng</li>
            <li>Cung cấp thông tin khuyến mãi và chương trình ưu đãi</li>
            <li>Cải thiện chất lượng dịch vụ</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">2. Phạm vi sử dụng thông tin</h2>
          <p>Thông tin khách hàng chỉ được sử dụng trong nội bộ Mọng Fruitbox và không được chia sẻ cho bên thứ ba, trừ trường hợp pháp luật yêu cầu.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">3. Thời gian lưu trữ</h2>
          <p>Thông tin khách hàng được lưu trữ trong suốt quá trình sử dụng dịch vụ và được xóa khi khách hàng yêu cầu hoặc khi không còn cần thiết cho mục đích thu thập.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-secondary mb-3">4. Cam kết bảo mật</h2>
          <p>Mọng Fruitbox cam kết bảo vệ thông tin khách hàng bằng các biện pháp an ninh phù hợp, bao gồm mã hóa dữ liệu và kiểm soát truy cập nghiêm ngặt.</p>
        </section>
      </div>
    </div>
  )
}
