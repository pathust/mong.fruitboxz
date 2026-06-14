import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../lib/api'
import { decodeJwt } from '../lib/jwt'

export default function Login() {
  const navigate = useNavigate()
  const { login: customerLogin, customer, logout } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      try {
        const adminData = await apiFetch('/auth/user/emailpass', {
          method: 'POST',
          body: JSON.stringify({ email: form.email, password: form.password }),
        })

        const payload = decodeJwt(adminData.token)
        if (payload?.actor_type === 'user') {
          localStorage.setItem('admin_token', adminData.token)
          const userInfo = {
            id: payload.actor_id,
            email: form.email,
            roles: payload.app_metadata?.roles || [],
          }
          localStorage.setItem('admin_user', JSON.stringify(userInfo))
          navigate('/admin')
          return
        }
      } catch {
        // Continue with customer auth flow
      }

      const customerData = await apiFetch('/auth/customer/emailpass', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      customerLogin(customerData.token)
      navigate('/account')
    } catch (err) {
      setError(err.message || 'Sai email hoặc mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  const adminUserStr = localStorage.getItem('admin_user')
  const adminUser = adminUserStr ? JSON.parse(adminUserStr) : null
  const loggedInUser = customer || adminUser

  if (loggedInUser) {
    return (
      <div className="min-h-[600px] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-[#fffaf3] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#eadfcd]">
            <span className="text-2xl">👋</span>
          </div>
          <h1 className="text-2xl font-bold text-[#3d342c] mb-2">Đã đăng nhập</h1>
          <p className="text-[#766957] mb-6">
            Bạn đang đăng nhập với tài khoản <strong className="text-primary">{loggedInUser.email}</strong>
          </p>
          <div className="space-y-3">
            <Link to={customer ? "/account" : "/admin"} className="block w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#a04620] transition-colors">
              Đến trang {customer ? "tài khoản" : "quản trị"}
            </Link>
            <button
              onClick={() => {
                if (customer) logout()
                if (adminUser) {
                  localStorage.removeItem('admin_token')
                  localStorage.removeItem('admin_user')
                }
                navigate('/')
                window.location.reload()
              }}
              className="block w-full bg-[#fbf7f1] text-[#a04620] py-3 rounded-lg font-semibold border border-[#eadfcd] hover:bg-[#f4e8d7] transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[600px] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary">Đăng nhập</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Mật khẩu</label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/auth/register" className="text-primary hover:text-primary-dark font-medium">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
