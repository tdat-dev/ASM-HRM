# 🧪 TESTING DOCUMENTATION

Tài liệu chi tiết về testing và validation cho HRM System.

## 📋 Test Cases

### 1. AUTHENTICATION MODULE

#### TC-001: Đăng ký User Mới

**Steps:**

1. Click button "Đăng ký nhanh"
2. Nhập username: `testuser`
3. Nhập password: `test123`
4. Click "Đăng ký nhanh"

**Expected Result:**

- ✅ Hiện alert success: "Đăng ký thành công"
- ✅ User được lưu vào localStorage `hrm_users`
- ✅ Password được hash

**Actual Result:** ✅ PASS

---

#### TC-002: Đăng ký Username Trùng

**Steps:**

1. Đăng ký username đã tồn tại: `admin`

**Expected Result:**

- ✅ Hiện alert error: "Username đã tồn tại"
- ✅ Không tạo user mới

**Actual Result:** ✅ PASS

---

#### TC-003: Đăng nhập Thành công

**Steps:**

1. Username: `admin`
2. Password: `admin123`
3. Click "Đăng nhập"

**Expected Result:**

- ✅ Redirect to dashboard
- ✅ Session lưu trong localStorage `hrm_session`
- ✅ Sidebar hiện đầy đủ menu

**Actual Result:** ✅ PASS

---

#### TC-004: Đăng nhập Sai Password

**Steps:**

1. Username: `admin`
2. Password: `wrongpass`
3. Click "Đăng nhập"

**Expected Result:**

- ✅ Hiện alert error: "Sai thông tin đăng nhập"
- ✅ Vẫn ở trang login

**Actual Result:** ✅ PASS

---

#### TC-005: Logout

**Steps:**

1. Đăng nhập thành công
2. Click "Đăng xuất"

**Expected Result:**

- ✅ Session bị xóa
- ✅ Redirect về login page
- ✅ Không thể truy cập dashboard

**Actual Result:** ✅ PASS

---

### 2. EMPLOYEE MANAGEMENT

#### TC-006: Thêm Nhân viên Hợp lệ

**Steps:**

1. Vào "Thêm Nhân viên"
2. Nhập:
   - Tên: `Nguyễn Văn Test`
   - Phòng ban: `Kỹ thuật`
   - Vị trí: `Nhân viên`
   - Lương: `10000000`
   - Ngày vào làm: `2025-10-16`
3. Click "Thêm"

**Expected Result:**

- ✅ Alert success: "Thêm nhân viên thành công"
- ✅ Nhân viên xuất hiện trong Dashboard
- ✅ Có mã nhân viên (ID)
- ✅ Form reset về trống

**Actual Result:** ✅ PASS

---

#### TC-007: Thêm Nhân viên - Validation Lỗi

**Steps:**

1. Thêm NV với:
   - Tên: `` (để trống)
   - Lương: `-1000` (âm)

**Expected Result:**

- ✅ Alert error: "Tên không được để trống"
- ✅ Alert error: "Lương phải > 0"
- ✅ Không tạo nhân viên

**Actual Result:** ✅ PASS

---

#### TC-008: Sửa Nhân viên

**Steps:**

1. Vào "Sửa Nhân viên"
2. Nhập tên: `Nguyễn An`
3. Click "Tải"
4. Sửa lương từ `900` → `1200000`
5. Click "Lưu"

**Expected Result:**

- ✅ Alert success: "Đã lưu"
- ✅ Lương cập nhật trong database
- ✅ Dashboard hiển thị lương mới

**Actual Result:** ✅ PASS

---

#### TC-009: Sửa Nhân viên - Không tìm thấy

**Steps:**

1. Nhập tên: `Người không tồn tại`
2. Click "Tải"

**Expected Result:**

- ✅ Alert error: "Không tìm thấy"
- ✅ Form không hiện

**Actual Result:** ✅ PASS

---

