import { EmployeeDb } from "./employee-db-module.js";
import { AttendanceModule } from "./attendance-module.js";
import { LeaveModule } from "./leave-module.js";
import { loadProfile } from "./profile-store.js";
import {
  escapeHTML,
  formatVND,
  showToast,
} from "../utils/dom.js";
import { safeJSONParse } from "../utils/storage.js";
import { leaveAPI, reviewAPI } from "../utils/api.js";
import { logger } from "../utils/logger.js";

const STORAGE_KEY_PROFILE_REQUESTS = "hrm_profile_requests";
const STORAGE_KEY_EXPENSES = "hrm_expense_claims";
const STORAGE_KEY_SELF_ASSESSMENTS = "hrm_self_assessments";
const STORAGE_KEY_DOCUMENTS = "hrm_documents";
const STORAGE_KEY_NOTIFICATIONS = "hrm_notifications";
const CONTACT_SNAPSHOT_PREFIX = "hrm_contact_snapshot_";
const PAYSLIP_STORAGE_PREFIX = "hrm_payslips_";

const MAX_ATTENDANCE_HISTORY_DAYS = 30;
const DEFAULT_PAYSLIP_MONTHS = 6;

const FAMILY_DEDUCTION = 11000000;
const DEPENDENT_DEDUCTION = 4400000;
const BHXH_RATE = 0.08;
const BHYT_RATE = 0.015;
const BHTN_RATE = 0.01;
const PIT_RATE = 0.05;

const EXPENSE_CATEGORIES = [
  "Công tác",
  "Đào tạo",
  "Thiết bị",
  "Văn phòng phẩm",
  "Khác",
];

function loadLocalArray(key, fallback = []) {
  return safeJSONParse(localStorage.getItem(key), fallback);
}

function saveLocalArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function pushNotification(notification) {
  const list = loadLocalArray(STORAGE_KEY_NOTIFICATIONS, []);
  const entry = {
    id: Date.now(),
    read: false,
    createdAt: new Date().toISOString(),
    ...notification,
  };
  list.unshift(entry);
  saveLocalArray(STORAGE_KEY_NOTIFICATIONS, list);
}

function ensureDocumentsSeed() {
  const seeded = [
    {
      id: "policy-employee-handbook",
      title: "Cẩm nang nhân viên 2025",
      category: "Chính sách",
      description:
        "Tổng hợp quyền lợi, nghĩa vụ và quy trình làm việc áp dụng toàn công ty.",
      url: "#",
      updatedAt: "2025-01-15",
    },
    {
      id: "policy-leave",
      title: "Quy định nghỉ phép",
      category: "Chính sách",
      description:
        "Chi tiết các loại nghỉ phép, cách tính phép năm và quy trình phê duyệt.",
      url: "#",
      updatedAt: "2025-02-01",
    },
    {
      id: "guide-claim",
      title: "Hướng dẫn hoàn ứng chi phí",
      category: "Hướng dẫn",
      description:
        "Các bước chuẩn bị chứng từ và thời hạn nộp đề nghị hoàn ứng.",
      url: "#",
      updatedAt: "2025-03-05",
    },
    {
      id: "guide-security",
      title: "Chính sách an toàn thông tin",
      category: "An toàn",
      description:
        "Nguyên tắc bảo mật dữ liệu, phân quyền truy cập và xử lý sự cố.",
      url: "#",
      updatedAt: "2025-04-10",
    },
  ];
  saveLocalArray(STORAGE_KEY_DOCUMENTS, seeded);
  return seeded;
}

function loadDocumentLibrary() {
  const docs = safeJSONParse(localStorage.getItem(STORAGE_KEY_DOCUMENTS), null);
  if (Array.isArray(docs) && docs.length > 0) {
    return docs;
  }
  return ensureDocumentsSeed();
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHistoryDateRange(days = MAX_ATTENDANCE_HISTORY_DAYS) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
}

function formatDateDisplay(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
}

function formatTimeDisplay(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateWorkDuration(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "-";
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) {
    return "-";
  }
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.round((diffMs / (1000 * 60)) % 60);
  return `${hours}h ${minutes}p`;
}

function sanitizePhone(phone) {
  return phone.replace(/\s+/g, "");
}

function isValidPhone(phone) {
  const value = sanitizePhone(phone);
  return /^\+?\d{9,15}$/.test(value);
}

function getCurrentQuarterPeriod() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
}

function computePayslipBreakdown(base, bonus, deduction, dependents = 0) {
  const safeBase = Number(base) || 0;
  const safeBonus = Number(bonus) || 0;
  const safePenalty = Number(deduction) || 0;
  const bhxh = Math.round(safeBase * BHXH_RATE);
  const bhyt = Math.round(safeBase * BHYT_RATE);
  const bhtn = Math.round(safeBase * BHTN_RATE);
  const insuranceTotal = bhxh + bhyt + bhtn;
  const dependentTotal = Math.max(0, dependents) * DEPENDENT_DEDUCTION;
  const taxable = Math.max(
    safeBase + safeBonus - insuranceTotal - FAMILY_DEDUCTION - dependentTotal,
    0
  );
  const pit = Math.round(taxable * PIT_RATE);
  const gross = safeBase + safeBonus;
  const totalDeduction = safePenalty + insuranceTotal + pit;
  const net = gross - totalDeduction;
  return {
    bhxh,
    bhyt,
    bhtn,
    insuranceTotal,
    dependentTotal,
    pit,
    gross,
    totalDeduction,
    net,
  };
}

