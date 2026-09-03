# 01 · Authentication — Tổng quan

> Module xác thực phân hai loại actor: **Customer** (khách hàng frontend) và **Admin** (quản trị viên). Cả hai đều dùng cơ chế auth có sẵn của **Medusa v2** (`@medusajs/framework`), không phải route tự viết — nên endpoint theo đúng quy ước v2 (`/auth/<actor_type>/<provider>`), khác với Medusa v1.

---

## 1. Tổng quan

| Đặc điểm | Customer | Admin |
|---|---|---|
| Đăng ký | `POST /auth/customer/emailpass/register` rồi `POST /store/customers` | Không tự đăng ký — tạo qua seed script hoặc admin khác |
| Đăng nhập | `POST /auth/customer/emailpass` | `POST /auth/user/emailpass` |
| Token type | JWT (HS256) | JWT (HS256), cùng cơ chế với customer |
| Lưu trữ token (frontend) | `localStorage["customer_token"]` | `localStorage["admin_token"]` + `localStorage["admin_user"]` |
| Phân quyền | Không (chỉ xác định danh tính) | RBAC — xem [RBAC](../05-admin/rbac.md) |

---

## 2. Customer Authentication

### 2.1 Đăng ký — 2 bước bắt buộc

Medusa v2 tách đăng ký thành **2 lời gọi**: đăng ký danh tính (auth identity) trước, tạo customer sau, dùng token của bước 1 để xác thực bước 2. Gọi thẳng `POST /store/customers` với password mà bỏ qua bước 1 sẽ luôn nhận `401 Unauthorized` — đây từng là bug thật trong `frontend/src/pages/Register.jsx`, đã sửa.

**Bước 1 — Đăng ký danh tính**

`POST /auth/customer/emailpass/register`

```json
{ "email": "customer@example.com", "password": "password123" }
```

Response `200`:
```json
{ "token": "eyJhbGciOi..." }
```
Token này là **registration token** — payload có `actor_id` rỗng (`""`), chỉ dùng được cho bước 2.

Lỗi thường gặp: `401 { "type": "unauthorized", "message": "Identity with email already exists" }` khi email đã đăng ký.

**Bước 2 — Tạo customer**

`POST /store/customers` với header `Authorization: Bearer <token bước 1>`

```json
{ "email": "customer@example.com", "first_name": "Nguyễn", "last_name": "Văn A", "phone": "0901234567" }
```
(không cần gửi lại `password` — đã set ở bước 1)

Response `200`:
```json
{
  "data": {
    "customer": {
      "id": "cus_01XXXXX",
      "email": "customer@example.com",
      "first_name": "Nguyễn",
      "last_name": "Văn A",
      "has_account": true,
      "created_at": "...",
      "addresses": []
    }
  },
  "error": null,
  "meta": null
}
```

**Bước 3 — Đăng nhập** (frontend gọi ngay sau bước 2 để lấy token phiên đầy đủ, xem 2.2)

### 2.2 Đăng nhập

**Endpoint**: `POST /auth/customer/emailpass`

**Request Body**:
```json
{ "email": "customer@example.com", "password": "password123" }
```

**Response** (`200`):
```json
{ "token": "eyJhbGciOi..." }
```
Response **không** có object `customer` đi kèm (khác doc cũ) — chỉ có `token`. Frontend tự giải mã JWT để lấy `id`/`email` hiển thị (xem `AuthContext.jsx`'s `buildCustomerFromToken`).

Lỗi sai mật khẩu: `401 { "type": "unauthorized", "message": "Invalid email or password" }`.

### 2.3 JWT Token Structure (thật, đã verify)

```json
{
  "actor_id": "cus_01XXXXX",
  "actor_type": "customer",
  "auth_identity_id": "authid_01XXXXX",
  "auth_provider": "emailpass",
  "app_metadata": { "customer_id": "cus_01XXXXX" },
  "user_metadata": {},
  "iat": 1788395621,
  "exp": 1788482021
}
```

- `actor_id` → id customer, dùng để tra DB
- Token lưu tại `localStorage` key **`customer_token`** (không phải `medusa_customer_token`)
- Mọi request authenticated gửi header: `Authorization: Bearer <token>`

---

## 3. Admin Authentication

### 3.1 Đăng nhập Admin

**Endpoint**: `POST /auth/user/emailpass` (không phải `/admin/login`)

**Request Body**:
```json
{ "email": "admin@mongfruitbox.com", "password": "adminpass" }
```

**Response** (`200`):
```json
{ "token": "eyJhbGciOi..." }
```
Cũng chỉ trả về `token`, không có object `user`. Frontend tự decode JWT (`app_metadata.user_id`) để dựng thông tin user, lưu vào `localStorage["admin_token"]` + `localStorage["admin_user"]`.

### 3.2 Lấy quyền sau khi đăng nhập

Ngay sau login, frontend gọi thêm `GET /admin/users/me/permissions` (yêu cầu Bearer token vừa nhận) để lấy danh sách quyền thật của user:

```json
{ "permissions": ["orders.read", "orders.edit", "products.read", "..."] }
```

`/admin/users/me*` được loại trừ khỏi kiểm tra RBAC (xem [RBAC](../05-admin/rbac.md)) nên gọi được ngay sau khi có token, không cần quyền gì thêm.

### 3.3 Admin Middleware Stack

Mọi route `/admin/*` đi qua:
1. `authenticate("user", ["bearer", "session"])` → xác thực token
2. `rbacMiddleware` → kiểm tra permission theo route (trừ `/admin/users/me*` và `/admin/auth*`)

---

## 4. Data Models

### Customer (bảng `customer`, core Medusa)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | string | PK, format `cus_XXXX` |
| `email` | string | Unique |
| `first_name` / `last_name` | string | |
| `phone` | string | nullable |
| `has_account` | boolean | true nếu có auth identity liên kết |
| `created_at` / `updated_at` | timestamp | |

Mật khẩu **không** nằm trên bảng `customer` — nó thuộc bảng `auth_identity`/`provider_identity` (module Auth riêng của Medusa), liên kết qua `auth_identity.app_metadata.customer_id`.

### Admin User (bảng `user`, core Medusa)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | string | PK, format `user_XXXX` |
| `email` | string | Unique |
| `first_name` / `last_name` | string | |
| `metadata.roles` | string[] | Mảng **id** các role (RBAC module, không phải cột riêng) |

---

## 5. Edge Cases & Validation

| Tình huống | Xử lý |
|---|---|
| Email đã tồn tại khi đăng ký (bước 1) | `401`, `message: "Identity with email already exists"` |
| Sai mật khẩu khi đăng nhập | `401`, `message: "Invalid email or password"` |
| Gọi `POST /store/customers` không kèm registration token | `401 Unauthorized` |
| Token hết hạn | `401`, frontend tự xóa token khỏi `localStorage` và redirect |
| Token bị giả mạo / không decode được | `401` |
| Admin không đủ quyền cho route | `403 Forbidden` (xem RBAC) |

---

## 6. Liên kết

- [Flows chi tiết](./flows.md)
- [RBAC Admin](../05-admin/rbac.md)
