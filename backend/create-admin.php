<?php
/**
 * Script tạo tài khoản admin mới
 * Chạy file này 1 lần duy nhất trên hosting để tạo tài khoản admin
 * Sau đó XÓA file này để bảo mật
 */

require_once __DIR__ . '/config/Database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Thông tin admin
    $username = 'admin';
    $password = '123456'; // Password mặc định, user có thể đổi sau
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Kiểm tra xem admin đã tồn tại chưa
    $stmt = $db->prepare("SELECT id FROM users WHERE username = :username");
    $stmt->execute(['username' => $username]);
    
    if ($stmt->fetch()) {
        // Update password nếu đã tồn tại
        $stmt = $db->prepare("UPDATE users SET password = :password WHERE username = :username");
        $stmt->execute([
            'password' => $hashedPassword,
            'username' => $username
        ]);
        echo "✅ Đã cập nhật password cho user 'admin'<br>";
    } else {
        // Tạo mới nếu chưa tồn tại
        $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
        $stmt->execute([
            'username' => $username,
            'password' => $hashedPassword
        ]);
        echo "✅ Đã tạo user 'admin' thành công<br>";
    }
    
    echo "<br>";
    echo "📝 <strong>Thông tin đăng nhập:</strong><br>";
    echo "Username: <strong>{$username}</strong><br>";
    echo "Password: <strong>{$password}</strong><br>";
    echo "<br>";
    echo "⚠️ <strong style='color: red;'>QUAN TRỌNG:</strong><br>";
    echo "1. Hãy đăng nhập ngay để test<br>";
    echo "2. Đổi password sau khi đăng nhập<br>";
    echo "3. <strong style='color: red;'>XÓA file create-admin.php này ngay lập tức để bảo mật!</strong><br>";
    
} catch (Exception $e) {
    echo "❌ Lỗi: " . $e->getMessage();
}
?>
