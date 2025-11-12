<?php
require_once __DIR__ . '/../models/UserModel.php';

/**
 * AuthController - Xử lý xác thực người dùng với bảo mật cao
 * - Chống SQL Injection (Prepared Statements)
 * - Chống Brute Force (Rate Limiting)
 * - Session Security (Regenerate ID)
 * - Input Validation
 */
class AuthController {
    private $userModel;
    private $maxLoginAttempts = 5; // Tối đa 5 lần thử
    private $lockoutTime = 900; // Khóa 15 phút (900 giây)
    
    public function __construct() {
        $this->userModel = new UserModel();
    }
    
    /**
     * Kiểm tra rate limiting - Chống Brute Force Attack
     */
    private function checkRateLimit($username) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $key = 'login_attempts_' . md5($username);
        $lockKey = 'login_locked_' . md5($username);
        
        // Kiểm tra xem có bị khóa không
        if (isset($_SESSION[$lockKey]) && $_SESSION[$lockKey] > time()) {
            $remainingTime = ceil(($_SESSION[$lockKey] - time()) / 60);
            throw new Exception("Tài khoản tạm khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau {$remainingTime} phút");
        }
        
        // Đếm số lần thử
        if (!isset($_SESSION[$key])) {
            $_SESSION[$key] = ['count' => 0, 'first_attempt' => time()];
        }
        
        // Reset nếu đã quá thời gian
        if (time() - $_SESSION[$key]['first_attempt'] > $this->lockoutTime) {
            $_SESSION[$key] = ['count' => 0, 'first_attempt' => time()];
        }
        
        return $_SESSION[$key]['count'];
    }
    
    /**
     * Tăng số lần đăng nhập thất bại
     */
    private function incrementFailedAttempts($username) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $key = 'login_attempts_' . md5($username);
        $lockKey = 'login_locked_' . md5($username);
        
        $_SESSION[$key]['count']++;
        
        // Nếu vượt quá số lần cho phép, khóa tài khoản
        if ($_SESSION[$key]['count'] >= $this->maxLoginAttempts) {
            $_SESSION[$lockKey] = time() + $this->lockoutTime;
        }
    }
    
    /**
     * Reset số lần thử sau khi đăng nhập thành công
     */
    private function resetFailedAttempts($username) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $key = 'login_attempts_' . md5($username);
        $lockKey = 'login_locked_' . md5($username);
        
        unset($_SESSION[$key]);
        unset($_SESSION[$lockKey]);
    }
    
    /**
     * Đăng nhập - AN TOÀN TUYỆT ĐỐI
     */
    public function login($data) {
        try {
            // Validate input
            if (empty($data['username']) || empty($data['password'])) {
                return [
                    'success' => false,
                    'message' => 'Vui lòng nhập đủ thông tin'
                ];
            }
            
            // Sanitize username
            $username = trim($data['username']);
            $username = strip_tags($username);
            $username = htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
            
            $password = $data['password'];
            
            // Kiểm tra rate limiting (Chống Brute Force)
            $attempts = $this->checkRateLimit($username);
            
            // Xác thực user (Prepared Statements trong UserModel)
            $user = $this->userModel->authenticate($username, $password);
            
            if ($user) {
                // Đăng nhập thành công
                
                // Reset failed attempts
                $this->resetFailedAttempts($username);
                
                // Tạo session an toàn
                if (session_status() === PHP_SESSION_NONE) {
                    session_start();
                }
                
                // QUAN TRỌNG: Regenerate session ID để chống Session Fixation
                session_regenerate_id(true);
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                // Simple demo role mapping; in production, load from DB
                $uname = strtolower($user['username']);
                $role = 'employee';
                if ($uname === 'admin') $role = 'admin';
                elseif ($uname === 'hr') $role = 'hr';
                elseif ($uname === 'manager') $role = 'manager';
                $_SESSION['role'] = $role;
                $_SESSION['login_time'] = time();
                $_SESSION['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
                
                return [
                    'success' => true,
                    'message' => 'Đăng nhập thành công',
                    'data' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'role' => $_SESSION['role']
                    ]
                ];
            }
            
            // Đăng nhập thất bại
            $this->incrementFailedAttempts($username);
            $remainingAttempts = $this->maxLoginAttempts - $attempts - 1;
            
            if ($remainingAttempts > 0) {
                return [
                    'success' => false,
                    'message' => "Sai thông tin đăng nhập. Còn {$remainingAttempts} lần thử"
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Sai thông tin đăng nhập'
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Đăng ký - AN TOÀN với Validation
     */
    public function register($data) {
        try {
            if (empty($data['username']) || empty($data['password'])) {
                return [
                    'success' => false,
                    'message' => 'Vui lòng nhập đủ thông tin'
                ];
            }
            
            // Sanitize username
            $username = trim($data['username']);
            $username = strip_tags($username);
            $username = htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
            
            // Password validation sẽ được thực hiện trong UserModel
            $password = $data['password'];
            
            // UserModel::register() sử dụng Prepared Statements
            $userId = $this->userModel->register($username, $password);
            
            return [
                'success' => true,
                'message' => 'Đăng ký thành công',
                'user_id' => $userId
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Đăng xuất - Xóa session an toàn
     */
    public function logout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Xóa tất cả session variables
        $_SESSION = array();
        
        // Xóa session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }
        
        // Hủy session
        session_destroy();
        
        return [
            'success' => true,
            'message' => 'Đã đăng xuất'
        ];
    }
    
    /**
     * Lấy thông tin session hiện tại
     */
    public function getSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (isset($_SESSION['user_id'])) {
            // Validate session timeout (30 phút)
            $sessionTimeout = 1800; // 30 minutes
            if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time'] > $sessionTimeout)) {
                $this->logout();
                return [
                    'success' => false,
                    'message' => 'Session đã hết hạn. Vui lòng đăng nhập lại'
                ];
            }
            
            // Validate IP address (Chống Session Hijacking)
            $currentIP = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $sessionIP = $_SESSION['ip_address'] ?? 'unknown';
            
            if ($currentIP !== $sessionIP) {
                $this->logout();
                return [
                    'success' => false,
                    'message' => 'Phát hiện truy cập bất thường. Vui lòng đăng nhập lại'
                ];
            }
            
            return [
                'success' => true,
                'data' => [
                    'id' => $_SESSION['user_id'],
                    'username' => $_SESSION['username'],
                    'role' => $_SESSION['role'] ?? 'employee'
                ]
            ];
        }
        
        return [
            'success' => false,
            'message' => 'Chưa đăng nhập'
        ];
    }
}
