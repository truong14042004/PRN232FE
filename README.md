# Parking Manager — Frontend

Giao diện quản trị cho hệ thống quản lý bãi đỗ xe **Parking Manager** (backend microservices ASP.NET Core). Ứng dụng dành cho các vai trò Quản trị viên, Quản lý cơ sở và Nhân viên bãi.

## Công nghệ

- **React 18** + **Vite 5** (JavaScript)
- **Tailwind CSS 3** + `tailwindcss-animate`
- **Framer Motion** — hiệu ứng chuyển động
- **TanStack Query** — fetch & cache dữ liệu
- **React Router 6** — định tuyến
- **React Hook Form** — quản lý form
- **Axios** — gọi API (tự refresh token)
- **Recharts** — biểu đồ dashboard/báo cáo
- **@microsoft/signalr** — cập nhật sơ đồ bãi theo thời gian thực
- **lucide-react** — icon, **react-hot-toast** — thông báo

## Yêu cầu

- Node.js 18+ (khuyến nghị 20/22)
- Backend Parking Manager chạy qua API Gateway tại `http://localhost:5000`

## Cài đặt & chạy

```bash
npm install

# Sao chép biến môi trường rồi chỉnh nếu cần
cp .env.example .env

# Chạy môi trường phát triển (http://localhost:3000)
npm run dev

# Build production
npm run build

# Xem thử bản build
npm run preview
```

### Biến môi trường

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `VITE_API_BASE_URL` | `http://localhost:5000` | URL API Gateway (Ocelot) |
| `VITE_PARKING_HUB_URL` | `http://localhost:5002` | URL dịch vụ Parking cho SignalR (nối thẳng, không qua gateway) |

Khi chạy `npm run dev`, Vite cũng proxy mọi request `/api` sang `http://localhost:5000` để tránh CORS.

> **Lưu ý SignalR:** sơ đồ bãi realtime kết nối thẳng tới dịch vụ Parking (`VITE_PARKING_HUB_URL`) thay vì qua gateway, vì Ocelot không proxy tốt WebSocket kèm `access_token`. Token được nạp động qua `accessTokenFactory`.

## Chức năng theo vai trò

| Trang | Đường dẫn | Vai trò được phép |
|-------|-----------|-------------------|
| Tổng quan (Dashboard) | `/` | Admin, FacilityManager |
| Sơ đồ bãi (realtime) | `/parking-map` | Admin, FacilityManager, ParkingStaff, Driver |
| Phiên gửi xe | `/sessions` | Admin, FacilityManager, ParkingStaff |
| Đặt chỗ | `/reservations` | Admin, FacilityManager, ParkingStaff, Driver |
| Thanh toán | `/payments` | Admin, FacilityManager, ParkingStaff |
| Phương tiện | `/vehicles` | Admin, FacilityManager, ParkingStaff |
| Vé tháng | `/subscriptions` | Admin, FacilityManager, ParkingStaff |
| Tòa nhà | `/buildings` | Admin, FacilityManager |
| Loại xe | `/vehicle-types` | Admin, FacilityManager |
| Tầng | `/floors` | Admin, FacilityManager |
| Khu vực | `/zones` | Admin, FacilityManager |
| Cổng | `/gates` | Admin, FacilityManager |
| Chỗ đỗ | `/parking-slots` | Admin, FacilityManager |
| Chính sách phí | `/fee-policies` | Admin, FacilityManager |
| Báo cáo | `/reports` | Admin, FacilityManager |
| Người dùng | `/users` | Admin |

**Vận hành**
- **Sơ đồ bãi**: hiển thị lưới chỗ đỗ theo tầng, tô màu theo trạng thái, cập nhật realtime qua SignalR khi xe vào/ra.
- **Phiên gửi xe**: cho xe vào (tự chọn hoặc chỉ định chỗ), cho xe ra kèm tính phí, đổi chỗ, xem chi tiết.
- **Đặt chỗ**: tạo/sửa, xác nhận, hủy, đánh dấu hết hạn.
- **Thanh toán**: lọc theo biển số/trạng thái, tạo giao dịch, xác nhận, hủy, tạo link PayOS, xem chi tiết.

