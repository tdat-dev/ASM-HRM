import { AuthModule } from "./modules/auth-module.js";
import { EmployeeDb } from "./modules/employee-db-module.js";
import { AddEmployeeModule } from "./modules/add-employee-module.js";
import { EditEmployeeModule } from "./modules/edit-employee-module.js";
import { DeleteEmployeeModule } from "./modules/delete-employee-module.js";
import { SearchEmployeeModule } from "./modules/search-employee-module.js";
import { DepartmentModule } from "./modules/department-module.js";
import { PositionModule } from "./modules/position-module.js";
import { SalaryModule } from "./modules/salary-module.js";
import { AttendanceModule } from "./modules/attendance-module.js";
import { LeaveModule } from "./modules/leave-module.js";
import { PerformanceModule } from "./modules/performance-module.js";
import { EssModule } from "./modules/ess-module.js";
import { RecruitmentModule } from "./modules/recruitment-module.js";
import { OnboardingModule } from "./modules/onboarding-module.js";
import { PayrollModule } from "./modules/payroll-module.js";
import { ReportsModule } from "./modules/reports-module.js";
import { NotificationsModule } from "./modules/notifications-module.js";
import { CoreHrModule } from "./modules/core-hr-module.js";
import { DirectoryModule } from "./modules/directory-module.js";
import { OrgChartModule } from "./modules/org-chart-module.js";
import { escapeHTML } from "./utils/dom.js";

const viewEl = document.getElementById("view");
const pageTitleEl = document.getElementById("pageTitle");
const logoutBtn = document.getElementById("logoutBtn");
const appEl = document.getElementById("app");
const themeToggleBtn = document.getElementById("themeToggle");
const notifyToggleBtn = document.getElementById("notifyToggle");
const notifyBadge = document.getElementById("notifyBadge");
const notifyCountEl = document.getElementById("notifyCount");
const notifyPanel = document.getElementById("notifyPanel");
const notifyList = document.getElementById("notifyList");
const notifyClose = document.getElementById("notifyClose");
const notifyMarkAll = document.getElementById("notifyMarkAll");
const sidebarToggleBtn = document.getElementById("sidebarToggle");
const sidebar = document.querySelector(".sidebar");

const THEME_KEY = "hrm_theme";
const SIDEBAR_KEY = "hrm_sidebar_collapsed";
const LAST_ROUTE_KEY = "hrm_last_route";

// Lọc menu theo role
function applyRoleUI(role) {
  // Default: cho phép mọi route hiện có
  const defaultAllowed = Object.keys(routes);
  /** @type {Record<string, string[]>} */
  const roleAllowed = {
    admin: defaultAllowed,
    hr: defaultAllowed,
    manager: [
      "dashboard",
      "employees-search",
      "directory",
      "departments",
      "positions",
      "attendance",
      "leave",
      "performance",
    ],
    employee: [
      "dashboard",
      "attendance",
      "leave",
      "ess",
      "directory",
      "performance",
    ],
  };
  const allowed = roleAllowed[role] || roleAllowed.employee;
  // Lưu để navigate có thể kiểm tra
  try {
    localStorage.setItem("hrm_allowed_routes", JSON.stringify(allowed));
  } catch {}

  // Ẩn các nút không thuộc allowed
  document.querySelectorAll(".menu [data-route]").forEach((btn) => {
    const r = btn.getAttribute("data-route");
    const shouldShow = allowed.includes(r);
    btn.toggleAttribute("hidden", !shouldShow);
    btn.classList.toggle("is-hidden", !shouldShow);
    if (!shouldShow) {
      btn.setAttribute("aria-hidden", "true");
      btn.setAttribute("tabindex", "-1");
    } else {
      btn.removeAttribute("aria-hidden");
      btn.removeAttribute("tabindex");
    }
  });
}

// Áp dụng theme sáng/tối bằng cách thêm class vào document
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("theme-dark");
  } else {
    root.classList.remove("theme-dark");
  }
  localStorage.setItem(THEME_KEY, theme);
  // Cập nhật icon trên nút theme (trăng / mặt trời)
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML =
      theme === "dark"
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
    themeToggleBtn.setAttribute(
      "title",
      theme === "dark" ? "Chuyển sang Light" : "Chuyển sang Dark"
    );
  }
}

