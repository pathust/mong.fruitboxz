import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { apiFetch } from '../lib/api'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    apiFetch('/store/blog')
      .then((data) => {
        if (mounted) setPosts(data?.blog_posts || [])
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Không tải được blog.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="min-h-[420px] flex items-center justify-center text-primary"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-600">{error}</div>

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-secondary">Blog</h1>
        <p className="text-gray-500 mt-2">Kiến thức về trái cây tươi và sức khỏe</p>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">Chưa có bài viết nào.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-[3/2] overflow-hidden bg-accent">
                {post.image && (
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>
              <div className="p-5">
                {post.category && <span className="text-primary text-xs font-semibold bg-primary/10 px-2.5 py-1 rounded-full">{post.category}</span>}
                <h3 className="font-semibold text-secondary mt-2 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                  <span>{post.author}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
