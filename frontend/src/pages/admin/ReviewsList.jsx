import { useEffect, useMemo, useState } from "react"
import { EyeOff, Check, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("vi-VN")
  } catch {
    return "—"
  }
}

export default function ReviewsList() {
  const { api } = useAdminAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")
  const [query, setQuery] = useState("")

  useEffect(() => {
    api("/admin/reviews")
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [api])

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const passStatus = status === "all" || (status === "approved" ? r.approved : !r.approved)
      const q = query.trim().toLowerCase()
      const passQuery = !q || (r.handle || "").toLowerCase().includes(q) || (r.comment || "").toLowerCase().includes(q)
      return passStatus && passQuery
    })
  }, [reviews, status, query])

  const toggleApproved = async (review) => {
    const next = !review.approved
    await api(`/admin/reviews/${review.id}`, {
      method: "PUT",
      body: JSON.stringify({ approved: next }),
    })
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, approved: next } : r)))
  }

  const deleteReview = async (id) => {
    if (!confirm("Delete this review?")) return
    await api(`/admin/reviews/${id}`, { method: "DELETE" })
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Reviews</h1>
        <div className="text-sm text-secondary-light">{filtered.length} review(s)</div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by handle or comment..."
          className="w-full md:w-96 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="md:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="all">All</option>
          <option value="approved">Approved</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-secondary-light">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Rating</th>
                <th className="text-left px-4 py-3 font-medium">Comment</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-secondary">{r.handle}</td>
                  <td className="px-4 py-3">{"⭐".repeat(Number(r.rating) || 0)}</td>
                  <td className="px-4 py-3 text-secondary-light max-w-[420px]">{r.comment || "—"}</td>
                  <td className="px-4 py-3 text-secondary-light">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.approved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {r.approved ? "Approved" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggleApproved(r)} className={`p-1.5 rounded-lg transition-colors ${r.approved ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`} title={r.approved ? "Ẩn" : "Duyệt"}>
                        {r.approved ? <EyeOff className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteReview(r.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-secondary-light">No reviews found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
