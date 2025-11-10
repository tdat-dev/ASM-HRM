import { EmployeeDb } from "./employee-db-module.js";
import { AttendanceModule } from "./attendance-module.js";
import { LeaveModule } from "./leave-module.js";
import { escapeHTML } from "../utils/dom.js";
import { safeJSONParse } from "../utils/storage.js";

// Constants
const STORAGE_KEY_LEAVES = "hrm_leaves";
const STORAGE_KEY_ATTENDANCE = "hrm_attendance";
const STORAGE_KEY_NOTIFICATIONS = "hrm_notifications";

/**
 * Lấy thông tin nhân viên hiện tại từ session
 * LƯU Ý BẢO MẬT: Trong hệ thống thực tế, session phải chứa employeeId được xác thực từ server
 * (ví dụ: JWT token). Hiện tại đây chỉ là demo đơn giản.
 */
async function getCurrentEmployee() {
  try {
    const sessionRaw = localStorage.getItem("hrm_session");
    if (!sessionRaw) return null;

    const session = safeJSONParse(sessionRaw, null);
    if (!session) return null;

    // Ưu tiên: Nếu session có employeeId (từ backend), dùng nó
    if (session.employeeId) {
      const employee = await EmployeeDb.getEmployeeById(session.employeeId);
      if (employee) return employee;
    }

    // Fallback: Tìm theo username (chỉ dùng cho demo, không an toàn trong production)
    // CẢNH BÁO: Cách này có thể bị giả mạo nếu user sửa localStorage
    const employees = await EmployeeDb.getAllEmployees();
    const emp =
      employees.find(
        (e) =>
          String(e.name || "").toLowerCase() ===
          String(session.username || "").toLowerCase()
      ) || null;

    return emp;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhân viên:", error);
    return null;
  }
}

