# Architectural Review: Mọng Fruitboxz

> **Cập nhật 2026-09-03**: đây là báo cáo audit tại một thời điểm — một số phát hiện đã lỗi thời sau các fix của phiên làm việc gần nhất (đánh dấu `[ĐÃ SỬA]`/`[KHÔNG CÒN ĐÚNG]` bên dưới). Các mục không đánh dấu **chưa được verify lại**, coi như vẫn còn giá trị tham khảo cho tới khi kiểm tra lại.

## 1. DATA FLOW INCONSISTENCIES `[KHÔNG CÒN ĐÚNG]`
- **Location:** `backend/src/api/store/checkout/route.ts`
- **Problem (lịch sử):** Business logic for proportional discount allocation and validation is hardcoded directly inside the POST route handler. It bypasses the Medusa Workflows/Service layer.
- **Trạng thái thật (2026-09-03):** route hiện gọi `checkoutOrderWorkflow(req.scope).run({...})` — `backend/src/workflows/checkout-order.ts` là một Workflow thật (`createWorkflow("checkout-order", ...)`), không còn hardcode logic trực tiếp trong route handler.
- **Impact:** Maintainability. Duplicated logic if orders are created elsewhere (e.g. Draft Orders via Admin). Hard to test route handlers compared to isolated services.
- **Recommended Fix:** ~~Extract the checkout logic into a dedicated `@medusajs/workflows` workflow~~ — đã thực hiện.

## 2. AUTHENTICATION & AUTHORIZATION `[ĐÃ SỬA — nhưng root cause khác mô tả gốc]`
- **Location:** `backend/src/api/middlewares/rbac.ts`
- **Problem (mô tả gốc, SAI cơ chế):** báo cáo gốc cho rằng nguyên nhân là dùng path matcher tường minh (`/admin/products*`...) thay vì catch-all `/admin/*`, khiến các route như `/admin/blog-categories` không được bảo vệ.
- **Root cause thật (đã xác nhận và sửa trong phiên 2026-09-03):** `rbacMiddleware` vốn đọc `req.path`, vốn là path **tương đối theo điểm mount** của Express router — không phải path đầy đủ. Với router mount ở `/admin`, `req.path` cho request tới `/admin/blog-categories` chỉ còn là `/blog-categories`, khiến hàm xác định module/permission suy luận sai (hoặc suy ra rỗng) → nhiều route admin **không bị áp permission nào**, không phải vì thiếu matcher catch-all.
- **Impact:** Security (Critical). Người dùng có auth hợp lệ nhưng không đủ quyền vẫn thực hiện được CRUD trên nhiều endpoint admin.
- **Fix đã áp dụng:** đổi sang đọc `req.originalUrl` (bỏ query string) làm nguồn path đầy đủ, viết lại toàn bộ logic suy luận permission (`getRequiredPermissions`, `inferAction`, `PERMISSION_ALIASES`) trong `backend/src/api/middlewares/rbac.ts`. Đã verify end-to-end bằng token Staff/Manager/Super Admin thật. Xem [RBAC](./05-admin/rbac.md) để biết cơ chế hiện tại.

## 3. MODULE BOUNDARIES `[KHÔNG CÒN ĐÚNG]`
- **Location:** `backend/src/api/store/checkout/route.ts`
- **Problem (lịch sử):** The route manually resolves multiple core modules (`Modules.ORDER`, `Modules.PROMOTION`) and coordinates them, tightly coupling the route to internal schemas.
- **Trạng thái thật (2026-09-03):** cùng với mục #1, quá trình tạo đơn đã được đóng gói trong `checkoutOrderWorkflow` (`backend/src/workflows/checkout-order.ts`) với các Step riêng — route handler giờ chỉ gọi `.run()` chứ không tự điều phối nhiều module trực tiếp.
- **Impact:** Maintainability and scalability. Breaks the modular architecture principles of Medusa v2.
- **Recommended Fix:** ~~Encapsulate the order creation process inside a `@medusajs/workflows` workflow~~ — đã thực hiện, cùng fix với mục #1.

## 4. STOREFRONT vs CMS DUPLICATION `[chưa verify lại trong phiên 2026-09-03]`
- **Location:** `frontend/src/App.jsx`
- **Problem:** The admin dashboard and the frontend are bundled in the exact same Vite SPA. Admin components (`AdminLayout.jsx`) and frontend components share the same build process, meaning customer browsers download admin panel code and routes.
- **Impact:** Security/Performance. Admin source code map/bundle is shipped to public users, exposing the admin routing structure and increasing bundle size.
- **Recommended Fix:** Separate the Admin SPA from the Frontend SPA. Configure Vite to use multi-page app (MPA) mode with separate entry points (e.g., `index.html` and `admin.html`).