#### TC-010: Xóa Nhân viên

**Steps:**

1. Vào "Xóa Nhân viên"
2. Nhập ID: `1005`
3. Click "Tìm"
4. Click "Xóa"
5. Confirm popup

**Expected Result:**

- ✅ Alert success: "Đã xóa"
- ✅ Nhân viên biến mất khỏi danh sách
- ✅ Dashboard cập nhật số lượng

**Actual Result:** ✅ PASS

---

#### TC-011: Tìm kiếm theo Tên (Regex)

**Steps:**

1. Vào "Tìm kiếm Nhân viên"
2. Nhập tên: `^N` (bắt đầu bằng N)
3. Click "Lọc"

**Expected Result:**

- ✅ Hiển thị: Nguyễn An
- ✅ Không hiển thị: Trần Bình, Lê Chi, ...
- ✅ Có mã nhân viên (badge)

**Actual Result:** ✅ PASS

---

#### TC-012: Tìm kiếm theo Phòng ban + Lương

**Steps:**

1. Chọn phòng ban: `Kỹ thuật`
2. Lương min: `1000000`
3. Lương max: `2000000`
4. Click "Lọc"

**Expected Result:**

- ✅ Hiển thị: Trần Bình (Kỹ thuật, 1300000)
- ✅ Không hiển thị: Nguyễn An (Kinh doanh)
- ✅ Không hiển thị: Phạm Dũng (2100000 > max)
- ✅ Số tiền format: `1,300,000 VNĐ`

**Actual Result:** ✅ PASS

---

### 3. ATTENDANCE MODULE

#### TC-013: Check-in Lần đầu

**Steps:**

1. Vào "Chấm công"
2. Nhập Employee ID: `1001`
3. Click "Check-in"

**Expected Result:**

- ✅ Alert success: "Đã check-in"
- ✅ Record lưu với `checkIn = current time`
- ✅ Dashboard cập nhật "Chấm công hôm nay"

**Actual Result:** ✅ PASS

---

#### TC-014: Check-in Lần 2 trong ngày

**Steps:**

1. Check-in ID `1001` (đã check-in)
2. Click "Check-in" lần nữa

**Expected Result:**

- ✅ Alert error: "Đã check-in"
- ✅ Không tạo record mới

**Actual Result:** ✅ PASS

---

#### TC-015: Check-out Trước Check-in

**Steps:**

1. Employee ID chưa check-in: `1002`
2. Click "Check-out"

**Expected Result:**

- ✅ Alert error: "Chưa check-in"

**Actual Result:** ✅ PASS

---

#### TC-016: Check-out Sau Check-in

**Steps:**

1. Check-in ID `1001` lúc 8:00 AM
2. Check-out ID `1001` lúc 5:00 PM
3. Xem báo cáo

**Expected Result:**

- ✅ Alert success: "Đã check-out"
- ✅ Tính đúng số giờ: ~9 hours
- ✅ Record có `checkOut` timestamp

**Actual Result:** ✅ PASS

---

### 4. LEAVE MANAGEMENT

#### TC-017: Tạo Yêu cầu Nghỉ phép

**Steps:**

1. Vào "Nghỉ phép"
2. Employee ID: `1001`
3. Từ ngày: `2025-10-20`
4. Đến ngày: `2025-10-22`
5. Loại: `Annual`
6. Click "Gửi yêu cầu"

**Expected Result:**

- ✅ Yêu cầu được tạo
- ✅ Status = `pending`
- ✅ Xuất hiện trong bảng
- ✅ Dashboard cập nhật "Yêu cầu chờ duyệt"

**Actual Result:** ✅ PASS

---

#### TC-018: Duyệt Yêu cầu

**Steps:**

1. Click "Duyệt" trên yêu cầu pending
2. Kiểm tra status

**Expected Result:**

- ✅ Status chuyển → `approved`
- ✅ Button "Duyệt" biến mất
- ✅ Dashboard giảm số "Chờ duyệt"

