import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML } from "../utils/dom.js";

/**
 * Tính toán KPIs (Key Performance Indicators) từ danh sách nhân viên
 * @param {Array} employees - Danh sách nhân viên
 * @returns {Object} KPIs đã tính toán
 */
function computeKpis(employees) {
  const byDept = {};
  for (const e of employees) {
    const key = e.departmentId || "unknown";
    byDept[key] = (byDept[key] || 0) + 1;
  }
  const total = employees.length || 1;
  const deptShare = Object.entries(byDept).map(([dept, count]) => ({
    dept,
    count,
    percent: Math.round((count / total) * 100),
  }));
  return { deptShare };
}

export const ReportsModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Báo cáo & Phân tích";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <h3>Trình tạo báo cáo (đơn giản)</h3>
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <select id="reportType">
          <option value="dept">Phân bố nhân sự theo phòng ban</option>
          <option value="salary">Chi phí lương theo nhân viên</option>
        </select>
        <button id="runReport" class="primary"><i class="fas fa-play"></i> Chạy báo cáo</button>
      </div>
      <div id="reportResult"></div>
    `;
    viewEl.appendChild(wrap);

    const employees = await EmployeeDb.getAllEmployees();
    const resultEl = wrap.querySelector("#reportResult");
    
    const run = () => {
      const type = wrap.querySelector("#reportType").value;
      
      if (type === "dept") {
        const kpis = computeKpis(employees);
        // Escape tất cả dữ liệu động
        resultEl.innerHTML = `
          <table class="table">
            <thead><tr><th>Phòng ban</th><th>Số NV</th><th>Tỷ trọng</th></tr></thead>
            <tbody>
              ${kpis.deptShare
                .map(
                  (r) =>
                    `<tr>
                      <td>${escapeHTML(String(r.dept))}</td>
                      <td>${r.count}</td>
                      <td>${r.percent}%</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      } else {
        const rows = employees.map((e) => ({
          name: e.name,
          total: (Number(e.salary || 0) + Number(e.bonus || 0) - Number(e.deduction || 0)),
        }));
        // Escape tất cả dữ liệu động
        resultEl.innerHTML = `
          <table class="table">
            <thead><tr><th>Nhân viên</th><th>Chi phí ước tính</th></tr></thead>
            <tbody>
              ${rows
                .map(
                  (r) =>
                    `<tr>
                      <td>${escapeHTML(r.name || "")}</td>
                      <td>${r.total.toLocaleString()} VNĐ</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
    };
    
    wrap.querySelector("#runReport").addEventListener("click", run);
    run();
  },
};
