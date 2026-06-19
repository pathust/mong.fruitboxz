import { useCallback, useState, useEffect } from "react"
import { Plus, Trash2, Calculator } from "lucide-react"
import AdminSelect from "../../../components/admin/AdminSelect"
import { useAdminAuth } from "../../../context/AdminAuthContext"

export default function RecipeManager({ productId, variantId }) {
  const { api } = useAdminAuth()
  const [items, setItems] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [globalCosts, setGlobalCosts] = useState({ packaging_cost: 0, labor_cost_per_order: 0 })

  const fetchData = useCallback(async () => {
    try {
      const [resIng, resGlobal, resProduct] = await Promise.all([
        api("/admin/custom/inventory"),
        api("/admin/custom?mode=settings").catch(() => ({ settings: {} })),
        api(`/admin/products/${productId}?fields=*variants,*variants.inventory_items`)
      ])

      if (resIng?.ingredients) {
        setIngredients(resIng.ingredients)
      }

      if (resProduct?.product?.variants) {
        const variant = resProduct.product.variants.find(v => v.id === variantId)
        if (variant && variant.inventory_items) {
          const fetchedItems = variant.inventory_items.map(link => ({
            inventory_item_id: link.inventory_item_id,
            required_quantity: link.required_quantity,
            isNew: false
          }))
          setItems(fetchedItems)
        }
      }

      if (resGlobal?.settings) {
        setGlobalCosts({
          packaging_cost: resGlobal.settings.packaging_cost || 0,
          labor_cost_per_order: resGlobal.settings.labor_cost_per_order || 0
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [api, productId, variantId])

  useEffect(() => {
    if (!productId || !variantId) return undefined
    const timer = window.setTimeout(fetchData, 0)
    return () => window.clearTimeout(timer)
  }, [fetchData, productId, variantId])

  const handleSave = async () => {
    setSaving(true)
    try {
      let errorMsgs = [];

      for (const item of items) {
        if (!item.inventory_item_id) {
          errorMsgs.push(`Một dòng chưa chọn nguyên liệu`);
          continue;
        }
        try {
          await api(`/admin/products/${productId}/variants/${variantId}/inventory-items`, {
            method: "POST",
            body: {
              inventory_item_id: item.inventory_item_id,
              required_quantity: Number(item.required_quantity)
            }
          })
        } catch (err) {
          errorMsgs.push(`Nguyên liệu ${item.inventory_item_id}: ${err.message || JSON.stringify(err)}`);
        }
      }

      if (errorMsgs.length > 0) {
        alert("Có lỗi khi lưu một số định mức:\n" + errorMsgs.join("\n"));
      } else {
        alert("Đã lưu định mức nguyên liệu thành công!");
      }
      fetchData() // Refresh to sync state
    } catch (err) {
      alert("Lỗi không mong muốn: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLink = async (index) => {
    const item = items[index]
    if (!item.isNew) {
      if (!window.confirm("Xóa nguyên liệu này khỏi định mức?")) return
      try {
        await api(`/admin/products/${productId}/variants/${variantId}/inventory-items/${item.inventory_item_id}`, {
          method: "DELETE"
        })
      } catch (err) {
        alert("Lỗi khi xóa: " + (err.message || JSON.stringify(err)))
        return
      }
    }
    setItems(items.filter((_, i) => i !== index))
  }

  const addItem = () => {
    if (ingredients.length === 0) return alert("Vui lòng thêm nguyên liệu (Inventory Items) trước!")
    setItems([...items, { inventory_item_id: "", required_quantity: 1, isNew: true }])
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    setItems(newItems)
  }

  if (loading) return <div className="p-4 text-sm text-secondary">Đang tải định mức...</div>

  // Tính toán tổng chi phí
  const ingredientCost = items.reduce((sum, item) => {
    const ing = ingredients.find(i => i.id === item.inventory_item_id)
    const costPerUnit = ing?.metadata?.cost_per_unit ? Number(ing.metadata.cost_per_unit) : 0
    return sum + (costPerUnit * item.required_quantity)
  }, 0)

  const totalCost = ingredientCost + globalCosts.packaging_cost + globalCosts.labor_cost_per_order

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" /> Định mức nguyên liệu (BOM)
        </h3>
        <button type="button" onClick={handleSave} disabled={saving} className="admin-button-primary px-4 py-2 text-sm">
          {saving ? "Đang lưu..." : "Lưu định mức"}
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {items.map((item, idx) => {
          const selectedIng = ingredients.find(i => i.id === item.inventory_item_id)
          const costPerUnit = selectedIng?.metadata?.cost_per_unit ? Number(selectedIng.metadata.cost_per_unit) : 0
          const cost = costPerUnit * item.required_quantity

          return (
            <div key={idx} className="flex items-center gap-3">
              <AdminSelect
                value={item.inventory_item_id}
                onChange={val => updateItem(idx, "inventory_item_id", val)}
                options={[
                  { value: "", label: "-- Chọn nguyên liệu --" },
                  ...ingredients.map(ing => ({
                    value: ing.id,
                    label: `${ing.title} (${ing.metadata?.unit || "unit"})`
                  }))
                ]}
                className="w-full bg-white border-gray-200"
              />

              <input
                type="number"
                min={0}
                step={['kg', 'lít', 'l'].includes(selectedIng?.metadata?.unit?.toLowerCase()) ? "0.001" : "1"}
                value={item.required_quantity}
                onChange={e => updateItem(idx, "required_quantity", e.target.value)}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />

              <span className="w-10 text-sm text-gray-500">{selectedIng?.metadata?.unit || "unit"}</span>
              <span className="w-20 text-sm font-semibold text-right text-gray-700">{cost.toLocaleString('vi-VN')}₫</span>

              <button type="button" onClick={() => handleDeleteLink(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}

        <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm text-primary hover:text-[#a04620] font-semibold py-2">
          <Plus className="h-4 w-4" /> Thêm nguyên liệu
        </button>
      </div>

      <div className="bg-[#fffaf4] rounded-xl p-4 border border-[#eadfcd] text-sm text-[#5d5246] space-y-1">
        <div className="flex justify-between">
          <span>Chi phí nguyên liệu:</span>
          <span className="font-semibold">{ingredientCost.toLocaleString('vi-VN')}₫</span>
        </div>
        <div className="flex justify-between">
          <span>Chi phí đóng gói (cố định):</span>
          <span>{globalCosts.packaging_cost.toLocaleString('vi-VN')}₫</span>
        </div>
        <div className="flex justify-between pb-2 border-b border-[#eadfcd]">
          <span>Chi phí nhân công (cố định):</span>
          <span>{globalCosts.labor_cost_per_order.toLocaleString('vi-VN')}₫</span>
        </div>
        <div className="flex justify-between pt-2 text-[16px] text-[#43382b]">
          <span className="font-bold">Tổng Giá Vốn (Cost Price):</span>
          <span className="font-bold text-[#c7643a]">{totalCost.toLocaleString('vi-VN')}₫</span>
        </div>
      </div>
    </div>
  )
}
