import { useState, useEffect, useRef } from "react"
import { Copy, LoaderCircle, Search, Trash2, UploadCloud } from "lucide-react"
import { useAdminAuth } from "../../context/AdminAuthContext"
import { useToast } from "../ui/ToastProvider"

export default function ImagePicker({ selected, onSelect, multiple }) {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")
  const fileRef = useRef()

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result)
    reader.onerror = () => reject(new Error("Could not read image file"))
    reader.readAsDataURL(file)
  })

  useEffect(() => {
    api("/admin/media")
      .then(d => {
        setImages(d.images || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [api])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const base64 = await readFileAsDataUrl(file)
      await api("/admin/media/upload", {
        method: "POST",
        body: { filename: file.name, data: base64 },
      })
      const d = await api("/admin/media")
      setImages(d.images || [])
      pushToast("Ảnh đã được tải lên.", "success")
    } catch (err) {
      pushToast("Upload failed: " + (err instanceof Error ? err.message : err), "error")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const filtered = search ? images.filter(i => i.filename.toLowerCase().includes(search.toLowerCase())) : images

  const toggleSelect = (url) => {
    if (multiple) {
      const next = selected.includes(url) ? selected.filter(u => u !== url) : [...selected, url]
      onSelect(next)
    } else {
      onSelect(selected === url ? "" : url)
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-[#eadfcd] bg-[#fffaf3] px-3 py-2">
          <Search className="h-4 w-4 text-[#8b7966]" />
          <input
            type="text"
            placeholder="Search images..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#4c4238] focus:outline-none"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 whitespace-nowrap">
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square animate-soft-pulse rounded-2xl bg-[#f6eee2]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-secondary-light py-4 text-center">{search ? "No images match search" : "No images yet. Upload one above."}</div>
      ) : (
        <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
          {filtered.map(img => (
            <div
              key={img.filename}
              className={`group relative aspect-square overflow-hidden rounded-2xl border-2 ${(multiple ? selected.includes(img.url) : selected === img.url) ? "border-primary ring-2 ring-primary/30" : "border-[#eadfcd] hover:border-[#cfbaa0]"}`}
            >
              <button
                type="button"
                onClick={() => toggleSelect(img.url)}
                className="h-full w-full"
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {(multiple ? selected.includes(img.url) : selected === img.url) && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <span className="text-white bg-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
              <div className="absolute inset-x-2 bottom-2 flex translate-y-2 justify-center gap-1 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(img.url)
                    pushToast("Đã copy URL ảnh.", "success")
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#5f5548] shadow-sm"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const deleted = await api(`/admin/media/${encodeURIComponent(img.key || img.filename)}`, { method: "DELETE" }).catch(() => null)
                    if (!deleted) {
                      pushToast("Không xóa được ảnh.", "error")
                      return
                    }
                    const d = await api("/admin/media")
                    setImages(d.images || [])
                    pushToast("Đã xóa ảnh khỏi thư viện.", "success")
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#c7643a] shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {(multiple ? selected.includes(img.url) : selected === img.url) && (
                <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-primary shadow-sm">
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
