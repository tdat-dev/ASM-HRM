-- ================================================
-- HRM Database Schema (For Shared Hosting)
-- ================================================
-- Lưu ý:
-- 1. Chọn sẵn database đã tạo trên hosting trước khi import
-- 2. File này không tạo database mới, chỉ tạo bảng + dữ liệu mẫu
-- ================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Departments
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    manager_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Positions
CREATE TABLE IF NOT EXISTS positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Employees
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    position_id INT NOT NULL,
    salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    bonus DECIMAL(12, 2) DEFAULT 0,
    deduction DECIMAL(12, 2) DEFAULT 0,
    phone VARCHAR(20),
    email VARCHAR(100),
    hire_date DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_department (department_id),
    INDEX idx_position (position_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4.1 Employee profiles & phụ bảng
CREATE TABLE IF NOT EXISTS employee_profiles (
    employee_id INT PRIMARY KEY,
    avatar LONGTEXT,
    bank_name VARCHAR(120),
    bank_account_name VARCHAR(120),
    bank_account_number VARCHAR(50),
    skills TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employee_emergency_contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    relation VARCHAR(80),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employee_dependents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    relation VARCHAR(80),
    dob DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employee_education (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    title VARCHAR(150),
    school VARCHAR(150),
    year VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employee_promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    title VARCHAR(150),
    promotion_date DATE,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS employee_custom_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_field_key (field_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    status ENUM('present', 'absent', 'late', 'leave') DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (employee_id, date),
    INDEX idx_employee_date (employee_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Leaves
CREATE TABLE IF NOT EXISTS leaves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(32) DEFAULT 'annual',
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_status (status),
    INDEX idx_leaves_type_status_employee (type, status, employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Performance Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT,
    review_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_employee (employee_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Liên kết manager_id của phòng ban
ALTER TABLE departments
ADD CONSTRAINT fk_dept_manager
FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ================================================
-- DỮ LIỆU MẪU
-- ================================================

DELETE FROM users WHERE username = 'admin';

INSERT INTO users (username, password, created_at) VALUES
('admin', '$2y$10$Y/czLvdNopHyWnMGV1Ej2OTrC/OwApczdCYJqviQBjW70zSz44t9O', NOW());

INSERT INTO departments (id, name, manager_id) VALUES
(1, 'Kinh doanh', NULL),
(2, 'Kỹ thuật', NULL),
(3, 'Nhân sự', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO positions (id, title, description) VALUES
(1, 'Nhân viên', 'Staff'),
(2, 'Trưởng nhóm', 'Leader'),
(3, 'Quản lý', 'Manager')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO employees (id, name, department_id, position_id, salary, bonus, deduction, phone, email, hire_date, status) VALUES
(1001, 'Nguyễn An', 1, 1, 9000000.00, 100.00, 0.00, '0900000001', 'nguyen.an@example.com', '2023-06-10', 'active'),
(1002, 'Trần Bình', 2, 2, 13000000.00, 50.00, 20.00, '0900000002', 'tran.binh@example.com', '2022-11-01', 'active'),
(1003, 'Lê Chi', 3, 1, 8500000.00, 0.00, 0.00, '0900000003', 'le.chi@example.com', '2024-02-15', 'active'),
(1004, 'Phạm Dũng', 2, 3, 2100000.00, 200.00, 50.00, '0900000004', 'pham.dung@example.com', '2021-09-05', 'active'),
(1005, 'Võ Em', 1, 1, 8000000.00, 0.00, 0.00, '0900000005', 'vo.em@example.com', '2025-01-20', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES
(1001, CURDATE(), CONCAT(CURDATE(), ' 08:00:00'), CONCAT(CURDATE(), ' 17:00:00'), 'present'),
(1002, CURDATE(), CONCAT(CURDATE(), ' 08:15:00'), NULL, 'late')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO leaves (employee_id, start_date, end_date, type, reason, status) VALUES
(1001, '2025-11-01', '2025-11-03', 'annual', 'Nghỉ phép năm', 'pending'),
(1003, '2025-10-25', '2025-10-26', 'sick', 'Nghỉ ốm', 'approved')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO reviews (employee_id, rating, feedback, review_date) VALUES
(1001, 5, 'Excellent work!', CURDATE()),
(1002, 4, 'Good performance', CURDATE()),
(1004, 5, 'Outstanding leadership', CURDATE())
ON DUPLICATE KEY UPDATE rating = VALUES(rating);