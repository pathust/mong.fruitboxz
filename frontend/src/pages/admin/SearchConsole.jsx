import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, RefreshCcw, SearchCheck, Search, Database, Zap, Clock, Box } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useToast } from '../../components/ui/ToastProvider'
import { AdminError, AdminLoading } from '../../components/admin/AdminStates'
import { apiFetch } from '../../lib/api'

export default function SearchConsole() {
  const { api } = useAdminAuth()
  const { pushToast } = useToast()
  const [status, setStatus] = useState({ configured: false, online: false, enabled: false, indexed_documents: 0, last_reindex_at: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reindexing, setReindexing] = useState(false)
  
  // Test Search State
  const [testQuery, setTestQuery] = useState('')
  const [testResults, setTestResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

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
    if (!confirm('Hệ thống sẽ đồng bộ lại toàn bộ dữ liệu Sản phẩm vào Search Engine. Bạn có chắc chắn muốn tiếp tục?')) return
    setReindexing(true)
    try {
      const data = await api('/admin/search', { method: 'POST' })
      setStatus((prev) => ({ ...prev, ...data }))
      pushToast(`Đã reindex ${data.indexed || 0} sản phẩm.`, 'success')
      if (testQuery) handleTestSearch(testQuery) // re-run test
    } catch (error) {
      pushToast(error?.message || 'Reindex thất bại. Storefront vẫn dùng fallback catalog.', 'error')
    } finally {
      setReindexing(false)
    }
  }

  const handleTestSearch = async (queryParam) => {
    const q = typeof queryParam === 'string' ? queryParam : testQuery
    if (!q.trim()) {
      setTestResults([])
      return
    }
    setIsSearching(true)
    try {
      const data = await apiFetch(`/store/search?q=${encodeURIComponent(q)}`)
      setTestResults(data.hits || [])
    } catch (err) {
      pushToast('Lỗi khi tìm kiếm thử: ' + err.message, 'error')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="admin-panel px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a08d79] mb-2">Hệ Thống</p>
            <h1 className="page-title text-[30px]">Search Console</h1>
            <p className="product-meta mt-2 text-[14px] text-[#766957]">Quản lý công cụ tìm kiếm, đồng bộ dữ liệu và kiểm tra kết quả thực tế.</p>
          </div>
          <button
            type="button"
            onClick={handleReindex}
            disabled={reindexing}
            className="admin-button-primary px-5 py-3 text-sm disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {reindexing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {reindexing ? 'Đang đồng bộ...' : 'Đồng bộ lại dữ liệu'}
          </button>
        </div>
      </div>

      {loading ? (
        <AdminLoading title="Đang kiểm tra kết nối Search Engine..." description="Đang đọc trạng thái từ Meilisearch." />
      ) : error ? (
        <AdminError message={error} onRetry={() => {
          setLoading(true)
          loadStatus().finally(() => setLoading(false))
        }} />
      ) : (
      <>
        {/* Status Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="admin-card px-6 py-6 flex items-start gap-4 bg-gradient-to-br from-white to-[#fffaf4]">
            <div className={`p-3 rounded-xl ${status.configured ? 'bg-[#e8f6e9] text-[#2f7a37]' : 'bg-[#fff4ea] text-primary'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="product-meta text-[11px] font-bold uppercase tracking-[0.12em] text-[#a08d79] mb-1">Cấu Hình</p>
              <p className="text-xl font-extrabold text-[#40362d]">{status.configured ? 'Đã cài đặt' : 'Fallback'}</p>
            </div>
          </div>
          
          <div className="admin-card px-6 py-6 flex items-start gap-4 bg-gradient-to-br from-white to-[#fffaf4]">
            <div className={`p-3 rounded-xl ${status.online || status.enabled ? 'bg-[#e8f6e9] text-[#2f7a37]' : 'bg-[#f1eadf] text-[#766957]'}`}>
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="product-meta text-[11px] font-bold uppercase tracking-[0.12em] text-[#a08d79] mb-1">Trạng Thái</p>
              <p className="text-xl font-extrabold text-[#40362d]">{status.online || status.enabled ? 'Online' : 'Offline'}</p>
            </div>
          </div>

          <div className="admin-card px-6 py-6 flex items-start gap-4 bg-gradient-to-br from-white to-[#fffaf4]">
            <div className="p-3 rounded-xl bg-[#f0f4ff] text-[#2b5a9e]">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <p className="product-meta text-[11px] font-bold uppercase tracking-[0.12em] text-[#a08d79] mb-1">Dữ liệu Index</p>
              <p className="text-xl font-extrabold text-[#40362d]">{status.indexed_documents || 0}</p>
            </div>
          </div>

          <div className="admin-card px-6 py-6 flex items-start gap-4 bg-gradient-to-br from-white to-[#fffaf4]">
            <div className="p-3 rounded-xl bg-[#f8f0ff] text-[#6b2b9e]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="product-meta text-[11px] font-bold uppercase tracking-[0.12em] text-[#a08d79] mb-1">Đồng bộ lần cuối</p>
              <p className="text-sm font-bold text-[#40362d] mt-1 line-clamp-2">
                {status.last_reindex_at ? new Date(status.last_reindex_at).toLocaleString('vi-VN') : 'Chưa từng đồng bộ'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          {/* Test Search Section */}
          <div className="admin-card overflow-hidden flex flex-col">
            <div className="bg-[#fffaf4] border-b border-[#eadfcd] p-6">
              <div className="flex items-center gap-3 mb-6">
                <SearchCheck className="w-6 h-6 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-secondary">Trình Kiểm Tra Tìm Kiếm</h2>
                  <p className="text-xs font-medium text-[#8a7a67]">Gõ thử từ khóa để xem kết quả trả về từ Search Engine cho khách hàng.</p>
                </div>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleTestSearch(); }} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-[#a08d79]" />
                <input 
                  type="text" 
                  value={testQuery}
                  onChange={e => setTestQuery(e.target.value)}
                  placeholder="Gõ tên trái cây, đặc tính... (ví dụ: Cherry, Táo ngọt)"
                  className="w-full bg-white border-2 border-[#eadfcd] rounded-xl py-4 pl-12 pr-24 text-[15px] font-medium text-secondary focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
                <button 
                  type="submit" 
                  className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-primary-dark text-white font-bold px-4 rounded-lg transition-colors text-sm"
                  disabled={isSearching}
                >
                  {isSearching ? <LoaderCircle className="w-4 h-4 animate-spin" /> : 'Tìm thử'}
                </button>
              </form>
            </div>

            <div className="p-6 bg-white flex-1 min-h-[300px]">
              {isSearching ? (
                <div className="h-full flex flex-col items-center justify-center text-[#a08d79]">
                  <LoaderCircle className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <p className="font-medium">Đang truy vấn...</p>
                </div>
              ) : testQuery && testResults.length > 0 ? (
                <div>
                  <p className="text-sm font-bold text-[#8a7a67] mb-4">Tìm thấy {testResults.length} kết quả cho "{testQuery}"</p>
                  <div className="space-y-4">
                    {testResults.map(product => (
                      <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#eadfcd] hover:border-primary/30 hover:bg-[#fffaf4] transition-colors group">
                        <div className="w-16 h-16 rounded-lg bg-accent overflow-hidden shrink-0">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-6 h-6 m-auto mt-5 text-[#a08d79]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#3f352b] truncate group-hover:text-primary transition-colors">{product.title}</h3>
                          <p className="text-xs text-[#8a7a67] mt-1 flex items-center gap-2">
                            {product.categories?.length > 0 && <span className="bg-[#f1eadf] px-2 py-0.5 rounded text-[#5d5246]">{product.categories[0].name}</span>}
                            <span>/{product.handle}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : testQuery && testResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Search className="w-12 h-12 text-[#eadfcd] mb-4" />
                  <p className="text-lg font-bold text-[#5d5246] mb-2">Không tìm thấy gì</p>
                  <p className="text-sm text-[#8a7a67] max-w-sm">Không có sản phẩm nào khớp với từ khóa "{testQuery}". Hãy thử đồng bộ lại dữ liệu nếu bạn vừa thêm sản phẩm mới.</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-[#fffaf4] flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-[#eadfcd]" />
                  </div>
                  <p className="text-sm font-medium text-[#8a7a67] max-w-xs">Gõ từ khóa vào ô tìm kiếm ở trên để xem công cụ hoạt động như thế nào.</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="admin-card p-6 bg-gradient-to-b from-white to-[#fffaf4]">
            <h3 className="font-bold text-secondary text-lg mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Cách hoạt động
            </h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#eadfcd] before:to-transparent hidden">
              {/* Stepper design intentionally skipped to keep it simple, let's use list */}
            </div>
            
            <ul className="space-y-5">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[#fff4ea] text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">1</div>
                <div>
                  <p className="font-bold text-[14px] text-secondary">Tự động Fallback</p>
                  <p className="text-[13px] text-[#766957] mt-1 leading-relaxed">Nếu MeiliSearch chưa online, Storefront sẽ tự động dùng tính năng lọc nội bộ để không làm gián đoạn khách hàng.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[#fff4ea] text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">2</div>
                <div>
                  <p className="font-bold text-[14px] text-secondary">Đồng bộ khi nào?</p>
                  <p className="text-[13px] text-[#766957] mt-1 leading-relaxed">Chỉ cần bấm "Đồng bộ lại" khi bạn vừa Import số lượng lớn sản phẩm hoặc muốn ép hệ thống quét lại toàn bộ danh mục.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[#fff4ea] text-primary flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">3</div>
                <div>
                  <p className="font-bold text-[14px] text-secondary">Tối ưu tìm kiếm</p>
                  <p className="text-[13px] text-[#766957] mt-1 leading-relaxed">Hãy thử tìm các từ khóa sai lỗi chính tả để xem sức mạnh của MeiliSearch xử lý (nếu có cài đặt).</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </>
      )}
    </div>
  )
}
