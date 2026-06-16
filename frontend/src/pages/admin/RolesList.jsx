import { useMemo, useState, useEffect } from "react"
import { Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../components/admin/AdminListFilters"

const MODULE_LABELS = {
  users: "Người dùng",
  roles: "Vai trò",
  permissions: "Quyền",
  products: "Sản phẩm",
  categories: "Danh mục",
  inventory: "Tồn kho",
  orders: "Đơn hàng",
  customers: "Khách hàng",
  banners: "Banner",
  media: "Media",
  reviews: "Đánh giá",
  settings: "Cấu hình",
  search: "Tìm kiếm",
  chatbot: "Chatbot",
}

const ACTIONS = [
  { key: "read", label: "Xem", aliases: ["read", "view", "list"] },
  { key: "create", label: "Thêm", aliases: ["create", "add"] },
  { key: "edit", label: "Sửa", aliases: ["edit", "update", "write"] },
  { key: "delete", label: "Xóa", aliases: ["delete", "remove"] },
]

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ")
}

function buildPermissionIndex(permissions) {
  const byModule = new Map()
  const byId = new Map()

  permissions.forEach((permission) => {
    if (!permission?.name || byId.has(permission.id)) return
    byId.set(permission.id, permission)

    const [moduleName, actionName] = permission.name.split(".")
    if (!moduleName || !actionName) return

    if (!byModule.has(moduleName)) {
      byModule.set(moduleName, {
        key: moduleName,
        label: MODULE_LABELS[moduleName] || moduleName,
        permissions: [],
      })
    }

    byModule.get(moduleName).permissions.push(permission)
  })

  return {
    byId,
    modules: Array.from(byModule.values()).sort((a, b) => a.label.localeCompare(b.label, "vi")),
  }
}

function getActionPermissionIds(moduleGroup, action) {
  if (!moduleGroup) return []

  const idsByName = new Map()
  moduleGroup.permissions.forEach((permission) => {
    const actionName = permission.name.split(".")[1]
    if (action.aliases.includes(actionName) && !idsByName.has(permission.name)) {
      idsByName.set(permission.name, permission.id)
    }
  })

  return Array.from(idsByName.values())
}

