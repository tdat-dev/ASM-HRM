<?php
/**
 * AuthMiddleware - Bảo vệ các API endpoints
 * Kiểm tra session trước khi cho phép truy cập
 */
class AuthMiddleware {
    
    /**
     * Danh sách routes KHÔNG CẦN authentication
     */
    private static $publicRoutes = [
        'POST:auth/login',
        'POST:auth/register',
        'GET:auth/session', // Cho phép check session
        'OPTIONS:', // Preflight requests
    ];
    
    /**
     * Danh sách routes CHỈ ADMIN mới được truy cập
     */
    private static $adminOnlyRoutes = [
        'DELETE:employees',
        'DELETE:departments',
        'POST:leaves/approve',
        'POST:leaves/reject',
    ];
    
    /**
     * Kiểm tra xem route có cần authentication không
     */
    public static function isPublicRoute($method, $path) {
        $routeKey = "$method:$path";
        
        foreach (self::$publicRoutes as $publicRoute) {
            if (strpos($routeKey, $publicRoute) === 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Kiểm tra authentication - GỌI TRƯỚC MỌI REQUEST!
     */
    public static function check($method, $path) {
        // Nếu là public route, cho phép
        if (self::isPublicRoute($method, $path)) {
            return true;
        }
        
        // Kiểm tra session
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized - Vui lòng đăng nhập',
                'error_code' => 'AUTH_REQUIRED'
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
        
        // Kiểm tra admin role cho các routes đặc biệt
        if (self::requiresAdmin($method, $path)) {
            if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Forbidden - Chỉ admin mới có quyền',
                    'error_code' => 'ADMIN_REQUIRED'
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }
        
        return true;
    }
    
    /**
     * Kiểm tra route có cần quyền admin không
     */
    private static function requiresAdmin($method, $path) {
        $routeKey = "$method:$path";
        
        foreach (self::$adminOnlyRoutes as $adminRoute) {
            if (strpos($routeKey, $adminRoute) === 0) {
                return true;
            }
        }
        
        // Tất cả DELETE operations cần admin
        if ($method === 'DELETE') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Lấy thông tin user hiện tại
     */
    public static function getCurrentUser() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role'] ?? 'user'
        ];
    }
    
    /**
     * Kiểm tra CSRF token (cho POST/PUT/DELETE)
     */
    public static function checkCSRF($method) {
        // Chỉ check cho các method thay đổi data
        if (!in_array($method, ['POST', 'PUT', 'DELETE'])) {
            return true;
        }
        
        // Nếu là public route, bỏ qua CSRF check
        global $path;
        if (self::isPublicRoute($method, $path)) {
            return true;
        }
        
        // Get CSRF token from header
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $sessionToken = $_SESSION['csrf_token'] ?? '';
        
        if (empty($token) || empty($sessionToken) || $token !== $sessionToken) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'CSRF token invalid',
                'error_code' => 'CSRF_INVALID'
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
        
        return true;
    }
    
    /**
     * Generate CSRF token cho session
     */
    public static function generateCSRFToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        
        return $_SESSION['csrf_token'];
    }
}
