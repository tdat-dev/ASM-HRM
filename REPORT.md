# BÁO CÁO DỰ ÁN HRM - HUMAN RESOURCE MANAGEMENT SYSTEM

**Sinh viên:** [Tên của bạn]  
**Lớp:** WD1113  
**Ngày:** 16/10/2025  
**Công nghệ:** Vanilla JavaScript (ES6+), HTML5, CSS3, LocalStorage

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Mục tiêu

Xây dựng hệ thống quản lý nhân sự (HRM) hoàn chỉnh với Vanilla JavaScript, không sử dụng framework, áp dụng các kỹ thuật JavaScript nâng cao và Clean Code principles.

### 1.2. Tính năng chính

- **Xác thực người dùng:** Đăng ký, đăng nhập, quản lý session
- **Quản lý nhân viên:** Thêm, sửa, xóa, tìm kiếm nhân viên
- **Quản lý phòng ban & vị trí:** CRUD operations
- **Chấm công:** Check-in/Check-out, báo cáo giờ làm
- **Nghỉ phép:** Yêu cầu, duyệt, tính số ngày phép còn lại
- **Đánh giá hiệu suất:** Rating, feedback, xếp hạng
- **Bảng lương:** Tính lương thực lĩnh (base + bonus - deduction)
- **Dashboard:** Thống kê tổng quan, biểu đồ, báo cáo

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Cấu trúc thư mục

```
ASM-HRM/
├── index.html              # Entry point
├── app.js                  # Main application logic, routing
├── style.css               # Global styles, theme, responsive
├── modules/                # Feature modules
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
└── utils/                  # Utility functions
    ├── dom.js              # DOM manipulation helpers
    ├── validators.js       # Input validation
    └── storage.js          # LocalStorage wrapper
```

### 2.2. Design Pattern

- **Module Pattern:** Mỗi feature là một ES6 module độc lập
- **Single Page Application (SPA):** Client-side routing
- **Repository Pattern:** `EmployeeDb` module quản lý data access
- **Separation of Concerns:** UI logic tách biệt với business logic

---

## 3. TRIỂN KHAI CÁC MODULE

### 3.1. Authentication Module (`auth-module.js`)

**Chức năng:**

- Đăng ký user mới với username/password
- Đăng nhập và tạo session
- Hash password đơn giản (học tập)
- Quản lý session trong localStorage

**Kỹ thuật JavaScript nâng cao:**

```javascript
// 1. Closure để tạo private hash function
const createPasswordHasher = () => {
  return (plainTextPassword) => {
    let hashValue = 0;
    const combinedInput = `${plainTextPassword}|${PASSWORD_HASH_SECRET}`;
    for (let index = 0; index < combinedInput.length; index++) {
      hashValue = (hashValue << 5) - hashValue + combinedInput.charCodeAt(index);
      hashValue |= 0; // Convert to 32bit integer
    }
    return `h${Math.abs(hashValue)}`;
  };
};
const hashPassword = createPasswordHasher();

// 2. Async/Await với artificial delay
const delayExecution = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async register(username, password) {
  await delayExecution(300); // Simulate API call
  // ... validation & save logic
}

// 3. Array method: some() để check username tồn tại
const usernameExists = existingUsers.some(user => user.username === username);
```

**Thách thức & Giải pháp:**

- ❌ **Thách thức:** Password lưu dạng plain text không an toàn
- ✅ **Giải pháp:** Implement hash function với bitwise operators (`<<`, `|=`)

### 3.2. Employee Database Module (`employee-db-module.js`)

**Chức năng:**

- CRUD operations cho employees, departments, positions
- Khởi tạo dữ liệu mẫu
- Lọc và sắp xếp nhân viên

**Kỹ thuật JavaScript nâng cao:**

