import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { Tags } from "lucide-react";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import ImagePicker from "../../../components/admin/ImagePicker";
import { AdminLoading } from "../../../components/admin/AdminStates"


function slugify(value) {
  return String(value || "").
  normalize("NFD").
  replace(/[\u0300-\u036f]/g, "").
  toLowerCase().
  replace(/đ/g, "d").
  replace(/[^a-z0-9]+/g, "-").
  replace(/^-+|-+$/g, "");
}

export default function CategoryForm() {
  const { api } = useAdminAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image: "" });
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api(`/admin/product-categories/${id}`).
      then((d) => {
        const c = d.product_category;
        setForm({
          name: c.name || "",
          slug: slugify(c.handle || c.name || ""),
          description: c.description || "",
          image: c.metadata?.image || ""
        });
      }).
      finally(() => setLoading(false));
    }
  }, [id, isNew, api]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name,
        handle: slugify(form.slug || form.name),
        description: form.description,
        is_active: true,
        metadata: { image: form.image }
      };

      if (isNew) {
        await api("/admin/product-categories", { method: "POST", body });
      } else {
        await api(`/admin/product-categories/${id}`, { method: "POST", body });
      }
      navigate("/admin/categories");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="max-w-2xl">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Bán hàng</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Tags className="w-5 h-5 text-primary" /> {isNew ? "Thêm mới" : "Chỉnh sửa"} danh mục
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Tạo mới hoặc cập nhật thông tin danh mục.</p>
          </div>
        </div>
      </AdminHeaderPortal>{loading ? <AdminLoading /> : <>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Tên danh mục</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Ảnh đại diện</label>
          <div className="flex items-center gap-4">
            {form.image &&
              <a href={form.image} target="_blank" rel="noopener noreferrer" className="block h-16 w-16">
                <img src={form.image} alt="Thumbnail" className="h-16 w-16 rounded-md object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
              </a>
              }
            <button
                type="button"
                onClick={() => setShowImagePicker(true)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 text-secondary">
                
              {form.image ? "Change Image" : "Choose Image"}
            </button>
            {form.image &&
              <button
                type="button"
                onClick={() => setForm({ ...form, image: "" })}
                className="text-red-500 text-sm hover:underline">
                
                Remove
              </button>
              }
          </div>
        </div>



        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Mô tả danh mục</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Giới thiệu ngắn về danh mục — sẽ hiển thị trên trang Danh mục của website..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          <p className="text-xs text-gray-400 mt-1">Mô tả này sẽ hiển thị công khai trên trang danh mục sản phẩm của website.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50">{saving ? "Đang lưu..." : isNew ? "Tạo danh mục" : "Lưu thay đổi"}</button>
          <button type="button" onClick={() => navigate("/admin/categories")} className="px-6 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50">Huỷ</button>
        </div>
      </form>

      {showImagePicker &&
        <ImagePicker
          onClose={() => setShowImagePicker(false)}
          onSelect={(val) => {
            setForm({ ...form, image: val });
            setShowImagePicker(false);
          }}
          selected={form.image} />

        }
    </>}</div>);

}
