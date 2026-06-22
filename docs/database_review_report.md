# Database Architecture Review: Medusa.js v2 + pgvector

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

### Missing Foreign Key Indexes
| Table | Column |
| :--- | :--- |
| `order_line_item` | `totals_id` |
| `fulfillment` | `provider_id` |
| `fulfillment` | `delivery_address_id` |
| `site_blog_post` | `category_id` |

> [!NOTE] 
> `site_blog_post.category_id` has a partial index (`WHERE deleted_at IS NULL`), which is why the generic missing-index query flagged it. A full index might be preferable depending on query planner behavior.

## STEP 2 — BUSINESS LOGIC REVIEW

*   **Soft Deletes (`deleted_at`)**: **Consistent**. All core domain tables implement soft deletes. Only join tables (e.g., `product_tags`, `product_category_product`) and migration tables omit this column, which is standard practice.
*   **Timestamps (`created_at`, `updated_at`)**: **Consistent**. Present on all main entity tables. Omitted only on M:N join tables and migration history tables.
*   **Price/Money Fields**: **Medusa v2 Standard**. Money fields like `raw_amount` and `raw_unit_price` are using the `jsonb` data type (storing precision objects) rather than `NUMERIC(10,2)`. While normally an anti-pattern in Postgres, this is correct and required for Medusa v2's multi-currency and high-precision pricing architecture.
*   **Status Fields**: Medusa natively uses enums or constrained `varchar` for statuses (e.g., `order_status`, `payment_status`).
*   **Primary Keys (UUID vs String)**: **Medusa Standard**. Medusa uses prefixed strings (e.g., `prod_01...`, `cart_01...`) stored as `character varying` for Primary Keys, NOT native PostgreSQL `uuid` types. This is the intended framework behavior to make IDs globally unique and easily identifiable.

## STEP 3 — ISSUES REPORT

| Table | Issue | Severity | Fix |
| :--- | :--- | :--- | :--- |
| `order_line_item` | Missing index on FK `totals_id` | **HIGH** | `CREATE INDEX` |
| `fulfillment` | Missing index on FK `provider_id` | **HIGH** | `CREATE INDEX` |
| `fulfillment` | Missing index on FK `delivery_address_id` | **HIGH** | `CREATE INDEX` |
| `workflow_execution` | Unbounded growth | **MED** | Implement table partitioning or pruning cronjob |
| `product` / `site_chatbot_*` | `pgvector` extension installed but no vector indexes exist | **LOW** | Add embedding columns & HNSW index for vector search |

## STEP 4 — OPTIMIZATION RECOMMENDATIONS

### 1. High Severity Fixes (Missing Indexes)
Foreign keys without indexes cause full table scans during cascading deletes or reverse lookups. Execute the following to fix the **HIGH** severity issues:

```sql
-- Fix missing indexes on foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_line_item_totals_id ON public.order_line_item(totals_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fulfillment_provider_id ON public.fulfillment(provider_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fulfillment_delivery_address_id ON public.fulfillment(delivery_address_id);
```

### 2. Table Partitioning
As an e-commerce platform grows, certain tables accumulate massive amounts of historical data. Recommend partitioning by range (`created_at`):
*   `order` and related tables (`order_line_item`, `order_transaction`)
*   `workflow_execution` (Medusa v2 creates many workflow execution logs which should be partitioned by month and regularly dropped/archived).

### 3. pgvector Integration (HNSW vs IVFFlat)
The project stack lists `pgvector`, but no vector columns or indexes were found in the schema discovery. When implementing semantic search for products or the chatbot context:
*   Add a `vector(1536)` column (if using OpenAI embeddings).
*   **Recommendation**: Use **HNSW** (Hierarchical Navigable Small World) indexes rather than IVFFlat. HNSW provides better recall and doesn't require rebuilding the index as the dataset grows.
  
```sql
-- Example for product semantic search
ALTER TABLE public.product ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX ON public.product USING hnsw (embedding vector_cosine_ops);
```

### 4. Data Integrity Constraints
Ensure that JSONB money fields contain required keys to prevent application-level crashes.
```sql
-- Example: ensure raw_amount JSONB has 'value' and 'precision' keys
ALTER TABLE public.price ADD CONSTRAINT chk_price_raw_amount_format 
CHECK (raw_amount ? 'value' AND raw_amount ? 'precision');
```
