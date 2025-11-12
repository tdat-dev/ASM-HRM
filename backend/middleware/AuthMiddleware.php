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
        'POST:auth/logout',
        'GET:auth/session', // Cho phép check session
        'OPTIONS:', // Preflight requests
    ];
    
    /**
     * Danh sách routes CHỈ ADMIN mới được truy cập
     */
    private static $adminOnlyRoutes = [
        'DELETE:employees',
        'DELETE:departments',
    ];

    /**
     * Simple role-based permissions map (demo)
     * - In production, drive this by DB/policies
     */
    private static $rolePermissions = [
        'admin' => ['*'],
        'hr' => [
            'GET:employees', 'POST:employees', 'PUT:employees', 'POST:employees/search',
            'GET:employees/stats',
            'GET:departments', 'POST:departments', 'PUT:departments',
            'GET:positions', 'POST:positions', 'PUT:positions',
            'GET:leaves', 'POST:leaves', 'POST:leaves/approve', 'POST:leaves/reject',
            'GET:leaves/pending-count',
            'GET:employee-profiles', 'PUT:employee-profiles', 'POST:employee-profiles/batch',
            'GET:attendance', 'POST:attendance/checkin', 'POST:attendance/checkout', 'POST:attendance/report',
            'GET:attendance/today-count',
            'GET:reviews', 'POST:reviews',
        ],
        'manager' => [
            'GET:employees', // ideally limited by department in controller
            'GET:employees/stats',
            'GET:departments', 'GET:positions',
            'GET:leaves', 'POST:leaves/approve', 'POST:leaves/reject', 'GET:leaves/pending-count',
            'POST:attendance/report', 'GET:attendance/today-count',
            'GET:reviews',
        ],
        'employee' => [
            'GET:employees', // can be restricted to self at controller
            'GET:employees/stats',
            'GET:departments', 'GET:positions',
            'GET:employee-profiles', 'PUT:employee-profiles', // self only in controller
            'GET:leaves', 'POST:leaves', 'GET:leaves/pending-count',
            'POST:attendance/checkin', 'POST:attendance/checkout', 'GET:attendance/today-count',
            'GET:reviews',
        ],
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
        
        // Kiểm tra role-based permissions
        self::checkRolePermission($method, $path);
        
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
     * Kiểm tra quyền theo role (đơn giản)
     */
    private static function checkRolePermission($method, $path) {
        $routeKey = "$method:$path";
        $role = $_SESSION['role'] ?? 'employee';

        // Admin full access
        if ($role === 'admin') {
            return true;
        }

        // Admin-only hard rules
        if (self::requiresAdmin($method, $path)) {
            self::deny('ADMIN_REQUIRED', 'Forbidden - Chỉ admin mới có quyền');
        }

        $allowed = self::$rolePermissions[$role] ?? [];
        // Exact match
        if (in_array($routeKey, $allowed, true)) {
            return true;
        }
        // Prefix match for grouped endpoints (e.g., GET:employee-profiles/123)
        foreach ($allowed as $pattern) {
            if ($pattern === '*') return true;
            if (strpos($routeKey, $pattern) === 0) return true;
        }
        self::deny('RBAC_FORBIDDEN', 'Forbidden - Không đủ quyền truy cập');
    }

    private static function deny($code, $message) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'error_code' => $code
        ], JSON_UNESCAPED_UNICODE);
        exit();
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
