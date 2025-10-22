<?php
require_once __DIR__ . '/../models/LeaveModel.php';

/**
 * LeaveController - Quản lý nghỉ phép
 */
class LeaveController {
    private $model;
    
    public function __construct() {
        $this->model = new LeaveModel();
    }
    
    /**
     * Lấy tất cả yêu cầu nghỉ phép
     */
    public function getAll() {
        try {
            $leaves = $this->model->getAllWithEmployee();
            return [
                'success' => true,
                'data' => $leaves
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Tạo yêu cầu nghỉ phép
     */
    public function create($data) {
        try {
            // Validate
            if (empty($data['employee_id']) || empty($data['start_date']) || 
                empty($data['end_date']) || empty($data['type'])) {
                throw new Exception("Thiếu dữ liệu");
            }
            
            $leaveData = [
                'employee_id' => $data['employee_id'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'type' => $data['type'],
                'status' => 'pending'
            ];
            
            $id = $this->model->createRequest($leaveData);
            
            return [
                'success' => true,
                'message' => 'Tạo yêu cầu thành công',
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
     * Duyệt yêu cầu
     */
    public function approve($id) {
        try {
            $this->model->approve($id);
            return [
                'success' => true,
                'message' => 'Đã duyệt'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Từ chối yêu cầu
     */
    public function reject($id) {
        try {
            $this->model->reject($id);
            return [
                'success' => true,
                'message' => 'Đã từ chối'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Lấy số ngày phép còn lại
     */
    public function getBalance($employeeId) {
        try {
            if (empty($employeeId)) {
                throw new Exception("Thiếu mã nhân viên");
            }
            
            $balance = $this->model->getLeaveBalance($employeeId);
            
            return [
                'success' => true,
                'balance' => $balance
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Đếm yêu cầu chờ duyệt
     */
    public function getPendingCount() {
        try {
            $count = $this->model->countPending();
            return [
                'success' => true,
                'count' => $count
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
