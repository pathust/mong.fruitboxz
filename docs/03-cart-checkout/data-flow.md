# 03 · Cart & Checkout — Data Flow

> Sơ đồ luồng dữ liệu chi tiết từ khi thêm sản phẩm đến khi hoàn thành đặt hàng.

---

## 1. Luồng đầy đủ Cart → Checkout

```mermaid
sequenceDiagram
    participant U as Khách hàng
    participant SF as Frontend (React)
    participant LS as localStorage
    participant SHIP as /store/shipping/quote
    participant PROMO as /store/promotions/validate
    participant CHK as /store/checkout
    participant DB as PostgreSQL

    U->>SF: Nhấn "Thêm vào giỏ"
    SF->>LS: Upsert CartItem {variantId, qty, price, ...}
    SF-->>U: Cập nhật icon giỏ hàng

    U->>SF: Mở trang Checkout
    SF->>LS: Đọc cart items
    SF-->>U: Hiển thị danh sách sản phẩm + giá tạm

    U->>SF: Nhập địa chỉ giao hàng
    Note over SF: debounce 260ms
    SF->>SHIP: POST /store/shipping/quote {address, lat, lng}
    alt API OK
        SHIP-->>SF: {fee, distance_km}
    else API lỗi
        SF->>SF: Tự tính Haversine (fallback)
    end
    SF-->>U: Hiển thị phí vận chuyển

    U->>SF: Nhập mã khuyến mại
    SF->>PROMO: POST /store/promotions/validate {code, subtotal}
    alt Mã hợp lệ
        PROMO-->>SF: {valid:true, discount_amount}
        SF-->>U: Hiển thị giảm giá
    else Mã không hợp lệ
        PROMO-->>SF: {valid:false, reason}
        SF-->>U: Hiển thị lỗi mã
    end

    U->>SF: Nhấn "Đặt hàng"
    SF->>CHK: POST /store/checkout {items, shipping, promotion_code}
    CHK->>DB: Kiểm tra variants + tồn kho
    CHK->>DB: Lấy giá từ DB
    CHK->>DB: Validate promotion
    CHK->>DB: INSERT Order (pending, not_paid, not_fulfilled)
    CHK-->>SF: {order, summary, vietqr}
    SF->>LS: Xóa cart (clear localStorage)
    SF-->>U: Hiển thị trang thành công + QR thanh toán
```

---

## 2. Luồng cập nhật Cart

```mermaid
flowchart TD
    A{Hành động người dùng} --> B[Thêm sản phẩm]
    A --> C[Tăng số lượng]
    A --> D[Giảm số lượng]
    A --> E[Xóa sản phẩm]
    A --> F[Xóa toàn bộ giỏ]

    B --> G[CartContext.addItem]
    C --> H[CartContext.updateQty]
    D --> H
    E --> I[CartContext.removeItem]
    F --> J[CartContext.clearCart]

    G --> K[Upsert vào localStorage]
    H --> L{qty > 0?}
    L -- Có --> K
    L -- Không --> M[Xóa item]
    M --> K
    I --> N[Lọc bỏ item]
    N --> K
    J --> O[Set cart = empty array]
    O --> K

    K --> P[Re-render UI]
```

---

## 3. Luồng tính Shipping Fee (Chi tiết)

```mermaid
flowchart TD
    A[User nhập địa chỉ] --> B{Có lat/lng chính xác?}
    B -- Không --> C[Geocoding: Gọi Maps API\nhoặc yêu cầu chọn trên map]
    B -- Có --> D[Debounce 260ms]
    C --> D
    D --> E[POST /store/shipping/quote]
    E --> F{API response?}
    F -- Success --> G[Hiển thị fee chính xác]
    F -- Error/Timeout --> H[Tính Haversine client-side]
    H --> I[Hiển thị fee + label '(ước tính)']

    G --> J[Lưu fee vào checkout state]
    I --> J
```

---

## 4. Luồng phân bổ Discount

Server phân bổ discount tỷ lệ theo giá trị từng item:

```
Ví dụ:
  Item A: 300,000 VND (60%)
  Item B: 200,000 VND (40%)
  Subtotal: 500,000 VND
  Discount: 100,000 VND

  → Item A discount: 60,000 VND
  → Item B discount: 40,000 VND

  Công thức: item_discount = discount * (item_total / subtotal)
  Làm tròn: item_discount = floor(item_discount)
  Remainder: phân bổ cho item đắt nhất
```

```mermaid
flowchart LR
    A[Total Discount D] --> B[Tính ratio = item_total / subtotal]
    B --> C[item_discount = floor D * ratio]
    C --> D{Tổng đã phân bổ == D?}
    D -- Không --> E[Phần dư → item đắt nhất]
    D -- Có --> F[Hoàn thành]
    E --> F
```

---

## 5. State Management Cart (React)

```typescript
// Cart Context State
interface CartState {
  items: CartItem[];
  shippingFee: number | null;
  shippingEstimated: boolean;
  promotionCode: string | null;
  promotionDiscount: number;
  shippingAddress: ShippingAddress | null;
}

// Computed values (derived state)
const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
const total = subtotal - promotionDiscount + (shippingFee ?? 0);
const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
```

---

## 6. Trang xác nhận đặt hàng thành công

```mermaid
flowchart TD
    A[POST /store/checkout OK] --> B[Clear localStorage cart]
    B --> C[Navigate to /order-success/:orderId]
    C --> D{Render Success Page}
    D --> E[Hiển thị Order ID + tóm tắt]
    D --> F[Hiển thị VietQR Image]
    D --> G[Hiển thị thông tin chuyển khoản:\nNgân hàng, STK, Tên TK, Số tiền, Nội dung]
    D --> H[Nút: Xem đơn hàng của tôi]
    D --> I[Timer: QR hết hạn sau X phút]
```

---

## 7. Cấu trúc localStorage

```
Key: "mong_cart"
Value: JSON string

{
  "items": [
    {
      "id": "uuid-v4",
      "variantId": "variant_01XXX",
      "productId": "prod_01XXX",
      "title": "Hộp Premium - Nhỏ",
      "price": 150000,
      "quantity": 2,
      "image": "https://s3.../img.jpg"
    }
  ],
  "updatedAt": "2026-06-06T10:00:00Z"
}
```

---

## 8. Liên kết

- [Cart Checkout README](./README.md)
- [Orders](../04-orders/README.md)
