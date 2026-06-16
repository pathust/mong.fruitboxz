import { useCallback, useMemo, useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Leaf } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"

// Simple inline modal to avoid missing imports
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function IngredientsList() {
  const { api } = useAdminAuth()
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")

  const [form, setForm] = useState({
    title: "",
    sku: "",
    unit: "kg",
    cost_per_unit: 0,
    category: "Fruit",
  })

  const fetchIngredients = useCallback(async () => {
    try {
      const res = await api("/admin/inventory-items?limit=500")
      if (res?.inventory_items) {
        // Map to our unified format using metadata
        const mapped = res.inventory_items.map(item => ({
          id: item.id,
          title: item.title,
          sku: item.sku,
          unit: item.metadata?.unit || "kg",
          category: item.metadata?.category || "Fruit",
          cost_per_unit: item.metadata?.cost_per_unit ? Number(item.metadata.cost_per_unit) : 0
        }))
        setIngredients(mapped)
      }
    } catch (err) {
      console.error("Failed to fetch ingredients:", err)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(fetchIngredients, 0)
    return () => window.clearTimeout(timer)
  }, [fetchIngredients])

  const handleSave = async (e) => {
    e.preventDefault()

    // Fallback SKU if empty
    const skuToUse = form.sku ? form.sku : `ING-${Date.now()}`

    try {
      const payload = {
        title: form.title,
        sku: skuToUse,
        requires_shipping: false,
        metadata: {
          unit: form.unit,
          category: form.category,
          cost_per_unit: Number(form.cost_per_unit)
        }
      }

      if (editingItem) {
        await api(`/admin/inventory-items/${editingItem.id}`, {
          method: "POST",
          body: JSON.stringify(payload)
        })
      } else {
        const createRes = await api(`/admin/inventory-items`, {
          method: "POST",
          body: JSON.stringify(payload)
        })

        // Ensure the inventory item has a location level if it was created successfully
        // We will try to fetch the first stock location and link it
        if (createRes?.inventory_item) {
          try {
             const locRes = await api("/admin/stock-locations?limit=1")
             if (locRes?.stock_locations && locRes.stock_locations.length > 0) {
               const locId = locRes.stock_locations[0].id
               await api(`/admin/inventory-items/${createRes.inventory_item.id}/location-levels`, {
                 method: "POST",
                 body: JSON.stringify({
                   location_id: locId,
                   stocked_quantity: 0
                 })
               })
             }
          } catch(e) {
             console.warn("Could not automatically link to stock location:", e)
          }
        }
      }

      setIsModalOpen(false)
      fetchIngredients()
    } catch (err) {
      console.error(err)
      alert("Lỗi: " + (err.message || JSON.stringify(err)))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nguyên liệu này?")) return
    try {
      await api(`/admin/inventory-items/${id}`, { method: "DELETE" })
      fetchIngredients()
    } catch (err) {
      console.error(err)
      alert("Lỗi khi xóa: " + err.message)
    }
  }

  const openNew = () => {
    setEditingItem(null)
    setForm({ title: "", sku: "", unit: "kg", cost_per_unit: 0, category: "Fruit" })
    setIsModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setForm({ ...item })
    setIsModalOpen(true)
  }

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(ingredients.map((item) => item.category).filter(Boolean))]
    return [
      { value: "all", label: "Tất cả phân loại" },
      ...categories.map((category) => ({ value: category, label: category })),
    ]
  }, [ingredients])

  const unitOptions = useMemo(() => {
    const units = [...new Set(ingredients.map((item) => item.unit).filter(Boolean))]
    return [
      { value: "all", label: "Tất cả đơn vị" },
      ...units.map((unit) => ({ value: unit, label: unit })),
    ]
  }, [ingredients])

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      return (
        filterBySearch(item, query, ["title", "sku", "category", "unit"]) &&
        (categoryFilter === "all" || item.category === categoryFilter) &&
        (unitFilter === "all" || item.unit === unitFilter)
      )
    })
  }, [ingredients, query, categoryFilter, unitFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Leaf className="h-6 w-6" /> Nguyên liệu (Inventory)
          </h1>
          <p className="mt-1 text-sm font-semibold text-secondary">Quản lý nguyên liệu qua hệ thống Tồn kho (Inventory Items) của Medusa</p>
        </div>
        <button onClick={openNew} className="admin-button-primary px-4 py-2 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Thêm nguyên liệu
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#eadfcd] overflow-hidden">
        <div className="p-4 border-b border-[#eadfcd]">
          <AdminListFilters
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm theo tên, SKU, phân loại..."
            showing={filteredIngredients.length}
            total={ingredients.length}
            onReset={() => {
              setQuery("")
              setCategoryFilter("all")
              setUnitFilter("all")
            }}
            filters={[
              { label: "Phân loại", value: categoryFilter, onChange: setCategoryFilter, options: categoryOptions },
              { label: "Đơn vị", value: unitFilter, onChange: setUnitFilter, options: unitOptions },
            ]}
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fffaf3] text-[#766957] font-bold border-b border-[#eadfcd]">
            <tr>
              <th className="px-4 py-3">Tên nguyên liệu</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Phân loại</th>
              <th className="px-4 py-3">Giá vốn (₫)</th>
              <th className="px-4 py-3">Đơn vị</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eadfcd]">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-6 text-gray-500">Đang tải...</td></tr>
            ) : filteredIngredients.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-6 text-gray-500">Chưa có nguyên liệu nào.</td></tr>
            ) : (
              filteredIngredients.map(item => (
                <tr key={item.id} className="hover:bg-[#fffcf8]">
                  <td className="px-4 py-3 font-semibold text-primary">{item.title}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3 text-[#c7643a] font-semibold">{item.cost_per_unit.toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3 flex justify-end gap-2">
                    <button onClick={() => openEdit(item)} className="p-2 text-[#766957] hover:bg-[#eadfcd] rounded-lg">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Sửa Nguyên Liệu" : "Thêm Nguyên Liệu"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên nguyên liệu</label>
            <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="admin-input w-full px-4 py-2" placeholder="Ví dụ: Dưa hấu đỏ" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU (Mã nội bộ)</label>
            <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="admin-input w-full px-4 py-2" placeholder="VD: ING-WATERMELON (Bỏ trống tự tạo)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phân loại</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-input w-full px-4 py-2">
                <option value="Fruit">Hoa quả (Fruit)</option>
                <option value="Sauce">Sốt / Topping (Sauce)</option>
                <option value="Packaging">Bao bì (Packaging)</option>
                <option value="Other">Khác (Other)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đơn vị tính</label>
              <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="admin-input w-full px-4 py-2">
                <option value="kg">Kilogram (kg)</option>
                <option value="gram">Gram (g)</option>
                <option value="ml">Mililit (ml)</option>
                <option value="lít">Lít (L)</option>
                <option value="hộp">Hộp (box)</option>
                <option value="cái">Cái (piece)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giá vốn (₫) / Đơn vị tính</label>
            <input type="number" required min={0} value={form.cost_per_unit} onChange={e => setForm({...form, cost_per_unit: Number(e.target.value) || 0})} className="admin-input w-full px-4 py-2" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#eadfcd]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="admin-button-secondary px-4 py-2 text-sm">Hủy</button>
            <button type="submit" className="admin-button-primary px-4 py-2 text-sm">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
