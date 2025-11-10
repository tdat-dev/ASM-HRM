# 🏢 HRM System - Human Resource Management

Hệ thống quản lý nhân sự được xây dựng bằng **Vanilla JavaScript** thuần túy, không sử dụng framework.

## 🚀 Tính năng

### 👤 Quản lý Nhân viên

- ✅ Thêm, sửa, xóa nhân viên
- ✅ Tìm kiếm theo tên, phòng ban, khoảng lương
- ✅ Hiển thị mã nhân viên, badge styling

### 🏢 Quản lý Phòng ban & Vị trí

- ✅ CRUD operations
- ✅ Gán nhân viên vào phòng ban/vị trí
- ✅ Lương cơ sở theo vị trí

### ⏰ Chấm công

- ✅ Check-in/Check-out hàng ngày
- ✅ Tính số giờ làm việc
- ✅ Báo cáo chấm công theo thời gian

### 🏖️ Nghỉ phép

- ✅ Tạo yêu cầu nghỉ phép
- ✅ Duyệt/từ chối yêu cầu
- ✅ Tính số ngày phép còn lại (20 ngày/năm)

### ⭐ Đánh giá Hiệu suất

- ✅ Rating 1-5 sao
- ✅ Feedback chi tiết
- ✅ Top performers ranking

### 💰 Bảng lương

- ✅ Tính lương thực lĩnh (base + bonus - deduction)
- ✅ Format VNĐ với thousand separator
- ✅ Báo cáo chi tiết

### 📊 Dashboard

- ✅ 4 stat cards với gradient colors
- ✅ Biểu đồ nhân viên theo phòng ban
- ✅ Thống kê tài chính real-time
- ✅ Bảng nhân viên gần đây

### 🔐 Authentication

- ✅ Đăng ký/Đăng nhập
- ✅ Hash password
- ✅ Session management

### 🎨 UI/UX

- ✅ Dark/Light theme toggle
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Modern gradient cards

## 🛠️ Công nghệ

- **Frontend:** Vanilla JavaScript ES6+
- **Styling:** CSS3 (Variables, Flexbox, Grid)
- **Storage:** LocalStorage
- **Architecture:** Module Pattern, SPA

## 📂 Cấu trúc Project

```
ASM-HRM/
├── index.html                      # Entry point
├── app.js                          # Main app, routing
├── style.css                       # Global styles
├── modules/                        # Feature modules
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
└── utils/                          # Utilities
    ├── dom.js                      # DOM helpers
    ├── validators.js               # Input validation
    └── storage.js                  # LocalStorage wrapper
```

## 🚀 Cách chạy

### Option 1: Trực tiếp

```bash
# Mở file index.html trong browser
open index.html  # macOS
start index.html # Windows
```

### Option 2: Live Server (Recommended)

```bash
# Nếu dùng VS Code, cài extension "Live Server"
# Right-click index.html → Open with Live Server
```

### Option 3: Simple HTTP Server

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Truy cập: http://localhost:8000
```

## 👨‍💻 Default User

```
Username: admin
Password: admin123
```

## 📖 JavaScript Nâng cao

### ES6+ Features

- ✅ Arrow Functions
- ✅ Template Literals
- ✅ Destructuring
- ✅ Spread Operator
- ✅ Optional Chaining
- ✅ Nullish Coalescing
- ✅ ES6 Modules (import/export)

### Array Methods

- ✅ map(), filter(), reduce()
- ✅ find(), some(), every()
- ✅ sort(), slice(), splice()

### Advanced Concepts

- ✅ Closures
- ✅ Higher-order Functions
- ✅ Async/Await
- ✅ Promises
- ✅ Event Delegation
- ✅ Module Pattern

## 🧪 Testing

### Manual Testing

1. Đăng ký user mới
2. Đăng nhập
3. Thêm nhân viên → Check dashboard
4. Check-in/out → Xem báo cáo
5. Tạo yêu cầu nghỉ phép → Duyệt
6. Đánh giá nhân viên → Check ranking
7. Xem bảng lương
8. Toggle dark mode
9. Test responsive trên mobile
10. Reset data → Verify

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## 📸 Screenshots

### Dashboard

![Dashboard](docs/dashboard.png)

### Employee Management

![Employees](docs/employees.png)

### Dark Mode

![Dark Mode](docs/dark-mode.png)

## 🎯 Clean Code Principles

1. **Descriptive Naming:** `readFromLocalStorage` not `read`
2. **Constants:** `EMPLOYEES_STORAGE_KEY` not `"hrm_employees"`
3. **Single Responsibility:** 1 function = 1 task
4. **DRY:** Don't Repeat Yourself
5. **Comments:** JSDoc for public APIs
6. **Error Handling:** Try-catch blocks
7. **Validation:** Always validate user input

## 📝 Documentation

- [SECURITY-FIXES.md](./SECURITY-FIXES.md) - Báo cáo khắc phục lỗ hổng bảo mật
- [XSS-EXPLAINED.md](./XSS-EXPLAINED.md) - Giải thích chi tiết về XSS và cách phòng chống
- [SECURITY.md](./SECURITY.md) - Tài liệu bảo mật tổng quan
- [SECURITY-ISSUES.md](./SECURITY-ISSUES.md) - Các vấn đề bảo mật đã phát hiện

### Demo XSS Vulnerability

Mở file `demo-xss-vulnerability.html` trong trình duyệt để xem demo trực quan về:
- Cách XSS hoạt động
- So sánh code trước/sau khi sửa
- Các kịch bản tấn công phổ biến

**📖 Hướng dẫn chi tiết:** Xem [HUONG-DAN-DEMO-XSS.md](./HUONG-DAN-DEMO-XSS.md) để hiểu cách sử dụng demo từng bước.

## 📝 Commit Message Guide

### Thiết Lập Template (Chạy 1 lần)

**Windows:**
```bash
.\git-commit-template-setup.bat
```

**Linux/Mac:**
```bash
chmod +x .git-commit-template-setup.sh
./git-commit-template-setup.sh
```

Hoặc thiết lập thủ công:
```bash
git config commit.template .gitmessage
```

### Format Commit Message

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Ví dụ:**
```bash
git commit -m "feat(ess): thêm form nộp đơn nghỉ phép"
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`  
**Scopes:** `ess`, `auth`, `payroll`, `recruitment`, `leave`, `attendance`, etc.

Xem chi tiết tại [COMMIT-GUIDE.md](./COMMIT-GUIDE.md)

### Quy Tắc Đặt Tên Nhánh

```
type/short-description
```

**Ví dụ:**
- `feature/ess-leave-request-form`
- `fix/payroll-tax-calculation`
- `refactor/auth-module-split`

## 🤝 Contributing

Đây là assignment cá nhân, không nhận contributions.

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập.

## 👨‍🎓 Author

**[Tên của bạn]**  
Lớp: WD1113  
Trường: LearnVTC  
Ngày: October 2025

## 🙏 Credits

- Design inspiration: Modern admin dashboards
- Icons: Unicode emoji
- Gradient colors: [uiGradients](https://uigradients.com)

---

⭐ Nếu bạn thấy project hữu ích, hãy star repo này!