## 5. CHATBOT INTEGRATION `[KHÔNG CÒN ĐÚNG]`
- **Location:** `backend/src/lib/chatbot.ts`
- **Problem (lịch sử):** báo cáo gốc cho rằng chatbot chỉ là keyword matcher tĩnh (`scoreFaqMatch`) + fallback Meilisearch, không có LLM/RAG thật.
- **Trạng thái thật (2026-09-03):** đã xác nhận (đọc trực tiếp `buildChatbotReply` trong `chatbot.ts`) chatbot gọi Groq LLM thật (`GROQ_API_KEY`/`GROQ_MODEL`), và có RAG context thật: `response_mode` ghi nhận các nhánh `catalog-rag`/`faq-rag` — tức có truy xuất ngữ cảnh (catalog/FAQ) trước khi gọi LLM để sinh câu trả lời, không phải chỉ match từ khoá tĩnh. `scoreFaqMatch` vẫn tồn tại nhưng là một trong nhiều nhánh xử lý, không phải toàn bộ cơ chế. Xem [System §3](./08-system/README.md#3-chatbot) cho API thật và pgvector index (`idx_product_embedding`, `idx_chatbot_log_embedding`) đã được tạo.
- **Impact:** UX. Fails to provide contextual, natural language responses. False advertising of system capabilities.
- **Recommended Fix:** ~~Implement the Groq SDK + pgvector RAG~~ — đã thực hiện. Đánh giá bảo mật (prompt injection, cache poisoning) riêng nằm ở `.claude/agents/chatbot-ai-reviewer.md`.

## 6. SHIPPING (OSRM) MODULE `[VẪN ĐÚNG — verify lại 2026-09-03]`
- **Location:** ~~`backend/src/lib/geocoding.ts`~~ → file này đã bị xoá (dead code, không hề được import ở đâu); logic thật nằm ở `backend/src/modules/shipping/service.ts`.
- **Problem (vẫn đúng):** `osrmDistanceKm()` không gọi OSRM thật — chỉ tính `haversineKm(...) * 1.3` (hệ số cố định ước lượng đường bộ), rồi cache kết quả trong bộ nhớ. Tên hàm gây hiểu nhầm là có tích hợp routing thật.
- **Impact:** UX/Business Logic. Customers could be undercharged for shipping if a straight line crosses a lake or river, but the actual driving distance is much longer.
- **Lưu ý liên quan (đã sửa trong phiên này):** một bug riêng trong cùng file — so khớp toạ độ lat/lng với quận Hà Nội gần nhất mà không giới hạn khoảng cách, khiến toạ độ ở tỉnh khác vẫn bị tính phí ship nội thành — đã được vá bằng ngưỡng `MAX_HANOI_COORDINATE_SLOP_KM = 15`. Bug OSRM/Haversine ở trên **chưa được sửa**, vẫn là hạn chế thật.
- **Recommended Fix:** Replace `haversineKm * 1.3` với gọi HTTP thật tới instance OSRM để tính khoảng cách đường bộ, giữ nguyên cache theo cặp `[origin]-[destination]`.

## 7. NOTIFICATIONS MODULE `[VẪN ĐÚNG — verify lại 2026-09-03]`
- **Location:** `backend/src/subscribers/order-placed.ts`
- **Problem (vẫn đúng):** subscriber dựng HTML email đầy đủ nhưng chỉ `logger.info("[Email Service Mock] Đã gửi email xác nhận đến: ...")` — có comment `// TODO: Connect to Resend/SendGrid when API keys are available`, không có tích hợp provider email thật nào.
- **Impact:** UX. Khách hàng không nhận được email xác nhận đơn hàng thật.
- **Recommended Fix:** Implement a proper Notification Provider module (e.g., Resend or Sendgrid) using Medusa's Notification Module API and trigger it from the `order.placed` event.

---

### TOP 5 HIGHEST-IMPACT FIXES — cập nhật trạng thái 2026-09-03
1. ~~Fix the Admin Auth Middleware để vá lỗ hổng bảo mật RBAC~~ — **ĐÃ SỬA** (root cause thật khác mô tả gốc, xem mục #2).
2. ~~Implement actual Groq LLM integration trong `chatbot.ts`~~ — **ĐÃ CÓ SẴN**, mô tả gốc sai (xem mục #5).
3. **Replace the Haversine distance** trong `modules/shipping/service.ts` (không phải `geocoding.ts` — file đó đã xoá) bằng OSRM/Routing API thật — **VẪN CÒN TỒN ĐỌNG**.
4. ~~Move business logic from `checkout/route.ts` vào Workflow~~ — **ĐÃ CÓ SẴN** (`checkoutOrderWorkflow`), mô tả gốc lỗi thời (xem mục #1/#3).
5. **Implement Notification module** cho email xác nhận đơn hàng (Resend/Sendgrid) trong `order-placed.ts` — **VẪN CÒN TỒN ĐỌNG**, hiện chỉ log giả.

**Còn tồn đọng thật sau khi rà soát lại (2026-09-03): chỉ còn #3 (shipping OSRM giả) và #5 (email giả).** Mục #4 (SPA gộp admin+frontend) chưa được verify lại trong phiên này.
