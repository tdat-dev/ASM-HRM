import { EmployeeDb } from "./employee-db-module.js";
import { AttendanceModule } from "./attendance-module.js";
import { LeaveModule } from "./leave-module.js";

// Lưu ý: ESS hiển thị dữ liệu theo user hiện tại (đơn giản: map username -> employeeId nếu trùng tên)
async function getCurrentEmployee() {
  const sessionRaw = localStorage.getItem("hrm_session");
  if (!sessionRaw) return null;
  const session = JSON.parse(sessionRaw);
  const employees = await EmployeeDb.getAllEmployees();
  // Chiến lược đơn giản: khớp username với tên nhân viên (demo)
  const emp =
    employees.find(
      (e) =>
        String(e.name || "").toLowerCase() === session.username.toLowerCase()
    ) || null;
  return emp;
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
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="card">
          <h3>👤 Thông tin cá nhân</h3>
          <div style="display: grid; grid-template-columns: 140px 1fr; row-gap: 8px;">
            <div><strong>Mã NV:</strong></div><div>#${currentEmployee.id}</div>
            <div><strong>Họ tên:</strong></div><div>${
              currentEmployee.name
            }</div>
            <div><strong>Phòng ban:</strong></div><div>${
              currentEmployee.departmentId || "-"
            }</div>
            <div><strong>Vị trí:</strong></div><div>${
              currentEmployee.positionId || "-"
            }</div>
            <div><strong>Lương cơ bản:</strong></div><div>${(
              currentEmployee.salary || 0
            ).toLocaleString()} VNĐ</div>
            <div><strong>Ngày vào làm:</strong></div><div>${
              currentEmployee.hireDate || "-"
            }</div>
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
      const leaveData = JSON.parse(localStorage.getItem("hrm_leaves") || "[]");
      const start = container.querySelector("#essLeaveStart").value;
      const end = container.querySelector("#essLeaveEnd").value;
      const reason = container.querySelector("#essLeaveReason").value.trim();
      if (!start || !end || !reason) {
        alertEl.innerHTML =
          '<div class="alert error">Vui lòng nhập đủ thông tin.</div>';
        return;
      }
      leaveData.push({
        id: Date.now(),
        employeeId: currentEmployee.id,
        startDate: start,
        endDate: end,
        reason,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("hrm_leaves", JSON.stringify(leaveData));
      // Gửi thông báo cho quản lý (local demo)
      const noti = JSON.parse(
        localStorage.getItem("hrm_notifications") || "[]"
      );
      noti.unshift({
        id: Date.now(),
        type: "leave_request",
        title: "Đơn nghỉ phép mới",
        message: `${currentEmployee.name} gửi đơn nghỉ phép (${start} → ${end}).`,
        createdAt: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem("hrm_notifications", JSON.stringify(noti));
      alertEl.innerHTML =
        '<div class="alert success">Gửi đơn thành công. Vui lòng chờ duyệt.</div>';
      form.reset();
    });

    // Hiển thị chấm công gần đây theo employee
    const attWrap = container.querySelector("#essAttendance");
    const allAttendance = JSON.parse(
      localStorage.getItem("hrm_attendance") || "[]"
    );
    const mine = allAttendance
      .filter((a) => a.employeeId === currentEmployee.id)
      .slice(-10)
      .reverse();
    if (mine.length === 0) {
      attWrap.innerHTML = `<div class="muted">Chưa có dữ liệu</div>`;
    } else {
      attWrap.innerHTML = `
        <table class="table">
          <thead><tr><th>Ngày</th><th>Check-in</th><th>Check-out</th></tr></thead>
          <tbody>
            ${mine
              .map(
                (r) =>
                  `<tr><td>${r.date}</td><td>${r.checkIn || "-"}</td><td>${
                    r.checkOut || "-"
                  }</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      `;
    }
  },
};

