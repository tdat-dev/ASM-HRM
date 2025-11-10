import { escapeHTML } from "../utils/dom.js";
import { safeJSONParse } from "../utils/storage.js";

// Constants
const STORAGE_KEY_NOTIFICATIONS = "hrm_notifications";

export const NotificationsModule = {
  mount(viewEl, titleEl) {
    titleEl.textContent = "Trung tâm thông báo";
    viewEl.innerHTML = "";
    const container = document.createElement("div");
    container.className = "card";
    container.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items:center;">
        <h3>Thông báo gần đây</h3>
        <div>
          <button id="markAllRead" class="secondary"><i class="fas fa-check-double"></i> Đánh dấu đã đọc</button>
          <button id="clearAll" class="danger"><i class="fas fa-trash"></i> Xóa tất cả</button>
        </div>
      </div>
      <div id="notiList"></div>
    `;
    viewEl.appendChild(container);

    const load = () => safeJSONParse(localStorage.getItem(STORAGE_KEY_NOTIFICATIONS), []);
    const save = (arr) => localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(arr));
    const listEl = container.querySelector("#notiList");

    const render = () => {
      const items = load();
      if (items.length === 0) {
        listEl.innerHTML = `<div class="muted">Không có thông báo nào.</div>`;
        return;
      }
      
      // Escape tất cả dữ liệu động để chống XSS
      listEl.innerHTML = `
        <ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px;">
          ${items
            .map(
              (n) => `
              <li class="card" style="padding:12px; border-left:4px solid ${
                n.read ? "var(--muted)" : "var(--primary)"
              }">
                <div style="display:flex; justify-content: space-between;">
                  <div>
                    <div style="font-weight:700;">${escapeHTML(n.title || "")}</div>
                    <div class="muted" style="font-size:12px;">${new Date(n.createdAt || Date.now()).toLocaleString()}</div>
                  </div>
                  <button data-id="${escapeHTML(String(n.id || ""))}" class="secondary noti-read">${n.read ? "Đã đọc" : "Đánh dấu đọc"}</button>
                </div>
                <div style="margin-top:6px;">${escapeHTML(n.message || "")}</div>
              </li>`
            )
            .join("")}
        </ul>
      `;
      
      listEl.querySelectorAll(".noti-read").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.getAttribute("data-id"));
          const arr = load();
          const item = arr.find((x) => x.id === id);
          if (item) item.read = true;
          save(arr);
          render();
        });
      });
    };

    container.querySelector("#markAllRead").addEventListener("click", () => {
      const arr = load().map((n) => ({ ...n, read: true }));
      save(arr);
      render();
    });
    
    container.querySelector("#clearAll").addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) {
        localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify([]));
        render();
      }
    });
    
    render();
  },
};
