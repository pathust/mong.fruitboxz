import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'

export default function Categories() {
  const { loading, categories } = useCatalog()

  return (
    <div className="min-h-screen bg-[#fffdf9]">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-[#fff8f0] to-[#fdefd8] border-b border-[#f0e5d5] py-14 md:py-20">
        <div className="max-w-[1240px] mx-auto px-4 text-center">
          <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-4 opacity-80">Danh mục</span>
          <h1 className="page-title text-[36px] md:text-[52px] text-secondary leading-tight">
            Khám phá từng nhóm<br className="hidden md:block" /> trái cây của Mọng
          </h1>
          <p className="text-[#8b7b68] mt-4 max-w-xl mx-auto text-base md:text-lg">
            Mỗi danh mục là một thế giới hương vị riêng — tươi ngon, tinh tế và được chăm chút từng chi tiết.
          </p>
        </div>
      </div>

      {/* Category list */}
      <div className="max-w-[1100px] mx-auto px-4 py-16 md:py-24 space-y-20 md:space-y-28">
        {loading ? (
          <div className="space-y-24">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col md:flex-row gap-10 animate-pulse">
                <div className="w-full md:w-1/2 aspect-[4/3] bg-[#f3ebe0] rounded-3xl" />
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="h-4 w-24 bg-[#f3ebe0] rounded-full" />
                  <div className="h-8 w-3/4 bg-[#f3ebe0] rounded-full" />
                  <div className="h-4 w-full bg-[#f3ebe0] rounded-full" />
                  <div className="h-4 w-5/6 bg-[#f3ebe0] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Chưa có danh mục nào</div>
        ) : (
          categories.map((cat, index) => {
            const isEven = index % 2 === 0
            return (
              <article
                key={cat.slug}
                className={`flex flex-col gap-8 md:gap-14 md:items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Image side */}
                <Link
                  to={`/categories/${cat.slug}`}
                  className="group relative w-full md:w-[52%] shrink-0 overflow-hidden rounded-3xl shadow-[0_20px_60px_-15px_rgba(64,42,22,0.18)] aspect-[4/3]"
                >
                  <img
                    src={cat.image || '/mong_logo-removebg.png'}
                    alt={cat.displayName || cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/mong_logo-removebg.png' }}
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                </Link>

                {/* Text side */}
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-xs font-bold tracking-widest text-primary uppercase mb-3 opacity-70">
                    Danh mục {String(index + 1).padStart(2, '0')}
                  </span>

                  <h2 className="section-title text-[28px] md:text-[36px] leading-tight text-secondary mb-4">
                    {cat.displayName || cat.name}
                  </h2>

                  {cat.description ? (
                    <p className="text-[#6b5e52] text-base md:text-[17px] leading-relaxed mb-6">
                      {cat.description}
                    </p>
                  ) : (
                    <p className="text-[#6b5e52] text-base md:text-[17px] leading-relaxed mb-6">
                      Khám phá các sản phẩm trong danh mục <strong className="text-secondary">{cat.displayName || cat.name}</strong> — được tuyển chọn kỹ lưỡng, đảm bảo tươi ngon và chất lượng cao nhất.
                    </p>
                  )}

                  <Link
                    to={`/categories/${cat.slug}`}
                    className="inline-flex items-center gap-3 self-start group/btn"
                  >
                    <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:shadow-primary/50">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                    <span className="product-meta font-bold text-secondary group-hover/btn:text-primary transition-colors">
                      Xem sản phẩm
                    </span>
                  </Link>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
