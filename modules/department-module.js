import { EmployeeDb } from "./employee-db-module.js";
import { departmentAPI } from "../utils/api.js";
import { showToast, escapeHTML } from "../utils/dom.js";

export const DepartmentModule = {
  // Render màn hình quản lý phòng ban và xử lý CRUD đơn giản
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Phòng ban";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
			<form id="deptForm" style="margin-bottom:12px;display:flex;gap:8px;">
				<input id="deptName" placeholder="Tên phòng ban" required />
				<button class="primary">Thêm</button>
			</form>
			<table class="table"><thead><tr><th>Tên</th><th>Thao tác</th></tr></thead><tbody id="deptBody"></tbody></table>
		`;
    viewEl.appendChild(wrap);

    const body = wrap.querySelector("#deptBody");
    // Render lại danh sách phòng ban từ cơ sở dữ liệu hiện tại
    const render = async () => {
      const list = await EmployeeDb.getAllDepartments();
      body.innerHTML = list
        .map(
          (department) => `<tr>
				<td>${escapeHTML(department.name || "")}</td>
				<td>
					<button data-edit="${department.id}">Sửa</button>
					<button data-del="${department.id}">Xóa</button>
				</td>
			</tr>`
        )
        .join("");
    };
    await render();

    wrap.querySelector("#deptForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = wrap.querySelector("#deptName").value.trim();
      if (!name) return;

      try {
        await departmentAPI.create({ name, manager_id: null });
        wrap.querySelector("#deptForm").reset();
        showToast("Đã thêm phòng ban thành công.", "success");
        await render();
      } catch (error) {
        showToast(error.message || "Có lỗi xảy ra", "error");
      }
    });

    body.addEventListener("click", async (e) => {
      const target = e.target;
      if (target.matches("[data-del]")) {
        const id = Number(target.getAttribute("data-del"));
        if (window.confirm("Xóa phòng ban?")) {
          try {
            await departmentAPI.delete(id);
            showToast("Đã xóa phòng ban thành công.", "success");
            await render();
          } catch (error) {
            showToast(error.message || "Có lỗi xảy ra", "error");
          }
        }
      }
      if (target.matches("[data-edit]")) {
        const id = Number(target.getAttribute("data-edit"));
        const list = await EmployeeDb.getAllDepartments();
        const dept = list.find((department) => department.id === id);
        const newName = prompt("Tên mới", dept?.name || "");
        if (newName) {
          try {
            await departmentAPI.update(id, {
              name: newName.trim(),
              manager_id: dept.manager_id,
            });
            showToast("Đã cập nhật phòng ban thành công.", "success");
            await render();
          } catch (error) {
            showToast(error.message || "Có lỗi xảy ra", "error");
          }
        }
      }
    });
  },
};