function generateDefaultPayslipRecords(employee, profile) {
  const dependents = Array.isArray(profile?.dependents)
    ? profile.dependents.length
    : 0;
  const baseSalary = Number(employee.salary || 0);
  const now = new Date();
  const records = [];
  for (let i = 0; i < DEFAULT_PAYSLIP_MONTHS; i += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(
      monthDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const bonusBase = Number(employee.bonus || 0);
    const monthlyBonus = Math.max(
      0,
      bonusBase + (i % 2 === 0 ? 200000 : -100000)
    );
    const penaltyBase = Number(employee.deduction || 0);
    const monthlyPenalty =
      penaltyBase + (i % 3 === 0 ? 50000 : 0);
    const breakdown = computePayslipBreakdown(
      baseSalary,
      monthlyBonus,
      monthlyPenalty,
      dependents
    );
    records.push({
      id: `${employee.id}-${monthKey}`,
      employeeId: employee.id,
      month: monthKey,
      base: baseSalary,
      bonus: monthlyBonus,
      deduction: monthlyPenalty,
      dependents,
      workingDays: 22 - (i % 3),
      ...breakdown,
    });
  }
  return records;
}

function loadPayslips(employee, profile) {
  const key = `${PAYSLIP_STORAGE_PREFIX}${employee.id}`;
  const stored = safeJSONParse(localStorage.getItem(key), null);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  const defaults = generateDefaultPayslipRecords(employee, profile);
  saveLocalArray(key, defaults);
  return defaults;
}

function toMonthLabel(monthKey) {
  if (!monthKey || typeof monthKey !== "string") return "-";
  const [year, month] = monthKey.split("-");
  if (!year || !month) return "-";
  return `Tháng ${month}/${year}`;
}

function loadContactSnapshot(employee) {
  const key = `${CONTACT_SNAPSHOT_PREFIX}${employee.id}`;
  const stored = safeJSONParse(localStorage.getItem(key), null);
  if (stored) {
    return stored;
  }
  const snapshot = {
    phone: employee.phone || "",
    address: employee.address || "",
    updatedAt: employee.updated_at || employee.hireDate || new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(snapshot));
  return snapshot;
}

async function getCurrentEmployee() {
  try {
    const sessionRaw = localStorage.getItem("hrm_session");
    if (!sessionRaw) return null;
    const session = safeJSONParse(sessionRaw, null);
    if (!session) return null;
    if (session.employeeId) {
      const employee = await EmployeeDb.getEmployeeById(session.employeeId);
      if (employee) return employee;
    }
    const employees = await EmployeeDb.getAllEmployees();
    const fallback =
      employees.find(
        (emp) =>
          String(emp.name || "").toLowerCase() ===
          String(session.username || "").toLowerCase()
      ) || null;
    return fallback;
  } catch (error) {
    logger.error("ess_get_employee_failed", {
      message: error?.message || "unknown",
    });
    return null;
  }
}

function buildDashboardSection(state) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Tổng quan cá nhân";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Theo dõi nhanh trạng thái làm việc, số ngày phép và yêu cầu đang chờ.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "ess-grid ess-grid--two";

  const statTemplates = [
    {
      key: "attendanceStatus",
      icon: "fas fa-calendar-check",
      label: "Chấm công hôm nay",
      meta: "Tự động cập nhật khi check-in/out.",
    },
    {
      key: "attendanceHours",
      icon: "fas fa-hourglass-half",
      label: "Thời lượng làm việc",
      meta: "Giờ làm trong ngày hiện tại.",
    },
    {
      key: "leaveBalance",
      icon: "fas fa-umbrella-beach",
      label: "Ngày phép còn lại",
      meta: "Tính theo phép năm đã duyệt.",
    },
    {
      key: "pendingRequests",
      icon: "fas fa-tasks",
      label: "Yêu cầu đang chờ",
      meta: "Đơn nghỉ + cập nhật thông tin.",
    },
  ];

  const refs = {};

  statTemplates.forEach((stat) => {
    const card = document.createElement("div");
    card.className = "ess-stat-card";

    const labelWrap = document.createElement("div");
    labelWrap.innerHTML = `<i class="${stat.icon}"></i> ${escapeHTML(
      stat.label
    )}`;
    card.appendChild(labelWrap);

    const valueEl = document.createElement("div");
    valueEl.className = "ess-stat-value";
    valueEl.textContent = "Đang tải...";
    card.appendChild(valueEl);

    const metaEl = document.createElement("div");
    metaEl.className = "ess-stat-meta";
    metaEl.textContent = stat.meta;
    card.appendChild(metaEl);

    refs[stat.key] = { valueEl, metaEl };
    grid.appendChild(card);
  });

  section.appendChild(grid);

  const render = () => {
    const attendance = state.attendanceToday;
    const checkIn = attendance?.check_in || attendance?.checkIn;
    const checkOut = attendance?.check_out || attendance?.checkOut;

    const attendanceStatus = refs.attendanceStatus;
    if (attendanceStatus) {
      if (checkIn) {
        attendanceStatus.valueEl.textContent = formatTimeDisplay(checkIn);
        attendanceStatus.metaEl.textContent = `Check-out: ${formatTimeDisplay(
          checkOut
        )}`;
      } else {
        attendanceStatus.valueEl.textContent = "Chưa check-in";
        attendanceStatus.metaEl.textContent =
          "Hãy thực hiện check-in đầu ngày.";
      }
    }

    const attendanceHours = refs.attendanceHours;
    if (attendanceHours) {
      const duration = calculateWorkDuration(checkIn, checkOut);
      attendanceHours.valueEl.textContent = duration;
      attendanceHours.metaEl.textContent = formatDateDisplay(
        attendance?.date || new Date()
      );
    }

    const leaveBalance = refs.leaveBalance;
    if (leaveBalance) {
      leaveBalance.valueEl.textContent = `${state.leaveBalance ?? 0} ngày`;
      leaveBalance.metaEl.textContent = `Cập nhật: ${formatDateDisplay(
        new Date()
      )}`;
    }

    const pendingRequests = refs.pendingRequests;
    if (pendingRequests) {
      const pendingLeaves = state.leaves.filter(
        (leave) => (leave.status || "").toLowerCase() === "pending"
      ).length;
      const pendingProfiles = state.profileRequests.filter(
        (req) => (req.status || "").toLowerCase() === "pending"
      ).length;
      const total = pendingLeaves + pendingProfiles;
      pendingRequests.valueEl.textContent = `${total} yêu cầu`;
      pendingRequests.metaEl.textContent = `Nghỉ phép: ${pendingLeaves} • Thông tin: ${pendingProfiles}`;
    }
  };

  return { root: section, render };
}

