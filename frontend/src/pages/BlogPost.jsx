import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LoaderCircle, Clock, User, ChevronLeft, Share2 } from 'lucide-react'
import { apiFetch } from '../lib/api'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

export default function BlogPost() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    apiFetch(`/store/blog/${encodeURIComponent(id)}`)
      .then((data) => {
        if (mounted) setPost(data?.blog_post || null)
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Bài viết không tồn tại.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary bg-[#fffaf4]"><LoaderCircle className="h-10 w-10 animate-spin" /></div>

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-[#fffaf4]">
        <h1 className="text-3xl font-extrabold text-secondary mb-4">Bài viết không tồn tại</h1>
        <p className="text-[#766957] mb-8">Rất tiếc, bài viết bạn tìm kiếm không có sẵn hoặc đã bị xóa.</p>
        <Link to="/blog" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-dark transition-colors">
          <ChevronLeft className="w-5 h-5" /> Về trang Blog
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-[#fffaf4] min-h-screen pb-24">
      {/* Article Header */}
      <div className="relative pt-12 pb-16 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          

          <div className="flex items-center gap-4 text-sm font-bold tracking-wider uppercase mb-6">
            {post.category && (
              <span className="text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                {post.category.name || post.category}
              </span>
            )}
            <span className="text-[#a08d79] flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {formatDate(post.published_at || post.created_at)}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-secondary mb-8 leading-[1.15] tracking-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between py-6 border-y border-[#eadfcd]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f0e5d5] to-[#eadfcd] flex items-center justify-center text-secondary">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-secondary">{post.author}</p>
                <p className="text-xs text-[#a08d79] font-medium">Tác giả</p>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full border border-[#eadfcd] bg-white flex items-center justify-center text-[#766957] hover:text-primary hover:border-primary/30 transition-colors" title="Chia sẻ bài viết">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4">
        {post.image && (
          <div className="w-full aspect-[2/1] md:aspect-[21/9] rounded-[2rem] overflow-hidden mb-12 shadow-2xl shadow-black/5">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {post.excerpt && (
          <p className="text-xl md:text-2xl text-[#766957] leading-relaxed font-medium mb-12 italic border-l-4 border-primary/30 pl-6">
            {post.excerpt}
          </p>
        )}

        <div
          className="prose prose-lg prose-stone max-w-none prose-headings:text-secondary prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-p:text-[#5d5246] prose-p:leading-[1.8] prose-a:text-primary hover:prose-a:text-primary-dark prose-img:rounded-[1.5rem] prose-img:shadow-lg prose-strong:text-secondary"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        <div className="mt-16 pt-8 border-t border-[#eadfcd] flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/blog" className="inline-flex items-center gap-2 font-bold text-[#766957] hover:text-primary transition-colors">
            <ChevronLeft className="w-5 h-5" /> Về trang Blog
          </Link>
          <div className="flex gap-2">
            <span className="text-sm font-medium text-[#a08d79] mr-2 self-center">Chia sẻ:</span>
            <button className="w-10 h-10 rounded-full bg-white border border-[#eadfcd] flex items-center justify-center text-secondary hover:text-[#1877F2] hover:border-[#1877F2] transition-colors">f</button>
            <button className="w-10 h-10 rounded-full bg-white border border-[#eadfcd] flex items-center justify-center text-secondary hover:text-[#1DA1F2] hover:border-[#1DA1F2] transition-colors">t</button>
          </div>
        </div>
      </article>
    </div>
  )
}
