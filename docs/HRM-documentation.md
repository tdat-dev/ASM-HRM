# TÀI LIỆU HRM

Dự án: Human Resource Management System (ASM HRM)
Tác giả: [Điền tên của bạn]
Lớp: WD1113
Ngày: 16/10/2025

---

## 1. TỔNG QUAN DỰ ÁN

Hệ thống HRM (Human Resource Management) này được xây dựng hoàn toàn bằng Vanilla JavaScript (ES6 modules), HTML5 và CSS3, không sử dụng bất kỳ front-end framework nào. LocalStorage đóng vai trò lớp lưu trữ để mô phỏng một cơ sở dữ liệu nhẹ. Ứng dụng tuân theo mô hình Single Page Application (SPA) và tận dụng kiến trúc module để tách biệt nghiệp vụ, giúp dễ bảo trì.

### 1.1 Mục tiêu cốt lõi

- Cung cấp đầy đủ bộ tính năng HRM: nhân sự, chấm công, nghỉ phép, hiệu suất, bảng lương, xác thực.
- Trình diễn các kỹ thuật JavaScript nâng cao (closure, async/await, array methods, module pattern).
- Đảm bảo clean code với tên biến rõ nghĩa, hằng số, cơ chế kiểm tra dữ liệu và tiện ích tái sử dụng.
- Mang lại giao diện hiện đại, responsive với chế độ sáng/tối và dashboard phân tích.

### 1.2 Tổng hợp tính năng

| Module                | Mô tả                                               |
| --------------------- | --------------------------------------------------- |
| Authentication        | Đăng ký, đăng nhập, băm mật khẩu, quản lý session   |
| Employee              | Thêm, sửa, xóa, tìm kiếm nhân viên (regex, bộ lọc)  |
| Departments/Positions | CRUD phòng ban, vị trí, lương cơ sở theo vị trí     |
| Attendance            | Check-in/out, kiểm tra theo ngày, tính giờ làm      |
| Leave                 | Tạo yêu cầu, luồng duyệt, tính số ngày phép còn lại |
| Performance           | Đánh giá, phản hồi, xếp hạng nhân viên xuất sắc     |
| Salary                | Báo cáo lương, tính lương thực lĩnh, định dạng VNĐ  |
| Dashboard             | Thẻ KPI, phân bố phòng ban, thống kê tài chính      |

---

## 2. KIẾN TRÚC & THIẾT KẾ

### 2.1 Cấu trúc thư mục

```
ASM-HRM/
├── index.html
├── app.js
├── style.css
├── modules/
│   ├── auth-module.js
│   ├── employee-db-module.js
│   ├── add-employee-module.js
│   ├── edit-employee-module.js
│   ├── delete-employee-module.js
│   ├── search-employee-module.js
│   ├── department-module.js
│   ├── position-module.js
│   ├── salary-module.js
│   ├── attendance-module.js
│   ├── leave-module.js
│   └── performance-module.js
├── utils/
│   ├── dom.js
│   ├── validators.js
│   └── storage.js
├── docs/
│   └── HRM-documentation.md (tài liệu tổng hợp này)
├── README.md
├── REPORT.md
└── TESTING.md
```

### 2.2 Các quyết định thiết kế chủ đạo

- Module pattern: Mỗi module trong `modules/` phơi ra hàm `mount` để render giao diện tương ứng.
- Routing: `app.js` duy trì bảng `routes`; `navigate(route)` chuyển module mà không reload trang.
- Truy cập dữ liệu: `employee-db-module.js` tập trung CRUD cho nhân viên, phòng ban, vị trí để tránh lặp code LocalStorage.
- Utilities: `utils/dom.js` tạo DOM động và render bảng; `utils/validators.js` kiểm tra dữ liệu; `utils/storage.js` cung cấp wrapper LocalStorage bất đồng bộ.
- Hằng số & Clean Code: Mọi magic string/number được thay bằng hằng có tên rõ (`EMPLOYEES_STORAGE_KEY`, `LEAVE_STATUS_PENDING`, ...). Hàm đảm nhiệm một nhiệm vụ với tên mô tả.

