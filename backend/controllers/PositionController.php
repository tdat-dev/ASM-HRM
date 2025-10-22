<?php
require_once __DIR__ . '/../models/DepartmentModel.php';

/**
 * PositionController - Quản lý vị trí
 */
class PositionController {
    private $model;
    
    public function __construct() {
        $this->model = new PositionModel();
    }
    
    public function getAll() {
        try {
            $positions = $this->model->getAll();
            return [
                'success' => true,
                'data' => $positions
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
            if (empty($data['title'])) {
                throw new Exception("Tên vị trí không được để trống");
            }
            
            // Kiểm tra trùng
            if ($this->model->existsByTitle($data['title'])) {
                throw new Exception("Vị trí đã tồn tại");
            }
            
            $id = $this->model->create([
                'title' => $data['title'],
                'description' => $data['description'] ?? ''
            ]);
            
            return [
                'success' => true,
                'message' => 'Thêm vị trí thành công',
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
            if (isset($data['title'])) {
                if (empty($data['title'])) {
                    throw new Exception("Tên không được để trống");
                }
                
                if ($this->model->existsByTitle($data['title'], $id)) {
                    throw new Exception("Tên vị trí đã tồn tại");
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
                'message' => 'Không thể xóa vị trí (có nhân viên hoặc ràng buộc khác)'
            ];
        }
    }
}
