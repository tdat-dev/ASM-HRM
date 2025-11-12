import { leaveAPI } from "../utils/api.js";
import { AuthModule } from "./auth-module.js";
import { validateEmployeeId, validateDateRange } from "../utils/validators.js";
import { showToast, escapeHTML } from "../utils/dom.js";

// Module quản lý nghỉ phép
const DEFAULT_ANNUAL_LEAVE_DAYS = 20; // Số ngày phép mặc định mỗi năm

export const LeaveModule = {
  /**
   * Tạo yêu cầu nghỉ phép mới
   */
  async requestLeave(employeeId, startDate, endDate, reason) {
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
    const safeReason = String(reason || "").trim();
    if (safeReason.length < 3) {
      messages.push("Lý do phải có ít nhất 3 ký tự");
    }
    if (safeReason.length > 500) {
      messages.push("Lý do không được vượt quá 500 ký tự");
    }
    if (messages.length > 0) {
      throw new Error(messages.join(", "));
    }

    await leaveAPI.create({
      employee_id: employeeId,
      reason: safeReason,
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
    const session = await AuthModule.getSession();
    const role = session?.role || "employee";

    const wrap = document.createElement("div");
    wrap.className = "card";

    const showForm = !(role === "manager" || role === "hr"); // Manager/HR không cần form tạo đơn

    wrap.innerHTML = `
      ${showForm ? `
        <form id="leaveForm" style="display:grid;gap:8px;max-width:520px;">
          <input id="lvEmp" type="number" placeholder="Mã nhân viên" required />
          <div><label>Từ ngày</label><input id="lvStart" type="date" required /></div>
          <div><label>Đến ngày</label><input id="lvEnd" type="date" required /></div>
          <div>
            <label>Lý do nghỉ</label>
            <textarea id="lvReason" rows="3" placeholder="Ví dụ: Nghỉ phép chăm sóc gia đình" required></textarea>
          </div>
          <button class="primary">Gửi yêu cầu</button>
        </form>
      ` : `
        <div id="lvSummary" class="alert info">Đang tải số đơn pending...</div>
      `}
      <div style="margin-top:12px;">
        <h3>Danh sách yêu cầu</h3>
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Emp</th><th>Khoảng</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody id="lvBody"></tbody>
          </table>
        </div>
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
				<td>${escapeHTML(leave.employee_name || String(leave.employee_id ?? ""))}</td>
				<td>${escapeHTML(leave.start_date || "-")} → ${escapeHTML(leave.end_date || "-")}</td>
				<td>${leave.reason ? escapeHTML(leave.reason) : "-"}</td>
				<td>${escapeHTML(leave.status || "-")}</td>
				<td>${
          leave.status === "pending" && (role === "manager" || role === "hr")
            ? `<div style="display:flex;gap:8px;">
                 <button class="primary" data-approve="${leave.id}">Duyệt</button>
                 <button class="danger" data-reject="${leave.id}">Từ chối</button>
               </div>`
            : ""
        }</td>
			</tr>`
          )
          .join("");
      } catch (error) {
        body.innerHTML = `<tr><td colspan="5" class="alert error">${escapeHTML(error.message || "Có lỗi xảy ra")}</td></tr>`;
      }
    };
    await render();

    // Pending summary cho Manager/HR
    if (!showForm) {
      try {
        const res = await leaveAPI.getPendingCount();
        const pending = res.data?.count ?? 0;
        const el = wrap.querySelector("#lvSummary");
        if (el) {
          el.className = pending > 0 ? "alert warning" : "alert success";
          el.textContent =
            pending > 0
              ? `Có ${pending} đơn nghỉ phép đang chờ duyệt.`
              : "Không có đơn nghỉ phép đang chờ.";
        }
      } catch {}
    }

    // Form tạo đơn cho nhân viên
    const formEl = wrap.querySelector("#leaveForm");
    if (formEl) {
      formEl.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = Number(wrap.querySelector("#lvEmp").value);
        const s = wrap.querySelector("#lvStart").value;
        const en = wrap.querySelector("#lvEnd").value;
        const reason = wrap.querySelector("#lvReason").value;
        try {
          await this.requestLeave(id, s, en, reason);
          showToast("Đã gửi đơn nghỉ phép thành công.", "success");
          e.target.reset();
          await render();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }

    body.addEventListener("click", async (e) => {
      const t = e.target;
      if (t.matches("[data-approve]")) {
        const id = Number(t.getAttribute("data-approve"));
        try {
          await this.approveLeave(id);
          showToast("Đã duyệt đơn nghỉ phép.", "success");
          await render();
        } catch (error) {
          showToast(error.message, "error");
        }
      } else if (t.matches("[data-reject]")) {
        const id = Number(t.getAttribute("data-reject"));
        try {
          await this.rejectLeave(id, "");
          showToast("Đã từ chối đơn nghỉ phép.", "success");
          await render();
        } catch (error) {
          showToast(error.message, "error");
        }
      }
    });
  },
};
