import { EmployeeDb } from "./employee-db-module.js";
import { employeeAPI } from "../utils/api.js";
import { validateEmployeeId } from "../utils/validators.js";

export const DeleteEmployeeModule = {
  // Render quy trình tìm và xóa nhân viên theo ID
  async mount(viewEl, titleEl) {
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

    document
      .getElementById("delEmpForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = Number(document.getElementById("delEmpId").value);
        const emp = await EmployeeDb.getEmployeeById(id);
        const area = document.getElementById("delArea");
        const { ok, errors } = validateEmployeeId(id);
        if (!ok) {
          area.innerHTML = `<div class="alert error">${errors
            .map((e) => e.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
            .join("<br>")}</div>`;
          return;
        }
        if (!emp) {
          area.innerHTML = '<div class="alert error">Không tìm thấy</div>';
          return;
        }
        area.innerHTML = `<p>Bạn có chắc muốn xóa: <strong>${(emp.name || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")}</strong>?</p><button id="confirmDel" class="primary">Xóa</button>`;
        document
          .getElementById("confirmDel")
          .addEventListener("click", async () => {
            if (window.confirm("Xác nhận xóa?")) {
              try {
                await employeeAPI.delete(emp.id);
                area.innerHTML = '<div class="alert success">Đã xóa</div>';
              } catch (error) {
                const msg = (error.message || "Có lỗi xảy ra")
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
                area.innerHTML = `<div class="alert error">${msg}</div>`;
              }
            }
          });
      });
  },
};
