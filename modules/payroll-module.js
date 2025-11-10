import { EmployeeDb } from "./employee-db-module.js";

// Demo: công thức đơn giản cho thuế & bảo hiểm (giả lập)
function computeDeductions(baseSalary) {
  const BHXH = Math.round(baseSalary * 0.08);
  const BHYT = Math.round(baseSalary * 0.015);
  const BHTN = Math.round(baseSalary * 0.01);
  const insuranceTotal = BHXH + BHYT + BHTN;
  const taxableIncome = Math.max(baseSalary - 11000000 - insuranceTotal, 0); // giảm trừ gia cảnh 11tr
  const PIT = Math.round(taxableIncome * 0.05); // bậc 1 5% (demo)
  return { BHXH, BHYT, BHTN, insuranceTotal, PIT };
}

export const PayrollModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Bảng lương chi tiết (Payroll)";
    viewEl.innerHTML = "";
    const container = document.createElement("div");
    container.className = "card";
    container.innerHTML = `
      <h3>Phiếu lương (payslip) • Demo</h3>
      <div id="payslip"></div>
    `;
    viewEl.appendChild(container);

    const employees = await EmployeeDb.getAllEmployees();
    const rows = employees.map((e) => {
      const base = Number(e.salary || 0);
      const bonus = Number(e.bonus || 0);
      const penalty = Number(e.deduction || 0);
      const ded = computeDeductions(base);
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
      };
    });

    const list = document.createElement("div");
    list.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Mã</th><th>Tên</th><th>Cơ bản</th><th>Thưởng</th><th>Phạt</th>
            <th>BHXH</th><th>BHYT</th><th>BHTN</th><th>Thuế TNCN</th>
            <th>Gross</th><th>Khấu trừ</th><th>Thực lĩnh</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
              <tr>
                <td>#${r.id}</td>
                <td>${r.name}</td>
                <td>${r.base.toLocaleString()}</td>
                <td>${r.bonus.toLocaleString()}</td>
                <td>${r.penalty.toLocaleString()}</td>
                <td>${r.BHXH.toLocaleString()}</td>
                <td>${r.BHYT.toLocaleString()}</td>
                <td>${r.BHTN.toLocaleString()}</td>
                <td>${r.PIT.toLocaleString()}</td>
                <td>${r.gross.toLocaleString()}</td>
                <td>${r.totalDeduction.toLocaleString()}</td>
                <td><strong style="color: var(--success);">${r.net.toLocaleString()}</strong></td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
    `;
    container.querySelector("#payslip").appendChild(list);
  },
};



