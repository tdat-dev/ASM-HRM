-- ================================================
-- HRM Database Schema (For Shared Hosting)
-- ================================================
-- Lưu ý: Trước khi chạy file này:
-- 1. Tạo database trong control panel hosting
-- 2. Chọn database đó trong phpMyAdmin
-- 3. Import file SQL này
-- ================================================

-- ================================================
-- 1. Bảng Users (Người dùng hệ thống)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 2. Bảng Departments (Phòng ban)
-- ================================================
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    manager_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 3. Bảng Positions (Vị trí/Chức danh)
-- ================================================
CREATE TABLE IF NOT EXISTS positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 4. Bảng Employees (Nhân viên)
-- ================================================
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    position_id INT NOT NULL,
    salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    phone VARCHAR(20),
    email VARCHAR(100),
    hire_date DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 5. Bảng Attendance (Chấm công)
-- ================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status ENUM('present', 'absent', 'late', 'leave') DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee_date (employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 6. Bảng Leave Requests (Yêu cầu nghỉ phép)
-- ================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type ENUM('sick', 'annual', 'personal', 'unpaid') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_employee_status (employee_id, status),
    INDEX idx_dates (start_date, end_date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 7. Bảng Performance Reviews (Đánh giá hiệu suất)
-- ================================================
CREATE TABLE IF NOT EXISTS performance_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    review_date DATE NOT NULL,
    reviewer_name VARCHAR(100),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_employee_date (employee_id, review_date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- Thêm Foreign Key cho bảng Departments
-- ================================================
ALTER TABLE departments 
ADD CONSTRAINT fk_dept_manager 
FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ================================================
-- Dữ liệu mẫu (Sample Data)
-- ================================================

-- User mặc định
-- Username: admin
-- Password: 123456
INSERT INTO users (username, password) VALUES 
('admin', '$2y$10$eXVqZ8jF7.nY2nKjXxWxZuqh1qH4RdJ5YVN/8VzqJhXtJYNLKXxGy')
ON DUPLICATE KEY UPDATE username = username;

-- Phòng ban mẫu
INSERT INTO departments (name) VALUES 
('IT'),
('HR'),
('Finance'),
('Marketing'),
('Sales')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Vị trí mẫu
INSERT INTO positions (title, description) VALUES 
('Developer', 'Software Developer'),
('Manager', 'Department Manager'),
('HR Specialist', 'Human Resources Specialist'),
('Accountant', 'Financial Accountant'),
('Marketing Executive', 'Marketing Professional'),
('Sales Representative', 'Sales Professional')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Nhân viên mẫu
INSERT INTO employees (name, department_id, position_id, salary, phone, email, hire_date) VALUES 
('Nguyễn Văn A', 1, 1, 15000000, '0901234567', 'nguyenvana@example.com', '2023-01-15'),
('Trần Thị B', 2, 3, 12000000, '0912345678', 'tranthib@example.com', '2023-02-20'),
('Lê Văn C', 3, 4, 13000000, '0923456789', 'levanc@example.com', '2023-03-10'),
('Phạm Thị D', 4, 5, 11000000, '0934567890', 'phamthid@example.com', '2023-04-05'),
('Hoàng Văn E', 5, 6, 14000000, '0945678901', 'hoangvane@example.com', '2023-05-12')
ON DUPLICATE KEY UPDATE name = VALUES(name);
