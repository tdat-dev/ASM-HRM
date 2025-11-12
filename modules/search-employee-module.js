import { EmployeeDb } from "./employee-db-module.js";
import { employeeAPI } from "../utils/api.js";
import { validateRangeNumber } from "../utils/validators.js";
import { renderTable, escapeHTML, showToast } from "../utils/dom.js";

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
            .map(
              (d) =>
                `<option value="${d.id}">${escapeHTML(d.name || "")}</option>`
            )
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
          `<span class="id-badge">#${escapeHTML(String(row.id || ""))}</span>`,
      },
      { header: "Tên", cell: (row) => escapeHTML(row.name || "-") },
      {
        header: "Phòng",
        cell: (row) =>
          escapeHTML(
            departments.find(
              (department) =>
                Number(department.id) ===
                Number(row.departmentId || row.department_id)
            )?.name || "-"
          ),
      },
      {
        header: "Lương",
        cell: (row) => `${Number(row.salary).toLocaleString()} VNĐ`,
      },
    ];

    // Tiện ích render bảng kết quả theo danh sách đầu vào
    const renderRows = (rows) => {
      if (!Array.isArray(rows)) {
        tableWrap.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Dữ liệu không hợp lệ: không phải mảng.</div>';
        return;
      }

      if (rows.length === 0) {
        tableWrap.innerHTML =
          '<div class="alert warning"><i class="fas fa-info-circle"></i> Không tìm thấy nhân viên nào.</div>';
        return;
      }

      // Cho phép HTML trong cell đầu tiên (id-badge), các cell khác đã tự escape
      renderTable(tableWrap, columns, rows, false);
    };

    // Load danh sách ban đầu
    try {
      const employees = await EmployeeDb.getAllEmployees();

      if (!Array.isArray(employees)) {
        tableWrap.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Không thể tải danh sách nhân viên. Vui lòng kiểm tra kết nối API.</div>';
      } else {
        renderRows(employees);
      }
    } catch (error) {
      tableWrap.innerHTML = `<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Lỗi: ${escapeHTML(
        error.message || "Không thể tải dữ liệu"
      )}</div>`;
      showToast(error.message || "Không thể tải danh sách nhân viên", "error");
    }

    // Cache danh sách nhân viên đã tải để tránh gọi API lặp lại khi tìm kiếm
    let cachedEmployees = [];
    try {
      cachedEmployees = await EmployeeDb.getAllEmployees();
    } catch {}

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
          // Xóa alert cũ nếu có
          const oldAlert = tableWrap.querySelector(".alert");
          if (oldAlert) oldAlert.remove();
          tableWrap.insertAdjacentHTML(
            "afterbegin",
            `<div class="alert error">${errors
              .map((e) => escapeHTML(e))
              .join("<br>")}</div>`
          );
          return;
        }
        const nmin = Number(min || 0);
        const nmax = Number(max || Number.MAX_SAFE_INTEGER);
        const regex = nameRe ? new RegExp(nameRe, "i") : null;

        try {
          // Lọc trên dữ liệu đã cache để tránh gọi API lại
          const source =
            Array.isArray(cachedEmployees) && cachedEmployees.length > 0
              ? cachedEmployees
              : await EmployeeDb.getAllEmployees();

          const rows = source.filter((emp) => {
            const okName = regex ? regex.test(emp.name) : true;
            const empDeptId = emp.departmentId || emp.department_id;
            const okDept = dept ? String(empDeptId) === dept : true;
            const salaryValue = Number(emp.salary);
            const okSalary = salaryValue >= nmin && salaryValue <= nmax;

            return okName && okDept && okSalary;
          });
          const sortedRows = rows.sort((a, b) => Number(a.id) - Number(b.id));
          renderRows(sortedRows);
        } catch (error) {
          renderRows([]);
          showToast(error.message || "Có lỗi xảy ra khi tìm kiếm", "error");
        }
      });
  },
};
