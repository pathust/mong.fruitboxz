import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Pencil, Trash2 } from "lucide-react"
import { useAdminAuth } from "../../../context/AdminAuthContext"
import { AdminError, AdminLoading } from "../../../components/admin/AdminStates"
import { AdminListFilters, filterBySearch } from "../../../components/admin/AdminListFilters"

function formatDate(value) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

export default function BlogPostsList() {
  const { api } = useAdminAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all")

  const load = (showLoading = false) => {
    if (showLoading) setLoading(true)
    api("/admin/blog-posts")
      .then((data) => setPosts(data.blog_posts || []))
      .catch((err) => setError(err?.message || "Không tải được blog."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    api("/admin/blog-posts")
      .then((data) => {
        if (mounted) setPosts(data.blog_posts || [])
      })
      .catch((err) => {
        if (mounted) setError(err?.message || "Không tải được blog.")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [api])

  const deletePost = async (post) => {
    if (!confirm(`Xóa bài viết "${post.title}"?`)) return
    await api(`/admin/blog-posts/${post.id}`, { method: "DELETE" })
    setPosts((current) => current.filter((item) => item.id !== post.id))
  }

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(posts.map((post) => typeof post.category === 'object' && post.category !== null ? post.category.name : post.category).filter(Boolean))]
    return [
      { value: "all", label: "Tất cả danh mục" },
      ...categories.map((item) => ({ value: item, label: item })),
    ]
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      return (
        filterBySearch(post, query, ["title", "slug", "excerpt", "author", (p) => typeof p.category === 'object' && p.category !== null ? p.category.name : p.category]) &&
        (status === "all" || (status === "published" ? post.published : !post.published)) &&
        (category === "all" || (typeof post.category === 'object' && post.category !== null ? post.category.name : post.category) === category)
      )
    })
  }, [posts, query, status, category])

  if (loading) return <AdminLoading title="Đang tải blog..." description="Đang đọc danh sách bài viết từ backend." />
  if (error) return <AdminError message={error} onRetry={() => load(true)} />

  return (
    <div className="space-y-6">
      <div className="admin-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="product-meta text-[12px] uppercase tracking-[0.14em] text-[#a08d79]">CMS</p>
          <h1 className="page-title mt-2 text-[30px]">Blog</h1>
          <p className="product-meta mt-2 text-[14px]">Quản lý bài viết đang hiển thị ở trang Blog storefront.</p>
        </div>
        <Link to="/admin/blog/new" className="admin-button-primary px-4 py-2 text-sm">Thêm bài viết</Link>
      </div>

      <AdminListFilters
        search={query}
        onSearchChange={setQuery}
        searchPlaceholder="Tìm theo tiêu đề, slug, tác giả..."
        showing={filteredPosts.length}
        total={posts.length}
        onReset={() => {
          setQuery("")
          setStatus("all")
          setCategory("all")
        }}
        filters={[
          {
            label: "Trạng thái",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "Tất cả trạng thái" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ],
          },
          { label: "Danh mục", value: category, onChange: setCategory, options: categoryOptions },
        ]}
      />

      <div className="admin-table overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-bold">Bài viết</th>
              <th className="px-4 py-3 text-left font-bold">Danh mục</th>
              <th className="px-4 py-3 text-left font-bold">Ngày</th>
              <th className="px-4 py-3 text-left font-bold">Trạng thái</th>
              <th className="px-4 py-3 text-right font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((post) => (
              <tr key={post.id}>
                <td className="px-4 py-3">
                  <p className="font-bold text-[#3f352b]">{post.title}</p>
                  <p className="mt-1 text-xs text-[#8d7f6f]">/{post.slug}</p>
                </td>
                <td className="px-4 py-3 text-[#5d5246]">{typeof post.category === 'object' && post.category !== null ? post.category.name : (post.category || "-")}</td>
                <td className="px-4 py-3 text-[#5d5246]">{formatDate(post.published_at || post.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={`admin-status ${post.published ? "bg-[#e8f6e9] text-[#2f7a37]" : "bg-[#f1eadf] text-[#766957]"}`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/blog/${post.id}`} className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10" title="Sửa">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => deletePost(post)} className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50" title="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPosts.length === 0 && <div className="p-10 text-center text-[#8d7f6f]">Chưa có bài viết nào phù hợp.</div>}
      </div>
    </div>
  )
}
