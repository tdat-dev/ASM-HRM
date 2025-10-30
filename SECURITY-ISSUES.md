# 🔒 BẢO MẬT API - QUAN TRỌNG!

## ❌ **CÁC LỖ HỔNG BẢO MẬT ĐÃ PHÁT HIỆN:**

### 1. **KHÔNG CÓ AUTHENTICATION** (Nghiêm trọng nhất!)

**Trước khi fix:**

```bash
# Bất kỳ ai cũng có thể:
GET http://localhost/ASM-HRM/backend/api.php?path=employees
# → Lấy toàn bộ dữ liệu nhân viên!

POST http://localhost/ASM-HRM/backend/api.php?path=employees
# → Tạo nhân viên mới!

DELETE http://localhost/ASM-HRM/backend/api.php?path=employees/1
# → Xóa nhân viên!
```

**❌ Hậu quả:**

- Ai cũng xem được data
- Ai cũng CRUD được
- Không cần đăng nhập!

---

### 2. **KHÔNG CÓ AUTHORIZATION (Phân quyền)**

```php
// User bình thường có thể xóa employees!
public function delete($id) {
    $this->employeeModel->delete($id);
}
```

**❌ Hậu quả:**

- User thường xóa được data
- Không phân biệt admin/user

---

### 3. **CORS quá rộng**

```php
header("Access-Control-Allow-Origin: *"); // ❌ CHO PHÉP MỌI NGUỒN!
```

**❌ Hậu quả:**

- Bất kỳ website nào cũng gọi được API
- CSRF attacks dễ dàng

---

### 4. **Không có Rate Limiting (trừ login)**

```php
// Chỉ login có rate limit
// Các endpoint khác KHÔNG!
```

**❌ Hậu quả:**

- DDoS API
- Spam tạo data
- Brute force IDs

---

### 5. **Lộ thông tin nhạy cảm trong error**

```php
'error' => $e->getMessage(),
'trace' => $e->getTraceAsString() // ❌ LỘ CẤU TRÚC SERVER
```

---

## ✅ **GIẢI PHÁP - ĐÃ THÊM AuthMiddleware!**

### **Cách hoạt động:**

```php
// api.php
AuthMiddleware::check($method, $path);
// ↑ Kiểm tra TRƯỚC MỌI request!
```

### **Public Routes (không cần login):**

```php
'POST:auth/login',      // Đăng nhập
'POST:auth/register',   // Đăng ký
'GET:auth/session',     // Check session
```

### **Protected Routes (cần login):**

```php
GET  /employees       // Cần login
POST /employees       // Cần login
PUT  /employees/1     // Cần login
```

### **Admin Only Routes:**

```php
DELETE /employees/1         // Chỉ admin
DELETE /departments/1       // Chỉ admin
POST   /leaves/approve      // Chỉ admin
```

---

## 🧪 **TEST SECURITY:**

### ❌ Test 1: Bypass authentication (SẼ FAIL)

```bash
# Trước khi login
GET http://localhost/ASM-HRM/backend/api.php?path=employees

# Response:
{
  "success": false,
  "message": "Unauthorized - Vui lòng đăng nhập",
  "error_code": "AUTH_REQUIRED"
}
# HTTP 401
```

### ✅ Test 2: Login trước (SẼ PASS)

```bash
# Step 1: Login
POST http://localhost/ASM-HRM/backend/api.php?path=auth/login
Body: {"username": "admin", "password": "123456"}

# Step 2: Gọi API (dùng cùng session/cookie)
GET http://localhost/ASM-HRM/backend/api.php?path=employees
# → Success!
```

### ❌ Test 3: User thường xóa data (SẼ FAIL)

```bash
# Login với user thường (không phải admin)
POST auth/login
Body: {"username": "user", "password": "123456"}

# Thử xóa employee
DELETE http://localhost/ASM-HRM/backend/api.php?path=employees/1

# Response:
{
  "success": false,
  "message": "Forbidden - Chỉ admin mới có quyền",
  "error_code": "ADMIN_REQUIRED"
}
# HTTP 403
```

---

## 🔐 **POSTMAN SETUP:**

### 1. **Enable Cookies trong Postman:**

- Settings → General → "Cookies and domains"
- Bật "Automatically follow redirects"
- Bật "Send cookies"

### 2. **Workflow đúng:**

```
1. POST auth/login
   → Lưu session/cookie tự động

2. GET employees
   → Postman tự động gửi cookie
   → Success!

3. DELETE employees/1
   → Check role admin
   → Success nếu là admin
```

### 3. **Test từng role:**

**Test Admin:**

```json
POST auth/login
{
  "username": "admin",
  "password": "123456"
}

// Sau đó test DELETE, sẽ pass!
```

**Test User thường:**

```json
POST auth/login
{
  "username": "user",
  "password": "123456"
}

// Sau đó test DELETE, sẽ fail với 403!
```

---

## 📊 **SECURITY CHECKLIST:**

- [x] ✅ Authentication check trước mọi request
- [x] ✅ Authorization (phân quyền admin/user)
- [x] ✅ Session-based authentication
- [x] ✅ Rate limiting cho login
- [ ] ⚠️ CSRF protection (đã chuẩn bị, chưa enable)
- [ ] ⚠️ Rate limiting cho tất cả endpoints
- [x] ✅ Input validation
- [x] ✅ SQL Injection protection (Prepared Statements)
- [ ] ⚠️ XSS protection
- [ ] ⚠️ HTTPS required (hosting)

---

## 🚨 **QUAN TRỌNG - ĐỂ PRODUCTION:**

### 1. **Tắt debug mode:**

```php
ini_set('display_errors', 0);
error_reporting(E_ERROR | E_WARNING);
```

### 2. **Ẩn error details:**

```php
// KHÔNG trả về trace!
'error' => 'Internal Server Error', // Chung chung
// 'trace' => $e->getTraceAsString() // ❌ XÓA DÒNG NÀY!
```

### 3. **Tắt CORS wildcard:**

```php
// ❌ KHÔNG DÙNG:
header("Access-Control-Allow-Origin: *");

// ✅ CHỈ CHO PHÉP DOMAIN CỤ THỂ:
header("Access-Control-Allow-Origin: https://your-domain.com");
```

### 4. **Enable HTTPS:**

```php
// Bắt buộc HTTPS
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') {
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit();
}
```

### 5. **Add Rate Limiting cho tất cả endpoints:**

```php
// Giới hạn 100 requests/phút cho mỗi IP
RateLimiter::check($_SERVER['REMOTE_ADDR'], 100, 60);
```

---

## 💡 **KẾT LUẬN:**

**TRƯỚC FIX:** API hoàn toàn không bảo mật, ai cũng CRUD được!

**SAU FIX:**

- ✅ Phải login mới dùng được
- ✅ Phân quyền admin/user rõ ràng
- ✅ Session-based authentication
- ✅ Error handling tốt hơn

**Còn thiếu (nâng cao):**

- CSRF protection
- Rate limiting toàn bộ
- JWT tokens (thay session)
- API key authentication
- IP whitelist

---

**🔥 Test kỹ trong Postman trước khi deploy!**