function buildPersonalInfoSection(state, handlers) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Cập nhật thông tin cá nhân";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Gửi yêu cầu cập nhật địa chỉ, số điện thoại. HR sẽ duyệt trước khi áp dụng.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const currentInfoBlock = document.createElement("div");
  currentInfoBlock.className = "ess-inline";
  const phoneBlock = document.createElement("div");
  const phoneLabel = document.createElement("strong");
  phoneLabel.textContent = "SĐT hiện tại";
  const phoneValue = document.createElement("p");
  phoneBlock.appendChild(phoneLabel);
  phoneBlock.appendChild(phoneValue);

  const addressBlock = document.createElement("div");
  const addressLabel = document.createElement("strong");
  addressLabel.textContent = "Địa chỉ hiện tại";
  const addressValue = document.createElement("p");
  addressBlock.appendChild(addressLabel);
  addressBlock.appendChild(addressValue);

  currentInfoBlock.appendChild(phoneBlock);
  currentInfoBlock.appendChild(addressBlock);
  section.appendChild(currentInfoBlock);

  const form = document.createElement("form");
  form.id = "essPersonalForm";

  const phoneField = document.createElement("div");
  const phoneFieldLabel = document.createElement("label");
  phoneFieldLabel.setAttribute("for", "essPhone");
  phoneFieldLabel.textContent = "Số điện thoại mới";
  const phoneInput = document.createElement("input");
  phoneInput.id = "essPhone";
  phoneInput.type = "tel";
  phoneInput.placeholder = "VD: 0901234567 hoặc +84901234567";
  phoneInput.value = state.contactSnapshot?.phone || "";
  phoneField.appendChild(phoneFieldLabel);
  phoneField.appendChild(phoneInput);

  const addressField = document.createElement("div");
  const addressLabelNew = document.createElement("label");
  addressLabelNew.setAttribute("for", "essAddress");
  addressLabelNew.textContent = "Địa chỉ liên hệ";
  const addressInput = document.createElement("textarea");
  addressInput.id = "essAddress";
  addressInput.placeholder = "Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành";
  addressInput.value = state.contactSnapshot?.address || "";
  addressField.appendChild(addressLabelNew);
  addressField.appendChild(addressInput);

  const messageEl = document.createElement("div");

  const actions = document.createElement("div");
  actions.className = "ess-form-actions";
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "primary";
  submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi yêu cầu';
  actions.appendChild(submitBtn);

  form.appendChild(phoneField);
  form.appendChild(addressField);
  form.appendChild(actions);
  form.appendChild(messageEl);

  section.appendChild(form);

  const historyCard = document.createElement("div");
  historyCard.className = "ess-table-wrapper";
  const historyTable = document.createElement("table");
  historyTable.className = "table";
  const historyHead = document.createElement("thead");
  historyHead.innerHTML =
    "<tr><th>Ngày gửi</th><th>Số điện thoại</th><th>Địa chỉ</th><th>Trạng thái</th></tr>";
  const historyBody = document.createElement("tbody");
  historyTable.appendChild(historyHead);
  historyTable.appendChild(historyBody);
  historyCard.appendChild(historyTable);
  section.appendChild(historyCard);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.innerHTML = "";
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const errors = [];
    if (!isValidPhone(phone)) {
      errors.push("Số điện thoại không hợp lệ (tối thiểu 9 chữ số).");
    }
    if (address.length < 5) {
      errors.push("Địa chỉ cần tối thiểu 5 ký tự.");
    }
    if (errors.length > 0) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        errors.join(" ")
      )}</div>`;
      return;
    }
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    try {
      await handlers.onSubmit({ phone, address });
      messageEl.innerHTML =
        '<div class="alert success">Đã gửi yêu cầu cập nhật. Vui lòng chờ duyệt.</div>';
    } catch (error) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        error?.message || "Không thể gửi yêu cầu."
      )}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  });

  const render = () => {
    const snapshot = state.contactSnapshot;
    phoneValue.textContent = snapshot?.phone || "Chưa có";
    addressValue.textContent = snapshot?.address || "Chưa có";

    const rows = state.profileRequests;
    if (!Array.isArray(rows) || rows.length === 0) {
      historyBody.innerHTML =
        '<tr><td colspan="4" class="muted">Chưa có yêu cầu nào.</td></tr>';
    } else {
      historyBody.innerHTML = rows
        .map((row) => {
          const status = String(row.status || "pending").toLowerCase();
          let statusClass = "badge warning";
          if (status === "approved") statusClass = "badge success";
          if (status === "rejected") statusClass = "badge danger";
          const badge = `<span class="${statusClass}"><span class="dot"></span>${escapeHTML(
            status
          )}</span>`;
          return `<tr>
              <td>${escapeHTML(formatDateDisplay(row.submittedAt))}</td>
              <td>${escapeHTML(row.phone || "")}</td>
              <td>${escapeHTML(row.address || "")}</td>
              <td>${badge}</td>
            </tr>`;
        })
        .join("");
    }
  };

  return { root: section, render };
}

function buildAttendanceSection(state, handlers) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Lịch sử chấm công";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Xem chi tiết giờ check-in/out của chính bạn trong khoảng thời gian xác định.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const filterForm = document.createElement("form");
  filterForm.id = "essAttendanceFilter";
  filterForm.className = "ess-inline";
  const fromField = document.createElement("div");
  const fromLabel = document.createElement("label");
  fromLabel.setAttribute("for", "essAttendanceFrom");
  fromLabel.textContent = "Từ ngày";
  const fromInput = document.createElement("input");
  fromInput.type = "date";
  fromInput.id = "essAttendanceFrom";
  fromInput.required = true;
  fromInput.value = state.attendanceFilter?.start || "";
  fromField.appendChild(fromLabel);
  fromField.appendChild(fromInput);

  const toField = document.createElement("div");
  const toLabel = document.createElement("label");
  toLabel.setAttribute("for", "essAttendanceTo");
  toLabel.textContent = "Đến ngày";
  const toInput = document.createElement("input");
  toInput.type = "date";
  toInput.id = "essAttendanceTo";
  toInput.required = true;
  toInput.value = state.attendanceFilter?.end || "";
  toField.appendChild(toLabel);
  toField.appendChild(toInput);

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "primary";
  submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Tải dữ liệu';

  filterForm.appendChild(fromField);
  filterForm.appendChild(toField);
  filterForm.appendChild(submitBtn);
  section.appendChild(filterForm);

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "ess-table-wrapper";
  const table = document.createElement("table");
  table.className = "table";
  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>Ngày</th><th>Check-in</th><th>Check-out</th><th>Số giờ</th><th>Ghi chú</th></tr>";
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  section.appendChild(tableWrapper);

  const messageEl = document.createElement("div");
  section.appendChild(messageEl);

  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.innerHTML = "";
    const from = fromInput.value;
    const to = toInput.value;
    if (!from || !to) {
      messageEl.innerHTML =
        '<div class="alert error">Vui lòng chọn đủ khoảng ngày.</div>';
      return;
    }
    if (new Date(to) < new Date(from)) {
      messageEl.innerHTML =
        '<div class="alert error">Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.</div>';
      return;
    }
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    try {
      await handlers.onFilter({ start: from, end: to });
    } catch (error) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        error?.message || "Không thể tải dữ liệu."
      )}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  });

  const render = () => {
    fromInput.value = state.attendanceFilter?.start || "";
    toInput.value = state.attendanceFilter?.end || "";
    const rows = state.attendanceHistory;
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="muted">Chưa có chấm công trong khoảng này.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((row) => {
        return `<tr>
            <td>${escapeHTML(row.date || "")}</td>
            <td>${escapeHTML(formatTimeDisplay(row.check_in || row.checkIn))}</td>
            <td>${escapeHTML(formatTimeDisplay(row.check_out || row.checkOut))}</td>
            <td>${escapeHTML(
              calculateWorkDuration(
                row.check_in || row.checkIn,
                row.check_out || row.checkOut
              )
            )}</td>
            <td>${escapeHTML(row.notes || "-")}</td>
          </tr>`;
      })
      .join("");
  };

  return { root: section, render };
}

function buildLeaveSection(state, handlers) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Nộp đơn nghỉ phép";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Chọn khoảng thời gian nghỉ, lý do cụ thể. Đơn sẽ chuyển đến quản lý để duyệt.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const form = document.createElement("form");
  form.id = "essLeaveSubmit";

  const startField = document.createElement("div");
  const startLabel = document.createElement("label");
  startLabel.setAttribute("for", "essLeaveStart");
  startLabel.textContent = "Ngày bắt đầu";
  const startInput = document.createElement("input");
  startInput.type = "date";
  startInput.id = "essLeaveStart";
  startInput.required = true;
  startInput.min = toDateInputValue(new Date());
  startField.appendChild(startLabel);
  startField.appendChild(startInput);

  const endField = document.createElement("div");
  const endLabel = document.createElement("label");
  endLabel.setAttribute("for", "essLeaveEnd");
  endLabel.textContent = "Ngày kết thúc";
  const endInput = document.createElement("input");
  endInput.type = "date";
  endInput.id = "essLeaveEnd";
  endInput.required = true;
  endInput.min = toDateInputValue(new Date());
  endField.appendChild(endLabel);
  endField.appendChild(endInput);

  const typeField = document.createElement("div");
  const typeLabel = document.createElement("label");
  typeLabel.setAttribute("for", "essLeaveType");
  typeLabel.textContent = "Loại nghỉ";
  const typeSelect = document.createElement("select");
  typeSelect.id = "essLeaveType";
  ["annual", "sick", "personal", "unpaid", "other"].forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    const labelMap = {
      annual: "Nghỉ phép năm",
      sick: "Nghỉ bệnh",
      personal: "Việc riêng",
      unpaid: "Nghỉ không lương",
      other: "Khác",
    };
    option.textContent = labelMap[type];
    typeSelect.appendChild(option);
  });
  typeField.appendChild(typeLabel);
  typeField.appendChild(typeSelect);

  const reasonField = document.createElement("div");
  const reasonLabel = document.createElement("label");
  reasonLabel.setAttribute("for", "essLeaveReason");
  reasonLabel.textContent = "Lý do";
  const reasonInput = document.createElement("textarea");
  reasonInput.id = "essLeaveReason";
  reasonInput.placeholder = "Mô tả ngắn gọn lý do xin nghỉ";
  reasonInput.required = true;
  reasonField.appendChild(reasonLabel);
  reasonField.appendChild(reasonInput);

  const messageEl = document.createElement("div");
  const actions = document.createElement("div");
  actions.className = "ess-form-actions";
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "primary";
  submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi đơn';
  actions.appendChild(submitBtn);

  form.appendChild(startField);
  form.appendChild(endField);
  form.appendChild(typeField);
  form.appendChild(reasonField);
  form.appendChild(actions);
  form.appendChild(messageEl);

  section.appendChild(form);

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "ess-table-wrapper";
  const table = document.createElement("table");
  table.className = "table";
  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>Khoảng nghỉ</th><th>Loại</th><th>Lý do</th><th>Trạng thái</th><th>Ngày tạo</th></tr>";
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  section.appendChild(tableWrapper);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.innerHTML = "";
    const start = startInput.value;
    const end = endInput.value;
    const reason = reasonInput.value.trim();
    const type = typeSelect.value;
    const errors = [];
    if (!start || !end) {
      errors.push("Vui lòng chọn ngày bắt đầu và kết thúc.");
    } else if (new Date(end) < new Date(start)) {
      errors.push("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
    }
    if (reason.length < 3) {
      errors.push("Lý do cần tối thiểu 3 ký tự.");
    }
    if (errors.length > 0) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        errors.join(" ")
      )}</div>`;
      return;
    }
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    try {
      await handlers.onSubmit({ start, end, reason, type });
      reasonInput.value = "";
      messageEl.innerHTML =
        '<div class="alert success">Đã gửi đơn nghỉ phép. Vui lòng chờ phê duyệt.</div>';
    } catch (error) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        error?.message || "Không thể gửi đơn nghỉ phép."
      )}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  });

  const render = () => {
    const rows = state.leaves;
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="muted">Chưa có đơn nghỉ phép.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((row) => {
        const status = String(row.status || "pending").toLowerCase();
        let statusClass = "badge warning";
        if (status === "approved") statusClass = "badge success";
        if (status === "rejected") statusClass = "badge danger";
        const badge = `<span class="${statusClass}"><span class="dot"></span>${escapeHTML(
          status
        )}</span>`;
        const typeLabels = {
          annual: "Nghỉ phép năm",
          sick: "Nghỉ bệnh",
          personal: "Việc riêng",
          unpaid: "Không lương",
          other: "Khác",
        };
        const labelType =
          typeLabels[String(row.type || "annual")] || "Khác";
        return `<tr>
            <td>${escapeHTML(row.start_date || row.startDate || "")} → ${escapeHTML(
          row.end_date || row.endDate || ""
        )}</td>
            <td>${escapeHTML(labelType)}</td>
            <td>${escapeHTML(row.reason || "")}</td>
            <td>${badge}</td>
            <td>${escapeHTML(
              formatDateDisplay(row.created_at || row.createdAt)
            )}</td>
          </tr>`;
      })
      .join("");
  };

  return { root: section, render };
}

