import { useState, useEffect } from "react"
import { Package, Search, Save, AlertCircle } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"

export default function InventoryList() {
  const { api } = useAdminAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [updates, setUpdates] = useState({})

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const res = await api("/admin/custom/inventory")
      if (res?.products) {
        setProducts(res.products)
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStockChange = (inventoryItemId, locationId, value) => {
    setUpdates({
      ...updates,
      [`${inventoryItemId}_${locationId}`]: {
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        stocked_quantity: value
      }
    })
  }

  const handleSave = async (updateKey) => {
    const update = updates[updateKey]
    if (!update) return

    try {
      await api("/admin/custom/inventory", {
        method: "POST",
        body: update
      })
      // Clear this update
      const newUpdates = { ...updates }
      delete newUpdates[updateKey]
      setUpdates(newUpdates)
      alert("Cập nhật thành công")
      fetchInventory()
    } catch (error) {
      alert("Lỗi cập nhật: " + error.message)
    }
  }

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Tồn kho
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý số lượng tồn kho của các sản phẩm
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Sản phẩm</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Phân loại (Variant)</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tồn kho hiện tại</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Không tìm thấy sản phẩm nào</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  (product.variants || []).map((variant, index) => {
                    // Extract inventory item and level
                    // Medusa v2 links variants to inventory_items
                    const inventoryItemObj = variant.inventory_items?.[0]
                    const inventoryItem = inventoryItemObj?.inventory
                    const locationLevel = inventoryItem?.location_levels?.[0]

                    const inventoryItemId = inventoryItem?.id
                    const locationId = locationLevel?.location_id || "default_location" // Usually you'd fetch locations
                    const currentStock = locationLevel?.stocked_quantity || 0

                    const updateKey = `${inventoryItemId}_${locationId}`
                    const hasUpdate = updates[updateKey] !== undefined
                    const displayStock = hasUpdate ? updates[updateKey].stocked_quantity : currentStock

                    return (
                      <tr key={variant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {index === 0 ? (
                          <td className="px-6 py-4" rowSpan={product.variants.length}>
                            <div className="flex items-center gap-3">
                              {product.thumbnail ? (
                                <img src={product.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">{product.title}</span>
                            </div>
                          </td>
                        ) : null}
                        <td className="px-6 py-4">
                          <span className="text-gray-600 dark:text-gray-300">{variant.title}</span>
                          {variant.sku && <div className="text-xs text-gray-400 font-mono mt-1">SKU: {variant.sku}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {inventoryItemId ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={displayStock}
                                onChange={(e) => handleStockChange(inventoryItemId, locationId, e.target.value)}
                                className={`w-24 px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 ${hasUpdate ? 'border-blue-400 focus:ring-blue-500/50' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-blue-500/50'}`}
                              />
                              {currentStock <= 5 && !hasUpdate && (
                                <AlertCircle className="w-4 h-4 text-yellow-500" title="Sắp hết hàng" />
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">Chưa liên kết tồn kho</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {hasUpdate && (
                            <button
                              onClick={() => handleSave(updateKey)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ml-auto"
                            >
                              <Save className="w-4 h-4" />
                              Lưu
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
