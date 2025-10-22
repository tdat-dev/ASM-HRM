<?php
// Bật hiển thị lỗi cho môi trường phát triển
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Cho phép CORS - FIX: Thêm headers đầy đủ
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Xử lý preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Auto-require tất cả controllers
foreach (glob(__DIR__ . '/controllers/*.php') as $controller) {
    require_once $controller;
}

// Khởi tạo session
session_start();

// Lấy request method và path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

// Parse request body
$input = json_decode(file_get_contents('php://input'), true);

// Khởi tạo controllers
$controllers = [
    'auth' => new AuthController(),
    'employee' => new EmployeeController(),
    'department' => new DepartmentController(),
    'position' => new PositionController(),
    'attendance' => new AttendanceController(),
    'leave' => new LeaveController(),
    'review' => new ReviewController(),
];

// Định nghĩa routing table
$routes = [
    // Auth routes
    'POST:auth/login' => ['auth', 'login'],
    'POST:auth/register' => ['auth', 'register'],
    'POST:auth/logout' => ['auth', 'logout'],
    'GET:auth/session' => ['auth', 'getSession'],
    
    // Employee routes
    'GET:employees' => ['employee', 'getAll'],
    'POST:employees' => ['employee', 'create'],
    'POST:employees/search' => ['employee', 'search'],
    'GET:employees/stats' => ['employee', 'getStats'],
    
    // Department routes
    'GET:departments' => ['department', 'getAll'],
    'POST:departments' => ['department', 'create'],
    
    // Position routes
    'GET:positions' => ['position', 'getAll'],
    'POST:positions' => ['position', 'create'],
    
    // Attendance routes
    'GET:attendance' => ['attendance', 'getAll'],
    'POST:attendance/checkin' => ['attendance', 'checkIn'],
    'POST:attendance/checkout' => ['attendance', 'checkOut'],
    'POST:attendance/report' => ['attendance', 'getReport'],
    'GET:attendance/today-count' => ['attendance', 'getTodayCount'],
    
    // Leave routes
    'GET:leaves' => ['leave', 'getAll'],
    'POST:leaves' => ['leave', 'create'],
    'POST:leaves/approve' => ['leave', 'approve', ['id']],
    'POST:leaves/reject' => ['leave', 'reject', ['id']],
    'GET:leaves/pending-count' => ['leave', 'getPendingCount'],
    
    // Review routes
    'GET:reviews' => ['review', 'getAll'],
    'POST:reviews' => ['review', 'create'],
    'GET:reviews/top-performers' => ['review', 'getTopPerformers', ['limit']],
];

// Định nghĩa regex routes (có tham số động)
$regexRoutes = [
    'GET:employees/(\d+)' => ['employee', 'getById'],
    'PUT:employees/(\d+)' => ['employee', 'update'],
    'DELETE:employees/(\d+)' => ['employee', 'delete'],
    'PUT:departments/(\d+)' => ['department', 'update'],
    'DELETE:departments/(\d+)' => ['department', 'delete'],
    'PUT:positions/(\d+)' => ['position', 'update'],
    'DELETE:positions/(\d+)' => ['position', 'delete'],
    'GET:leaves/balance/(\d+)' => ['leave', 'getBalance'],
    'GET:reviews/average/(\d+)' => ['review', 'getAverage'],
];

/**
 * Router chính - xử lý tất cả requests
 */
try {
    $response = null;
    $routeKey = "$method:$path";
    
    // Kiểm tra static routes trước
    if (isset($routes[$routeKey])) {
        $response = handleStaticRoute($routes[$routeKey], $controllers, $input);
    } else {
        // Kiểm tra regex routes (có tham số động)
        $response = handleRegexRoute($regexRoutes, $routeKey, $controllers, $input);
    }
    
    // Nếu không tìm thấy route nào
    if ($response === null) {
        http_response_code(404);
        $response = [
            'success' => false,
            'message' => 'Route không tồn tại',
            'path' => $path,
            'method' => $method
        ];
    }
    
    // Trả về response dạng JSON
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    // Log error (trong production nên log vào file)
    error_log("API Error: " . $e->getMessage());
    
    // Trả về lỗi cho client
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi server',
        'error' => $e->getMessage(), // Trong production nên ẩn chi tiết lỗi
        'trace' => $e->getTraceAsString() // Chỉ dùng khi development
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * Xử lý static routes (không có tham số động)
 * 
 * @param array $route Route config [controller, method, params]
 * @param array $controllers Danh sách controllers
 * @param array|null $input Request body data
 * @return array Response data
 */
function handleStaticRoute($route, $controllers, $input) {
    [$controllerName, $methodName, $paramKeys] = array_pad($route, 3, null);
    
    if (!isset($controllers[$controllerName])) {
        throw new Exception("Controller không tồn tại: $controllerName");
    }
    
    $controller = $controllers[$controllerName];
    
    if (!method_exists($controller, $methodName)) {
        throw new Exception("Method không tồn tại: $controllerName::$methodName");
    }
    
    // Xử lý tham số từ input hoặc query string
    if ($paramKeys) {
        $args = [];
        foreach ($paramKeys as $key) {
            $args[] = $input[$key] ?? $_GET[$key] ?? null;
        }
        return $controller->$methodName(...$args);
    }
    
    // Gọi method với input (hoặc không có tham số)
    if ($input !== null) {
        return $controller->$methodName($input);
    }
    
    return $controller->$methodName();
}

/**
 * Xử lý regex routes (có tham số động như ID)
 * 
 * @param array $regexRoutes Danh sách regex routes
 * @param string $routeKey Format: "METHOD:path"
 * @param array $controllers Danh sách controllers
 * @param array|null $input Request body data
 * @return array|null Response data hoặc null nếu không match
 */
function handleRegexRoute($regexRoutes, $routeKey, $controllers, $input) {
    foreach ($regexRoutes as $pattern => $route) {
        if (!preg_match("#^$pattern$#", $routeKey, $matches)) {
            continue;
        }
        
        [$controllerName, $methodName] = $route;
        
        if (!isset($controllers[$controllerName])) {
            throw new Exception("Controller không tồn tại: $controllerName");
        }
        
        $controller = $controllers[$controllerName];
        
        if (!method_exists($controller, $methodName)) {
            throw new Exception("Method không tồn tại: $controllerName::$methodName");
        }
        
        // Lấy tham số từ URL (bỏ match đầu tiên là full string)
        $urlParams = array_slice($matches, 1);
        
        // Xử lý các method đặc biệt cần cả URL params và body
        if (in_array($methodName, ['update', 'delete'])) {
            if ($methodName === 'update') {
                return $controller->$methodName($urlParams[0], $input);
            }
            return $controller->$methodName($urlParams[0]);
        }
        
        // Gọi method với URL params
        return $controller->$methodName(...$urlParams);
    }
    
    return null;
}
