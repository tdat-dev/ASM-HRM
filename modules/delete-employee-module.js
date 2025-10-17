import { EmployeeDb } from "./employee-db-module.js";
import { validateEmployeeId } from "../utils/validators.js";

export const DeleteEmployeeModule = {
  // Render quy trình tìm và xóa nhân viên theo ID
  mount(viewEl, titleEl) {
    titleEl.textContent = "Xóa Nhân viên";
    viewEl.innerHTML = "";
    const box = document.createElement("div");
    box.className = "card";
    box.innerHTML = `
			<form id="delEmpForm" style="margin-bottom:12px;">
				<label>Mã nhân viên</label>
				<input id="delEmpId" type="number" placeholder="Nhập ID..." />
				<button class="primary" type="submit">Tìm</button>
			</form>
			<div id="delArea"></div>
		`;
    viewEl.appendChild(box);

    document.getElementById("delEmpForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = Number(document.getElementById("delEmpId").value);
      const emp = EmployeeDb.getEmployeeById(id);
      const area = document.getElementById("delArea");
      const { ok, errors } = validateEmployeeId(id);
      if (!ok) {
        area.innerHTML = `<div class="alert error">${errors.join(
          "<br>"
        )}</div>`;
        return;
      }
      if (!emp) {
        area.innerHTML = '<div class="alert error">Không tìm thấy</div>';
        return;
      }
      area.innerHTML = `<p>Bạn có chắc muốn xóa: <strong>${emp.name}</strong>?</p><button id="confirmDel" class="primary">Xóa</button>`;
      document.getElementById("confirmDel").addEventListener("click", () => {
        if (window.confirm("Xác nhận xóa?")) {
          const list = EmployeeDb.getAllEmployees().filter(
            (employee) => employee.id !== emp.id
          );
          EmployeeDb.saveEmployees(list);
          area.innerHTML = '<div class="alert success">Đã xóa</div>';
        }
      });
    });
  },
};