function buildPayslipSection(state) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Phiếu lương cá nhân";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Xem chi tiết lương cơ bản, phụ cấp, khấu trừ và thực lĩnh theo từng tháng.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const selectWrap = document.createElement("div");
  const label = document.createElement("label");
  label.setAttribute("for", "essPayslipSelect");
  label.textContent = "Chọn tháng";
  const select = document.createElement("select");
  select.id = "essPayslipSelect";
  selectWrap.appendChild(label);
  selectWrap.appendChild(select);
  section.appendChild(selectWrap);

  const details = document.createElement("div");
  details.className = "ess-list";
  section.appendChild(details);

  select.addEventListener("change", () => {
    state.selectedPayslip = select.value;
    render();
  });

  const render = () => {
    const slips = state.payslips || [];
    if (slips.length === 0) {
      select.innerHTML = "";
      details.innerHTML =
        '<div class="muted">Chưa có dữ liệu phiếu lương.</div>';
      return;
    }
    select.innerHTML = slips
      .map(
        (slip) =>
          `<option value="${escapeHTML(slip.month)}">${
            slip.month === state.selectedPayslip
              ? escapeHTML(toMonthLabel(slip.month))
              : escapeHTML(toMonthLabel(slip.month))
          }</option>`
      )
      .join("");
    if (!state.selectedPayslip) {
      state.selectedPayslip = slips[0].month;
    }
    select.value = state.selectedPayslip;
    const current = slips.find((slip) => slip.month === state.selectedPayslip);
    if (!current) {
      details.innerHTML =
        '<div class="muted">Không tìm thấy phiếu lương cho tháng đã chọn.</div>';
      return;
    }
    details.innerHTML = `
      <div class="ess-list-item">
        <strong>${escapeHTML(toMonthLabel(current.month))}</strong>
        <div class="ess-inline">
          <div>
            <p><strong>Lương cơ bản:</strong> ${formatVND(current.base)}</p>
            <p><strong>Thưởng / phụ cấp:</strong> ${formatVND(
              current.bonus
            )}</p>
            <p><strong>Khấu trừ khác:</strong> ${formatVND(
              current.deduction
            )}</p>
          </div>
          <div>
            <p><strong>BHXH:</strong> ${formatVND(current.bhxh)}</p>
            <p><strong>BHYT:</strong> ${formatVND(current.bhyt)}</p>
            <p><strong>BHTN:</strong> ${formatVND(current.bhtn)}</p>
          </div>
          <div>
            <p><strong>Thuế TNCN (ước tính):</strong> ${formatVND(
              current.pit
            )}</p>
            <p><strong>Phụ thuộc:</strong> ${
              current.dependents ?? 0
            } người</p>
            <p><strong>Giảm trừ phụ thuộc:</strong> ${formatVND(
              current.dependentTotal
            )}</p>
          </div>
        </div>
        <p><strong>Số ngày công tính lương:</strong> ${
          current.workingDays ?? "-"
        }</p>
        <p><strong>Thực lĩnh:</strong> <span class="amount-positive">${formatVND(
          current.net
        )}</span></p>
      </div>
    `;
  };

  return { root: section, render };
}

