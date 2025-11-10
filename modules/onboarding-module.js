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
        </form>
        <div id="onbList"></div>
      </div>
    `;
    viewEl.appendChild(container);

    const onbData = JSON.parse(localStorage.getItem("hrm_onboarding") || "[]");
    const listEl = container.querySelector("#onbList");
    const render = () => {
      if (onbData.length === 0) {
        listEl.innerHTML = `<div class="muted">Chưa có checklist.</div>`;
      } else {
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
                      <td>${o.name}</td>
                      <td>${o.email}</td>
                      <td>${o.manager || "-"}</td>
                      <td>
                        <ul style="margin:0; padding-left: 16px;">
                          ${o.items
                            .map(
                              (it) =>
                                `<li>${it.done ? "✅" : "⬜️"} ${it.title}</li>`
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
      if (!name || !email) return;
      const manager = container.querySelector("#onbManager").value.trim();
      const items = [
        { title: "Tạo tài khoản hệ thống", done: false },
        { title: "Ký hồ sơ lao động", done: false },
        { title: "Cấp máy/thiết bị", done: false },
        { title: "Đào tạo hội nhập", done: false },
      ];
      onbData.push({
        id: Date.now(),
        name,
        email,
        manager,
        items,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("hrm_onboarding", JSON.stringify(onbData));
      e.target.reset();
      render();
    });
  },
};



