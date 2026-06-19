import { Outlet } from "react-router-dom"
import { useAdminAuth } from "../../context/AdminAuthContext"

export default function AdminLoginCheck() {
  const { loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return <Outlet />
}
