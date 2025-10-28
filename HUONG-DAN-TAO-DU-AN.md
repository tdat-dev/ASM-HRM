# 📚 QUY TRÌNH TẠO HRM SYSTEM - HƯỚNG DẪN CHO SINH VIÊN NĂM NHẤT

## _Phiên bản: "Tại sao lại làm vậy?" - Giải thích mọi quyết định kỹ thuật_

---

## 🎯 **TỔNG QUAN DỰ ÁN**

Chúng ta sẽ xây dựng một **Hệ thống Quản lý Nhân sự (HRM)** từ con số 0, sử dụng:

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: PHP thuần (không framework)
- **Database**: MySQL

### **🤔 TẠI SAO LẠI CHỌN STACK NÀY?**

**Q: Tại sao không dùng React/Vue mà lại dùng Vanilla JavaScript?**

- ✅ **Học nền tảng trước**: Vanilla JS giúp hiểu rõ cách DOM hoạt động, event handling, async/await
- ✅ **Không phụ thuộc**: Không cần npm, webpack, build tools phức tạp
- ✅ **Performance**: Ứng dụng nhẹ hơn, load nhanh hơn (không có framework overhead)
- ✅ **Dễ deploy**: Chỉ cần upload files, không cần build process
- 📌 _Sau khi thành thạo Vanilla JS, học React/Vue sẽ dễ dàng hơn rất nhiều!_

**Q: Tại sao dùng PHP thay vì Node.js/Express?**

- ✅ **Dễ hosting**: Hầu hết hosting miễn phí đều hỗ trợ PHP
- ✅ **Cú pháp đơn giản**: Dễ học cho người mới
- ✅ **Tích hợp XAMPP**: Apache + MySQL + PHP trong 1 package
- ✅ **Shared hosting friendly**: Không cần VPS/server riêng

**Q: Tại sao MySQL chứ không phải MongoDB?**

- ✅ **Data có cấu trúc**: Nhân viên, phòng ban, lương bổng đều có mối quan hệ rõ ràng
- ✅ **ACID compliance**: Đảm bảo tính toàn vẹn dữ liệu (quan trọng cho hệ thống tài chính)
- ✅ **SQL skills**: Kỹ năng SQL cần thiết cho hầu hết công việc lập trình

---

## 📋 **BƯỚC 1: CHUẨN BỊ MÔI TRƯỜNG (Tuần 1)**

### **1.1. Cài đặt phần mềm**

#### Windows:

```bash
# 1. Download XAMPP
https://www.apachefriends.org/download.html

# 2. Cài đặt VS Code
https://code.visualstudio.com/

# 3. Extensions cần thiết trong VS Code:
- Live Server
- PHP Intelephense
- ESLint
- Prettier
```

### **🤔 TẠI SAO CẦN XAMPP?**

**XAMPP = X (Cross-platform) + Apache + MySQL + PHP + Perl**

```
┌─────────────────────────────────────────┐
│          XAMPP HOẠT ĐỘNG NHƯ THẾ NÀO?  │
├─────────────────────────────────────────┤
│                                         │
│  Browser (localhost:80)                 │
│       ↓                                 │
│  Apache Web Server                      │
│       ↓ (nhận request)                  │
│  PHP Interpreter (xử lý .php)           │
│       ↓ (query database)                │
│  MySQL Database (lấy data)              │
│       ↓                                 │
│  Trả về HTML/JSON                       │
│                                         │
└─────────────────────────────────────────┘
```

**Q: Tại sao không code trực tiếp mà cần Apache?**

- ❌ **Không thể**: `file:///index.html` không chạy được PHP
- ✅ **Cần web server**: Apache giả lập môi trường hosting thật
- ✅ **CORS policy**: Fetch API cần HTTP protocol, không chạy được trên `file://`

**Q: Tại sao cần MySQL?**

- ❌ **LocalStorage không đủ**: Chỉ lưu được string, giới hạn 5-10MB
- ✅ **Database thật**: Lưu trữ vô hạn, query phức tạp, relationships
- ✅ **Multi-user**: Nhiều người dùng cùng truy cập

#### Kiểm tra cài đặt:

```bash
# Mở XAMPP Control Panel
# Start: Apache + MySQL
# Truy cập: http://localhost/phpmyadmin
```

**🔍 Giải thích:**

- `Apache`: Web server (cổng 80)
- `MySQL`: Database server (cổng 3306)
- `phpMyAdmin`: GUI quản lý database qua web

### **1.2. Tạo folder dự án**

```bash
# Tạo folder trong htdocs của XAMPP
C:\xampp\htdocs\ASM-HRM\

# Cấu trúc ban đầu:
ASM-HRM/
├── index.html
├── style.css
├── app.js
├── backend/
└── modules/
```

### **🤔 TẠI SAO PHẢI TẠO TRONG `htdocs`?**

**Q: Tại sao không tạo ở Desktop hay Documents?**

```
❌ C:\Users\YourName\Desktop\ASM-HRM  → Apache KHÔNG TÌM THẤY
✅ C:\xampp\htdocs\ASM-HRM             → Apache PHỤC VỤ TẠI http://localhost/ASM-HRM
```

