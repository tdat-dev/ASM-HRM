# 🔧 Hướng Dẫn Khắc Phục Lỗi Đăng Nhập Trên Hosting

## ❌ Vấn Đề

Không thể đăng nhập với tài khoản admin trên hosting vì:

- Password hash trong SQL không đúng
- Database có thể chưa có user admin
- Hoặc password đã bị thay đổi

---

## ✅ Giải Pháp 1: Chạy Script Tạo Admin (KHUYẾN NGHỊ)

### Bước 1: Upload file

Upload file `backend/create-admin.php` lên hosting vào thư mục `backend/`

### Bước 2: Chạy script

Truy cập URL trong trình duyệt:

```
https://your-domain.com/backend/create-admin.php
```

### Bước 3: Xem kết quả

Script sẽ hiển thị:

```
✅ Đã tạo/cập nhật user 'admin' thành công

📝 Thông tin đăng nhập:
Username: admin
Password: 123456

⚠️ QUAN TRỌNG:
1. Hãy đăng nhập ngay để test
2. Đổi password sau khi đăng nhập
3. XÓA file create-admin.php ngay lập tức để bảo mật!
```

### Bước 4: Đăng nhập

Truy cập app và đăng nhập với:

- **Username:** `admin`
- **Password:** `123456`

### Bước 5: BẢO MẬT

**🔴 CỰC KỲ QUAN TRỌNG:**
Sau khi đăng nhập thành công, **XÓA NGAY** file `backend/create-admin.php` khỏi hosting!

---

## ✅ Giải Pháp 2: Tạo Thủ Công Qua phpMyAdmin

### Bước 1: Mở phpMyAdmin trên hosting

### Bước 2: Chọn database của bạn

### Bước 3: Mở tab SQL

### Bước 4: Chạy query sau

```sql
-- Xóa user admin cũ nếu có
DELETE FROM users WHERE username = 'admin';

-- Tạo user admin mới
-- Username: admin
-- Password: 123456
INSERT INTO users (username, password)
VALUES ('admin', '$2y$10$eXVqZ8jF7.nY2nKjXxWxZuqh1qH4RdJ5YVN/8VzqJhXtJYNLKXxGy');
```

### Bước 5: Đăng nhập

- **Username:** `admin`
- **Password:** `123456`

---

## ✅ Giải Pháp 3: Import Lại Database

### Bước 1: Backup database hiện tại (quan trọng!)

### Bước 2: Import file mới

Import file `backend/init-hosting.sql` đã được sửa

File này đã có:

- Password hash đúng cho admin
- Username: admin
- Password: 123456

### Bước 3: Đăng nhập

---

## 🔍 Kiểm Tra Password Hash

Nếu muốn kiểm tra password hash có đúng không, tạo file test:

```php
<?php
// test-password.php
$password = '123456';
$hash = '$2y$10$eXVqZ8jF7.nY2nKjXxWxZuqh1qH4RdJ5YVN/8VzqJhXtJYNLKXxGy';

if (password_verify($password, $hash)) {
    echo "✅ Password hash ĐÚNG!";
} else {
    echo "❌ Password hash SAI!";
}
?>
```

Upload lên hosting và truy cập để test.
**Nhớ xóa file này sau khi test!**

---

## 📝 Tạo Password Hash Mới (Nếu Cần)

Nếu muốn tạo password hash mới cho password khác:

```php
<?php
// generate-hash.php
$password = 'your-new-password'; // Đổi password ở đây

$hash = password_hash($password, PASSWORD_DEFAULT);

echo "Password: {$password}<br>";
echo "Hash: {$hash}<br>";
echo "<br>";
echo "Copy hash này vào SQL query";
?>
```

---

## 🚨 Lưu Ý Bảo Mật

1. **XÓA tất cả file test sau khi dùng:**

   - `create-admin.php`
   - `test-password.php`
   - `generate-hash.php`

2. **Đổi password ngay sau lần đăng nhập đầu tiên**

3. **Không để lộ password trong code**

4. **Sử dụng .env file cho production**

---

## 📊 Troubleshooting

### Vẫn không đăng nhập được?

**1. Kiểm tra database connection:**

- File `.env` có đúng thông tin không?
- Database name, username, password đúng chưa?

**2. Kiểm tra bảng users:**

```sql
SELECT * FROM users WHERE username = 'admin';
```

- Có user admin không?
- Password hash có đúng định dạng $2y$ không?

**3. Kiểm tra PHP error logs:**

- Xem trong Control Panel → Error Logs
- Hoặc thêm vào `backend/api.php`:

```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

**4. Test API trực tiếp:**

```
POST https://your-domain.com/backend/api.php?path=auth/login
Body: {"username": "admin", "password": "123456"}
```

---

## ✅ Checklist Sau Khi Sửa

- [ ] Đã tạo/cập nhật user admin
- [ ] Đã test đăng nhập thành công
- [ ] Đã XÓA file create-admin.php
- [ ] Đã XÓA file test-password.php (nếu có)
- [ ] Đã XÓA file generate-hash.php (nếu có)
- [ ] Đã đổi password admin
- [ ] Đã kiểm tra .env file không bị commit lên Git

---

## 📞 Liên Hệ Support

Nếu vẫn gặp vấn đề:

1. Check error logs trên hosting
2. Test API endpoint với Postman
3. Verify database connection
4. Check PHP version (cần >= 7.4)

---

**Last Updated:** 29/10/2025  
**Version:** 1.0.0
