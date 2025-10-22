<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * Employee Model - Quản lý nhân viên
 */
class EmployeeModel extends BaseModel {
    protected $table = 'employees';
    
    /**
     * Lấy tất cả nhân viên kèm thông tin phòng ban và vị trí
     */
    public function getAllWithDetails() {
        try {
            $sql = "SELECT e.*, 
                           d.name as department_name,
                           p.title as position_title
                    FROM {$this->table} e
                    LEFT JOIN departments d ON e.department_id = d.id
                    LEFT JOIN positions p ON e.position_id = p.id
                    ORDER BY e.id DESC";
            
            $stmt = $this->db->query($sql);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in getAllWithDetails: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Tìm kiếm nhân viên theo điều kiện
     */
    public function search($filters = []) {
        try {
            $sql = "SELECT e.*, 
                           d.name as department_name,
                           p.title as position_title
                    FROM {$this->table} e
                    LEFT JOIN departments d ON e.department_id = d.id
                    LEFT JOIN positions p ON e.position_id = p.id
                    WHERE 1=1";
            
            $params = [];
            
            // Tìm theo tên (regex)
            if (!empty($filters['name'])) {
                $sql .= " AND e.name REGEXP :name";
                $params['name'] = $filters['name'];
            }
            
            // Lọc theo phòng ban
            if (!empty($filters['department_id'])) {
                $sql .= " AND e.department_id = :department_id";
                $params['department_id'] = $filters['department_id'];
            }
            
            // Lọc theo khoảng lương
            if (isset($filters['min_salary'])) {
                $sql .= " AND e.salary >= :min_salary";
                $params['min_salary'] = $filters['min_salary'];
            }
            
            if (isset($filters['max_salary'])) {
                $sql .= " AND e.salary <= :max_salary";
                $params['max_salary'] = $filters['max_salary'];
            }
            
            $sql .= " ORDER BY e.salary ASC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in search: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Tính lương trung bình
     */
    public function getAverageSalary() {
        try {
            $stmt = $this->db->query("SELECT AVG(salary) as avg_salary FROM {$this->table}");
            $result = $stmt->fetch();
            return round($result['avg_salary'] ?? 0, 2);
        } catch (PDOException $e) {
            error_log("Error in getAverageSalary: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Đếm nhân viên theo phòng ban
     */
    public function countByDepartment() {
        try {
            $sql = "SELECT d.id, d.name, COUNT(e.id) as count
                    FROM departments d
                    LEFT JOIN {$this->table} e ON d.id = e.department_id
                    GROUP BY d.id, d.name";
            
            $stmt = $this->db->query($sql);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in countByDepartment: " . $e->getMessage());
            return [];
        }
    }
}