**Apache config mặc định:**

```apache
DocumentRoot "C:/xampp/htdocs"
<Directory "C:/xampp/htdocs">
    # Chỉ files trong đây mới được serve
</Directory>
```

**Q: Tại sao tách `backend/` và `modules/`?**

```
backend/   → PHP server-side code (chạy trên server)
modules/   → JavaScript client-side code (chạy trên browser)
```

**Nguyên tắc Separation of Concerns:**

- Frontend (HTML/CSS/JS) → Presentation layer
- Backend (PHP) → Business logic layer
- Database (MySQL) → Data layer

---

## 📐 **BƯỚC 2: THIẾT KẾ DATABASE (Tuần 1-2)**

### **🤔 TẠI SAO PHẢI THIẾT KẾ DATABASE TRƯỚC KHI CODE?**

**Câu chuyện thực tế:**

```
❌ Code trước, thiết kế sau:
   - Làm đến giữa chừng phát hiện thiếu cột
   - Phải sửa lại database → sửa lại PHP → sửa lại JavaScript
   - Mất 3 ngày debug

✅ Thiết kế trước, code sau:
   - Biết rõ cần gì, thiếu gì
   - Code một mạch, không phải quay lại
   - Tiết kiệm 80% thời gian debug
```

**Database = Bản thiết kế nhà:**

- Không ai xây nhà mà không có bản vẽ
- Database là nền móng, sai từ đầu thì sập cả dự án

### **2.1. Vẽ ERD (Entity Relationship Diagram)**

Trên giấy hoặc draw.io, vẽ các bảng:

```
┌─────────────┐       ┌──────────────┐
│   users     │       │  employees   │
├─────────────┤       ├──────────────┤
│ id          │       │ id           │
│ username    │       │ name         │
│ password    │       │ email        │
└─────────────┘       │ departmentId │→┐
                      │ positionId   │→│
                      └──────────────┘ │
                                       │
┌──────────────┐      ┌──────────────┐│
│ departments  │←─────┤  positions   ││
├──────────────┤      ├──────────────┤│
│ id           │      │ id           ││
│ name         │      │ title        ││
└──────────────┘      │ baseSalary   ││
                      │ departmentId │┘
                      └──────────────┘
```

### **🤔 GIẢI THÍCH RELATIONSHIPS**

**Q: Tại sao `employees` cần `departmentId` và `positionId`?**

```sql
-- ❌ THIẾT KẾ SAI (Lưu tên phòng ban trực tiếp)
employees:
  name: "Nguyễn Văn A"
  department: "Kinh doanh"  ← Nếu đổi tên phòng ban thì sao?

-- ✅ THIẾT KẾ ĐÚNG (Lưu ID tham chiếu)
employees:
  name: "Nguyễn Văn A"
  department_id: 1  → departments.id = 1 (name: "Kinh doanh")
```

**Lợi ích:**

1. **Tránh duplicate**: Tên phòng ban lưu 1 lần thay vì 100 lần
2. **Dễ update**: Đổi tên phòng ban chỉ sửa 1 chỗ
3. **Data integrity**: Không thể tạo nhân viên với phòng ban không tồn tại

**Q: Tại sao `positions` lại có `departmentId`?**

```
Ví dụ thực tế:
- "Trưởng phòng" ở phòng Kinh doanh ≠ "Trưởng phòng" ở phòng IT
- Lương khác nhau, yêu cầu khác nhau
- → Vị trí phải thuộc về 1 phòng ban cụ thể
```

**Q: Tại sao cần bảng `users` riêng, không gộp vào `employees`?**

```sql
-- ❌ GỘP CHUNG (Vấn đề bảo mật)
employees:
  name: "Nguyễn Văn A"
  username: "admin"
  password: "123456"  ← Nhân viên HR xem được mật khẩu!

-- ✅ TÁCH RIÊNG (Bảo mật)
users:           → Chỉ hệ thống xem
  username
  password

employees:       → HR có thể xem
  name
  email
```

**Nguyên tắc:** _Tách biệt authentication (xác thực) và business data (dữ liệu nghiệp vụ)_

### **2.2. Tạo database trong phpMyAdmin**

```sql
-- File: backend/init.sql

-- 1. Tạo database
CREATE DATABASE IF NOT EXISTS hrm_db
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hrm_db;
```

### **🤔 TẠI SAO `utf8mb4` VÀ `utf8mb4_unicode_ci`?**

**Q: Tại sao không dùng `utf8`?**

```sql
-- ❌ utf8 (cũ, thiếu emoji)
CREATE DATABASE hrm_db CHARACTER SET utf8;
-- "Nhân viên 😊" → ❌ Lỗi

-- ✅ utf8mb4 (đầy đủ, hỗ trợ emoji)
CREATE DATABASE hrm_db CHARACTER SET utf8mb4;
-- "Nhân viên 😊" → ✅ OK
```

**Q: `COLLATE utf8mb4_unicode_ci` là gì?**

- **COLLATE**: Quy tắc so sánh/sắp xếp
- **ci**: Case Insensitive (không phân biệt hoa thường)

