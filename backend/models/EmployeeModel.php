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
            $stmt = $this->db->query("SHOW TABLES LIKE '$tableName'");
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
            // Thử query đơn giản trước để kiểm tra có dữ liệu không
            $simpleSql = "SELECT COUNT(*) as total FROM {$this->table}";
            $countStmt = $this->db->query($simpleSql);
            $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
            error_log("[EmployeeModel] Total employees in DB: " . ($countResult['total'] ?? 0));
            
            // Kiểm tra xem bảng employee_profiles có tồn tại không
            $hasProfileTable = $this->tableExists('employee_profiles');
            error_log("[EmployeeModel] employee_profiles table exists: " . ($hasProfileTable ? 'yes' : 'no'));
            
            // Query đầy đủ với JOIN - thêm employee_profiles nếu bảng tồn tại
            if ($hasProfileTable) {
                $sql = "SELECT e.*, 
                               COALESCE(e.department_id, NULL) AS departmentId,
                               COALESCE(e.position_id, NULL) AS positionId,
                               d.name as department_name,
                               p.title as position_title,
                               ep.skills as profile_skills,
                               ep.avatar as profile_avatar
                        FROM {$this->table} e
                        LEFT JOIN departments d ON e.department_id = d.id
                        LEFT JOIN positions p ON e.position_id = p.id
                        LEFT JOIN employee_profiles ep ON ep.employee_id = e.id
                        ORDER BY e.id DESC";
            } else {
                $sql = "SELECT e.*, 
                               COALESCE(e.department_id, NULL) AS departmentId,
                               COALESCE(e.position_id, NULL) AS positionId,
                               d.name as department_name,
                               p.title as position_title
                        FROM {$this->table} e
                        LEFT JOIN departments d ON e.department_id = d.id
                        LEFT JOIN positions p ON e.position_id = p.id
                        ORDER BY e.id DESC";
            }
            
            error_log("[EmployeeModel] Executing SQL: " . $sql);
            $stmt = $this->db->query($sql);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("[EmployeeModel] Query returned " . count($results) . " rows");
            
            if (count($results) === 0 && ($countResult['total'] ?? 0) > 0) {
                error_log("[EmployeeModel] WARNING: DB has " . $countResult['total'] . " employees but query returned 0. Possible JOIN issue.");
                // Thử query không JOIN để xem có dữ liệu không
                $simpleQuery = "SELECT * FROM {$this->table} ORDER BY id DESC";
                $simpleStmt = $this->db->query($simpleQuery);
                $simpleResults = $simpleStmt->fetchAll(PDO::FETCH_ASSOC);
                error_log("[EmployeeModel] Simple query (no JOIN) returned " . count($simpleResults) . " rows");
                if (count($simpleResults) > 0) {
                    // Map lại để có departmentId và positionId
                    foreach ($simpleResults as &$row) {
                        $row['departmentId'] = $row['department_id'] ?? null;
                        $row['positionId'] = $row['position_id'] ?? null;
                    }
                    return $simpleResults;
                }
            }
            
            if (count($results) > 0) {
                error_log("[EmployeeModel] First row sample: " . json_encode($results[0]));
            }
            return $results;
        } catch (PDOException $e) {
            error_log("Error in getAllWithDetails: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
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
