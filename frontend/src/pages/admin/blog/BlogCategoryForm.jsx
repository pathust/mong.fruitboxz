import { useEffect, useState } from "react";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { useNavigate, useParams } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useToast } from "../../../components/ui/ToastProvider";
import { AdminLoading } from "../../../components/admin/AdminStates";

function slugify(value) {
  return value.
  normalize("NFD").
  replace(/[\u0300-\u036f]/g, "").
  toLowerCase().
  replace(/đ/g, "d").
  replace(/[^a-z0-9]+/g, "-").
  replace(/^-+|-+$/g, "");
}

const emptyCategory = {
  name: "",
  slug: "",
  description: ""
};

export default function BlogCategoryForm() {
  const { api } = useAdminAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyCategory);

  useEffect(() => {
    if (!isNew) {
      api(`/admin/blog-categories/${id}`).
      then((data) => setForm({ ...emptyCategory, ...(data.blog_category || {}) })).
      finally(() => setLoading(false));
    }
  }, [api, id, isNew]);

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && (!current.slug || current.slug === slugify(current.name))) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isNew ? "/admin/blog-categories" : `/admin/blog-categories/${id}`;
      await api(url, { method: "POST", body: form });
      pushToast("Đã lưu danh mục blog.", "success");
      navigate("/admin/blog-categories");
    } catch (err) {
      pushToast(err?.message || "Không lưu được danh mục.", "error");
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="max-w-2xl space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Nội dung & Media</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" /> {isNew ? "Thêm danh mục" : "Sửa danh mục"}
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Cập nhật tên và mô tả danh mục blog.</p>
          </div>
        </div>
      </AdminHeaderPortal>{loading ? <AdminLoading /> : <>

      <form onSubmit={handleSubmit} className="admin-card space-y-5 p-6">
        <div>
          <label className="mb-1 block text-sm font-bold text-secondary">Tên danh mục</label>
          <input required value={form.name} onChange={(e) => setField("name", e.target.value)} className="admin-input w-full px-4 py-2.5" />
        </div>
        
        <div>
          <label className="mb-1 block text-sm font-bold text-secondary">Slug</label>
          <input required value={form.slug} onChange={(e) => setField("slug", slugify(e.target.value))} className="admin-input w-full px-4 py-2.5" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-bold text-secondary">Mô tả (tùy chọn)</label>
          <textarea value={form.description || ""} onChange={(e) => setField("description", e.target.value)} rows={4} className="admin-input w-full px-4 py-2.5" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="admin-button-primary px-6 py-2.5 text-sm disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu danh mục"}</button>
          <button type="button" onClick={() => navigate("/admin/blog-categories")} className="admin-button-secondary px-6 py-2.5 text-sm">Hủy</button>
        </div>
      </form>
    </>}</div>);

}
