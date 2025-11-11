<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * Employee Model - Quản lý nhân viên
 */
class EmployeeModel extends BaseModel {
    protected $table = 'employees';
    
    /**
     * Kiểm tra xem bảng employee_profiles có tồn tại không
     */
    private function tableExists($tableName) {
        try {
            $stmt = $this->db->prepare("SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?");
            $stmt->execute([$tableName]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Lấy tất cả nhân viên kèm thông tin phòng ban và vị trí
     */
    public function getAllWithDetails() {
        try {
            // Kiểm tra xem bảng employee_profiles có tồn tại không
            $hasProfileTable = $this->tableExists('employee_profiles');

            // Xây dựng SELECT/JOINS có điều kiện, tránh trùng lặp và đảm bảo dữ liệu nhất quán
            $select = "SELECT e.*, 
                               e.department_id AS departmentId,
                               e.position_id AS positionId,
                               d.name as department_name,
                               p.title as position_title";
            $joins = " FROM {$this->table} e
                       LEFT JOIN departments d ON e.department_id = d.id
                       LEFT JOIN positions p ON e.position_id = p.id";
            if ($hasProfileTable) {
                $select .= ", ep.skills as profile_skills, ep.avatar as profile_avatar";
                $joins .= " LEFT JOIN employee_profiles ep ON ep.employee_id = e.id";
            }
            $sql = $select . $joins . " ORDER BY e.id DESC";

            $stmt = $this->db->query($sql);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return $results;
        } catch (PDOException $e) {
            return [];
        }
    }
    
    /**
     * Tìm kiếm nhân viên theo điều kiện
     */
    public function search($filters = []) {
        try {
            // Kiểm tra xem bảng employee_profiles có tồn tại không
            $hasProfileTable = $this->tableExists('employee_profiles');
            
            if ($hasProfileTable) {
                $sql = "SELECT e.*, 
                               e.department_id AS departmentId,
                               e.position_id AS positionId,
                               d.name as department_name,
                               p.title as position_title,
                               ep.skills as profile_skills,
                               ep.avatar as profile_avatar
                        FROM {$this->table} e
                        LEFT JOIN departments d ON e.department_id = d.id
                        LEFT JOIN positions p ON e.position_id = p.id
                        LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
                        WHERE 1=1";
            } else {
                $sql = "SELECT e.*, 
                               e.department_id AS departmentId,
                               e.position_id AS positionId,
                               d.name as department_name,
                               p.title as position_title
                        FROM {$this->table} e
                        LEFT JOIN departments d ON e.department_id = d.id
                        LEFT JOIN positions p ON e.position_id = p.id
                        WHERE 1=1";
            }
            
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
            
            // Lọc theo skills nếu bảng employee_profiles tồn tại
            if ($hasProfileTable && !empty($filters['skills'])) {
                $sql .= " AND ep.skills LIKE :skills";
                $params['skills'] = '%' . $filters['skills'] . '%';
            }
            
            $sql .= " ORDER BY e.salary ASC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
