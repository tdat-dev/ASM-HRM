import { leaveAPI } from "../utils/api.js";
import { AuthModule } from "./auth-module.js";
import { validateEmployeeId, validateDateRange } from "../utils/validators.js";
import { showToast, escapeHTML } from "../utils/dom.js";

const APPROVER_ROLES = new Set(["manager", "hr"]);
const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 500;
const EMPTY_TABLE_HTML =
  '<tr><td colspan="5" class="muted">Không có đơn nghỉ phép.</td></tr>';

function createLayout(parentEl, { showForm }) {
  const wrap = document.createElement("div");
  wrap.className = "card leave-card";
  const introMarkup = showForm
    ? `
      <form id="leaveForm" class="leave-form" novalidate>
        <div class="leave-form-row">
          <label class="leave-form-label" for="lvEmp">Mã nhân viên</label>
          <input id="lvEmp" type="number" min="1" placeholder="Nhập mã nhân viên" required />
          <p id="lvEmpHint" class="leave-form-hint muted"></p>
        </div>
        <div class="leave-form-row">
          <label class="leave-form-label" for="lvStart">Từ ngày</label>
          <input id="lvStart" type="date" required />
        </div>
        <div class="leave-form-row">
          <label class="leave-form-label" for="lvEnd">Đến ngày</label>
          <input id="lvEnd" type="date" required />
        </div>
        <div class="leave-form-row">
          <label class="leave-form-label" for="lvReason">Lý do nghỉ</label>
          <textarea id="lvReason" rows="3" placeholder="Ví dụ: Nghỉ phép chăm sóc gia đình" required></textarea>
        </div>
        <button class="primary leave-submit-btn" type="submit">Gửi yêu cầu</button>
      </form>
    `
    : `<div id="lvSummary" class="alert info leave-summary">Đang tải số đơn pending...</div>`;

  wrap.innerHTML = `
    ${introMarkup}
    <section class="leave-table-section">
      <h3>Danh sách yêu cầu</h3>
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Khoảng</th>
              <th>Lý do</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="lvBody"></tbody>
        </table>
      </div>
    </section>
  `;
  parentEl.appendChild(wrap);

  return {
    wrap,
    formEl: wrap.querySelector("#leaveForm"),
    employeeField: wrap.querySelector("#lvEmp"),
    employeeHintEl: wrap.querySelector("#lvEmpHint"),
    startField: wrap.querySelector("#lvStart"),
    endField: wrap.querySelector("#lvEnd"),
    reasonField: wrap.querySelector("#lvReason"),
    summaryEl: wrap.querySelector("#lvSummary"),
    tableBody: wrap.querySelector("#lvBody"),
  };
}

function buildActionsMarkup(leave, canApprove) {
  if (!canApprove || leave.status !== "pending") {
    return "";
  }
  const leaveId = Number(leave.id);
  if (!Number.isFinite(leaveId)) {
    return "";
  }
  return `
    <div class="leave-actions">
      <button type="button" class="primary" data-approve="${leaveId}">Duyệt</button>
      <button type="button" class="danger" data-reject="${leaveId}">Từ chối</button>
    </div>
  `;
}

