import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, Navigation } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { apiFetch } from '../lib/api'
import { getOrderCode } from '../lib/orderCodes'

const HANOI_DISTRICTS = [
  { district: 'Hoan Kiem', city: 'Ha Noi', lat: 21.0288, lng: 105.8522, aliases: ['hoan kiem', 'hoàn kiếm'], fastLane: true },
  { district: 'Ba Dinh', city: 'Ha Noi', lat: 21.0359, lng: 105.8142, aliases: ['ba dinh', 'ba đình'], fastLane: true },
  { district: 'Dong Da', city: 'Ha Noi', lat: 21.0181, lng: 105.8292, aliases: ['dong da', 'đống đa'], fastLane: true },
  { district: 'Hai Ba Trung', city: 'Ha Noi', lat: 21.0059, lng: 105.8575, aliases: ['hai ba trung', 'hai bà trưng'], fastLane: true },
  { district: 'Cau Giay', city: 'Ha Noi', lat: 21.0301, lng: 105.7829, aliases: ['cau giay', 'cầu giấy'], fastLane: true },
  { district: 'Thanh Xuan', city: 'Ha Noi', lat: 20.9931, lng: 105.8048, aliases: ['thanh xuan', 'thanh xuân'], fastLane: true },
  { district: 'Tay Ho', city: 'Ha Noi', lat: 21.0702, lng: 105.8187, aliases: ['tay ho', 'tây hồ'], fastLane: true },
  { district: 'Hoang Mai', city: 'Ha Noi', lat: 20.9744, lng: 105.8632, aliases: ['hoang mai', 'hoàng mai'] },
  { district: 'Long Bien', city: 'Ha Noi', lat: 21.0481, lng: 105.8882, aliases: ['long bien', 'long biên'] },
  { district: 'Nam Tu Liem', city: 'Ha Noi', lat: 21.0126, lng: 105.7653, aliases: ['nam tu liem', 'nam từ liêm'] },
  { district: 'Bac Tu Liem', city: 'Ha Noi', lat: 21.0711, lng: 105.7707, aliases: ['bac tu liem', 'bắc từ liêm'] },
  { district: 'Ha Dong', city: 'Ha Noi', lat: 20.9541, lng: 105.7688, aliases: ['ha dong', 'hà đông'] },
]

