import { ExecArgs } from "@medusajs/framework/types"
import { updateGlobalSettings } from "../lib/global-settings"

export default async function seedSettings({ container }: ExecArgs) {
  const siteService = container.resolve("site") as any

  const merged = await updateGlobalSettings(siteService, {
    site_name: "Mọng Fruitboxz",
    tagline: "Trái cây nhập khẩu cao cấp",
    footer_about: "Mọng Fruitboxz tự hào mang đến cho khách hàng những loại trái cây tươi ngon, an toàn và chất lượng nhất.",
    email: "contact@mongfruitboxz.com",
    phone: "0901 234 567",
    address: "123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội",
    opening_hours: "08:00 - 22:00 hàng ngày",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    contact_title: "Liên hệ với Mọng",
    contact_intro: "Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn.",
    about_title: "Về Mọng Fruitboxz",
    about_intro: "Hành trình mang hương vị trái cây hảo hạng từ khắp thế giới về Việt Nam.",
    about_image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf",
    about_story_title: "Câu chuyện của Mọng",
    about_story: "Khởi nguồn từ tình yêu với trái cây tươi, Mọng Fruitboxz ra đời với mong muốn mang đến cho khách hàng những trải nghiệm ẩm thực tuyệt vời nhất.",
    about_story_secondary: "Mỗi hộp trái cây là một món quà tinh thần, thay bạn gửi gắm yêu thương tới người thân, bạn bè.",
    about_reasons_title: "Vì sao chọn Mọng?",
    about_reasons_json: JSON.stringify([
      { title: "Chất lượng hàng đầu", description: "100% trái cây nhập khẩu tươi ngon", icon: "quality" },
      { title: "Quà tặng đẳng cấp", description: "Hộp quà thiết kế sang trọng, tinh tế", icon: "gift" },
      { title: "Giao hàng siêu tốc", description: "Cam kết giao hàng đúng hẹn", icon: "delivery" }
    ]),
    custom_box_types_json: JSON.stringify([
      { slug: "hop-qua-trai-cay-tu-chon", name: "Hộp Quà Cơ Bản", description: "Hộp gồm 3-4 loại trái cây tự chọn", base_price: 50000, max_items: 4 },
      { slug: "hop-qua-cao-cap", name: "Hộp Quà Cao Cấp", description: "Hộp sang trọng gồm 5-7 loại trái cây tự chọn", base_price: 150000, max_items: 7 }
    ]),
    custom_box_product_handles: "",
    about_us: "Chúng tôi là Mọng",
    delivery_info: "Giao hàng hoả tốc nội thành Hà Nội",
    shipping_policy_text: "Mọng giao hàng trong Hà Nội theo khu vực. Phí ship được hiển thị trước khi đặt hàng và có thể thay đổi theo khoảng cách thực tế.",
    payment_policy_text: "Mọng hỗ trợ COD và chuyển khoản. Đơn hàng được xác nhận trước khi giao.",
    privacy_policy_text: "Thông tin khách hàng chỉ dùng để xử lý đơn hàng, giao hàng và chăm sóc sau bán.",
  })
  console.log("Seeded settings successfully", merged.site_name)
}
