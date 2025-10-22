-- ================================================
-- HRM Database Schema
-- ================================================

-- Tạo database nếu chưa có
CREATE DATABASE IF NOT EXISTS hrm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hrm_db;

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
    bonus DECIMAL(12, 2) DEFAULT 0,
    deduction DECIMAL(12, 2) DEFAULT 0,
    hire_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    INDEX idx_name (name),
    INDEX idx_department (department_id),
    INDEX idx_position (position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 5. Bảng Attendance (Chấm công)
-- ================================================
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (employee_id, date),
    INDEX idx_date (date),
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 6. Bảng Leaves (Nghỉ phép)
-- ================================================
CREATE TABLE IF NOT EXISTS leaves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type ENUM('annual', 'sick') NOT NULL DEFAULT 'annual',
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- 7. Bảng Reviews (Đánh giá hiệu suất)
-- ================================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    review_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ================================================
-- DỮ LIỆU MẪU
-- ================================================

-- Xóa user admin cũ (nếu có)
DELETE FROM users WHERE username = 'admin';

-- Tạo user admin mới với password: admin123
-- Password hash được tạo bởi PHP password_hash()
INSERT INTO users (username, password, created_at) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW());

-- Insert Departments
INSERT INTO departments (id, name, manager_id) VALUES 
(1, 'Kinh doanh', NULL),
(2, 'Kỹ thuật', NULL),
(3, 'Nhân sự', NULL);

-- Insert Positions
INSERT INTO positions (id, title, description) VALUES 
(1, 'Nhân viên', 'Staff'),
(2, 'Trưởng nhóm', 'Leader'),
(3, 'Quản lý', 'Manager');

-- Insert Employees
INSERT INTO employees (id, name, department_id, position_id, salary, bonus, deduction, hire_date) VALUES 
(1001, 'Nguyễn An', 1, 1, 900.00, 100.00, 0.00, '2023-06-10'),
(1002, 'Trần Bình', 2, 2, 1300.00, 50.00, 20.00, '2022-11-01'),
(1003, 'Lê Chi', 3, 1, 850.00, 0.00, 0.00, '2024-02-15'),
(1004, 'Phạm Dũng', 2, 3, 2100.00, 200.00, 50.00, '2021-09-05'),
(1005, 'Võ Em', 1, 1, 800.00, 0.00, 0.00, '2025-01-20');

-- Insert Attendance mẫu
INSERT INTO attendance (employee_id, date, check_in, check_out) VALUES 
(1001, CURDATE(), CONCAT(CURDATE(), ' 08:00:00'), CONCAT(CURDATE(), ' 17:00:00')),
(1002, CURDATE(), CONCAT(CURDATE(), ' 08:15:00'), NULL);

-- Insert Leaves mẫu
INSERT INTO leaves (employee_id, start_date, end_date, type, status) VALUES 
(1001, '2025-11-01', '2025-11-03', 'annual', 'pending'),
(1003, '2025-10-25', '2025-10-26', 'sick', 'approved');

-- Insert Reviews mẫu
INSERT INTO reviews (employee_id, rating, feedback, review_date) VALUES 
(1001, 5, 'Excellent work!', CURDATE()),
(1002, 4, 'Good performance', CURDATE()),
(1004, 5, 'Outstanding leadership', CURDATE());
