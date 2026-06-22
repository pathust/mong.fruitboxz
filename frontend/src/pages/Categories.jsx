import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { useCatalog } from '../context/CatalogContext'

// Alternating section backgrounds for clear visual separation
const SECTION_THEMES = [
  { bg: 'bg-white', accent: 'bg-[#fff8f0]' },
  { bg: 'bg-[#faf7f2]', accent: 'bg-[#f3ebe0]' },
  { bg: 'bg-[#fff4ed]', accent: 'bg-[#fdefd8]' },
  { bg: 'bg-[#f5f9f3]', accent: 'bg-[#e8f2e4]' },
]

export default function Categories() {
  const { loading, categories } = useCatalog()

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="page-title text-3xl md:text-5xl mb-4 text-secondary">Danh mục</h1>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
          Hơn cả một thức quà, mỗi danh mục là một hành trình đầy cảm hứng — từ những nông trại xanh mướt cho đến khi những trái cây căng mọng tinh tuyển nhất nằm trọn trong tay bạn.
        </p>
      </div>

      {/* Category sections */}
      {loading ? (
        <div className="bg-white">
          {[1, 2, 3].map(i => (
            <div key={i} className={`py-16 md:py-24 ${i % 2 === 0 ? 'bg-white' : 'bg-[#faf7f2]'}`}>
              <div className="max-w-[1100px] mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-10 animate-pulse">
                <div className="w-full md:w-[52%] aspect-[4/3] bg-[#f3ebe0] rounded-3xl shrink-0" />
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="h-3 w-20 bg-[#f3ebe0] rounded-full" />
                  <div className="h-8 w-3/4 bg-[#f3ebe0] rounded-full" />
                  <div className="h-4 w-full bg-[#f3ebe0] rounded-full" />
                  <div className="h-4 w-5/6 bg-[#f3ebe0] rounded-full" />
                  <div className="h-10 w-36 bg-[#f3ebe0] rounded-full mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white text-center py-20 text-gray-400">Chưa có danh mục nào</div>
      ) : (
        categories.map((cat, index) => {
          const isEven = index % 2 === 0
          const theme = SECTION_THEMES[index % SECTION_THEMES.length]

          return (
            <section
              key={cat.slug}
              className={`${theme.bg} py-12 md:py-16 rounded-[24px] mb-8`}
            >
              <div className={`px-6 md:px-12 flex flex-col gap-8 md:gap-14 md:items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

                {/* Image side */}
                <Link
                  to={`/categories/${cat.slug}`}
                  className="group relative w-full md:w-[52%] shrink-0 overflow-hidden rounded-3xl shadow-[0_24px_64px_-16px_rgba(64,42,22,0.22)] aspect-[4/3]"
                >
                  <img
                    src={cat.image || '/mong_logo-removebg.png'}
                    alt={cat.displayName || cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/mong_logo-removebg.png' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                </Link>

                {/* Text side */}
                <div className="flex-1 flex flex-col justify-center">


                  <h2 className="section-title text-[28px] md:text-[38px] leading-tight text-secondary mb-4">
                    {cat.displayName || cat.name}
                  </h2>

                  <div className="w-12 h-1 rounded-full bg-primary/40 mb-5" />

                  <p className="text-[#6b5e52] text-base md:text-[17px] leading-relaxed mb-8">
                    {cat.description
                      ? cat.description
                      : `Bước vào bộ sưu tập ${cat.displayName || cat.name} — nơi từng thức quả được chúng tôi nâng niu và tuyển lựa bằng cả tâm huyết. Hương vị nguyên bản, ngọt ngào và tươi mới sẽ đánh thức mọi giác quan, mang đến cho bạn trải nghiệm thưởng thức tinh tế không thể chối từ.`
                    }
                  </p>

                  <Link
                    to={`/categories/${cat.slug}`}
                    className="inline-flex items-center gap-3 self-start group/btn"
                  >
                    <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition-all duration-300 group-hover/btn:scale-110 group-hover/btn:shadow-xl group-hover/btn:shadow-primary/40">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                    <span className="product-meta font-bold text-secondary group-hover/btn:text-primary transition-colors">
                      Xem sản phẩm
                    </span>
                  </Link>
                </div>
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
