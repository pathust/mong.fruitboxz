import { useState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"

export default function RolesList() {
  const { api } = useAdminAuth()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editRole, setEditRole] = useState(null)
  const [form, setForm] = useState({ name: "", description: "" })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    Promise.all([
      api("/admin/roles"),
      api("/admin/permissions").catch(() => ({ permissions: [] })),
    ]).then(([r, p]) => {
      setRoles(r.roles || [])
      setPermissions(p.permissions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [api])

  const togglePermission = async (roleId, permId, currentPerms) => {
    const hasPerm = currentPerms.includes(permId)
    const newPerms = hasPerm ? currentPerms.filter(p => p !== permId) : [...currentPerms, permId]
    await api(`/admin/roles/${roleId}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permission_ids: newPerms }),
    })
    setRoles(prev => prev.map(r => r.id === roleId ? { ...r, permissions: newPerms } : r))
  }

  const saveRole = async () => {
    if (editRole) {
      await api(`/admin/roles/${editRole.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      })
      setRoles(prev => prev.map(r => r.id === editRole.id ? { ...r, ...form } : r))
    } else {
      const res = await api("/admin/roles", {
        method: "POST",
        body: JSON.stringify({ ...form, permissions: [] }),
      })
      setRoles(prev => [...prev, res.role])
    }
    setShowForm(false)
    setEditRole(null)
    setForm({ name: "", description: "" })
  }

  const deleteRole = async (id) => {
    if (!confirm("Delete this role?")) return
    await api(`/admin/roles/${id}`, { method: "DELETE" })
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Roles</h1>
        <button onClick={() => { setEditRole(null); setForm({ name: "", description: "" }); setShowForm(true) }} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark">+ Add Role</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 max-w-lg">
          <h3 className="font-semibold text-secondary mb-4">{editRole ? "Edit Role" : "New Role"}</h3>
          <div className="space-y-3">
            <input placeholder="Role name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={saveRole} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium">Save</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {roles.map(role => {
          const rolePerms = (role.permissions || [])
          return (
            <div key={role.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-secondary">{role.name}</h3>
                  {role.description && <p className="text-xs text-secondary-light mt-0.5">{role.description}</p>}
                </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditRole(role); setForm({ name: role.name, description: role.description || "" }); setShowForm(true) }} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteRole(role.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {permissions.map(p => {
                  const active = rolePerms.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePermission(role.id, p.id, rolePerms)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? "bg-primary/10 text-primary border-primary/20" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"}`}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
