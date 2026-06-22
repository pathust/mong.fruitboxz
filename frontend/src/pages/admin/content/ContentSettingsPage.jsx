import { useEffect, useMemo, useState } from "react";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { Link } from "react-router-dom";
import { Plus, Trash2, Save, Settings, X, Search, Check } from "lucide-react";
import AdminSelect from "../../../components/admin/AdminSelect";
import ImagePicker from "../../../components/admin/ImagePicker";
import RichTextEditor from "../../../components/admin/RichTextEditor";
import { AdminError, AdminLoading } from "../../../components/admin/AdminStates";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useToast } from "../../../components/ui/ToastProvider";

const configs = {
  about: {
    eyebrow: "Nội dung & Media",
    title: "Về chúng tôi",
    description: "Quản lý nội dung trang /about-us.",
    preview: "/about-us",
    fields: [
    { key: "about_title", label: "Tiêu đề", type: "text" },
    { key: "about_intro", label: "Mở đầu", type: "textarea", rows: 3 },
    { key: "about_image", label: "Ảnh giới thiệu", type: "image" },
    { key: "about_story_title", label: "Tiêu đề câu chuyện", type: "text" },
    { key: "about_story", label: "Nội dung câu chuyện", type: "richtext" },
    { key: "about_reasons_title", label: "Tiêu đề lý do chọn Mọng", type: "text" },
    { key: "about_reasons_json", label: "Danh sách lý do chọn Mọng", type: "reasons" }]

  },
  blog: {
    eyebrow: "Nội dung & Media",
    title: "Trang Blog",
    description: "Quản lý nội dung hiển thị ở phần giới thiệu đầu trang /blog.",
    preview: "/blog",
    fields: [
    { key: "blog_eyebrow", label: "Eyebrow (Chữ nhỏ trên cùng)", type: "text" },
    { key: "blog_title", label: "Tiêu đề chính", type: "text" },
    { key: "blog_intro", label: "Mô tả ngắn", type: "textarea", rows: 3 }]

  },
  contact: {
    eyebrow: "Nội dung & Media",
    title: "Liên hệ",
    description: "Quản lý thông tin hiển thị ở trang /contact và footer.",
    preview: "/contact",
    fields: [
    { key: "contact_title", label: "Tiêu đề trang liên hệ", type: "text" },
    { key: "contact_intro", label: "Mô tả trang liên hệ", type: "textarea", rows: 3 },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Số điện thoại", type: "text" },
    { key: "address", label: "Địa chỉ", type: "textarea", rows: 3 },
    { key: "opening_hours", label: "Giờ mở cửa", type: "text" },
    { key: "facebook", label: "Facebook URL", type: "text" },
    { key: "instagram", label: "Instagram URL", type: "text" },
    { key: "tiktok", label: "TikTok URL", type: "text" }]

  },
  customBox: {
    eyebrow: "Bán hàng",
    title: "Hộp tự chọn",
    description: "Quản lý loại hộp, giá nền, số món tối đa và danh sách sản phẩm được chọn.",
    preview: "/custom-box/hop-qua-trai-cay-tu-chon",
    fields: [
    { key: "custom_box_types_json", label: "Các cấu hình Loại hộp", type: "boxTypes" },
    { key: "custom_box_product_slugs", label: "Sản phẩm được phép cho vào hộp", type: "productSelector" }]

  },
  paymentPolicy: {
    eyebrow: "Nội dung & Media",
    title: "Chính sách thanh toán",
    description: "Quản lý nội dung hiển thị ở trang /payment-policy.",
    preview: "/payment-policy",
    fields: [
    { key: "payment_policy_html", label: "Nội dung chính sách", type: "richtext" }]

  },
  privacyPolicy: {
    eyebrow: "Nội dung & Media",
    title: "Chính sách bảo mật",
    description: "Quản lý nội dung hiển thị ở trang /privacy-policy.",
    preview: "/privacy-policy",
    fields: [
    { key: "privacy_policy_html", label: "Nội dung chính sách", type: "richtext" }]

  },
  shippingPolicy: {
    eyebrow: "Nội dung & Media",
    title: "Chính sách vận chuyển",
    description: "Quản lý nội dung hiển thị ở trang /shipping-policy.",
    preview: "/shipping-policy",
    fields: [
    { key: "shipping_policy_html", label: "Nội dung chính sách", type: "richtext" }]

  }
};

const defaultValues = {
  about_reasons_json: "[]",
  custom_box_types_json: "[]",
  custom_box_product_slugs: ""
};

