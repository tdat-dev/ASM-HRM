<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Base Model Class
 * Class cha chứa các method CRUD chung cho tất cả model
 */
abstract class BaseModel {
    protected $db;
    protected $table;
    protected $primaryKey = 'id';
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Lấy tất cả bản ghi
     */
    public function getAll() {
        try {
            $stmt = $this->db->query("SELECT * FROM {$this->table} ORDER BY {$this->primaryKey} DESC");
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in getAll: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Lấy bản ghi theo ID
     */
    public function getById($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id");
            $stmt->execute(['id' => $id]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error in getById: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Thêm bản ghi mới
     */
    public function create($data) {
        try {
            $fields = array_keys($data);
            $placeholders = array_map(function($field) {
                return ":$field";
            }, $fields);
            
            $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") 
                    VALUES (" . implode(', ', $placeholders) . ")";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($data);
            
            return $this->db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error in create: " . $e->getMessage());
            throw new Exception("Không thể tạo bản ghi: " . $e->getMessage());
        }
    }
    
    /**
     * Cập nhật bản ghi
     */
    public function update($id, $data) {
        try {
            $fields = [];
            $params = [];

            foreach ($data as $field => $value) {
                if (is_array($value)) {
                    continue;
                }
                $fields[] = "$field = :$field";
                $params[$field] = $value;
            }

            if (empty($fields)) {
                throw new Exception("Không có dữ liệu cập nhật hợp lệ");
            }

            $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) .
                   " WHERE {$this->primaryKey} = :id";

            $params['id'] = $id;
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error in update: " . $e->getMessage());
            throw new Exception("Không thể cập nhật: " . $e->getMessage());
        }
    }
    
    /**
     * Xóa bản ghi
     */
    public function delete($id) {
        try {
            $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id");
            return $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {
            error_log("Error in delete: " . $e->getMessage());
            throw new Exception("Không thể xóa: " . $e->getMessage());
        }
    }
    
    /**
     * Đếm tổng số bản ghi
     */
    public function count() {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) as total FROM {$this->table}");
            $result = $stmt->fetch();
            return (int)$result['total'];
        } catch (PDOException $e) {
            error_log("Error in count: " . $e->getMessage());
            return 0;
        }
    }
}
