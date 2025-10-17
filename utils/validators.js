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
