# 01 · Authentication — Tổng quan

> Module xác thực phân hai loại actor: **Customer** (khách hàng storefront) và **Admin** (quản trị viên).

---

## 1. Tổng quan

| Đặc điểm | Customer | Admin |
|---|---|---|
| Đăng ký | `/auth/register` | Không tự đăng ký |
| Đăng nhập | `/auth/login` | `/admin/login` |
| Token type | JWT | Session / Bearer token |
| Lưu trữ token | `localStorage` | Cookie / Header |
| Phân quyền | Không (chỉ xác định danh tính) | RBAC (Role-Based Access Control) |

---

## 2. Customer Authentication

### 2.1 Đăng ký

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "first_name": "Nguyễn",
  "last_name": "Văn A",
  "phone": "0901234567"
}
```

**Response** (201):
```json
{
  "customer": {
    "id": "cus_01XXXXX",
    "email": "customer@example.com",
    "first_name": "Nguyễn",
    "last_name": "Văn A"
  }
}
```

**Validation rules**:
- `email`: bắt buộc, unique, định dạng email hợp lệ
- `password`: bắt buộc, tối thiểu 8 ký tự
- `first_name`, `last_name`: bắt buộc

### 2.2 Đăng nhập

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": "cus_01XXXXX",
    "email": "customer@example.com"
  }
}
```

### 2.3 JWT Token Structure

```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: {
  "actor_id": "cus_01XXXXX",
  "actor_type": "customer",
  "iat": 1720000000,
  "exp": 1720086400
}
```

- `actor_id` → dùng để lấy thông tin customer từ DB
- Token lưu tại `localStorage` key: `medusa_customer_token`
- Mọi request authenticated gửi header: `Authorization: Bearer <token>`

---

## 3. Admin Authentication

### 3.1 Đăng nhập Admin

**Endpoint**: `POST /admin/login`

**Request Body**:
```json
{
  "email": "admin@mong.vn",
  "password": "adminpass"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "user_01XXXXX",
    "email": "admin@mong.vn",
    "role": "admin"
  },
  "token": "..."
}
```

### 3.2 Admin Middleware Stack

Mọi route `/admin/*` đi qua:
1. `authenticate` middleware → xác thực token
2. `rbacMiddleware` → kiểm tra permission theo route

---

## 4. Data Models

### Customer

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | string | PK, format `cus_XXXX` |
| `email` | string | Unique |
| `password_hash` | string | Bcrypt hash |
| `first_name` | string | Tên |
| `last_name` | string | Họ |
| `phone` | string | SĐT (nullable) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### Admin User

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | string | PK |
| `email` | string | Unique |
| `password_hash` | string | |
| `role_id` | string | FK → Role |
| `first_name` | string | |
| `last_name` | string | |

---

## 5. Edge Cases & Validation

| Tình huống | Xử lý |
|---|---|
| Email đã tồn tại khi đăng ký | HTTP 422, message: "Email already exists" |
| Sai mật khẩu khi đăng nhập | HTTP 401, message: "Invalid credentials" |
| Token hết hạn | HTTP 401, frontend redirect về `/login` |
| Token bị giả mạo | HTTP 401, token không decode được |
| Admin không đủ quyền | HTTP 403, message: "Forbidden" |

---

## 6. Liên kết

- [Flows chi tiết](./flows.md)
- [RBAC Admin](../05-admin/rbac.md)
