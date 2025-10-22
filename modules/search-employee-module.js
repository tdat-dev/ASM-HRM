import { EmployeeDb } from "./employee-db-module.js";
import { employeeAPI } from "../utils/api.js";
import { validateRangeNumber } from "../utils/validators.js";
import { renderTable } from "../utils/dom.js";

export const SearchEmployeeModule = {
  // Render công cụ lọc nhân viên theo regex tên, phòng ban và khoảng lương
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Tìm kiếm Nhân viên";
    viewEl.innerHTML = "";
    const departments = await EmployeeDb.getAllDepartments();
    const box = document.createElement("div");
    box.className = "card";
    box.innerHTML = `
			<form id="searchForm" style="margin-bottom:12px;">
				<div><label>Tên (regex)</label><input id="sName" placeholder="Ví dụ: ^N|Chi$" /></div>
				<div><label>Phòng ban</label>
					<select id="sDept"><option value="">Tất cả</option>${departments
            .map((d) => `<option value="${d.id}">${d.name}</option>`)
            .join("")}</select>
				</div>
				<div style="display:flex;gap:8px;">
					<div><label>Lương min</label><input id="sMin" type="number" min="0" /></div>
					<div><label>Lương max</label><input id="sMax" type="number" min="0" /></div>
				</div>
				<button class="primary">Lọc</button>
			</form>
			<div id="tableWrap"></div>
		`;
    viewEl.appendChild(box);

    const tableWrap = document.getElementById("tableWrap");
    const columns = [
      {
        header: "Mã NV",
        cell: (row) =>
          `<span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">#${row.id}</span>`,
      },
      { header: "Tên", cell: (row) => row.name },
      {
        header: "Phòng",
        cell: (row) =>
          departments.find(
            (department) => Number(department.id) === Number(row.department_id)
          )?.name || "",
      },
      {
        header: "Lương",
        cell: (row) => `${Number(row.salary).toLocaleString()} VNĐ`,
      },
    ];

    // Tiện ích render bảng kết quả theo danh sách đầu vào
    const renderRows = (rows) => renderTable(tableWrap, columns, rows);
    renderRows(await EmployeeDb.getAllEmployees());

    document
      .getElementById("searchForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const nameRe = document.getElementById("sName").value.trim();
        const dept = document.getElementById("sDept").value;
        const min = document.getElementById("sMin").value;
        const max = document.getElementById("sMax").value;

        const { ok, errors } = validateRangeNumber(
          min || 0,
          max || Number.MAX_SAFE_INTEGER
        );
        if (!ok) {
          renderRows([]);
          tableWrap.insertAdjacentHTML(
            "beforeend",
            `<div class="alert error">${errors.join("<br>")}</div>`
          );
          return;
        }
        const nmin = Number(min || 0);
        const nmax = Number(max || Number.MAX_SAFE_INTEGER);
        const regex = nameRe ? new RegExp(nameRe, "i") : null;

        try {
          const rows = await EmployeeDb.filterEmployees((emp) => {
            const okName = regex ? regex.test(emp.name) : true;
            const okDept = dept ? String(emp.department_id) === dept : true;
            const salaryValue = Number(emp.salary);
            const okSalary = salaryValue >= nmin && salaryValue <= nmax;
            return okName && okDept && okSalary;
          });
          const sortedRows = rows.sort((a, b) => Number(a.id) - Number(b.id));
          renderRows(sortedRows);
        } catch (error) {
          renderRows([]);
          tableWrap.insertAdjacentHTML(
            "beforeend",
            `<div class="alert error">${error.message || "Có lỗi xảy ra"}</div>`
          );
        }
      });
  },
};
