import { EmployeeDb } from "./employee-db-module.js";
import {
  validateEmployeeInput,
  validateDepartmentExists,
  validatePositionExists,
} from "../utils/validators.js";
import { showAlert } from "../utils/dom.js";

export const EditEmployeeModule = {
  // Render quy trình tìm nhân viên theo tên và cập nhật thông tin chi tiết
  mount(viewEl, titleEl) {
    titleEl.textContent = "Sửa Nhân viên";
    viewEl.innerHTML = "";
    const box = document.createElement("div");
    box.className = "card";
    box.innerHTML = `
			<form id="findEmpForm" style="margin-bottom:12px;">
				<label>Tên nhân viên</label>
				<input id="editEmpUsername" type="text" placeholder="Nhập Tên..." />
				<button class="primary" type="submit">Tải</button>
			</form>
			<div id="editArea"></div>
		`;
    viewEl.appendChild(box);

    const form = document.getElementById("findEmpForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("editEmpUsername").value.trim();
      const allEmps = EmployeeDb.getAllEmployees();
      const emp = allEmps.find(
        (employee) =>
          employee.name.toLowerCase().trim() === username.toLowerCase().trim()
      );
      const area = document.getElementById("editArea");
      if (!emp) {
        area.innerHTML = '<div class="alert error">Không tìm thấy</div>';
        return;
      }
      const departments = EmployeeDb.getAllDepartments();
      const positions = EmployeeDb.getAllPositions();
      area.innerHTML = `
				<form id="editForm">
					<div><label>Họ tên</label><input id="eName" value="${
            emp.name
          }" required /></div>
					<div><label>Phòng ban</label>
						<select id="eDept">${departments
              .map(
                (department) =>
                  `<option ${
                    department.id === emp.departmentId ? "selected" : ""
                  } value="${department.id}">${department.name}</option>`
              )
              .join("")}</select>
					</div>
					<div><label>Vị trí</label>
						<select id="ePos">${positions
              .map(
                (position) =>
                  `<option ${
                    position.id === emp.positionId ? "selected" : ""
                  } value="${position.id}">${position.title}</option>`
              )
              .join("")}</select>
					</div>
					<div><label>Lương (VNĐ)</label><input id="eSalary" type="number" min="0" step="1" value="${
            emp.salary
          }" placeholder="Ví dụ: 10000000" required /></div>
					<div><label>Ngày vào làm</label><input id="eHire" type="date" value="${
            emp.hireDate
          }" required /></div>
					<button class="primary">Lưu</button>
					<div id="editAlert"></div>
				</form>
			`;
      const editForm = document.getElementById("editForm");
      const alertEl = document.getElementById("editAlert");
      editForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const updated = {
          name: document.getElementById("eName").value.trim(),
          departmentId: Number(document.getElementById("eDept").value),
          positionId: Number(document.getElementById("ePos").value),
          salary: Number(document.getElementById("eSalary").value),
          hireDate: document.getElementById("eHire").value,
        };
        const messages = [];
        const { ok, errors } = validateEmployeeInput(updated);
        if (!ok) {
          messages.push(...errors);
        }
        const { ok: deptOk, errors: deptErrors } = validateDepartmentExists(
          updated.departmentId
        );
        if (!deptOk) {
          messages.push(...deptErrors);
        }
        const { ok: posOk, errors: posErrors } = validatePositionExists(
          updated.positionId
        );
        if (!posOk) {
          messages.push(...posErrors);
        }
        if (messages.length > 0) {
          showAlert(alertEl, "error", messages.join("<br>"));
          return;
        }
        const list = EmployeeDb.getAllEmployees();
        const index = list.findIndex((employee) => employee.id === emp.id);
        if (index === -1) {
          showAlert(alertEl, "error", "Lỗi dữ liệu");
          return;
        }
        list[index] = { ...emp, ...updated };
        EmployeeDb.saveEmployees(list);
        showAlert(alertEl, "success", "Đã lưu");
      });
    });
  },
};