**Actual Result:** ✅ PASS

---

#### TC-019: Tính Số ngày Phép còn lại

**Steps:**

1. Employee có 3 approved leaves (total 5 days)
2. Call `getLeaveBalance(employeeId)`

**Expected Result:**

- ✅ Return: `15` (20 - 5)
- ✅ Công thức: DEFAULT_ANNUAL_LEAVE_DAYS - usedDays

**Actual Result:** ✅ PASS

---

### 5. PERFORMANCE MODULE

#### TC-020: Thêm Đánh giá

**Steps:**

1. Vào "Hiệu suất"
2. Employee ID: `1001`
3. Rating: `5`
4. Feedback: `Excellent work!`
5. Click "Thêm đánh giá"

**Expected Result:**

- ✅ Review được lưu
- ✅ Xuất hiện trong bảng Top performers
- ✅ Tính avg rating đúng

**Actual Result:** ✅ PASS

---

#### TC-021: Top Performers Ranking

**Steps:**

1. Thêm reviews cho nhiều NV:
   - NV 1001: ratings [5, 5, 4] → avg 4.67
   - NV 1002: ratings [3, 4] → avg 3.5
2. Xem bảng

**Expected Result:**

- ✅ Sort theo avg giảm dần
- ✅ NV 1001 ở top
- ✅ NV 1002 ở dưới

**Actual Result:** ✅ PASS

---

### 6. SALARY MODULE

#### TC-022: Tính Lương Thực lĩnh

**Steps:**

1. Vào "Bảng lương"
2. Kiểm tra nhân viên:
   - Salary: `1,000,000`
   - Bonus: `200,000`
   - Deduction: `50,000`

**Expected Result:**

- ✅ Thực lĩnh = `1,150,000 VNĐ`
- ✅ Công thức: base + bonus - deduction
- ✅ Format có dấu phẩy
- ✅ Màu xanh lá (success color)

**Actual Result:** ✅ PASS

---

#### TC-023: Format VNĐ trong Bảng lương

**Steps:**

1. Check tất cả cột tiền

**Expected Result:**

- ✅ Lương: `1,000,000 VNĐ`
- ✅ Thưởng: `200,000 VNĐ`
- ✅ Khấu trừ: `50,000 VNĐ`
- ✅ Thực lĩnh: `1,150,000 VNĐ` (in đậm)

**Actual Result:** ✅ PASS

---

### 7. DASHBOARD

#### TC-024: Stat Cards - Số liệu chính xác

**Steps:**

1. Login và vào Dashboard
2. Kiểm tra 4 stat cards

**Expected Result:**

- ✅ Tổng NV: Đếm đúng từ DB
- ✅ Phòng ban: Số phòng ban + vị trí đúng
- ✅ Lương TB: Tính trung bình chính xác
- ✅ Chấm công hôm nay: Filter theo date

**Actual Result:** ✅ PASS

---

#### TC-025: Biểu đồ Phòng ban

**Steps:**

1. Xem biểu đồ nhân viên theo phòng ban

**Expected Result:**

- ✅ Mỗi phòng ban có 1 thanh
- ✅ Chiều dài thanh = số NV × 20px
- ✅ Badge hiển thị số chính xác
- ✅ Gradient background

**Actual Result:** ✅ PASS

---

#### TC-026: Thống kê Tài chính

**Steps:**

1. Check 3 cards tài chính

**Expected Result:**

- ✅ Tổng chi phí: Sum(salary + bonus - deduction)
- ✅ Yêu cầu chờ duyệt: Count pending leaves
- ✅ Chi phí TB/người: Tổng ÷ Số NV
- ✅ Format VNĐ có dấu phẩy

**Actual Result:** ✅ PASS

---

#### TC-027: Bảng Nhân viên gần đây

**Steps:**

1. Thêm 2 nhân viên mới
2. Check bảng dashboard

**Expected Result:**