```sql
-- utf8mb4_unicode_ci
WHERE username = 'Admin'  → Tìm thấy 'admin', 'ADMIN', 'Admin'

-- utf8mb4_bin (binary, phân biệt hoa thường)
WHERE username = 'Admin'  → Chỉ tìm thấy 'Admin'
```

**Chọn `unicode_ci` vì:**

- User nhập "admin" hoặc "Admin" đều đăng nhập được
- Tên tiếng Việt so sánh đúng: "Nguyễn" < "Trần"

```sql
-- 2. Bảng users (Đăng nhập)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **🤔 GIẢI THÍCH TỪNG DÒNG**

**Q: Tại sao `id INT PRIMARY KEY AUTO_INCREMENT`?**

```sql
id INT                    → Số nguyên (1, 2, 3...)
PRIMARY KEY               → Khóa chính (duy nhất, không null)
AUTO_INCREMENT            → Tự động tăng
```

**Ví dụ:**

```sql
INSERT INTO users (username, password) VALUES ('admin', '123');
-- id tự động = 1

INSERT INTO users (username, password) VALUES ('user2', '456');
-- id tự động = 2
```

**Không cần:**

```sql
❌ INSERT INTO users (id, username, password) VALUES (1, 'admin', '123');
```

**Q: Tại sao `username VARCHAR(50) UNIQUE NOT NULL`?**

```sql
VARCHAR(50)    → Chuỗi tối đa 50 ký tự (tiết kiệm bộ nhớ hơn TEXT)
UNIQUE         → Không cho trùng (1 username = 1 tài khoản)
NOT NULL       → Bắt buộc nhập (không để trống)
```

**Test:**

```sql
INSERT INTO users (username, password) VALUES ('admin', '123');  ✅
INSERT INTO users (username, password) VALUES ('admin', '456');  ❌ UNIQUE violation
INSERT INTO users (username, password) VALUES (NULL, '789');     ❌ NOT NULL violation
```

**Q: Tại sao `password VARCHAR(255)` dài vậy?**

```php
// Password thật: "123456" (6 ký tự)
// Sau khi hash: "$2y$10$abcdef..." (60 ký tự)

password_hash("123456", PASSWORD_DEFAULT);
// → "$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
//    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                        60 ký tự
```

**Lưu 255 ký tự để:**

- Đủ chỗ cho hash (hiện tại 60, tương lai có thể dài hơn)
- An toàn hơn (không bị cắt mất dữ liệu)

**Q: Tại sao `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`?**

```sql
TIMESTAMP                → Lưu ngày giờ (2025-10-27 10:30:00)
DEFAULT CURRENT_TIMESTAMP → Tự động lấy thời gian hiện tại
```

**Lợi ích:**

```sql
-- Không cần:
❌ INSERT INTO users (username, password, created_at)
   VALUES ('admin', '123', '2025-10-27 10:30:00');

-- Tự động:
✅ INSERT INTO users (username, password) VALUES ('admin', '123');
   -- created_at tự động = thời gian insert
```

**Ứng dụng:**

- Biết user đăng ký lúc nào
- Sắp xếp theo thứ tự đăng ký
- Audit trail (theo dõi lịch sử)

```sql
-- 3. Bảng departments (Phòng ban)
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT
);
```

### **🤔 TẠI SAO `description TEXT` KHÔNG PHẢI `VARCHAR`?**

**So sánh:**

```sql
VARCHAR(100)  → Tối đa 100 ký tự, cố định độ dài
TEXT          → Không giới hạn (lên đến 65,535 ký tự)
```

**Khi nào dùng TEXT?**

- Description, comment, feedback (nội dung dài, không biết trước)
- Ví dụ: "Phòng Kinh doanh chuyên về bán hàng, marketing, chăm sóc khách hàng..." (200+ ký tự)

**Khi nào dùng VARCHAR?**

- Name, email, phone (nội dung ngắn, có giới hạn rõ ràng)

```sql
-- 4. Bảng positions (Vị trí)
CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    base_salary DECIMAL(10,2),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

### **🤔 TẠI SAO `DECIMAL(10,2)` CHO LƯƠNG?**

**Q: Tại sao không dùng INT hoặc FLOAT?**

```sql
-- ❌ INT (Không có phần thập phân)
salary INT → 15000000  ← Không lưu được 15.5 triệu

-- ❌ FLOAT (Sai số làm tròn)
salary FLOAT → 15000000.50
-- Query: SELECT salary WHERE salary = 15000000.50
-- Result: Không tìm thấy! (Vì FLOAT lưu là 15000000.499999...)

-- ✅ DECIMAL(10,2) (Chính xác tuyệt đối)
salary DECIMAL(10,2) → 15000000.50
-- 10 chữ số tổng, 2 chữ số thập phân
-- Tối đa: 99999999.99 (gần 100 triệu)
```

**Ví dụ thực tế:**

```sql
DECIMAL(10,2)
         ↓↓ 2 chữ số sau dấu phẩy (xu)
    ↓↓↓↓↓↓↓↓ 8 chữ số trước dấu phẩy (đồng)

15000000.50  → 15 triệu 50 xu ✅
99999999.99  → 99 triệu 99 xu ✅
```