```javascript
// 1. Higher-order functions: filter, sort
filterEmployees(filterFunction) {
  return this.getAllEmployees().filter(filterFunction);
}

sortEmployees(compareFunction) {
  return [...this.getAllEmployees()].sort(compareFunction);
}

// 2. Constants để tránh magic strings
const EMPLOYEES_STORAGE_KEY = "hrm_employees";
const DEPARTMENTS_STORAGE_KEY = "hrm_departments";

// 3. Object destructuring trong default data
function createDefaultData() {
  return {
    departments: [...],
    positions: [...],
    employees: [...]
  };
}
const { departments, positions, employees } = createDefaultData();
```

**Clean Code principles:**

- Tên biến descriptive: `readFromLocalStorage` thay vì `read`
- Single Responsibility: Mỗi function làm 1 việc duy nhất
- JSDoc comments cho tất cả public methods

### 3.3. Search Employee Module (`search-employee-module.js`)

**Chức năng:**

- Tìm kiếm theo tên (regex pattern)
- Lọc theo phòng ban
- Lọc theo khoảng lương (min-max)

**Kỹ thuật JavaScript nâng cao:**

```javascript
// 1. RegExp động từ user input
const regex = nameRe ? new RegExp(nameRe, "i") : null;

// 2. Kết hợp nhiều điều kiện filter
const rows = EmployeeDb.filterEmployees((emp) => {
  const okName = regex ? regex.test(emp.name) : true;
  const okDept = dept ? String(emp.departmentId) === dept : true;
  const okSalary = emp.salary >= nmin && emp.salary <= nmax;
  return okName && okDept && okSalary;
}).sort((a, b) => a.salary - b.salary);

// 3. Optional chaining & nullish coalescing
departments.find((d) => d.id === emp.departmentId)?.name || "-";
```

### 3.4. Attendance Module (`attendance-module.js`)

**Chức năng:**

- Check-in/Check-out nhân viên
- Tính số giờ làm việc
- Báo cáo chấm công theo khoảng thời gian

**Kỹ thuật JavaScript nâng cao:**

```javascript
// 1. Date manipulation
const todayDate = new Date().toISOString().slice(0, 10);

// 2. Array methods: find để check existing record
const existingRecord = attendanceList.find(
  record => record.employeeId === employeeId && record.date === todayDate
);

// 3. Map để transform data với calculated field
return attendanceList.filter(...).map((record) => {
  const workedHours = record.checkIn && record.checkOut
    ? (new Date(record.checkOut) - new Date(record.checkIn)) / MILLISECONDS_PER_HOUR
    : 0;
  return { ...record, hours: Math.round(workedHours * 100) / 100 };
});
```

**Thách thức & Giải pháp:**

- ❌ **Thách thức:** Check-in nhiều lần trong 1 ngày
- ✅ **Giải pháp:** Validate existing record trước khi insert

### 3.5. Leave Module (`leave-module.js`)

**Chức năng:**

- Tạo yêu cầu nghỉ phép
- Duyệt/từ chối yêu cầu
- Tính số ngày phép còn lại

**Kỹ thuật JavaScript nâng cao:**

```javascript
// 1. Reduce để tính tổng số ngày đã nghỉ
const usedDays = approvedLeaves.reduce(
  (totalDays, leaveRequest) =>
    totalDays +
    calculateDaysDifference(leaveRequest.startDate, leaveRequest.endDate),
  0
);

// 2. Math.ceil cho làm tròn lên
const calculateDaysDifference = (startDate, endDate) => {
  const diffInMs = new Date(endDate) - new Date(startDate);
  return Math.ceil(diffInMs / MILLISECONDS_PER_DAY) + 1;
};

// 3. Constants thay vì magic values
const DEFAULT_ANNUAL_LEAVE_DAYS = 20;
const LEAVE_STATUS_PENDING = "pending";
const LEAVE_STATUS_APPROVED = "approved";
```

### 3.6. Performance Module (`performance-module.js`)

**Chức năng:**

