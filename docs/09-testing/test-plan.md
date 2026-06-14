# 09 · Testing — Test Plan

> Kế hoạch kiểm thử toàn diện cho hệ thống Mong Fruitboxz.

---

## 1. Phạm vi kiểm thử

| Loại test | Công cụ | Phạm vi |
|---|---|---|
| Unit Test | Jest / Vitest | Business logic, utilities, helper functions |
| Integration Test | Jest + Supertest | API endpoints, DB interactions |
| E2E Test | Playwright | User flows quan trọng |
| Manual Test | Checklist | Edge cases, UX review |

---

## 2. Test Environments

| Environment | URL | DB | Mô tả |
|---|---|---|---|
| `development` | localhost:9000 | Local Postgres | Dev local |
| `staging` | staging.mong.vn | Staging DB | Pre-production |
| `production` | mong.vn | Production DB | Live |

---

## 3. Module Test Coverage

### 3.1 AUTH Module

| Test case | Loại | Priority |
|---|---|---|
| Đăng ký với email hợp lệ → 201 | Integration | P0 |
| Đăng ký email đã tồn tại → 422 | Integration | P0 |
| Đăng nhập đúng → nhận JWT | Integration | P0 |
| Đăng nhập sai mật khẩu → 401 | Integration | P0 |
| Request với token hợp lệ → pass | Integration | P0 |
| Request với token hết hạn → 401 | Integration | P0 |
| Admin login → nhận token + permissions | Integration | P0 |
| Admin route không đủ quyền → 403 | Integration | P0 |
| Decode JWT lấy actor_id đúng | Unit | P1 |
| Password bcrypt hash verify | Unit | P1 |

### 3.2 PRODUCTS Module

| Test case | Loại | Priority |
|---|---|---|
| Lấy danh sách products (published only) | Integration | P0 |
| Tìm kiếm fulltext | Integration | P1 |
| Filter theo category | Integration | P1 |
| Phân trang đúng offset/limit | Integration | P1 |
| Tạo product (admin) → 201 | Integration | P0 |
| Publish product thiếu variant → 422 | Integration | P0 |
| Upload ảnh → S3 URL trả về | Integration | P1 |
| Product draft không hiển thị storefront | Integration | P0 |
| Variant out_of_stock flag đúng | Unit | P0 |

### 3.3 CART & CHECKOUT Module

| Test case | Loại | Priority |
|---|---|---|
| Thêm item vào cart → lưu localStorage | Unit | P0 |
| Cập nhật quantity | Unit | P0 |
| Xóa item khỏi cart | Unit | P0 |
| Clear cart sau checkout | Unit | P0 |
| Shipping quote API thành công | Integration | P0 |
| Shipping quote API lỗi → fallback Haversine | Unit | P0 |
| Haversine tính đúng khoảng cách | Unit | P0 |
| Promotion validate hợp lệ | Integration | P0 |
| Promotion hết hạn → 400 | Integration | P0 |
| Checkout: server lấy giá từ DB | Integration | P0 |
| Checkout: variant hết hàng → 422 | Integration | P0 |
| Checkout: tạo order đúng status | Integration | P0 |
| Checkout: discount phân bổ đúng | Unit | P0 |
| Checkout: response có VietQR info | Integration | P0 |
| Checkout: tổng tiền = subtotal - discount + ship | Unit | P0 |

### 3.4 ORDERS Module

| Test case | Loại | Priority |
|---|---|---|
| Admin xem danh sách đơn | Integration | P0 |
| Admin filter theo status | Integration | P1 |
| Cập nhật payment_status=paid | Integration | P0 |
| Cập nhật fulfillment_status=shipped | Integration | P0 |
| Complete order khi chưa paid → lỗi | Integration | P0 |
| Cancel order đã ship → lỗi | Integration | P0 |
| Archive order | Integration | P1 |

### 3.5 RBAC Module

| Test case | Loại | Priority |
|---|---|---|
| Staff không có products:delete → 403 | Integration | P0 |
| Admin có tất cả products:* | Integration | P0 |
| Gán role mới cho user | Integration | P0 |
| Tạo role custom với permissions | Integration | P0 |
| User không có role → mọi route 403 | Integration | P0 |

### 3.6 SITE Module

| Test case | Loại | Priority |
|---|---|---|
| Lấy banners active | Integration | P0 |
| Banner inactive không trả về storefront | Integration | P0 |
| Gửi review (customer đã mua) → thành công | Integration | P0 |
| Gửi review (chưa mua) → 403 | Integration | P0 |
| Admin duyệt review → approved=true | Integration | P1 |
| Chatbot log lưu đúng message | Integration | P1 |
| Site settings update | Integration | P0 |

### 3.7 FINANCE Module

| Test case | Loại | Priority |
|---|---|---|
| Finance summary tính đúng revenue | Integration | P0 |
| Profit tính với cost_price | Unit | P0 |
| Profit fallback với default_cost_percent | Unit | P0 |
| Filter theo date range | Integration | P1 |
| Top products sort đúng | Integration | P1 |
| Settings update → cost thay đổi ngay | Integration | P0 |

---

## 4. Test Data Setup

### Seed data cần có

```
Roles: Super Admin, Admin, Staff, Finance
Users: 1 per role
Categories: Hộp tiêu chuẩn, Trái cây đơn, Custom
Products: ≥5 published, 2 draft, 1 archived
Variants: ≥2 per product, với cost_price
Promotions: 1 active percentage, 1 active fixed, 1 expired
Customers: ≥3 (có order lịch sử)
Orders: 2 pending, 2 completed, 1 canceled
Banners: 3 active, 1 inactive
```

---

## 5. CI/CD Integration

```yaml
# Pseudo CI config
test-pipeline:
  stages:
    - lint:      eslint, prettier check
    - unit:      jest --testPathPattern=*.unit.test.ts
    - integration: jest --testPathPattern=*.integration.test.ts (với test DB)
    - e2e:       playwright (staging env)
```

---

## 6. Performance Benchmarks

| Endpoint | Target P95 | Target P99 |
|---|---|---|
| `GET /store/products` | < 200ms | < 500ms |
| `GET /store/products/:id` | < 100ms | < 300ms |
| `POST /store/checkout` | < 1000ms | < 2000ms |
| `POST /store/shipping/quote` | < 500ms | < 1000ms |
| `GET /admin/finance/summary` | < 500ms | < 1000ms |

---

## 7. Security Test Checklist

| Kiểm tra | Loại |
|---|---|
| SQL injection prevention | Security |
| XSS input sanitization | Security |
| JWT tamper detection | Security |
| Brute force login protection | Security |
| Unauthorized order access | Authorization |
| Admin cannot access other admin's data | Authorization |
| S3 URL not guessable | Security |
| Sensitive data không trả về (password_hash) | Security |

---

## 8. Liên kết

- [E2E Scenarios](./e2e-scenarios.md)
- [Auth flows](../01-auth/flows.md)