**Nguyên tắc:** _Tiền bạc luôn dùng DECIMAL, không bao giờ dùng FLOAT_

**Q: Tại sao `FOREIGN KEY (department_id) REFERENCES departments(id)`?**

```sql
FOREIGN KEY (department_id)      → Cột này là khóa ngoại
REFERENCES departments(id)       → Tham chiếu đến bảng departments, cột id
```

**Kiểm tra tính toàn vẹn:**

```sql
-- ✅ Thêm position với department tồn tại
INSERT INTO positions (title, base_salary, department_id)
VALUES ('Dev Junior', 15000000, 1);  -- departments.id = 1 tồn tại

-- ❌ Thêm position với department không tồn tại
INSERT INTO positions (title, base_salary, department_id)
VALUES ('Dev Junior', 15000000, 999);  -- departments.id = 999 KHÔNG tồn tại
-- → ERROR: Cannot add or update a child row: a foreign key constraint fails
```

**Lợi ích:**

1. **Data integrity**: Không cho lưu dữ liệu vô lý
2. **Cascade delete**: Xóa department → tự động xử lý positions liên quan
3. **Database enforced**: Không phụ thuộc vào code PHP

```sql
-- 5. Bảng employees (Nhân viên)
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    department_id INT,
    position_id INT,
    salary DECIMAL(10,2),
    hire_date DATE,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
);
```

### **🤔 TẠI SAO `email UNIQUE` NHƯNG KHÔNG `NOT NULL`?**

```sql
email VARCHAR(100) UNIQUE  ← KHÔNG có NOT NULL
```

**Lý do:**

- Một số nhân viên có thể không có email (công nhân, bảo vệ...)
- Nhưng nếu có email thì phải UNIQUE (không 2 người dùng chung email)

**Ví dụ:**

```sql
-- ✅ Nhân viên không có email
INSERT INTO employees (name, email) VALUES ('Nguyễn Văn A', NULL);
INSERT INTO employees (name, email) VALUES ('Trần Văn B', NULL);

-- ✅ Nhân viên có email khác nhau
INSERT INTO employees (name, email) VALUES ('Lê Thị C', 'c@gmail.com');
INSERT INTO employees (name, email) VALUES ('Phạm Văn D', 'd@gmail.com');

-- ❌ 2 nhân viên cùng email
INSERT INTO employees (name, email) VALUES ('User X', 'c@gmail.com');
-- → ERROR: Duplicate entry 'c@gmail.com' for key 'email'
```

**Q: Tại sao `hire_date DATE` không phải `DATETIME`?**

```sql
DATE      → 2025-10-27 (Chỉ ngày)
DATETIME  → 2025-10-27 10:30:00 (Ngày + giờ)
```

**Hire date chỉ cần ngày:**

- "Nhân viên A vào làm ngày 1/1/2025" (không cần giờ)
- Tiết kiệm bộ nhớ: DATE = 3 bytes, DATETIME = 8 bytes

**Khi nào dùng DATETIME?**

- Check-in/check-out chấm công: Cần giờ chính xác
- Created_at, updated_at: Theo dõi thay đổi

```sql
-- 6. Bảng attendance (Chấm công)
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

### **🤔 TẠI SAO TÁCH `DATE` VÀ `TIME` RIÊNG?**

**Q: Tại sao không dùng `check_in DATETIME`?**

```sql
-- ❌ Dùng DATETIME
check_in DATETIME → 2025-10-27 08:30:00
check_out DATETIME → 2025-10-27 17:45:00

-- Query: "Tính tổng giờ làm trong tháng 10"
SELECT SUM(TIMEDIFF(check_out, check_in)) FROM attendance...
-- Phức tạp: Phải trừ ngày, trừ giờ

-- ✅ Dùng DATE + TIME riêng
date DATE → 2025-10-27
check_in TIME → 08:30:00
check_out TIME → 17:45:00

-- Query đơn giản hơn
SELECT date, TIMEDIFF(check_out, check_in) AS work_hours
FROM attendance
WHERE date BETWEEN '2025-10-01' AND '2025-10-31';
```

**Lợi ích:**

- Group by date dễ dàng
- Tính giờ làm chính xác
- Lưu trữ hiệu quả (DATE 3 bytes + TIME 3 bytes = 6 bytes vs DATETIME 8 bytes)

```sql
-- 7. Bảng leaves (Nghỉ phép)
CREATE TABLE leaves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

### **🤔 TẠI SAO DÙNG `ENUM` CHO STATUS?**

**Q: Tại sao không dùng VARCHAR?**

```sql
-- ❌ Dùng VARCHAR (Nguy hiểm)
status VARCHAR(20)

INSERT INTO leaves (status) VALUES ('approved');  ✅
INSERT INTO leaves (status) VALUES ('Approved');  ✅ Nhưng khác 'approved'!
INSERT INTO leaves (status) VALUES ('đã duyệt'); ✅ Nhưng query bị lỗi!
INSERT INTO leaves (status) VALUES ('xyz');       ✅ Cho phép giá trị vô lý!

-- ✅ Dùng ENUM (An toàn)
status ENUM('pending', 'approved', 'rejected')

INSERT INTO leaves (status) VALUES ('approved');  ✅
INSERT INTO leaves (status) VALUES ('Approved');  ❌ ERROR
INSERT INTO leaves (status) VALUES ('xyz');       ❌ ERROR
```