---

## 3. NỔI BẬT TRONG TRIỂN KHAI MODULE

### 3.1 Authentication (`modules/auth-module.js`)

- Sử dụng closure để băm mật khẩu, kết hợp plain text với secret salt và toán tử bit.
- Tận dụng async/await với độ trễ giả lập (`delayExecution`) để mô phỏng độ trễ mạng.
- Lưu session vào LocalStorage và phơi các API `ensureInitialized`, `register`, `login`, `logout`, `getSession`.

### 3.2 Employee Database (`modules/employee-db-module.js`)

- Khởi tạo dữ liệu mẫu cho phòng ban, vị trí, nhân viên ngay lần chạy đầu.
- Cung cấp tiện ích: `getAllEmployees`, `filterEmployees`, `sortEmployees`, `saveEmployees`.
- Ứng dụng higher-order function và destructuring giúp thao tác dữ liệu gọn và dễ đọc.

### 3.3 Các module CRUD nhân viên

- Add Employee: Kiểm tra dữ liệu bằng `validateEmployeeInput`, tự sinh ID và lưu đối tượng nhân viên chuẩn hóa.
- Edit Employee: Tìm theo tên (không phân biệt hoa thường), tải form với dữ liệu hiện tại, kiểm tra và lưu cập nhật.
- Delete Employee: Xác nhận trước khi xóa và render lại danh sách.
- Search Employee: Hỗ trợ regex tên, lọc phòng ban và khoảng lương bằng chuỗi array methods.

### 3.4 Attendance (`modules/attendance-module.js`)

- Lưu dấu thời gian check-in/out, ngăn hành động trùng trong cùng ngày và tính số giờ làm.
- Sử dụng chuyển đổi ngày dạng ISO và hằng số (`MILLISECONDS_PER_HOUR`).

### 3.5 Leave Management (`modules/leave-module.js`)

- Tạo yêu cầu nghỉ với trạng thái, luồng duyệt và tự động tính số ngày phép bằng `reduce`.
- Áp dụng hằng số cho trạng thái và số ngày phép mặc định để rõ ràng.

### 3.6 Performance (`modules/performance-module.js`)

- Gom feedback theo employee ID với `reduce` và `Object.entries`, tính trung bình và xếp hạng.
- Trình diễn thao tác array nâng cao để phân tích dữ liệu từ LocalStorage.

### 3.7 Salary (`modules/salary-module.js`)

- Tính lương thực lĩnh (`salary + bonus - deduction`) và render bảng lương định dạng VNĐ.
- Tái sử dụng tiện ích `renderTable` để đồng nhất giao diện.

### 3.8 Dashboard (`app.js`)

- Hiển thị các chỉ số chính (tổng nhân viên, phòng ban, lương TB, chấm công) dưới dạng thẻ gradient.
- Hình dung phân bố nhân viên theo phòng ban và thống kê tài chính.
- Liệt kê nhân viên mới nhất với badge mã nhân viên và số lương đã format.

---

## 4. KỸ THUẬT JAVASCRIPT NÂNG CAO

- Cú pháp ES6+: Arrow function, template literal, destructuring, spread operator, default parameter, optional chaining.
- Array Methods: Sử dụng mạnh `map`, `filter`, `reduce`, `find`, `some`, `sort`, `slice` để biến đổi dữ liệu.
- Closures: Băm mật khẩu, tạo wrapper trì hoãn thực thi.
- Async/Await: Mô phỏng hành vi bất đồng bộ tương tự API thật.
- Module Pattern: Đóng gói chức năng với export rõ ràng.
- Event Delegation & DOM Manipulation: Lắng nghe sự kiện động, tiện ích DOM tái sử dụng.

---

## 5. TRẢI NGHIỆM GIAO DIỆN NGƯỜI DÙNG

