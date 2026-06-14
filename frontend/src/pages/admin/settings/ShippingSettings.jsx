import { useState, useEffect } from "react"
import { Truck, Save, AlertCircle, MapPin, Map } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"

export default function ShippingSettings() {
  const { api } = useAdminAuth()
  const [settings, setSettings] = useState({
    shipping_base_cost: 30000,
    free_shipping_threshold: 500000,
    shipping_note: "",
    free_shipping_districts: "Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng, Cầu Giấy, Tây Hồ",
    shipping_origin_lat: 21.012805,
    shipping_origin_lng: 105.836483,
    shipping_origin_address: "",
    shipping_base_fee: 18000,
    shipping_fee_per_km: 2200,
    shipping_max_fee: 60000,
    shipping_non_hanoi_fee: 45000
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ lấy vị trí.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`)
          const data = await res.json()
          setSettings(prev => ({
            ...prev,
            shipping_origin_lat: lat,
            shipping_origin_lng: lng,
            shipping_origin_address: data?.display_name?.replace(/, Việt Nam$/i, "").trim() || ""
          }))
        } catch (err) {
          setSettings(prev => ({
            ...prev,
            shipping_origin_lat: lat,
            shipping_origin_lng: lng
          }))
        }
        setLocating(false)
      },
      (err) => {
        alert("Không thể lấy vị trí: " + err.message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleGeocodeAddress = async () => {
    if (!settings.shipping_origin_address) {
      alert("Vui lòng nhập địa chỉ cửa hàng")
      return
    }
    setLocating(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(settings.shipping_origin_address)}&format=json&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        setSettings(prev => ({
          ...prev,
          shipping_origin_lat: Number(data[0].lat),
          shipping_origin_lng: Number(data[0].lon)
        }))
        alert("Đã tìm thấy tọa độ thành công!")
      } else {
        alert("Không tìm thấy tọa độ cho địa chỉ này.")
      }
    } catch (err) {
      alert("Lỗi khi tìm tọa độ: " + err.message)
    } finally {
      setLocating(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await api("/admin/custom?mode=settings")
      if (res?.settings) {
        setSettings({
          shipping_base_cost: res.settings.shipping_base_cost ?? 30000,
          free_shipping_threshold: res.settings.free_shipping_threshold ?? 500000,
          shipping_note: res.settings.shipping_note ?? "",
          free_shipping_districts: res.settings.free_shipping_districts ?? "Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng, Cầu Giấy, Tây Hồ",
          shipping_origin_lat: res.settings.shipping_origin_lat ?? 21.012805,
          shipping_origin_lng: res.settings.shipping_origin_lng ?? 105.836483,
          shipping_origin_address: res.settings.shipping_origin_address ?? "",
          shipping_base_fee: res.settings.shipping_base_fee ?? 18000,
          shipping_fee_per_km: res.settings.shipping_fee_per_km ?? 2200,
          shipping_max_fee: res.settings.shipping_max_fee ?? 60000,
          shipping_non_hanoi_fee: res.settings.shipping_non_hanoi_fee ?? 45000
        })
      }
    } catch (error) {
      console.error("Failed to fetch shipping settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api("/admin/custom?mode=settings", {
        method: "POST",
        body: {
          settings: {
            ...settings,
            shipping_base_cost: Number(settings.shipping_base_cost),
            free_shipping_threshold: Number(settings.free_shipping_threshold),
            shipping_origin_address: settings.shipping_origin_address,
            shipping_origin_lat: Number(settings.shipping_origin_lat),
            shipping_origin_lng: Number(settings.shipping_origin_lng),
            shipping_base_fee: Number(settings.shipping_base_fee),
            shipping_fee_per_km: Number(settings.shipping_fee_per_km),
            shipping_max_fee: Number(settings.shipping_max_fee),
            shipping_non_hanoi_fee: Number(settings.shipping_non_hanoi_fee)
          }
        }
      })
      alert("Lưu cài đặt vận chuyển thành công")
    } catch (error) {
      alert("Lỗi lưu cài đặt: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải cài đặt...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-500" />
            Cài đặt vận chuyển
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Cấu hình phí ship mặc định, phí tính theo km và chính sách freeship
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          <Save className="w-5 h-5" />
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 space-y-8">

          {/* Hướng dẫn */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 items-start border border-blue-100 dark:border-blue-800">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Cách hệ thống tính phí vận chuyển:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Khách thuộc <strong>Khu vực Freeship</strong> hoặc đơn hàng đạt mức <strong>Freeship</strong> sẽ được miễn phí giao hàng (Phí = 0đ).</li>
                <li>Khách trong khu vực nội/ngoại thành sẽ tính phí = <strong>Phí cơ bản + (Khoảng cách × Phí/km)</strong> (Không vượt quá Mức phí tối đa).</li>
                <li>Khách ở ngoại tỉnh (không tính được khoảng cách) sẽ áp dụng <strong>Phí ship cố định (ngoại tỉnh)</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Cấu hình Freeship & Cơ bản */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" />
              Chính sách Freeship & Phí mặc định
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phí ship hiển thị phụ (Fallback VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.shipping_base_cost}
                    onChange={(e) => setSettings({ ...settings, shipping_base_cost: e.target.value })}
                    className="w-full pl-4 pr-12 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">VNĐ</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Miễn phí giao hàng (Freeship) cho đơn từ
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.free_shipping_threshold}
                    onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                    className="w-full pl-4 pr-12 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">VNĐ</span>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Các khu vực/Quận được Miễn phí giao hàng (cách nhau dấu phẩy)
                </label>
                <textarea
                  value={settings.free_shipping_districts}
                  onChange={(e) => setSettings({ ...settings, free_shipping_districts: e.target.value })}
                  rows={2}
                  placeholder="VD: Hoàn Kiếm, Ba Đình, Đống Đa"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

          {/* Cấu hình tính phí theo khoảng cách */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                Tọa độ cửa hàng & Tính phí theo KM
              </h3>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {locating ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                {locating ? "Đang lấy..." : "Lấy vị trí hiện tại"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ cửa hàng</label>
                  <span className="text-xs text-gray-500">Tọa độ ngầm: {settings.shipping_origin_lat}, {settings.shipping_origin_lng}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.shipping_origin_address}
                    onChange={(e) => setSettings({ ...settings, shipping_origin_address: e.target.value })}
                    placeholder="VD: 36 Phố Hoàng Cầu, Đống Đa, Hà Nội..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={locating}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 shrink-0"
                  >
                    Tìm tọa độ
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phí cơ bản ban đầu (VNĐ)</label>
                <input
                  type="number"
                  value={settings.shipping_base_fee}
                  onChange={(e) => setSettings({ ...settings, shipping_base_fee: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phí cộng thêm mỗi KM (VNĐ/km)</label>
                <input
                  type="number"
                  value={settings.shipping_fee_per_km}
                  onChange={(e) => setSettings({ ...settings, shipping_fee_per_km: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mức phí ship tối đa (VNĐ)</label>
                <input
                  type="number"
                  value={settings.shipping_max_fee}
                  onChange={(e) => setSettings({ ...settings, shipping_max_fee: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phí cố định ngoại tỉnh (VNĐ)</label>
                <input
                  type="number"
                  value={settings.shipping_non_hanoi_fee}
                  onChange={(e) => setSettings({ ...settings, shipping_non_hanoi_fee: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 my-6"></div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ghi chú hiển thị cho khách hàng ở trang Thanh toán
            </label>
            <textarea
              value={settings.shipping_note}
              onChange={(e) => setSettings({ ...settings, shipping_note: e.target.value })}
              rows={3}
              placeholder="VD: Giao hàng trong vòng 2h tại khu vực nội thành..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
