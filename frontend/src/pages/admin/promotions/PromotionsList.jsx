import { useCallback, useMemo, useState, useEffect } from "react"
import { Tag, Plus, CheckCircle, Search, Edit2, Trash2 } from "lucide-react"
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"

// Simple inline modal
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eadfcd] px-6 py-4">
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function toDateTimeLocal(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function getUsageLimit(promo) {
  return Number(promo.metadata?.usage_limit || promo.campaign?.budget?.limit || 0)
}

function getUsageCount(promo) {
  return Number(promo.metadata?.usage_count || promo.campaign?.budget?.used || 0)
}

function getStartsAt(promo) {
  return promo.metadata?.starts_at || promo.campaign?.starts_at || ""
}

function getEndsAt(promo) {
  return promo.metadata?.ends_at || promo.campaign?.ends_at || ""
}

export default function PromotionsList() {
  const { api } = useAdminAuth()
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [conditionFilter, setConditionFilter] = useState("all")

  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    value: "",
    hasUsageLimit: false,
    usageLimit: "",
    hasExpiry: false,
    startsAt: "",
    endsAt: "",
    minOrderValue: "",
    maxDiscount: ""
  })

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api("/admin/promotions")
      if (res?.promotions) {
        const promotionsWithMetadata = await Promise.all(
          res.promotions.map(async (promotion) => {
            try {
              const result = await api(`/admin/promotions/${promotion.id}/metadata`)
              return { ...promotion, metadata: result.metadata || {} }
            } catch {
              return { ...promotion, metadata: {} }
            }
          })
        )
        setPromotions(promotionsWithMetadata)
      }
    } catch (error) {
      console.error("Failed to fetch promotions:", error)
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    const timer = window.setTimeout(fetchPromotions, 0)
    return () => window.clearTimeout(timer)
  }, [fetchPromotions])

  const handleSave = async (e) => {
    e.preventDefault()
    const normalizedCode = form.code.trim().toUpperCase()
    const duplicate = promotions.some((promo) => promo.code?.toUpperCase() === normalizedCode && promo.id !== editingId)

    if (!normalizedCode || form.value <= 0) {
      return alert("Vui lòng nhập mã hợp lệ và giá trị lớn hơn 0")
    }
    if (duplicate) {
      return alert("Mã giảm giá đã tồn tại. Vui lòng chọn mã khác.")
    }
    if (form.hasExpiry && form.startsAt && form.endsAt && new Date(form.startsAt) >= new Date(form.endsAt)) {
      return alert("Ngày bắt đầu phải nhỏ hơn ngày hết hạn.")
    }

    try {
      const metadata = {};
      if (form.minOrderValue > 0) metadata.min_order_value = Number(form.minOrderValue);
      else metadata.min_order_value = null;

      if (form.discountType === "percentage" && form.maxDiscount > 0) metadata.max_discount = Number(form.maxDiscount);
      else metadata.max_discount = null;

      metadata.usage_limit = form.hasUsageLimit && form.usageLimit > 0 ? Number(form.usageLimit) : null;
      metadata.starts_at = form.hasExpiry && form.startsAt ? new Date(form.startsAt).toISOString() : null;
      metadata.ends_at = form.hasExpiry && form.endsAt ? new Date(form.endsAt).toISOString() : null;

      if (editingId) {
        const updatePayload = {
          code: normalizedCode,
        };

        await api(`/admin/promotions/${editingId}`, {
          method: "POST",
          body: JSON.stringify(updatePayload)
        });

        await api(`/admin/promotions/${editingId}/metadata`, {
          method: "POST",
          body: JSON.stringify({ metadata })
        });

        setIsModalOpen(false);
        fetchPromotions();
        return;
      }

      const application_method = {
        type: form.discountType,
        target_type: "order",
        value: Number(form.value)
      };

      if (form.discountType === "fixed") {
        application_method.currency_code = "vnd";
      }

      let campaignId = null;

      if (form.hasUsageLimit || form.hasExpiry) {
        const campaignPayload = {
          name: `Chiến dịch ${form.code.toUpperCase()}`,
          campaign_identifier: `CAMP_${form.code.toUpperCase()}_${Date.now()}`
        };

        if (form.hasUsageLimit && form.usageLimit > 0) {
          campaignPayload.budget = {
            type: "usage",
            limit: Number(form.usageLimit)
          };
        }

        if (form.hasExpiry) {
          if (form.startsAt) campaignPayload.starts_at = new Date(form.startsAt).toISOString();
          if (form.endsAt) campaignPayload.ends_at = new Date(form.endsAt).toISOString();
        }

        // Tạo Campaign trước
        const campRes = await api("/admin/campaigns", {
          method: "POST",
          body: JSON.stringify(campaignPayload)
        });
        campaignId = campRes.campaign.id;
      }

      const payload = {
        code: normalizedCode,
        type: "standard",
        is_automatic: false,
        application_method
      };

      if (campaignId) {
        payload.campaign_id = campaignId;
      }

      const createdRes = await api("/admin/promotions", {
        method: "POST",
        body: JSON.stringify(payload)
      })

      const createdPromo = createdRes?.promotion || createdRes;
      if (createdPromo && createdPromo.id && Object.keys(metadata).length > 0) {
        await api(`/admin/promotions/${createdPromo.id}/metadata`, {
          method: "POST",
          body: JSON.stringify({ metadata })
        });
      }

      setIsModalOpen(false)
      fetchPromotions()
    } catch (error) {
      alert("Lỗi tạo mã: " + (error.message || JSON.stringify(error)))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mã này?")) return
    try {
      await api(`/admin/promotions/${id}`, { method: "DELETE" })
      fetchPromotions()
    } catch (error) {
      console.error(error)
      alert("Lỗi xóa mã: " + error.message)
    }
  }

  const openNew = () => {
    setEditingId(null)
    setForm({
      code: "",
      discountType: "percentage",
      value: "",
      hasUsageLimit: false,
      usageLimit: "",
      hasExpiry: false,
      startsAt: "",
      endsAt: "",
      minOrderValue: "",
      maxDiscount: ""
    })
    setIsModalOpen(true)
  }

  const openEdit = (promo) => {
    const method = promo.application_method
    const usageLimit = getUsageLimit(promo)
    const startsAt = getStartsAt(promo)
    const endsAt = getEndsAt(promo)
    setForm({
      code: promo.code,
      discountType: method?.type || "percentage",
      value: method?.value || "",
      hasUsageLimit: usageLimit > 0,
      usageLimit: usageLimit || "",
      hasExpiry: Boolean(startsAt || endsAt),
      startsAt: toDateTimeLocal(startsAt),
      endsAt: toDateTimeLocal(endsAt),
      minOrderValue: promo.metadata?.min_order_value || "",
      maxDiscount: promo.metadata?.max_discount || ""
    })
    setEditingId(promo.id)
    setIsModalOpen(true)
  }

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      const methodType = promo.application_method?.type || "percentage"
      const hasMinOrder = Number(promo.metadata?.min_order_value || 0) > 0
      const hasMaxDiscount = Number(promo.metadata?.max_discount || 0) > 0
      const hasLimit = getUsageLimit(promo) > 0
      const hasExpiry = Boolean(getEndsAt(promo))
      const passesCondition =
        conditionFilter === "all" ||
        (conditionFilter === "no_conditions" && !hasMinOrder && !hasMaxDiscount && !hasLimit && !hasExpiry) ||
        (conditionFilter === "min_order" && hasMinOrder) ||
        (conditionFilter === "usage_limit" && hasLimit) ||
        (conditionFilter === "expiry" && hasExpiry)

      return (
        filterBySearch(promo, query, ["code", (item) => item.application_method?.type]) &&
        (typeFilter === "all" || methodType === typeFilter) &&
        passesCondition
      )
    })
  }, [promotions, query, typeFilter, conditionFilter])

  return (
    <div>
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" /> Voucher / Mã giảm giá
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">
              Quản lý các chương trình khuyến mãi và voucher của cửa hàng
            </p>
          </div>
          <button
            onClick={openNew}
            className="admin-button-primary px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm Voucher
          </button>
        </div>
      </AdminHeaderPortal>

      <div className="bg-white rounded-2xl shadow-sm border border-[#eadfcd] overflow-hidden">
        <div className="p-4 border-b border-[#eadfcd]">
          <AdminListFilters
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm theo mã giảm giá..."
            showing={filteredPromotions.length}
            total={promotions.length}
            onReset={() => {
              setQuery("")
              setTypeFilter("all")
              setConditionFilter("all")
            }}
            filters={[
              {
                label: "Kiểu giảm",
                value: typeFilter,
                onChange: setTypeFilter,
                options: [
                  { value: "all", label: "Tất cả kiểu giảm" },
                  { value: "percentage", label: "Phần trăm" },
                  { value: "fixed", label: "Số tiền" },
                ],
              },
              {
                label: "Điều kiện",
                value: conditionFilter,
                onChange: setConditionFilter,
                options: [
                  { value: "all", label: "Tất cả điều kiện" },
                  { value: "no_conditions", label: "Không điều kiện" },
                  { value: "min_order", label: "Có đơn tối thiểu" },
                  { value: "usage_limit", label: "Có giới hạn lượt" },
                  { value: "expiry", label: "Có hạn dùng" },
                ],
              },
            ]}
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fffaf3] text-[#766957] font-bold border-b border-[#eadfcd]">
            <tr>
              <th className="px-4 py-3">Mã giảm giá</th>
              <th className="px-4 py-3">Kiểu giảm</th>
              <th className="px-4 py-3">Giá trị</th>
              <th className="px-4 py-3">Điều kiện & Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eadfcd]">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Đang tải...</td>
              </tr>
            ) : filteredPromotions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Chưa có mã giảm giá nào</td>
              </tr>
            ) : (
              filteredPromotions.map((promo) => {
                const method = promo.application_method
                const usageLimit = getUsageLimit(promo)
                const usageCount = getUsageCount(promo)
                const startsAt = getStartsAt(promo)
                const endsAt = getEndsAt(promo)
                const isExpired = endsAt && new Date(endsAt) < new Date()
                return (
                  <tr key={promo.id} className="hover:bg-[#fffcf8]">
                    <td className="px-4 py-3">
                      <span className="font-bold text-primary font-mono bg-[#eadfcd]/30 px-2 py-1 rounded">
                        {promo.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary capitalize">
                      {method?.type === "fixed" ? "Số tiền (VNĐ)" : "Phần trăm (%)"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#c7643a]">
                      {method?.type === "fixed"
                        ? `${Number(method?.value || 0).toLocaleString('vi-VN')} ₫`
                        : `${method?.value || 0} %`}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 space-y-1">
                      {promo.metadata?.min_order_value > 0 && (
                        <div>Đơn tối thiểu: <span className="font-semibold text-gray-900">{Number(promo.metadata.min_order_value).toLocaleString('vi-VN')} ₫</span></div>
                      )}
                      {promo.metadata?.max_discount > 0 && method?.type === "percentage" && (
                        <div>Giảm tối đa: <span className="font-semibold text-gray-900">{Number(promo.metadata.max_discount).toLocaleString('vi-VN')} ₫</span></div>
                      )}
                      {usageLimit > 0 && (
                        <div>Đã dùng: <span className="font-semibold text-gray-900">{usageCount} / {usageLimit}</span> lượt</div>
                      )}
                      {startsAt && (
                        <div>Bắt đầu: <span className="font-semibold text-gray-900">{new Date(startsAt).toLocaleString('vi-VN')}</span></div>
                      )}
                      {endsAt && (
                        <div>HSD: <span className={`font-semibold ${isExpired ? "text-red-600" : "text-gray-900"}`}>{new Date(endsAt).toLocaleString('vi-VN')}</span></div>
                      )}
                      {(!promo.metadata?.min_order_value && !promo.metadata?.max_discount && !usageLimit && !endsAt) && (
                        <span className="text-gray-400 italic">Không có điều kiện</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex justify-end gap-2">
                      <button onClick={() => openEdit(promo)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm Mã Giảm Giá Mới">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-primary">Mã Code (TET2025, FREESHIP...)</label>
            <input
              required
              value={form.code}
              onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
              className="admin-input w-full px-4 py-2 uppercase"
              placeholder="Nhập mã code"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">Kiểu giảm giá</label>
              <select
                value={form.discountType}
                disabled={!!editingId}
                onChange={e => setForm({...form, discountType: e.target.value})}
                className="admin-input w-full px-4 py-2 disabled:opacity-60 disabled:bg-gray-100"
              >
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">Giá trị</label>
              <input
                type="number"
                required
                min={1}
                disabled={!!editingId}
                value={form.value}
                onChange={e => setForm({...form, value: e.target.value === "" ? "" : Number(e.target.value)})}
                className="admin-input w-full px-4 py-2 disabled:opacity-60 disabled:bg-gray-100"
                placeholder={form.discountType === "percentage" ? "Ví dụ: 10" : "Ví dụ: 50000"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">Đơn hàng tối thiểu (VNĐ)</label>
              <input
                type="number"
                min={0}
                value={form.minOrderValue}
                onChange={e => setForm({...form, minOrderValue: e.target.value === "" ? "" : Number(e.target.value)})}
                className="admin-input w-full px-4 py-2"
                placeholder="Ví dụ: 200000"
              />
            </div>
            {form.discountType === "percentage" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-primary">Giảm tối đa (VNĐ)</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxDiscount}
                  onChange={e => setForm({...form, maxDiscount: e.target.value === "" ? "" : Number(e.target.value)})}
                  className="admin-input w-full px-4 py-2"
                  placeholder="Ví dụ: 50000"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 mt-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary">
              <input type="checkbox" checked={form.hasUsageLimit} onChange={e => setForm({...form, hasUsageLimit: e.target.checked})} className="rounded border-gray-300 text-primary focus:ring-primary" />
              Giới hạn số lần sử dụng
            </label>
            {form.hasUsageLimit && (
              <div className="pl-6">
                <input type="number" min={1} value={form.usageLimit} onChange={e => setForm({...form, usageLimit: e.target.value === "" ? "" : Number(e.target.value)})} className="admin-input w-full px-4 py-2" placeholder="Số lần sử dụng tối đa, ví dụ: 100" />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-primary mt-3">
              <input type="checkbox" checked={form.hasExpiry} onChange={e => setForm({...form, hasExpiry: e.target.checked})} className="rounded border-gray-300 text-primary focus:ring-primary" />
              Có thời hạn sử dụng
            </label>
            {form.hasExpiry && (
              <div className="pl-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                  <input type="datetime-local" value={form.startsAt} onChange={e => setForm({...form, startsAt: e.target.value})} className="admin-input w-full px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                  <input type="datetime-local" value={form.endsAt} onChange={e => setForm({...form, endsAt: e.target.value})} className="admin-input w-full px-4 py-2 text-sm" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#eadfcd]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="admin-button-secondary px-4 py-2 text-sm">Hủy</button>
            <button type="submit" className="admin-button-primary px-4 py-2 text-sm">{editingId ? "Lưu thay đổi" : "Tạo mã"}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
