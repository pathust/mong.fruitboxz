import { Link } from 'react-router-dom'

export default function AboutUs() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">Về chúng tôi</span>
      </nav>

      <section className="mb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary mb-4">Về Mọng Fruitbox</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Mọng Fruitbox - Thương hiệu trái cây tươi hàng đầu tại Hà Nội, chuyên cung cấp các sản phẩm trái cây cao cấp,
            hộp quà tặng sang trọng và trái cây cắt sẵn tiện lợi.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src="/images/e3f0c449-ebdf-4f82-bde6-223a8e31e92a.jpeg"
              alt="Về Mọng Fruitbox"
              className="rounded-xl shadow-lg w-full"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">Câu chuyện của chúng tôi</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Mọng Fruitbox được thành lập với niềm đam mê mang đến những trái cây tươi ngon nhất
                cho khách hàng tại Hà Nội. Chúng tôi hiểu rằng trái cây không chỉ là thực phẩm
                mà còn là món quà sức khỏe dành cho người thân yêu.
              </p>
              <p>
                Với tiêu chí "Fresh & Healthy", Mọng Fruitbox cam kết chỉ chọn lọc những trái cây
                tươi ngon nhất, đảm bảo nguồn gốc xuất xứ rõ ràng và quy trình xử lý vệ sinh
                an toàn thực phẩm.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-bold text-secondary text-center mb-8">Tại sao chọn Mọng Fruitbox?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '🍎', title: 'Chất lượng', desc: 'Trái cây tươi mới mỗi ngày, nhập khẩu và nội địa chọn lọc' },
            { icon: '🎁', title: 'Đóng gói đẹp', desc: 'Hộp quà sang trọng, tinh tế, phù hợp mọi dịp' },
            { icon: '🚚', title: 'Giao hàng nhanh', desc: 'Miễn phí giao hàng nội thành Hà Nội trong 2 giờ' },
          ].map((item, i) => (
            <div key={i} className="text-center p-8 bg-white rounded-xl shadow-sm">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-secondary text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
