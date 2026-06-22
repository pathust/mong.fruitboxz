import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus } from "lucide-react";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useToast } from "../../../components/ui/ToastProvider";
import { AdminLoading, AdminEmpty, AdminError } from "../../../components/admin/AdminStates";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";

export default function BlogCategoriesList() {
  const { api } = useAdminAuth();
  const { pushToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchCategories = () => {
    setLoading(true);
    api("/admin/blog-categories").
    then((data) => setCategories(data.blog_categories || [])).
    catch((err) => setError(err.message)).
    finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, [api]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục blog "${name}"? Các bài viết thuộc danh mục này sẽ bị trống danh mục.`)) return;

    setDeleting(id);
    try {
      await api(`/admin/blog-categories/${id}`, { method: "DELETE" });
      pushToast("Đã xóa danh mục", "success");
      fetchCategories();
    } catch (err) {
      pushToast(err?.message || "Không thể xóa danh mục", "error");
      setDeleting(null);
    }
  };


  if (error) return <AdminError message={error} onRetry={fetchCategories} />;

  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Nội dung & Media</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" /> Danh mục Blog
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Phân loại và quản lý danh mục bài viết.</p>
          </div>
          
        </div>
      </AdminHeaderPortal>
      <div className="mb-6 flex justify-end">
        <Link to="/admin/blog-categories/new" className="admin-button-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Thêm danh mục
          </Link>
      </div>{loading ? <AdminLoading /> : <>

      {categories.length === 0 ?
        <AdminEmpty
          title="Chưa có danh mục blog nào"
          message="Tạo danh mục để phân loại các bài viết trên blog của bạn.">
          
          <Link to="/admin/blog-categories/new" className="admin-button-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Thêm danh mục
          </Link>
        </AdminEmpty> :

        <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
                <tr>
                  <th className="px-5 py-4">Tên danh mục</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eadfcd]/50">
                {categories.map((cat) =>
                <tr key={cat.id} className="hover:bg-[#fffaf4]/50 transition-colors align-top">
                    <td className="px-5 py-4 font-bold text-secondary text-[15px]">{cat.name}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link to={`/admin/blog-categories/${cat.id}/edit`} className="text-primary hover:text-primary/80 font-medium">Sửa</Link>
                        <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={deleting === cat.id}
                        className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50">
                        
                          {deleting === cat.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        }
      </>}
    </div>);

}