**Lợi ích ENUM:**

1. **Data validation**: Chỉ cho phép giá trị định sẵn
2. **Tiết kiệm bộ nhớ**: Lưu số thay vì chuỗi (1 byte vs 20 bytes)
3. **Auto-complete**: IDE gợi ý giá trị

**Q: Tại sao `DEFAULT 'pending'`?**

```sql
-- Không cần chỉ định status khi tạo đơn nghỉ phép
INSERT INTO leaves (employee_id, start_date, end_date, reason)
VALUES (1, '2025-11-01', '2025-11-03', 'Du lịch');
-- status tự động = 'pending'
```

**Workflow:**

```
1. Nhân viên tạo đơn → status = 'pending' (tự động)
2. Quản lý duyệt     → UPDATE status = 'approved'
3. Hoặc từ chối      → UPDATE status = 'rejected'
```

```sql
-- 8. Bảng reviews (Đánh giá)
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    review_date DATE,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

### **🤔 TẠI SAO `CHECK (rating BETWEEN 1 AND 5)`?**

**Q: CHECK constraint làm gì?**

```sql
CHECK (rating BETWEEN 1 AND 5)  → Chỉ cho phép số từ 1 đến 5
```

**Test:**

```sql
INSERT INTO reviews (employee_id, rating) VALUES (1, 5);   ✅
INSERT INTO reviews (employee_id, rating) VALUES (1, 3);   ✅
INSERT INTO reviews (employee_id, rating) VALUES (1, 1);   ✅
INSERT INTO reviews (employee_id, rating) VALUES (1, 0);   ❌ ERROR
INSERT INTO reviews (employee_id, rating) VALUES (1, 10);  ❌ ERROR
```

**Tại sao quan trọng?**

```php
// Frontend validation có thể bị bypass
<input type="number" min="1" max="5">  ← User có thể inspect element và sửa

// Database validation KHÔNG THỂ bypass
CHECK (rating BETWEEN 1 AND 5)  ← Đảm bảo 100% data hợp lệ
```

**Defense in depth:**

1. Frontend validation → UX tốt (báo lỗi ngay lập tức)
2. Backend validation (PHP) → Bảo vệ API
3. Database validation (CHECK) → Lớp bảo vệ cuối cùng

### **2.3. Import vào MySQL**

```bash
# Trong phpMyAdmin:
1. Chọn database "hrm_db"
2. Tab "Import"
3. Choose file: backend/init.sql
4. Click "Go"
```

**🔍 Kiểm tra kết quả:**

```sql
-- Xem danh sách tables
SHOW TABLES;

-- Xem cấu trúc bảng
DESCRIBE employees;

-- Test insert
INSERT INTO departments (name, description)
VALUES ('IT', 'Phòng công nghệ thông tin');
```

---

## 🎨 **BƯỚC 3: XÂY DỰNG GIAO DIỆN HTML (Tuần 2)**

### **🤔 TẠI SAO XÂY HTML TRƯỚC, CODE JAVASCRIPT SAU?**

**Workflow đúng:**

```
1. HTML structure (Xương) → Tạo khung tĩnh
2. CSS styling (Da)       → Làm đẹp
3. JavaScript (Hồn)       → Tương tác động
```

**Nếu làm ngược:**

```
❌ Viết JavaScript trước → Không biết gắn vào element nào
❌ Debug khó             → Không biết lỗi do HTML hay JS
```

**Nguyên tắc Progressive Enhancement:**

- HTML work → Thêm CSS
- CSS work → Thêm JavaScript
- Từng bước, dễ debug

### **3.1. Tạo file `index.html`**

```html
<!DOCTYPE html>
<html lang="vi">
            <div class="menu-section-title">
              <i class="fas fa-users"></i>
              <span>Nhân viên</span>
            </div>
            <button data-route="employees-add" class="menu-item">
              <i class="fas fa-user-plus"></i>
              <span>Thêm Nhân viên</span>
            </button>
            <!-- ... các menu khác ... -->
          </div>

          <!-- Nút đăng xuất -->
          <button id="logoutBtn" class="menu-item logout">
            <i class="fas fa-sign-out-alt"></i>
            <span>Đăng xuất</span>
          </button>
        </nav>
      </aside>

      <!-- CONTENT (Phần nội dung chính) -->
      <main class="content">
        <!-- Topbar -->
        <header class="topbar">
          <h1 id="pageTitle">Dashboard</h1>
          <button id="themeToggle" class="secondary">Toggle Theme</button>
        </header>

        <!-- View (Nơi hiển thị nội dung động) -->
        <section id="view" class="view"></section>
      </main>
    </div>

    <!-- Load JavaScript module -->
    <script type="module" src="app.js"></script>
  </body>
</html>
```

**Giải thích cấu trúc:**

- `#app`: Container toàn bộ ứng dụng
- `.sidebar`: Menu bên trái (fixed position)
- `.content`: Phần nội dung chính
- `#view`: Div để mount các module động (SPA)

