// Module quản lý nghỉ phép
const LEAVES_STORAGE_KEY = "hrm_leaves";
const DEFAULT_ANNUAL_LEAVE_DAYS = 20; // Số ngày phép mặc định mỗi năm
const MILLISECONDS_PER_DAY = 86400000; // 1 ngày = 86,400,000 milliseconds
const LEAVE_STATUS_PENDING = "pending";
const LEAVE_STATUS_APPROVED = "approved";
const LEAVE_TYPE_ANNUAL = "annual";

// Đọc danh sách yêu cầu nghỉ phép đã lưu
function readLeaveData() {
  const rawData = localStorage.getItem(LEAVES_STORAGE_KEY);
  return rawData ? JSON.parse(rawData) : [];
}

// Ghi lại danh sách yêu cầu nghỉ phép vào LocalStorage
function saveLeaveData(leaveList) {
  localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(leaveList));
}

// Tính tổng số ngày giữa hai mốc thời gian (bao gồm ngày bắt đầu và kết thúc)
function calculateDaysDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = end - start;
  return Math.ceil(diffInMs / MILLISECONDS_PER_DAY) + 1;
}

export const LeaveModule = {
  /**
   * Tạo yêu cầu nghỉ phép mới
   */
  requestLeave(employeeId, startDate, endDate, leaveType) {
    if (!employeeId || !startDate || !endDate) {
      throw new Error("Thiếu dữ liệu");
    }

    const leaveList = readLeaveData();
    leaveList.push({
      id: Date.now(),
      employeeId,
      startDate,
      endDate,
      type: leaveType,
      status: LEAVE_STATUS_PENDING,
    });
    saveLeaveData(leaveList);
  },

  /**
   * Duyệt yêu cầu nghỉ phép
   */
  approveLeave(leaveRequestId) {
    const leaveList = readLeaveData();
    const leaveIndex = leaveList.findIndex(
      (leaveRequest) => leaveRequest.id === leaveRequestId
    );

    if (leaveIndex === -1) {
      throw new Error("Không tồn tại");
    }

    leaveList[leaveIndex].status = LEAVE_STATUS_APPROVED;
    saveLeaveData(leaveList);
  },

  /**
   * Tính số ngày phép còn lại của nhân viên
   */
  getLeaveBalance(employeeId) {
    const approvedLeaves = readLeaveData().filter(
      (leaveRequest) =>
        leaveRequest.employeeId === employeeId &&
        leaveRequest.status === LEAVE_STATUS_APPROVED &&
        leaveRequest.type === LEAVE_TYPE_ANNUAL
    );

    const usedDays = approvedLeaves.reduce(
      (totalDays, leaveRequest) =>
        totalDays +
        calculateDaysDifference(leaveRequest.startDate, leaveRequest.endDate),
      0
    );

    return Math.max(0, DEFAULT_ANNUAL_LEAVE_DAYS - usedDays);
  },
  mount(viewEl, titleEl) {
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
    const render = () => {
      const list = read();
      body.innerHTML = list
        .map(
          (leave) => `<tr>
				<td>${leave.employeeId}</td>
				<td>${leave.startDate} → ${leave.endDate}</td>
				<td>${leave.type}</td>
				<td>${leave.status}</td>
				<td>${
          leave.status === "pending"
            ? `<button data-approve="${leave.id}">Duyệt</button>`
            : ""
        }</td>
			</tr>`
        )
        .join("");
    };
    render();

    wrap.querySelector("#leaveForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = Number(wrap.querySelector("#lvEmp").value);
      const s = wrap.querySelector("#lvStart").value;
      const en = wrap.querySelector("#lvEnd").value;
      const type = wrap.querySelector("#lvType").value;
      try {
        this.requestLeave(id, s, en, type);
        e.target.reset();
        render();
      } catch (err) {
        alert(err.message);
      }
    });

    body.addEventListener("click", (e) => {
      const t = e.target;
      if (t.matches("[data-approve]")) {
        const id = Number(t.getAttribute("data-approve"));
        this.approveLeave(id);
        render();
      }
    });
  },
};
