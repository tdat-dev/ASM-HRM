import { EmployeeDb } from "./employee-db-module.js";

// Giả lập độ trễ để mô phỏng tác vụ async nhẹ
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const PositionModule = {
  // Render giao diện quản lý chức danh và xử lý thêm/xóa
  mount(viewEl, titleEl) {
    titleEl.textContent = "Vị trí";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <form id="posForm" style="margin-bottom:12px;display:grid;gap:8px;max-width:520px;">
        <input id="posTitle" placeholder="Chức danh" required />
        <input id="posDesc" placeholder="Mô tả" />
        <button class="primary">Thêm</button>
      </form>
			<table class="table"><thead><tr><th>Chức danh</th><th>Thao tác</th></tr></thead><tbody id="posBody"></tbody></table>
		`;
    viewEl.appendChild(wrap);

    const body = wrap.querySelector("#posBody");
    // Render lại bảng chức danh từ dữ liệu hiện tại
    const render = () => {
      const list = EmployeeDb.getAllPositions();
      body.innerHTML = list
        .map(
          (position) => `<tr>
				<td><strong>${position.title}</strong></td>
				<td><button data-del="${position.id}">Xóa</button></td>
			</tr>`
        )
        .join("");
    };
    render();

    wrap.querySelector("#posForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = wrap.querySelector("#posTitle").value.trim();
      const description = wrap.querySelector("#posDesc").value.trim();
      if (!title) return;
      await delay(200);
      const list = EmployeeDb.getAllPositions();
      const existed = list.some(
        (position) => position.title.toLowerCase() === title.toLowerCase()
      );
      if (existed) {
        alert("Vị trí đã tồn tại");
        return;
      }
      list.push({ id: Date.now(), title, description });
      EmployeeDb.savePositions(list);
      e.target.reset();
      render();
    });

    body.addEventListener("click", async (e) => {
      const target = e.target;
      if (target.matches("[data-del]")) {
        const id = Number(target.getAttribute("data-del"));
        if (window.confirm("Xóa vị trí?")) {
          await delay(150);
          const list = EmployeeDb.getAllPositions().filter(
            (position) => position.id !== id
          );
          EmployeeDb.savePositions(list);
          render();
        }
      }
    });
  },
};
