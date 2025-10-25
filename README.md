# LearnMate Web - Admin & Staff Management System

Hệ thống quản lý web cho Admin và Staff với các chức năng đăng nhập, quản lý người dùng và quản lý sách.

## Tính năng chính

### 🔐 Authentication
- **Đăng nhập**: Form đăng nhập với email và mật khẩu
- **Lưu trữ token**: Tự động lưu access token và refresh token vào localStorage
- **Quản lý session**: Tự động kiểm tra và duy trì trạng thái đăng nhập

### 👨‍💼 Admin Dashboard
- **Quản lý người dùng**: Hiển thị danh sách người dùng với phân trang
- **Kích hoạt/Vô hiệu hóa tài khoản**: Button để bật/tắt trạng thái `isActive` của người dùng
- **Thay đổi vai trò**: Dropdown để chọn vai trò Admin hoặc Staff cho người dùng
- **Thông tin chi tiết**: Hiển thị tên, email, trạng thái xác thực, ngày tạo

### 📚 Staff Dashboard  
- **Quản lý sách**: Hiển thị danh sách sách với các thông tin chi tiết
- **Thêm sách mới**: Form để thêm sách với tên, tác giả, thể loại, ngày xuất bản
- **Cập nhật trạng thái**: Dropdown để thay đổi trạng thái sách (Có sẵn/Đã mượn/Bảo trì)
- **Xóa sách**: Button để xóa sách khỏi hệ thống
- **Thống kê**: Hiển thị số liệu tổng quan về sách

### 🚪 Logout
- **Đăng xuất**: Button logout ở góc phải màn hình
- **Xóa dữ liệu**: Tự động xóa token và thông tin user khỏi localStorage

## Cấu trúc dự án

```
src/
├── components/           # React components
│   ├── Login.tsx        # Component đăng nhập
│   ├── Login.css        # Styles cho Login
│   ├── AdminDashboard.tsx  # Dashboard cho Admin
│   ├── AdminDashboard.css # Styles cho Admin Dashboard
│   ├── StaffDashboard.tsx  # Dashboard cho Staff
│   └── StaffDashboard.css  # Styles cho Staff Dashboard
├── contexts/            # React Context
│   └── AuthContext.tsx  # Context quản lý authentication
├── services/           # API services
│   ├── axios.tsx       # Axios configuration
│   └── api.ts          # API functions
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
├── App.tsx             # Main App component
└── App.css             # Global styles
```

## API Endpoints

### Authentication
- `POST /api/User/login` - Đăng nhập
  - Request: `{ email: string, password: string }`
  - Response: `{ value: { accessToken, refreshToken, expiresAt, user }, isSuccess, isFailure, error }`

### User Management (Admin only)
- `GET /api/User/read` - Lấy danh sách người dùng
  - Query params: `pageNumber`, `pageSize`
- `PUT /api/User/role` - Cập nhật vai trò người dùng
  - Query params: `userId`, `roleName`
- `PUT /api/User/{userId}/activation` - Kích hoạt/vô hiệu hóa người dùng
  - Query params: `isActive`

## Cách sử dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy ứng dụng
```bash
npm run dev
```

### 3. Truy cập ứng dụng
Mở trình duyệt và truy cập `http://localhost:5173`

### 4. Đăng nhập
- Sử dụng email và mật khẩu hợp lệ để đăng nhập
- Sau khi đăng nhập thành công, hệ thống sẽ tự động điều hướng đến dashboard phù hợp với vai trò

## Vai trò người dùng

### Admin
- Có quyền truy cập Admin Dashboard
- Có thể quản lý tất cả người dùng trong hệ thống
- Có thể kích hoạt/vô hiệu hóa tài khoản người dùng
- Có thể thay đổi vai trò người dùng

### Staff  
- Có quyền truy cập Staff Dashboard
- Có thể quản lý sách trong hệ thống
- Có thể thêm, sửa, xóa sách
- Có thể cập nhật trạng thái sách

## Công nghệ sử dụng

- **React 19** - Frontend framework
- **TypeScript** - Type safety
- **Axios** - HTTP client
- **CSS3** - Styling
- **Vite** - Build tool

## Lưu ý

- Đảm bảo backend API đang chạy trên `http://localhost:2406`
- Token được lưu trong localStorage và tự động gửi kèm trong các request
- Ứng dụng hỗ trợ responsive design
- Tất cả form đều có validation cơ bản