// Toggle sidebar collapsed/expanded
function toggleSidebar() {
  sidebar.classList.toggle("collapsed");
  const isCollapsed = sidebar.classList.contains("collapsed");
  localStorage.setItem(SIDEBAR_KEY, isCollapsed);
}

// Load sidebar state
function loadSidebarState() {
  const isCollapsed = localStorage.getItem(SIDEBAR_KEY) === "true";
  if (isCollapsed) {
    sidebar.classList.add("collapsed");
  }
}

// Khởi động cơ chế theme: đọc lựa chọn trước đó hoặc theo hệ thống
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);

  // Lắng nghe thay đổi theme của hệ thống
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    // Chỉ tự động đổi theme nếu chưa có lựa chọn trong localStorage
    const handleThemeChange = (e) => {
      if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
      }
    };
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleThemeChange);
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.contains("theme-dark");
      const next = isDark ? "light" : "dark";
      applyTheme(next);
    });
  }

  // Sidebar toggle
  loadSidebarState();
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", toggleSidebar);
  }
}

// Cập nhật badge thông báo (số chưa đọc)
function updateNotificationBadge() {
  try {
    const raw = localStorage.getItem("hrm_notifications") || "[]";
    const items = JSON.parse(raw);
    const unread = Array.isArray(items)
      ? items.filter((n) => !n.read).length
      : 0;
    if (unread > 0) {
      if (notifyBadge) notifyBadge.classList.remove("is-hidden");
      if (notifyCountEl) notifyCountEl.textContent = String(unread);
    } else {
      if (notifyBadge) notifyBadge.classList.add("is-hidden");
    }
  } catch {
    if (notifyBadge) notifyBadge.classList.add("is-hidden");
  }
}

function renderNotifyPanel() {
  try {
    const raw = localStorage.getItem("hrm_notifications") || "[]";
    const items = JSON.parse(raw);
    if (!notifyList) return;
    if (!Array.isArray(items) || items.length === 0) {
      notifyList.innerHTML = `<div class="muted">Không có thông báo nào.</div>`;
      return;
    }
    notifyList.innerHTML = items
      .slice()
      .sort((a, b) => (b.createdAt || 0).localeCompare?.(a.createdAt || 0) || 0)
      .map(
        (n) => `
        <div class="notify-item ${n.read ? "" : "unread"}">
          <div style="display:flex; justify-content: space-between; gap:8px; align-items: center;">
            <div style="font-weight:700;">${escapeHTML(
              n.title || "Thông báo"
            )}</div>
            <button class="secondary" data-id="${String(
              Number(n.id) || ""
            )}" data-action="mark" title="Đánh dấu đã đọc"><i class="fas fa-check"></i></button>
          </div>
          <div style="margin-top:6px;">${escapeHTML(n.message || "")}</div>
          <div class="meta">${new Date(
            n.createdAt || Date.now()
          ).toLocaleString()}</div>
        </div>
      `
      )
      .join("");
    // bind buttons
    notifyList.querySelectorAll("button[data-action='mark']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        const arr = JSON.parse(
          localStorage.getItem("hrm_notifications") || "[]"
        );
        const item = arr.find((x) => x.id === id);
        if (item) item.read = true;
        localStorage.setItem("hrm_notifications", JSON.stringify(arr));
        updateNotificationBadge();
        renderNotifyPanel();
      });
    });
  } catch (e) {
    if (notifyList)
      notifyList.innerHTML = `<div class="muted">Không thể tải thông báo.</div>`;
  }
}

