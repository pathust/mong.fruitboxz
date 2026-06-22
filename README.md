# Mọng Fruitboxz - E-commerce Platform

Hệ thống thương mại điện tử chuyên cung cấp trái cây tươi và hộp quà cao cấp, được xây dựng trên nền tảng **Medusa.js v2** và **React/Vite**.

## 🛠️ Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo máy bạn đã cài đặt các công cụ sau:
- **Node.js**: Phiên bản 20.x (>= 20 < 23)
- **Docker** và **Docker Compose**: Để chạy các dịch vụ nền (PostgreSQL, Redis, Meilisearch, MinIO)

---

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng

### 1. Khởi động Infrastructure (Database, Redis, Search, Storage)

Từ thư mục gốc của dự án, chạy lệnh Docker Compose để khởi chạy toàn bộ database và các dịch vụ đi kèm:

```bash
docker-compose up -d
```

Các dịch vụ sẽ chạy tại:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **MeiliSearch**: `localhost:7700`
- **MinIO**: `localhost:9000` (Console: `9002`)

### 2. Thiết lập Backend (Medusa v2)

Mở một terminal mới và di chuyển vào thư mục `backend`:

```bash
cd backend
```

Cài đặt các gói phụ thuộc:
```bash
npm install
```

Sao chép file cấu hình môi trường:
```bash
cp .env.example .env
```
*(Hãy kiểm tra lại nội dung file `.env` để đảm bảo các URL của DB và Redis khớp với cấu hình Docker của bạn)*

Chạy Migration và Seed dữ liệu ban đầu (Tạo bảng và dữ liệu mẫu):
```bash
npm run seed
```

Khởi động Backend server:
```bash
npm run dev
```
Backend sẽ mặc định chạy tại: **http://localhost:9000**

### 3. Thiết lập Frontend & Admin (React/Vite)

Mở một terminal mới và di chuyển vào thư mục `frontend`:

```bash
cd frontend
```

Cài đặt các gói phụ thuộc:
```bash
npm install
```

Sao chép file cấu hình môi trường (nếu có):
```bash
cp .env.example .env
```
*(Hãy đảm bảo `VITE_MEDUSA_BACKEND_URL` trỏ về đúng backend `http://localhost:9000`)*

Khởi động ứng dụng giao diện (Frontend + CMS):
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: **http://localhost:8000** (hoặc một port trống do Vite cấp, thông thường là 8000 hoặc 5173, bạn có thể xem trực tiếp trong log của terminal).

---

## 📋 Các lệnh Backend hữu ích khác

Trong thư mục `backend`, bạn có thể sử dụng các lệnh sau:

- **Build ứng dụng**: `npm run build`
- **Đồng bộ hình ảnh sản phẩm**: `npm run sync:product-images`
- **Cập nhật index cho thanh tìm kiếm**: `npm run search:reindex`
- **Khởi động server Production**: `npm run start`

---

## 🛑 Cách dừng toàn bộ ứng dụng

Để dừng ứng dụng:
1. Bấm `Ctrl + C` ở tất cả các tab terminal đang chạy `npm run dev`.
2. Dừng Docker containers (từ thư mục gốc):
```bash
docker-compose down
```
