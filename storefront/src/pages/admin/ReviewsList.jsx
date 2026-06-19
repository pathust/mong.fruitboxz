import { useEffect, useMemo, useState } from "react";
import { Star, EyeOff, Check, Trash2 } from "lucide-react";
import { AdminHeaderPortal } from "../../components/admin/AdminHeaderPortal";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { AdminListFilters } from "../../components/admin/AdminListFilters";
import { AdminLoading } from "../../components/admin/AdminStates"


function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

export default function ReviewsList() {
  const { api } = useAdminAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("all");

  useEffect(() => {
    api("/admin/reviews").
    then((d) => setReviews(d.reviews || [])).
    catch(() => setReviews([])).
    finally(() => setLoading(false));
  }, [api]);

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const passStatus = status === "all" || (status === "approved" ? r.approved : !r.approved);
      const passRating = rating === "all" || Number(r.rating) === Number(rating);
      const q = query.trim().toLowerCase();
      const passQuery = !q || (r.comment || "").toLowerCase().includes(q);
      return passStatus && passRating && passQuery;
    });
  }, [reviews, status, rating, query]);

  const toggleApproved = async (review) => {
    const next = !review.approved;
    await api(`/admin/reviews/${review.id}`, {
      method: "POST",
      body: { approved: next }
    });
    setReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, approved: next } : r));
  };

  const deleteReview = async (id) => {
    if (!confirm("Delete this review?")) return;
    await api(`/admin/reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };



  return (
    <div>
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
          <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Bán hàng</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" /> Đánh giá
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý nhận xét và đánh giá của khách hàng.</p>
          </div>
        </div>
      </AdminHeaderPortal>

      <div className="bg-white rounded-2xl shadow-sm border border-[#eadfcd] overflow-hidden">
        <div className="p-4 border-b border-[#eadfcd] bg-[#fffaf4]/30">
          <AdminListFilters
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm đánh giá..."
            showing={filtered.length}
            total={reviews.length}
            onReset={() => {
              setQuery("");
              setStatus("all");
              setRating("all");
            }}
            filters={[
            {
              label: "Trạng thái",
              value: status,
              onChange: setStatus,
              options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "approved", label: "Approved" },
              { value: "hidden", label: "Hidden" }]
            },
            {
              label: "Rating",
              value: rating,
              onChange: setRating,
              options: [
              { value: "all", label: "Tất cả rating" },
              { value: "5", label: "5 sao" },
              { value: "4", label: "4 sao" },
              { value: "3", label: "3 sao" },
              { value: "2", label: "2 sao" },
              { value: "1", label: "1 sao" }]
            }]
            } />
        </div>
        {loading ? <AdminLoading /> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
              <tr>
                <th className="text-left px-5 py-4">Rating</th>
                <th className="text-left px-5 py-4">Comment</th>
                <th className="text-left px-5 py-4">Date</th>
                <th className="text-left px-5 py-4">Status</th>
                <th className="text-right px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadfcd]/50">
              {filtered.map((r) =>
                <tr key={r.id} className="hover:bg-[#fffaf4]/50 transition-colors align-top">
                  <td className="px-5 py-4">{"⭐".repeat(Number(r.rating) || 0)}</td>
                  <td className="px-5 py-4 text-secondary-light max-w-[420px]">{r.comment || "—"}</td>
                  <td className="px-5 py-4 text-secondary-light">{formatDate(r.created_at)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${r.approved ? "bg-[#e8f6e9] text-[#2f7a37] border-green-200" : "bg-[#f1eadf] text-[#766957] border-[#eadfcd]"}`}>
                      {r.approved ? "Approved" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggleApproved(r)} className={`p-1.5 rounded-lg transition-colors ${r.approved ? "text-orange-500 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`} title={r.approved ? "Ẩn" : "Duyệt"}>
                        {r.approved ? <EyeOff className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteReview(r.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                )}
              {filtered.length === 0 &&
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-secondary-light">Không tìm thấy đánh giá</td>
                </tr>
                }
            </tbody>
          </table>
        </div>
        }
      </div>
    </>}</div>);

}
