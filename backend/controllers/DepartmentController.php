<?php
require_once __DIR__ . '/../models/DepartmentModel.php';

/**
 * DepartmentController - Quản lý phòng ban
 */
class DepartmentController {
    private $model;
    
    public function __construct() {
        $this->model = new DepartmentModel();
    }
    
    public function getAll() {
        try {
            $departments = $this->model->getAll();
            return [
                'success' => true,
                'data' => $departments
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function create($data) {
        try {
            if (empty($data['name'])) {
                throw new Exception("Tên phòng ban không được để trống");
            }
            
            // Kiểm tra trùng tên
            if ($this->model->existsByName($data['name'])) {
                throw new Exception("Phòng ban đã tồn tại");
            }
            
            $id = $this->model->create([
                'name' => $data['name'],
                'manager_id' => $data['manager_id'] ?? null
            ]);
            
            return [
                'success' => true,
                'message' => 'Thêm phòng ban thành công',
                'id' => $id
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function update($id, $data) {
        try {
            if (isset($data['name'])) {
                if (empty($data['name'])) {
                    throw new Exception("Tên không được để trống");
                }
                
                // Kiểm tra trùng tên (trừ chính nó)
                if ($this->model->existsByName($data['name'], $id)) {
                    throw new Exception("Tên phòng ban đã tồn tại");
                }
            }
            
            $this->model->update($id, $data);
            
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
    
    public function delete($id) {
        try {
            $this->model->delete($id);
            return [
                'success' => true,
                'message' => 'Xóa thành công'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Không thể xóa phòng ban (có nhân viên hoặc ràng buộc khác)'
            ];
        }
    }
}
