import { EmployeeDb } from "./employee-db-module.js";
import { employeeAPI } from "../utils/api.js";
import {
  validateRangeNumber,
  validateEmployeeInput,
  validateDepartmentExists,
  validatePositionExists,
} from "../utils/validators.js";
import {
  renderTable,
  escapeHTML,
  showToast,
  formatVND,
} from "../utils/dom.js";

const SALARY_MIN_DEFAULT = 0;
const SALARY_MAX_DEFAULT = Number.MAX_SAFE_INTEGER;

export const SearchEmployeeModule = {
  // Render công cụ lọc nhân viên theo regex tên, phòng ban và khoảng lương
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Tìm kiếm Nhân viên";
    viewEl.innerHTML = "";

    let departments = [];
    let positions = [];
    try {
      [departments, positions] = await Promise.all([
        EmployeeDb.getAllDepartments(),
        EmployeeDb.getAllPositions(),
      ]);
    } catch (error) {
      viewEl.innerHTML = `
        <div class="card">
          <div class="alert error">
            <i class="fas fa-exclamation-triangle"></i>
            ${escapeHTML(
              error?.message || "Không thể tải dữ liệu phòng ban/vị trí."
            )}
          </div>
        </div>
      `;
      showToast(
        error?.message || "Không thể tải dữ liệu phòng ban/vị trí",
        "error"
      );
      return;
    }

    if (!Array.isArray(departments) || !Array.isArray(positions)) {
      viewEl.innerHTML = `
        <div class="card">
          <div class="alert error">
            <i class="fas fa-exclamation-triangle"></i>
            Không thể tải dữ liệu phòng ban hoặc vị trí.
          </div>
        </div>
      `;
      showToast("Dữ liệu phòng ban hoặc vị trí không hợp lệ", "error");
      return;
    }

    const departmentOptionsHtml = departments
      .map(
        (department) =>
          `<option value="${escapeHTML(
            String(department.id)
          )}">${escapeHTML(department.name || "")}</option>`
      )
      .join("");

    const box = document.createElement("div");
    box.className = "card";
    box.innerHTML = `
			<form id="searchForm" style="margin-bottom:12px;">
				<div>
          <label for="sName">Tên (regex)</label>
          <input id="sName" placeholder="Ví dụ: ^N|Chi$" />
        </div>
				<div>
          <label for="sDept">Phòng ban</label>
					<select id="sDept">
            <option value="">Tất cả</option>
            ${departmentOptionsHtml}
          </select>
				</div>
				<div style="display:flex;gap:8px;">
					<div>
            <label for="sMin">Lương min</label>
            <input id="sMin" type="number" min="0" />
          </div>
					<div>
            <label for="sMax">Lương max</label>
            <input id="sMax" type="number" min="0" />
          </div>
				</div>
				<button class="primary">Lọc</button>
			</form>
			<div id="tableWrap"></div>
		`;
    viewEl.appendChild(box);

    const tableWrap = document.getElementById("tableWrap");
    const actionPanel = document.createElement("div");
    actionPanel.id = "searchActionPanel";
    actionPanel.className = "card action-panel is-hidden";
    viewEl.appendChild(actionPanel);

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
        cell: (row) => formatVND(row.salary),
      },
      {
        header: "Thao tác",
        cell: (row) => {
          const safeId = escapeHTML(String(row.id || ""));
          return `
            <div class="table-actions">
              <button
                type="button"
                class="secondary action-btn action-edit"
                data-id="${safeId}"
                title="Sửa nhân viên"
              >
                <i class="fas fa-pen"></i>
                <span>Sửa</span>
              </button>
              <button
                type="button"
                class="danger action-btn action-delete"
                data-id="${safeId}"
                title="Xóa nhân viên"
              >
                <i class="fas fa-trash"></i>
                <span>Xóa</span>
              </button>
            </div>
          `;
        },
      },
    ];

    const state = {
      cachedEmployees: [],
      currentRows: [],
      lastFilter: {
        pattern: "",
        departmentId: "",
        min: SALARY_MIN_DEFAULT,
        max: SALARY_MAX_DEFAULT,
      },
    };

    const closeActionPanel = () => {
      actionPanel.classList.add("is-hidden");
      actionPanel.innerHTML = "";
    };

    const showActionPanel = (content) => {
      actionPanel.innerHTML = content;
      actionPanel.classList.remove("is-hidden");
      actionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const getSafeRegex = (pattern) => {
      if (!pattern) return null;
      try {
        return new RegExp(pattern, "i");
      } catch {
        return null;
      }
    };

    const renderFeedback = (container, type, messages) => {
      if (!container) return;
      const safeMessage = Array.isArray(messages)
        ? messages.map((msg) => escapeHTML(msg)).join("<br>")
        : escapeHTML(messages || "");
      container.innerHTML = `<div class="alert ${type}">${safeMessage}</div>`;
    };

    const applyFilters = () => {
      if (!Array.isArray(state.cachedEmployees)) {
        return [];
      }
      const regex = getSafeRegex(state.lastFilter.pattern);
      return state.cachedEmployees
        .filter((emp) => {
          const name = typeof emp.name === "string" ? emp.name : "";
          const departmentValue =
            emp.departmentId ?? emp.department_id ?? "";
          const salaryValue = Number(emp.salary);
          const normalizedSalary = Number.isFinite(salaryValue)
            ? salaryValue
            : 0;
          const matchName = regex ? regex.test(name) : true;
          const matchDept = state.lastFilter.departmentId
            ? String(departmentValue) === state.lastFilter.departmentId
            : true;
          const matchSalary =
            normalizedSalary >= state.lastFilter.min &&
            normalizedSalary <= state.lastFilter.max;
          return matchName && matchDept && matchSalary;
        })
        .sort((a, b) => Number(a.id) - Number(b.id));
    };

    const refreshEmployees = async () => {
      const data = await EmployeeDb.getAllEmployees();
      state.cachedEmployees = Array.isArray(data) ? data : [];
      return state.cachedEmployees;
    };

    const ensureEmployees = async () => {
      if (
        !Array.isArray(state.cachedEmployees) ||
        state.cachedEmployees.length === 0
      ) {
        await refreshEmployees();
      }
      return state.cachedEmployees;
    };

    // Tiện ích render bảng kết quả theo danh sách đầu vào
    const renderRows = (rows) => {
      if (!Array.isArray(rows)) {
        state.currentRows = [];
        tableWrap.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Dữ liệu không hợp lệ: không phải mảng.</div>';
        return;
      }

      if (rows.length === 0) {
        state.currentRows = [];
        tableWrap.innerHTML =
          '<div class="alert warning"><i class="fas fa-info-circle"></i> Không tìm thấy nhân viên nào.</div>';
        return;
      }

      state.currentRows = rows;
      // Cho phép HTML trong cell đầu tiên (id-badge), các cell khác đã tự escape
      renderTable(tableWrap, columns, rows, false);
    };

    // Load danh sách ban đầu
    try {
      const employees = await refreshEmployees();

      if (!Array.isArray(employees) || employees.length === 0) {
        tableWrap.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Không thể tải danh sách nhân viên. Vui lòng kiểm tra kết nối API.</div>';
      } else {
        renderRows(employees);
      }
    } catch (error) {
      tableWrap.innerHTML = `<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Lỗi: ${escapeHTML(
        error?.message || "Không thể tải dữ liệu"
      )}</div>`;
      showToast(error?.message || "Không thể tải danh sách nhân viên", "error");
    }

    const handleEdit = async (employeeId) => {
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        showToast("Mã nhân viên không hợp lệ", "error");
        return;
      }
      try {
        await ensureEmployees();
      } catch (error) {
        showToast(
          error?.message || "Không thể tải danh sách nhân viên",
          "error"
        );
        return;
      }
      const employee = state.cachedEmployees.find(
        (item) => Number(item.id) === employeeId
      );
      if (!employee) {
        showToast("Không tìm thấy nhân viên", "error");
        return;
      }

      const currentDeptId = String(
        employee.departmentId ?? employee.department_id ?? ""
      );
      const currentPosId = String(
        employee.positionId ?? employee.position_id ?? ""
      );

      const departmentOptions = departments
        .map((department) => {
          const isSelected =
            String(department.id) === currentDeptId ? "selected" : "";
          return `<option value="${escapeHTML(
            String(department.id)
          )}" ${isSelected}>${escapeHTML(department.name || "")}</option>`;
        })
        .join("");
      const positionOptions = positions
        .map((position) => {
          const isSelected =
            String(position.id) === currentPosId ? "selected" : "";
          return `<option value="${escapeHTML(
            String(position.id)
          )}" ${isSelected}>${escapeHTML(position.title || "")}</option>`;
        })
        .join("");

      showActionPanel(`
        <h3>Chỉnh sửa nhân viên #${escapeHTML(String(employee.id || ""))}</h3>
        <form id="searchEditForm" class="action-form" autocomplete="off">
          <div class="form-row">
            <label for="searchEditName">Họ tên</label>
            <input
              id="searchEditName"
              type="text"
              value="${escapeHTML(employee.name || "")}"
              required
            />
          </div>
          <div class="form-row">
            <label for="searchEditDept">Phòng ban</label>
            <select id="searchEditDept" required>
              ${departmentOptions}
            </select>
          </div>
          <div class="form-row">
            <label for="searchEditPos">Vị trí</label>
            <select id="searchEditPos" required>
              ${positionOptions}
            </select>
          </div>
          <div class="form-row">
            <label for="searchEditSalary">Lương (VNĐ)</label>
            <input
              id="searchEditSalary"
              type="number"
              min="0"
              step="1"
              value="${escapeHTML(String(employee.salary ?? ""))}"
              required
            />
          </div>
          <div class="form-row">
            <label for="searchEditHireDate">Ngày vào làm</label>
            <input
              id="searchEditHireDate"
              type="date"
              value="${escapeHTML(
                employee.hire_date || employee.hireDate || ""
              )}"
              required
            />
          </div>
          <div class="form-actions">
            <button type="submit" class="primary">Lưu thay đổi</button>
            <button type="button" class="secondary" id="searchActionCancel">
              Hủy
            </button>
          </div>
          <div id="searchActionFeedback"></div>
        </form>
      `);

      const form = actionPanel.querySelector("#searchEditForm");
      const cancelBtn = actionPanel.querySelector("#searchActionCancel");
      const feedbackEl = actionPanel.querySelector("#searchActionFeedback");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          closeActionPanel();
        });
      }

      if (!form) {
        return;
      }

      const nameInput = form.querySelector("#searchEditName");
      const deptSelect = form.querySelector("#searchEditDept");
      const posSelect = form.querySelector("#searchEditPos");
      const salaryInput = form.querySelector("#searchEditSalary");
      const hireDateInput = form.querySelector("#searchEditHireDate");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        feedbackEl.innerHTML = "";
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.setAttribute("aria-busy", "true");
        }

        const updated = {
          name: nameInput.value.trim(),
          department_id: Number(deptSelect.value),
          position_id: Number(posSelect.value),
          salary: Number(salaryInput.value),
          hire_date: hireDateInput.value,
        };

        const messages = [];
        const { ok, errors } = validateEmployeeInput({
          name: updated.name,
          salary: updated.salary,
          hireDate: updated.hire_date,
        });
        if (!ok) {
          messages.push(...errors);
        }

        const { ok: deptOk, errors: deptErrors } =
          await validateDepartmentExists(updated.department_id);
        if (!deptOk) {
          messages.push(...deptErrors);
        }

        const { ok: posOk, errors: posErrors } = await validatePositionExists(
          updated.position_id
        );
        if (!posOk) {
          messages.push(...posErrors);
        }

        if (messages.length > 0) {
          renderFeedback(feedbackEl, "error", messages);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute("aria-busy");
          }
          return;
        }

        try {
          await employeeAPI.update(employee.id, updated);
          try {
            await refreshEmployees();
            renderRows(applyFilters());
          } catch (refreshError) {
            showToast(
              refreshError?.message ||
                "Cập nhật thành công nhưng không thể làm mới danh sách.",
              "warning"
            );
          }
          showToast("Cập nhật nhân viên thành công", "success");
          closeActionPanel();
        } catch (error) {
          renderFeedback(
            feedbackEl,
            "error",
            error?.message || "Có lỗi xảy ra khi cập nhật nhân viên."
          );
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute("aria-busy");
          }
        }
      });
    };

    const handleDelete = async (employeeId) => {
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        showToast("Mã nhân viên không hợp lệ", "error");
        return;
      }
      try {
        await ensureEmployees();
      } catch (error) {
        showToast(
          error?.message || "Không thể tải danh sách nhân viên",
          "error"
        );
        return;
      }
      const employee = state.cachedEmployees.find(
        (item) => Number(item.id) === employeeId
      );
      if (!employee) {
        showToast("Không tìm thấy nhân viên", "error");
        return;
      }

      showActionPanel(`
        <h3>Xóa nhân viên #${escapeHTML(String(employee.id || ""))}</h3>
        <p>
          Bạn có chắc chắn muốn xóa nhân viên
          <strong>${escapeHTML(employee.name || "Không rõ")}</strong>?
        </p>
        <div class="form-actions">
          <button type="button" class="danger" id="searchConfirmDelete">
            Xóa nhân viên
          </button>
          <button type="button" class="secondary" id="searchActionCancel">
            Hủy
          </button>
        </div>
        <div id="searchActionFeedback"></div>
      `);

      const cancelBtn = actionPanel.querySelector("#searchActionCancel");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          closeActionPanel();
        });
      }

      const confirmBtn = actionPanel.querySelector("#searchConfirmDelete");
      const feedbackEl = actionPanel.querySelector("#searchActionFeedback");
      if (!confirmBtn) {
        return;
      }

      confirmBtn.addEventListener("click", async () => {
        const confirmMessage = `Bạn có chắc muốn xóa nhân viên "${
          employee.name || ""
        }"?`;
        if (!window.confirm(confirmMessage)) {
          return;
        }
        confirmBtn.disabled = true;
        confirmBtn.setAttribute("aria-busy", "true");
        try {
          await employeeAPI.delete(employee.id);
          try {
            await refreshEmployees();
            const rows = applyFilters();
            renderRows(rows);
          } catch (refreshError) {
            showToast(
              refreshError?.message ||
                "Đã xóa nhưng không thể làm mới danh sách.",
              "warning"
            );
          }
          showToast("Đã xóa nhân viên", "success");
          closeActionPanel();
        } catch (error) {
          renderFeedback(
            feedbackEl,
            "error",
            error?.message || "Có lỗi xảy ra khi xóa nhân viên."
          );
          confirmBtn.disabled = false;
          confirmBtn.removeAttribute("aria-busy");
        }
      });
    };

    tableWrap.addEventListener("click", (event) => {
      const editBtn = event.target.closest(".action-edit");
      if (editBtn) {
        const idAttr = Number(editBtn.getAttribute("data-id"));
        handleEdit(idAttr);
        return;
      }
      const deleteBtn = event.target.closest(".action-delete");
      if (deleteBtn) {
        const idAttr = Number(deleteBtn.getAttribute("data-id"));
        handleDelete(idAttr);
      }
    });

    document
      .getElementById("searchForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        closeActionPanel();
        const nameRe = document.getElementById("sName").value.trim();
        const dept = document.getElementById("sDept").value;
        const min = document.getElementById("sMin").value;
        const max = document.getElementById("sMax").value;

        const { ok, errors } = validateRangeNumber(
          min || SALARY_MIN_DEFAULT,
          max || SALARY_MAX_DEFAULT
        );
        if (!ok) {
          renderRows([]);
          // Xóa alert cũ nếu có
          const oldAlert = tableWrap.querySelector(".alert");
          if (oldAlert) oldAlert.remove();
          tableWrap.insertAdjacentHTML(
            "afterbegin",
            `<div class="alert error">${errors
              .map((err) => escapeHTML(err))
              .join("<br>")}</div>`
          );
          return;
        }
        const nmin = Number(min || SALARY_MIN_DEFAULT);
        const nmax = Number(max || SALARY_MAX_DEFAULT);

        try {
          await ensureEmployees();
          state.lastFilter = {
            pattern: nameRe,
            departmentId: dept,
            min: nmin,
            max: nmax,
          };
          const rows = applyFilters();
          renderRows(rows);
        } catch (error) {
          renderRows([]);
          showToast(error?.message || "Có lỗi xảy ra khi tìm kiếm", "error");
        }
      });
  },
};

