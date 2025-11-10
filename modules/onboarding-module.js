import { escapeHTML } from "../utils/dom.js";
import { safeJSONParse } from "../utils/storage.js";

// Constants
const STORAGE_KEY_ONBOARDING = "hrm_onboarding";

// Checklist items mặc định cho onboarding
const DEFAULT_CHECKLIST_ITEMS = [
  { title: "Tạo tài khoản hệ thống", done: false },
  { title: "Ký hồ sơ lao động", done: false },
  { title: "Cấp máy/thiết bị", done: false },
  { title: "Đào tạo hội nhập", done: false },
];

export const OnboardingModule = {
  mount(viewEl, titleEl) {
    titleEl.textContent = "Onboarding nhân viên mới";
    viewEl.innerHTML = "";
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="card">
        <h3>✅ Checklist Onboarding</h3>
        <form id="onbForm" style="display:grid; gap: 8px; margin-bottom: 12px;">
          <input id="onbName" type="text" placeholder="Tên nhân viên" required />
          <input id="onbEmail" type="email" placeholder="Email công ty" required />
          <input id="onbManager" type="text" placeholder="Quản lý trực tiếp" />
          <button class="primary" type="submit"><i class="fas fa-plus-circle"></i> Tạo checklist</button>
          <div id="onbAlert"></div>
        </form>
        <div id="onbList"></div>
      </div>
    `;
    viewEl.appendChild(container);

    const onbData = safeJSONParse(localStorage.getItem(STORAGE_KEY_ONBOARDING), []);
    const listEl = container.querySelector("#onbList");
    const onbAlert = container.querySelector("#onbAlert");
    
    const render = () => {
      if (onbData.length === 0) {
        listEl.innerHTML = `<div class="muted">Chưa có checklist.</div>`;
      } else {
        // Escape tất cả dữ liệu động để chống XSS
        listEl.innerHTML = `
          <table class="table">
            <thead><tr><th>Nhân viên</th><th>Email</th><th>Quản lý</th><th>Hạng mục</th></tr></thead>
            <tbody>
              ${onbData
                .slice()
                .reverse()
                .map(
                  (o) =>
                    `<tr>
                      <td>${escapeHTML(o.name || "")}</td>
                      <td>${escapeHTML(o.email || "")}</td>
                      <td>${escapeHTML(o.manager || "-")}</td>
                      <td>
                        <ul style="margin:0; padding-left: 16px;">
                          ${(o.items || [])
                            .map(
                              (it) =>
                                `<li>${it.done ? "✅" : "⬜️"} ${escapeHTML(it.title || "")}</li>`
                            )
                            .join("")}
                        </ul>
                      </td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
    };
    
    render();

    container.querySelector("#onbForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = container.querySelector("#onbName").value.trim();
      const email = container.querySelector("#onbEmail").value.trim();
      
      // Validation với feedback
      if (!name || !email) {
        onbAlert.innerHTML = '<div class="alert error">Vui lòng nhập đủ thông tin (tên nhân viên và email).</div>';
        return;
      }
      
      // Kiểm tra định dạng email cơ bản
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        onbAlert.innerHTML = '<div class="alert error">Email không hợp lệ.</div>';
        return;
      }
      
      const manager = container.querySelector("#onbManager").value.trim();
      
      onbData.push({
        id: Date.now(),
        name: escapeHTML(name), // Escape để chống XSS
        email: escapeHTML(email),
        manager: escapeHTML(manager),
        items: DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item })), // Copy checklist items
        createdAt: new Date().toISOString(),
      });
      
      localStorage.setItem(STORAGE_KEY_ONBOARDING, JSON.stringify(onbData));
      onbAlert.innerHTML = '<div class="alert success">Tạo checklist thành công!</div>';
      e.target.reset();
      render();
      
      // Xóa thông báo sau 3 giây
      setTimeout(() => {
        onbAlert.innerHTML = "";
      }, 3000);
    });
  },
};
