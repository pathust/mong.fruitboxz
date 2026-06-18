import { Award, Gift, LoaderCircle, Truck, Sparkles, Leaf, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'


export default function AboutUs() {
  const reasons = [
    {
      title: 'Tuyển chọn khắt khe',
      description: 'Mỗi trái cây đều được Mọng đích thân lựa chọn từ các nhà vườn uy tín, đảm bảo độ chín vừa tới, hương vị trọn vẹn và an toàn cho sức khỏe.',
      icon: 'Award'
    },
    {
      title: 'Đóng gói tinh tế',
      description: 'Không chỉ là trái cây, mỗi hộp quà Mọng đều là một tác phẩm nghệ thuật, được sắp xếp tỉ mỉ và gói ghém bằng cả tấm lòng để trao gửi yêu thương.',
      icon: 'Gift'
    },
    {
      title: 'Giao hàng tận tâm',
      description: 'Mọng cam kết giao hàng nhanh chóng, cẩn thận, đảm bảo trái cây luôn tươi mới và nguyên vẹn khi đến tay bạn và những người thân yêu.',
      icon: 'Truck'
    }
  ]

  const reasonIcons = {
    Award,
    Gift,
    Truck
  }

  return (
    <div className="bg-[#fffaf4] min-h-screen pb-20">
      {/* Hero header */}
      <div className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0e5d5]/50 via-transparent to-[#fff8f0]/80 -z-10"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#eadfcd] to-transparent opacity-50"></div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#eadfcd] bg-white/50 backdrop-blur-md mb-8">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Về Chúng Tôi
            </span>
          </div>
          <h1 className="text-[40px] md:text-[56px] font-extrabold text-secondary leading-[1.15] tracking-tight mb-6">
            Mang thiên nhiên nguyên bản<br className="hidden md:block" /> đến tận tay người trân quý
          </h1>
          <p className="text-[#766957] max-w-2xl mx-auto text-lg md:text-xl leading-[1.8] font-medium">
            Mọng ra đời với niềm tin rằng trái cây ngon nhất là trái cây được hái đúng mùa, chín đúng độ và trọn vẹn hương vị tự nhiên.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Story Section */}
        <section className="mb-24">
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] transform rotate-3 scale-105 transition-transform duration-500 group-hover:rotate-6"></div>
              <div className="overflow-hidden rounded-[2rem] bg-accent aspect-[4/5] relative z-10 shadow-xl shadow-primary/5">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f0e5d5] to-[#eadfcd]">
                  <span className="text-[#a08d79] font-medium tracking-widest uppercase">Mọng Image</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/60 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/50 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.03)]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 uppercase tracking-wider">
                <Leaf className="w-4 h-4" />
                Câu chuyện của Mọng
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-secondary mb-8 leading-tight">
                Hành trình theo đuổi sự nguyên bản
              </h2>
              <div className="prose prose-lg prose-stone max-w-none prose-p:text-[#5d5246] prose-p:leading-[1.8]">
                <p>Mỗi hộp quà Mọng đều chứa đựng sự tận tâm trong từng khâu tuyển chọn, bảo quản và đóng gói. Chúng tôi tự hào mang đến những thức quả tươi sạch, rõ ràng nguồn gốc để bạn yên tâm trao gửi yêu thương.</p>
                <p>Bắt nguồn từ tình yêu với những thức quà thuần khiết của tự nhiên, Mọng mong muốn mang đến cho khách hàng không chỉ là trái cây ngon, mà còn là trải nghiệm thưởng thức trọn vẹn và an tâm tuyệt đối.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reasons Section */}
        <section className="mb-16">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm mb-3 block">Giá trị cốt lõi</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-secondary">
              Vì sao chọn Mọng?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {reasons.map((item, index) => {
              const Icon = reasonIcons[item.icon] || Award
              return (
                <div key={index} className="group relative p-10 bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border border-transparent hover:border-primary/10 overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-primary transform translate-x-1/4 -translate-y-1/4 group-hover:scale-150 transition-transform duration-700">
                    <Icon className="w-48 h-48" />
                  </div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#fff8f0] flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-secondary text-xl mb-4 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-[#766957] leading-relaxed">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
