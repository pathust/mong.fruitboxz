import { useEffect, useState } from "react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { Plus, Edit2, Trash2, Search, Package, Leaf } from 'lucide-react'
import { AdminHeaderPortal } from '../../../components/admin/AdminHeaderPortal'
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"

export default function IngredientsList() {
  const { api } = useAdminAuth()
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState({ name: "", unit: "Cái", cost_price: 0, type: "other" })
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteCandidates, setDeleteCandidates] = useState([])
  const [deleteUsageProducts, setDeleteUsageProducts] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api("/admin/ingredients")
      const data = res?.data || res || {}
      if (data.ingredients) setIngredients(data.ingredients)
    } catch (err) {
      console.error(err)
      alert("Lỗi tải dữ liệu nguyên liệu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSaveIngredient = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await api(`/admin/ingredients/${editingItem.id}`, {
          method: "PUT",
          body: form
        })
      } else {
        await api(`/admin/ingredients`, {
          method: "POST",
          body: form
        })
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      alert("Lỗi khi lưu nguyên liệu: " + (err.message || JSON.stringify(err)))
    }
  }

  const confirmDelete = async (items) => {
    setDeleteCandidates(items)
    try {
      const usagePromises = items.map(item => api(`/admin/ingredients/${item.id}/usage`))
      const results = await Promise.all(usagePromises)
      
      const allProducts = new Set()
      results.forEach(res => {
        const data = res?.data || res || {}
        if (data.products) {
          data.products.forEach(p => allProducts.add(p))
        }
      })
      setDeleteUsageProducts(Array.from(allProducts))
    } catch (err) {
      console.error(err)
      setDeleteUsageProducts([])
    }
  }

  const handleDeleteIngredient = async () => {
    if (deleteCandidates.length === 0) return
    setIsDeleting(true)
    try {
      await Promise.all(deleteCandidates.map(candidate => 
        api(`/admin/ingredients/${candidate.id}`, { method: "DELETE" })
      ))
      setDeleteCandidates([])
      setSelectedIds([])
      fetchData()
    } catch (err) {
      alert("Lỗi khi xoá: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>

  const INGREDIENT_TYPES = {
    fruit: "Hoa quả",
    dip_sauce: "Sốt chấm",
    mix_sauce: "Sốt trộn",
    yogurt: "Sữa chua",
    other: "Khác"
  }

  const filteredIngredients = ingredients.filter(i => {
    const matchSearch = filterBySearch(i, query, ["name"])
    const matchType = typeFilter.length === 0 || typeFilter.includes(i.type || 'other')
    return matchSearch && matchType
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Kho & Chi phí</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" /> Nguyên liệu
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý danh sách nguyên liệu và công thức cấu thành.</p>
          </div>
        </div>
      </AdminHeaderPortal>

      <div className="bg-white rounded-2xl shadow-sm border border-[#eadfcd]">
        <div className="p-4 border-b border-[#eadfcd] flex flex-col sm:flex-row items-center justify-between gap-4">
          <AdminListFilters
            disableSticky={true}
            actions={
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button onClick={() => {
                    const selectedItems = ingredients.filter(i => selectedIds.includes(i.id))
                    confirmDelete(selectedItems)
                  }} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap">
                    <Trash2 className="w-4 h-4" /> Xoá {selectedIds.length} mục
                  </button>
                )}
                <button onClick={() => {
                  setEditingItem(null)
                  setForm({ name: "", unit: "Cái", cost_price: 0, type: "other" })
                  setIsModalOpen(true)
                }} className="admin-button-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap">
                  <Plus className="w-4 h-4" /> Thêm nguyên liệu
                </button>
              </div>
            }
            search={query}
            onSearchChange={setQuery}
            filters={[
              {
                type: "checkbox",
                label: "Phân loại",
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { value: "fruit", label: "Hoa quả" },
                  { value: "dip_sauce", label: "Sốt chấm" },
                  { value: "mix_sauce", label: "Sốt trộn" },
                  { value: "yogurt", label: "Sữa chua" },
                  { value: "other", label: "Khác" }
                ]
              }
            ]}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#5d5246]">
            <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input type="checkbox" className="rounded border-[#eadfcd] text-primary focus:ring-primary"
                    checked={filteredIngredients.length > 0 && selectedIds.length === filteredIngredients.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(filteredIngredients.map(i => i.id))
                      else setSelectedIds([])
                    }}
                  />
                </th>
                <th className="px-6 py-4">Tên nguyên liệu</th>
                <th className="px-6 py-4">Phân loại</th>
                <th className="px-6 py-4">Đơn vị</th>
                <th className="px-6 py-4">Giá vốn (VND)</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]/50">
              {filteredIngredients.map((item) => (
                <tr key={item.id} className="hover:bg-[#fffaf4]/50 transition-colors">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-[#eadfcd] text-primary focus:ring-primary"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, item.id])
                        else setSelectedIds(selectedIds.filter(id => id !== item.id))
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-primary">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#eadfcd]/30 text-[#6a5a4a]">
                      {INGREDIENT_TYPES[item.type || 'other'] || 'Khác'}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.unit}</td>
                  <td className="px-6 py-4 text-[#c7643a] font-semibold">{item.cost_price?.toLocaleString('vi-VN') || "0"}₫</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button onClick={() => {
                      setEditingItem(item)
                      setForm(item)
                      setIsModalOpen(true)
                    }} className="p-2 text-[#766957] hover:bg-[#eadfcd] rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => confirmDelete([item])} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy nguyên liệu nào.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "Sửa Nguyên Liệu" : "Thêm Nguyên Liệu"}>
        <form onSubmit={handleSaveIngredient} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên nguyên liệu *</label>
            <input required type="text" className="admin-input w-full" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Quả Táo Fuji" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại</label>
              <select className="admin-input w-full" value={form.type || "other"} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="fruit">Hoa quả</option>
                <option value="dip_sauce">Sốt chấm</option>
                <option value="mix_sauce">Sốt trộn</option>
                <option value="yogurt">Sữa chua</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
              <select className="admin-input w-full" value={form.unit || "Cái"} onChange={e => setForm({...form, unit: e.target.value})}>
                <option value="Kilogram">Kilogram (kg)</option>
                <option value="Gram">Gram (g)</option>
                <option value="Lít">Lít (l)</option>
                <option value="Mililít">Mililít (ml)</option>
                <option value="Hộp">Hộp</option>
                <option value="Quả">Quả</option>
                <option value="Gói">Gói</option>
                <option value="Cái">Cái</option>
                <option value="Viên">Viên</option>
                <option value="Hũ">Hũ</option>
              </select>
            </div>
          </div>
            
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn (VND)</label>
              <input type="number" className="admin-input w-full" value={form.cost_price || 0} onChange={e => setForm({...form, cost_price: Number(e.target.value)})} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">Hủy</button>
            <button type="submit" className="admin-button-primary px-6 py-2">Lưu lại</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteCandidates.length > 0} onClose={() => setDeleteCandidates([])} title="Xác nhận xoá nguyên liệu">
        <div className="space-y-4">
          <p className="text-gray-700">
            Bạn có chắc chắn muốn xoá <strong>{deleteCandidates.length}</strong> nguyên liệu đã chọn không?
          </p>
          
          {deleteUsageProducts.length > 0 && (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200">
              <p className="font-semibold mb-2">Cảnh báo: Nguyên liệu này đang được sử dụng trong các sản phẩm sau:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {deleteUsageProducts.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
              <p className="mt-2 text-sm font-medium">Việc xoá nguyên liệu sẽ ảnh hưởng đến công thức của các sản phẩm này.</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setDeleteCandidates([])} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">Hủy</button>
            <button type="button" onClick={handleDeleteIngredient} disabled={isDeleting} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors font-medium disabled:opacity-50">
              {isDeleting ? "Đang xoá..." : "Xoá"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
