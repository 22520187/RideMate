# RideMate (SE405)

RideMate là dự án **ứng dụng đi chung xe** gồm:

- **Mobile app (Expo / React Native)**: `RideMate/`
- **Backend (Spring Boot / Java)**: `ridemate-server/`
- **Face Recognition microservice (Python / TensorFlow FaceNet)**: `ridemate-server/face-recognition-service/`

---

## Yêu cầu hệ thống

- **Node.js**: 18+ (để chạy Expo)
- **Java**: **21** (backend dùng Spring Boot 3.3.x)
- **PostgreSQL**: 14+ (khuyến nghị có **pgvector** nếu dùng eKYC/face verification)
- (Tuỳ chọn) **Docker Desktop**: để chạy face-recognition service

---

## Chạy nhanh (local)

### 1) Database (PostgreSQL + pgvector)

- Tạo database (ví dụ): `ridemate_db`
- (Tuỳ chọn) Enable `pgvector` và setup bằng script:

- File: `ridemate-server/setup_pgvector.sql`
- Gợi ý chạy:
  - `psql -U postgres -d ridemate_db -f setup_pgvector.sql`

### 2) (Tuỳ chọn) Face Recognition Service (Python)

Chạy bằng Docker (khuyến nghị):

```bash
cd ridemate-server/face-recognition-service
docker compose up -d
```

Mặc định service chạy tại `http://localhost:5000` (health check: `GET /health`).

Tài liệu chi tiết: `ridemate-server/face-recognition-service/README.md`

### 3) Backend (Spring Boot)

1) Tạo file env:

- Copy `ridemate-server/env.example` → `ridemate-server/.env`
- Điền tối thiểu: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`

2) Chạy backend:

```bash
cd ridemate-server
./mvnw spring-boot:run
```

- Base URL: `http://localhost:8080/api` (do backend cấu hình `server.servlet.context-path=/api`)
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`

### 4) Mobile App (Expo)

1) Tạo env cho app: tạo file `RideMate/.env` và set:

```
EXPO_PUBLIC_API_BASE_URL=http://10.200.100.56:8080/api
```

#### Lấy IPv4 trên Windows để thay vào URL (bắt buộc khi chạy trên máy thật)

- Mở PowerShell/CMD và chạy: `ipconfig`
- Tìm adapter đang dùng mạng (**Wi-Fi** hoặc **Ethernet**)
- Copy dòng **IPv4 Address** (ví dụ `10.200.100.56`)
- Gắn vào `.env` như trên: `http://<IPv4>:8080/api`

> Nếu bạn dùng Android emulator thì thường gọi host bằng `http://10.0.2.2:8080/api`.
> Nếu bị không gọi được backend từ máy thật, kiểm tra **Windows Firewall** (mở port 8080) và đảm bảo điện thoại + PC cùng mạng LAN.

2) Cài dependencies và chạy:

```bash
cd RideMate
npm install
npm run start
```

---

## Tài liệu liên quan

- Backend APIs (một phần): `ridemate-server/USER_MANAGEMENT_API.md`
- Diagram: `DIAGRAMS.md`

---

## Ghi chú (base URL)

- Backend đang dùng `server.servlet.context-path=/api` nên base URL chuẩn là `http://<host>:8080/api`
- Trong app mobile, nếu gặp lỗi kiểu `.../api/api/...` hoặc 404, hãy kiểm tra lại việc **endpoint có bị prefix `/api` 2 lần** hay không (tham khảo `RideMate/src/api/endpoints.js`).
