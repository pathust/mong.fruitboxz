/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react"
import { apiFetch } from "../lib/api"
import { decodeJwt, isTokenExpired } from "../lib/jwt"

const AdminAuthContext = createContext(null)

async function api(path, options = {}) {
  const token = localStorage.getItem("admin_token")
  if (token && isTokenExpired(token)) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    throw new Error('Phiên đăng nhập admin đã hết hạn')
  }
  try {
    return await apiFetch(path, { ...options, token })
  } catch (error) {
    if (error?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      if (window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login')
      }
    }
    throw error
  }
}

function getInitialUser() {
  const token = localStorage.getItem("admin_token")
  const savedUser = localStorage.getItem("admin_user")
  if (!token || !savedUser) return null
  if (isTokenExpired(token)) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    return null
  }

  try {
    return JSON.parse(savedUser)
  } catch {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    return null
  }
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)
  const loading = false

  const request = useCallback((path, options = {}) => api(path, options), [])

  const fetchPermissions = useCallback(async () => {
    try {
      const data = await request("/admin/users/me/permissions")
      setUser(prev => {
        if (!prev) return prev
        const updated = { ...prev, permissions: data.permissions || [] }
        localStorage.setItem("admin_user", JSON.stringify(updated))
        return updated
      })
    } catch (e) {
      console.error("Failed to fetch permissions", e)
    }
  }, [request])

  useEffect(() => {
    if (user && (!user.permissions)) {
      fetchPermissions()
    }
  }, [user, fetchPermissions])

  const login = useCallback(async (email, password) => {
    const data = await apiFetch("/auth/user/emailpass", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    localStorage.setItem("admin_token", data.token)

    const decoded = decodeJwt(data.token)
    const userInfo = {
      id: decoded?.app_metadata?.user_id || decoded?.actor_id,
      email,
      roles: decoded?.app_metadata?.roles || [],
      permissions: [],
    }

    localStorage.setItem("admin_user", JSON.stringify(userInfo))
    setUser(userInfo)
    return userInfo
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user")
    setUser(null)
  }, [])

  const hasPermission = useCallback((perm) => {
    if (!user) return false
    if (user.permissions?.includes("*")) return true
    return user.permissions?.includes(perm)
  }, [user])

  const value = useMemo(() => ({ user, loading, login, logout, api: request, hasPermission }), [user, loading, login, logout, request, hasPermission])

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider")
  return ctx
}

export { api }