**Khách hàng**
- **Phương tiện**: CRUD hồ sơ xe và thông tin chủ xe.
- **Vé tháng**: tạo/sửa, gia hạn (1–12 tháng), tạm ngưng, hủy.

**Cấu hình**
- **Tòa nhà / Loại xe / Tầng / Khu vực / Cổng**: CRUD master data của bãi đỗ.
- **Chỗ đỗ**: CRUD từng chỗ, đổi trạng thái nhanh, sinh lưới hàng loạt.
- **Chính sách phí**: CRUD bảng giá + công cụ tính phí theo thời gian.

**Hệ thống**
- **Báo cáo**: doanh thu, lưu lượng xe, vé tháng, hiện trạng chỗ đỗ theo khoảng ngày.
- **Người dùng**: CRUD tài khoản, gán nhiều vai trò, kích hoạt/vô hiệu hóa.

## Cấu trúc thư mục

```txt
src/
├── components/
│   ├── layout/      # Sidebar, Topbar, AppLayout, ProtectedRoute, ChangePasswordModal
│   └── ui/          # Button, Input, Select, Modal, Table, Badge, Card, ...
├── context/         # AuthContext (đăng nhập, phân quyền)
├── hooks/           # useOptions (danh mục dropdown), useParkingMapHub (SignalR)
├── lib/             # apiClient (axios + refresh), enums, format, cn, signalr
├── pages/
│   ├── auth/            # Login, Register
│   ├── parking-map/     # Sơ đồ bãi realtime (grid + SignalR)
│   ├── sessions/        # Phiên gửi xe (check-in/out, đổi chỗ)
│   ├── reservations/    # Đặt chỗ trước
│   ├── vehicles/        # Phương tiện
│   ├── payments/        # Thanh toán
│   ├── subscriptions/   # Vé tháng
│   ├── fee-policies/    # Chính sách phí
│   ├── buildings/       # Tòa nhà
│   ├── vehicle-types/   # Loại xe
│   ├── floors/          # Tầng
│   ├── zones/           # Khu vực
│   ├── gates/           # Cổng
│   ├── parking-slots/   # Chỗ đỗ (CRUD + sinh lưới)
│   ├── reports/         # Báo cáo
│   └── users/           # Người dùng
├── services/        # Lớp gọi API theo từng domain
├── App.jsx          # Định tuyến
└── main.jsx         # Entry + providers
```

## Xác thực

- Đăng nhập/đăng ký nhận `accessToken` + `refreshToken`, lưu ở `localStorage`.
- Axios tự đính kèm `Authorization: Bearer <token>` và tự động refresh khi gặp 401 (có hàng đợi request để tránh refresh nhiều lần).
- Tài khoản đăng ký mới mặc định vai trò **Driver** — cần Admin cấp thêm quyền để truy cập các trang quản trị.

## Ghi chú

- Toàn bộ dịch vụ Parking (tòa nhà, loại xe, tầng, khu vực, cổng, chỗ đỗ, phương tiện, phiên gửi xe, đặt chỗ, sơ đồ bãi realtime) đã được tích hợp đầy đủ theo các controller backend.
- Sơ đồ bãi cập nhật theo thời gian thực qua SignalR: khi một chỗ đỗ đổi trạng thái (xe vào/ra, đổi chỗ...), ô tương ứng trên sơ đồ tự cập nhật mà không cần tải lại trang.
- Các giá trị enum (trạng thái chỗ đỗ, phiên, đặt chỗ, loại cổng...) được ánh xạ sang nhãn tiếng Việt + màu badge trong `src/lib/enums.js`.