function renderLeaveRows(leaves, canApprove) {
  if (!Array.isArray(leaves) || leaves.length === 0) {
    return EMPTY_TABLE_HTML;
  }

  return leaves
    .map((leave) => {
      const employeeLabel = leave.employee_name
        ? escapeHTML(leave.employee_name)
        : escapeHTML(String(leave.employee_id ?? ""));
      const startDate = leave.start_date ? escapeHTML(leave.start_date) : "-";
      const endDate = leave.end_date ? escapeHTML(leave.end_date) : "-";
      const reason = leave.reason ? escapeHTML(leave.reason) : "-";
      const status = escapeHTML(leave.status || "-");
      const actions = buildActionsMarkup(leave, canApprove);

      return `
        <tr>
          <td>${employeeLabel}</td>
          <td>${startDate} → ${endDate}</td>
          <td>${reason}</td>
          <td>${status}</td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");
}

function coerceEmployeeId(raw) {
  const numeric = Number(raw);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

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
    if (safeReason.length < MIN_REASON_LENGTH) {
      messages.push(`Lý do phải có ít nhất ${MIN_REASON_LENGTH} ký tự`);
    }
    if (safeReason.length > MAX_REASON_LENGTH) {
      messages.push(`Lý do không được vượt quá ${MAX_REASON_LENGTH} ký tự`);
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
    titleEl.textContent = "Nghỉ phép";
    viewEl.innerHTML = "";

    const session = await AuthModule.getSession();
    const role = session?.role || "employee";
    const canApprove = APPROVER_ROLES.has(role);
    const employeeId = coerceEmployeeId(session?.employeeId);
    const ui = createLayout(viewEl, { showForm: !canApprove });

    const refreshTable = async () => {
      if (!ui.tableBody) {
        return;
      }
      try {
        const result = await leaveAPI.getAll();
        const leaves = Array.isArray(result?.data) ? result.data : [];
        ui.tableBody.innerHTML = renderLeaveRows(leaves, canApprove);
      } catch (error) {
        ui.tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="alert error">${escapeHTML(
              error.message || "Không thể tải dữ liệu nghỉ phép."
            )}</td>
          </tr>
        `;
      }
    };

    const refreshSummary = async () => {
      if (!ui.summaryEl) {
        return;
      }
      try {
        const res = await leaveAPI.getPendingCount();
        const pending = res?.data?.count ?? 0;
        ui.summaryEl.className =
          pending > 0
            ? "alert warning leave-summary"
            : "alert success leave-summary";
        ui.summaryEl.textContent =
          pending > 0
            ? `Có ${pending} đơn nghỉ phép đang chờ duyệt.`
            : "Không có đơn nghỉ phép đang chờ.";
      } catch (error) {
        ui.summaryEl.className = "alert error leave-summary";
        ui.summaryEl.textContent = "Không thể tải thống kê đơn pending.";
      }
    };

    const refresh = async () => {
      await refreshTable();
      if (canApprove) {
        await refreshSummary();
      }
    };

    if (ui.formEl) {
      const { employeeField, employeeHintEl } = ui;

      if (employeeField && employeeId) {
        employeeField.value = String(employeeId);
        employeeField.disabled = true;
        employeeField.setAttribute("aria-disabled", "true");
        employeeField.classList.add("is-disabled");
        if (employeeHintEl) {
          const username = session?.username ? ` (${session.username})` : "";
          employeeHintEl.textContent = `Hệ thống tự động sử dụng mã nhân viên ${employeeId}${username}.`;
        }
      } else if (employeeHintEl) {
        employeeHintEl.textContent =
          "Nhập mã nhân viên để gửi yêu cầu nghỉ phép.";
      }

      ui.formEl.addEventListener("submit", async (event) => {
        event.preventDefault();
        const targetEmployeeId =
          employeeId ?? coerceEmployeeId(employeeField?.value);
        if (!targetEmployeeId) {
          showToast("Mã nhân viên không hợp lệ.", "error");
          return;
        }
        const startDate = ui.startField?.value || "";
        const endDate = ui.endField?.value || "";
        const reason = ui.reasonField?.value || "";

        try {
          await LeaveModule.requestLeave(
            targetEmployeeId,
            startDate,
            endDate,
            reason
          );
          showToast("Đã gửi đơn nghỉ phép thành công.", "success");
          ui.formEl.reset();
          if (employeeField && employeeId) {
            employeeField.value = String(employeeId);
          }
          await refresh();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    }

    if (ui.tableBody) {
      ui.tableBody.addEventListener("click", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const actionButton = target.closest(
          "button[data-approve], button[data-reject]"
        );
        if (!actionButton) {
          return;
        }

        const approveAttr = actionButton.getAttribute("data-approve");
        const rejectAttr = actionButton.getAttribute("data-reject");
        const leaveId = coerceEmployeeId(approveAttr ?? rejectAttr);
        if (!leaveId) {
          return;
        }

        try {
          if (approveAttr) {
            await LeaveModule.approveLeave(leaveId);
            showToast("Đã duyệt đơn nghỉ phép.", "success");
          } else {
            await LeaveModule.rejectLeave(leaveId, "");
            showToast("Đã từ chối đơn nghỉ phép.", "success");
          }
          await refresh();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    }

    await refresh();
  },
};