function buildPerformanceSection(state) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Đánh giá hiệu suất";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Theo dõi các đợt đánh giá đã hoàn thành cùng điểm trung bình.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const avgBlock = document.createElement("div");
  avgBlock.className = "ess-stat-card";
  const avgLabel = document.createElement("div");
  avgLabel.innerHTML = '<i class="fas fa-star"></i> Điểm trung bình';
  const avgValue = document.createElement("div");
  avgValue.className = "ess-stat-value";
  avgValue.textContent = "-";
  avgBlock.appendChild(avgLabel);
  avgBlock.appendChild(avgValue);
  section.appendChild(avgBlock);

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "ess-table-wrapper";
  const table = document.createElement("table");
  table.className = "table";
  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>Ngày đánh giá</th><th>Điểm</th><th>Nhận xét</th></tr>";
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  section.appendChild(tableWrapper);

  const render = () => {
    const reviews = Array.isArray(state.reviews) ? state.reviews : [];
    if (reviews.length === 0) {
      avgValue.textContent = "-";
      tbody.innerHTML =
        '<tr><td colspan="3" class="muted">Chưa có đánh giá nào.</td></tr>';
      return;
    }
    const avg =
      reviews.reduce(
        (sum, item) => sum + Number(item.rating || item.avg || 0),
        0
      ) / reviews.length;
    avgValue.textContent = avg.toFixed(2);
    tbody.innerHTML = reviews
      .map(
        (review) => `<tr>
          <td>${escapeHTML(
            formatDateDisplay(review.review_date || review.created_at)
          )}</td>
          <td><strong>${escapeHTML(String(review.rating || "-"))}</strong></td>
          <td>${escapeHTML(review.feedback || "-")}</td>
        </tr>`
      )
      .join("");
  };

  return { root: section, render };
}

