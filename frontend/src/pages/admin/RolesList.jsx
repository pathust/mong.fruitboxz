import { RequirePermission } from "../../components/admin/RequirePermission"
import { AdminHeaderPortal } from "../../components/admin/AdminHeaderPortal"
import { useMemo, useState, useEffect } from "react"
import { Shield, LoaderCircle, CheckCircle, Search, Edit2, Trash2, Pencil, Plus, Save, X, ShieldCheck } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../components/admin/AdminListFilters"

// Hardcoded Registry of all possible modules in the system
const REGISTRY_MODULES = [
  { key: "users", label: "Quản lý Nhân sự" },
  { key: "roles", label: "Quản lý Chức vụ & Phân quyền" },
  { key: "orders", label: "Đơn hàng" },
  { key: "products", label: "Sản phẩm" },
  { key: "categories", label: "Danh mục Sản phẩm" },
  { key: "inventory", label: "Tồn kho" },
  { key: "customers", label: "Khách hàng" },
  { key: "blog", label: "Bài viết Blog" },
  { key: "blog-categories", label: "Danh mục Blog" },
  { key: "banners", label: "Banner Quảng cáo" },
  { key: "media", label: "Media (Hình ảnh)" },
  { key: "reviews", label: "Đánh giá" },
  { key: "settings", label: "Cấu hình chung" },
  { key: "search", label: "Tìm kiếm (Search Console)" },
  { key: "chatbot", label: "Chatbot AI" }
]

const ACTIONS = [
  { key: "read", label: "Xem" },
  { key: "create", label: "Thêm" },
  { key: "edit", label: "Sửa" },
  { key: "delete", label: "Xóa" },
]

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ")
}

