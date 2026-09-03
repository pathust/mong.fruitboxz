# Database Architecture Review: Medusa.js v2 + pgvector

> **Cập nhật 2026-09-03**: đây là báo cáo audit tại một thời điểm. Đã verify lại trực tiếp trên DB (`docker exec ... psql`) — các phát hiện HIGH severity về thiếu index **đã lỗi thời** (index đã tồn tại, kể cả bị trùng lặp — xem STEP 3), và claim "không có vector index" **sai hoàn toàn** với thực tế hiện tại. Xem ghi chú cập nhật trong từng mục bên dưới.

## STEP 1 — SCHEMA DISCOVERY

### Key Tables & Sizes (Top 10)
| Schema | Table Name | Size |
| :--- | :--- | :--- |
| public | image | 960 kB |
| public | product_variant_inventory_item | 768 kB |
| public | product | 416 kB |
| public | inventory_level | 384 kB |
| public | product_variant | 352 kB |
| public | product_variant_price_set | 288 kB |
| public | product_sales_channel | 264 kB |
| public | product_shipping_profile | 264 kB |
| public | price | 248 kB |
| public | inventory_item | 232 kB |

### Missing Foreign Key Indexes `[KHÔNG CÒN ĐÚNG — verify lại 2026-09-03]`
| Table | Column | Trạng thái thật |
| :--- | :--- | :--- |
| `order_line_item` | `totals_id` | **Đã có index** — thậm chí bị trùng 2 lần: `IDX_order_line_item_totals_id` (Medusa tự sinh) + `idx_order_line_item_totals_id` (viết tay) |
| `fulfillment` | `provider_id` | **Đã có index**, cũng trùng 2 lần (`IDX_*` + `idx_*`) |
| `fulfillment` | `delivery_address_id` | **Đã có index**, cũng trùng 2 lần (`IDX_*` + `idx_*`) |
| `site_blog_post` | `category_id` | Có 1 partial index `IDX_site_blog_post_category_id` (`WHERE deleted_at IS NULL`) — đúng như ghi chú gốc |

> [!NOTE]
> `site_blog_post.category_id` has a partial index (`WHERE deleted_at IS NULL`), which is why the generic missing-index query flagged it. A full index might be preferable depending on query planner behavior.
>
> **Phát hiện mới (2026-09-03)**: 3 cột đầu tiên có **index trùng lặp** (2 index vật lý cho cùng 1 cột) — không phải "thiếu" mà là dư thừa, có thể do ai đó đã chạy đúng câu `CREATE INDEX` khuyến nghị ở STEP 4 của chính báo cáo này mà không kiểm tra index Medusa đã tự tạo sẵn từ trước. Index trùng lặp tốn dung lượng và làm chậm write path (mỗi INSERT/UPDATE phải update cả 2 index) mà không có lợi ích gì thêm — nên `DROP` một trong hai (giữ bản `IDX_*` do Medusa tự sinh, xoá bản `idx_*` viết tay) thay vì để nguyên.

## STEP 2 — BUSINESS LOGIC REVIEW

*   **Soft Deletes (`deleted_at`)**: **Consistent**. All core domain tables implement soft deletes. Only join tables (e.g., `product_tags`, `product_category_product`) and migration tables omit this column, which is standard practice.
*   **Timestamps (`created_at`, `updated_at`)**: **Consistent**. Present on all main entity tables. Omitted only on M:N join tables and migration history tables.
*   **Price/Money Fields**: **Medusa v2 Standard**. Money fields like `raw_amount` and `raw_unit_price` are using the `jsonb` data type (storing precision objects) rather than `NUMERIC(10,2)`. While normally an anti-pattern in Postgres, this is correct and required for Medusa v2's multi-currency and high-precision pricing architecture.
*   **Status Fields**: Medusa natively uses enums or constrained `varchar` for statuses (e.g., `order_status`, `payment_status`).
*   **Primary Keys (UUID vs String)**: **Medusa Standard**. Medusa uses prefixed strings (e.g., `prod_01...`, `cart_01...`) stored as `character varying` for Primary Keys, NOT native PostgreSQL `uuid` types. This is the intended framework behavior to make IDs globally unique and easily identifiable.

## STEP 3 — ISSUES REPORT

