import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'

export default function Categories() {
  const { loading, categories } = useCatalog()

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-8 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#35322e]">Danh mục sản phẩm</h1>
        <p className="text-gray-500 mt-1 text-sm">Khám phá các nhóm trái cây tươi ngon</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải danh mục...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/categories/${cat.slug}`}
              className="group rounded-xl overflow-hidden bg-white border border-[#efe7dc]"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={cat.image || '/images/58645746-dfac-4e9f-8914-649ea9576caf.jpeg'}
                  alt={cat.displayName || cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm md:text-[15px] font-medium text-[#393631] line-clamp-1">{cat.displayName || cat.name}</h3>
                <span className="block text-xs text-primary mt-1 group-hover:underline">Xem sản phẩm →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
