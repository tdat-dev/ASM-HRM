import { EmployeeDb } from "./employee-db-module.js";
import { renderTable, formatVND, escapeHTML } from "../utils/dom.js";

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
  async generatePayrollReport() {
    const employees = await EmployeeDb.getAllEmployees();
    return employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      salary: employee.salary,
      bonus: employee.bonus || 0,
      deduction: employee.deduction || 0,
      net: calculateNetSalary(employee),
    }));
  },

  async mount(viewEl, titleEl) {
    // Render bảng lương với các cột định dạng số liệu
    titleEl.textContent = "Bảng lương";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    const table = document.createElement("div");
    wrap.appendChild(table);
    viewEl.appendChild(wrap);

    const rows = await this.generatePayrollReport();
    const columns = [
      {
        header: "Mã NV",
        cell: (row) => `<span class="id-badge">#${row.id}</span>`,
      },
      { header: "Tên", cell: (row) => escapeHTML(row.name || "") },
      { header: "Lương", cell: (row) => formatVND(row.salary) },
      { header: "Thưởng", cell: (row) => formatVND(row.bonus) },
      {
        header: "Khấu trừ",
        cell: (row) => formatVND(row.deduction),
      },
      {
        header: "Thực lĩnh",
        cell: (row) =>
          `<strong class="amount-positive">${formatVND(row.net)}</strong>`,
      },
    ];
    // Cho phép HTML trong cell (id-badge, strong)
    renderTable(table, columns, rows, false);
  },
};