---

## 🎨 **BƯỚC 4: CSS STYLING (Tuần 2-3)**

### **4.1. Tạo file `style.css`**

```css
/* ===== CSS VARIABLES (Biến màu sắc) ===== */
:root {
  /* Light theme colors */
  --bg: #0f172a;
  --surface: #ffffff;
  --text: #0f172a;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --success: #10b981;
  --danger: #ef4444;
  --border: #e5e7eb;
  --sidebar: #1e293b;

  /* Shadows */
  --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}

/* Dark theme */
.theme-dark {
  --surface: #1e293b;
  --text: #f1f5f9;
  --border: #334155;
  --sidebar: #0f172a;
}

/* ===== RESET & BASE ===== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--text);
  line-height: 1.6;
}

/* ===== LAYOUT ===== */
.app {
  display: flex;
  min-height: 100vh;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: 280px;
  background: var(--sidebar);
  color: #fff;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: width 0.3s ease;
  z-index: 50;
}

.sidebar.collapsed {
  width: 70px;
}

/* Sidebar Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  font-size: 18px;
  color: var(--primary);
}

/* Menu */
.menu {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-size: 14px;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.menu-item.active {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--primary-hover) 100%
  );
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* ===== CONTENT AREA ===== */
.content {
  flex: 1;
  margin-left: 280px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.sidebar.collapsed ~ .content {
  margin-left: 70px;
}

/* Topbar */
.topbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 10;
}

/* View (Content area) */
.view {
  padding: 20px;
}

/* ===== COMPONENTS ===== */

/* Card */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
}

/* Button */
button {
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button.primary {
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--primary-hover) 100%
  );
  color: #fff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
}

/* Input & Select */
input,
select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  font-size: 15px;
  transition: all 0.3s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Table */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.table th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 16px;
  text-align: left;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 13px;
  border-bottom: 2px solid var(--primary);
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.table tbody tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .content {
    margin-left: 0 !important;
  }
}
```

---

## 🚀 **BƯỚC 5: JAVASCRIPT CƠ BẢN (Tuần 3-4)**

### **5.1. Hiểu về Module Pattern**

JavaScript modules giúp tách code thành từng file riêng:

```javascript
// File: modules/example-module.js

// Export (xuất ra ngoài)
export const MyModule = {
  function1() {
    console.log("Function 1");
  },

  function2() {
    console.log("Function 2");
  },
};

// File: app.js

// Import (nhập vào)
import { MyModule } from "./modules/example-module.js";

MyModule.function1(); // Sử dụng
```

### **5.2. Tạo file `app.js` (Router chính)**

```javascript
// Import các modules
import { AuthModule } from "./modules/auth-module.js";
import { EmployeeDb } from "./modules/employee-db-module.js";

// Lấy các elements từ HTML
const viewEl = document.getElementById("view");
const pageTitleEl = document.getElementById("pageTitle");
const logoutBtn = document.getElementById("logoutBtn");

// Định nghĩa routes (Bảng định tuyến)
const routes = {
  dashboard: () => {
    pageTitleEl.textContent = "Dashboard";
    viewEl.innerHTML = "<h2>Chào mừng đến HRM System!</h2>";
  },

  "employees-add": () => {
    pageTitleEl.textContent = "Thêm Nhân viên";
    viewEl.innerHTML = `
            <div class="card">
                <h3>Form thêm nhân viên</h3>
                <form id="addForm">
                    <label>Tên:</label>
                    <input id="name" required />
                    
                    <label>Email:</label>
                    <input id="email" type="email" required />
                    
                    <button type="submit" class="primary">Thêm</button>
                </form>
            </div>
        `;

    // Xử lý form submit
    document.getElementById("addForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      console.log("Thêm:", { name, email });
    });
  },
};

// Hàm điều hướng SPA
function navigate(route) {
  const fn = routes[route] || routes.dashboard;
  fn();
  setActive(route);
}

// Đánh dấu menu active
function setActive(route) {
  document.querySelectorAll(".menu [data-route]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-route") === route);
  });
}

// Gắn sự kiện cho menu
function registerMenuHandlers() {
  document.querySelectorAll(".menu [data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(btn.getAttribute("data-route"));
    });
  });
}

// Khởi động app
function init() {
  registerMenuHandlers();
  navigate("dashboard");
}

init();
```

**Giải thích:**

- **Routes object**: Map route name → function
- **navigate()**: Điều hướng SPA không reload page
- **Event delegation**: Gắn event cho tất cả buttons

---

## 🔐 **BƯỚC 6: XÂY DỰNG BACKEND API (Tuần 4-5)**

### **6.1. Cấu trúc folder backend**

```
backend/
├── api.php              # Main router
├── config/
│   └── Database.php     # Kết nối database
├── models/
│   ├── BaseModel.php    # Base CRUD
│   └── EmployeeModel.php
└── controllers/
    └── EmployeeController.php
```

### **6.2. Tạo file `backend/config/Database.php`**

