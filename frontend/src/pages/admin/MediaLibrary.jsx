import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AdminHeaderPortal } from "../../components/admin/AdminHeaderPortal"
import { Copy, Image, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useToast } from '../../components/ui/ToastProvider'
import { AdminEmpty, AdminError, AdminImage, AdminLoading } from '../../components/admin/AdminStates'
import { AdminListFilters } from '../../components/admin/AdminListFilters'

export default function MediaLibrary() {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const fileRef = useRef(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [objectStorage, setObjectStorage] = useState(false)

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result)
    reader.onerror = () => reject(new Error('Không đọc được file'))
    reader.readAsDataURL(file)
  })

  const loadMedia = useCallback(async (search = '') => {
    setError('')
    const data = await api(`/admin/media${search ? `?q=${encodeURIComponent(search)}` : ''}`)
    setItems(data.images || [])
    setObjectStorage(Boolean(data.object_storage))
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadMedia()
        .catch((err) => {
          setError(err?.message || 'Không tải được media library.')
          pushToast('Không tải được media library.', 'error')
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadMedia, pushToast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadMedia(query).catch(() => {})
    }, 220)
    return () => window.clearTimeout(timer)
  }, [loadMedia, query])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const data = await readFileAsDataUrl(file)
      await api('/admin/media/upload', {
        method: 'POST',
        body: { filename: file.name, data },
      })
      await loadMedia(query)
      pushToast('Ảnh đã được tải lên.', 'success')
    } catch (error) {
      pushToast(error?.message || 'Tải ảnh thất bại.', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (key) => {
    const confirmed = window.confirm('Xóa ảnh này khỏi thư viện?')
    if (!confirmed) return
    try {
      await api(`/admin/media/${encodeURIComponent(key)}`, { method: 'DELETE' })
      await loadMedia(query)
      pushToast('Ảnh đã được xóa.', 'success')
    } catch {
      pushToast('Không xóa được ảnh.', 'error')
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const size = Number(item.size || 0)
      return (
        sizeFilter === 'all' ||
        (sizeFilter === 'small' && size > 0 && size < 250 * 1024) ||
        (sizeFilter === 'medium' && size >= 250 * 1024 && size < 1024 * 1024) ||
        (sizeFilter === 'large' && size >= 1024 * 1024) ||
        (sizeFilter === 'unknown' && !size)
      )
    })
  }, [items, sizeFilter])

  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Nội dung & Media</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" /> Thư viện ảnh
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý và lưu trữ tất cả hình ảnh của cửa hàng.</p>
          </div>
        
      </div>
      </AdminHeaderPortal>

      {loading ? (
        <AdminLoading title="Đang tải media library..." description="Đang đọc danh sách ảnh từ MinIO hoặc local storage." />
      ) : error ? (
        <AdminError message={error} onRetry={() => {
          setLoading(true)
          loadMedia(query).finally(() => setLoading(false))
        }} />
      ) : (
        <>
        <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm p-4 mb-6">
          <AdminListFilters
            actions={
              <>
                <div className="flex flex-col gap-3 sm:flex-row">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()} className="admin-button-primary px-5 py-3 text-sm">
                {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
              </button>
            </div>
              </>
            }
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm file..."
            showing={filteredItems.length}
            total={items.length}
            onReset={() => {
              setQuery('')
              setSizeFilter('all')
            }}
            filters={[
              {
                label: 'Dung lượng',
                value: sizeFilter,
                onChange: setSizeFilter,
                options: [
                  { value: 'all', label: 'Tất cả dung lượng' },
                  { value: 'small', label: '< 250KB' },
                  { value: 'medium', label: '250KB - 1MB' },
                  { value: 'large', label: '>= 1MB' },
                  { value: 'unknown', label: 'Không rõ size' },
                ],
              },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {filteredItems.map((item) => (
            <article key={item.key} className="admin-card group overflow-hidden">
              <div className="aspect-square overflow-hidden bg-[#faf3e9]">
                <AdminImage src={item.url} alt={item.filename} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" fallbackClassName="h-full w-full" />
              </div>
              <div className="space-y-3 px-4 py-4">
                <div>
                  <p className="truncate text-sm font-semibold text-[#40362d]">{item.filename}</p>
                  <p className="product-meta text-[12px] text-[#8c7d6b]">
                    {item.size ? `${Math.max(1, Math.round(item.size / 1024))} KB` : 'Unknown size'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(item.url)
                      pushToast('Đã copy URL ảnh.', 'success')
                    }}
                    className="admin-button-secondary flex-1 px-3 py-2 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy URL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.key)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f2d7cf] text-[#c85b34] transition hover:bg-[#fff4ef]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!filteredItems.length && (
            <div className="col-span-full">
              <AdminEmpty title="Chưa có ảnh nào phù hợp" message="Thử tải ảnh mới hoặc tìm với từ khóa khác." />
            </div>
          )}
        </div>
        </>
      )}
    </div>
  )
}
