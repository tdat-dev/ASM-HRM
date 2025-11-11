import { EmployeeDb } from "./employee-db-module.js";
import { employeeAPI } from "../utils/api.js";
import {
  validateEmployeeInput,
  validateDepartmentExists,
  validatePositionExists,
} from "../utils/validators.js";
import { showAlert, escapeHTML } from "../utils/dom.js";

export const EditEmployeeModule = {
  // Render quy trình tìm nhân viên theo tên và cập nhật thông tin chi tiết
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Sửa Nhân viên";
    viewEl.innerHTML = "";
    const box = document.createElement("div");
    box.className = "card";
    box.innerHTML = `
      <form id="findEmpForm" style="margin-bottom:12px;">
        <label>Mã nhân viên</label>
        <input id="editEmpCode" type="text" placeholder="Ví dụ: 1001" />
        <button class="primary" type="submit">Tải</button>
      </form>
			<div id="editArea"></div>
		`;
    viewEl.appendChild(box);

    const form = document.getElementById("findEmpForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputValue = document.getElementById("editEmpCode").value.trim();
      const area = document.getElementById("editArea");
      if (!inputValue) {
        area.innerHTML =
          '<div class="alert error">Vui lòng nhập mã nhân viên</div>';
        return;
      }
      const employeeId = Number(inputValue);
      if (!Number.isFinite(employeeId)) {
        area.innerHTML =
          '<div class="alert error">Mã nhân viên không hợp lệ</div>';
        return;
      }
      const allEmps = await EmployeeDb.getAllEmployees();
      const emp = allEmps.find(
        (employee) => Number(employee.id) === employeeId
      );
      if (!emp) {
        area.innerHTML = '<div class="alert error">Không tìm thấy</div>';
        return;
      }
      const departments = await EmployeeDb.getAllDepartments();
      const positions = await EmployeeDb.getAllPositions();
      area.innerHTML = `
				<form id="editForm">
					<div><label>Họ tên</label><input id="eName" value="${escapeHTML(emp.name || "")}" required /></div>
					<div><label>Phòng ban</label>
						<select id="eDept">${departments
              .map(
                (department) =>
                  `<option ${
                    department.id === emp.department_id ? "selected" : ""
                  } value="${department.id}">${escapeHTML(department.name || "")}</option>`
              )
              .join("")}</select>
					</div>
					<div><label>Vị trí</label>
						<select id="ePos">${positions
              .map(
                (position) =>
                  `<option ${
                    position.id === emp.position_id ? "selected" : ""
                  } value="${position.id}">${escapeHTML(position.title || "")}</option>`
              )
              .join("")}</select>
					</div>
					<div><label>Lương (VNĐ)</label><input id="eSalary" type="number" min="0" step="1" value="${String(emp.salary ?? "")}" placeholder="Ví dụ: 10000000" required /></div>
					<div><label>Ngày vào làm</label><input id="eHire" type="date" value="${escapeHTML(emp.hire_date || "")}" required /></div>
					<button class="primary">Lưu</button>
					<div id="editAlert"></div>
				</form>
			`;
      const editForm = document.getElementById("editForm");
      const alertEl = document.getElementById("editAlert");
      editForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const updated = {
          name: document.getElementById("eName").value.trim(),
          department_id: Number(document.getElementById("eDept").value),
          position_id: Number(document.getElementById("ePos").value),
          salary: Number(document.getElementById("eSalary").value),
          hire_date: document.getElementById("eHire").value,
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

        // AWAIT async validators
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
          showAlert(alertEl, "error", messages.join("<br>"));
          return;
        }

        try {
          await employeeAPI.update(emp.id, updated);
          showAlert(alertEl, "success", "Đã lưu");
        } catch (error) {
          showAlert(alertEl, "error", error.message || "Có lỗi xảy ra");
        }
      });
    });
  },
};
