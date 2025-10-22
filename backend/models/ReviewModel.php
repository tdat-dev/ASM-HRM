<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * Review Model - Quản lý đánh giá hiệu suất
 */
class ReviewModel extends BaseModel {
    protected $table = 'reviews';
    
    /**
     * Thêm đánh giá với validation
     */
    public function addReview($data) {
        // Validate rating
        if ($data['rating'] < 1 || $data['rating'] > 5) {
            throw new Exception("Rating phải từ 1 đến 5");
        }
        
        return $this->create($data);
    }
    
    /**
     * Lấy điểm trung bình của nhân viên
     */
    public function getAverageRating($employeeId) {
        try {
            $stmt = $this->db->prepare(
                "SELECT AVG(rating) as avg_rating FROM {$this->table} 
                 WHERE employee_id = :employee_id"
            );
            $stmt->execute(['employee_id' => $employeeId]);
            $result = $stmt->fetch();
            
            return round($result['avg_rating'] ?? 0, 2);
        } catch (PDOException $e) {
            error_log("Error in getAverageRating: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Lấy danh sách top performers
     */
    public function getTopPerformers($limit = 10) {
        try {
            $sql = "SELECT employee_id, 
                           AVG(rating) as avg_rating,
                           COUNT(*) as review_count
                    FROM {$this->table}
                    GROUP BY employee_id
                    HAVING review_count > 0
                    ORDER BY avg_rating DESC, review_count DESC
                    LIMIT :limit";
            
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in getTopPerformers: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Lấy tất cả đánh giá kèm tên nhân viên
     */
    public function getAllWithEmployee() {
        try {
            $sql = "SELECT r.*, e.name as employee_name
                    FROM {$this->table} r
                    LEFT JOIN employees e ON r.employee_id = e.id
                    ORDER BY r.id DESC";
            
            $stmt = $this->db->query($sql);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in getAllWithEmployee: " . $e->getMessage());
            return [];
        }
    }
}
