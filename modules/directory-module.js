import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML } from "../utils/dom.js";
import { safeJSONParse } from "../utils/storage.js";

const PROFILE_KEY = (id) => `hrm_profile_${id}`;

export const DirectoryModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Danh bạ nhân viên";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
        <input id="q" placeholder="Tìm theo tên, kỹ năng, vị trí, phòng ban..." style="flex:1;" />
        <button id="search" class="secondary"><i class="fas fa-search"></i></button>
      </div>
      <div id="dirList" class="card" style="margin:0;"></div>
    `;
    viewEl.appendChild(wrap);

    const employees = await EmployeeDb.getAllEmployees();
    const positions = await EmployeeDb.getAllPositions();
    const departments = await EmployeeDb.getAllDepartments();
    const byPos = Object.fromEntries(positions.map((p) => [p.id, p.title]));
    const byDept = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const listEl = wrap.querySelector("#dirList");
    const qEl = wrap.querySelector("#q");
    const searchBtn = wrap.querySelector("#search");

    function getProfile(id) {
      return safeJSONParse(localStorage.getItem(PROFILE_KEY(id)), {});
    }

    function render(items) {
      if (items.length === 0) {
        listEl.innerHTML = `<div class="muted">Không tìm thấy nhân viên phù hợp.</div>`;
        return;
      }
      listEl.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap:12px;">
          ${items
            .map((e) => {
              const p = getProfile(e.id);
              const pos = byPos[e.positionId] || "-";
              const dept = byDept[e.departmentId] || "-";
              return `
                <div class="card" style="margin:0; padding:16px;">
                  <div style="display:flex; gap:12px; align-items:center;">
                    <img src="${p.avatar || ""}" alt="" style="width:56px; height:56px; object-fit:cover; border-radius:999px; border:1px solid var(--border);" />
                    <div>
                      <div><span class="id-badge">#${e.id}</span> <strong>${escapeHTML(e.name || "")}</strong></div>
                      <div class="muted" style="font-size:13px;">${escapeHTML(pos)} • ${escapeHTML(dept)}</div>
                      <div class="muted" style="font-size:12px; margin-top:4px;">${escapeHTML(p.skills || "")}</div>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function applySearch() {
      const q = (qEl.value || "").toLowerCase().trim();
      if (!q) {
        render(employees);
        return;
      }
      const filtered = employees.filter((e) => {
        const p = getProfile(e.id);
        const pos = (byPos[e.positionId] || "").toLowerCase();
        const dept = (byDept[e.departmentId] || "").toLowerCase();
        const name = (e.name || "").toLowerCase();
        const skills = (p.skills || "").toLowerCase();
        return (
          name.includes(q) ||
          skills.includes(q) ||
          pos.includes(q) ||
          dept.includes(q)
        );
      });
      render(filtered);
    }

    render(employees);
    searchBtn.addEventListener("click", applySearch);
    qEl.addEventListener("keypress", (e) => {
      if (e.key === "Enter") applySearch();
    });
  },
};


