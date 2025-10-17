import { EmployeeDb } from "./employee-db-module.js";
import { renderTable } from "../utils/dom.js";

// Tính lương thực lĩnh dựa trên lương cơ bản, thưởng và khấu trừ
function calculateNetSalary(employee) {
  const base = Number(employee.salary || 0);
  const bonus = Number(employee.bonus || 0);
  const deduction = Number(employee.deduction || 0);
  return base + bonus - deduction;
}

export const SalaryModule = {
  calculateNetSalary,
  // Tạo báo cáo bảng lương kèm lương thực lĩnh cho từng nhân viên
  generatePayrollReport() {
    return EmployeeDb.getAllEmployees().map((employee) => ({
      id: employee.id,
      name: employee.name,
      salary: employee.salary,
      bonus: employee.bonus || 0,
      deduction: employee.deduction || 0,
      net: calculateNetSalary(employee),
    }));
  },
  mount(viewEl, titleEl) {
    // Render bảng lương với các cột định dạng số liệu
    titleEl.textContent = "Bảng lương";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    const table = document.createElement("div");
    wrap.appendChild(table);
    viewEl.appendChild(wrap);

    const rows = this.generatePayrollReport();
    const columns = [
      {
        header: "Mã NV",
        cell: (row) =>
          `<span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">#${row.id}</span>`,
      },
      { header: "Tên", cell: (row) => row.name },
      { header: "Lương", cell: (row) => `${row.salary.toLocaleString()} VNĐ` },
      { header: "Thưởng", cell: (row) => `${row.bonus.toLocaleString()} VNĐ` },
      {
        header: "Khấu trừ",
        cell: (row) => `${row.deduction.toLocaleString()} VNĐ`,
      },
      {
        header: "Thực lĩnh",
        cell: (row) =>
          `<strong style="color: var(--success);">${row.net.toLocaleString()} VNĐ</strong>`,
      },
    ];
    renderTable(table, columns, rows);
  },
};
