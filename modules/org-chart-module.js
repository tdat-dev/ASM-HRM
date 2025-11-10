import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML } from "../utils/dom.js";

export const OrgChartModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Sơ đồ tổ chức";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <div class="card" style="margin:0;">
        <h3 style="margin-top:0;">Cây tổ chức theo Phòng ban</h3>
        <div id="tree"></div>
      </div>
    `;
    viewEl.appendChild(wrap);

    const employees = await EmployeeDb.getAllEmployees();
    const departments = await EmployeeDb.getAllDepartments();
    const positions = await EmployeeDb.getAllPositions();
    const byDept = Object.fromEntries(departments.map((d) => [d.id, d.name]));
    const byPos = Object.fromEntries(positions.map((p) => [p.id, p.title]));

    // group by department
    const groups = {};
    for (const e of employees) {
      const key = e.departmentId || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }

    const treeEl = wrap.querySelector("#tree");
    treeEl.innerHTML = `
      <ul style="list-style:none; padding-left:0;">
        ${Object.entries(groups)
          .map(([deptId, emps]) => {
            const deptName = byDept[deptId] || "Chưa phân phòng ban";
            return `
              <li style="margin-bottom:12px;">
                <div class="chip">${escapeHTML(deptName)}</div>
                <ul style="list-style:none; padding-left:16px; margin-top:8px;">
                  ${emps
                    .map(
                      (e) => `
                        <li style="margin:6px 0;">
                          <span class="id-badge">#${e.id}</span>
                          <strong> ${escapeHTML(e.name || "")}</strong>
                          <span class="muted" style="font-size:12px;">• ${escapeHTML(
                            byPos[e.positionId] || "-"
                          )}</span>
                        </li>
                      `
                    )
                    .join("")}
                </ul>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  },
};


