# 01 · Authentication — Luồng xác thực chi tiết

---

## 1. Luồng đăng ký Customer

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant SF as Frontend
    participant API as /auth/register
    participant DB as PostgreSQL

    U->>SF: Điền form đăng ký
    SF->>SF: Validate client-side (email format, password length)
    SF->>API: POST /auth/register {email, password, first_name, last_name, phone}

    alt Email đã tồn tại
        API-->>SF: 422 "Email already exists"
        SF-->>U: Hiển thị lỗi
    else Hợp lệ
        API->>API: Hash password (bcrypt)
        API->>DB: INSERT INTO customer
        DB-->>API: Customer record
        API-->>SF: 201 {customer}
        SF-->>U: Redirect → trang đăng nhập / trang chủ
    end
```

---

## 2. Luồng đăng nhập Customer

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant SF as Frontend
    participant API as /auth/login
    participant DB as PostgreSQL
    participant LS as localStorage

    U->>SF: Nhập email + password
    SF->>API: POST /auth/login {email, password}

    alt Sai thông tin
        API-->>SF: 401 "Invalid credentials"
        SF-->>U: Hiển thị lỗi "Sai email hoặc mật khẩu"
    else Đúng thông tin
        API->>DB: SELECT customer WHERE email = ?
        DB-->>API: Customer record
        API->>API: Verify bcrypt hash
        API->>API: Sign JWT {actor_id, actor_type, exp}
        API-->>SF: 200 {token, customer}
        SF->>LS: Lưu token vào localStorage
        SF-->>U: Redirect → trang trước đó / trang chủ
    end
```

---

## 3. Luồng xác thực request có token

```mermaid
flowchart TD
    A[Request đến API] --> B{Header có Authorization?}
    B -- Không --> C[Response 401 Unauthorized]
    B -- Có --> D{Decode JWT}
    D -- Lỗi / hết hạn --> C
    D -- OK --> E[Lấy actor_id từ payload]
    E --> F{actor_type?}
    F -- customer --> G[Load Customer từ DB]
    F -- admin --> H[Load Admin User từ DB]
    G --> I[Gắn ctx.customer vào request]
    H --> J[Load Role + Permissions]
    J --> K{rbacMiddleware: route permission match?}
    K -- Không --> L[Response 403 Forbidden]
    K -- Có --> M[Tiếp tục xử lý request]
    I --> M
```

---

## 4. Luồng đăng nhập Admin

```mermaid
sequenceDiagram
    participant ADM as Admin User
    participant UI as Admin SPA
    participant API as /admin/login
    participant DB as PostgreSQL
    participant RBAC as RBAC Module

    ADM->>UI: Nhập email + password
    UI->>API: POST /admin/login {email, password}
    API->>DB: SELECT user WHERE email = ?
    DB-->>API: User + role_id
    API->>API: Verify password
    API->>RBAC: Load role & permissions for role_id
    RBAC-->>API: {role, permissions[]}
    API-->>UI: 200 {user, token, permissions}
    UI->>UI: Lưu token, render menu theo permissions
    UI-->>ADM: Dashboard
```

---

## 5. Luồng logout

```mermaid
flowchart LR
    A[User nhấn Logout] --> B[Xóa token khỏi localStorage]
    B --> C[Clear React auth context]
    C --> D[Redirect về /login]
```

> **Lưu ý**: Hệ thống chưa có token blacklist. JWT hết hạn tự nhiên sau thời gian cấu hình.

---

## 6. Token refresh (nếu được implement)

> Hiện tại chưa implement refresh token. Khi JWT hết hạn, user phải đăng nhập lại.

**Khuyến nghị tương lai**:
- Implement `/auth/refresh` với refresh token (httpOnly cookie)
- Thời gian access token: 1 giờ
- Thời gian refresh token: 7 ngày

---

## 7. Bảo mật

| Biện pháp | Mô tả |
|---|---|
| Password hashing | bcrypt với salt rounds ≥ 10 |
| JWT signing | HS256 với secret key từ env |
| HTTPS | Bắt buộc trong production |
| Rate limiting | Giới hạn request login (tránh brute force) |
| Input sanitization | Validate & sanitize tất cả input |

---

## Liên kết

- [Auth README](./README.md)
- [RBAC](../05-admin/rbac.md)
