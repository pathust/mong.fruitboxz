import { useEffect, useMemo, useState } from "react";
import { AdminHeaderPortal } from "../../../components/admin/AdminHeaderPortal";
import { Link } from "react-router-dom";
import { Pencil, Trash2 , Plus} from "lucide-react";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { FileText } from "lucide-react";
import { AdminError, AdminLoading } from "../../../components/admin/AdminStates";
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export default function BlogPostsList() {
  const { api } = useAdminAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const load = (showLoading = false) => {
    if (showLoading) setLoading(true);
    api("/admin/blog-posts").
    then((data) => setPosts(data.blog_posts || [])).
    catch((err) => setError(err?.message || "Không tải được blog.")).
    finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    api("/admin/blog-posts").
    then((data) => {
      if (mounted) setPosts(data.blog_posts || []);
    }).
    catch((err) => {
      if (mounted) setError(err?.message || "Không tải được blog.");
    }).
    finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {mounted = false;};
  }, [api]);

  const deletePost = async (post) => {
    if (!confirm(`Xóa bài viết "${post.title}"?`)) return;
    await api(`/admin/blog-posts/${post.id}`, { method: "DELETE" });
    setPosts((current) => current.filter((item) => item.id !== post.id));
  };

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(posts.map((post) => typeof post.category === 'object' && post.category !== null ? post.category.name : post.category).filter(Boolean))];
    return [
    { value: "all", label: "Tất cả danh mục" },
    ...categories.map((item) => ({ value: item, label: item }))];

  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      return (
        filterBySearch(post, query, ["title", "slug", "excerpt", "author", (p) => typeof p.category === 'object' && p.category !== null ? p.category.name : p.category]) && (
        status === "all" || (status === "published" ? post.published : !post.published)) && (
        category === "all" || (typeof post.category === 'object' && post.category !== null ? post.category.name : post.category) === category));

    });
  }, [posts, query, status, category]);


  if (error) return <AdminError message={error} onRetry={() => load(true)} />;

  return (
    <div className="space-y-6">
      <AdminHeaderPortal>
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between w-full pr-4">
        <div>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Nội dung & Media</p>
            <h1 className="text-lg font-extrabold text-[#4d4339] flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Bài viết Blog
            </h1>
            <p className="text-xs font-semibold text-[#8d7f6f] hidden md:block">Quản lý các bài viết trên trang tin tức, blog.</p>
          </div>
        
      </div>
      </AdminHeaderPortal>

      <div className="bg-white rounded-2xl border border-[#eadfcd] shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#eadfcd]">
          <AdminListFilters disableSticky={true}
            actions={
            <>
                <Link to="/admin/blog/new" className="admin-button-primary px-5 py-2.5 text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Thêm bài viết</Link>
              </>
            }
            search={query}
            onSearchChange={setQuery}
            searchPlaceholder="Tìm bài viết..."
            showing={filteredPosts.length}
            total={posts.length}
            onReset={() => {
              setQuery("");
              setStatus("all");
              setCategory("all");
            }}
            filters={[
            {
              label: "Trạng thái",
              value: status,
              onChange: setStatus,
              options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" }]

            },
            { label: "Danh mục", value: category, onChange: setCategory, options: categoryOptions }]
            } />
        </div>
        {loading ? <AdminLoading /> : 
        

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#fffaf4] text-[#8d7f6f] text-xs uppercase tracking-wider font-bold border-b border-[#eadfcd]">
            <tr>
              <th className="px-5 py-4">Bài viết</th>
              <th className="px-5 py-4">Danh mục</th>
              <th className="px-5 py-4">Ngày</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eadfcd]/50">
            {filteredPosts.map((post) =>
              <tr key={post.id} className="hover:bg-[#fffaf4]/50 transition-colors align-top">
                <td className="px-5 py-4">
                  <p className="font-bold text-secondary text-[15px]">{post.title}</p>
                </td>
                <td className="px-5 py-4 text-[#5d5246]">{typeof post.category === 'object' && post.category !== null ? post.category.name : post.category || "-"}</td>
                <td className="px-5 py-4 text-[#5d5246]">{formatDate(post.published_at || post.created_at)}</td>
                <td className="px-5 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${post.published ? "bg-[#e8f6e9] text-[#2f7a37] border-green-200" : "bg-[#f1eadf] text-[#766957] border-[#eadfcd]"}`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/blog/${post.id}`} className="rounded-xl border border-transparent p-2 text-primary transition-colors hover:border-[#eadfcd] hover:bg-[#fffaf4]" title="Sửa">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => deletePost(post)} className="rounded-xl border border-transparent p-2 text-red-500 transition-colors hover:border-red-100 hover:bg-red-50" title="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
              )}
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-[#8d7f6f]">Chưa có bài viết nào phù hợp.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      }
    </div>
    </div>);

}