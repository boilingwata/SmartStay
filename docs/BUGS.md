# 🐛 Quản lý Lỗi (Bug Tracker)

Tài liệu này dùng để ghi nhận các lỗi được phát hiện trong hệ thống để đội ngũ Developer có thể theo dõi và khắc phục.

## 📊 Danh sách Lỗi (Bugs List)

| ID | Tiêu đề / Mô tả ngắn | Mức độ nguy hiểm | Trạng thái | Nơi phát hiện | Người phụ trách | Ghi chú / Link ảnh |
|---|---|---|---|---|---|---|
| BUG-001 | Lỗi không tìm thấy tiêu đề 'Toà nhà' trong Modal | 🔥 Cao | 🆕 Mới | Playwright Test (buildings.spec.ts) | @dev | locator('heading', { name: 'Toà nhà' }) lỗi timeout |
| BUG-002 | Lỗi strict mode của Playwright khi get thẻ h1 | ⚠️ Trung bình | 🆕 Mới | Playwright Test (buildings.spec.ts) | @dev | Trùng 2 thẻ h1 (SmartStay BMS và Tên toà nhà) |

## 📝 Mẫu báo cáo chi tiết cho một Bug nghiêm trọng
Nếu lỗi phức tạp, bạn nên tạo mô tả chi tiết ngay bên dưới bằng mẫu sau:

### [BUG-001] Nút Đăng nhập không hoạt động trên Mobile
**1. Các bước để tái hiện (Steps to reproduce):**
- Mở trình duyệt Chrome trên điện thoại (iPhone 13).
- Truy cập vào trang `http://localhost:5173/public/login`.
- Nhập tài khoản và mật khẩu.
- Nhấn nút "Đăng nhập".

**2. Kết quả thực tế (Actual result):**
- Nút bấm bị đơ, không có phản hồi và không chuyển trang.

**3. Kết quả mong đợi (Expected result):**
- Hiển thị loading và chuyển hướng vào Dashboard thành công.

**4. Thông tin môi trường (Environment):**
- Trình duyệt: Chrome Mobile
- Hệ điều hành: iOS 16