export default function RolesList() {
  const { api } = useAdminAuth()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [editRole, setEditRole] = useState(null)
  const [form, setForm] = useState({ name: "", description: "" })
  const [showForm, setShowForm] = useState(false)
  const [selectedModule, setSelectedModule] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError("")
      try {
        const [rolesData, permissionsData] = await Promise.all([
          api("/admin/roles"),
          api("/admin/permissions").catch(() => ({ permissions: [] })),
        ])

        if (!active) return
        setRoles(rolesData.roles || [])
        setPermissions(permissionsData.permissions || [])
      } catch (err) {
        if (active) setError(err.message || "Không tải được dữ liệu phân quyền")
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [api])

  const permissionIndex = useMemo(() => buildPermissionIndex(permissions), [permissions])
  const currentModule = useMemo(() => {
    if (!permissionIndex.modules.length) return null
    return permissionIndex.modules.find((moduleGroup) => moduleGroup.key === selectedModule) || permissionIndex.modules[0]
  }, [permissionIndex.modules, selectedModule])

  const roleNames = useMemo(() => {
    return roles
      .filter((role) => role.id !== editRole?.id)
      .map((role) => normalizeName(role.name).toLowerCase())
  }, [roles, editRole])

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => filterBySearch(role, query, ["name", "description"]))
  }, [roles, query])

  const startCreate = () => {
    setEditRole(null)
    setForm({ name: "", description: "" })
    setError("")
    setShowForm(true)
  }

  const startEdit = (role) => {
    setEditRole(role)
    setForm({ name: role.name, description: role.description || "" })
    setError("")
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditRole(null)
    setForm({ name: "", description: "" })
    setError("")
  }

  const saveRole = async () => {
    const name = normalizeName(form.name)

    if (!name) {
      setError("Tên role là bắt buộc")
      return
    }

    if (roleNames.includes(name.toLowerCase())) {
      setError("Tên role đã tồn tại")
      return
    }

    setSaving(true)
    setError("")
    try {
      if (editRole) {
        const res = await api(`/admin/roles/${editRole.id}`, {
          method: "POST",
          body: { name, description: form.description },
        })
        setRoles((prev) => prev.map((role) => role.id === editRole.id ? { ...role, ...(res.role || {}), name, description: form.description } : role))
      } else {
        const res = await api("/admin/roles", {
          method: "POST",
          body: { name, description: form.description, permissions: [] },
        })
        setRoles((prev) => [...prev, res.role])
      }
      closeForm()
    } catch (err) {
      setError(err.message || "Không lưu được role")
    } finally {
      setSaving(false)
    }
  }

  const deleteRole = async (id) => {
    if (!confirm("Xóa role này?")) return
    await api(`/admin/roles/${id}`, { method: "DELETE" })
    setRoles((prev) => prev.filter((role) => role.id !== id))
  }

  const togglePermission = async (role, action) => {
    const actionPermissionIds = getActionPermissionIds(currentModule, action)
    if (!actionPermissionIds.length) return

    const currentPerms = Array.isArray(role.permissions) ? role.permissions : []
    const hasAction = actionPermissionIds.some((id) => currentPerms.includes(id))
    const actionPermissionSet = new Set(actionPermissionIds)
    const newPerms = hasAction
      ? currentPerms.filter((id) => !actionPermissionSet.has(id))
      : [...new Set([...currentPerms, ...actionPermissionIds])]

    setRoles((prev) => prev.map((item) => item.id === role.id ? { ...item, permissions: newPerms } : item))

    try {
      const res = await api(`/admin/roles/${role.id}/permissions`, {
        method: "POST",
        body: { permission_ids: newPerms },
      })
      setRoles((prev) => prev.map((item) => item.id === role.id ? { ...item, ...(res.role || {}), permissions: newPerms } : item))
    } catch (err) {
      setRoles((prev) => prev.map((item) => item.id === role.id ? { ...item, permissions: currentPerms } : item))
      setError(err.message || "Không cập nhật được quyền")
    }
  }

  if (loading) return <div className="py-12 text-center text-secondary-light">Loading...</div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Phân quyền</h1>
          <p className="mt-1 text-sm text-secondary-light">Quản lý role bằng ma trận nhóm quyền và thao tác.</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Thêm role
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-secondary">{editRole ? "Sửa role" : "Role mới"}</h3>
            <button type="button" onClick={closeForm} className="rounded-lg p-1.5 text-secondary-light hover:bg-gray-50">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-secondary-light">Tên role</span>
              <input
                placeholder="Ví dụ: Nhân viên kho"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-secondary-light">Mô tả</span>
              <input
                placeholder="Mô tả ngắn"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={saveRole}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
            <button type="button" onClick={closeForm} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-secondary">
              Hủy
            </button>
          </div>
        </div>
      )}

      <AdminListFilters
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm theo tên role hoặc mô tả..."
        showing={filteredRoles.length}
        total={roles.length}
        onReset={() => {
          setQuery("")
          setSelectedModule("")
        }}
      />

      <div className="mb-4 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {permissionIndex.modules.map((moduleGroup) => {
            const active = currentModule?.key === moduleGroup.key
            return (
              <button
                key={moduleGroup.key}
                type="button"
                onClick={() => setSelectedModule(moduleGroup.key)}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${active ? "border-primary bg-primary text-white" : "border-gray-200 bg-white text-secondary hover:border-primary/40"}`}
              >
                {moduleGroup.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
          <p className="text-sm font-bold text-secondary">{currentModule?.label || "Nhóm quyền"}</p>
          <p className="mt-0.5 text-xs text-secondary-light">Chọn role ở từng dòng và bật/tắt quyền theo cột Xem, Thêm, Sửa, Xóa.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-white text-secondary-light">
              <tr>
                <th className="w-[34%] px-5 py-3 text-left font-semibold">Role</th>
                {ACTIONS.map((action) => (
                  <th key={action.key} className="px-4 py-3 text-center font-semibold">{action.label}</th>
                ))}
                <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRoles.map((role) => {
                const rolePerms = Array.isArray(role.permissions) ? role.permissions : []
                return (
                  <tr key={role.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-secondary">{role.name}</p>
                      {role.description && <p className="mt-0.5 text-xs text-secondary-light">{role.description}</p>}
                    </td>
                    {ACTIONS.map((action) => {
                      const actionPermissionIds = getActionPermissionIds(currentModule, action)
                      const enabled = actionPermissionIds.length > 0
                      const active = enabled && actionPermissionIds.some((id) => rolePerms.includes(id))
                      return (
                        <td key={action.key} className="px-4 py-4 text-center">
                          <button
                            type="button"
                            disabled={!enabled}
                            onClick={() => togglePermission(role, action)}
                            className={`mx-auto flex h-9 w-16 items-center justify-center rounded-full border text-xs font-bold transition ${active ? "border-primary bg-primary text-white shadow-sm" : "border-gray-200 bg-white text-secondary-light hover:border-primary/40"} ${!enabled ? "cursor-not-allowed opacity-35" : ""}`}
                          >
                            {active ? "Bật" : "Tắt"}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => startEdit(role)} className="rounded-lg p-1.5 text-primary transition hover:bg-primary/10" title="Sửa">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => deleteRole(role.id)} className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50" title="Xóa">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