function buildExpenseSection(state, handlers) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Hoàn ứng / chi phí";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Tạo đề nghị hoàn ứng chi phí công tác, mua sắm thiết bị và theo dõi trạng thái.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const form = document.createElement("form");
  form.id = "essExpenseForm";

  const dateField = document.createElement("div");
  const dateLabel = document.createElement("label");
  dateLabel.setAttribute("for", "essExpenseDate");
  dateLabel.textContent = "Ngày phát sinh";
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.id = "essExpenseDate";
  dateInput.required = true;
  dateInput.value = toDateInputValue(new Date());
  dateField.appendChild(dateLabel);
  dateField.appendChild(dateInput);

  const categoryField = document.createElement("div");
  const categoryLabel = document.createElement("label");
  categoryLabel.setAttribute("for", "essExpenseCategory");
  categoryLabel.textContent = "Loại chi phí";
  const categorySelect = document.createElement("select");
  categorySelect.id = "essExpenseCategory";
  EXPENSE_CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  categoryField.appendChild(categoryLabel);
  categoryField.appendChild(categorySelect);

  const amountField = document.createElement("div");
  const amountLabel = document.createElement("label");
  amountLabel.setAttribute("for", "essExpenseAmount");
  amountLabel.textContent = "Số tiền (VNĐ)";
  const amountInput = document.createElement("input");
  amountInput.type = "number";
  amountInput.min = "0";
  amountInput.step = "1000";
  amountInput.id = "essExpenseAmount";
  amountInput.placeholder = "VD: 2500000";
  amountInput.required = true;
  amountField.appendChild(amountLabel);
  amountField.appendChild(amountInput);

  const descriptionField = document.createElement("div");
  const descriptionLabel = document.createElement("label");
  descriptionLabel.setAttribute("for", "essExpenseDesc");
  descriptionLabel.textContent = "Mô tả";
  const descriptionInput = document.createElement("textarea");
  descriptionInput.id = "essExpenseDesc";
  descriptionInput.placeholder =
    "Nội dung chi tiết, chứng từ kèm theo (nếu có).";
  descriptionField.appendChild(descriptionLabel);
  descriptionField.appendChild(descriptionInput);

  const messageEl = document.createElement("div");
  const actions = document.createElement("div");
  actions.className = "ess-form-actions";
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "primary";
  submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Gửi đề nghị';
  actions.appendChild(submitBtn);

  form.appendChild(dateField);
  form.appendChild(categoryField);
  form.appendChild(amountField);
  form.appendChild(descriptionField);
  form.appendChild(actions);
  form.appendChild(messageEl);

  section.appendChild(form);

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "ess-table-wrapper";
  const table = document.createElement("table");
  table.className = "table";
  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>Ngày</th><th>Loại</th><th>Số tiền</th><th>Ghi chú</th><th>Trạng thái</th></tr>";
  const tbody = document.createElement("tbody");
  table.appendChild(thead);
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  section.appendChild(tableWrapper);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.innerHTML = "";
    const date = dateInput.value;
    const category = categorySelect.value;
    const amount = Number(amountInput.value || 0);
    const description = descriptionInput.value.trim();
    const errors = [];
    if (!date) errors.push("Vui lòng chọn ngày phát sinh.");
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push("Số tiền phải lớn hơn 0.");
    }
    if (description.length < 3) {
      errors.push("Mô tả cần tối thiểu 3 ký tự.");
    }
    if (errors.length > 0) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        errors.join(" ")
      )}</div>`;
      return;
    }
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    try {
      await handlers.onSubmit({ date, category, amount, description });
      amountInput.value = "";
      descriptionInput.value = "";
      messageEl.innerHTML =
        '<div class="alert success">Đã tạo đề nghị hoàn ứng.</div>';
    } catch (error) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        error?.message || "Không thể tạo đề nghị."
      )}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  });

  const render = () => {
    const rows = state.expenses;
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="muted">Chưa có đề nghị hoàn ứng nào.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((row) => {
        const status = String(row.status || "pending").toLowerCase();
        let statusClass = "badge warning";
        if (status === "approved") statusClass = "badge success";
        if (status === "rejected") statusClass = "badge danger";
        const badge = `<span class="${statusClass}"><span class="dot"></span>${escapeHTML(
          status
        )}</span>`;
        return `<tr>
            <td>${escapeHTML(formatDateDisplay(row.date))}</td>
            <td>${escapeHTML(row.category || "-")}</td>
            <td>${formatVND(row.amount || 0)}</td>
            <td>${escapeHTML(row.description || "-")}</td>
            <td>${badge}</td>
          </tr>`;
      })
      .join("");
  };

  return { root: section, render };
}

function buildDocumentsSection(state) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Kho tài liệu & chính sách";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Tổng hợp tài liệu quan trọng: nội quy, chính sách nghỉ phép, hướng dẫn quy trình.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const filterWrap = document.createElement("div");
  filterWrap.className = "ess-inline";
  const filterField = document.createElement("div");
  const filterLabel = document.createElement("label");
  filterLabel.setAttribute("for", "essDocFilter");
  filterLabel.textContent = "Phân loại";
  const filterSelect = document.createElement("select");
  filterSelect.id = "essDocFilter";
  filterField.appendChild(filterLabel);
  filterField.appendChild(filterSelect);
  filterWrap.appendChild(filterField);
  section.appendChild(filterWrap);

  const list = document.createElement("div");
  list.className = "ess-list";
  section.appendChild(list);

  filterSelect.addEventListener("change", () => {
    state.documentFilter = filterSelect.value;
    render();
  });

  const render = () => {
    const docs = Array.isArray(state.documents) ? state.documents : [];
    const categories = [
      "Tất cả",
      ...Array.from(new Set(docs.map((doc) => doc.category))).sort(),
    ];
    filterSelect.innerHTML = categories
      .map((category) => {
        const value = category === "Tất cả" ? "all" : category;
        return `<option value="${escapeHTML(value)}">${escapeHTML(
          category
        )}</option>`;
      })
      .join("");
    if (!state.documentFilter) {
      state.documentFilter = "all";
    }
    filterSelect.value = state.documentFilter;

    const filtered =
      state.documentFilter === "all"
        ? docs
        : docs.filter((doc) => doc.category === state.documentFilter);
    if (filtered.length === 0) {
      list.innerHTML =
        '<div class="muted">Không có tài liệu trong danh mục này.</div>';
      return;
    }
    list.innerHTML = filtered
      .map(
        (doc) => `<div class="ess-list-item">
        <strong>${escapeHTML(doc.title)}</strong>
        <p class="ess-subtitle">${escapeHTML(doc.category)} • Cập nhật: ${escapeHTML(
          formatDateDisplay(doc.updatedAt)
        )}</p>
        <p>${escapeHTML(doc.description || "")}</p>
        <div class="ess-list-item-actions">
          <button class="secondary" type="button" title="Xem tài liệu" data-doc-url="${escapeHTML(
            doc.url || "#"
          )}">
            <i class="fas fa-external-link-alt"></i> Xem chi tiết
          </button>
        </div>
      </div>`
      )
      .join("");

    list.querySelectorAll("button[data-doc-url]").forEach((button) => {
      button.addEventListener("click", () => {
        const url = button.getAttribute("data-doc-url");
        if (url && url !== "#") {
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          showToast(
            "Tài liệu hiện chưa có đường dẫn tải. Liên hệ HR để nhận bản mới nhất.",
            "info"
          );
        }
      });
    });
  };

  return { root: section, render };
}

function buildAssessmentSection(state, handlers) {
  const section = document.createElement("section");
  section.className = "card ess-section";

  const header = document.createElement("div");
  header.className = "ess-section-header";
  const titleWrap = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Tự đánh giá định kỳ";
  const subtitle = document.createElement("p");
  subtitle.className = "ess-subtitle";
  subtitle.textContent =
    "Chuẩn bị cho kỳ performance review bằng cách tự đánh giá điểm mạnh, điểm cần cải thiện và mục tiêu cá nhân.";
  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  section.appendChild(header);

  const form = document.createElement("form");
  form.id = "essAssessmentForm";

  const periodField = document.createElement("div");
  const periodLabel = document.createElement("label");
  periodLabel.setAttribute("for", "essAssessmentPeriod");
  periodLabel.textContent = "Kỳ đánh giá";
  const periodSelect = document.createElement("select");
  periodSelect.id = "essAssessmentPeriod";
  const currentPeriod = getCurrentQuarterPeriod();
  const periods = Array.from({ length: 6 }).map((_, idx) => {
    const date = new Date();
    const monthsBack = idx * 3;
    const periodDate = new Date(
      date.getFullYear(),
      date.getMonth() - monthsBack,
      1
    );
    const quarter = Math.floor(periodDate.getMonth() / 3) + 1;
    return `${periodDate.getFullYear()}-Q${quarter}`;
  });
  const uniquePeriods = [...new Set([currentPeriod, ...periods])];
  uniquePeriods.forEach((period) => {
    const option = document.createElement("option");
    option.value = period;
    option.textContent = period;
    periodSelect.appendChild(option);
  });
  periodSelect.value = currentPeriod;
  periodField.appendChild(periodLabel);
  periodField.appendChild(periodSelect);

  const strengthsField = document.createElement("div");
  const strengthsLabel = document.createElement("label");
  strengthsLabel.setAttribute("for", "essAssessmentStrengths");
  strengthsLabel.textContent = "Điểm mạnh nổi bật";
  const strengthsInput = document.createElement("textarea");
  strengthsInput.id = "essAssessmentStrengths";
  strengthsInput.placeholder =
    "Liệt kê những thành tựu, kỹ năng hoặc đóng góp bạn hài lòng nhất.";
  strengthsField.appendChild(strengthsLabel);
  strengthsField.appendChild(strengthsInput);

  const improveField = document.createElement("div");
  const improveLabel = document.createElement("label");
  improveLabel.setAttribute("for", "essAssessmentImprove");
  improveLabel.textContent = "Điểm cần cải thiện";
  const improveInput = document.createElement("textarea");
  improveInput.id = "essAssessmentImprove";
  improveInput.placeholder =
    "Các thách thức gặp phải, kỹ năng cần bổ sung, hỗ trợ mong muốn.";
  improveField.appendChild(improveLabel);
  improveField.appendChild(improveInput);

  const goalsField = document.createElement("div");
  const goalsLabel = document.createElement("label");
  goalsLabel.setAttribute("for", "essAssessmentGoals");
  goalsLabel.textContent = "Mục tiêu kỳ tới";
  const goalsInput = document.createElement("textarea");
  goalsInput.id = "essAssessmentGoals";
  goalsInput.placeholder =
    "Định hướng phát triển, dự án mong muốn tham gia, KPI cá nhân.";
  goalsField.appendChild(goalsLabel);
  goalsField.appendChild(goalsInput);

  const messageEl = document.createElement("div");
  const actions = document.createElement("div");
  actions.className = "ess-form-actions";
  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "primary";
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Gửi tự đánh giá';
  actions.appendChild(submitBtn);

  form.appendChild(periodField);
  form.appendChild(strengthsField);
  form.appendChild(improveField);
  form.appendChild(goalsField);
  form.appendChild(actions);
  form.appendChild(messageEl);

  section.appendChild(form);

  const historyList = document.createElement("div");
  historyList.className = "ess-list";
  section.appendChild(historyList);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageEl.innerHTML = "";
    const period = periodSelect.value;
    const strengths = strengthsInput.value.trim();
    const improvements = improveInput.value.trim();
    const goals = goalsInput.value.trim();
    const errors = [];
    if (strengths.length < 3) {
      errors.push("Điểm mạnh cần tối thiểu 3 ký tự.");
    }
    if (improvements.length < 3) {
      errors.push("Điểm cải thiện cần tối thiểu 3 ký tự.");
    }
    if (goals.length < 3) {
      errors.push("Mục tiêu cần tối thiểu 3 ký tự.");
    }
    if (errors.length > 0) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        errors.join(" ")
      )}</div>`;
      return;
    }
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    try {
      await handlers.onSubmit({ period, strengths, improvements, goals });
      strengthsInput.value = "";
      improveInput.value = "";
      goalsInput.value = "";
      messageEl.innerHTML =
        '<div class="alert success">Đã gửi tự đánh giá. Cảm ơn bạn!</div>';
    } catch (error) {
      messageEl.innerHTML = `<div class="alert error">${escapeHTML(
        error?.message || "Không thể gửi tự đánh giá."
      )}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  });

  const render = () => {
    const assessments = state.selfAssessments;
    if (!Array.isArray(assessments) || assessments.length === 0) {
      historyList.innerHTML =
        '<div class="muted">Chưa có tự đánh giá nào được lưu.</div>';
      return;
    }
    historyList.innerHTML = assessments
      .map(
        (item) => `<div class="ess-list-item">
        <strong>${escapeHTML(item.period || "")}</strong>
        <p class="ess-subtitle">Nộp: ${escapeHTML(
          formatDateDisplay(item.submittedAt)
        )}</p>
        <p><strong>Điểm mạnh:</strong> ${escapeHTML(item.strengths || "")}</p>
        <p><strong>Điểm cần cải thiện:</strong> ${escapeHTML(
          item.improvements || ""
        )}</p>
        <p><strong>Mục tiêu kỳ tới:</strong> ${escapeHTML(
          item.goals || ""
        )}</p>
        <p><strong>Trạng thái:</strong> ${escapeHTML(item.status || "submitted")}</p>
      </div>`
      )
      .join("");
  };

  return { root: section, render };
}

export const EssModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Cổng thông tin nhân viên (ESS)";
    viewEl.innerHTML = "";

    const employee = await getCurrentEmployee();
    if (!employee) {
      const card = document.createElement("div");
      card.className = "card";
      const heading = document.createElement("h3");
      heading.textContent = "Không tìm thấy hồ sơ nhân viên";
      const text = document.createElement("p");
      text.textContent =
        "Vui lòng liên hệ HR để liên kết tài khoản với hồ sơ nhân viên.";
      card.appendChild(heading);
      card.appendChild(text);
      viewEl.appendChild(card);
      return;
    }

    const attendanceFilter = getHistoryDateRange(MAX_ATTENDANCE_HISTORY_DAYS);
    const contactSnapshot = loadContactSnapshot(employee);
    const profileRequests = loadLocalArray(STORAGE_KEY_PROFILE_REQUESTS, [])
      .filter((item) => Number(item.employeeId) === Number(employee.id))
      .sort(
        (a, b) =>
          new Date(b.submittedAt || b.createdAt || 0) -
          new Date(a.submittedAt || a.createdAt || 0)
      );
    const expenses = loadLocalArray(STORAGE_KEY_EXPENSES, []).filter(
      (item) => Number(item.employeeId) === Number(employee.id)
    );
    const assessments = loadLocalArray(STORAGE_KEY_SELF_ASSESSMENTS, []).filter(
      (item) => Number(item.employeeId) === Number(employee.id)
    );

    const documents = loadDocumentLibrary();

    let profile = null;
    try {
      profile = await loadProfile(employee.id);
    } catch (error) {
      logger.warn("ess_profile_load_failed", {
        message: error?.message || "unknown",
      });
    }

    const payslips = loadPayslips(employee, profile);

    const state = {
      employee,
      profile,
      contactSnapshot,
      attendanceToday: null,
      attendanceHistory: [],
      attendanceFilter,
      leaveBalance: 0,
      leaves: [],
      profileRequests,
      expenses,
      documents,
      documentFilter: "all",
      selfAssessments: assessments,
      payslips,
      selectedPayslip: payslips[0]?.month || "",
      reviews: [],
    };

    try {
      const today = toDateInputValue(new Date());
      const todayRows = await AttendanceModule.getAttendanceReport(
        employee.id,
        today,
        today
      );
      if (Array.isArray(todayRows) && todayRows.length > 0) {
        state.attendanceToday = todayRows[todayRows.length - 1];
      }
    } catch (error) {
      logger.warn("ess_attendance_today_failed", {
        message: error?.message || "unknown",
      });
    }

    try {
      const history = await AttendanceModule.getAttendanceReport(
        employee.id,
        attendanceFilter.start,
        attendanceFilter.end
      );
      state.attendanceHistory = Array.isArray(history) ? history : [];
    } catch (error) {
      logger.warn("ess_attendance_history_failed", {
        message: error?.message || "unknown",
      });
      state.attendanceHistory = [];
    }

    const refreshLeaves = async () => {
      try {
        const res = await leaveAPI.getAll();
        const allLeaves = Array.isArray(res?.data) ? res.data : [];
        state.leaves = allLeaves
          .filter(
            (leave) => Number(leave.employee_id || leave.employeeId) === Number(employee.id)
          )
          .sort(
            (a, b) =>
              new Date(b.created_at || b.createdAt || b.start_date || 0) -
              new Date(a.created_at || a.createdAt || a.start_date || 0)
          );
      } catch (error) {
        logger.warn("ess_leaves_load_failed", {
          message: error?.message || "unknown",
        });
        state.leaves = [];
      }
      try {
        const balance = await LeaveModule.getLeaveBalance(employee.id);
        state.leaveBalance = Number.isFinite(balance) ? balance : 0;
      } catch (error) {
        logger.warn("ess_leave_balance_failed", {
          message: error?.message || "unknown",
        });
      }
    };

    await refreshLeaves();

    try {
      const res = await reviewAPI.getAll();
      const reviews = Array.isArray(res?.data) ? res.data : [];
      state.reviews = reviews
        .filter(
          (review) =>
            Number(review.employee_id || review.employeeId) === Number(employee.id)
        )
        .sort(
          (a, b) =>
            new Date(b.review_date || b.created_at || 0) -
            new Date(a.review_date || a.created_at || 0)
        );
    } catch (error) {
      logger.warn("ess_reviews_load_failed", {
        message: error?.message || "unknown",
      });
      state.reviews = [];
    }

    const container = document.createElement("div");
    container.className = "ess-container";

    let dashboardSection;
    let personalSection;
    let attendanceSection;
    let leaveSection;
    let payslipSection;
    let performanceSection;
    let expenseSection;
    let documentsSection;
    let assessmentSection;

    const handleProfileUpdate = async ({ phone, address }) => {
      const record = {
        id: Date.now(),
        employeeId: employee.id,
        phone,
        address,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
      const all = loadLocalArray(STORAGE_KEY_PROFILE_REQUESTS, []);
      all.push(record);
      saveLocalArray(STORAGE_KEY_PROFILE_REQUESTS, all);
      state.profileRequests = all
        .filter((item) => Number(item.employeeId) === Number(employee.id))
        .sort(
          (a, b) =>
            new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
        );
      pushNotification({
        type: "profile_update",
        title: "Yêu cầu cập nhật thông tin",
        message: `${escapeHTML(
          employee.name || `Mã #${employee.id}`
        )} đề nghị cập nhật địa chỉ/SĐT.`,
      });
      personalSection.render();
      dashboardSection.render();
      showToast("Đã gửi yêu cầu cập nhật thông tin.", "success");
    };

    const handleAttendanceFilter = async ({ start, end }) => {
      state.attendanceFilter = { start, end };
      try {
        const rows = await AttendanceModule.getAttendanceReport(
          employee.id,
          start,
          end
        );
        state.attendanceHistory = Array.isArray(rows) ? rows : [];
      } catch (error) {
        logger.warn("ess_attendance_filter_failed", {
          message: error?.message || "unknown",
        });
        throw error;
      } finally {
        attendanceSection.render();
      }
    };

    const handleLeaveSubmit = async ({ start, end, reason, type }) => {
      try {
        await leaveAPI.create({
          employee_id: employee.id,
          start_date: start,
          end_date: end,
          reason,
          type,
        });
        pushNotification({
          type: "leave_request",
          title: "Đơn nghỉ phép mới",
          message: `${escapeHTML(
            employee.name || `Mã #${employee.id}`
          )} xin nghỉ từ ${start} đến ${end}.`,
        });
        await refreshLeaves();
        leaveSection.render();
        dashboardSection.render();
        showToast("Đã gửi đơn nghỉ phép thành công.", "success");
      } catch (error) {
        logger.warn("ess_leave_submit_failed", {
          message: error?.message || "unknown",
        });
        throw error;
      }
    };

    const handleExpenseSubmit = async ({
      date,
      category,
      amount,
      description,
    }) => {
      const record = {
        id: Date.now(),
        employeeId: employee.id,
        date,
        category,
        amount,
        description,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
      const all = loadLocalArray(STORAGE_KEY_EXPENSES, []);
      all.push(record);
      saveLocalArray(STORAGE_KEY_EXPENSES, all);
      state.expenses = all
        .filter((item) => Number(item.employeeId) === Number(employee.id))
        .sort(
          (a, b) =>
            new Date(b.submittedAt || b.date || 0) -
            new Date(a.submittedAt || a.date || 0)
        );
      pushNotification({
        type: "expense_claim",
        title: "Đề nghị hoàn ứng mới",
        message: `${escapeHTML(
          employee.name || `Mã #${employee.id}`
        )} gửi đề nghị hoàn ứng ${formatVND(amount)}.`,
      });
      expenseSection.render();
      showToast("Đã tạo đề nghị hoàn ứng.", "success");
    };

    const handleAssessmentSubmit = async ({
      period,
      strengths,
      improvements,
      goals,
    }) => {
      const record = {
        id: Date.now(),
        employeeId: employee.id,
        period,
        strengths,
        improvements,
        goals,
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };
      const all = loadLocalArray(STORAGE_KEY_SELF_ASSESSMENTS, []);
      all.push(record);
      saveLocalArray(STORAGE_KEY_SELF_ASSESSMENTS, all);
      state.selfAssessments = all
        .filter((item) => Number(item.employeeId) === Number(employee.id))
        .sort(
          (a, b) =>
            new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
        );
      assessmentSection.render();
      showToast("Đã lưu tự đánh giá cá nhân.", "success");
    };

    dashboardSection = buildDashboardSection(state);
    personalSection = buildPersonalInfoSection(state, {
      onSubmit: handleProfileUpdate,
    });
    attendanceSection = buildAttendanceSection(state, {
      onFilter: handleAttendanceFilter,
    });
    leaveSection = buildLeaveSection(state, { onSubmit: handleLeaveSubmit });
    payslipSection = buildPayslipSection(state);
    performanceSection = buildPerformanceSection(state);
    expenseSection = buildExpenseSection(state, {
      onSubmit: handleExpenseSubmit,
    });
    documentsSection = buildDocumentsSection(state);
    assessmentSection = buildAssessmentSection(state, {
      onSubmit: handleAssessmentSubmit,
    });

    container.appendChild(dashboardSection.root);

    const gridPrimary = document.createElement("div");
    gridPrimary.className = "ess-grid ess-grid--wide";
    gridPrimary.appendChild(personalSection.root);
    gridPrimary.appendChild(leaveSection.root);
    container.appendChild(gridPrimary);

    const gridSecondary = document.createElement("div");
    gridSecondary.className = "ess-grid ess-grid--wide";
    gridSecondary.appendChild(attendanceSection.root);
    gridSecondary.appendChild(payslipSection.root);
    container.appendChild(gridSecondary);

    const gridTertiary = document.createElement("div");
    gridTertiary.className = "ess-grid ess-grid--wide";
    gridTertiary.appendChild(performanceSection.root);
    gridTertiary.appendChild(expenseSection.root);
    container.appendChild(gridTertiary);

    const gridFinal = document.createElement("div");
    gridFinal.className = "ess-grid ess-grid--wide";
    gridFinal.appendChild(documentsSection.root);
    gridFinal.appendChild(assessmentSection.root);
    container.appendChild(gridFinal);

    viewEl.appendChild(container);

    dashboardSection.render();
    personalSection.render();
    attendanceSection.render();
    leaveSection.render();
    payslipSection.render();
    performanceSection.render();
    expenseSection.render();
    documentsSection.render();
    assessmentSection.render();
  },
};
