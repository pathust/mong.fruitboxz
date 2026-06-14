import { Link } from 'react-router-dom'

const posts = [
  {
    id: '1',
    title: 'Lợi ích tuyệt vời của trái cây tươi với sức khỏe',
    excerpt: 'Trái cây tươi không chỉ ngon mà còn mang lại vô vàn lợi ích cho sức khỏe. Cùng Mọng Fruitbox khám phá những lợi ích tuyệt vời này.',
    image: '/images/e3f0c449-ebdf-4f82-bde6-223a8e31e92a.jpeg',
    date: '20/05/2025',
    author: 'Mọng Fruitbox',
    category: 'Sức khỏe',
  },
  {
    id: '2',
    title: 'Cách chọn trái cây tươi ngon không phải ai cũng biết',
    excerpt: 'Bí quyết chọn trái cây tươi ngon, đảm bảo chất lượng cho gia đình bạn. Những mẹo nhỏ nhưng vô cùng hữu ích.',
    image: '/images/48de0426-c637-42d9-a637-af8008fe31ff.jpg',
    date: '18/05/2025',
    author: 'Mọng Fruitbox',
    category: 'Mẹo vặt',
  },
  {
    id: '3',
    title: 'Hộp quà trái cây - Món quà sức khỏe ý nghĩa',
    excerpt: 'Hộp quà trái cây đang trở thành xu hướng quà tặng được nhiều người lựa chọn. Tìm hiểu tại sao nhé!',
    image: '/images/2f57b032-2888-499e-9eaa-eea90becc1b6.jpeg',
    date: '15/05/2025',
    author: 'Mọng Fruitbox',
    category: 'Quà tặng',
  },
]

export default function Blog() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-secondary">Blog</h1>
        <p className="text-gray-500 mt-2">Kiến thức về trái cây tươi và sức khỏe</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <Link
            key={post.id}
            to={`/blog/${post.id}`}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <div className="aspect-[3/2] overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5">
              <span className="text-primary text-xs font-semibold bg-primary/10 px-2.5 py-1 rounded-full">
                {post.category}
              </span>
              <h3 className="font-semibold text-secondary mt-2 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                <span>{post.date}</span>
                <span>{post.author}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
