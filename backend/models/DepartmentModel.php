<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * Department Model
 */
class DepartmentModel extends BaseModel {
    protected $table = 'departments';
    
    /**
     * Kiểm tra tên phòng ban đã tồn tại
     */
    public function existsByName($name, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE name = :name";
            $params = ['name' => $name];
            
            if ($excludeId) {
                $sql .= " AND id != :excludeId";
                $params['excludeId'] = $excludeId;
            }
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error in existsByName: " . $e->getMessage());
            return false;
        }
    }
}

/**
 * Position Model
 */
class PositionModel extends BaseModel {
    protected $table = 'positions';
    
    /**
     * Kiểm tra tên vị trí đã tồn tại
     */
    public function existsByTitle($title, $excludeId = null) {
        try {
            $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE title = :title";
            $params = ['title' => $title];
            
            if ($excludeId) {
                $sql .= " AND id != :excludeId";
                $params['excludeId'] = $excludeId;
            }
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            
            return $result['count'] > 0;
        } catch (PDOException $e) {
            error_log("Error in existsByTitle: " . $e->getMessage());
            return false;
        }
    }
}