// Định nghĩa các route và hàm mount tương ứng
const routes = {
  dashboard: async () => {
    pageTitleEl.textContent = "Dashboard";
    viewEl.innerHTML =
      '<div style="text-align: center; padding: 40px;"><p>⏳ Đang tải dữ liệu...</p></div>';

    try {
      // Lấy dữ liệu (AWAIT API calls)
      const employees = await EmployeeDb.getAllEmployees();
      const departments = await EmployeeDb.getAllDepartments();
      const positions = await EmployeeDb.getAllPositions();

      // Kiểm tra dữ liệu có tồn tại không
      if (!Array.isArray(employees)) {
        throw new Error(
          "Không thể tải danh sách nhân viên. Vui lòng kiểm tra kết nối API."
        );
      }
      if (!Array.isArray(departments)) {
        throw new Error(
          "Không thể tải danh sách phòng ban. Vui lòng kiểm tra kết nối API."
        );
      }
      if (!Array.isArray(positions)) {
        throw new Error(
          "Không thể tải danh sách vị trí. Vui lòng kiểm tra kết nối API."
        );
      }
      const attendanceData = JSON.parse(
        localStorage.getItem("hrm_attendance") || "[]"
      );
      const leaveData = JSON.parse(localStorage.getItem("hrm_leaves") || "[]");

      // Chuẩn hóa tiền tệ (API trả về dạng string, đôi khi kèm ký tự)
      const normalizeMoney = (value) => {
        if (value === null || value === undefined) {
          return 0;
        }
        const cleaned =
          typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value;
        const number = Number(cleaned);
        return Number.isFinite(number) ? number : 0;
      };

      // Tính toán thống kê
      const totalEmployees = employees.length;
      const totalDepartments = departments.length;
      const totalPositions = positions.length;
      const avgSalary =
        employees.length > 0
          ? Math.round(
              employees.reduce(
                (sum, emp) => sum + normalizeMoney(emp.salary),
                0
              ) / employees.length
            )
          : 0;

      const today = new Date().toISOString().slice(0, 10);
      const todayAttendance = attendanceData.filter(
        (a) => a.date === today
      ).length;

      const pendingLeaves = leaveData.filter(
        (l) => l.status === "pending"
      ).length;

      // Tính tổng chi phí lương hàng tháng
      const totalMonthlyCost = employees.reduce((sum, emp) => {
        const salary = normalizeMoney(emp.salary);
        const bonus = normalizeMoney(emp.bonus);
        const deduction = normalizeMoney(emp.deduction);
        return sum + salary + bonus - deduction;
      }, 0);

      // Thống kê nhân viên theo phòng ban
      const empsByDept = departments.map((dept) => {
        const count = employees.filter(
          (emp) => emp.departmentId === dept.id
        ).length;
        return { name: dept.name, count };
      });

      // Dashboard HTML với grid layout
      const dashboardHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: var(--shadow-lg);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Tổng Nhân viên</div>
          <div style="font-size: 36px; font-weight: 800;">${totalEmployees}</div>
          <div style="font-size: 13px; opacity: 0.8; margin-top: 8px;">Đang hoạt động</div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: var(--shadow-lg);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Phòng ban</div>
          <div style="font-size: 36px; font-weight: 800;">${totalDepartments}</div>
          <div style="font-size: 13px; opacity: 0.8; margin-top: 8px;">${totalPositions} vị trí</div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: var(--shadow-lg);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Lương TB</div>
          <div style="font-size: 36px; font-weight: 800;">${avgSalary.toLocaleString()}</div>
          <div style="font-size: 13px; opacity: 0.8; margin-top: 8px;">VNĐ/tháng</div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 24px; border-radius: 16px; box-shadow: var(--shadow-lg);">
          <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">Chấm công hôm nay</div>
          <div style="font-size: 36px; font-weight: 800;">${todayAttendance}</div>
          <div style="font-size: 13px; opacity: 0.8; margin-top: 8px;">${
            totalEmployees - todayAttendance
          } chưa check-in</div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
        <div class="card">
          <h3 style="margin-top: 0;">📊 Nhân viên theo Phòng ban</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${empsByDept
              .map(
                (dept) => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--primary-light); border-radius: 8px;">
                <span style="font-weight: 600;">${dept.name}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="background: var(--primary); color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600;">
                    ${dept.count}
                  </div>
                  <div style="width: ${Math.max(
                    100,
                    dept.count * 20
                  )}px; height: 8px; background: var(--primary); border-radius: 4px;"></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        
        <div class="card">
          <h3 style="margin-top: 0;">💰 Thống kê Tài chính</h3>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="padding: 16px; background: #f0fdf4; border-left: 4px solid var(--success); border-radius: 8px;">
              <div style="color: var(--muted); font-size: 13px; margin-bottom: 4px;">Tổng chi phí lương/tháng</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--success);">${totalMonthlyCost.toLocaleString()} VNĐ</div>
            </div>
            
            <div style="padding: 16px; background: #fef3c7; border-left: 4px solid var(--warning); border-radius: 8px;">
              <div style="color: var(--muted); font-size: 13px; margin-bottom: 4px;">Yêu cầu nghỉ phép chờ duyệt</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--warning);">${pendingLeaves}</div>
            </div>
            
            <div style="padding: 16px; background: #dbeafe; border-left: 4px solid var(--primary); border-radius: 8px;">
              <div style="color: var(--muted); font-size: 13px; margin-bottom: 4px;">Chi phí trung bình/nhân viên</div>
              <div style="font-size: 28px; font-weight: 700; color: var(--primary);">${
                totalEmployees > 0
                  ? Math.round(
                      totalMonthlyCost / totalEmployees
                    ).toLocaleString()
                  : 0
              } VNĐ</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3 style="margin-top: 0;">👥 Nhân viên gần đây</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Tên</th>
              <th>Phòng ban</th>
              <th>Vị trí</th>
              <th>Lương</th>
              <th>Ngày vào làm</th>
            </tr>
          </thead>
          <tbody>
            ${employees
              .slice(-5)
              .reverse()
              .map((emp) => {
                const dept =
                  departments.find((d) => d.id === emp.departmentId)?.name ||
                  "-";
                const pos =
                  positions.find((p) => p.id === emp.positionId)?.title || "-";
                return `
                <tr>
                  <td><span style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 12px;">#${
                    emp.id
                  }</span></td>
                  <td><strong>${escapeHTML(emp.name || "")}</strong></td>
                  <td>${escapeHTML(dept)}</td>
                  <td>${escapeHTML(pos)}</td>
                  <td>${(emp.salary || 0).toLocaleString()} VNĐ</td>
                  <td>${escapeHTML(emp.hireDate || "-")}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

      viewEl.innerHTML = dashboardHTML;
    } catch (error) {
      // Nếu lỗi 401 Unauthorized, redirect về login
      if (error.message && error.message.includes("Unauthorized")) {
        showAuth();
        return;
      }
      // Lỗi khác, hiển thị thông báo chi tiết
      const errorMessage = escapeHTML(
        error.message || "Đã xảy ra lỗi không xác định"
      );
      viewEl.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <div class="alert error">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Lỗi tải dữ liệu:</strong> ${errorMessage}
          </div>
          <p style="margin-top: 20px; color: var(--muted);">
            Vui lòng kiểm tra:
            <br>• Backend API có đang chạy không?
            <br>• Kết nối database có ổn định không?
            <br>• Dữ liệu có tồn tại trong database không?
          </p>
          <button id="reloadBtn" class="primary" style="margin-top: 20px;">
            <i class="fas fa-sync-alt"></i> Tải lại trang
          </button>
        </div>
      `;
      const reloadBtn = document.getElementById("reloadBtn");
      if (reloadBtn) {
        reloadBtn.addEventListener("click", () => location.reload());
      }
    }
  },
  "employees-add": () => AddEmployeeModule.mount(viewEl, pageTitleEl),
  "employees-edit": () => EditEmployeeModule.mount(viewEl, pageTitleEl),
  "employees-delete": () => DeleteEmployeeModule.mount(viewEl, pageTitleEl),
  "employees-search": () => SearchEmployeeModule.mount(viewEl, pageTitleEl),
  departments: () => DepartmentModule.mount(viewEl, pageTitleEl),
  positions: () => PositionModule.mount(viewEl, pageTitleEl),
  // Salary page routes to Payroll to keep only the payroll table view
  salary: () => PayrollModule.mount(viewEl, pageTitleEl),
  attendance: () => AttendanceModule.mount(viewEl, pageTitleEl),
  leave: () => LeaveModule.mount(viewEl, pageTitleEl),
  performance: () => PerformanceModule.mount(viewEl, pageTitleEl),
  ess: () => EssModule.mount(viewEl, pageTitleEl),
  recruitment: () => RecruitmentModule.mount(viewEl, pageTitleEl),
  onboarding: () => OnboardingModule.mount(viewEl, pageTitleEl),
  payroll: () => PayrollModule.mount(viewEl, pageTitleEl),
  reports: () => ReportsModule.mount(viewEl, pageTitleEl),
  notifications: () => NotificationsModule.mount(viewEl, pageTitleEl),
  "core-hr": () => CoreHrModule.mount(viewEl, pageTitleEl),
  directory: () => DirectoryModule.mount(viewEl, pageTitleEl),
  "org-chart": () => OrgChartModule.mount(viewEl, pageTitleEl),
};

