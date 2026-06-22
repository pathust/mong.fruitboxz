import { Navigate } from "react-router-dom"
import { useAdminAuth } from "../../context/AdminAuthContext"

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) return <Navigate to="/admin/login" replace />
  return children
}
