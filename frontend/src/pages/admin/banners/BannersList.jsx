import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { Image, ImageIcon, Pencil, Trash2, X, Plus } from "lucide-react";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters";
import { AdminLoading } from "../../../components/admin/AdminStates"


export default function BannersList() {
  const { api } = useAdminAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("all");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    api("/admin/banners").
    then((d) => setBanners(d.banners || [])).
    catch(() => {}).
    finally(() => setLoading(false));
  }, [api]);

  const deleteBanner = async (id) => {
    if (!confirm("Delete this banner?")) return;
    await api(`/admin/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      return (
        filterBySearch(banner, query, ["title", "subtitle", "link"]) && (
        active === "all" || (active === "active" ? banner.active : !banner.active)));

    });
  }, [banners, query, active]);



  return (
    <div>
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Nội dung & Media</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" /> Banners
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý hình ảnh và nội dung banner hiển thị trên trang chủ.</p>
          </div>
          
        </div>
      </AdminHeaderPortal>
      <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eadfcd]">
          <AdminListFilters disableSticky={true}
            actions={
            <>
                <Link to="/admin/banners/new" className="admin-button-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Thêm Banner</Link>
              </>
            }
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm banner..."
            showing={filteredBanners.length}
            total={banners.length}
            onReset={() => {
              setQuery("");
              setActive("all");
            }}
            filters={[
            {
              label: "Active",
              value: active,
              onChange: setActive,
              options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" }]

            }]
            } />
        </div>
        {loading ? <AdminLoading /> :
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
              <tr>
                <th className="px-5 py-4">Ảnh</th>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Subtitle</th>
                <th className="px-5 py-4">Active</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]/50">
              {filteredBanners.map((b) =>
                <tr key={b.id} className="hover:bg-[#fffaf4]/50 transition-colors align-top">
                  <td className="px-5 py-4">
                  {b.image ?
                  <button
                    type="button"
                    onClick={() => setPreviewImage({ src: b.image, title: b.title })}
                    className="group block h-16 w-28 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 transition hover:border-primary hover:shadow-sm"
                    title="Xem ảnh banner">
                    
                      <img src={b.image} alt={b.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                    </button> :

                  <div className="flex h-16 w-28 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-300">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  }
                </td>
                  <td className="px-5 py-4 font-bold text-secondary text-[15px]">{b.title}</td>
                  <td className="px-5 py-4 text-secondary-light">{b.subtitle}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${b.active ? "bg-[#e8f6e9] text-[#2f7a37] border-green-200" : "bg-[#f1eadf] text-[#766957] border-[#eadfcd]"}`}>{b.active ? "Yes" : "No"}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/banners/${b.id}`} className="p-1.5 text-primary hover:bg-[#fffaf4] rounded-xl border border-transparent hover:border-[#eadfcd] transition-colors" title="Sửa">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteBanner(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                )}
              {filteredBanners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-[#8d7f6f]">Không tìm thấy banner nào.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        }
      </div>

      {previewImage &&
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="font-semibold text-secondary">{previewImage.title || "Ảnh banner"}</p>
              <button type="button" onClick={() => setPreviewImage(null)} className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-secondary" aria-label="Đóng xem ảnh">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto bg-gray-950 p-3">
              <img src={previewImage.src} alt={previewImage.title || "Ảnh banner"} className="mx-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain" />
            </div>
          </div>
        </div>
        }
    </div>);

}