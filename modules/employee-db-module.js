// Module quản lý database nhân viên, phòng ban, vị trí (sử dụng API backend)

import { employeeAPI, departmentAPI, positionAPI } from "../utils/api.js";

// Export module để sử dụng trong các file khác
export const EmployeeDb = {
  /**
   * Lấy tất cả nhân viên
   */
  async getAllEmployees() {
    try {
      const result = await employeeAPI.getAll();
      const employees = result.data || [];
      return employees;
    } catch (error) {
      throw error;
    }
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
   * Lưu danh sách nhân viên - không cần với API
   */
  async saveEmployees(employeesList) {
    // API tự động lưu khi create/update/delete
  },

  /**
   * Lọc nhân viên theo điều kiện
   */
  async filterEmployees(filterFunction) {
    const employees = await this.getAllEmployees();
    return employees.filter(filterFunction);
  },

  /**
   * Sắp xếp nhân viên
   */
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
   * Lưu danh sách phòng ban - không cần với API
   */
  async saveDepartments(departmentsList) {
    // API tự động lưu khi create/update/delete
  },

  /**
   * Lấy tất cả vị trí
   */
  async getAllPositions() {
    const result = await positionAPI.getAll();
    return result.data || [];
  },

  /**
   * Lưu danh sách vị trí - không cần với API
   */
  async savePositions(positionsList) {
    // API tự động lưu khi create/update/delete
  },
};
