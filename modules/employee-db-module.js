// Module quản lý database nhân viên, phòng ban, vị trí (lưu trong localStorage)

const EMPLOYEES_STORAGE_KEY = "hrm_employees";
const DEPARTMENTS_STORAGE_KEY = "hrm_departments";
const POSITIONS_STORAGE_KEY = "hrm_positions";

/**
 * Đọc dữ liệu từ localStorage
 */
function readFromLocalStorage(storageKey) {
  const rawData = localStorage.getItem(storageKey);
  return rawData ? JSON.parse(rawData) : null;
}

/**
 * Ghi dữ liệu vào localStorage
 */
function writeToLocalStorage(storageKey, data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

/**
 * Tạo dữ liệu mẫu ban đầu
 */
function createDefaultData() {
  const defaultDepartments = [
    { id: 1, name: "Kinh doanh", managerId: null },
    { id: 2, name: "Kỹ thuật", managerId: null },
    { id: 3, name: "Nhân sự", managerId: null },
  ];

  const defaultPositions = [
    { id: 1, title: "Nhân viên", description: "Staff", salaryBase: 800 },
    { id: 2, title: "Trưởng nhóm", description: "Leader", salaryBase: 1200 },
    { id: 3, title: "Quản lý", description: "Manager", salaryBase: 2000 },
  ];

  const defaultEmployees = [
    {
      id: 1001,
      name: "Nguyễn An",
      departmentId: 1,
      positionId: 1,
      salary: 900,
      bonus: 100,
      deduction: 0,
      hireDate: "2023-06-10",
    },
    {
      id: 1002,
      name: "Trần Bình",
      departmentId: 2,
      positionId: 2,
      salary: 1300,
      bonus: 50,
      deduction: 20,
      hireDate: "2022-11-01",
    },
    {
      id: 1003,
      name: "Lê Chi",
      departmentId: 3,
      positionId: 1,
      salary: 850,
      bonus: 0,
      deduction: 0,
      hireDate: "2024-02-15",
    },
    {
      id: 1004,
      name: "Phạm Dũng",
      departmentId: 2,
      positionId: 3,
      salary: 2100,
      bonus: 200,
      deduction: 50,
      hireDate: "2021-09-05",
    },
    {
      id: 1005,
      name: "Võ Em",
      departmentId: 1,
      positionId: 1,
      salary: 800,
      bonus: 0,
      deduction: 0,
      hireDate: "2025-01-20",
    },
  ];

  return {
    departments: defaultDepartments,
    positions: defaultPositions,
    employees: defaultEmployees,
  };
}

// Export module để sử dụng trong các file khác
export const EmployeeDb = {
  /**
   * Khởi tạo dữ liệu mặc định nếu chưa có
   */
  ensureInitialized() {
    if (!readFromLocalStorage(EMPLOYEES_STORAGE_KEY)) {
      const { departments, positions, employees } = createDefaultData();
      writeToLocalStorage(DEPARTMENTS_STORAGE_KEY, departments);
      writeToLocalStorage(POSITIONS_STORAGE_KEY, positions);
      writeToLocalStorage(EMPLOYEES_STORAGE_KEY, employees);
    }
  },

  /**
   * Lấy tất cả nhân viên
   */
  getAllEmployees() {
    return readFromLocalStorage(EMPLOYEES_STORAGE_KEY) || [];
  },

  /**
   * Tìm nhân viên theo ID
   */
  getEmployeeById(employeeId) {
    const allEmployees = this.getAllEmployees();
    const foundEmployee = allEmployees.find(
      (employee) => String(employee.id) === String(employeeId)
    );
    return foundEmployee || null;
  },

  /**
   * Lưu danh sách nhân viên
   */
  saveEmployees(employeesList) {
    writeToLocalStorage(EMPLOYEES_STORAGE_KEY, employeesList);
  },

  /**
   * Lọc nhân viên theo điều kiện
   */
  filterEmployees(filterFunction) {
    return this.getAllEmployees().filter(filterFunction);
  },

  /**
   * Sắp xếp nhân viên
   */
  sortEmployees(compareFunction) {
    return [...this.getAllEmployees()].sort(compareFunction);
  },

  /**
   * Lấy tất cả phòng ban
   */
  getAllDepartments() {
    return readFromLocalStorage(DEPARTMENTS_STORAGE_KEY) || [];
  },

  /**
   * Lưu danh sách phòng ban
   */
  saveDepartments(departmentsList) {
    writeToLocalStorage(DEPARTMENTS_STORAGE_KEY, departmentsList);
  },

  /**
   * Lấy tất cả vị trí
   */
  getAllPositions() {
    return readFromLocalStorage(POSITIONS_STORAGE_KEY) || [];
  },

  /**
   * Lưu danh sách vị trí
   */
  savePositions(positionsList) {
    writeToLocalStorage(POSITIONS_STORAGE_KEY, positionsList);
  },
};
