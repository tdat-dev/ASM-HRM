<?php
require_once __DIR__ . '/../models/AttendanceModel.php';

/**
 * AttendanceController - Quản lý chấm công
 */
class AttendanceController {
    private $model;
    
    public function __construct() {
        $this->model = new AttendanceModel();
    }
    
    /**
     * Check-in
     */
    public function checkIn($data) {
        try {
            if (empty($data['employee_id'])) {
                throw new Exception("Thiếu mã nhân viên");
            }
            
            $this->model->checkIn($data['employee_id']);
            
            return [
                'success' => true,
                'message' => 'Đã check-in'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Check-out
     */
    public function checkOut($data) {
        try {
            if (empty($data['employee_id'])) {
                throw new Exception("Thiếu mã nhân viên");
            }
            
            $this->model->checkOut($data['employee_id']);
            
            return [
                'success' => true,
                'message' => 'Đã check-out'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Lấy báo cáo chấm công
     */
    public function getReport($employeeId, $fromDate = null, $toDate = null) {
        try {
            if (empty($employeeId)) {
                throw new Exception("Thiếu mã nhân viên");
            }
            
            $records = $this->model->getReportByEmployee($employeeId, $fromDate, $toDate);
            
            return [
                'success' => true,
                'data' => $records
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Lấy tất cả bản ghi chấm công
     */
    public function getAll() {
        try {
            $records = $this->model->getAll();
            return [
                'success' => true,
                'data' => $records
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Đếm chấm công hôm nay
     */
    public function getTodayCount() {
        try {
            $count = $this->model->countTodayAttendance();
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
