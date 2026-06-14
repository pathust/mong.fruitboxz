import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'

function calcOrderTotal(order) {
  if (order?.total && Number(order.total) > 0) return Number(order.total)
  return (order.items || []).reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 0), 0)
}

export default function Account() {
  const { customer, logout } = useAuth()
  const navigate = useNavigate()
  const [customerData, setCustomerData] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customer) { navigate('/auth/login'); return }

    const fetchData = async () => {
      const token = localStorage.getItem('customer_token')

      try {
        const [custData, orderData] = await Promise.all([
          apiFetch('/store/customers/me', { token }),
          apiFetch('/store/checkout', { token }),
        ])

        setCustomerData(custData?.customer || null)
        setOrders(orderData?.orders || [])
      } catch (err) {
        console.error('Failed to fetch account data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [customer, navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-8">Tài khoản</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-semibold text-secondary">{customerData?.first_name || 'Khách'} {customerData?.last_name || 'hàng'}</h2>
              <p className="text-gray-400 text-sm">{customerData?.email || customer?.email}</p>
            </div>
            <nav className="space-y-1">
              <Link to="/account" className="block px-4 py-2.5 bg-primary/10 text-primary rounded-lg font-medium text-sm">Thông tin tài khoản</Link>
              <Link to="/order-history" className="block px-4 py-2.5 text-secondary hover:bg-gray-50 rounded-lg font-medium text-sm">Lịch sử đơn hàng</Link>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg font-medium text-sm">Đăng xuất</button>
            </nav>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-secondary mb-4">Thông tin cá nhân</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Họ</label>
                  <input type="text" defaultValue={customerData?.first_name || ''} readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Tên</label>
                  <input type="text" defaultValue={customerData?.last_name || ''} readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Số điện thoại</label>
                <input type="tel" defaultValue={customerData?.phone || ''} readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                <input type="email" defaultValue={customerData?.email || ''} readOnly
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm" />
              </div>
            </div>
          </div>

          {orders.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm mt-6">
              <h2 className="text-lg font-semibold text-secondary mb-4">Đơn hàng gần đây</h2>
              {orders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-secondary">#{order.display_id || order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calcOrderTotal(order))}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-green-50 text-green-600' :
                      order.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {order.status === 'completed' ? 'Hoàn thành' : order.status === 'pending' ? 'Chờ xử lý' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
