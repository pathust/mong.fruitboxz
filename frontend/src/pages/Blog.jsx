import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LoaderCircle, ChevronRight, Clock, User, BookOpen } from 'lucide-react'
import { apiFetch } from '../lib/api'
import { useSiteSettings } from '../hooks/useSiteSettings'

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

export default function Blog() {
  const { settings, loading: settingsLoading } = useSiteSettings()
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

  if (loading || settingsLoading) return <div className="min-h-[420px] flex items-center justify-center text-primary"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
  if (error) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-red-600">{error}</div>

  const featuredPost = posts[0]
  const regularPosts = posts.slice(1)

  return (
    <div className="bg-[#fffaf4] min-h-screen pb-20">
      {/* Hero header */}
      <div className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0e5d5]/50 via-transparent to-[#fff8f0]/80 -z-10"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#eadfcd] to-transparent opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#eadfcd] bg-white/50 backdrop-blur-md mb-8">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Góc Chuyện Trò
            </span>
          </div>
          <h1 
            className="text-[40px] md:text-[56px] font-extrabold text-secondary leading-[1.15] tracking-tight mb-6"
          >
            Nơi hương vị<br className="hidden md:block" /> kể câu chuyện của mình
          </h1>
          <div className="prose prose-lg prose-stone mx-auto max-w-2xl prose-p:text-[#766957] prose-p:text-lg md:prose-p:text-xl prose-p:leading-[1.8] prose-p:font-medium">
            <p>Không chỉ là bí quyết chọn quả ngon hay sống khỏe, đây còn là nơi Mọng trải lòng về hành trình mang thiên nhiên nguyên bản đến tận tay người trân quý.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {posts.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#eadfcd] bg-white/50 p-16 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">Chưa có bài viết nào được xuất bản.</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link 
                to={`/blog/${featuredPost.slug}`}
                className="group flex flex-col lg:flex-row bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden mb-16 border border-transparent hover:border-primary/10"
              >
                <div className="lg:w-3/5 overflow-hidden bg-accent relative aspect-[4/3] lg:aspect-auto">
                  {featuredPost.image ? (
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#f0e5d5] to-[#eadfcd] flex items-center justify-center">
                      <span className="text-[#a08d79] tracking-widest uppercase text-sm font-bold">Featured</span>
                    </div>
                  )}
                </div>
                <div className="lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    {featuredPost.category && (
                      <span className="text-primary text-xs font-extrabold tracking-wider uppercase bg-primary/10 px-3 py-1.5 rounded-full">
                        {featuredPost.category.name || featuredPost.category}
                      </span>
                    )}
                    <span className="text-[#a08d79] text-sm font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatDate(featuredPost.published_at || featuredPost.created_at)}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-secondary mb-4 group-hover:text-primary transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>
                  <p className="text-[#766957] text-lg mb-8 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#f0e5d5] pt-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                      <div className="w-8 h-8 rounded-full bg-[#fff8f0] flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      {featuredPost.author}
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:translate-x-2 transition-transform">
                      Đọc tiếp <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid Posts */}
            {regularPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map(post => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group bg-white rounded-[1.5rem] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden flex flex-col border border-transparent hover:border-primary/10"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-accent relative">
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="p-6 md:p-8 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-4">
                        {post.category && (
                          <span className="text-primary text-[11px] font-extrabold tracking-wider uppercase bg-primary/10 px-2.5 py-1 rounded-full">
                            {post.category.name || post.category}
                          </span>
                        )}
                        <span className="text-[#a08d79] text-xs font-medium">
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                      </div>
                      <h3 className="font-bold text-xl text-secondary mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-[#766957] text-sm line-clamp-2 leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto pt-4 border-t border-[#f0e5d5] flex items-center justify-between text-xs text-[#a08d79] font-medium">
                        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{post.author}</span>
                        <span className="text-primary group-hover:underline underline-offset-4">Đọc bài</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