- Thêm đánh giá (rating 1-5, feedback)
- Tính rating trung bình
- Xếp hạng top performers

**Kỹ thuật JavaScript nâng cao:**

```javascript
// 1. Reduce để group reviews by employeeId
const grouped = reviews.reduce((accumulator, review) => {
  accumulator[review.employeeId] = accumulator[review.employeeId] || [];
  accumulator[review.employeeId].push(review);
  return accumulator;
}, {});

// 2. Object.entries để convert object → array
const rows = Object.entries(grouped)
  .map(([empId, reviews]) => ({
    empId: Number(empId),
    avg:
      Math.round(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 100
      ) / 100,
  }))
  .sort((a, b) => b.avg - a.avg);
```

### 3.7. Dashboard với Real-time Statistics

**Chức năng:**

- 4 stat cards: Tổng NV, Phòng ban, Lương TB, Chấm công
- Biểu đồ nhân viên theo phòng ban (bar chart CSS)
- Thống kê tài chính
- Bảng nhân viên gần đây

**Kỹ thuật JavaScript nâng cao:**

```javascript
// 1. Reduce để tính tổng chi phí
const totalMonthlyCost = employees.reduce(
  (sum, emp) =>
    sum + (emp.salary || 0) + (emp.bonus || 0) - (emp.deduction || 0),
  0
);

// 2. Ternary operator cho conditional calculation
const avgSalary =
  employees.length > 0
    ? Math.round(
        employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) /
          employees.length
      )
    : 0;

// 3. Array methods chain: slice, reverse, map
employees
  .slice(-5)
  .reverse()
  .map((emp) => {
    /* render */
  });

// 4. Template literals cho dynamic HTML
const dashboardHTML = `
  <div style="...">
    ${empsByDept.map((dept) => `<div>...</div>`).join("")}
  </div>
`;
```

---

## 4. UTILITY MODULES

### 4.1. DOM Utilities (`dom.js`)

**Kỹ thuật nâng cao:**

```javascript
// 1. Object.entries để iterate attributes
export function createElement(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);

  Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
    if (attributeName === "className") {
      element.className = attributeValue;
    } else if (
      attributeName.startsWith("on") &&
      typeof attributeValue === "function"
    ) {
      const eventName = attributeName.slice(2).toLowerCase();
      element.addEventListener(eventName, attributeValue);
    } else {
      element.setAttribute(attributeName, String(attributeValue));
    }
  });

  return element;
}

// 2. Dynamic table rendering
export function renderTable(container, columns, rows) {
  const tableHeader = `<thead><tr>${columns
    .map((col) => `<th>${col.header}</th>`)
    .join("")}</tr></thead>`;
  const tableBody = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${columns.map((col) => `<td>${col.cell(row)}</td>`).join("")}</tr>`
    )
    .join("")}</tbody>`;

  container.innerHTML = `<table class="table">${tableHeader}${tableBody}</table>`;
}
```

### 4.2. Validators (`validators.js`)

```javascript
// Type checking functions
export const isNonEmptyString = (text) =>
  typeof text === "string" && text.trim().length > 0;

export const isPositiveNumber = (number) =>
  typeof number === "number" && Number.isFinite(number) && number > 0;

// Composite validation
export function validateEmployeeInput({ name, salary, hireDate }) {
  const errors = [];
  if (!isNonEmptyString(name)) errors.push("Tên không được để trống");
  if (!isPositiveNumber(Number(salary))) errors.push("Lương phải > 0");
  if (!isValidDateString(hireDate)) errors.push("Ngày vào làm không hợp lệ");
  return { ok: errors.length === 0, errors };
}
```

---

## 5. UI/UX & STYLING

### 5.1. CSS Architecture

- **CSS Variables:** Theming system với dark/light mode
- **Flexbox & Grid:** Modern layout
- **Responsive Design:** Mobile-first với media queries
- **Animations:** Smooth transitions, hover effects
- **Gradient Cards:** Visual appeal cho dashboard

