import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { Tags } from "lucide-react";
import { Pencil, Trash2 } from "lucide-react";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters";
import { AdminLoading } from "../../../components/admin/AdminStates"

export default function CategoriesList() {
  const { api } = useAdminAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/admin/product-categories")
      .then((d) => setCategories(d.product_categories || []))
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => setLoading(false));
  }, [api]);

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    await api(`/admin/product-categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => filterBySearch(category, query, ["name", "description"]));
  }, [categories, query]);

  return (
    <div>
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Bán hàng</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Tags className="w-5 h-5 text-primary" /> Danh mục
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý các danh mục sản phẩm.</p>
          </div>
          
        </div>
      </AdminHeaderPortal>
      <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eadfcd] bg-[#fffaf4]/95 sticky top-0 z-30 backdrop-blur-md">
          <AdminListFilters disableSticky={true}
            actions={
            <>
                <Link to="/admin/categories/new" className="admin-button-primary px-4 py-2 text-sm">+ Thêm danh mục</Link>
              </>
            }
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm danh mục..."
            showing={filteredCategories.length}
            total={categories.length}
            onReset={() => setQuery("")} />
        </div>
        {loading ? <AdminLoading /> :
        
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eadfcd]/50">
            {filteredCategories.map((c) =>
              <tr key={c.id} className="hover:bg-[#fffaf4]/50 transition-colors align-top">
                <td className="px-5 py-4 font-bold text-secondary text-[15px]">{c.name}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/categories/${c.id}`} className="p-1.5 text-primary hover:bg-[#fffaf4] rounded-xl border border-transparent hover:border-[#eadfcd] transition-colors" title="Sửa">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteCategory(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors" title="Xóa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              )}
          </tbody>
        </table>
      </div>
      }
    </div>
  </div>);

}