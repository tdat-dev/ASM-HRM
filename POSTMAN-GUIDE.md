# 📮 HƯỚNG DẪN POSTMAN - API BẢO MẬT

## 🚀 SETUP BAN ĐẦU

### 1. **Import Collection:**

1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file: `HRM-API.postman_collection.json`
4. Click **Import**

### 2. **BẬT COOKIES (QUAN TRỌNG!):**

```
Postman → Settings (⚙️) → General
✅ Bật: "Automatically follow redirects"
✅ Bật: "Send cookies"
```

**⚠️ KHÔNG BẬT COOKIES = KHÔNG DÙNG ĐƯỢC API!**

---

## 🔐 WORKFLOW ĐÚNG

### **Bước 1: Login**

```
1. Mở folder: "⚠️ START HERE - Authentication"
2. Chọn: "✅ Login (Admin)"
3. Click Send
4. Xem Console → "✅ Đã login thành công!"
```

**Response mẫu:**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### **Bước 2: Test API khác**

```
1. Mở folder: "👥 Employees (Protected)"
2. Chọn: "Get All Employees"
3. Click Send
4. → Success! (Postman tự động gửi cookie)
```

### **Bước 3: Test Admin Rights**

```
1. Chọn: "🔴 Delete Employee (Admin Only)"
2. Click Send
3. → Success! (vì đã login admin)
```

---

## 🔴 TEST SECURITY

### **Test 1: KHÔNG LOGIN**

```
1. Chọn "Logout" để xóa session
2. Thử gọi "Get All Employees"
3. → 401 Unauthorized ❌
```

**Response:**

```json
{
  "success": false,
  "message": "Unauthorized - Vui lòng đăng nhập",
  "error_code": "AUTH_REQUIRED"
}
```

### **Test 2: USER THƯỜNG XÓA DATA**

```
1. Login với: "Login (User thường)"
   - username: user
   - password: 123456

2. Thử: "🔴 Delete Employee"
3. → 403 Forbidden ❌
```

**Response:**

```json
{
  "success": false,
  "message": "Forbidden - Chỉ admin mới có quyền",
  "error_code": "ADMIN_REQUIRED"
}
```

### **Test 3: ADMIN XÓA DATA**

```
1. Login với: "✅ Login (Admin)"
   - username: admin
   - password: 123456

2. Thử: "🔴 Delete Employee"
3. → 200 Success ✅
```

---

## 🎯 TEST ACCOUNTS

| Username | Password | Role  | Quyền                            |
| -------- | -------- | ----- | -------------------------------- |
| admin    | 123456   | admin | Full access (bao gồm DELETE)     |
| user     | 123456   | user  | GET/POST/PUT only (KHÔNG DELETE) |

---

## 📊 PERMISSIONS TABLE

| Endpoint                | Public | User | Admin |
| ----------------------- | ------ | ---- | ----- |
| POST /auth/login        | ✅     | ✅   | ✅    |
| POST /auth/register     | ✅     | ✅   | ✅    |
| GET /auth/session       | ✅     | ✅   | ✅    |
| GET /employees          | ❌     | ✅   | ✅    |
| POST /employees         | ❌     | ✅   | ✅    |
| PUT /employees/:id      | ❌     | ✅   | ✅    |
| DELETE /employees/:id   | ❌     | ❌   | ✅    |
| DELETE /departments/:id | ❌     | ❌   | ✅    |
| POST /leaves/approve    | ❌     | ❌   | ✅    |

---

## 🐛 TROUBLESHOOTING

### ❌ Lỗi: "Unauthorized" mặc dù đã login?

**Nguyên nhân:** Cookies không được gửi

**Giải pháp:**

1. Check Settings → Send cookies: ✅
2. Kiểm tra Cookies tab (bên dưới Send button)
3. Phải có cookie: `PHPSESSID`
4. Thử login lại

---

### ❌ Lỗi: "PHPSESSID cookie not found"?

**Giải pháp:**

```
1. Postman → Settings → Cookies
2. Tìm domain: localhost
3. Xóa tất cả cookies cũ
4. Login lại
```

---

### ❌ Lỗi: "Forbidden" khi DELETE?

**Nguyên nhân:** Đang login với user thường

**Giải pháp:**

```
1. Logout
2. Login lại với admin account
3. Thử DELETE lại
```

---

## 💡 TIPS & TRICKS

### **1. Xem Session hiện tại:**

```
GET /auth/session
→ Cho biết: đã login chưa, role gì
```

### **2. Test Scripts tự động:**

Các request đã có test scripts:

- Login → Check success + cookie
- Protected APIs → Hiển thị lỗi auth rõ ràng
- Delete → Check admin rights

**Xem Console (Ctrl+Alt+C) để thấy messages!**

### **3. Variables:**

```
{{baseUrl}} = http://localhost/ASM-HRM/backend/api.php

Có thể thay đổi trong:
Collection → Variables → baseUrl
```

### **4. Export/Share Collection:**

```
Collection → ... → Export
→ Chia sẻ cho team!
```

---

## 🔥 COMMON WORKFLOWS

### **Workflow 1: Test CRUD hoàn chỉnh**

```
1. Login (Admin)
2. GET /employees (xem list)
3. POST /employees (tạo mới)
4. GET /employees/:id (xem chi tiết)
5. PUT /employees/:id (update)
6. DELETE /employees/:id (xóa)
7. Logout
```

### **Workflow 2: Test phân quyền**

```
1. Login (User thường)
2. GET /employees → ✅ Success
3. POST /employees → ✅ Success
4. DELETE /employees/1 → ❌ 403 Forbidden
5. Logout
6. Login (Admin)
7. DELETE /employees/1 → ✅ Success
```

### **Workflow 3: Test security**

```
1. Logout (hoặc không login)
2. GET /employees → ❌ 401 Unauthorized
3. POST /employees → ❌ 401 Unauthorized
4. Login
5. GET /employees → ✅ Success
```

---

## 📝 REQUEST EXAMPLES

### **Login Request:**

```http
POST {{baseUrl}}?path=auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

### **Create Employee (Cần login):**

```http
POST {{baseUrl}}?path=employees
Content-Type: application/json
Cookie: PHPSESSID=abc123...

{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "phone": "0123456789",
  "position_id": 1,
  "department_id": 1,
  "hire_date": "2024-01-15",
  "salary": 15000000
}
```

### **Delete Employee (Cần admin):**

```http
DELETE {{baseUrl}}?path=employees/1
Cookie: PHPSESSID=abc123...
```

---

## ✅ CHECKLIST

Trước khi test API:

- [ ] Đã import collection
- [ ] Đã bật cookies trong Settings
- [ ] Đã login với account phù hợp
- [ ] Kiểm tra PHPSESSID cookie tồn tại
- [ ] Xem Console để debug

---

## 🎓 HỌC POSTMAN NÂNG CAO

### **Tests & Scripts:**

```javascript
// Pre-request Script (chạy trước khi send)
pm.sendRequest("{{baseUrl}}?path=auth/session", function (err, res) {
  console.log(res.json());
});

// Test Script (chạy sau khi nhận response)
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response time < 200ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(200);
});
```

### **Environment Variables:**

```
Tạo environment: "Local", "Production"
Variables:
- baseUrl (khác nhau giữa local/prod)
- adminUsername
- adminPassword
```

### **Collection Runner:**

```
Collection → Run
→ Chạy tất cả requests theo thứ tự
→ Kiểm tra toàn bộ API một lần!
```

---

**🎉 Chúc bạn test API thành công!**
