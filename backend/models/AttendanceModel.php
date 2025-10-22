<?php
require_once __DIR__ . '/BaseModel.php';

/**
 * Attendance Model - Quản lý chấm công
 */
class AttendanceModel extends BaseModel {
    protected $table = 'attendance';
    
    /**
     * Lấy bản ghi chấm công theo ngày và nhân viên
     */
    public function getByEmployeeAndDate($employeeId, $date) {
        try {
            $stmt = $this->db->prepare(
                "SELECT * FROM {$this->table} 
                 WHERE employee_id = :employee_id AND date = :date"
            );
            $stmt->execute([
                'employee_id' => $employeeId,
                'date' => $date
            ]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Error in getByEmployeeAndDate: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Check-in
     */
    public function checkIn($employeeId) {
        $today = date('Y-m-d');
        $existing = $this->getByEmployeeAndDate($employeeId, $today);
        
        if ($existing && $existing['check_in']) {
            throw new Exception("Đã check-in");
        }
        
        if ($existing) {
            // Update
            return $this->update($existing['id'], [
                'check_in' => date('Y-m-d H:i:s')
            ]);
        } else {
            // Create
            return $this->create([
                'employee_id' => $employeeId,
                'date' => $today,
                'check_in' => date('Y-m-d H:i:s')
            ]);
        }
    }
    
    /**
     * Check-out
     */
    public function checkOut($employeeId) {
        $today = date('Y-m-d');
        $existing = $this->getByEmployeeAndDate($employeeId, $today);
        
        if (!$existing || !$existing['check_in']) {
            throw new Exception("Chưa check-in");
        }
        
        if ($existing['check_out']) {
            throw new Exception("Đã check-out");
        }
        
        return $this->update($existing['id'], [
            'check_out' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Lấy báo cáo chấm công của nhân viên
     */
    public function getReportByEmployee($employeeId, $fromDate = null, $toDate = null) {
        try {
            $sql = "SELECT * FROM {$this->table} WHERE employee_id = :employee_id";
            $params = ['employee_id' => $employeeId];
            
            if ($fromDate) {
                $sql .= " AND date >= :from_date";
                $params['from_date'] = $fromDate;
            }
            
            if ($toDate) {
                $sql .= " AND date <= :to_date";
                $params['to_date'] = $toDate;
            }
            
            $sql .= " ORDER BY date DESC";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $records = $stmt->fetchAll();
            
            // Tính số giờ làm việc
            foreach ($records as &$record) {
                if ($record['check_in'] && $record['check_out']) {
                    $checkIn = strtotime($record['check_in']);
                    $checkOut = strtotime($record['check_out']);
                    $record['hours'] = round(($checkOut - $checkIn) / 3600, 2);
                } else {
                    $record['hours'] = 0;
                }
            }
            
            return $records;
        } catch (PDOException $e) {
            error_log("Error in getReportByEmployee: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Đếm số người đã chấm công hôm nay
     */
    public function countTodayAttendance() {
        try {
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) as count FROM {$this->table} 
                 WHERE date = :today"
            );
            $stmt->execute(['today' => date('Y-m-d')]);
            $result = $stmt->fetch();
            return (int)$result['count'];
        } catch (PDOException $e) {
            error_log("Error in countTodayAttendance: " . $e->getMessage());
            return 0;
        }
    }
}
