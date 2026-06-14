import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const fruitOptions = [
  { id: 'tao', name: 'Táo Mỹ', price: 15000, image: '/images/7d99e018-1fb0-423d-8ffb-e7bece32b97d.jpeg' },
  { id: 'le', name: 'Lê Hàn Quốc', price: 18000, image: '/images/faf78ec5-06de-43c8-b9a0-57ed196a1bd9.jpeg' },
  { id: 'nho-xanh', name: 'Nho xanh không hạt', price: 25000, image: '/images/6042084e-2350-4ac5-91d4-487500d6c782.jpg' },
  { id: 'nho-do', name: 'Nho đỏ Úc', price: 28000, image: '/images/6042084e-2350-4ac5-91d4-487500d6c782.jpg' },
  { id: 'kiwi', name: 'Kiwi xanh', price: 12000, image: '/images/3bf135c0-0ec2-4d3d-990a-ad61ff5f6e73.jpeg' },
  { id: 'xoai', name: 'Xoài cát Hòa Lộc', price: 20000, image: '/images/93e127a5-68f6-4eaf-9c51-1a93d9763d6c.jpg' },
  { id: 'cam', name: 'Cam Navel Mỹ', price: 10000, image: '/images/583a377d-66f0-403e-8633-1534a82102d9.jpeg' },
  { id: 'buoi', name: 'Bưởi da xanh', price: 35000, image: '/images/f1b6d2e6-15c2-4542-85d7-6d3c4061c503.jpeg' },
  { id: 'dau-tay', name: 'Dâu tây Đà Lạt', price: 30000, image: '/images/dbd00896-3d7f-4c3b-9cca-b1292690b7c1.jpg' },
  { id: 'cherry', name: 'Cherry nhập khẩu', price: 35000, image: '/images/263cafd7-11d7-4980-83a0-85e4491cf373.jpg' },
  { id: 'thanh-long', name: 'Thanh long ruột đỏ', price: 15000, image: '/images/a83bfaae-34ac-4de6-933d-7dbc5ff47235.jpeg' },
  { id: 'dua-hau', name: 'Dưa hấu không hạt', price: 12000, image: '/images/59228bdf-2a65-42e4-a12a-621dae868925.jpg' },
]

const boxTypes = {
  'hop-qua-trai-cay-tu-chon': { name: 'Hộp quà trái cây tự chọn', basePrice: 200000, maxItems: 6 },
  'hop-hoa-qua-mix-tu-chon': { name: 'Hộp hoa quả mix tự chọn', basePrice: 150000, maxItems: 4 },
}

export default function CustomBox() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const [selected, setSelected] = useState([])

  const box = boxTypes[slug] || boxTypes['hop-qua-trai-cay-tu-chon']
  const total = box.basePrice + selected.reduce((sum, id) => {
    const fruit = fruitOptions.find(f => f.id === id)
    return sum + (fruit?.price || 0)
  }, 0)

  const toggleFruit = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : prev.length < box.maxItems ? [...prev, id] : prev
    )
  }

  const handleAddToCart = () => {
    if (selected.length === 0) return
    addItem({
      id: `custom-${Date.now()}`,
      title: `${box.name} (${selected.length} loại)`,
      price: total,
      image: fruitOptions.find(f => f.id === selected[0])?.image || '',
      quantity: 1,
    })
    alert('Đã thêm vào giỏ hàng!')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <span className="text-secondary">{box.name}</span>
      </nav>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-secondary mb-3">{box.name}</h1>
        <p className="text-gray-500">Chọn tối đa {box.maxItems} loại trái cây yêu thích của bạn</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {fruitOptions.map(fruit => {
              const isSelected = selected.includes(fruit.id)
              return (
                <button
                  key={fruit.id}
                  onClick={() => toggleFruit(fruit.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 bg-white hover:border-primary/30 hover:shadow-sm'
                  }`}
                >
                  <img src={fruit.image} alt={fruit.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                  <p className="text-sm font-medium text-secondary">{fruit.name}</p>
                  <p className="text-primary font-semibold text-sm mt-1">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fruit.price)}
                  </p>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
            <h3 className="font-semibold text-secondary text-lg mb-4">Giỏ của bạn</h3>
            {selected.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Chưa chọn loại quả nào</p>
            ) : (
              <div className="space-y-3 mb-4">
                {selected.map(id => {
                  const fruit = fruitOptions.find(f => f.id === id)
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <span className="text-sm text-secondary">{fruit?.name}</span>
                      <span className="text-sm text-primary font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fruit?.price || 0)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Hộp:</span>
                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(box.basePrice)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-secondary">Tổng:</span>
                <span className="text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
              </div>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={selected.length === 0}
              className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-primary/70 disabled:cursor-not-allowed"
            >
              Thêm vào giỏ hàng
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Đã chọn {selected.length}/{box.maxItems} loại</p>
          </div>
        </div>
      </div>
    </div>
  )
}
