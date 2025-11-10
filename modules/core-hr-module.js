import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML } from "../utils/dom.js";
import { safeJSONParse } from "../utils/storage.js";

// Lưu hồ sơ mở rộng tại localStorage theo key: hrm_profile_{employeeId}
const PROFILE_KEY = (id) => `hrm_profile_${id}`;

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadProfile(employeeId) {
  return safeJSONParse(localStorage.getItem(PROFILE_KEY(employeeId)), {
    avatar: "",
    emergencyContacts: [],
    dependents: [],
    bank: { bankName: "", accountNumber: "", accountName: "" },
    education: [],
    promotions: [],
    customFields: [], // [{key, value}]
    skills: "", // hỗ trợ tìm kiếm directory
  });
}

function saveProfile(employeeId, profile) {
  localStorage.setItem(PROFILE_KEY(employeeId), JSON.stringify(profile));
}

export const CoreHrModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Hồ sơ nhân viên (Core HR)";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <h3 style="margin-top:0;">Quản lý Hồ sơ</h3>
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
        <select id="coreEmployee" style="min-width:280px;"></select>
        <button id="coreExport" class="secondary" title="Xuất PDF"><i class="fas fa-file-pdf"></i> Xuất PDF</button>
      </div>

      <div id="coreBody" class="card" style="margin:0;">
        <div style="display:flex; gap:16px; align-items:flex-start;">
          <div style="width:140px; text-align:center;">
            <img id="coreAvatarPreview" src="" alt="avatar" style="width:120px; height:120px; object-fit:cover; border-radius:999px; border:1px solid var(--border); background:#f3f4f6;" />
            <div style="margin-top:8px;">
              <input type="file" id="coreAvatar" accept="image/*" />
            </div>
          </div>
          <div style="flex:1;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div class="card" style="margin:0;">
                <h4 style="margin-top:0;">Liên hệ khẩn cấp</h4>
                <div id="coreEmergency"></div>
                <button id="addEmergency" class="secondary"><i class="fas fa-plus"></i> Thêm liên hệ</button>
              </div>
              <div class="card" style="margin:0;">
                <h4 style="margin-top:0;">Người phụ thuộc</h4>
                <div id="coreDependents"></div>
                <button id="addDependent" class="secondary"><i class="fas fa-plus"></i> Thêm phụ thuộc</button>
              </div>
              <div class="card" style="margin:0;">
                <h4 style="margin-top:0;">Ngân hàng</h4>
                <div style="display:grid; gap:8px;">
                  <input id="bankName" placeholder="Tên ngân hàng" />
                  <input id="bankAccountName" placeholder="Chủ tài khoản" />
                  <input id="bankAccountNumber" placeholder="Số tài khoản" />
                </div>
              </div>
              <div class="card" style="margin:0;">
                <h4 style="margin-top:0;">Kỹ năng (phục vụ tìm kiếm)</h4>
                <input id="skills" placeholder="VD: JavaScript, HR, Excel" />
              </div>
              <div class="card" style="margin:0;">
                <h4 style="margin-top:0;">Học vấn / Chứng chỉ</h4>
                <div id="coreEducation"></div>
                <button id="addEducation" class="secondary"><i class="fas fa-plus"></i> Thêm</button>
              </div>
              <div class="card" style="margin:0;">
                <h4 style="margin-top:0;">Lịch sử công tác / Thăng tiến</h4>
                <div id="corePromotions"></div>
                <button id="addPromotion" class="secondary"><i class="fas fa-plus"></i> Thêm</button>
              </div>
              <div class="card" style="margin:0;">
                <h4 style="margin-top:0;">Custom fields</h4>
                <div id="coreCustom"></div>
                <button id="addCustom" class="secondary"><i class="fas fa-plus"></i> Thêm trường</button>
              </div>
            </div>
            <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
              <button id="saveProfile" class="primary"><i class="fas fa-save"></i> Lưu hồ sơ</button>
            </div>
          </div>
        </div>
      </div>
    `;
    viewEl.appendChild(wrap);

    // Elements
    const employeeSelect = wrap.querySelector("#coreEmployee");
    const avatarInput = wrap.querySelector("#coreAvatar");
    const avatarPreview = wrap.querySelector("#coreAvatarPreview");
    const saveBtn = wrap.querySelector("#saveProfile");
    const exportBtn = wrap.querySelector("#coreExport");
    const skillsInput = wrap.querySelector("#skills");
    const bankName = wrap.querySelector("#bankName");
    const bankAccName = wrap.querySelector("#bankAccountName");
    const bankAccNumber = wrap.querySelector("#bankAccountNumber");

    const emergencyWrap = wrap.querySelector("#coreEmergency");
    const dependentsWrap = wrap.querySelector("#coreDependents");
    const educationWrap = wrap.querySelector("#coreEducation");
    const promotionsWrap = wrap.querySelector("#corePromotions");
    const customWrap = wrap.querySelector("#coreCustom");

    // Load employees
    const employees = await EmployeeDb.getAllEmployees();
    employeeSelect.innerHTML =
      `<option value="">-- Chọn nhân viên --</option>` +
      employees
        .map((e) => `<option value="${e.id}">#${e.id} - ${escapeHTML(e.name || "")}</option>`)
        .join("");

    function renderList(container, items, fields) {
      container.innerHTML = items
        .map(
          (it, idx) => `
        <div class="card" style="padding:12px; margin: 0 0 8px 0;">
          ${fields
            .map(
              (f) =>
                `<input data-idx="${idx}" data-key="${f.key}" placeholder="${f.placeholder}" value="${escapeHTML(
                  it[f.key] || ""
                )}" />`
            )
            .join("")}
          <div style="margin-top:6px; text-align:right;">
            <button class="danger" data-idx="${idx}" data-action="remove"><i class="fas fa-trash"></i> Xóa</button>
          </div>
        </div>`
        )
        .join("");
    }

    function bindList(container, items) {
      container.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("input", () => {
          const idx = Number(inp.getAttribute("data-idx"));
          const key = inp.getAttribute("data-key");
          items[idx][key] = inp.value;
        });
      });
      container.querySelectorAll("button[data-action='remove']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-idx"));
          items.splice(idx, 1);
          rerender();
        });
      });
    }

    let currentEmployeeId = null;
    let profile = null;

    function rerender() {
      if (!profile) return;
      avatarPreview.src = profile.avatar || "";
      skillsInput.value = profile.skills || "";
      bankName.value = profile.bank?.bankName || "";
      bankAccName.value = profile.bank?.accountName || "";
      bankAccNumber.value = profile.bank?.accountNumber || "";

      renderList(emergencyWrap, profile.emergencyContacts, [
        { key: "name", placeholder: "Họ tên" },
        { key: "phone", placeholder: "Số điện thoại" },
        { key: "relation", placeholder: "Quan hệ" },
      ]);
      bindList(emergencyWrap, profile.emergencyContacts);

      renderList(dependentsWrap, profile.dependents, [
        { key: "name", placeholder: "Họ tên" },
        { key: "relation", placeholder: "Quan hệ" },
        { key: "dob", placeholder: "Ngày sinh (YYYY-MM-DD)" },
      ]);
      bindList(dependentsWrap, profile.dependents);

      renderList(educationWrap, profile.education, [
        { key: "title", placeholder: "Bằng cấp/Chứng chỉ" },
        { key: "school", placeholder: "Tổ chức cấp" },
        { key: "year", placeholder: "Năm" },
      ]);
      bindList(educationWrap, profile.education);

      renderList(promotionsWrap, profile.promotions, [
        { key: "title", placeholder: "Chức danh" },
        { key: "date", placeholder: "Ngày (YYYY-MM-DD)" },
        { key: "note", placeholder: "Ghi chú" },
      ]);
      bindList(promotionsWrap, profile.promotions);

      renderList(customWrap, profile.customFields, [
        { key: "key", placeholder: "Tên trường (VD: size_ao)" },
        { key: "value", placeholder: "Giá trị (VD: M)" },
      ]);
      bindList(customWrap, profile.customFields);
    }

    employeeSelect.addEventListener("change", () => {
      currentEmployeeId = Number(employeeSelect.value);
      if (!currentEmployeeId) {
        profile = null;
        wrap.querySelector("#coreBody").style.display = "none";
        return;
      }
      profile = loadProfile(currentEmployeeId);
      wrap.querySelector("#coreBody").style.display = "block";
      rerender();
    });

    wrap.querySelector("#addEmergency").addEventListener("click", () => {
      if (!profile) return;
      profile.emergencyContacts.push({ name: "", phone: "", relation: "" });
      rerender();
    });
    wrap.querySelector("#addDependent").addEventListener("click", () => {
      if (!profile) return;
      profile.dependents.push({ name: "", relation: "", dob: "" });
      rerender();
    });
    wrap.querySelector("#addEducation").addEventListener("click", () => {
      if (!profile) return;
      profile.education.push({ title: "", school: "", year: "" });
      rerender();
    });
    wrap.querySelector("#addPromotion").addEventListener("click", () => {
      if (!profile) return;
      profile.promotions.push({ title: "", date: "", note: "" });
      rerender();
    });
    wrap.querySelector("#addCustom").addEventListener("click", () => {
      if (!profile) return;
      profile.customFields.push({ key: "", value: "" });
      rerender();
    });

    avatarInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file || !profile) return;
      const base64 = await fileToBase64(file);
      profile.avatar = base64;
      avatarPreview.src = base64;
    });

    saveBtn.addEventListener("click", () => {
      if (!currentEmployeeId || !profile) return;
      profile.skills = skillsInput.value.trim();
      profile.bank = {
        bankName: bankName.value.trim(),
        accountName: bankAccName.value.trim(),
        accountNumber: bankAccNumber.value.trim(),
      };
      saveProfile(currentEmployeeId, profile);
      alert("Đã lưu hồ sơ.");
    });

    exportBtn.addEventListener("click", () => {
      if (!currentEmployeeId || !profile) return;
      const emp = employees.find((e) => e.id === currentEmployeeId) || {};
      const html = `
        <html><head><title>Hồ sơ #${emp.id} - ${escapeHTML(emp.name || "")}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { margin: 0 0 12px 0; }
          .row { display: flex; gap: 16px; }
          .card { border:1px solid #ddd; border-radius:8px; padding:12px; margin:8px 0; }
          img { width:100px; height:100px; object-fit:cover; border-radius:999px; border:1px solid #ddd; }
          table { width:100%; border-collapse: collapse; }
          td, th { border:1px solid #ddd; padding:8px; text-align:left; }
        </style>
        </head><body>
        <h1>Hồ sơ nhân viên #${emp.id} - ${escapeHTML(emp.name || "")}</h1>
        <div class="row">
          <div><img src="${profile.avatar || ""}" /></div>
          <div>
            <div><strong>Phòng ban:</strong> ${escapeHTML(String(emp.departmentId || "-"))}</div>
            <div><strong>Vị trí:</strong> ${escapeHTML(String(emp.positionId || "-"))}</div>
            <div><strong>Kỹ năng:</strong> ${escapeHTML(profile.skills || "")}</div>
          </div>
        </div>
        <div class="card">
          <h3>Ngân hàng</h3>
          <div><strong>Ngân hàng: </strong>${escapeHTML(profile.bank?.bankName || "")}</div>
          <div><strong>Chủ TK: </strong>${escapeHTML(profile.bank?.accountName || "")}</div>
          <div><strong>Số TK: </strong>${escapeHTML(profile.bank?.accountNumber || "")}</div>
        </div>
        <div class="card"><h3>Liên hệ khẩn cấp</h3>
          <table><thead><tr><th>Tên</th><th>Quan hệ</th><th>Điện thoại</th></tr></thead>
          <tbody>
            ${(profile.emergencyContacts || [])
              .map(
                (c) =>
                  `<tr><td>${escapeHTML(c.name || "")}</td><td>${escapeHTML(
                    c.relation || ""
                  )}</td><td>${escapeHTML(c.phone || "")}</td></tr>`
              )
              .join("")}
          </tbody></table>
        </div>
        <div class="card"><h3>Người phụ thuộc</h3>
          <table><thead><tr><th>Tên</th><th>Quan hệ</th><th>Ngày sinh</th></tr></thead>
          <tbody>
            ${(profile.dependents || [])
              .map(
                (d) =>
                  `<tr><td>${escapeHTML(d.name || "")}</td><td>${escapeHTML(
                    d.relation || ""
                  )}</td><td>${escapeHTML(d.dob || "")}</td></tr>`
              )
              .join("")}
          </tbody></table>
        </div>
        <div class="card"><h3>Học vấn / Chứng chỉ</h3>
          <table><thead><tr><th>Danh hiệu</th><th>Tổ chức</th><th>Năm</th></tr></thead>
          <tbody>
            ${(profile.education || [])
              .map(
                (d) =>
                  `<tr><td>${escapeHTML(d.title || "")}</td><td>${escapeHTML(
                    d.school || ""
                  )}</td><td>${escapeHTML(d.year || "")}</td></tr>`
              )
              .join("")}
          </tbody></table>
        </div>
        <div class="card"><h3>Lịch sử công tác / Thăng tiến</h3>
          <table><thead><tr><th>Chức danh</th><th>Ngày</th><th>Ghi chú</th></tr></thead>
          <tbody>
            ${(profile.promotions || [])
              .map(
                (p) =>
                  `<tr><td>${escapeHTML(p.title || "")}</td><td>${escapeHTML(
                    p.date || ""
                  )}</td><td>${escapeHTML(p.note || "")}</td></tr>`
              )
              .join("")}
          </tbody></table>
        </div>
        <div class="card"><h3>Custom fields</h3>
          <table><thead><tr><th>Trường</th><th>Giá trị</th></tr></thead>
          <tbody>
            ${(profile.customFields || [])
              .map(
                (c) =>
                  `<tr><td>${escapeHTML(c.key || "")}</td><td>${escapeHTML(
                    c.value || ""
                  )}</td></tr>`
              )
              .join("")}
          </tbody></table>
        </div>
        <script>window.onload = () => window.print();</script>
        </body></html>`;
      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
    });
  },
};