```php
<?php
class Database {
    private static $instance = null;
    private $connection;

    // Thông tin kết nối
    private $host = 'localhost';
    private $dbname = 'hrm_db';
    private $username = 'root';
    private $password = '';

    // Private constructor (Singleton pattern)
    private function __construct() {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            die(json_encode([
                'success' => false,
                'message' => 'Kết nối database thất bại: ' . $e->getMessage()
            ]));
        }
    }

    // Lấy instance duy nhất
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // Lấy connection
    public function getConnection() {
        return $this->connection;
    }
}
```

### **6.3. Tạo `backend/models/BaseModel.php`**

```php
<?php
class BaseModel {
    protected $db;
    protected $table;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // Lấy tất cả records
    public function getAll() {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table}");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    // Lấy 1 record theo ID
    public function getById($id) {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    // Thêm mới
    public function create($data) {
        $keys = array_keys($data);
        $placeholders = ':' . implode(', :', $keys);

        $sql = "INSERT INTO {$this->table} (" . implode(', ', $keys) . ")
                VALUES ($placeholders)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);

        return $this->db->lastInsertId();
    }

    // Cập nhật
    public function update($id, $data) {
        $keys = array_keys($data);
        $set = implode(', ', array_map(fn($key) => "$key = :$key", $keys));

        $sql = "UPDATE {$this->table} SET $set WHERE id = :id";

        $data['id'] = $id;
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }

    // Xóa
    public function delete($id) {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}
```

### **6.4. Tạo `backend/api.php` (Main Router)**

```php
<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Auto-load classes
require_once __DIR__ . '/config/Database.php';
require_once __DIR__ . '/controllers/EmployeeController.php';

// Lấy request method và path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

// Parse request body
$input = json_decode(file_get_contents('php://input'), true);

// Khởi tạo controllers
$employeeController = new EmployeeController();

// Routing
try {
    $routeKey = "$method:$path";

    switch ($routeKey) {
        case 'GET:employees':
            $employeeController->getAll();
            break;

        case 'POST:employees':
            $employeeController->create($input);
            break;

        case 'PUT:employees':
            $id = $input['id'] ?? null;
            unset($input['id']);
            $employeeController->update($id, $input);
            break;

        case 'DELETE:employees':
            $id = $input['id'] ?? null;
            $employeeController->delete($id);
            break;

        default:
            throw new Exception('Route không tồn tại');
    }
} catch (Exception $e) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
```

---

## 🔗 **BƯỚC 7: KẾT NỐI FRONTEND VỚI BACKEND (Tuần 5-6)**

### **7.1. Tạo `utils/api.js` (API Helper)**

```javascript
// Base URL của API
const API_BASE_URL = "http://localhost/ASM-HRM/backend/api.php";

// Hàm gọi API chung
async function callAPI(method, path, data = null) {
  const url = `${API_BASE_URL}?path=${path}`;

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data && (method === "POST" || method === "PUT" || method === "DELETE")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

// Export các hàm API
export const API = {
  getEmployees: () => callAPI("GET", "employees"),
  createEmployee: (data) => callAPI("POST", "employees", data),
  updateEmployee: (id, data) => callAPI("PUT", "employees", { ...data, id }),
  deleteEmployee: (id) => callAPI("DELETE", "employees", { id }),
};
```

### **7.2. Tạo `modules/employee-db-module.js`**

```javascript
import { API } from "../utils/api.js";

export const EmployeeDb = {
  async getAllEmployees() {
    try {
      const result = await API.getEmployees();
      return result.data;
    } catch (error) {
      console.error("Get employees error:", error);
      return [];
    }
  },

  async addEmployee(employeeData) {
    try {
      const result = await API.createEmployee(employeeData);
      return result.data;
    } catch (error) {
      throw new Error("Thêm nhân viên thất bại: " + error.message);
    }
  },
};
```

---

## 📊 **BƯỚC 8: XÂY DỰNG CÁC MODULE KHÁC (Tuần 6-8)**

Tiếp tục xây dựng các modules theo cùng pattern:

### **Các module cần làm:**

1. **Edit Employee Module** - Sửa thông tin nhân viên
2. **Delete Employee Module** - Xóa nhân viên
3. **Search Employee Module** - Tìm kiếm
4. **Department Module** - Quản lý phòng ban
5. **Position Module** - Quản lý vị trí
6. **Attendance Module** - Chấm công
7. **Leave Module** - Nghỉ phép
8. **Performance Module** - Đánh giá hiệu suất
9. **Salary Module** - Quản lý lương

---

## 🔐 **BƯỚC 9: AUTHENTICATION (Tuần 8)**

### **9.1. Tạo `backend/models/UserModel.php`**

```php
<?php
class UserModel extends BaseModel {
    protected $table = 'users';

    public function register($username, $password) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $data = [
            'username' => $username,
            'password' => $hashedPassword
        ];

        return $this->create($data);
    }

    public function login($username, $password) {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE username = :username");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new Exception('Tài khoản không tồn tại');
        }

        if (!password_verify($password, $user['password'])) {
            throw new Exception('Mật khẩu không đúng');
        }

        return $user;
    }
}
```

### **9.2. Tạo `modules/auth-module.js`**