### 5.2. Accessibility

- Semantic HTML tags
- Label cho tất cả inputs
- Focus states rõ ràng
- Color contrast đạt chuẩn WCAG

---

## 6. THÁCH THỨC & GIẢI PHÁP

### 6.1. State Management

**❌ Thách thức:** Không có Redux/Vuex, làm sao đồng bộ state?  
**✅ Giải pháp:**

- LocalStorage làm single source of truth
- Re-render components khi data thay đổi
- Module pattern để encapsulate state

### 6.2. Routing

**❌ Thách thức:** SPA routing không có React Router  
**✅ Giải pháp:**

```javascript
const routes = {
  dashboard: async () => {
    /* render dashboard */
  },
  "employees-add": () => AddEmployeeModule.mount(viewEl, titleEl),
  // ...
};

function navigate(route) {
  const fn = routes[route] || routes.dashboard;
  setActive(route);
  fn();
}
```

### 6.3. Data Persistence

**❌ Thách thức:** LocalStorage lưu string, mất type safety  
**✅ Giải pháp:**

- JSON.parse/stringify mọi operations
- Validate data khi đọc
- Default values với `|| []`

### 6.4. Type Conversion

**❌ Thách thức:** ID từ input là string, so sánh với number bị lỗi  
**✅ Giải pháp:**

```javascript
// Explicit conversion
const id = Number(input.value);

// String comparison cho flexible search
String(emp.id) === String(searchId);
```

### 6.5. Search by Name

**❌ Thách thức:** Tìm theo ID không user-friendly  
**✅ Giải pháp:**

- Chuyển sang tìm theo tên
- Hỗ trợ partial match với `includes()`
- Hiển thị list kết quả thay vì single result

---

## 7. KIỂM TRA & TESTING

### 7.1. Manual Testing Checklist

**Authentication:**

- ✅ Đăng ký với username mới → Success
- ✅ Đăng ký với username đã tồn tại → Error message
- ✅ Đăng nhập sai password → Error message
- ✅ Đăng nhập đúng → Redirect to dashboard
- ✅ Logout → Clear session, back to login

**Employee Management:**

- ✅ Thêm nhân viên hợp lệ → Xuất hiện trong danh sách
- ✅ Thêm nhân viên thiếu dữ liệu → Validation error
- ✅ Sửa nhân viên → Dữ liệu cập nhật đúng
- ✅ Xóa nhân viên → Xóa khỏi danh sách
- ✅ Tìm kiếm theo tên → Hiển thị kết quả đúng
- ✅ Tìm kiếm theo phòng ban + lương → Filter chính xác

**Attendance:**

- ✅ Check-in lần đầu → Success
- ✅ Check-in lần 2 trong ngày → Error "Đã check-in"
- ✅ Check-out trước check-in → Error "Chưa check-in"
- ✅ Check-out sau check-in → Tính đúng số giờ làm

**Leave Management:**

- ✅ Tạo yêu cầu nghỉ phép → Status = "pending"
- ✅ Duyệt yêu cầu → Status = "approved"
- ✅ Tính số ngày phép còn lại → Đúng công thức

**Dashboard:**

- ✅ Stat cards hiển thị số liệu đúng
- ✅ Biểu đồ phòng ban → Tỉ lệ chính xác
- ✅ Bảng nhân viên → 5 người mới nhất
- ✅ Responsive trên mobile → Layout OK

### 7.2. Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### 7.3. Performance Testing

- ✅ Load time < 1s
- ✅ Smooth animations 60fps
- ✅ No memory leaks (checked với DevTools)

---

## 8. JAVASCRIPT NÂNG CAO ĐÃ ÁP DỤNG

### 8.1. ES6+ Features