const iconOptions = [
{ value: "quality", label: "Chất lượng" },
{ value: "gift", label: "Quà tặng" },
{ value: "delivery", label: "Giao hàng" }];


function parseList(value) {
  try {
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function updateListField(form, key, nextItems) {
  return { ...form, [key]: JSON.stringify(nextItems) };
}

function ReasonListEditor({ value, onChange }) {
  const items = parseList(value);
  const updateItem = (index, patch) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };
  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index));
  const addItem = () => onChange([...items, { icon: "quality", title: "", description: "" }]);

  return (
    <div className="space-y-4">
      {items.map((item, index) =>
      <div key={index} className="group relative rounded-2xl border border-[#eadfcd]/50 bg-gradient-to-br from-white to-[#fffaf4] p-5 shadow-sm transition-all hover:shadow-md hover:border-[#eadfcd]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#eadfcd]/30 pb-3">
             <p className="text-base font-bold text-[#4d4339] flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eadfcd]/40 text-xs text-[#8d7f6f]">{index + 1}</span>
              Lý do #{index + 1}
            </p>
            <button type="button" onClick={() => removeItem(index)} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100" aria-label="Xóa lý do">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-[160px_1fr]">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Biểu tượng</label>
              <AdminSelect
                value={item.icon || "quality"}
                onChange={(val) => updateItem(index, { icon: val })}
                options={iconOptions}
                className="w-full bg-white/60 focus:bg-white shadow-inner transition-shadow focus:shadow-md"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Tiêu đề</label>
              <input value={item.title || ""} onChange={(e) => updateItem(index, { title: e.target.value })} placeholder="VD: Trái cây tươi mới mỗi ngày" className="admin-input w-full px-4 py-2.5 bg-white/60 focus:bg-white shadow-inner transition-shadow focus:shadow-md" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Mô tả chi tiết</label>
            <textarea value={item.description || ""} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="Mô tả ngắn gọn lý do này..." rows={2} className="admin-input w-full px-4 py-2.5 bg-white/60 focus:bg-white shadow-inner transition-shadow focus:shadow-md" />
          </div>
        </div>
      )}
      <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#eadfcd] bg-white/50 p-4 text-sm font-semibold text-[#8d7f6f] transition-all hover:bg-[#eadfcd]/20 hover:text-[#4d4339]">
        <Plus className="h-4 w-4" />
        Thêm lý do
      </button>
    </div>);

}

function BoxTypesEditor({ value, onChange }) {
  const items = parseList(value);
  const updateItem = (index, patch) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };
  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index));
  const addItem = () => onChange([...items, { slug: "", name: "", description: "", base_price: 0, max_items: 4 }]);

  return (
    <div className="space-y-4">
      {items.map((item, index) =>
      <div key={index} className="group relative rounded-2xl border border-[#eadfcd]/50 bg-gradient-to-br from-white to-[#fffaf4] p-5 shadow-sm transition-all hover:shadow-md hover:border-[#eadfcd]">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#eadfcd]/30 pb-3">
            <p className="text-base font-bold text-[#4d4339] flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eadfcd]/40 text-xs text-[#8d7f6f]">{index + 1}</span>
              {item.name || `Loại hộp mới`}
            </p>
            <button type="button" onClick={() => removeItem(index)} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100" aria-label="Xóa loại hộp">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Tên hộp</label>
              <input value={item.name || ""} onChange={(e) => updateItem(index, { name: e.target.value })} placeholder="VD: Hộp Trái Cây 500k" className="admin-input w-full px-4 py-2.5 bg-white/60 focus:bg-white shadow-inner transition-shadow focus:shadow-md" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Giá nền (VNĐ)</label>
              <input type="number" min="0" value={item.base_price ?? 0} onChange={(e) => updateItem(index, { base_price: Number(e.target.value) })} className="admin-input w-full px-4 py-2.5 bg-white/60 focus:bg-white shadow-inner transition-shadow focus:shadow-md" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500">Món tối đa</label>
              <input type="number" min="1" value={item.max_items ?? 4} onChange={(e) => updateItem(index, { max_items: Number(e.target.value) })} className="admin-input w-full px-4 py-2.5 bg-white/60 focus:bg-white shadow-inner transition-shadow focus:shadow-md" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">Mô tả ngắn</label>
            <textarea value={item.description || ""} onChange={(e) => updateItem(index, { description: e.target.value })} placeholder="Mô tả cho loại hộp này..." rows={2} className="admin-input w-full px-4 py-2.5 bg-white/60 focus:bg-white shadow-inner transition-shadow focus:shadow-md" />
          </div>
        </div>
      )}
      <button type="button" onClick={addItem} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#eadfcd] bg-white/50 p-4 text-sm font-semibold text-[#8d7f6f] transition-all hover:bg-[#eadfcd]/20 hover:text-[#4d4339]">
        <Plus className="h-4 w-4" />
        Thêm loại hộp
      </button>
    </div>);
}