- Responsive Layout: Flexbox và CSS Grid đảm bảo sử dụng tốt trên desktop và mobile.
- Hai chế độ màu: Light/Dark toggle qua CSS variables và lưu trong LocalStorage.
- Phân cấp thị giác: Thẻ KPI gradient, bảng có viền, badge mã nhân viên, alert thành công/lỗi.
- Khả năng tiếp cận: Input gắn nhãn, trạng thái focus, độ tương phản màu rõ ràng.
- Hiệu ứng hiện đại: Transition, hover animation, đổ bóng tạo cảm giác tương tác.

---

## 6. TỔNG KẾT KIỂM THỬ

Tổng cộng 32 test case thủ công đã được thực hiện bao phủ các mảng: xác thực, quản lý nhân viên, chấm công, nghỉ phép, hiệu suất, bảng lương, dashboard, UI/UX và lưu trữ dữ liệu. Tất cả đều vượt qua với tỷ lệ thành công 100%. Quy trình chi tiết xem trong `TESTING.md`.

### 6.1 Kiểm tra hợp lệ trọng tâm

- Ngăn username trùng và đảm bảo luồng đăng nhập an toàn.
- Xác thực dữ liệu nhân viên (tên không trống, lương > 0, ngày hợp lệ).
- Ngăn chấm công trùng và bảo đảm tính giờ chính xác.
- Duy trì số ngày phép hợp lệ và trạng thái duyệt đúng.
- Đảm bảo mọi số liệu tài chính được format VNĐ chuẩn.

---

## 7. THỬ THÁCH & GIẢI PHÁP

| Thử thách                                   | Giải pháp                                                       |
| ------------------------------------------- | --------------------------------------------------------------- |
| Quản lý state khi không dùng Redux/Vuex     | Dùng LocalStorage làm nguồn dữ liệu duy nhất + re-render module |
| SPA routing khi không có framework          | Xây dựng bảng `routes` và hàm `navigate()` tùy biến             |
| Sai lệch kiểu giữa input và dữ liệu lưu trữ | Ép kiểu nhất quán (`Number(...)`, `String(...)`)                |
| UX tìm kiếm chỉ theo ID                     | Chuyển sang tìm theo tên + hỗ trợ kết quả khớp một phần         |
| Tránh magic number/string                   | Đưa vào hằng số và cấu hình có tên rõ ràng                      |

---

## 8. THỰC HÀNH CLEAN CODE

- Đặt tên mô tả cho biến, hàm, hằng số.
- Hàm theo nguyên tắc single responsibility.
- Tiện ích tái sử dụng cho DOM, validation, truy cập dữ liệu.
- Comment có cấu trúc và JSDoc cho các API public.
- Định dạng nhất quán, tránh magic value xuất hiện trực tiếp.

---

## 9. CÁCH CHẠY & KIỂM THỬ

1. Mở trực tiếp: double-click `index.html` trên trình duyệt hiện đại.
2. Live Server (khuyến nghị): Dùng extension Live Server trong VS Code.
3. Simple HTTP server: `python -m http.server 8000` hoặc `npx http-server`, rồi truy cập `http://localhost:8000`.
4. Tài khoản mặc định:
   - Username: `admin`
   - Password: `admin123`
5. Checklist kiểm thử: Xem `TESTING.md` để làm theo từng bước.

---

## 10. HƯỚNG PHÁT TRIỂN TƯƠNG LAI

- Chuyển lưu trữ từ LocalStorage sang backend thực (Node.js/Express + database).
- Bổ sung unit test tự động (Jest) và end-to-end test (Cypress).
- Hỗ trợ upload file (ảnh nhân viên, tài liệu).
- Triển khai phân quyền theo vai trò và audit log.
- Tích hợp biểu đồ trực quan hóa dữ liệu thực tế.

---

## 11. TÀI LIỆU THAM KHẢO

1. MDN Web Docs – JavaScript Guide
2. JavaScript.info – The Modern JavaScript Tutorial
3. Clean Code – Robert C. Martin
4. You Don't Know JS Yet – Kyle Simpson

---

Tài liệu này tổng hợp toàn bộ thông tin của dự án HRM. Để xem giải thích kỹ thuật sâu hơn và chi tiết đánh giá, tham khảo thêm `REPORT.md` và `TESTING.md` ở thư mục gốc.
