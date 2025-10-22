<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * Leave Model - Quản lý nghỉ phép
 */
class LeaveModel extends BaseModel {
    protected $table = 'leaves';
    const DEFAULT_ANNUAL_LEAVE_DAYS = 20;
    
    /**
     * Tạo yêu cầu nghỉ phép
     */
    public function createRequest($data) {
        // Validate ngày
        if (strtotime($data['end_date']) < strtotime($data['start_date'])) {
            throw new Exception("Ngày kết thúc phải >= ngày bắt đầu");
        }
        
        return $this->create($data);
    }
    
    /**
     * Duyệt yêu cầu
     */
    public function approve($id) {
        return $this->update($id, ['status' => 'approved']);
    }
    
    /**
     * Từ chối yêu cầu
     */
    public function reject($id) {
        return $this->update($id, ['status' => 'rejected']);
    }
    
    /**
     * Tính số ngày phép còn lại của nhân viên
     */
    public function getLeaveBalance($employeeId) {
        try {
            $sql = "SELECT start_date, end_date 
                    FROM {$this->table}
                    WHERE employee_id = :employee_id 
                    AND status = 'approved'
                    AND type = 'annual'";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['employee_id' => $employeeId]);
            $leaves = $stmt->fetchAll();
            
            $usedDays = 0;
            foreach ($leaves as $leave) {
                $start = strtotime($leave['start_date']);
                $end = strtotime($leave['end_date']);
                $days = ceil(($end - $start) / 86400) + 1;
                $usedDays += $days;
            }
            
            return max(0, self::DEFAULT_ANNUAL_LEAVE_DAYS - $usedDays);
        } catch (PDOException $e) {
            error_log("Error in getLeaveBalance: " . $e->getMessage());
            return self::DEFAULT_ANNUAL_LEAVE_DAYS;
        }
    }
    
    /**
     * Đếm yêu cầu chờ duyệt
     */
    public function countPending() {
        try {
            $stmt = $this->db->query(
                "SELECT COUNT(*) as count FROM {$this->table} WHERE status = 'pending'"
            );
            $result = $stmt->fetch();
            return (int)$result['count'];
        } catch (PDOException $e) {
            error_log("Error in countPending: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Lấy tất cả yêu cầu kèm tên nhân viên
     */
    public function getAllWithEmployee() {
        try {
            $sql = "SELECT l.*, e.name as employee_name
                    FROM {$this->table} l
                    LEFT JOIN employees e ON l.employee_id = e.id
                    ORDER BY l.id DESC";
            
            $stmt = $this->db->query($sql);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error in getAllWithEmployee: " . $e->getMessage());
            return [];
        }
    }
}
