import { EmployeeDb } from "./employee-db-module.js";
import { positionAPI } from "../utils/api.js";
import { showToast } from "../utils/dom.js";

export const PositionModule = {
  // Render giao diện quản lý chức danh và xử lý thêm/xóa
  async mount(viewEl, titleEl) {
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
    const render = async () => {
      const list = await EmployeeDb.getAllPositions();
      body.innerHTML = list
        .map(
          (position) => `<tr>
				<td><strong>${position.title}</strong></td>
				<td><button data-del="${position.id}">Xóa</button></td>
			</tr>`
        )
        .join("");
    };
    await render();

    wrap.querySelector("#posForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = wrap.querySelector("#posTitle").value.trim();
      const description = wrap.querySelector("#posDesc").value.trim();
      if (!title) return;

      try {
        await positionAPI.create({
          title,
          description,
          salary_base: 0,
        });
        e.target.reset();
        showToast("Đã thêm vị trí thành công.", "success");
        await render();
      } catch (error) {
        showToast(error.message || "Có lỗi xảy ra", "error");
      }
    });

    body.addEventListener("click", async (e) => {
      const target = e.target;
      if (target.matches("[data-del]")) {
        const id = Number(target.getAttribute("data-del"));
        if (window.confirm("Xóa vị trí?")) {
          try {
            await positionAPI.delete(id);
            showToast("Đã xóa vị trí thành công.", "success");
            await render();
          } catch (error) {
            showToast(error.message || "Có lỗi xảy ra", "error");
          }
        }
      }
    });
  },
};
