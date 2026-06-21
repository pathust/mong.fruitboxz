import { Search, X, Filter, Check } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import AdminSelect from "./AdminSelect"

export function normalizeFilterText(value) {
  return String(value ?? "").toLowerCase().trim()
}

export function filterBySearch(item, query, fields) {
  const normalizedQuery = normalizeFilterText(query)
  if (!normalizedQuery) return true

  return fields.some((field) => {
    const value = typeof field === "function" ? field(item) : item?.[field]
    return normalizeFilterText(value).includes(normalizedQuery)
  })
}

export function AdminListFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
  onReset,
  total = 0,
  showing = 0,
  actions = null,
  disableSticky = false,
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterRef = useRef(null)

  // Đếm số lượng bộ lọc đang active
  const activeFiltersCount = filters.reduce((acc, filter) => {
    if (filter.type === 'checkbox') {
      return acc + (Array.isArray(filter.value) && filter.value.length > 0 ? 1 : 0)
    }
    if (filter.type === 'range') {
      return acc + ((filter.value?.[0] !== "" || filter.value?.[1] !== "") ? 1 : 0)
    }
    return acc + ((filter.value && filter.value !== "all") ? 1 : 0)
  }, 0)

  const hasActiveFilter = Boolean(search) || activeFiltersCount > 0

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const renderFilterControl = (filter) => {
    const type = filter.type || 'radio'
    
    if (type === 'select' || type === 'radio') {
      return (
        <div className="flex flex-wrap gap-2">
          {filter.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => filter.onChange(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${filter.value === opt.value ? 'bg-primary/10 text-primary border-primary/30' : 'bg-gray-50 text-[#6a5a4a] border-[#eadfcd] hover:bg-[#fffaf4] hover:border-primary/50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )
    }
  
    if (type === 'checkbox') {
      const selected = Array.isArray(filter.value) ? filter.value : (filter.value && filter.value !== 'all' ? [filter.value] : [])
      
      // Find explicit 'all' option if provided, else use default label
      const allOption = filter.options.find(opt => opt.value === 'all')
      const allLabel = allOption ? allOption.label : `Tất cả`

      return (
        <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {/* Nút "Tất cả" */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected.length === 0 ? 'bg-primary border-primary text-white' : 'border-[#eadfcd] bg-white group-hover:border-primary/50'}`}>
              {selected.length === 0 && <Check className="w-3 h-3" />}
            </div>
            <span className={`text-sm font-medium transition-colors ${selected.length === 0 ? 'text-primary' : 'text-[#44382f] group-hover:text-primary'}`}>
              {allLabel}
            </span>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={selected.length === 0}
              onChange={(e) => {
                if (e.target.checked) {
                  filter.onChange([]) // Clear all to select "All"
                }
              }}
            />
          </label>

          {/* Các tuỳ chọn khác */}
          {filter.options.filter(opt => opt.value !== 'all').map(opt => {
            const isChecked = selected.includes(opt.value)
            return (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-primary border-primary text-white' : 'border-[#eadfcd] bg-white group-hover:border-primary/50'}`}>
                  {isChecked && <Check className="w-3 h-3" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${isChecked ? 'text-primary' : 'text-[#44382f] group-hover:text-primary'}`}>
                  {opt.label}
                </span>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      filter.onChange([...selected, opt.value])
                    } else {
                      filter.onChange(selected.filter(v => v !== opt.value))
                    }
                  }}
                />
              </label>
            )
          })}
        </div>
      )
    }
  
    if (type === 'range') {
      const min = filter.value?.[0] !== undefined ? filter.value[0] : ""
      const max = filter.value?.[1] !== undefined ? filter.value[1] : ""
      return (
        <div className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Từ..." 
            value={min}
            onChange={e => filter.onChange([e.target.value !== "" ? Number(e.target.value) : "", max])}
            className="w-full px-3 py-2 text-sm border border-[#eadfcd] bg-white rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <span className="text-[#8a7a67] font-medium">-</span>
          <input 
            type="number" 
            placeholder="Đến..." 
            value={max}
            onChange={e => filter.onChange([min, e.target.value !== "" ? Number(e.target.value) : ""])}
            className="w-full px-3 py-2 text-sm border border-[#eadfcd] bg-white rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      )
    }
  }

  return (
    <div className={`w-full bg-[#fffaf4]/95 backdrop-blur-md pb-4 pt-1 -mt-1 shadow-sm border-b border-[#eadfcd]/50 ${disableSticky ? '' : 'sticky top-0 z-30'}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between px-1">
        
        {/* Left Side: Search & Filter Popover */}
        <div className="flex flex-1 items-center gap-3">
          {onSearchChange && (
            <label className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b8975]" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-xl border border-[#eadfcd] bg-[#fffaf4] pl-10 pr-4 text-sm font-medium text-[#44382f] outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              />
            </label>
          )}

          {filters && filters.length > 0 && (
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`h-10 px-4 rounded-xl border text-sm font-bold flex items-center gap-2 transition-colors ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-[#eadfcd] bg-white text-[#6a5a4a] hover:bg-[#fff7ec]'
                }`}
              >
                <Filter className="w-4 h-4" />
                Lọc
                {activeFiltersCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Filter Popover Content */}
              {isFilterOpen && (
                <div className="absolute top-full left-0 mt-2 w-[320px] bg-[#fffaf4] rounded-2xl shadow-xl border border-[#eadfcd] z-50 overflow-hidden origin-top-left animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-[#eadfcd] flex items-center justify-between bg-white">
                    <h3 className="font-extrabold text-[#44382f]">Bộ lọc</h3>
                    {onReset && activeFiltersCount > 0 && (
                      <button onClick={onReset} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                        Xoá tất cả
                      </button>
                    )}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {filters.map((filter, index) => (
                      <div key={filter.id || filter.label || index} className="p-4 border-b border-[#eadfcd]/50 last:border-0 bg-white/50">
                        <h4 className="text-sm font-bold text-[#6a5a4a] mb-3">{filter.label}</h4>
                        {renderFilterControl(filter)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Actions & Reset */}
        <div className="flex flex-col gap-3 shrink-0 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[#8a7a67]">
              Hiển thị {showing}/{total}
            </p>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={!hasActiveFilter}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#eadfcd] bg-white px-3 text-sm font-bold text-[#6a5a4a] transition hover:bg-[#fff7ec] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <X className="h-4 w-4" />
                Xóa tìm kiếm & lọc
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
