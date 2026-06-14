import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

const statusMap = {
  pending: { label: 'Chờ xác nhận', color: 'text-orange-500 bg-orange-50' },
  requires_action: { label: 'Cần xử lý', color: 'text-yellow-500 bg-yellow-50' },
  canceled: { label: 'Đã hủy', color: 'text-red-500 bg-red-50' },
  fulfilled: { label: 'Đã giao', color: 'text-green-600 bg-green-50' },
  partially_fulfilled: { label: 'Đang giao', color: 'text-blue-500 bg-blue-50' },
  returned: { label: 'Đã trả', color: 'text-gray-500 bg-gray-50' },
}

export default function OrderHistory() {
  const { customer } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customer) { navigate('/auth/login'); return }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('customer_token')
        const data = await apiFetch('/store/checkout', { token })
        setOrders(data.orders || [])
      } catch (err) {
        console.error('Failed to fetch orders', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [customer, navigate])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-8">Lịch sử đơn hàng</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
          <Link to="/products" className="inline-block mt-4 text-primary font-medium">Mua ngay</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const st = statusMap[order.status] || { label: order.status, color: 'text-gray-500 bg-gray-50' }
            const total = order.items?.reduce((s, i) => s + (i.unit_price * i.quantity), 0) || 0
            return (
              <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-semibold text-secondary">#{order.display_id || order.id.slice(0, 8)}</span>
                    <span className="text-gray-400 text-sm ml-3">
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 line-clamp-1">{item.title} x{item.quantity}</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-xs text-gray-400">+{order.items.length - 3} sản phẩm khác</p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{order.items?.length || 0} sản phẩm</span>
                  <span className="text-primary font-bold">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}
                  </span>
                </div>
                {order.metadata?.note && (
                  <p className="text-xs text-gray-400 mt-2">Ghi chú: {order.metadata.note}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
