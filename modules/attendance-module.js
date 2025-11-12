import { attendanceAPI } from "../utils/api.js";
import { AuthModule } from "./auth-module.js";
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
    titleEl.textContent = "Chấm công";
    viewEl.innerHTML = "";

    const session = await AuthModule.getSession();
    const role = session?.role || "employee";

    const wrap = document.createElement("div");
    wrap.className = "card";

    if (role === "manager" || role === "hr") {
      // Giao diện báo cáo chung + tổng chấm công trong ngày
      wrap.innerHTML = `
        <div style="display:grid;gap:12px;">
          <form id="reportForm" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
            <div>
              <label>Mã nhân viên</label>
              <input id="repEmp" type="number" placeholder="VD: 1001" />
            </div>
            <div>
              <label>Từ ngày</label>
              <input id="repFrom" type="date" required />
            </div>
            <div>
              <label>Đến ngày</label>
              <input id="repTo" type="date" required />
            </div>
            <button class="primary" type="submit"><i class="fas fa-file-alt"></i> Xem báo cáo</button>
          </form>

          <div id="todaySummary" class="alert info">Đang tải tổng chấm công hôm nay...</div>

          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr><th>Ngày</th><th>Check-in</th><th>Check-out</th></tr>
              </thead>
              <tbody id="repBody"></tbody>
            </table>
          </div>
        </div>
      `;
      viewEl.appendChild(wrap);

      // Hiển thị tổng chấm công trong ngày
      try {
        const today = await attendanceAPI.getTodayCount();
        const el = wrap.querySelector("#todaySummary");
        if (el) {
          el.className = "alert success";
          el.textContent = `Tổng số lượt chấm công hôm nay: ${
            today.data?.count ?? 0
          }`;
        }
      } catch (e) {
        const el = wrap.querySelector("#todaySummary");
        if (el) {
          el.className = "alert warning";
          el.textContent = "Không thể tải tổng chấm công hôm nay.";
        }
      }

      // Xử lý form báo cáo
      const repBody = wrap.querySelector("#repBody");
      wrap
        .querySelector("#reportForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const emp = Number(wrap.querySelector("#repEmp").value) || undefined;
          const from = wrap.querySelector("#repFrom").value;
          const to = wrap.querySelector("#repTo").value;
          try {
            const rows = await this.getAttendanceReport(emp, from, to);
            repBody.innerHTML =
              Array.isArray(rows) && rows.length
                ? rows
                    .map(
                      (r) => `<tr>
                    <td>${escapeHTML(r.date || "-")}</td>
                    <td>${escapeHTML(r.check_in || "-")}</td>
                    <td>${escapeHTML(r.check_out || "-")}</td>
                  </tr>`
                    )
                    .join("")
                : `<tr><td colspan="3" class="muted">Không có dữ liệu</td></tr>`;
          } catch (err) {
            repBody.innerHTML = `<tr><td colspan="3" class="alert error">${escapeHTML(
              err.message || "Có lỗi xảy ra"
            )}</td></tr>`;
          }
        });
      return;
    }

    // Giao diện nhân viên: check-in/out nhanh
    wrap.innerHTML = `
      <form id="attForm" style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
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
        alertEl.innerHTML = `<div class="alert error">${escapeHTML(
          err.message || "Có lỗi xảy ra"
        )}</div>`;
      }
    });
    wrap.querySelector("#btnOut").addEventListener("click", async () => {
      const id = Number(wrap.querySelector("#attId").value);
      try {
        await this.checkOut(id);
        alertEl.innerHTML = '<div class="alert success">Đã check-out</div>';
      } catch (err) {
        alertEl.innerHTML = `<div class="alert error">${escapeHTML(
          err.message || "Có lỗi xảy ra"
        )}</div>`;
      }
    });
  },
};
