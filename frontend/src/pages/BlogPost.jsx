import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
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

  if (loading) return <div className="min-h-[420px] flex items-center justify-center text-primary"><LoaderCircle className="h-8 w-8 animate-spin" /></div>

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary mb-4">Bài viết không tồn tại</h1>
        <Link to="/blog" className="text-primary font-medium">Quay lại Blog</Link>
      </div>
    )
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary">Trang chủ</Link>
        <span>/</span>
        <Link to="/blog" className="hover:text-primary">Blog</Link>
        <span>/</span>
        <span className="text-secondary">{post.title}</span>
      </nav>

      {post.image && <img src={post.image} alt={post.title} className="w-full aspect-[2/1] object-cover rounded-xl mb-8" />}

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
        {post.category && <span className="text-primary text-xs font-semibold bg-primary/10 px-2.5 py-1 rounded-full">{post.category}</span>}
        <span>{formatDate(post.published_at || post.created_at)}</span>
        {post.author && <span>{post.author}</span>}
      </div>

      <h1 className="text-3xl font-bold text-secondary mb-6">{post.title}</h1>

      <div
        className="prose prose-sm prose-secondary max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content || '' }}
      />
    </article>
  )
}
