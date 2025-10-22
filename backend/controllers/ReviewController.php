<?php
require_once __DIR__ . '/../models/ReviewModel.php';

/**
 * ReviewController - Quản lý đánh giá hiệu suất
 */
class ReviewController {
    private $model;
    
    public function __construct() {
        $this->model = new ReviewModel();
    }
    
    /**
     * Lấy tất cả đánh giá
     */
    public function getAll() {
        try {
            $reviews = $this->model->getAllWithEmployee();
            return [
                'success' => true,
                'data' => $reviews
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Thêm đánh giá
     */
    public function create($data) {
        try {
            // Validate
            if (empty($data['employee_id']) || empty($data['rating'])) {
                throw new Exception("Thiếu dữ liệu");
            }
            
            $reviewData = [
                'employee_id' => $data['employee_id'],
                'rating' => $data['rating'],
                'feedback' => $data['feedback'] ?? '',
                'review_date' => date('Y-m-d')
            ];
            
            $id = $this->model->addReview($reviewData);
            
            return [
                'success' => true,
                'message' => 'Thêm đánh giá thành công',
                'id' => $id
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Lấy điểm trung bình của nhân viên
     */
    public function getAverage($employeeId) {
        try {
            if (empty($employeeId)) {
                throw new Exception("Thiếu mã nhân viên");
            }
            
            $average = $this->model->getAverageRating($employeeId);
            
            return [
                'success' => true,
                'average' => $average
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Lấy danh sách top performers
     */
    public function getTopPerformers($limit = 10) {
        try {
            $performers = $this->model->getTopPerformers($limit);
            
            return [
                'success' => true,
                'data' => $performers
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