- ✅ Hiển thị 5 người mới nhất
- ✅ Thứ tự: Mới nhất ở trên
- ✅ Có cột Mã NV (badge)
- ✅ Lương format VNĐ

**Actual Result:** ✅ PASS

---

### 8. UI/UX

#### TC-028: Dark Mode Toggle

**Steps:**

1. Click "Toggle Theme"
2. Kiểm tra colors

**Expected Result:**

- ✅ Background → dark
- ✅ Text → light
- ✅ Cards → dark surface
- ✅ Button text: "Light Mode"
- ✅ Theme lưu trong localStorage

**Actual Result:** ✅ PASS

---

#### TC-029: Responsive Mobile

**Steps:**

1. Resize browser < 900px
2. Check sidebar

**Expected Result:**

- ✅ Sidebar ẩn (transform: translateX(-100%))
- ✅ Content full width
- ✅ Stat cards stack vertically

**Actual Result:** ✅ PASS

---

#### TC-030: Hover Effects

**Steps:**

1. Hover trên stat cards
2. Hover trên buttons
3. Hover trên table rows

**Expected Result:**

- ✅ Stat cards: translateY(-4px) + scale
- ✅ Buttons: translateY(-2px) + shadow
- ✅ Table rows: background change

**Actual Result:** ✅ PASS

---

### 9. DATA PERSISTENCE

#### TC-031: LocalStorage Persistence

**Steps:**

1. Thêm nhân viên
2. Refresh page (F5)
3. Check dashboard

**Expected Result:**

- ✅ Nhân viên vẫn còn
- ✅ Tất cả data không mất
- ✅ Session vẫn còn (không phải login lại)

**Actual Result:** ✅ PASS

---

#### TC-032: Reset Data

**Steps:**

1. Click "Reset Data"
2. Confirm popup
3. Check localStorage

**Expected Result:**

- ✅ Employees, departments, positions → `[]`
- ✅ Attendance, leaves, reviews → xóa
- ✅ Users & session → giữ nguyên
- ✅ Redirect to dashboard

**Actual Result:** ✅ PASS

---

## 📊 Test Summary

| Module              | Total Tests | Passed | Failed | Pass Rate |
| ------------------- | ----------- | ------ | ------ | --------- |
| Authentication      | 5           | 5      | 0      | 100%      |
| Employee Management | 7           | 7      | 0      | 100%      |
| Attendance          | 4           | 4      | 0      | 100%      |
| Leave Management    | 3           | 3      | 0      | 100%      |
| Performance         | 2           | 2      | 0      | 100%      |
| Salary              | 2           | 2      | 0      | 100%      |
| Dashboard           | 4           | 4      | 0      | 100%      |
| UI/UX               | 3           | 3      | 0      | 100%      |
| Data Persistence    | 2           | 2      | 0      | 100%      |
| **TOTAL**           | **32**      | **32** | **0**  | **100%**  |

---

## 🐛 Known Issues

Không có lỗi nghiêm trọng được phát hiện.

---

## ✅ Validation Rules

### Employee

- ✅ Name: Non-empty string
- ✅ Salary: Positive number > 0
- ✅ HireDate: Valid date string

### Attendance

- ✅ Không check-in 2 lần/ngày
- ✅ Không check-out trước check-in
- ✅ Employee ID phải tồn tại

### Leave

- ✅ Start date < End date
- ✅ Employee ID phải tồn tại
- ✅ Status: pending/approved/rejected

### Performance

- ✅ Rating: 1-5
- ✅ Employee ID phải tồn tại

---

## 🔧 Testing Tools

- **Manual Testing:** Browser DevTools
- **Console:** `console.log()` để debug
- **LocalStorage Inspector:** Check data persistence
- **Responsive Testing:** Chrome DevTools Device Mode

---

_Tất cả 32 test cases đều PASS. Hệ thống hoạt động ổn định và đúng yêu cầu._
