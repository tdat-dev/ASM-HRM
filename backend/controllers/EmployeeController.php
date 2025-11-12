<?php
require_once __DIR__ . '/../models/EmployeeModel.php';

/**
 * EmployeeController - Quản lý nhân viên
 */
class EmployeeController {
    private $employeeModel;
    
    public function __construct() {
        $this->employeeModel = new EmployeeModel();
    }
    
    /**
     * Lấy tất cả nhân viên
     */
    public function getAll() {
        try {
            error_log("[EmployeeController] getAll() called");
            $employees = $this->employeeModel->getAllWithDetails();

            // RBAC privacy: Manager không xem chi tiết lương của người khác
            if (isset($_SESSION['role']) && $_SESSION['role'] === 'manager') {
                foreach ($employees as &$e) {
                    unset($e['salary'], $e['bonus'], $e['deduction']);
                }
            }
            error_log("[EmployeeController] getAllWithDetails() returned " . count($employees) . " employees");
            return [
                'success' => true,
                'data' => $employees
            ];
        } catch (Exception $e) {
            error_log("[EmployeeController] Error in getAll(): " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Lấy nhân viên theo ID
     */
    public function getById($id) {
        try {
            $employee = $this->employeeModel->getById($id);
            
            if (!$employee) {
                return [
                    'success' => false,
                    'message' => 'Không tìm thấy nhân viên'
                ];
            }

            if (isset($_SESSION['role']) && $_SESSION['role'] === 'manager') {
                unset($employee['salary'], $employee['bonus'], $employee['deduction']);
            }
            
            return [
                'success' => true,
                'data' => $employee
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Thêm nhân viên mới
     */
    public function create($data) {
        try {
            // Validate
            if (empty($data['name'])) {
                throw new Exception("Tên không được để trống");
            }
            
            if (empty($data['salary']) || $data['salary'] <= 0) {
                throw new Exception("Lương phải lớn hơn 0");
            }
            
            if (empty($data['hire_date'])) {
                throw new Exception("Ngày vào làm không được để trống");
            }
            
            // Set default values
            $employeeData = [
                'name' => $data['name'],
                'department_id' => $data['department_id'],
                'position_id' => $data['position_id'],
                'salary' => $data['salary'],
                'bonus' => $data['bonus'] ?? 0,
                'deduction' => $data['deduction'] ?? 0,
                'hire_date' => $data['hire_date']
            ];
            
            $id = $this->employeeModel->create($employeeData);
            
            return [
                'success' => true,
                'message' => 'Thêm nhân viên thành công',
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
     * Cập nhật nhân viên
     */
    public function update($id, $data) {
        try {
            // Validate
            if (isset($data['name']) && empty($data['name'])) {
                throw new Exception("Tên không được để trống");
            }
            
            if (isset($data['salary']) && $data['salary'] <= 0) {
                throw new Exception("Lương phải lớn hơn 0");
            }
            
            $this->employeeModel->update($id, $data);
            
            return [
                'success' => true,
                'message' => 'Cập nhật thành công'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Xóa nhân viên
     */
    public function delete($id) {
        try {
            $this->employeeModel->delete($id);
            
            return [
                'success' => true,
                'message' => 'Xóa thành công'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Tìm kiếm nhân viên
     */
    public function search($filters) {
        try {
            $employees = $this->employeeModel->search($filters);

            if (isset($_SESSION['role']) && $_SESSION['role'] === 'manager') {
                foreach ($employees as &$e) {
                    unset($e['salary'], $e['bonus'], $e['deduction']);
                }
            }
            
            return [
                'success' => true,
                'data' => $employees
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Lấy thống kê
     */
    public function getStats() {
        try {
            $stats = [
                'total' => $this->employeeModel->count(),
                'average_salary' => $this->employeeModel->getAverageSalary(),
                'by_department' => $this->employeeModel->countByDepartment()
            ];
            
            return [
                'success' => true,
                'data' => $stats
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
