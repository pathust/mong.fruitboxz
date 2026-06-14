import { useState, useEffect } from "react"
import { useAdminAuth } from "../../context/AdminAuthContext"

export default function UsersList() {
  const { api } = useAdminAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api("/admin/users"),
      api("/admin/roles").catch(() => ({ roles: [] })),
    ]).then(([u, r]) => {
      setUsers(u.users || [])
      setRoles(r.roles || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [api])

  const setUserRoles = async (userId, roleIds) => {
    await api(`/admin/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify({ role_ids: roleIds }),
    })
    const update = await api(`/admin/users/${userId}`)
    setUsers(prev => prev.map(u => u.id === userId ? update.user : u))
  }

  const assignRole = async (userId, roleId, currentRoleIds) => {
    if (!roleId) return
    await setUserRoles(userId, [...new Set([...currentRoleIds, roleId])])
  }

  const removeRole = async (userId, roleId, currentRoleIds) => {
    await setUserRoles(userId, currentRoleIds.filter((id) => id !== roleId))
  }

  const createUser = async () => {
    const email = prompt("Enter email:")
    if (!email) return
    try {
      const result = await api("/admin/users", {
        method: "POST",
        body: JSON.stringify({ email }),
      })
      setUsers(prev => [...prev, result.user])
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Users</h1>
        <button onClick={createUser} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark">+ Add User</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-secondary-light">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Roles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => {
              const userRoleIds = u.metadata?.roles || []
              return (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-secondary">{u.email}</td>
                  <td className="px-4 py-3 text-secondary-light">{u.first_name || ""} {u.last_name || ""}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {userRoleIds.map(rid => {
                        const role = roles.find(r => r.id === rid)
                        return role ? (
                          <button
                            key={rid}
                            type="button"
                            onClick={() => removeRole(u.id, rid, userRoleIds)}
                            className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full hover:bg-primary/20"
                            title="Remove role"
                          >
                            {role.name} ×
                          </button>
                        ) : null
                      })}
                      <select
                        value=""
                        onChange={e => assignRole(u.id, e.target.value, userRoleIds)}
                        className="ml-2 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        <option value="">+ Assign role</option>
                        {roles.filter(r => !userRoleIds.includes(r.id)).map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
