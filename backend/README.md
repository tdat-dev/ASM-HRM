# HRM Backend API - Hướng dẫn sử dụng

## 📁 Cấu trúc đã tạo

```
backend/
├── config/
│   └── Database.php          # Kết nối MySQL với Singleton
├── models/
│   ├── BaseModel.php         # Base Model với CRUD cơ bản
│   ├── UserModel.php         # Authentication
│   ├── EmployeeModel.php     # Quản lý nhân viên
│   ├── DepartmentModel.php   # Phòng ban & Vị trí
│   ├── AttendanceModel.php   # Chấm công
│   ├── LeaveModel.php        # Nghỉ phép
│   └── ReviewModel.php       # Đánh giá hiệu suất
└── init.sql                  # Script khởi tạo database
```

## 🚀 Các bước cài đặt

### 1. Cài đặt XAMPP

- Download: https://www.apachefriends.org/
- Khởi động Apache và MySQL

### 2. Tạo Database

```bash
# Mở phpMyAdmin: http://localhost/phpmyadmin
# Import file: backend/init.sql
# Hoặc chạy lệnh:
mysql -u root -p < backend/init.sql
```

### 3. Cấu hình Database

Chỉnh sửa `backend/config/Database.php` nếu cần:

```php
private $host = 'localhost';
private $dbname = 'hrm_db';
private $username = 'root';
private $password = '';
```

### 4. Test kết nối

Tạo file `backend/test.php`:

```php
<?php
require_once 'config/Database.php';
$db = Database::getInstance()->getConnection();
echo "Kết nối thành công!";
```

## 📝 Các bước tiếp theo (Bạn cần làm)

### 1. Tạo Controllers

Tạo các file trong `backend/controllers/`:

**AuthController.php**:

```php
<?php
require_once __DIR__ . '/../models/UserModel.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new UserModel();
    }

    public function login($data) {
        $user = $this->userModel->authenticate(
            $data['username'],
            $data['password']
        );

        if ($user) {
            // Tạo session hoặc JWT token
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];

            return [
                'success' => true,
                'user' => $user
            ];
        }

        return [
            'success' => false,
            'message' => 'Sai thông tin đăng nhập'
        ];
    }

    public function register($data) {
        try {
            $userId = $this->userModel->register(
                $data['username'],
                $data['password']
            );

            return [
                'success' => true,
                'user_id' => $userId
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function logout() {
        session_start();
        session_destroy();
        return ['success' => true];
    }
}
```

**EmployeeController.php**:

```php
<?php
require_once __DIR__ . '/../models/EmployeeModel.php';

class EmployeeController {
    private $employeeModel;

    public function __construct() {
        $this->employeeModel = new EmployeeModel();
    }

    public function getAll() {
        $employees = $this->employeeModel->getAllWithDetails();
        return [
            'success' => true,
            'data' => $employees
        ];
    }

    public function create($data) {
        try {
            // Validate
            if (empty($data['name']) || empty($data['salary'])) {
                throw new Exception("Thiếu dữ liệu bắt buộc");
            }

            $id = $this->employeeModel->create($data);
            return [
                'success' => true,
                'id' => $id
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function update($id, $data) {
        try {
            $this->employeeModel->update($id, $data);
            return ['success' => true];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function delete($id) {
        try {
            $this->employeeModel->delete($id);
            return ['success' => true];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function search($filters) {
        $employees = $this->employeeModel->search($filters);
        return [
            'success' => true,
            'data' => $employees
        ];
    }
}
```

Tạo tương tự cho:

- DepartmentController.php
- PositionController.php
- AttendanceController.php
- LeaveController.php
- ReviewController.php

### 2. Tạo API Router (`backend/api.php`)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Autoload controllers
require_once 'controllers/AuthController.php';
require_once 'controllers/EmployeeController.php';
// ... require các controller khác

// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$data = json_decode(file_get_contents('php://input'), true) ?? [];

// Routing
try {
    $response = null;

    // AUTH ROUTES
    if ($path === '/api/login' && $method === 'POST') {
        $controller = new AuthController();
        $response = $controller->login($data);
    }
    elseif ($path === '/api/register' && $method === 'POST') {
        $controller = new AuthController();
        $response = $controller->register($data);
    }
    elseif ($path === '/api/logout' && $method === 'POST') {
        $controller = new AuthController();
        $response = $controller->logout();
    }

    // EMPLOYEE ROUTES
    elseif ($path === '/api/employees' && $method === 'GET') {
        $controller = new EmployeeController();
        $response = $controller->getAll();
    }
    elseif ($path === '/api/employees' && $method === 'POST') {
        $controller = new EmployeeController();
        $response = $controller->create($data);
    }
    elseif (preg_match('/^\/api\/employees\/(\d+)$/', $path, $matches) && $method === 'PUT') {
        $controller = new EmployeeController();
        $response = $controller->update($matches[1], $data);
    }
    elseif (preg_match('/^\/api\/employees\/(\d+)$/', $path, $matches) && $method === 'DELETE') {
        $controller = new EmployeeController();
        $response = $controller->delete($matches[1]);
    }
    elseif ($path === '/api/employees/search' && $method === 'POST') {
        $controller = new EmployeeController();
        $response = $controller->search($data);
    }

    // TODO: Thêm routes cho departments, positions, attendance, leaves, reviews

    else {
        $response = [
            'success' => false,
            'message' => 'Endpoint not found'
        ];
        http_response_code(404);
    }

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
```

### 3. Cập nhật Frontend để gọi API

Tạo file `utils/api.js`:

```javascript
// Base API URL
const API_BASE = "http://localhost/ASM-HRM/backend/api.php";

// API Helper
export const api = {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  },
};
```

Cập nhật `modules/employee-db-module.js`:

```javascript
import { api } from "../utils/api.js";

export const EmployeeDb = {
  async getAllEmployees() {
    const response = await api.get("/employees");
    return response.data;
  },

  async saveEmployees(employees) {
    // Not needed - use create/update individually
  },

  async createEmployee(employee) {
    return await api.post("/employees", employee);
  },

  async updateEmployee(id, employee) {
    return await api.put(`/employees/${id}`, employee);
  },

  async deleteEmployee(id) {
    return await api.delete(`/employees/${id}`);
  },

  async searchEmployees(filters) {
    const response = await api.post("/employees/search", filters);
    return response.data;
  },
};
```

## 🎯 Checklist hoàn thành

- [x] Database schema (init.sql)
- [x] Database connection (Database.php)
- [x] Base Model với CRUD
- [x] 6 Models (User, Employee, Department, Position, Attendance, Leave, Review)
- [ ] 6 Controllers tương ứng
- [ ] API Router (api.php)
- [ ] Frontend API helper (utils/api.js)
- [ ] Cập nhật tất cả modules frontend để dùng API
- [ ] Testing và debug
- [ ] Viết REPORT.md

## 📚 Tài liệu học thêm

- PHP OOP: https://www.php.net/manual/en/language.oop5.php
- PDO: https://www.php.net/manual/en/book.pdo.php
- RESTful API: https://www.restapitutorial.com/
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- MVC Pattern: https://www.sitepoint.com/the-mvc-pattern-and-php-part-1/

## 🐛 Debug Tips

1. **Kiểm tra kết nối DB**: Chạy `backend/test.php`
2. **Test API**: Dùng Postman hoặc curl
3. **CORS errors**: Kiểm tra headers trong api.php
4. **Frontend errors**: Mở DevTools Console
5. **Backend errors**: Kiểm tra logs PHP/MySQL

Chúc bạn thành công! 🎉
