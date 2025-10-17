import { EmployeeDb } from "./employee-db-module.js";
import {
  validateEmployeeInput,
  validateDepartmentExists,
  validatePositionExists,
} from "../utils/validators.js";
import { showAlert } from "../utils/dom.js";

export const AddEmployeeModule = {
  // Render màn hình thêm nhân viên và xử lý logic tạo mới
  mount(viewEl, titleEl) {
    titleEl.textContent = "Thêm Nhân viên";
    viewEl.innerHTML = "";
    const departments = EmployeeDb.getAllDepartments();
    const positions = EmployeeDb.getAllPositions();
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
			<form id="addEmpForm">
				<div>
					<label>Họ tên</label>
					<input id="empName" required />
				</div>
				<div>
					<label>Phòng ban</label>
					<select id="empDept" required>
						${departments
              .map(
                (department) =>
                  `<option value="${department.id}">${department.name}</option>`
              )
              .join("")}
					</select>
				</div>
				<div>
					<label>Vị trí</label>
					<select id="empPos" required>
						${positions
              .map(
                (position) =>
                  `<option value="${position.id}">${position.title}</option>`
              )
              .join("")}
					</select>
				</div>
				<div>
					<label>Lương cơ bản (VNĐ)</label>
					<input id="empSalary" type="number" min="0" step="1" placeholder="Ví dụ: 10000000" required />
				</div>
				<div>
					<label>Ngày vào làm</label>
					<input id="empHire" type="date" required />
				</div>
				<button class="primary">Thêm</button>
				<div id="addAlert"></div>
			</form>
		`;
    viewEl.appendChild(wrap);

    const form = document.getElementById("addEmpForm");
    const alertEl = document.getElementById("addAlert");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("empName").value.trim();
      const departmentId = Number(document.getElementById("empDept").value);
      const positionId = Number(document.getElementById("empPos").value);
      const salary = Number(document.getElementById("empSalary").value);
      const hireDate = document.getElementById("empHire").value;

      const validationMessages = [];
      const { ok, errors } = validateEmployeeInput({ name, salary, hireDate });
      if (!ok) {
        validationMessages.push(...errors);
      }
      const { ok: deptOk, errors: deptErrors } =
        validateDepartmentExists(departmentId);
      if (!deptOk) {
        validationMessages.push(...deptErrors);
      }
      const { ok: posOk, errors: posErrors } =
        validatePositionExists(positionId);
      if (!posOk) {
        validationMessages.push(...posErrors);
      }

      if (validationMessages.length > 0) {
        showAlert(alertEl, "error", validationMessages.join("<br>"));
        return;
      }

      const list = EmployeeDb.getAllEmployees();
      const id = Date.now();
      list.push({
        id,
        name,
        departmentId,
        positionId,
        salary,
        bonus: 0,
        deduction: 0,
        hireDate,
      });
      EmployeeDb.saveEmployees(list);
      showAlert(alertEl, "success", "Thêm nhân viên thành công");
      form.reset();
    });
  },
};