```javascript
export const AuthModule = {
  async login(username, password) {
    const result = await API.callAPI("POST", "auth/login", {
      username,
      password,
    });

    localStorage.setItem("hrm_session", JSON.stringify(result.data));
    return result;
  },

  logout() {
    localStorage.removeItem("hrm_session");
    API.callAPI("POST", "auth/logout");
  },

  getSession() {
    const session = localStorage.getItem("hrm_session");
    return session ? JSON.parse(session) : null;
  },
};
```

---

## 🎨 **BƯỚC 10: HOÀN THIỆN UI/UX (Tuần 9)**

### **10.1. Thêm Dark Mode**

```javascript
function initTheme() {
  const savedTheme = localStorage.getItem("hrm_theme") || "light";

  if (savedTheme === "dark") {
    document.documentElement.classList.add("theme-dark");
  }

  document.getElementById("themeToggle").addEventListener("click", () => {
    document.documentElement.classList.toggle("theme-dark");

    const newTheme = document.documentElement.classList.contains("theme-dark")
      ? "dark"
      : "light";

    localStorage.setItem("hrm_theme", newTheme);
  });
}
```

### **10.2. Thêm Animations**

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.5s ease-out;
}
```

---

## 🧪 **BƯỚC 11: TESTING (Tuần 10)**

### **Manual Testing Checklist**

```markdown
## Test Authentication

- [ ] Đăng ký user mới
- [ ] Đăng nhập thành công
- [ ] Đăng nhập sai mật khẩu
- [ ] Đăng xuất

## Test Employees

- [ ] Thêm nhân viên mới
- [ ] Sửa thông tin nhân viên
- [ ] Xóa nhân viên
- [ ] Tìm kiếm nhân viên
- [ ] Xem danh sách

## Test UI

- [ ] Dark mode toggle
- [ ] Sidebar collapse
- [ ] Responsive mobile
- [ ] Form validation
```

---

## 🚀 **BƯỚC 12: DEPLOYMENT (Tuần 11)**

### **12.1. Chuẩn bị deploy**

1. **Tạo file `.env`:**

```env
DB_HOST_PROD=sql310.infinityfree.com
DB_NAME_PROD=if0_40226758_hrm
DB_USER_PROD=if0_40226758
DB_PASS_PROD=YourPassword123
```

2. **Cập nhật `api.js`:**

```javascript
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost/ASM-HRM/backend/api.php"
    : `${window.location.origin}/backend/api.php`;
```

3. **Upload lên hosting:**

- Upload toàn bộ files qua FTP
- Import database SQL
- Verify .env file

---

## 📚 **TÀI LIỆU THAM KHẢO**

### **HTML/CSS:**

- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS Tricks](https://css-tricks.com/)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

### **JavaScript:**

- [JavaScript.info](https://javascript.info/)
- [Eloquent JavaScript](https://eloquentjavascript.net/)
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS)

### **PHP:**

- [PHP Manual](https://www.php.net/manual/en/)
- [PDO Tutorial](https://phpdelusions.net/pdo)
- [PHP The Right Way](https://phptherightway.com/)

### **MySQL:**

- [MySQL Tutorial](https://www.mysqltutorial.org/)
- [SQL Basics](https://www.w3schools.com/sql/)

---

## ✅ **CHECKLIST HOÀN THÀNH**

### **Frontend:**

- [x] HTML Structure
- [x] CSS Styling
- [x] JavaScript Modules
- [x] SPA Routing
- [x] API Integration
- [x] Dark Mode
- [x] Responsive Design

### **Backend:**

- [x] Database Design
- [x] PHP API Router
- [x] Models (CRUD)
- [x] Controllers
- [x] Authentication
- [x] Security (SQL Injection, XSS)

### **Features:**

- [x] Employee Management
- [x] Department & Position
- [x] Attendance
- [x] Leave Management
- [x] Performance Review
- [x] Salary Calculation

### **Deployment:**

- [x] Environment Config
- [x] GitHub Actions
- [x] Hosting Setup
- [x] Testing

---

## 🎓 **KẾT LUẬN**

Bạn đã học được:

1. **Full-stack Development**: Frontend + Backend
2. **Modern JavaScript**: ES6+, Modules, Async/Await
3. **PHP Best Practices**: OOP, PDO, MVC pattern
4. **Database Design**: ERD, Relationships, Queries
5. **Security**: SQL Injection, XSS, Authentication
6. **DevOps**: Git, GitHub Actions, Deployment

**Chúc mừng! Bạn đã hoàn thành một dự án thực tế!** 🎉

---

## 💡 **TIPS CHO SINH VIÊN**

### **Khi gặp lỗi:**

1. Đọc kỹ error message
2. Console.log() để debug
3. Kiểm tra Network tab trong DevTools
4. Google error message
5. Hỏi ChatGPT/Claude

### **Best Practices:**

1. Commit code thường xuyên
2. Viết comment rõ ràng
3. Đặt tên biến có nghĩa
4. Test từng feature nhỏ
5. Backup code trước khi sửa lớn

### **Học thêm:**

1. Git & GitHub
2. API RESTful
3. Security (OWASP Top 10)
4. Performance Optimization
5. Testing (Unit, Integration)

---

**Chúc bạn học tốt và thành công!** 🚀