| Table | Issue | Severity | Fix |
| :--- | :--- | :--- | :--- |
| `order_line_item` | ~~Missing index on FK `totals_id`~~ → **Index trùng lặp** (2 bản) | ~~HIGH~~ **LOW** | `DROP INDEX idx_order_line_item_totals_id` (giữ bản `IDX_*`) |
| `fulfillment` | ~~Missing index on FK `provider_id`~~ → **Index trùng lặp** (2 bản) | ~~HIGH~~ **LOW** | `DROP INDEX idx_fulfillment_provider_id` |
| `fulfillment` | ~~Missing index on FK `delivery_address_id`~~ → **Index trùng lặp** (2 bản) | ~~HIGH~~ **LOW** | `DROP INDEX idx_fulfillment_delivery_address_id` |
| `workflow_execution` | Unbounded growth | **MED** (chưa quan sát được ở dev — bảng hiện có 0 dòng, khuyến nghị vẫn hợp lý cho production lâu dài) | Implement table partitioning or pruning cronjob |
| `product` / `site_chatbot_question_log` | ~~`pgvector` extension installed but no vector indexes exist~~ | ~~LOW~~ **KHÔNG CÒN ĐÚNG** | Đã có HNSW index: `idx_product_embedding` trên `product.embedding`, `idx_chatbot_log_embedding` trên `site_chatbot_question_log.embedding` — không cần fix |

## STEP 4 — OPTIMIZATION RECOMMENDATIONS

### 1. ~~High Severity Fixes (Missing Indexes)~~ → Dọn index trùng lặp `[cập nhật 2026-09-03]`
3 index trong bảng dưới **đã tồn tại từ trước** (do Medusa tự sinh, tên dạng `IDX_*`) — các câu lệnh dưới đây (viết ở lần audit trước) đã bị chạy thêm một lần nữa với tên viết thường, tạo ra index trùng lặp thay vì lấp chỗ thiếu. **Không chạy các câu này nữa.** Thay vào đó, dọn dẹp bản dư:

```sql
-- Đã áp dụng nhầm trước đây (tạo index trùng, không phải index còn thiếu) — để tham khảo lịch sử, KHÔNG chạy lại
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_line_item_totals_id ON public.order_line_item(totals_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fulfillment_provider_id ON public.fulfillment(provider_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fulfillment_delivery_address_id ON public.fulfillment(delivery_address_id);

-- Khuyến nghị thật: xoá bản trùng, giữ bản Medusa tự sinh (IDX_*)
DROP INDEX CONCURRENTLY IF EXISTS public.idx_order_line_item_totals_id;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_fulfillment_provider_id;
DROP INDEX CONCURRENTLY IF EXISTS public.idx_fulfillment_delivery_address_id;
```

### 2. Table Partitioning
As an e-commerce platform grows, certain tables accumulate massive amounts of historical data. Recommend partitioning by range (`created_at`):
*   `order` and related tables (`order_line_item`, `order_transaction`)
*   `workflow_execution` (Medusa v2 creates many workflow execution logs which should be partitioned by month and regularly dropped/archived).

### 3. ~~pgvector Integration (HNSW vs IVFFlat)~~ → Đã triển khai `[cập nhật 2026-09-03]`
Claim gốc ("chưa có vector column/index") **không còn đúng**. Đã có:
*   `product.embedding vector(...)` + `idx_product_embedding` (HNSW, `vector_cosine_ops`)
*   `site_chatbot_question_log.embedding` + `idx_chatbot_log_embedding` (HNSW, `vector_cosine_ops`)

Lựa chọn HNSW thay vì IVFFlat khớp với khuyến nghị gốc của báo cáo này (recall tốt hơn, không cần rebuild khi dataset lớn dần). Không cần fix gì thêm ở đây; đoạn SQL mẫu dưới chỉ còn giá trị tham khảo nếu cần thêm embedding cho bảng khác trong tương lai:

```sql
-- Mẫu cho các bảng cần vector search khác trong tương lai (product/site_chatbot_question_log đã có sẵn)
ALTER TABLE public.some_table ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX ON public.some_table USING hnsw (embedding vector_cosine_ops);
```

### 4. Data Integrity Constraints
Ensure that JSONB money fields contain required keys to prevent application-level crashes.
```sql
-- Example: ensure raw_amount JSONB has 'value' and 'precision' keys
ALTER TABLE public.price ADD CONSTRAINT chk_price_raw_amount_format 
CHECK (raw_amount ? 'value' AND raw_amount ? 'precision');
```