export const EssModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Cổng thông tin nhân viên (ESS)";
    viewEl.innerHTML = "";

    const currentEmployee = await getCurrentEmployee();

    if (!currentEmployee) {
      viewEl.innerHTML = `
        <div class="card">
          <h3>Không tìm thấy hồ sơ nhân viên của bạn</h3>
          <p>Hãy yêu cầu HR liên kết tài khoản với hồ sơ nhân viên trong hệ thống.</p>
        </div>
      `;
      return;
    }

    const container = document.createElement("div");
    // Sử dụng escapeHTML cho tất cả dữ liệu động
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="card">
          <h3>👤 Thông tin cá nhân</h3>
          <div style="display: grid; grid-template-columns: 140px 1fr; row-gap: 8px;">
            <div><strong>Mã NV:</strong></div><div>#${escapeHTML(
              currentEmployee.id
            )}</div>
            <div><strong>Họ tên:</strong></div><div>${escapeHTML(
              currentEmployee.name || ""
            )}</div>
            <div><strong>Phòng ban:</strong></div><div>${escapeHTML(
              String(currentEmployee.departmentId || "-")
            )}</div>
            <div><strong>Vị trí:</strong></div><div>${escapeHTML(
              String(currentEmployee.positionId || "-")
            )}</div>
            <div><strong>Lương cơ bản:</strong></div><div>${(
              currentEmployee.salary || 0
            ).toLocaleString()} VNĐ</div>
            <div><strong>Ngày vào làm:</strong></div><div>${escapeHTML(
              currentEmployee.hireDate || "-"
            )}</div>
          </div>
        </div>
        <div class="card">
          <h3>📝 Nộp đơn nghỉ phép</h3>
          <form id="essLeaveForm" style="display: grid; gap: 8px;">
            <div>
              <label>Ngày bắt đầu</label>
              <input id="essLeaveStart" type="date" required />
            </div>
            <div>
              <label>Ngày kết thúc</label>
              <input id="essLeaveEnd" type="date" required />
            </div>
            <div>
              <label>Lý do</label>
              <input id="essLeaveReason" type="text" placeholder="Lý do xin nghỉ" required />
            </div>
            <button class="primary" type="submit"><i class="fas fa-paper-plane"></i> Gửi đơn</button>
            <div id="essLeaveAlert"></div>
          </form>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div class="card">
          <h3>⏱ Chấm công (gần đây)</h3>
          <div id="essAttendance"></div>
        </div>
        <div class="card">
          <h3>💸 Phiếu lương (đơn giản)</h3>
          <div>
            <div><strong>Lương cơ bản:</strong> ${(
              currentEmployee.salary || 0
            ).toLocaleString()} VNĐ</div>
            <div><strong>Thưởng:</strong> ${(
              currentEmployee.bonus || 0
            ).toLocaleString()} VNĐ</div>
            <div><strong>Khấu trừ:</strong> ${(
              currentEmployee.deduction || 0
            ).toLocaleString()} VNĐ</div>
            <div><strong>Thực lĩnh ước tính:</strong> <span style="color: var(--success); font-weight: 700;">${(
              (currentEmployee.salary || 0) +
                (currentEmployee.bonus || 0) -
                (currentEmployee.deduction || 0) || 0
            ).toLocaleString()} VNĐ</span></div>
          </div>
        </div>
      </div>
    `;
    viewEl.appendChild(container);

    // Bind leave form submission (nhân viên tự gửi)
    const form = container.querySelector("#essLeaveForm");
    const alertEl = container.querySelector("#essLeaveAlert");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const leaveData = safeJSONParse(
        localStorage.getItem(STORAGE_KEY_LEAVES),
        []
      );
      const start = container.querySelector("#essLeaveStart").value;
      const end = container.querySelector("#essLeaveEnd").value;
      const reason = container.querySelector("#essLeaveReason").value.trim();

      // Validation với feedback
      if (!start || !end || !reason) {
        alertEl.innerHTML =
          '<div class="alert error">Vui lòng nhập đủ thông tin.</div>';
        return;
      }

      // Kiểm tra ngày hợp lệ
      if (new Date(end) < new Date(start)) {
        alertEl.innerHTML =
          '<div class="alert error">Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.</div>';
        return;
      }

      leaveData.push({
        id: Date.now(),
        employeeId: currentEmployee.id,
        startDate: start,
        endDate: end,
        reason: escapeHTML(reason), // Escape lý do để chống XSS
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(leaveData));

      // Gửi thông báo cho quản lý (local demo)
      const noti = safeJSONParse(
        localStorage.getItem(STORAGE_KEY_NOTIFICATIONS),
        []
      );
      noti.unshift({
        id: Date.now(),
        type: "leave_request",
        title: "Đơn nghỉ phép mới",
        message: `${escapeHTML(
          currentEmployee.name
        )} gửi đơn nghỉ phép (${start} → ${end}).`,
        createdAt: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(noti));

      alertEl.innerHTML =
        '<div class="alert success">Gửi đơn thành công. Vui lòng chờ duyệt.</div>';
      form.reset();
    });

    // Hiển thị chấm công gần đây theo employee
    const attWrap = container.querySelector("#essAttendance");
    const allAttendance = safeJSONParse(
      localStorage.getItem(STORAGE_KEY_ATTENDANCE),
      []
    );
    const mine = allAttendance
      .filter((a) => a.employeeId === currentEmployee.id)
      .slice(-10)
      .reverse();

    if (mine.length === 0) {
      attWrap.innerHTML = `<div class="muted">Chưa có dữ liệu</div>`;
    } else {
      // Escape tất cả dữ liệu động
      attWrap.innerHTML = `
        <table class="table">
          <thead><tr><th>Ngày</th><th>Check-in</th><th>Check-out</th></tr></thead>
          <tbody>
            ${mine
              .map(
                (r) =>
                  `<tr>
                    <td>${escapeHTML(r.date || "-")}</td>
                    <td>${escapeHTML(r.checkIn || "-")}</td>
                    <td>${escapeHTML(r.checkOut || "-")}</td>
                  </tr>`
              )
              .join("")}
          </tbody>
        </table>
      `;
    }
  },
};