export default function RolesList() {
  const { api } = useAdminAuth()
  const [roles, setRoles] = useState([])
  const [permissionsDb, setPermissionsDb] = useState([]) // All permissions in DB
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({ name: "", description: "" })
  const [showForm, setShowForm] = useState(false)
  const [editRole, setEditRole] = useState(null)
  const [error, setError] = useState("")

  const [query, setQuery] = useState("")
  const [selectedModule, setSelectedModule] = useState(REGISTRY_MODULES[0].key)

  useEffect(() => {
    Promise.all([
      api("/admin/roles").catch(() => ({ roles: [] })),
      api("/admin/permissions").catch(() => ({ permissions: [] }))
    ]).then(([r, p]) => {
      setRoles(r.roles || [])
      setPermissionsDb(p.permissions || [])
    }).finally(() => setLoading(false))
  }, [api])

  const startCreate = () => {
    setEditRole(null)
    setForm({ name: "", description: "" })
    setShowForm(true)
    setError("")
  }

  const startEdit = (role) => {
    setEditRole(role)
    setForm({ name: role.name || "", description: role.description || "" })
    setShowForm(true)
    setError("")
  }

  const closeForm = () => {
    setShowForm(false)
    setEditRole(null)
    setError("")
  }

  const saveRole = async () => {
    const valName = normalizeName(form.name)
    if (!valName) {
      setError("Tên role không được để trống")
      return
    }

    setSaving(true)
    setError("")
    try {
      if (editRole) {
        const update = await api(`/admin/roles/${editRole.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: valName, description: form.description }),
        })
        setRoles((prev) => prev.map((item) => item.id === editRole.id ? update.role : item))
      } else {
        const result = await api("/admin/roles", {
          method: "POST",
          body: JSON.stringify({ name: valName, description: form.description }),
        })
        setRoles((prev) => [result.role, ...prev])
      }
      closeForm()
    } catch (err) {
      setError(err.message || "Lỗi khi lưu role")
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (id) => {
    if (!confirm("Xóa vai trò này?")) return
    try {
      await api(`/admin/roles/${id}`, { method: "DELETE" })
      setRoles((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      alert(err.message || "Lỗi xóa role")
    }
  }

  // Auto create permission if not exists and toggle it on role
  const togglePermission = async (role, moduleKey, actionKey) => {
    const permName = `${moduleKey}.${actionKey}`
    
    // Find if permission exists in DB
    let dbPerm = permissionsDb.find(p => p.name === permName)
    
    try {
      // Auto-create permission if it doesn't exist
      if (!dbPerm) {
        const res = await api("/admin/permissions", { 
          method: "POST", 
          body: JSON.stringify({ name: permName, description: `Tự động tạo quyền ${permName}` }) 
        })
        dbPerm = res.permission
        setPermissionsDb(prev => [...prev, dbPerm])
      }

      const rolePerms = Array.isArray(role.permissions) ? role.permissions : []
      const isActive = rolePerms.includes(dbPerm.id)
      
      let newPerms
      if (isActive) {
        newPerms = rolePerms.filter(id => id !== dbPerm.id)
      } else {
        newPerms = [...rolePerms, dbPerm.id]
      }

      // Optimistic update
      setRoles((prev) => prev.map((item) => item.id === role.id ? { ...item, permissions: newPerms } : item))

      // API update
      await api(`/admin/roles/${role.id}`, { 
        method: "PUT", 
        body: JSON.stringify({ permissions: newPerms }) 
      })
      
    } catch (err) {
      alert(err.message || "Lỗi phân quyền")
      // Revert optimistic update by reloading if fail
      const r = await api("/admin/roles").catch(() => ({ roles: [] }))
      if (r.roles) setRoles(r.roles)
    }
  }

  const currentModule = REGISTRY_MODULES.find(m => m.key === selectedModule) || REGISTRY_MODULES[0]

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => filterBySearch(role, query, ["name", "description"]))
  }, [roles, query])

  if (loading) return <div className="text-center py-20 text-[#a08d79]"><div className="h-8 w-8 mx-auto rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />Đang tải dữ liệu...</div>

  return (
    <div className="space-y-6 pb-20">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Hệ thống</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Phân quyền
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Thiết lập các nhóm quyền hạn cho quản trị viên.</p>
          </div>
        
      </div>
      </AdminHeaderPortal>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
          {error}
        </div>
      )}

      {showForm && (
        <div className="admin-card p-6 bg-gradient-to-br from-[#fffaf4] to-white border-primary/20 max-w-3xl mb-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {editRole ? "Chỉnh sửa Vai trò" : "Khởi tạo Vai trò mới"}
            </h3>
            <button type="button" onClick={closeForm} className="rounded-full p-1.5 text-[#a08d79] hover:bg-red-50 hover:text-red-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider">Tên vai trò</span>
              <input
                placeholder="Ví dụ: Kế toán, Kho..."
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-[#8a7a67] uppercase tracking-wider">Mô tả chi tiết</span>
              <input
                placeholder="Chức năng chính của vai trò này"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-[15px] font-medium text-secondary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={closeForm} className="rounded-xl bg-[#f0e5d5] px-5 py-2.5 text-sm font-bold text-[#5d5246] transition hover:bg-[#e0d5c5]">
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={saveRole}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#2c2018] disabled:opacity-60 shadow-lg shadow-black/5"
            >
              <Save className="h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu Vai Trò"}
            </button>
          </div>
        </div>
      )}

      <AdminListFilters
        actions={
          <>
            <RequirePermission perm="roles.create">
          <button
            type="button"
            onClick={startCreate}
            className="admin-button-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Thêm Vai Trò
          </button>
        </RequirePermission>
          </>
        }
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm theo tên vai trò hoặc mô tả..."
        showing={filteredRoles.length}
        total={roles.length}
        onReset={() => {
          setQuery("")
          setSelectedModule(REGISTRY_MODULES[0].key)
        }}
      />

      <div className="mb-4">
        <p className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
          Chọn Module để Phân quyền:
        </p>
        <div className="flex flex-wrap gap-2">
          {REGISTRY_MODULES.map((moduleGroup) => {
            const active = currentModule?.key === moduleGroup.key
            return (
              <button
                key={moduleGroup.key}
                type="button"
                onClick={() => setSelectedModule(moduleGroup.key)}
                className={`rounded-full border-2 px-4 py-2 text-[13px] font-bold transition-all ${active ? "border-primary bg-primary text-white shadow-md shadow-primary/20" : "border-[#eadfcd] bg-white text-[#766957] hover:border-primary/40 hover:bg-[#fffaf4]"}`}
              >
                {moduleGroup.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="border-b border-[#eadfcd] bg-gradient-to-r from-[#fffaf4] to-white px-6 py-5">
          <p className="text-lg font-extrabold text-secondary">{currentModule?.label}</p>
          <p className="mt-1 text-[13px] font-medium text-[#8a7a67]">Bật hoặc tắt quyền tương tác tương ứng với từng Vai trò trong Module này. Hệ thống sẽ tự tạo mã quyền ngầm nếu chưa tồn tại.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-white border-b border-[#eadfcd]">
              <tr>
                <th className="w-[30%] px-6 py-4 text-left font-bold text-[#8a7a67] uppercase tracking-wider text-xs">Vai trò (Role)</th>
                {ACTIONS.map((action) => (
                  <th key={action.key} className="px-4 py-4 text-center font-bold text-[#8a7a67] uppercase tracking-wider text-xs">{action.label}</th>
                ))}
                <th className="px-6 py-4 text-right font-bold text-[#8a7a67] uppercase tracking-wider text-xs">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]/50 bg-white">
              {filteredRoles.map((role) => {
                const rolePerms = Array.isArray(role.permissions) ? role.permissions : []
                return (
                  <tr key={role.id} className="hover:bg-[#fffaf4] transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-extrabold text-[#3f352b] text-[15px]">{role.name}</p>
                      {role.description && <p className="mt-1 text-xs text-[#a08d79] font-medium leading-relaxed">{role.description}</p>}
                    </td>
                    {ACTIONS.map((action) => {
                      const permName = `${currentModule.key}.${action.key}`
                      const dbPerm = permissionsDb.find(p => p.name === permName)
                      const active = dbPerm ? rolePerms.includes(dbPerm.id) : false
                      
                      return (
                        <td key={action.key} className="px-4 py-5 text-center">
                          <RequirePermission perm="roles.edit" fallback={
                            <div className={`mx-auto relative inline-flex h-7 w-12 items-center rounded-full border-2 opacity-50 cursor-not-allowed ${active ? "border-primary bg-primary" : "border-[#d0c1af] bg-[#f0e5d5]"}`}>
                              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ${active ? "translate-x-5" : "translate-x-0.5"}`} />
                            </div>
                          }>
                            <button
                              type="button"
                              onClick={() => togglePermission(role, currentModule.key, action.key)}
                              className={`mx-auto relative inline-flex h-7 w-12 items-center rounded-full border-2 transition-colors duration-300 focus:outline-none ${active ? "border-primary bg-primary" : "border-[#d0c1af] bg-[#f0e5d5] hover:border-primary/50"}`}
                              role="switch"
                              aria-checked={active}
                              title={`Bật/tắt ${permName}`}
                            >
                              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 shadow-sm ${active ? "translate-x-5" : "translate-x-0.5"}`} />
                            </button>
                          </RequirePermission>
                          <p className={`text-[10px] font-bold mt-1.5 uppercase tracking-wide ${active ? 'text-primary' : 'text-[#a08d79]'}`}>{active ? 'Đã cấp' : 'Khóa'}</p>
                        </td>
                      )
                    })}
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <RequirePermission perm="roles.edit">
                          <button type="button" onClick={() => startEdit(role)} className="rounded-xl border border-[#eadfcd] bg-white p-2 text-primary transition hover:border-primary hover:bg-[#fffaf4] shadow-sm" title="Chỉnh sửa">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </RequirePermission>
                        <RequirePermission perm="roles.delete">
                          <button type="button" onClick={() => deleteRole(role.id)} className="rounded-xl border border-[#eadfcd] bg-white p-2 text-red-500 transition hover:border-red-200 hover:bg-red-50 shadow-sm" title="Xóa vai trò">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </RequirePermission>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredRoles.length === 0 && (
            <div className="p-16 text-center text-[#8a7a67] font-medium text-lg">
              <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-[#eadfcd]" />
              Không có vai trò nào được tìm thấy.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
