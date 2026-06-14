import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, removeItem, updateQuantity } = useCart()

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-[#fffaf4] rounded-full flex items-center justify-center border-2 border-[#efe7dc]">
            <svg className="w-12 h-12 text-[#d8c3a5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>
        <h1 className="text-[28px] font-bold text-secondary mb-3">Giỏ hàng của bạn đang trống</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Khám phá các loại trái cây tươi ngon của chúng tôi ngay nhé!</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-semibold hover:bg-primary-dark transition-transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
        >
          Tiếp tục mua sắm
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <h1 className="page-title text-[32px] md:text-[42px] mb-8 text-secondary">Giỏ hàng của bạn</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8 space-y-4 mb-8 lg:mb-0">
          <div className="bg-white rounded-2xl border border-[#efe7dc] overflow-hidden">
            {cart.items.map((item, index) => (
              <div key={item.id} className={`p-5 flex items-center gap-5 ${index !== cart.items.length - 1 ? 'border-b border-[#efe7dc]/60' : ''}`}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded-xl border border-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.id}`} className="product-title text-[18px] text-secondary hover:text-primary line-clamp-2 leading-snug mb-1 transition-colors">
                    {item.title}
                  </Link>
                  <div className="product-price text-primary text-[16px] mb-3">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-200 rounded-lg h-9 bg-gray-50">
                      <button
                        onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 h-full text-secondary hover:text-primary transition-colors flex items-center justify-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="product-meta px-2 text-secondary min-w-[2.5rem] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 h-full text-secondary hover:text-primary transition-colors flex items-center justify-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-24 py-1">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-full p-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="product-price text-secondary text-[16px] font-semibold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-[#fffaf4] rounded-2xl p-6 border border-[#efe7dc] sticky top-24">
            <h2 className="section-title text-[22px] mb-5">Tóm tắt đơn hàng</h2>

            <div className="space-y-4 text-sm text-gray-600 border-b border-[#efe7dc] pb-5 mb-5">
              <div className="flex justify-between items-center">
                <span>Tổng số lượng</span>
                <span className="font-medium text-secondary">{cart.count} sản phẩm</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Tạm tính</span>
                <span className="font-medium text-secondary">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-6">
              <span className="product-meta text-secondary font-semibold text-lg">Tổng cộng</span>
              <span className="product-price text-[24px] text-primary leading-none">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
              </span>
            </div>

            <p className="text-[#8b7b68] text-xs mb-6 text-center">Phí vận chuyển sẽ được tính trong bước thanh toán</p>

            <Link
              to="/checkout"
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary-dark transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              Tiến hành thanh toán
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
