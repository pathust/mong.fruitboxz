import { useParams, Link } from 'react-router-dom'

const posts = {
  '1': {
    title: 'Lợi ích tuyệt vời của trái cây tươi với sức khỏe',
    content: `
      <p>Trái cây tươi là nguồn cung cấp vitamin, khoáng chất và chất xơ dồi dào cho cơ thể. Dưới đây là những lợi ích tuyệt vời mà trái cây tươi mang lại:</p>
      <h2>1. Tăng cường hệ miễn dịch</h2>
      <p>Trái cây giàu vitamin C như cam, bưởi, kiwi, dâu tây giúp tăng cường sức đề kháng, bảo vệ cơ thể khỏi các bệnh nhiễm trùng.</p>
      <h2>2. Tốt cho tim mạch</h2>
      <p>Chất xơ và kali trong trái cây giúp giảm huyết áp, giảm cholesterol xấu, ngăn ngừa các bệnh tim mạch.</p>
      <h2>3. Hỗ trợ tiêu hóa</h2>
      <p>Chất xơ trong trái cây giúp hệ tiêu hóa hoạt động trơn tru, ngăn ngừa táo bón.</p>
      <h2>4. Làm đẹp da</h2>
      <p>Các chất chống oxy hóa trong trái cây giúp làm chậm quá trình lão hóa, cho làn da khỏe mạnh, tươi trẻ.</p>
      <p>Hãy bổ sung trái cây tươi vào thực đơn hàng ngày để có một cơ thể khỏe mạnh nhé!</p>
    `,
    image: '/images/e3f0c449-ebdf-4f82-bde6-223a8e31e92a.jpeg',
    date: '20/05/2025',
    author: 'Mọng Fruitbox',
    category: 'Sức khỏe',
  },
  '2': {
    title: 'Cách chọn trái cây tươi ngon không phải ai cũng biết',
    content: `
      <p>Chọn trái cây tươi ngon là một nghệ thuật. Dưới đây là những mẹo nhỏ giúp bạn chọn được trái cây tươi ngon nhất.</p>
      <h2>Chọn theo mùa</h2>
      <p>Trái cây đúng mùa thường có hương vị thơm ngon nhất và giá cả hợp lý nhất.</p>
      <h2>Quan sát màu sắc</h2>
      <p>Trái cây tươi thường có màu sắc tự nhiên, tươi sáng. Tránh mua những quả có vết thâm, dập nát.</p>
      <h2>Kiểm tra độ cứng</h2>
      <p>Trái cây chín tới thường có độ cứng vừa phải. Không nên mua quả quá mềm hoặc quá cứng.</p>
      <h2>Ngửi mùi hương</h2>
      <p>Trái cây chín thường có mùi thơm đặc trưng. Nếu không có mùi thơm, có thể quả chưa chín.</p>
    `,
    image: '/images/48de0426-c637-42d9-a637-af8008fe31ff.jpg',
    date: '18/05/2025',
    author: 'Mọng Fruitbox',
    category: 'Mẹo vặt',
  },
  '3': {
    title: 'Hộp quà trái cây - Món quà sức khỏe ý nghĩa',
    content: `
      <p>Trong cuộc sống hiện đại, hộp quà trái cây đang dần trở thành lựa chọn quà tặng hàng đầu cho nhiều dịp khác nhau.</p>
      <h2>Tại sao nên chọn hộp quà trái cây?</h2>
      <p>Hộp quà trái cây không chỉ đẹp mắt mà còn mang thông điệp sức khỏe và sự quan tâm chân thành.</p>
      <h2>Phù hợp mọi dịp</h2>
      <p>Từ sinh nhật, lễ tết, thăm người ốm đến cảm ơn đối tác - hộp quà trái cây đều là lựa chọn hoàn hảo.</p>
      <h2>Đa dạng lựa chọn</h2>
      <p>Tại Mọng Fruitbox, chúng tôi có nhiều mẫu hộp quà từ 2 tầng, 4 ngăn, 6 ngăn đến 9 ngăn với đa dạng các loại trái cây.</p>
      <p>Hãy đến với Mọng Fruitbox để chọn những hộp quà trái cây đẹp nhất dành tặng người thân yêu!</p>
    `,
    image: '/images/2f57b032-2888-499e-9eaa-eea90becc1b6.jpeg',
    date: '15/05/2025',
    author: 'Mọng Fruitbox',
    category: 'Quà tặng',
  },
}

export default function BlogPost() {
  const { id } = useParams()
  const post = posts[id]

  if (!post) {
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

      <img src={post.image} alt={post.title} className="w-full aspect-[2/1] object-cover rounded-xl mb-8" />

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
        <span className="text-primary text-xs font-semibold bg-primary/10 px-2.5 py-1 rounded-full">{post.category}</span>
        <span>{post.date}</span>
        <span>{post.author}</span>
      </div>

      <h1 className="text-3xl font-bold text-secondary mb-6">{post.title}</h1>

      <div
        className="prose prose-sm prose-secondary max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  )
}
