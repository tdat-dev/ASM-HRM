// Module quản lý database nhân viên, phòng ban, vị trí (sử dụng API backend)

import { employeeAPI, departmentAPI, positionAPI } from "../utils/api.js";

// Export module để sử dụng trong các file khác
export const EmployeeDb = {
  /**
   * Lấy tất cả nhân viên
   */
  async getAllEmployees() {
    const result = await employeeAPI.getAll();
    const employees = result.data || [];
    return employees;
  },

  /**
   * Tìm nhân viên theo ID
   */
  async getEmployeeById(employeeId) {
    try {
      const result = await employeeAPI.getById(employeeId);
      return result.data || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Lọc nhân viên theo điều kiện
   */
  async filterEmployees(filterFunction) {
    const employees = await this.getAllEmployees();
    return employees.filter(filterFunction);
  },

  // Sắp xếp nhân viên
  async sortEmployees(compareFunction) {
    const employees = await this.getAllEmployees();
    return [...employees].sort(compareFunction);
  },

  /**
   * Lấy tất cả phòng ban
   */
  async getAllDepartments() {
    const result = await departmentAPI.getAll();
    return result.data || [];
  },

  /**
   * Lấy tất cả vị trí
   */
  async getAllPositions() {
    const result = await positionAPI.getAll();
    return result.data || [];
  },

  // (save* methods removed - handled by dedicated API endpoints)
};
