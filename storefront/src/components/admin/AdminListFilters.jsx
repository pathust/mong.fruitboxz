import { Search, X } from "lucide-react"
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
}) {
  const hasActiveFilter = Boolean(search) || filters.some((filter) => filter.value && filter.value !== "all")

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:flex-wrap">
          {onSearchChange && (
            <label className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b8975]" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-xl border border-[#eadfcd] bg-[#fffaf4] pl-10 pr-4 text-sm font-medium text-[#44382f] outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
              />
            </label>
          )}

          {filters.map((filter) => (
            <label key={filter.id || filter.label} className="min-w-[170px]">
              <span className="sr-only">{filter.label}</span>
              <AdminSelect
                value={filter.value}
                onChange={filter.onChange}
                options={filter.options}
                className="h-11 bg-[#fffaf4] border-[#eadfcd] text-[#5d5246] hover:bg-white hover:border-[#eadfcd]"
              />
            </label>
          ))}
        </div>

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
              Xóa lọc
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