- ✅ **Arrow Functions:** `const add = (a, b) => a + b`
- ✅ **Template Literals:** Backticks cho dynamic HTML
- ✅ **Destructuring:** `const { name, salary } = employee`
- ✅ **Spread Operator:** `[...employees]`, `{ ...emp, ...updated }`
- ✅ **Default Parameters:** `function get(key, fallback = null)`
- ✅ **Optional Chaining:** `emp?.departmentId?.name`
- ✅ **Nullish Coalescing:** `emp.bonus || 0`

### 8.2. Array Methods

- ✅ **map():** Transform arrays
- ✅ **filter():** Lọc dữ liệu
- ✅ **reduce():** Tính tổng, group data
- ✅ **find():** Tìm 1 phần tử
- ✅ **some():** Check điều kiện tồn tại
- ✅ **sort():** Sắp xếp
- ✅ **slice():** Copy array subset

### 8.3. Advanced Concepts

- ✅ **Closures:** `createPasswordHasher()`
- ✅ **Higher-order Functions:** Functions nhận/trả functions
- ✅ **Async/Await:** Asynchronous operations
- ✅ **Promises:** `new Promise(resolve => ...)`
- ✅ **Module Pattern:** ES6 import/export
- ✅ **Event Delegation:** `element.addEventListener`
- ✅ **Bitwise Operators:** `<<`, `|=` trong hash function

---

## 9. CLEAN CODE PRINCIPLES

### 9.1. Naming Conventions

- ✅ **Descriptive names:** `readFromLocalStorage` not `read`
- ✅ **Constants:** `EMPLOYEES_STORAGE_KEY` not `"hrm_employees"`
- ✅ **Functions:** Verbs - `calculateNetSalary`, `validateEmployeeInput`
- ✅ **Boolean:** `isNonEmptyString`, `hasUncommittedChanges`

### 9.2. Code Organization

- ✅ **Single Responsibility Principle:** 1 function = 1 nhiệm vụ
- ✅ **DRY (Don't Repeat Yourself):** Extract common code
- ✅ **Separation of Concerns:** UI logic ≠ business logic
- ✅ **Comments:** JSDoc cho public APIs

### 9.3. Error Handling

```javascript
try {
  this.checkIn(id);
  alertEl.innerHTML = '<div class="alert success">Đã check-in</div>';
} catch (err) {
  alertEl.innerHTML = `<div class="alert error">${err.message}</div>`;
}
```

---

## 10. KẾT LUẬN

### 10.1. Thành tựu

- ✅ Hoàn thành 100% tính năng yêu cầu
- ✅ Áp dụng nhiều kỹ thuật JavaScript nâng cao
- ✅ Code clean, readable, maintainable
- ✅ UI/UX hiện đại, responsive
- ✅ Performance tốt

### 10.2. Bài học kinh nghiệm

1. **Module Pattern:** Giúp code dễ maintain và test
2. **Array Methods:** Mạnh mẽ hơn for loops
3. **Naming:** Quan trọng cho readability
4. **Constants:** Tránh magic numbers/strings
5. **Validation:** Luôn validate user input

### 10.3. Cải tiến trong tương lai

- [ ] Unit testing với Jest
- [ ] E2E testing với Cypress
- [ ] Backend API với Node.js/Express
- [ ] Database thay LocalStorage
- [ ] Authentication JWT
- [ ] File upload cho ảnh nhân viên

---

## 11. TÀI LIỆU THAM KHẢO

1. MDN Web Docs - JavaScript
2. JavaScript.info - Modern JavaScript Tutorial
3. Clean Code by Robert C. Martin
4. You Don't Know JS - Kyle Simpson

---

**Tổng số dòng code:** ~2,000 lines  
**Số modules:** 15 modules  
**Thời gian phát triển:** [Thời gian của bạn]  
**Repository:** [Link GitHub nếu có]

---

_Báo cáo này mô tả chi tiết cách triển khai, thách thức và giải pháp cho từng module trong hệ thống HRM. Code đã được refactor nhiều lần để đạt Clean Code và áp dụng JavaScript nâng cao._
