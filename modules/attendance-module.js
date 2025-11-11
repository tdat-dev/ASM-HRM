import { attendanceAPI } from "../utils/api.js";
import { escapeHTML } from "../utils/dom.js";
import { validateEmployeeId } from "../utils/validators.js";

// Module quản lý chấm công (check-in, check-out)

export const AttendanceModule = {
  /**
   * Check-in cho nhân viên
   */
  async checkIn(employeeId) {
    const { ok, errors } = validateEmployeeId(employeeId);
    if (!ok) {
      throw new Error(errors[0]);
    }

    await attendanceAPI.checkIn(employeeId);
  },

  /**
   * Check-out cho nhân viên
   */
  async checkOut(employeeId) {
    const { ok, errors } = validateEmployeeId(employeeId);
    if (!ok) {
      throw new Error(errors[0]);
    }

    await attendanceAPI.checkOut(employeeId);
  },

  /**
   * Lấy báo cáo chấm công của nhân viên trong khoảng thời gian
   */
  async getAttendanceReport(employeeId, fromDate, toDate) {
    const result = await attendanceAPI.getReport(employeeId, fromDate, toDate);
    return result.data || [];
  },

  async mount(viewEl, titleEl) {
    // Render giao diện chấm công nhanh và gắn sự kiện check-in/out
    titleEl.textContent = "Chấm công";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
			<form id="attForm" style="display:flex;gap:8px;align-items:flex-end;">
				<div><label>Employee ID</label><input id="attId" type="number" required /></div>
				<button id="btnIn" type="button" class="primary">Check-in</button>
				<button id="btnOut" type="button">Check-out</button>
			</form>
			<div id="attAlert"></div>
		`;
    viewEl.appendChild(wrap);

    const alertEl = wrap.querySelector("#attAlert");
    wrap.querySelector("#btnIn").addEventListener("click", async () => {
      const id = Number(wrap.querySelector("#attId").value);
      try {
        await this.checkIn(id);
        alertEl.innerHTML = '<div class="alert success">Đã check-in</div>';
      } catch (err) {
        alertEl.innerHTML = `<div class="alert error">${escapeHTML(err.message || "Có lỗi xảy ra")}</div>`;
      }
    });
    wrap.querySelector("#btnOut").addEventListener("click", async () => {
      const id = Number(wrap.querySelector("#attId").value);
      try {
        await this.checkOut(id);
        alertEl.innerHTML = '<div class="alert success">Đã check-out</div>';
      } catch (err) {
        alertEl.innerHTML = `<div class="alert error">${escapeHTML(err.message || "Có lỗi xảy ra")}</div>`;
      }
    });
  },
};
