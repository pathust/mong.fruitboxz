import { Navigate } from "react-router-dom"
import { useAdminAuth } from "../../context/AdminAuthContext"

export function RequirePermission({ perm, children, fallback = null }) {
  const { hasPermission } = useAdminAuth()

  // If perm is an array, check if user has AT LEAST ONE of the permissions
  const perms = Array.isArray(perm) ? perm : [perm]
  const isAllowed = perms.some(p => hasPermission(p))

  if (!isAllowed) {
    if (fallback !== null) return fallback
    // If used as a route wrapper and no fallback is provided, redirect or show access denied
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 mb-4">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quyền truy cập bị từ chối</h2>
        <p className="text-gray-500 max-w-md">Bạn không có quyền truy cập vào trang này hoặc thực hiện thao tác này. Vui lòng liên hệ quản trị viên để được cấp quyền.</p>
      </div>
    )
  }

  return children
}
