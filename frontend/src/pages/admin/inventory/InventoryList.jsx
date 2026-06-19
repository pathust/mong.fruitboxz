import { useCallback, useMemo, useState, useEffect } from "react"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { Package, Save, AlertCircle, Leaf } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"

function getIngredientStock(ingredient) {
  const locationLevel = ingredient.location_levels?.[0]
  return {
    linked: Boolean(locationLevel),
    location_id: locationLevel?.location_id,
    stock: Number(locationLevel?.stocked_quantity || 0),
  }
}

export default function InventoryList() {
  const { api } = useAdminAuth()
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState("all")
  const [updates, setUpdates] = useState({})

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api("/admin/custom/inventory")
      if (res?.ingredients) {
        setIngredients(res.ingredients)
      }
    } catch (error) {
      console.error("Lỗi lấy tồn kho:", error)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  const filteredItems = useMemo(() => {
    return ingredients.filter(ing => {
      // 1. Search
      const searchMatch = filterBySearch(ing, searchTerm, ["title", "sku"])
      if (!searchMatch) return false

      // 2. Stock status filter
      const { stock } = getIngredientStock(ing)
      switch (stockFilter) {
        case "in_stock": return stock > 0
        case "low_stock": return stock > 0 && stock <= 10
        case "out_of_stock": return stock === 0
        default: return true
      }
    })
  }, [ingredients, searchTerm, stockFilter])

  const handleUpdateStock = (ingredientId, locationId, value) => {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 0) return
    setUpdates(prev => ({
      ...prev,
      [ingredientId]: {
        location_id: locationId,
        stocked_quantity: num
      }
    }))
  }

  const handleSaveAll = async () => {
    const updateEntries = Object.entries(updates)
    if (!updateEntries.length) return

    try {
      for (const [ingredientId, data] of updateEntries) {
        await api("/admin/custom/inventory", {
          method: "POST",
          body: {
            inventory_item_id: ingredientId,
            location_id: data.location_id,
            stocked_quantity: data.stocked_quantity
          }
        })
      }
      setUpdates({})
      fetchInventory()
      alert("Cập nhật tồn kho nguyên liệu thành công!")
    } catch (err) {
      alert("Lỗi khi cập nhật tồn kho: " + err.message)
    }
  }

  const stockFilterOptions = [
    { label: "Tất cả", value: "all" },
    { label: "Còn hàng (>0)", value: "in_stock" },
    { label: "Sắp hết (<=10)", value: "low_stock" },
    { label: "Hết hàng (0)", value: "out_of_stock" }
  ]

  return (
    <div className="space-y-6 pb-20">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Kho & Chi phí</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Tồn kho
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý số lượng tồn kho của các nguyên liệu thô.</p>
          </div>
        
        
      </div>
      </AdminHeaderPortal>

      <AdminListFilters
        actions={
          <>
            {Object.keys(updates).length > 0 && (
          <button
            onClick={handleSaveAll}
            className="admin-button-primary px-6 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20 animate-in fade-in slide-in-from-bottom-2"
          >
            <Save className="w-4 h-4" /> Lưu Thay Đổi ({Object.keys(updates).length})
          </button>
        )}
          </>
        }
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên nguyên liệu, SKU..."
        filters={[
          {
            id: "stock-filter",
            label: "Trạng thái tồn kho",
            value: stockFilter,
            options: stockFilterOptions,
            onChange: setStockFilter
          }
        ]}
        total={ingredients.length}
        showing={filteredItems.length}
      />

      <div className="admin-table overflow-x-auto">
        {loading ? (
          <div className="text-center py-20 text-[#a08d79]">
            <div className="h-8 w-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            Đang tải dữ liệu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[#faf6f0] rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#d4c5b3]" />
            </div>
            <h3 className="text-lg font-bold text-secondary mb-2">Không tìm thấy nguyên liệu</h3>
            <p className="text-[#8a7a67]">Thử thay đổi bộ lọc hoặc tìm kiếm khác.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-[#eadfcd]">
              <tr>
                <th className="px-5 py-4 font-bold text-secondary">Nguyên liệu</th>
                <th className="px-5 py-4 font-bold text-secondary">Phân loại</th>
                <th className="px-5 py-4 font-bold text-secondary">Đơn vị</th>
                <th className="px-5 py-4 font-bold text-secondary">Tồn kho (Số lượng)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]">
              {filteredItems.map(ingredient => {
                const { stock, linked, location_id } = getIngredientStock(ingredient)
                const pendingUpdate = updates[ingredient.id]
                const currentVal = pendingUpdate !== undefined ? pendingUpdate.stocked_quantity : stock
                
                return (
                  <tr key={ingredient.id} className={stock === 0 ? "bg-red-50/20" : ""}>
                    <td className="px-5 py-4">
                      <div className="font-bold text-secondary text-[15px] flex items-center gap-2">
                        <Leaf className="w-4 h-4 text-primary" />
                        {ingredient.title}
                      </div>
                      {ingredient.sku && (
                        <div className="text-xs text-[#8a7a67] font-mono mt-1 ml-6">{ingredient.sku}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#faf6f0] text-[#8a7a67]">
                        {ingredient.metadata?.category || "Khác"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-secondary">
                        {ingredient.metadata?.unit || "-"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {!linked ? (
                        <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">Chưa setup kho</span>
                      ) : (
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <input
                            type="number"
                            min="0"
                            value={currentVal}
                            onChange={e => handleUpdateStock(ingredient.id, location_id, e.target.value)}
                            className={`admin-input w-24 text-center font-mono ${pendingUpdate !== undefined ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}
                          />
                          {currentVal === 0 && (
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Hết hàng</span>
                          )}
                          {currentVal > 0 && currentVal <= 10 && (
                            <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded">Sắp hết</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
