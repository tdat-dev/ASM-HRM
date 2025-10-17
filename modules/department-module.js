import { EmployeeDb } from "./employee-db-module.js";

export const DepartmentModule = {
  // Render màn hình quản lý phòng ban và xử lý CRUD đơn giản
  mount(viewEl, titleEl) {
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
    const render = () => {
      const list = EmployeeDb.getAllDepartments();
      body.innerHTML = list
        .map(
          (department) => `<tr>
				<td>${department.name}</td>
				<td>
					<button data-edit="${department.id}">Sửa</button>
					<button data-del="${department.id}">Xóa</button>
				</td>
			</tr>`
        )
        .join("");
    };
    render();

    wrap.querySelector("#deptForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = wrap.querySelector("#deptName").value.trim();
      if (!name) return;
      const list = EmployeeDb.getAllDepartments();
      list.push({ id: Date.now(), name, managerId: null });
      EmployeeDb.saveDepartments(list);
      wrap.querySelector("#deptForm").reset();
      render();
    });

    body.addEventListener("click", (e) => {
      const target = e.target;
      if (target.matches("[data-del]")) {
        const id = Number(target.getAttribute("data-del"));
        if (window.confirm("Xóa phòng ban?")) {
          const list = EmployeeDb.getAllDepartments().filter(
            (department) => department.id !== id
          );
          EmployeeDb.saveDepartments(list);
          render();
        }
      }
      if (target.matches("[data-edit]")) {
        const id = Number(target.getAttribute("data-edit"));
        const list = EmployeeDb.getAllDepartments();
        const index = list.findIndex((department) => department.id === id);
        const newName = prompt("Tên mới", list[index]?.name || "");
        if (newName) {
          list[index].name = newName.trim();
          EmployeeDb.saveDepartments(list);
          render();
        }
      }
    });
  },
};