function ProductSelector({ value, onChange, api }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const selectedSlugs = (value || "").split(",").filter(Boolean).map(s => s.trim());

  useEffect(() => {
    let mounted = true;
    if (isOpen && products.length === 0) {
      setLoading(true);
      api("/admin/products?limit=100")
        .then(res => {
          if (mounted) setProducts(res.products || []);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    }
    return () => { mounted = false; };
  }, [isOpen, api, products.length]);

  const toggleSlug = (slug) => {
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter(s => s !== slug).join(","));
    } else {
      onChange([...selectedSlugs, slug].join(","));
    }
  };

  const removeSlug = (slug) => {
    onChange(selectedSlugs.filter(s => s !== slug).join(","));
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.handle.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-3 relative">
      <div className="flex flex-wrap gap-2 mb-2 min-h-[48px] items-center p-2 bg-[#fffaf4] rounded-2xl border border-[#eadfcd] shadow-inner transition-colors">
        {selectedSlugs.length === 0 && <span className="text-sm text-gray-400 p-1 px-2 italic">Chưa chọn sản phẩm nào... Bấm tìm kiếm bên dưới để thêm!</span>}
        {selectedSlugs.map(slug => {
          const product = products.find(p => p.handle === slug);
          const title = product ? product.title : slug;
          return (
            <div key={slug} className="flex items-center gap-1.5 bg-[#eadfcd]/40 text-[#4d4339] px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:bg-[#eadfcd]/60 border border-[#eadfcd]/50 shadow-sm animate-in zoom-in-95 duration-200">
              {product?.thumbnail && <img src={product.thumbnail} alt="" className="w-5 h-5 rounded object-cover shadow-sm" />}
              {title}
              <button type="button" onClick={() => removeSlug(slug)} className="text-gray-500 hover:text-red-500 transition-colors rounded-full bg-white/60 p-0.5 hover:bg-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="relative">
        <div className="flex items-center border border-[#eadfcd] rounded-xl bg-white px-3 focus-within:ring-2 focus-within:ring-[#8d7f6f]/20 transition-all shadow-sm hover:shadow-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Tìm kiếm danh mục sản phẩm (VD: Táo, Nho, Cam...)"
            className="w-full px-3 py-3 outline-none bg-transparent text-sm"
          />
          {isOpen && (
            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full transition-colors hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white/95 rounded-2xl border border-[#eadfcd] shadow-2xl max-h-[300px] overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 p-1.5 custom-scrollbar">
            {loading ? (
              <div className="p-6 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-5 h-5 border-2 border-[#8d7f6f]/20 border-t-[#8d7f6f] rounded-full animate-spin"></div>
                Đang tải dữ liệu...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 italic">Không tìm thấy sản phẩm phù hợp.</div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredProducts.map(p => {
                  const isSelected = selectedSlugs.includes(p.handle);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleSlug(p.handle)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left group ${isSelected ? "bg-[#eadfcd]/40 text-[#4d4339] font-bold shadow-sm" : "hover:bg-[#fffaf4] text-gray-600"}`}
                    >
                      <div className="flex items-center gap-3">
                        {p.thumbnail ? (
                          <img src={p.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 shadow-sm"><Search className="w-4 h-4" /></div>
                        )}
                        <span className="truncate max-w-[200px] md:max-w-md">{p.title}</span>
                      </div>
                      {isSelected ? (
                        <span className="bg-green-500 text-white rounded-full p-0.5"><Check className="w-3 h-3" /></span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-gray-300 group-hover:border-[#8d7f6f] transition-colors" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentSettingsPage({ type }) {
  const { api } = useAdminAuth();
  const { pushToast } = useToast();
  const config = configs[type];
  const [form, setForm] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageField, setImageField] = useState(null);

  const keys = useMemo(() => config.fields.map((field) => field.key), [config.fields]);

  useEffect(() => {
    let mounted = true;
    api("/admin/settings").
    then((data) => {
      if (!mounted) return;
      const settings = data.settings || {};
      const next = { ...defaultValues };
      keys.forEach((key) => {
        next[key] = settings[key] ?? defaultValues[key] ?? "";
        if (key === "custom_box_product_slugs") {
          next[key] = settings.custom_box_product_slugs || settings.custom_box_product_handles || defaultValues[key] || "";
        }
      });
      setForm(next);
    }).
    catch((err) => {
      if (mounted) setError(err?.message || "Không tải được settings.");
    }).
    finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {mounted = false;};
  }, [api, keys]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/admin/settings", { method: "POST", body: form });
      pushToast("Đã lưu nội dung.", "success");
    } catch (err) {
      pushToast(err?.message || "Không lưu được nội dung.", "error");
    } finally {
      setSaving(false);
    }
  };


  if (error) return <AdminError message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="max-w-5xl space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
          <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">{config.eyebrow}</p>
          <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> {config.title}
          </h1>
          <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">{config.description}</p>
        </div>
        
      </div>
      </AdminHeaderPortal>{loading ? <AdminLoading /> : <>

      <form onSubmit={handleSubmit} className="admin-card space-y-6 p-8 relative overflow-hidden bg-gradient-to-b from-white to-[#fffaf4]/30 border-[#eadfcd]/50 shadow-sm">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="space-y-6 relative z-10">
        {config.fields.map((field) =>
          <div key={field.key} className="space-y-2">
            <label className="block text-sm font-bold text-[#4d4339]">{field.label}</label>
            {field.type === "textarea" ?
            <textarea
              value={form[field.key] || ""}
              onChange={(e) => setField(field.key, e.target.value)}
              rows={field.rows || 4}
              className="admin-input w-full px-4 py-3 bg-white/60 focus:bg-white shadow-inner transition-all focus:shadow-md border-[#eadfcd]/60 focus:border-[#8d7f6f]" /> :

            field.type === "richtext" ?
            <div className="rounded-2xl overflow-hidden border border-[#eadfcd]/60 shadow-sm focus-within:ring-2 focus-within:ring-[#8d7f6f]/20 focus-within:border-[#8d7f6f] transition-all bg-white">
              <RichTextEditor
                value={form[field.key] || ""}
                onChange={(val) => setField(field.key, val)}
                minHeight={300} />
            </div> :

            field.type === "reasons" ?
            <ReasonListEditor value={form[field.key]} onChange={(items) => setForm((current) => updateListField(current, field.key, items))} /> :
            field.type === "boxTypes" ?
            <BoxTypesEditor value={form[field.key]} onChange={(items) => setForm((current) => updateListField(current, field.key, items))} /> :
            field.type === "productSelector" ?
            <ProductSelector value={form[field.key]} onChange={(val) => setField(field.key, val)} api={api} /> :
            field.type === "image" ?
            <div className="flex flex-wrap items-center gap-4 bg-white/40 p-3 rounded-2xl border border-[#eadfcd]/50 shadow-inner">
                {form[field.key] ? (
                  <div className="relative group">
                    <img src={form[field.key]} alt="" className="h-24 w-36 rounded-xl border border-[#eadfcd] object-cover shadow-sm transition-transform group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="h-24 w-36 rounded-xl border-2 border-dashed border-[#eadfcd] bg-white flex items-center justify-center text-gray-400 text-xs shadow-sm">Chưa có ảnh</div>
                )}
                <input value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)} className="admin-input min-w-[260px] flex-1 px-4 py-3 bg-white focus:bg-white shadow-sm transition-all focus:shadow-md border-[#eadfcd]/60" placeholder="URL ảnh..." />
                <button type="button" onClick={() => setImageField(field.key)} className="admin-button-secondary px-5 py-3 text-sm font-medium shadow-sm hover:shadow transition-shadow">Chọn ảnh</button>
              </div> :

            <input value={form[field.key] || ""} onChange={(e) => setField(field.key, e.target.value)} className="admin-input w-full px-4 py-3 bg-white/60 focus:bg-white shadow-inner transition-all focus:shadow-md border-[#eadfcd]/60 focus:border-[#8d7f6f]" />
            }
          </div>
          )}
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="admin-button-primary px-8 py-3 text-sm font-semibold tracking-wide disabled:opacity-50 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
            <div className="flex items-center gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu nội dung
                </>
              )}
            </div>
          </button>
        </div>
      
        <div className="pt-6 mt-6 border-t border-[#eadfcd] flex justify-end gap-3">
          <Link to={config.preview} target="_blank" className="admin-button-secondary px-4 py-2 text-sm">Xem frontend</Link>
        </div>
      </form>

      {imageField &&
        <ImagePicker
          selected={form[imageField]}
          onClose={() => setImageField(null)}
          onSelect={(value) => {
            setField(imageField, value);
            setImageField(null);
          }} />

        }
    </>}</div>);

}
