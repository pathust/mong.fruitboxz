import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { cart, removeItem, updateQuantity } = useCart()
  const navigate = useNavigate()

  // selected: Set of item ids
  const [selected, setSelected] = useState(() => new Set(cart.items.map(i => i.id)))

  const allChecked = cart.items.length > 0 && selected.size === cart.items.length
  const someChecked = selected.size > 0 && selected.size < cart.items.length

  const toggleAll = () => {
    if (allChecked) setSelected(new Set())
    else setSelected(new Set(cart.items.map(i => i.id)))
  }

  const toggleItem = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedItems = useMemo(
    () => cart.items.filter(i => selected.has(i.id)),
    [cart.items, selected]
  )

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [selectedItems]
  )

  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0)

  const handleCheckout = () => {
    navigate('/checkout', { state: { selectedItems } })
  }

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
        {/* Item list */}
        <div className="lg:col-span-8 space-y-3 mb-8 lg:mb-0">

          {/* Select-all bar */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#fffaf4] rounded-2xl border border-[#efe7dc]">
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all shrink-0"
              style={{
                borderColor: allChecked ? '#ea5a2a' : someChecked ? '#ea5a2a' : '#d4c4b0',
                background: allChecked ? '#ea5a2a' : 'white',
              }}
              aria-label="Chọn tất cả"
            >
              {allChecked && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {someChecked && !allChecked && (
                <div className="w-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <span className="product-meta text-sm text-secondary font-medium">
              Chọn tất cả ({cart.items.length} sản phẩm)
            </span>
            {selected.size > 0 && (
              <span className="ml-auto text-xs text-primary font-semibold">
                Đã chọn {selected.size} sản phẩm
              </span>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-[#efe7dc] overflow-hidden divide-y divide-[#efe7dc]/60">
            {cart.items.map((item) => {
              const isSelected = selected.has(item.id)
              return (
                <div
                  key={item.id}
                  className={`p-5 flex items-center gap-4 transition-colors duration-150 ${isSelected ? 'bg-white' : 'bg-gray-50/60'}`}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all shrink-0"
                    style={{
                      borderColor: isSelected ? '#ea5a2a' : '#d4c4b0',
                      background: isSelected ? '#ea5a2a' : 'white',
                    }}
                    aria-label={`Chọn ${item.title}`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Image */}
                  <Link to={`/products/${item.slug || item.id}`} className={`shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
                    <img
                      src={item.image || '/mong_logo-removebg.png'}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-xl border border-gray-100"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/mong_logo-removebg.png' }}
                    />
                  </Link>

                  {/* Info */}
                  <div className={`flex-1 min-w-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
                    <Link to={`/products/${item.slug || item.id}`} className="product-title text-[16px] text-secondary hover:text-primary line-clamp-2 leading-snug mb-1 transition-colors">
                      {item.title}
                    </Link>
                    {item.variantLabel && (
                      <p className="text-xs text-gray-400 mb-1">{item.variantLabel}</p>
                    )}
                    <div className="product-price text-primary text-[15px] mb-2">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg h-8 bg-gray-50 w-fit">
                      <button
                        onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 h-full text-secondary hover:text-primary transition-colors flex items-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="product-meta px-2 text-secondary min-w-[2rem] text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 h-full text-secondary hover:text-primary transition-colors flex items-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Price + delete */}
                  <div className="flex flex-col items-end justify-between h-20 py-0.5 shrink-0">
                    <button
                      onClick={() => { removeItem(item.id); setSelected(prev => { const n = new Set(prev); n.delete(item.id); return n }) }}
                      className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-full p-2"
                      aria-label={`Xóa ${item.title}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className={`product-price text-[15px] font-semibold transition-opacity ${isSelected ? 'text-secondary' : 'text-gray-400'}`}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-4">
          <div className="bg-[#fffaf4] rounded-2xl p-6 border border-[#efe7dc] sticky top-24">
            <h2 className="section-title text-[22px] mb-5">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 text-sm text-gray-600 border-b border-[#efe7dc] pb-5 mb-5">
              <div className="flex justify-between items-center">
                <span>Sản phẩm đã chọn</span>
                <span className="font-medium text-secondary">{selectedCount} sản phẩm</span>
              </div>
              {selectedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-xs text-gray-400">
                  <span className="truncate max-w-[160px]">{item.title} ×{item.quantity}</span>
                  <span className="shrink-0 ml-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</span>
                </div>
              ))}
              {selectedItems.length === 0 && (
                <p className="text-xs text-gray-400 italic">Chưa chọn sản phẩm nào</p>
              )}
            </div>

            <div className="flex justify-between items-end mb-6">
              <span className="product-meta text-secondary font-semibold text-lg">Tổng cộng</span>
              <span className="product-price text-[24px] text-primary leading-none">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}
              </span>
            </div>

            <p className="text-[#8b7b68] text-xs mb-6 text-center">Phí vận chuyển sẽ được tính trong bước thanh toán</p>

            <button
              onClick={handleCheckout}
              disabled={selected.size === 0}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all
                disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
                bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5"
            >
              Tiến hành thanh toán
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>

            <Link to="/products" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-[#8b7b68] hover:text-primary transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
