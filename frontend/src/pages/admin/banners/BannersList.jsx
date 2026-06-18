import { useMemo, useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ImageIcon, Pencil, Trash2, X } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"

export default function BannersList() {
  const { api } = useAdminAuth()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState("all")
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    api("/admin/banners")
      .then(d => setBanners(d.banners || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return
    await api(`/admin/banners/${id}`, { method: "DELETE" })
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      return (
        filterBySearch(banner, query, ["title", "subtitle", "link"]) &&
        (active === "all" || (active === "active" ? banner.active : !banner.active))
      )
    })
  }, [banners, query, active])

  if (loading) return <div className="text-center py-12 text-secondary-light">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-secondary">Banners</h1>
        <Link to="/admin/banners/new" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-dark">+ Add Banner</Link>
      </div>
      <AdminListFilters
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm theo title, subtitle, link..."
        showing={filteredBanners.length}
        total={banners.length}
        onReset={() => {
          setQuery("")
          setActive("all")
        }}
        filters={[
          {
            label: "Active",
            value: active,
            onChange: setActive,
            options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
      />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-secondary-light">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Ảnh</th>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Subtitle</th>
              <th className="text-left px-4 py-3 font-medium">Active</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBanners.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {b.image ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ src: b.image, title: b.title })}
                      className="group block h-16 w-28 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-primary hover:shadow-sm"
                      title="Xem ảnh banner"
                    >
                      <img src={b.image} alt={b.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                    </button>
                  ) : (
                    <div className="flex h-16 w-28 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-300">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-secondary">{b.title}</td>
                <td className="px-4 py-3 text-secondary-light">{b.subtitle}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{b.active ? "Yes" : "No"}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/banners/${b.id}`} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteBanner(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="font-semibold text-secondary">{previewImage.title || "Ảnh banner"}</p>
              <button type="button" onClick={() => setPreviewImage(null)} className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-secondary" aria-label="Đóng xem ảnh">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto bg-gray-950 p-3">
              <img src={previewImage.src} alt={previewImage.title || "Ảnh banner"} className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


