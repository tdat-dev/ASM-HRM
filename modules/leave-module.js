import { leaveAPI } from "../utils/api.js";
import { validateEmployeeId, validateDateRange } from "../utils/validators.js";

// Module quản lý nghỉ phép
const DEFAULT_ANNUAL_LEAVE_DAYS = 20; // Số ngày phép mặc định mỗi năm
const LEAVE_TYPE_ANNUAL = "annual";
const LEAVE_TYPE_SICK = "sick";

export const LeaveModule = {
  /**
   * Tạo yêu cầu nghỉ phép mới
   */
  async requestLeave(employeeId, startDate, endDate, leaveType, reason = "") {
    if (!employeeId || !startDate || !endDate) {
      throw new Error("Thiếu dữ liệu");
    }

    const messages = [];
    const { ok, errors } = validateEmployeeId(employeeId);
    if (!ok) {
      messages.push(...errors);
    }
    const { ok: dateOk, errors: dateErrors } = validateDateRange(
      startDate,
      endDate
    );
    if (!dateOk) {
      messages.push(...dateErrors);
    }
    const allowedTypes = [LEAVE_TYPE_ANNUAL, LEAVE_TYPE_SICK];
    if (!allowedTypes.includes(leaveType)) {
      messages.push("Loại nghỉ phép không hợp lệ");
    }
    if (messages.length > 0) {
      throw new Error(messages.join(", "));
    }

    await leaveAPI.create({
      employee_id: employeeId,
      type: leaveType,
      start_date: startDate,
      end_date: endDate,
    });
  },

  /**
   * Duyệt yêu cầu nghỉ phép
   */
  async approveLeave(leaveRequestId) {
    await leaveAPI.approve(leaveRequestId);
  },

  /**
   * Từ chối yêu cầu nghỉ phép
   */
  async rejectLeave(leaveRequestId, reason = "") {
    await leaveAPI.reject(leaveRequestId, reason);
  },

  /**
   * Tính số ngày phép còn lại của nhân viên
   */
  async getLeaveBalance(employeeId) {
    const result = await leaveAPI.getBalance(employeeId);
    return result.balance;
  },

  async mount(viewEl, titleEl) {
    // Render màn hình quản lý nghỉ phép và gắn các event handler liên quan
    titleEl.textContent = "Nghỉ phép";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
			<form id="leaveForm" style="display:grid;gap:8px;max-width:520px;">
				<input id="lvEmp" type="number" placeholder="Employee ID" required />
				<div><label>Từ ngày</label><input id="lvStart" type="date" required /></div>
				<div><label>Đến ngày</label><input id="lvEnd" type="date" required /></div>
				<select id="lvType"><option value="annual">Annual</option><option value="sick">Sick</option></select>
				<button class="primary">Gửi yêu cầu</button>
			</form>
			<div style="margin-top:12px;">
				<h3>Danh sách yêu cầu</h3>
				<table class="table"><thead><tr><th>Emp</th><th>Khoảng</th><th>Loại</th><th>Trạng thái</th><th></th></tr></thead><tbody id="lvBody"></tbody></table>
			</div>
		`;
    viewEl.appendChild(wrap);

    const body = wrap.querySelector("#lvBody");
    // Render lại bảng yêu cầu nghỉ phép hiện thời
    const render = async () => {
      try {
        const result = await leaveAPI.getAll();
        const list = result.data || [];
        body.innerHTML = list
          .map(
            (leave) => `<tr>
				<td>${leave.employee_name || leave.employee_id}</td>
				<td>${leave.start_date} → ${leave.end_date}</td>
				<td>${leave.type || "N/A"}</td>
				<td>${leave.status}</td>
				<td>${
          leave.status === "pending"
            ? `<button data-approve="${leave.id}">Duyệt</button>`
            : ""
        }</td>
			</tr>`
          )
          .join("");
      } catch (error) {
        body.innerHTML = `<tr><td colspan="5" class="alert error">${error.message}</td></tr>`;
      }
    };
    await render();

    wrap.querySelector("#leaveForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = Number(wrap.querySelector("#lvEmp").value);
      const s = wrap.querySelector("#lvStart").value;
      const en = wrap.querySelector("#lvEnd").value;
      const type = wrap.querySelector("#lvType").value;
      try {
        await this.requestLeave(id, s, en, type);
        e.target.reset();
        await render();
      } catch (err) {
        alert(err.message);
      }
    });

    body.addEventListener("click", async (e) => {
      const t = e.target;
      if (t.matches("[data-approve]")) {
        const id = Number(t.getAttribute("data-approve"));
        try {
          await this.approveLeave(id);
          await render();
        } catch (error) {
          alert(error.message);
        }
      }
    });
  },
};