// Gắn sự kiện cho menu sidebar
function registerMenuHandlers() {
  document.querySelectorAll(".menu [data-route]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await navigate(btn.getAttribute("data-route"));
    });
  });
}

// Đánh dấu menu đang hoạt động theo route hiện tại
function setActive(route) {
  document.querySelectorAll(".menu [data-route]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-route") === route);
  });
}

// Điều hướng SPA tới route, đồng thời kích hoạt hàm mount tương ứng
async function navigate(route) {
  // Kiểm tra session trước khi cho phép điều hướng
  const session = await AuthModule.getSession();
  if (!session) {
    // Nếu chưa đăng nhập, hiển thị màn hình login
    showAuth();
    return;
  }

  // Kiểm tra route có được phép theo role hiện tại không
  try {
    const raw = localStorage.getItem("hrm_allowed_routes") || "[]";
    const allowed = JSON.parse(raw);
    if (Array.isArray(allowed) && !allowed.includes(route)) {
      route = "dashboard";
    }
  } catch {}

  const fn = routes[route] || routes.dashboard;
  setActive(route);
  try {
    localStorage.setItem(LAST_ROUTE_KEY, route);
  } catch {}
  fn();
}

// Khởi tạo ứng dụng: theme, dữ liệu demo, menu, session
async function init() {
  initTheme();
  registerMenuHandlers();

  // Global auth required handler
  window.addEventListener("auth-required", () => {
    showAuth();
  });

  logoutBtn.addEventListener("click", async () => {
    await AuthModule.logout();
    showAuth();
  });

  // Cập nhật tên và vai trò trong sidebar
  try {
    const session = await AuthModule.getSession();
    if (session) {
      const nameEl = document.getElementById("userName");
      const roleEl = document.querySelector(".user-info .user-role");
      if (nameEl) nameEl.textContent = session.username || "User";
      if (roleEl) {
        const roleLabel =
          session.role === "admin"
            ? "Quản trị viên"
            : session.role === "hr"
            ? "Nhân sự"
            : session.role === "manager"
            ? "Quản lý"
            : "Nhân viên";
        roleEl.textContent = roleLabel;
      }
    }
  } catch {}

  // Nút chuông thông báo → mở panel nổi
  if (notifyToggleBtn) {
    notifyToggleBtn.addEventListener("click", async () => {
      if (!notifyPanel) return;
      const hidden = notifyPanel.classList.contains("is-hidden");
      if (hidden) {
        renderNotifyPanel();
        notifyPanel.classList.remove("is-hidden");
      } else {
        notifyPanel.classList.add("is-hidden");
      }
    });
  }
  if (notifyClose) {
    notifyClose.addEventListener("click", () => {
      if (notifyPanel) notifyPanel.classList.add("is-hidden");
    });
  }
  if (notifyMarkAll) {
    notifyMarkAll.addEventListener("click", () => {
      try {
        const arr = JSON.parse(
          localStorage.getItem("hrm_notifications") || "[]"
        );
        const next = Array.isArray(arr)
          ? arr.map((n) => ({ ...n, read: true }))
          : [];
        localStorage.setItem("hrm_notifications", JSON.stringify(next));
        updateNotificationBadge();
        renderNotifyPanel();
      } catch {}
    });
  }
  // Cập nhật badge khởi tạo + theo chu kỳ
  updateNotificationBadge();
  setInterval(updateNotificationBadge, 5000);

  // Mặc định hiển thị màn hình login trước
  showAuth();

  // Kiểm tra session (AWAIT để đợi kết quả)
  const session = await AuthModule.getSession();
  if (session) {
    // Nếu đã đăng nhập, hiển thị app
    showApp();
    // Áp dụng quyền theo role lên UI (ẩn menu không dùng)
    applyRoleUI(session.role);
    let last = "dashboard";
    try {
      const stored = localStorage.getItem(LAST_ROUTE_KEY);
      if (stored && routes[stored]) last = stored;
    } catch {}
    await navigate(last);
  }
  // Nếu chưa đăng nhập, giữ nguyên màn hình login
}