function normalizeAddress(raw = '') {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(q|quan|huyen|thi xa|tx|tp|thanh pho)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (value) => value * Math.PI / 180
  const earthRadiusKm = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function estimateShippingLocally(form) {
  const matched = findLocalDistrict("", form.address)
  if (!matched) return null
  const distanceKm = haversineKm(21.012805, 105.836483, matched.lat, matched.lng)
  const rawFee = 18000 + (distanceKm * 2200)
  const roundedFee = Math.ceil(rawFee / 1000) * 1000
  const fee = matched.fastLane ? 18000 : Math.min(60000, Math.max(18000, roundedFee))
  return {
    shipping: fee,
    mode: matched.fastLane ? 'local-fast-lane' : 'local-distance-estimate',
    matched_location: matched,
  }
}

function findLocalDistrict(query = '', fullAddress = '') {
  const districtNorm = normalizeAddress(query)
  const addressNorm = normalizeAddress(fullAddress || query)
  return HANOI_DISTRICTS.find((record) =>
    [record.district, ...record.aliases].map(normalizeAddress).some((value) => value === districtNorm || addressNorm.includes(value))
  ) || null
}

function shippingModeLabel(mode) {
  const labels = {
    'pending-address': 'Nhập quận/huyện để tính phí',
    'fallback-empty': 'Nhập quận/huyện để tính phí',
    'district-fast-lane': 'Tuyến nhanh nội thành',
    'distance-estimate': 'Ước tính theo khoảng cách',
    'static-hanoi': 'Bảng phí Hà Nội',
    'static-non-hanoi': 'Bảng phí ngoài Hà Nội',
    'local-fast-lane': 'Tuyến nhanh nội thành',
    'local-distance-estimate': 'Ước tính offline theo khu vực',
    fallback: 'Bảng phí dự phòng',
  }
  return labels[mode] || mode
}

function districtToLocation(record) {
  return {
    city: record.city,
    district: record.district,
    lat: record.lat,
    lng: record.lng,
    fast_lane: Boolean(record.fastLane),
  }
}

export default function Checkout() {
  const { cart, clearCart } = useCart()
  const location = useLocation()
  // Use only the items the user selected in Cart; fall back to all items
  const checkoutItems = location.state?.selectedItems || cart.items
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    lat: null,
    lng: null,
    note: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quoteMode, setQuoteMode] = useState('pending-address')
  const [matchedLocation, setMatchedLocation] = useState(null)
  const [shippingLoading, setShippingLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationFeedback, setLocationFeedback] = useState(null)
  const [promoCode, setPromoCode] = useState('')
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [discountData, setDiscountData] = useState(null)

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const [shipping, setShipping] = useState(30000)
  const { address, lat, lng } = form

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setApplyingPromo(true)
    setPromoError('')
    try {
      const res = await apiFetch('/store/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode, subtotal })
      })
      if (res.valid) {
        setDiscountData(res)
      } else {
        setPromoError('Mã giảm giá không hợp lệ')
      }
    } catch (err) {
      setPromoError(err.message || 'Mã giảm giá không hợp lệ')
    } finally {
      setApplyingPromo(false)
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationFeedback({ type: 'error', message: 'Trình duyệt của bạn không hỗ trợ định vị.' })
      return
    }

    setLocating(true)
    setLocationFeedback(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const location = await apiFetch(`/store/geocode/reverse?lat=${latitude}&lng=${longitude}`)
          const resolvedAddress = location.address?.trim()

          setForm(prev => ({
            ...prev,
            ...(resolvedAddress ? { address: resolvedAddress } : {}),
            lat: latitude,
            lng: longitude
          }))

          const matched = findLocalDistrict(location.district, resolvedAddress || location.area_label || '')
          if (matched) {
            setMatchedLocation(districtToLocation(matched))
          }

          if (resolvedAddress) {
            setLocationFeedback({
              type: 'info',
              message: 'Đã điền địa chỉ từ vị trí hiện tại. Vui lòng kiểm tra và bổ sung số nhà nếu cần.'
            })
          } else {
            setLocationFeedback({
              type: 'info',
              message: `${location.area_label || 'Đã xác định khu vực hiện tại'}. Vui lòng nhập thêm số nhà và tên đường.`
            })
          }
        } catch (err) {
          console.error("Geocoding failed:", err)
          setForm(prev => ({ ...prev, lat: latitude, lng: longitude }))
          setLocationFeedback({
            type: 'error',
            message: 'Đã lấy được vị trí nhưng chưa xác định được địa chỉ. Vui lòng nhập số nhà, tên đường và khu vực.'
          })
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        if (err.code === 1) {
          setLocationFeedback({ type: 'error', message: 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng nhập địa chỉ thủ công.' })
        } else {
          setLocationFeedback({ type: 'error', message: 'Không thể lấy vị trí hiện tại. Vui lòng thử lại hoặc nhập thủ công.' })
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    if (!address.trim()) {
      const timer = window.setTimeout(() => {
        setShipping(30000)
        setQuoteMode('pending-address')
        setMatchedLocation(null)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    const controller = new AbortController()
    const run = async () => {
      try {
        setShippingLoading(true)
        const data = await apiFetch('/store/shipping/quote', {
          method: 'POST',
          signal: controller.signal,
          body: JSON.stringify({
            address,
            lat,
            lng,
          }),
        })
        if (!controller.signal.aborted) {
          setShipping(Number(data.shipping) || 30000)
          setQuoteMode(data.mode || 'static-hanoi')
          setMatchedLocation(data.matched_location || null)
        }
      } catch (err) {
        if (err?.name === 'AbortError') return // ignore cancelled requests
        const localQuote = estimateShippingLocally({ address, lat, lng })
        setShipping(localQuote?.shipping || 30000)
        setQuoteMode(localQuote?.mode || 'fallback')
        setMatchedLocation(localQuote?.matched_location || null)
      } finally {
        if (!controller.signal.aborted) setShippingLoading(false)
      }
    }

    const timer = window.setTimeout(run, 300)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
      setShippingLoading(false)
    }
  }, [address, lat, lng])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const localMatch = matchedLocation || findLocalDistrict(form.district, form.address)

      const token = localStorage.getItem('customer_token')

      const res = await apiFetch('/store/checkout', {
        method: 'POST',
        token,
        body: JSON.stringify({
          items: checkoutItems.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            image: item.image,
            variant_id: item.variantId,
            product_id: item.productId || undefined,
            frontend_item_id: item.id,
          })),
          shipping: {
            name: form.name,
            phone: form.phone,
            email: form.email.trim() || undefined,
            address: form.address,
            city: localMatch?.city || "Hà Nội",
            district: localMatch?.district || undefined,
            lat: localMatch?.lat ?? form.lat,
            lng: localMatch?.lng ?? form.lng,
            note: form.note,
          },
          promotion_code: discountData?.code || undefined,
        }),
      })

      const finalAmount = subtotal - (discountData?.discount_amount || 0) + shipping
      const displayId = res?.order ? getOrderCode(res.order) : form.phone

      clearCart()
      setSubmitted({ amount: finalAmount, orderId: displayId })
    } catch (err) {
      setError(err.message || 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (checkoutItems.length === 0 && !submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Giỏ hàng trống</h1>
        <p className="text-gray-500 mb-8">Vui lòng thêm sản phẩm trước khi thanh toán</p>
        <Link to="/products" className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark">
          Mua ngay
        </Link>
      </div>
    )
  }

  if (submitted) {
    const qrUrl = `https://img.vietqr.io/image/970415-106877069794-print.png?amount=${submitted.amount}&addInfo=THANH%20TOAN%20DON%20${submitted.orderId}&accountName=Mong%20Fruitboxz`
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-500 mb-8">Cảm ơn bạn đã đặt hàng. Vui lòng quét mã QR bên dưới để thanh toán.</p>

        <div className="bg-white rounded-3xl shadow-[0_16px_40px_-20px_rgba(73,48,28,0.2)] border border-[#efe7dc] p-8 inline-block mb-8 max-w-sm w-full">
          <p className="font-semibold text-secondary mb-6 text-lg uppercase tracking-wider text-[13px]">Quét mã VietQR</p>
          <div className="bg-[#fcf8f2] p-4 rounded-2xl mb-6">
            <img src={qrUrl} alt="VietQR" className="mx-auto w-full h-auto object-contain rounded-xl mix-blend-multiply" />
          </div>
          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
              <span className="text-gray-500">Số tiền:</span>
              <span className="font-bold text-primary text-base">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(submitted.amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Nội dung:</span>
              <span className="font-bold text-secondary text-right truncate pl-4">THANH TOAN DON {submitted.orderId}</span>
            </div>
          </div>
        </div>

        <div>
          <Link to="/order-history" className="text-primary font-medium hover:underline inline-flex items-center gap-1.5">
            Xem lịch sử đơn hàng
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-12 animate-fadeIn">
      <h1 className="page-title text-[32px] md:text-[42px] mb-8 text-secondary">Thanh toán</h1>

      <form onSubmit={handleSubmit}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#efe7dc] shadow-sm">
              <h2 className="section-title text-[24px] mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Thông tin giao hàng
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="product-meta block text-sm text-secondary font-medium mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    placeholder="Nguyễn Văn A" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="product-meta block text-sm text-secondary font-medium mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                    <input type="tel" required minLength={10} value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="0987654321" />
                  </div>
                  <div>
                    <label className="product-meta block text-sm text-secondary font-medium mb-1.5">Email</label>
                    <input type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      placeholder="email@example.com" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="product-meta block text-sm text-secondary font-medium">Địa chỉ <span className="text-red-500">*</span></label>
                    <button type="button" onClick={handleGetLocation} disabled={locating} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline disabled:opacity-50">
                      {locating ? (
                        <>
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang định vị...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-3.5 h-3.5" />
                          Lấy vị trí hiện tại
                        </>
                      )}
                    </button>
                  </div>
                  <input type="text" required minLength={5} value={form.address}
                    onChange={e => {
                      setForm({ ...form, address: e.target.value })
                      setLocationFeedback(null)
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    placeholder="Số nhà, tên đường, phường/xã" />
                  {locationFeedback && (
                    <p
                      role={locationFeedback.type === 'error' ? 'alert' : 'status'}
                      className={`mt-2 text-xs ${locationFeedback.type === 'error' ? 'text-red-500' : 'text-blue-700'}`}
                    >
                      {locationFeedback.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="product-meta block text-sm text-secondary font-medium mb-1.5">Ghi chú (không bắt buộc)</label>
                  <textarea value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
                    rows={3} placeholder="Ghi chú thêm cho đơn hàng..." />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="bg-[#fffaf4] rounded-2xl p-6 md:p-8 border border-[#efe7dc] sticky top-24 shadow-sm">
              <h2 className="section-title text-[24px] mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Đơn hàng của bạn
              </h2>
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {checkoutItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-[#efe7dc]/60">
                    <div className="relative">
                      <img src={item.image || '/mong_logo-removebg.png'} alt={item.title} className="w-16 h-16 object-cover rounded-lg border border-gray-100" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/mong_logo-removebg.png' }} />
                      <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{item.quantity}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="product-title text-sm text-secondary line-clamp-2 leading-snug">{item.title}</p>
                    </div>
                    <span className="product-price text-sm font-semibold text-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#efe7dc] pt-5 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="product-meta text-gray-500">Tạm tính:</span>
                  <span className="product-price font-medium text-secondary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                </div>
                {discountData && discountData.discount_amount > 0 && (
                  <div className="flex justify-between text-sm items-center text-green-600">
                    <span className="product-meta">Giảm giá ({discountData.code}):</span>
                    <span className="product-price font-medium">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountData.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm items-center">
                  <span className="product-meta text-gray-500">Phí vận chuyển:</span>
                  {shippingLoading ? (
                    <span className="text-gray-400 text-xs italic flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tính...
                    </span>
                  ) : (
                    <span className="product-price font-medium text-secondary">
                      {shipping === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shipping)}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Mã giảm giá"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={applyingPromo || !promoCode.trim()}
                    className="bg-secondary text-white px-4 py-2 rounded-xl font-medium hover:bg-secondary-dark disabled:opacity-60 transition-colors text-sm whitespace-nowrap"
                  >
                    {applyingPromo ? 'Đang xét...' : 'Áp dụng'}
                  </button>
                </div>
                {promoError && <p className="text-red-500 text-xs mt-1.5 ml-1">{promoError}</p>}
                {discountData && (
                  <p className="text-green-600 text-xs mt-1.5 ml-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Áp dụng thành công mã <strong>{discountData.code}</strong>
                    {discountData.remaining_usages !== undefined && ` (còn ${discountData.remaining_usages} lượt)`}
                  </p>
                )}
              </div>

              <div className="bg-white rounded-xl p-4 border border-primary/20 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="product-title text-secondary text-[18px]">Tổng thanh toán:</span>
                  <span className="product-price text-primary text-[24px] leading-none">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.max(0, subtotal - (discountData?.discount_amount || 0) + shipping))}
                  </span>
                </div>
                <p className="text-xs text-gray-400 text-right">(Đã bao gồm VAT nếu có)</p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3.5 mb-6 text-sm text-blue-800 flex gap-3">
                <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1 text-blue-900">{shippingModeLabel(quoteMode)}</div>
                  <p className="text-xs leading-relaxed text-blue-700/80">
                    Phí ship được tính tự động dựa trên khoảng cách từ cửa hàng đến quận/huyện của bạn.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 items-start text-red-600 text-sm">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary-dark transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Hoàn tất đặt hàng
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Bằng cách đặt hàng, bạn đồng ý với <Link to="/payment-policy" className="text-primary hover:underline">chính sách thanh toán</Link> của chúng tôi
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
