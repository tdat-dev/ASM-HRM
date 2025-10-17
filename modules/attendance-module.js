import { validateEmployeeId } from "../utils/validators.js";

// Module quản lý chấm công (check-in, check-out)
const ATTENDANCE_STORAGE_KEY = "hrm_attendance";
const MILLISECONDS_PER_HOUR = 3600000; // 1 giờ = 3,600,000 milliseconds

// Đọc toàn bộ bản ghi chấm công từ LocalStorage
function readAttendanceData() {
  const rawData = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
  return rawData ? JSON.parse(rawData) : [];
}

// Lưu danh sách chấm công về LocalStorage
function saveAttendanceData(attendanceList) {
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(attendanceList));
}

// Chuẩn hóa giá trị thời gian về chuỗi ngày yyyy-mm-dd
function convertToDateString(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

export const AttendanceModule = {
  /**
   * Check-in cho nhân viên
   */
  checkIn(employeeId) {
    const { ok, errors } = validateEmployeeId(employeeId);
    if (!ok) {
      throw new Error(errors[0]);
    }
    const attendanceList = readAttendanceData();
    const todayDate = convertToDateString(Date.now());

    const existingRecord = attendanceList.find(
      (record) => record.employeeId === employeeId && record.date === todayDate
    );

    if (existingRecord && existingRecord.checkIn) {
      throw new Error("Đã check-in");
    }

    if (existingRecord) {
      existingRecord.checkIn = new Date().toISOString();
    } else {
      attendanceList.push({
        date: todayDate,
        employeeId,
        checkIn: new Date().toISOString(),
        checkOut: null,
      });
    }

    saveAttendanceData(attendanceList);
  },

  /**
   * Check-out cho nhân viên
   */
  checkOut(employeeId) {
    const { ok, errors } = validateEmployeeId(employeeId);
    if (!ok) {
      throw new Error(errors[0]);
    }
    const attendanceList = readAttendanceData();
    const todayDate = convertToDateString(Date.now());

    const existingRecord = attendanceList.find(
      (record) => record.employeeId === employeeId && record.date === todayDate
    );

    if (!existingRecord || !existingRecord.checkIn) {
      throw new Error("Chưa check-in");
    }
    if (existingRecord.checkOut) {
      throw new Error("Đã check-out");
    }

    existingRecord.checkOut = new Date().toISOString();
    saveAttendanceData(attendanceList);
  },

  /**
   * Lấy báo cáo chấm công của nhân viên trong khoảng thời gian
   */
  getAttendanceReport(employeeId, fromDate, toDate) {
    const attendanceList = readAttendanceData();
    const startDate = fromDate ? new Date(fromDate) : new Date("1970-01-01");
    const endDate = toDate ? new Date(toDate) : new Date("2999-12-31");

    return attendanceList
      .filter(
        (record) =>
          record.employeeId === employeeId &&
          new Date(record.date) >= startDate &&
          new Date(record.date) <= endDate
      )
      .map((record) => {
        let workedHours = 0;
        if (record.checkIn && record.checkOut) {
          const checkInTime = new Date(record.checkIn);
          const checkOutTime = new Date(record.checkOut);
          workedHours = (checkOutTime - checkInTime) / MILLISECONDS_PER_HOUR;
        }
        return {
          ...record,
          hours: Math.max(0, Math.round(workedHours * 100) / 100),
        };
      });
  },
  mount(viewEl, titleEl) {
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
    wrap.querySelector("#btnIn").addEventListener("click", () => {
      const id = Number(wrap.querySelector("#attId").value);
      try {
        this.checkIn(id);
        alertEl.innerHTML = '<div class="alert success">Đã check-in</div>';
      } catch (err) {
        alertEl.innerHTML = `<div class="alert error">${err.message}</div>`;
      }
    });
    wrap.querySelector("#btnOut").addEventListener("click", () => {
      const id = Number(wrap.querySelector("#attId").value);
      try {
        this.checkOut(id);
        alertEl.innerHTML = '<div class="alert success">Đã check-out</div>';
      } catch (err) {
        alertEl.innerHTML = `<div class="alert error">${err.message}</div>`;
      }
    });
  },
};
