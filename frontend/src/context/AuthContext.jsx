/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react"
import { decodeJwt, isTokenExpired } from "../lib/jwt"

const AuthContext = createContext(null)

function buildCustomerFromToken(token) {
  const payload = decodeJwt(token)
  if (!payload) return null

  return {
    id: payload.actor_id,
    email: payload.email || payload.app_metadata?.email,
  }
}

function getInitialCustomer() {
  const token = localStorage.getItem("customer_token")
  if (!token) return null
  if (isTokenExpired(token)) {
    localStorage.removeItem('customer_token')
    return null
  }

  const customerInfo = buildCustomerFromToken(token)
  if (!customerInfo) {
    localStorage.removeItem("customer_token")
    return null
  }

  return customerInfo
}

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(getInitialCustomer)
  const loading = false

  const login = (token) => {
    if (isTokenExpired(token)) {
      throw new Error('Token hết hạn, vui lòng đăng nhập lại')
    }
    const customerInfo = buildCustomerFromToken(token)
    if (!customerInfo) {
      throw new Error("Invalid authentication token")
    }
    localStorage.setItem("customer_token", token)
    setCustomer(customerInfo)
  }

  const logout = () => {
    localStorage.removeItem("customer_token")
    setCustomer(null)
  }

  return (
    <AuthContext.Provider value={{ customer, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
