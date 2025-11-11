import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML, showToast } from "../utils/dom.js";
import { createProfileEditor } from "./profile-editor.js";
import { loadProfile, saveProfile } from "./profile-store.js";

export const CoreHrModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Hồ sơ nhân viên (Core HR)";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <h3 class="card-title">Quản lý Hồ sơ</h3>
      <div class="profile-toolbar">
        <select id="coreEmployee"></select>
      </div>
      <div id="coreEditorWrapper" class="profile-editor-card card is-hidden"></div>
    `;
    viewEl.appendChild(wrap);

    // Elements
    const employeeSelect = wrap.querySelector("#coreEmployee");
    const editorWrapper = wrap.querySelector("#coreEditorWrapper");
    const editor = createProfileEditor(editorWrapper, { showExport: true });

    // Load employees + mapping
    const [employees, positions, departments] = await Promise.all([
      EmployeeDb.getAllEmployees(),
      EmployeeDb.getAllPositions(),
      EmployeeDb.getAllDepartments(),
    ]);
    const positionById = Object.fromEntries(positions.map((p) => [p.id, p.title]));
    const departmentById = Object.fromEntries(departments.map((d) => [d.id, d.name]));
    employeeSelect.innerHTML =
      `<option value="">-- Chọn nhân viên --</option>` +
      employees
        .map((e) => `<option value="${e.id}">#${e.id} - ${escapeHTML(e.name || "")}</option>`)
        .join("");

    let currentEmployee = null;

    employeeSelect.addEventListener("change", async () => {
      const id = Number(employeeSelect.value);
      if (!id) {
        currentEmployee = null;
        editor.clear();
        return;
      }
      const employee = employees.find((e) => e.id === id);
      currentEmployee = employee || null;
      const profile = await loadProfile(id);
      editor.setEmployee(
        {
          ...employee,
          departmentName: departmentById[employee?.departmentId] || "-",
          positionTitle: positionById[employee?.positionId] || "-",
        },
        profile
      );
    });

    editor.onSave(async (employee, profile) => {
      if (!employee) return;
      try {
        await saveProfile(employee.id, profile);
        showToast("Đã lưu hồ sơ.", "success");
      } catch (error) {
        showToast(error.message || "Không thể lưu hồ sơ. Vui lòng thử lại.", "error");
      }
    });

    editor.onExport((employee, html) => {
      if (!employee) return;
      const doc = window.open("", "_blank");
      doc.document.write(html);
      doc.document.close();
    });
  },
};


