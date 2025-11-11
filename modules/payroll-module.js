import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML, formatVND } from "../utils/dom.js";
import { loadProfiles } from "./profile-store.js";

// Constants cho tính toán bảo hiểm và thuế (theo quy định VN - demo)
const FAMILY_DEDUCTION = 11000000; // Giảm trừ gia cảnh: 11 triệu VNĐ
const BHXH_RATE = 0.08; // 8% BHXH
const BHYT_RATE = 0.015; // 1.5% BHYT
const BHTN_RATE = 0.01; // 1% BHTN
const PIT_RATE_BRACKET_1 = 0.05; // Thuế TNCN bậc 1: 5% (demo, chỉ dùng bậc 1)
const DEPENDENT_DEDUCTION = 4400000; // Giảm trừ người phụ thuộc (demo) 4.4 triệu/người

/**
 * Tính toán các khoản khấu trừ (BHXH, BHYT, BHTN, Thuế TNCN)
 * @param {number} baseSalary - Lương cơ bản
 * @returns {Object} Các khoản khấu trừ
 */
function computeDeductions(baseSalary, numDependents = 0) {
  const BHXH = Math.round(baseSalary * BHXH_RATE);
  const BHYT = Math.round(baseSalary * BHYT_RATE);
  const BHTN = Math.round(baseSalary * BHTN_RATE);
  const insuranceTotal = BHXH + BHYT + BHTN;
  
  // Thu nhập chịu thuế = Lương - Giảm trừ gia cảnh (bản thân + phụ thuộc) - Bảo hiểm
  const dependentTotal = Math.max(0, numDependents) * DEPENDENT_DEDUCTION;
  const taxableIncome = Math.max(baseSalary - FAMILY_DEDUCTION - dependentTotal - insuranceTotal, 0);
  
  // Thuế TNCN bậc 1 (demo, chỉ tính bậc 1)
  const PIT = Math.round(taxableIncome * PIT_RATE_BRACKET_1);
  
  return { BHXH, BHYT, BHTN, insuranceTotal, PIT, dependentTotal };
}

export const PayrollModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Bảng lương chi tiết (Payroll)";
    viewEl.innerHTML = "";
    const container = document.createElement("div");
    container.className = "card";
    container.innerHTML = `
      <h3>Phiếu lương (payslip) • Demo</h3>
      <p class="muted" style="font-size: 12px; margin-bottom: 12px;">
        Lưu ý: Công thức tính toán này chỉ mang tính chất demo. 
        Trong hệ thống thực tế, cần tuân thủ đúng quy định về thuế và bảo hiểm của Việt Nam.
      </p>
      <div id="payslip"></div>
    `;
    viewEl.appendChild(container);

    const employees = await EmployeeDb.getAllEmployees();
    const ids = employees.map((e) => e.id);
    const profileMap = await loadProfiles(ids);
    const rows = employees.map((e) => {
      const profile = profileMap.get(Number(e.id)) || {};
      const numDependents = Array.isArray(profile.dependents) ? profile.dependents.length : 0;
      const base = Number(e.salary || 0);
      const bonus = Number(e.bonus || 0);
      const penalty = Number(e.deduction || 0);
      const ded = computeDeductions(base, numDependents);
      const gross = base + bonus;
      const totalDeduction = penalty + ded.insuranceTotal + ded.PIT;
      const net = gross - totalDeduction;
      return {
        id: e.id,
        name: e.name,
        base,
        bonus,
        penalty,
        ...ded,
        gross,
        totalDeduction,
        net,
        numDependents,
      };
    });

    const list = document.createElement("div");
    // Escape tất cả dữ liệu động để chống XSS
    list.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Mã</th><th>Tên</th><th>Cơ bản</th><th>Thưởng</th><th>Phạt</th>
            <th>BHXH</th><th>BHYT</th><th>BHTN</th><th>Thuế TNCN</th>
            <th>Phụ thuộc</th><th>Giảm trừ phụ thuộc</th>
            <th>Gross</th><th>Khấu trừ</th><th>Thực lĩnh</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
              <tr>
                <td>#${escapeHTML(String(r.id || ""))}</td>
                <td>${escapeHTML(r.name || "")}</td>
                <td>${formatVND(r.base)}</td>
                <td>${formatVND(r.bonus)}</td>
                <td>${formatVND(r.penalty)}</td>
                <td>${formatVND(r.BHXH)}</td>
                <td>${formatVND(r.BHYT)}</td>
                <td>${formatVND(r.BHTN)}</td>
                <td>${formatVND(r.PIT)}</td>
                <td>${r.numDependents}</td>
                <td>${formatVND(r.dependentTotal)}</td>
                <td>${formatVND(r.gross)}</td>
                <td>${formatVND(r.totalDeduction)}</td>
                <td><strong class="amount-positive">${formatVND(r.net)}</strong></td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;
    container.querySelector("#payslip").appendChild(list);
    // Không escape cell string vì đã tự escape tên và chỉ render số/formatVND
    // (Bảng này không dùng renderTable helper)
  },
};
