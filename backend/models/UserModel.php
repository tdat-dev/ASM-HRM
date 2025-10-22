<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * User Model - Xử lý authentication với bảo mật cao
 */
class UserModel extends BaseModel {
    protected $table = 'users';
    
    /**
     * Tìm user theo username - SỬ DỤNG PREPARED STATEMENT để tránh SQL Injection
     */
    public function findByUsername($username) {
        try {
            // Sanitize input - loại bỏ ký tự đặc biệt nguy hiểm
            $username = trim($username);
            $username = strip_tags($username);
            
            // Validate username format
            if (!preg_match('/^[a-zA-Z0-9_-]{3,50}$/', $username)) {
                throw new Exception("Username không hợp lệ. Chỉ chấp nhận chữ, số, gạch ngang và gạch dưới (3-50 ký tự)");
            }
            
            // SỬ DỤNG PREPARED STATEMENT - An toàn tuyệt đối với SQL Injection
            // PDO tự động escape các ký tự nguy hiểm trong :username
            $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE username = :username");
            $stmt->execute(['username' => $username]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error in findByUsername: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Tạo user mới với password đã hash
     */
    public function register($username, $password) {
        // Sanitize và validate username
        $username = trim($username);
        $username = strip_tags($username);
        
        if (!preg_match('/^[a-zA-Z0-9_-]{3,50}$/', $username)) {
            throw new Exception("Username không hợp lệ. Chỉ chấp nhận chữ, số, gạch ngang và gạch dưới (3-50 ký tự)");
        }
        
        // Validate password strength
        if (strlen($password) < 6) {
            throw new Exception("Password phải có ít nhất 6 ký tự");
        }
        
        if (strlen($password) > 255) {
            throw new Exception("Password quá dài (tối đa 255 ký tự)");
        }
        
        // Kiểm tra username đã tồn tại
        if ($this->findByUsername($username)) {
            throw new Exception("Username đã tồn tại");
        }
        
        // Hash password với bcrypt (an toàn nhất)
        // PASSWORD_DEFAULT sử dụng bcrypt với cost factor cao
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Sử dụng prepared statement trong BaseModel::create()
        return $this->create([
            'username' => $username,
            'password' => $hashedPassword
        ]);
    }
    
    /**
     * Xác thực user - CHỐNG TIMING ATTACK
     */
    public function authenticate($username, $password) {
        $user = $this->findByUsername($username);
        
        // QUAN TRỌNG: Luôn gọi password_verify() dù user không tồn tại
        // Để tránh Timing Attack (kẻ tấn công không biết username có tồn tại hay không)
        $dummyHash = '$2y$10$abcdefghijklmnopqrstuv1234567890123456789012345678';
        $passwordToVerify = $user ? $user['password'] : $dummyHash;
        
        // password_verify() tự động so sánh an toàn, chống timing attack
        $isValidPassword = password_verify($password, $passwordToVerify);
        
        if ($user && $isValidPassword) {
            // Không trả password về client
            unset($user['password']);
            return $user;
        }
        
        return false;
    }
}
