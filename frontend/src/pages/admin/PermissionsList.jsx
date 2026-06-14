import { useState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"

export default function PermissionsList() {
  const { api } = useAdminAuth()
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", description: "" })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    api("/admin/permissions")
      .then(d => setPermissions(d.permissions || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  const savePermission = async () => {
    if (!form.name) return
    if (editing) {
      await api(`/admin/permissions/${editing.id}`, { method: "PUT", body: JSON.stringify(form) })
      setPermissions(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p))
    } else {
      const res = await api("/admin/permissions", { method: "POST", body: JSON.stringify(form) })
      setPermissions(prev => [...prev, res.permission])
    }
    setShowForm(false)
    setEditing(null)
    setForm({ name: "", description: "" })
  }

  const deletePermission = async (id) => {
    if (!confirm("Delete this permission?")) return
    await api(`/admin/permissions/${id}`, { method: "DELETE" })
    setPermissions(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Permissions</h1>
        <button onClick={() => { setEditing(null); setForm({ name: "", description: "" }); setShowForm(true) }} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark">+ Add Permission</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 max-w-lg">
          <h3 className="font-semibold text-secondary mb-4">{editing ? "Edit Permission" : "New Permission"}</h3>
          <div className="space-y-3">
            <input placeholder="Permission name (e.g., orders.create)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={savePermission} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium">Save</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-secondary-light">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {permissions.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-secondary font-mono text-xs">{p.name}</td>
                <td className="px-4 py-3 text-secondary-light">{p.description || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditing(p); setForm({ name: p.name, description: p.description || "" }); setShowForm(true) }} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePermission(p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
