import { escapeHTML } from "../utils/dom.js";
import { fileToBase64, normalizeProfile } from "./profile-store.js";

export const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="60" fill="#E2E8F0"/><path d="M60 58C67.732 58 74 51.732 74 44C74 36.268 67.732 30 60 30C52.268 30 46 36.268 46 44C46 51.732 52.268 58 60 58Z" fill="#94A3B8"/><path d="M94 92C94 76.536 78.225 66 60 66C41.775 66 26 76.536 26 92" stroke="#94A3B8" stroke-width="8" stroke-linecap="round"/></svg>`
  );

export function createProfileEditor(rootEl, { showExport = true } = {}) {
  rootEl.innerHTML = `
    <div class="profile-editor is-hidden">
      <div class="profile-avatar-block">
        <img class="profile-avatar-img" alt="Avatar" />
        <label class="profile-upload">
          <span class="secondary profile-upload-btn"><i class="fas fa-upload"></i> Chọn ảnh</span>
          <input type="file" class="profile-avatar-input" accept="image/*" />
        </label>
      </div>
      <div class="profile-sections">
        <div class="profile-grid">
          <section class="profile-section" data-section="emergency">
            <h4>Liên hệ khẩn cấp</h4>
            <div class="profile-list" data-list="emergency"></div>
            <button class="secondary profile-add-btn" data-add="emergency">
              <i class="fas fa-plus"></i> Thêm liên hệ
            </button>
          </section>
          <section class="profile-section" data-section="dependents">
            <h4>Người phụ thuộc</h4>
            <div class="profile-list" data-list="dependents"></div>
            <button class="secondary profile-add-btn" data-add="dependents">
              <i class="fas fa-plus"></i> Thêm phụ thuộc
            </button>
          </section>
          <section class="profile-section" data-section="bank">
            <h4>Tài khoản ngân hàng</h4>
            <input data-field="bankName" placeholder="Tên ngân hàng" />
            <input data-field="accountName" placeholder="Chủ tài khoản" />
            <input data-field="accountNumber" placeholder="Số tài khoản" />
          </section>
          <section class="profile-section" data-section="skills">
            <h4>Kỹ năng (phục vụ tìm kiếm)</h4>
            <input data-field="skills" placeholder="VD: JavaScript, HR, Excel" />
          </section>
          <section class="profile-section" data-section="education">
            <h4>Học vấn / Chứng chỉ</h4>
            <div class="profile-list" data-list="education"></div>
            <button class="secondary profile-add-btn" data-add="education">
              <i class="fas fa-plus"></i> Thêm
            </button>
          </section>
          <section class="profile-section" data-section="promotions">
            <h4>Lịch sử công tác / Thăng tiến</h4>
            <div class="profile-list" data-list="promotions"></div>
            <button class="secondary profile-add-btn" data-add="promotions">
              <i class="fas fa-plus"></i> Thêm
            </button>
          </section>
          <section class="profile-section" data-section="custom">
            <h4>Custom fields</h4>
            <div class="profile-list" data-list="customFields"></div>
            <button class="secondary profile-add-btn" data-add="customFields">
              <i class="fas fa-plus"></i> Thêm trường
            </button>
          </section>
        </div>
        <div class="profile-actions">
          <button class="secondary profile-export-btn"><i class="fas fa-file-pdf"></i> Xuất PDF</button>
          <button class="primary profile-save-btn"><i class="fas fa-save"></i> Lưu hồ sơ</button>
        </div>
      </div>
    </div>
  `;

  const editorEl = rootEl.querySelector(".profile-editor");
  const avatarImg = editorEl.querySelector(".profile-avatar-img");
  const avatarInput = editorEl.querySelector(".profile-avatar-input");
  const bankNameInput = editorEl.querySelector('[data-field="bankName"]');
  const bankAccountNameInput = editorEl.querySelector('[data-field="accountName"]');
  const bankAccountNumberInput = editorEl.querySelector('[data-field="accountNumber"]');
  const skillsInput = editorEl.querySelector('[data-field="skills"]');
  const saveBtn = editorEl.querySelector(".profile-save-btn");
  const exportBtn = editorEl.querySelector(".profile-export-btn");

  if (!showExport) {
    exportBtn.classList.add("is-hidden");
  }

  const listContainers = {
    emergencyContacts: editorEl.querySelector('[data-list="emergency"]'),
    dependents: editorEl.querySelector('[data-list="dependents"]'),
    education: editorEl.querySelector('[data-list="education"]'),
    promotions: editorEl.querySelector('[data-list="promotions"]'),
    customFields: editorEl.querySelector('[data-list="customFields"]'),
  };

  const state = {
    employee: null,
    profile: normalizeProfile({}),
  };

  const handlers = {
    onSave: () => {},
    onExport: () => {},
  };

  const fieldSchemas = {
    emergencyContacts: [
      { key: "name", placeholder: "Họ tên" },
      { key: "relation", placeholder: "Quan hệ" },
      { key: "phone", placeholder: "Số điện thoại" },
    ],
    dependents: [
      { key: "name", placeholder: "Họ tên" },
      { key: "relation", placeholder: "Quan hệ" },
      { key: "dob", placeholder: "Ngày sinh (YYYY-MM-DD)" },
    ],
    education: [
      { key: "title", placeholder: "Bằng cấp/Chứng chỉ" },
      { key: "school", placeholder: "Tổ chức cấp" },
      { key: "year", placeholder: "Năm" },
    ],
    promotions: [
      { key: "title", placeholder: "Chức danh" },
      { key: "date", placeholder: "Ngày (YYYY-MM-DD)" },
      { key: "note", placeholder: "Ghi chú" },
    ],
    customFields: [
      { key: "key", placeholder: "Tên trường (VD: size_ao)" },
      { key: "value", placeholder: "Giá trị (VD: M)" },
    ],
  };

  function renderList(arrName) {
    const container = listContainers[arrName];
    if (!container) return;
    const inputs = editorEl.querySelectorAll(`.profile-list[data-list="${arrName}"] input`);
    inputs.forEach((input) => input.removeEventListener("input", input._listener));
    container.innerHTML = "";
    const arr = state.profile[arrName];
    arr.forEach((item, idx) => {
      const itemEl = document.createElement("div");
      itemEl.className = "profile-list-item";

      fieldSchemas[arrName].forEach((field) => {
        const input = document.createElement("input");
        input.placeholder = field.placeholder;
        input.value = item[field.key] || "";
        const listener = () => {
          arr[idx][field.key] = input.value;
        };
        input._listener = listener;
        input.addEventListener("input", listener);
        itemEl.appendChild(input);
      });

      const actions = document.createElement("div");
      actions.className = "profile-list-item-actions";
      const removeBtn = document.createElement("button");
      removeBtn.className = "danger";
      removeBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa';
      removeBtn.addEventListener("click", () => {
        arr.splice(idx, 1);
        renderList(arrName);
      });
      actions.appendChild(removeBtn);
      itemEl.appendChild(actions);
      container.appendChild(itemEl);
    });
  }

  function renderProfile() {
    const profile = state.profile;
    avatarImg.src = profile.avatar || DEFAULT_AVATAR;
    bankNameInput.value = profile.bank.bankName || "";
    bankAccountNameInput.value = profile.bank.accountName || "";
    bankAccountNumberInput.value = profile.bank.accountNumber || "";
    skillsInput.value = profile.skills || "";
    renderList("emergencyContacts");
    renderList("dependents");
    renderList("education");
    renderList("promotions");
    renderList("customFields");
  }

  editorEl
    .querySelectorAll(".profile-add-btn")
    .forEach((btn) =>
      btn.addEventListener("click", () => {
        const arrName = btn.getAttribute("data-add");
        switch (arrName) {
          case "emergency":
          case "emergencyContacts":
            state.profile.emergencyContacts.push({ name: "", phone: "", relation: "" });
            renderList("emergencyContacts");
            break;
          case "dependents":
            state.profile.dependents.push({ name: "", relation: "", dob: "" });
            renderList("dependents");
            break;
          case "education":
            state.profile.education.push({ title: "", school: "", year: "" });
            renderList("education");
            break;
          case "promotions":
            state.profile.promotions.push({ title: "", date: "", note: "" });
            renderList("promotions");
            break;
          case "customFields":
            state.profile.customFields.push({ key: "", value: "" });
            renderList("customFields");
            break;
          default:
            break;
        }
      })
    );

  avatarInput.addEventListener("change", async () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    state.profile.avatar = base64;
    avatarImg.src = base64;
  });

  bankNameInput.addEventListener("input", () => {
    state.profile.bank.bankName = bankNameInput.value;
  });
  bankAccountNameInput.addEventListener("input", () => {
    state.profile.bank.accountName = bankAccountNameInput.value;
  });
  bankAccountNumberInput.addEventListener("input", () => {
    state.profile.bank.accountNumber = bankAccountNumberInput.value;
  });
  skillsInput.addEventListener("input", () => {
    state.profile.skills = skillsInput.value;
  });

  saveBtn.addEventListener("click", async () => {
    await Promise.resolve(handlers.onSave(state.employee, getProfile()));
  });
  exportBtn.addEventListener("click", async () => {
    await Promise.resolve(handlers.onExport(state.employee, getPrintableHtml()));
  });

  function getProfile() {
    return normalizeProfile({
      ...state.profile,
      bank: {
        bankName: bankNameInput.value.trim(),
        accountName: bankAccountNameInput.value.trim(),
        accountNumber: bankAccountNumberInput.value.trim(),
      },
      skills: skillsInput.value.trim(),
    });
  }

  function getPrintableHtml() {
    const profile = getProfile();
    const employee = state.employee || {};
    return `
      <html><head><title>Hồ sơ #${escapeHTML(String(employee.id || ""))}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        h1 { margin: 0 0 12px 0; }
        .row { display: flex; gap: 16px; margin-bottom: 16px; align-items:center; }
        img { width: 100px; height: 100px; object-fit: cover; border-radius: 999px; border: 1px solid #ddd; }
        .card { border:1px solid #ddd; border-radius:8px; padding:12px; margin:8px 0; }
        table { width:100%; border-collapse: collapse; }
        td, th { border:1px solid #ddd; padding:8px; text-align:left; }
      </style>
      </head><body>
        <h1>Hồ sơ nhân viên #${escapeHTML(String(employee.id || ""))} - ${escapeHTML(employee.name || "")}</h1>
        <div class="row">
          <img src="${profile.avatar || DEFAULT_AVATAR}" alt="avatar" />
          <div>
            <div><strong>Phòng ban:</strong> ${escapeHTML(employee.departmentName || "")}</div>
            <div><strong>Vị trí:</strong> ${escapeHTML(employee.positionTitle || "")}</div>
            <div><strong>Kỹ năng:</strong> ${escapeHTML(profile.skills || "")}</div>
          </div>
        </div>
        <div class="card">
          <h3>Ngân hàng</h3>
          <div><strong>Ngân hàng:</strong> ${escapeHTML(profile.bank.bankName)}</div>
          <div><strong>Chủ TK:</strong> ${escapeHTML(profile.bank.accountName)}</div>
          <div><strong>Số TK:</strong> ${escapeHTML(profile.bank.accountNumber)}</div>
        </div>
        ${renderTableSection("Liên hệ khẩn cấp", profile.emergencyContacts, ["name", "relation", "phone"])}
        ${renderTableSection("Người phụ thuộc", profile.dependents, ["name", "relation", "dob"])}
        ${renderTableSection("Học vấn / Chứng chỉ", profile.education, ["title", "school", "year"])}
        ${renderTableSection("Lịch sử công tác / Thăng tiến", profile.promotions, ["title", "date", "note"])}
        ${renderTableSection("Custom fields", profile.customFields, ["key", "value"])}
      <script>window.onload = () => window.print();</script>
      </body></html>
    `;
  }

  function renderTableSection(title, rows, keys) {
    if (!rows?.length) return "";
    const header = keys
      .map((key) => `<th>${escapeHTML(key.toUpperCase())}</th>`)
      .join("");
    const body = rows
      .map(
        (row) =>
          `<tr>${keys.map((key) => `<td>${escapeHTML(row[key] || "")}</td>`).join("")}</tr>`
      )
      .join("");
    return `
      <div class="card">
        <h3>${escapeHTML(title)}</h3>
        <table>
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  return {
    root: editorEl,
    setEmployee(employee, profileData) {
      state.employee = employee;
      state.profile = normalizeProfile(profileData);
      rootEl.classList.remove("is-hidden");
      editorEl.classList.remove("is-hidden");
      renderProfile();
    },
    clear() {
      rootEl.classList.add("is-hidden");
      editorEl.classList.add("is-hidden");
      state.employee = null;
      state.profile = normalizeProfile({});
    },
    getProfile,
    onSave(callback) {
      handlers.onSave = callback;
    },
    onExport(callback) {
      handlers.onExport = callback;
    },
  };
}

