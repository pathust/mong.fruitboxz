# 02 · Products — State Machine

> Mô tả các trạng thái của sản phẩm và transition rules.

---

## 1. Product Status

### Trạng thái

| Status | Mô tả | Hiển thị Storefront | Có thể đặt hàng |
|---|---|---|---|
| `draft` | Đang soạn thảo, chưa phát hành | ❌ | ❌ |
| `published` | Đang bán, công khai | ✅ | ✅ |
| `archived` | Ngừng kinh doanh | ❌ | ❌ |

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> draft : Tạo sản phẩm mới

    draft --> published : Admin publish\n(có ≥1 variant, có giá)
    published --> draft : Admin unpublish
    published --> archived : Admin archive\n(ngừng kinh doanh)
    archived --> draft : Admin restore
    archived --> [*] : Admin delete\n(nếu chưa có order)

    draft --> [*] : Admin delete
```

---

## 2. Inventory Status (Variant Level)

### Logic tính trạng thái tồn kho

```mermaid
flowchart TD
    A[inventory_quantity] --> B{> 0?}
    B -- Có --> C{allow_backorder?}
    B -- Không --> D{allow_backorder?}
    C -- Không quan tâm --> E["in_stock ✅"]
    D -- true --> F["backorder ⚠️\n(Đặt được, giao sau)"]
    D -- false --> G["out_of_stock ❌\n(Không đặt được)"]
```

### Bảng trạng thái tồn kho

| Tình huống | `inventory_quantity` | `allow_backorder` | Trạng thái hiển thị |
|---|---|---|---|
| Còn hàng | > 0 | any | ✅ Còn hàng |
| Hết hàng, không backorder | 0 | false | ❌ Hết hàng |
| Hết hàng, có backorder | 0 | true | ⚠️ Đặt trước |

---

## 3. Product → Variant Lifecycle

```mermaid
sequenceDiagram
    participant ADM as Admin
    participant PROD as Product
    participant VAR as Variant

    ADM->>PROD: Tạo product (status=draft)
    ADM->>VAR: Thêm variant + giá
    ADM->>PROD: Publish (status=published)
    Note over PROD,VAR: Sản phẩm hiển thị storefront

    ADM->>VAR: Cập nhật inventory_quantity
    Note over VAR: Tồn kho thay đổi real-time

    ADM->>PROD: Archive (status=archived)
    Note over PROD: Ẩn khỏi storefront
```

---

## 4. Transition Rules

### Điều kiện để Publish

Sản phẩm chỉ có thể chuyển sang `published` khi:
1. Có ít nhất **1 variant**
2. Mỗi variant có ít nhất **1 giá** hợp lệ
3. Có **thumbnail** hoặc ít nhất 1 ảnh
4. `title` không rỗng

### Điều kiện để Delete

Sản phẩm chỉ có thể xóa hoàn toàn khi:
- Không có **order item** nào tham chiếu đến variant của sản phẩm này
- Hoặc admin có quyền `products:force_delete`

Nếu đã có order → chỉ được **archive**, không được xóa.

---

## 5. Inventory Adjustment

```mermaid
stateDiagram-v2
    [*] --> in_stock : inventory_quantity > 0

    in_stock --> out_of_stock : Đặt hàng / Admin giảm tồn kho\n→ quantity = 0, allow_backorder=false
    in_stock --> backorder : quantity = 0, allow_backorder=true
    out_of_stock --> in_stock : Admin nhập thêm hàng
    backorder --> in_stock : Admin nhập thêm hàng
    out_of_stock --> backorder : Admin bật allow_backorder
    backorder --> out_of_stock : Admin tắt allow_backorder
```

---

## 6. Liên kết

- [Products README](./README.md)
- [Orders (fulfillment status)](../04-orders/status-machine.md)
