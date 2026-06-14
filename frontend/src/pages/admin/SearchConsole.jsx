import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, RefreshCcw, SearchCheck } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useToast } from '../../components/ui/ToastProvider'
import { AdminError, AdminLoading } from '../../components/admin/AdminStates'

export default function SearchConsole() {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const [status, setStatus] = useState({ configured: false, online: false, enabled: false, indexed_documents: 0, last_reindex_at: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reindexing, setReindexing] = useState(false)

  const loadStatus = useCallback(async () => {
    setError('')
    const data = await api('/admin/search')
    setStatus(data)
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadStatus()
        .catch((err) => {
          setError(err?.message || 'Không đọc được trạng thái search.')
          pushToast('Không đọc được trạng thái search.', 'error')
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadStatus, pushToast])

  const handleReindex = async () => {
    setReindexing(true)
    try {
      const data = await api('/admin/search', { method: 'POST' })
      setStatus((prev) => ({ ...prev, ...data }))
      pushToast(`Đã reindex ${data.indexed || 0} sản phẩm.`, 'success')
    } catch (error) {
      pushToast(error?.message || 'Reindex thất bại. Storefront vẫn dùng fallback catalog.', 'error')
    } finally {
      setReindexing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="admin-panel px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="page-title text-[28px]">Search Console</h1>
            <p className="product-meta mt-2 text-[14px] text-[#766957]">Quản lý MeiliSearch, reindex thủ công và theo dõi trạng thái tài liệu.</p>
          </div>
          <button
            type="button"
            onClick={handleReindex}
            disabled={reindexing}
            className="admin-button-primary px-5 py-3 text-sm disabled:opacity-60"
          >
            {reindexing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {reindexing ? 'Đang reindex...' : 'Reindex ngay'}
          </button>
        </div>
      </div>

      {loading ? (
        <AdminLoading title="Đang kiểm tra MeiliSearch..." description="Search Console sẽ tự fallback nếu service tìm kiếm chưa chạy." />
      ) : error ? (
        <AdminError message={error} onRetry={() => {
          setLoading(true)
          loadStatus().finally(() => setLoading(false))
        }} />
      ) : (
      <>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Config', value: status.configured ? 'Configured' : 'Fallback only' },
          { label: 'Service', value: status.online || status.enabled ? 'Online' : 'Offline' },
          { label: 'Indexed docs', value: loading ? '...' : status.indexed_documents || 0 },
        ].map((item) => (
          <div key={item.label} className="admin-card px-5 py-5">
            <p className="product-meta text-[12px] uppercase tracking-[0.12em] text-[#a08d79]">{item.label}</p>
            <p className="mt-3 text-[26px] font-bold text-[#40362d]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="admin-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4ea] text-primary">
            <SearchCheck className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="section-title text-[20px]">Thiết kế vận hành</p>
            <p className="product-meta text-[14px] leading-7 text-[#776a5b]">
              Storefront luôn gọi backend `/store/search`; nếu MeiliSearch chưa cấu hình hoặc gián đoạn thì backend tự fallback sang lọc catalog nội bộ. Reindex chỉ cần chạy khi bootstrap dữ liệu, import hàng loạt, hoặc muốn ép đồng bộ lại toàn bộ index.
            </p>
            <p className="product-meta text-[13px] text-[#9a8974]">
              Last reindex: {status.last_reindex_at ? new Date(status.last_reindex_at).toLocaleString('vi-VN') : 'Chưa có'}
            </p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}
