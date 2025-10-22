import { EmployeeDb } from "../modules/employee-db-module.js";

// Common validation helpers

// Kiểm tra chuỗi khác rỗng sau khi trim
export const isNonEmptyString = (text) =>
  typeof text === "string" && text.trim().length > 0;
// Kiểm tra số hợp lệ và lớn hơn 0
export const isPositiveNumber = (number) =>
  typeof number === "number" && Number.isFinite(number) && number > 0;
// Xác thực định dạng ngày hợp lệ có thể parse được
export const isValidDateString = (dateString) => {
  if (!isNonEmptyString(dateString)) return false;
  const timestamp = Date.parse(dateString);
  return Number.isFinite(timestamp);
};

// Validate dữ liệu nhập của form nhân viên
export function validateEmployeeInput({ name, salary, hireDate }) {
  const errors = [];
  if (!isNonEmptyString(name)) errors.push("Tên không được để trống");
  if (!isPositiveNumber(Number(salary))) errors.push("Lương phải > 0");
  if (!isValidDateString(hireDate)) errors.push("Ngày vào làm không hợp lệ");
  return { ok: errors.length === 0, errors };
}

// Validate khoảng giá trị số (min/max)
export function validateRangeNumber(min, max) {
  const nmin = Number(min);
  const nmax = Number(max);
  if (Number.isNaN(nmin) || Number.isNaN(nmax))
    return { ok: false, errors: ["Khoảng lương không hợp lệ"] };
  if (nmin < 0 || nmax < 0) return { ok: false, errors: ["Giá trị không âm"] };
  if (nmin > nmax) return { ok: false, errors: ["Min phải <= Max"] };
  return { ok: true, errors: [] };
}

// Kiểm tra mã nhân viên có hợp lệ và tồn tại hay không
export function validateEmployeeId(employeeId) {
  const errors = [];
  const numericId = Number(employeeId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    errors.push("Mã nhân viên phải là số nguyên dương");
  } else if (!EmployeeDb.getEmployeeById(numericId)) {
    errors.push("Nhân viên không tồn tại");
  }
  return { ok: errors.length === 0, errors };
}

// Kiểm tra phòng ban tồn tại
export async function validateDepartmentExists(departmentId) {
  const errors = [];
  const numericId = Number(departmentId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    errors.push("Phòng ban không hợp lệ");
  } else {
    const departments = await EmployeeDb.getAllDepartments();
    const exists = departments.some(
      (department) => department.id === numericId
    );
    if (!exists) {
      errors.push("Phòng ban không tồn tại");
    }
  }
  return { ok: errors.length === 0, errors };
}

// Kiểm tra vị trí tồn tại
export async function validatePositionExists(positionId) {
  const errors = [];
  const numericId = Number(positionId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    errors.push("Vị trí không hợp lệ");
  } else {
    const positions = await EmployeeDb.getAllPositions();
    const exists = positions.some((position) => position.id === numericId);
    if (!exists) {
      errors.push("Vị trí không tồn tại");
    }
  }
  return { ok: errors.length === 0, errors };
}

// Kiểm tra khoảng ngày (start <= end)
export function validateDateRange(startDate, endDate) {
  const errors = [];
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    errors.push("Ngày không hợp lệ");
  } else if (new Date(endDate) < new Date(startDate)) {
    errors.push("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
  }
  return { ok: errors.length === 0, errors };
}

// Kiểm tra rating trong khoảng 1-5
export function validateRating(rating) {
  const numericRating = Number(rating);
  if (
    Number.isNaN(numericRating) ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return { ok: false, errors: ["Rating phải là số nguyên từ 1 đến 5"] };
  }
  return { ok: true, errors: [] };
}
