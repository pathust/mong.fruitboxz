import { useCallback, useState, useEffect } from "react";
import { Calculator, AlertCircle, Save } from "lucide-react";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { AdminLoading } from "../../../components/admin/AdminStates"


export default function CostSettings() {
  const { api } = useAdminAuth();
  const [form, setForm] = useState({
    default_cost_percent: 50,
    packaging_cost: 5000,
    labor_cost_per_order: 10000,
    shipping_base_fee: 18000,
    shipping_fee_per_km: 2200,
    shipping_min_fee: 18000,
    shipping_max_fee: 60000,
    shipping_base_cost: 30000,
    shipping_non_hanoi_fee: 45000,
    free_shipping_districts: "Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng, Cầu Giấy, Tây Hồ"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api("/admin/custom?mode=settings");
      if (res?.settings) {
        setForm((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const timer = window.setTimeout(fetchSettings, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/admin/custom?mode=settings", {
        method: "POST",
        body: {
          settings: {
            default_cost_percent: form.default_cost_percent,
            packaging_cost: form.packaging_cost,
            labor_cost_per_order: form.labor_cost_per_order,
            shipping_base_fee: form.shipping_base_fee,
            shipping_fee_per_km: form.shipping_fee_per_km,
            shipping_min_fee: form.shipping_min_fee,
            shipping_max_fee: form.shipping_max_fee,
            shipping_base_cost: form.shipping_base_cost,
            shipping_non_hanoi_fee: form.shipping_non_hanoi_fee,
            free_shipping_districts: form.free_shipping_districts
          }
        }
      });
      alert("Cost and Shipping settings saved successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="max-w-3xl">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Kho & Chi phí</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" /> Cài đặt Cost
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Cấu hình tỷ lệ chi phí tiêu chuẩn cho hệ thống.</p>
          </div>
          
        </div>
      </AdminHeaderPortal>{loading ? <AdminLoading /> : <>

      {error &&
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2 border border-red-100">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
        }

      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-[#eadfcd]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Tỷ lệ giá vốn mặc định (%)</label>
            <input type="number" min={0} max={100} value={form.default_cost_percent} onChange={(e) => setForm({ ...form, default_cost_percent: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
            <p className="mt-1 text-xs text-[#8a7a67]">Dùng để ước tính nhanh giá vốn nếu sản phẩm chưa có định mức nguyên liệu cụ thể.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Chi phí đóng gói / sản phẩm (₫)</label>
            <input type="number" min={0} value={form.packaging_cost} onChange={(e) => setForm({ ...form, packaging_cost: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Chi phí nhân công / đơn hàng (₫)</label>
            <input type="number" min={0} value={form.labor_cost_per_order} onChange={(e) => setForm({ ...form, labor_cost_per_order: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-secondary mt-8 mb-4 border-b border-[#eadfcd] pb-2">Cấu hình tính phí Vận chuyển (Geocoding)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phí cơ bản 3km đầu (₫)</label>
            <input type="number" min={0} value={form.shipping_base_fee} onChange={(e) => setForm({ ...form, shipping_base_fee: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phí mỗi km tiếp theo (₫)</label>
            <input type="number" min={0} value={form.shipping_fee_per_km} onChange={(e) => setForm({ ...form, shipping_fee_per_km: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phí tối thiểu / Min Fee (₫)</label>
            <input type="number" min={0} value={form.shipping_min_fee} onChange={(e) => setForm({ ...form, shipping_min_fee: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phí tối đa / Max Fee (₫)</label>
            <input type="number" min={0} value={form.shipping_max_fee} onChange={(e) => setForm({ ...form, shipping_max_fee: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phí dự phòng nội thành HN (₫)</label>
            <input type="number" min={0} value={form.shipping_base_cost} onChange={(e) => setForm({ ...form, shipping_base_cost: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
            <p className="mt-1 text-xs text-[#8a7a67]">Áp dụng khi không tính được khoảng cách tự động do lỗi địa chỉ.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phí ngoại tỉnh / Non-Hanoi (₫)</label>
            <input type="number" min={0} value={form.shipping_non_hanoi_fee} onChange={(e) => setForm({ ...form, shipping_non_hanoi_fee: Number(e.target.value) || 0 })} className="admin-input w-full px-4 py-2.5" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary mb-1">Các quận được Freeship nội thành (cách nhau bởi dấu phẩy)</label>
            <input type="text" value={form.free_shipping_districts} onChange={(e) => setForm({ ...form, free_shipping_districts: e.target.value })} className="admin-input w-full px-4 py-2.5" />
          </div>
        </div>

        <div className="pt-4 border-t border-[#eadfcd] flex justify-end">
          <button type="submit" disabled={saving} className="admin-button-primary px-6 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2">
            <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      
        <div className="pt-6 mt-6 border-t border-[#eadfcd] flex justify-end gap-3">
          <button onClick={handleSave} disabled={saving} className="admin-button-primary px-4 py-2 text-sm flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </div>
      </form>
    </>}</div>);

}