// Hiển thị màn hình đăng nhập và xử lý form auth
function showAuth() {
  appEl.classList.add("auth");
  pageTitleEl.textContent = "";
  viewEl.innerHTML = "";
  const container = document.createElement("div");
  container.className = "card auth-container";
  container.innerHTML = `
    <h1>Chào mừng 👋</h1>
    <p id="authSubtitle">Đăng nhập để truy cập hệ thống HRM</p>

    <div class="auth-tabs">
      <button id="showLogin" class="primary">
        <i class="fas fa-sign-in-alt"></i> Đăng nhập
      </button>
      <button id="showRegister" class="secondary">
        <i class="fas fa-user-plus"></i> Đăng ký
      </button>
    </div>

    <form id="authForm" autocomplete="off">
      <div id="field-username" class="auth-field">
        <label>
          <i class="fas fa-user"></i> Tên đăng nhập
          <span class="required">*</span>
        </label>
        <input 
          id="username" 
          type="text"
          autocomplete="username"
          placeholder="Nhập tên đăng nhập"
          required 
        />
        <div id="username-helper" class="auth-helper"></div>
      </div>

      <div id="field-password" class="auth-field">
        <label>
          <i class="fas fa-lock"></i> Mật khẩu
          <span class="required">*</span>
        </label>
        <div class="password-wrapper">
          <input 
            id="password" 
            type="password"
            autocomplete="current-password"
            placeholder="Nhập mật khẩu"
            required 
          />
          <button type="button" class="password-toggle" id="passwordToggle" title="Hiện/ẩn mật khẩu" aria-label="Hiện/ẩn mật khẩu">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        <div id="password-strength" class="password-strength is-hidden">
          <div class="password-strength-bar"></div>
        </div>
        <div id="password-helper" class="auth-helper"></div>
      </div>

      <div id="field-confirm" class="auth-field hidden">
        <label>
          <i class="fas fa-lock"></i> Xác nhận mật khẩu
          <span class="required">*</span>
        </label>
        <div class="password-wrapper">
          <input 
            id="passwordConfirm" 
            type="password"
            autocomplete="new-password"
            placeholder="Nhập lại mật khẩu"
          />
          <button type="button" class="password-toggle" id="passwordConfirmToggle" title="Hiện/ẩn mật khẩu" aria-label="Hiện/ẩn mật khẩu">
            <i class="fas fa-eye"></i>
          </button>
        </div>
        <div id="confirm-helper" class="auth-helper"></div>
      </div>

      <div class="auth-actions">
        <button type="submit" id="authSubmit" class="primary">
          <i class="fas fa-sign-in-alt"></i> Đăng nhập
        </button>
        <button type="button" id="authCancel" class="secondary is-hidden" title="Quay lại đăng nhập">
          <i class="fas fa-arrow-left"></i> Quay lại
        </button>
      </div>

      <div id="loginAlert" class="auth-alert"></div>
    </form>
  `;
  viewEl.appendChild(container);

  // Elements
  const form = document.getElementById("authForm");
  const alertEl = document.getElementById("loginAlert");
  const showLoginBtn = document.getElementById("showLogin");
  const showRegisterBtn = document.getElementById("showRegister");
  const fieldConfirm = document.getElementById("field-confirm");
  const authSubmit = document.getElementById("authSubmit");
  const authCancel = document.getElementById("authCancel");
  const authSubtitle = document.getElementById("authSubtitle");
  const passwordInput = document.getElementById("password");
  const passwordConfirmInput = document.getElementById("passwordConfirm");
  const usernameHelper = document.getElementById("username-helper");
  const passwordHelper = document.getElementById("password-helper");
  const confirmHelper = document.getElementById("confirm-helper");
  const passwordStrength = document.getElementById("password-strength");
  const passwordStrengthBar = passwordStrength.querySelector(
    ".password-strength-bar"
  );
  const passwordToggle = document.getElementById("passwordToggle");
  const passwordConfirmToggle = document.getElementById(
    "passwordConfirmToggle"
  );

  // Mode: 'login' or 'register'
  let mode = "login";

  // Password toggle visibility handlers
  function togglePasswordVisibility(input, toggleBtn) {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    const icon = toggleBtn.querySelector("i");
    if (isPassword) {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
      toggleBtn.setAttribute("title", "Ẩn mật khẩu");
      toggleBtn.setAttribute("aria-label", "Ẩn mật khẩu");
    } else {
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
      toggleBtn.setAttribute("title", "Hiện mật khẩu");
      toggleBtn.setAttribute("aria-label", "Hiện mật khẩu");
    }
  }

  passwordToggle.addEventListener("click", () => {
    togglePasswordVisibility(passwordInput, passwordToggle);
  });

  passwordConfirmToggle.addEventListener("click", () => {
    togglePasswordVisibility(passwordConfirmInput, passwordConfirmToggle);
  });

  // Password strength checker
  function checkPasswordStrength(password) {
    if (!password) return { strength: "", score: 0 };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 2) return { strength: "weak", score, text: "Yếu" };
    if (score <= 3) return { strength: "medium", score, text: "Trung bình" };
    return { strength: "strong", score, text: "Mạnh" };
  }

  // Real-time password validation
  passwordInput.addEventListener("input", () => {
    const password = passwordInput.value;

    if (mode === "register" && password) {
      passwordStrength.classList.remove("is-hidden");
      const result = checkPasswordStrength(password);
      passwordStrengthBar.className = `password-strength-bar ${result.strength}`;

      if (password.length < 8) {
        passwordHelper.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> Mật khẩu phải có ít nhất 8 ký tự';
        passwordHelper.className = "auth-helper error";
      } else {
        passwordHelper.innerHTML = `<i class="fas fa-check-circle"></i> Độ mạnh: ${result.text}`;
        passwordHelper.className = "auth-helper success";
      }
    } else {
      passwordStrength.classList.add("is-hidden");
      passwordHelper.textContent = "";
    }

    // Check confirm match
    if (passwordConfirmInput.value) {
      validatePasswordMatch();
    }
  });

  // Real-time confirm password validation
  passwordConfirmInput.addEventListener("input", validatePasswordMatch);

  function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirm = passwordConfirmInput.value;

    if (!confirm) {
      confirmHelper.textContent = "";
      return;
    }

    if (password === confirm) {
      confirmHelper.innerHTML =
        '<i class="fas fa-check-circle"></i> Mật khẩu khớp';
      confirmHelper.className = "auth-helper success";
    } else {
      confirmHelper.innerHTML =
        '<i class="fas fa-times-circle"></i> Mật khẩu không khớp';
      confirmHelper.className = "auth-helper error";
    }
  }

  // Username validation
  document.getElementById("username").addEventListener("input", (e) => {
    const username = e.target.value.trim();
    if (username && username.length < 3) {
      usernameHelper.innerHTML =
        '<i class="fas fa-exclamation-circle"></i> Tên đăng nhập phải có ít nhất 3 ký tự';
      usernameHelper.className = "auth-helper error";
    } else if (username) {
      usernameHelper.innerHTML = '<i class="fas fa-check-circle"></i> Hợp lệ';
      usernameHelper.className = "auth-helper success";
    } else {
      usernameHelper.textContent = "";
      usernameHelper.className = "auth-helper";
    }
  });

  function setMode(m) {
    mode = m;
    alertEl.innerHTML = "";
    passwordHelper.textContent = "";
    confirmHelper.textContent = "";
    usernameHelper.textContent = "";
    passwordStrength.classList.add("is-hidden");

    if (mode === "login") {
      fieldConfirm.classList.add("hidden");
      authSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
      authCancel.classList.add("is-hidden");
      authSubtitle.textContent = "Đăng nhập để truy cập hệ thống HRM";
      passwordInput.setAttribute("autocomplete", "current-password");
      passwordConfirmInput.value = "";
      showLoginBtn.classList.add("primary");
      showLoginBtn.classList.remove("secondary");
      showRegisterBtn.classList.add("secondary");
      showRegisterBtn.classList.remove("primary");
    } else {
      fieldConfirm.classList.remove("hidden");
      authSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Đăng ký';
      authCancel.classList.remove("is-hidden");
      authSubtitle.textContent = "Tạo tài khoản mới • Miễn phí";
      passwordInput.setAttribute("autocomplete", "new-password");
      showRegisterBtn.classList.add("primary");
      showRegisterBtn.classList.remove("secondary");
      showLoginBtn.classList.add("secondary");
      showLoginBtn.classList.remove("primary");
    }
  }

  showLoginBtn.addEventListener("click", () => setMode("login"));
  showRegisterBtn.addEventListener("click", () => setMode("register"));
  authCancel.addEventListener("click", () => setMode("login"));

  // Initialize
  setMode("login");

  // Form submit handler (both login and register)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;

    // Clear previous alerts
    alertEl.innerHTML = "";

    // Enhanced validation
    if (!username || !password) {
      alertEl.innerHTML =
        '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Vui lòng nhập đủ thông tin bắt buộc</div>';
      document.getElementById("username").focus();
      return;
    }

    if (username.length < 3) {
      alertEl.innerHTML =
        '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Tên đăng nhập phải có ít nhất 3 ký tự</div>';
      document.getElementById("username").focus();
      return;
    }

    if (mode === "register") {
      if (password.length < 8) {
        alertEl.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Mật khẩu phải có ít nhất 8 ký tự</div>';
        passwordInput.focus();
        return;
      }

      const strength = checkPasswordStrength(password);
      if (strength.score < 2) {
        alertEl.innerHTML =
          '<div class="alert warning"><i class="fas fa-shield-alt"></i> Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn (gồm chữ hoa, chữ thường, số và ký tự đặc biệt)</div>';
        passwordInput.focus();
        return;
      }

      if (password !== passwordConfirm) {
        alertEl.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Mật khẩu xác nhận không khớp</div>';
        passwordConfirmInput.focus();
        return;
      }

      // Disable submit button and show loading
      authSubmit.disabled = true;
      authSubmit.classList.add("loading");
      const originalText = authSubmit.innerHTML;
      authSubmit.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';

      try {
        await AuthModule.register(username, password);
        alertEl.innerHTML =
          '<div class="alert success"><i class="fas fa-check-circle"></i> Đăng ký thành công! Bạn có thể đăng nhập ngay.</div>';

        // Auto switch to login after 2 seconds
        setTimeout(() => {
          setMode("login");
          document.getElementById("username").value = username;
          document.getElementById("password").focus();
        }, 2000);
      } catch (err) {
        alertEl.innerHTML = `<div class="alert error"><i class="fas fa-times-circle"></i> ${err.message}</div>`;
      } finally {
        authSubmit.disabled = false;
        authSubmit.classList.remove("loading");
        authSubmit.innerHTML = originalText;
      }
      return;
    }

    // Login flow
    authSubmit.disabled = true;
    authSubmit.classList.add("loading");
    const originalText = authSubmit.innerHTML;
    authSubmit.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

    try {
      await AuthModule.login(username, password);
      alertEl.innerHTML =
        '<div class="alert success"><i class="fas fa-check-circle"></i> Đăng nhập thành công! Đang chuyển hướng...</div>';

      // Short delay for UX
      setTimeout(async () => {
        showApp();
        let last = "dashboard";
        try {
          const stored = localStorage.getItem(LAST_ROUTE_KEY);
          if (stored && routes[stored]) last = stored;
        } catch {}
        await navigate(last);
      }, 500);
    } catch (err) {
      alertEl.innerHTML = `<div class="alert error"><i class="fas fa-times-circle"></i> ${escapeHTML(
        err.message || "Đăng nhập thất bại"
      )}</div>`;
      authSubmit.disabled = false;
      authSubmit.classList.remove("loading");
      authSubmit.innerHTML = originalText;
    }
  });
}

// Thoát chế độ auth để hiển thị ứng dụng chính
function showApp() {
  appEl.classList.remove("auth");
}

init();
