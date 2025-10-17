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

const viewEl = document.getElementById("view");
const pageTitleEl = document.getElementById("pageTitle");
const logoutBtn = document.getElementById("logoutBtn");
const appEl = document.getElementById("app");
const themeToggleBtn = document.getElementById("themeToggle");
const resetBtn = document.getElementById("resetBtn");

const THEME_KEY = "hrm_theme";

// Áp dụng theme sáng/tối bằng cách thêm class vào document
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("theme-dark");
  } else {
    root.classList.remove("theme-dark");
  }
  localStorage.setItem(THEME_KEY, theme);
}

// Khởi động cơ chế theme: đọc lựa chọn trước đó hoặc theo hệ thống
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
    themeToggleBtn.addEventListener("click", () => {
      const next = document.documentElement.classList.contains("theme-dark")
        ? "light"
        : "dark";
      applyTheme(next);
      themeToggleBtn.textContent = next === "dark" ? "Light Mode" : "Dark Mode";
    });
  }
}

// Xóa dữ liệu demo (trừ tài khoản) và trở về dashboard
async function resetData() {
  const confirm = window.confirm(
    "Xóa dữ liệu HRM (employee/department/position/attendance/leaves/reviews)?"
  );
  if (!confirm) return;
  // Clear domain data but keep users/session
  const keys = [
    "hrm_employees",
    "hrm_departments",
    "hrm_positions",
    "hrm_attendance",
    "hrm_leaves",
    "hrm_reviews",
  ];
  keys.forEach((key) => localStorage.removeItem(key));
  // Re-init base structures empty
  localStorage.setItem("hrm_employees", JSON.stringify([]));
  localStorage.setItem("hrm_departments", JSON.stringify([]));
  localStorage.setItem("hrm_positions", JSON.stringify([]));
  // Optionally reset view
  EmployeeDb.ensureInitialized(); // will seed defaults if completely empty; if you want fully empty, comment this
  navigate("dashboard");
}

// Định nghĩa các route và hàm mount tương ứng
const routes = {
  dashboard: async () => {
    pageTitleEl.textContent = "Dashboard";
    viewEl.innerHTML = "";

    // Lấy dữ liệu
    const employees = EmployeeDb.getAllEmployees();
    const departments = EmployeeDb.getAllDepartments();
    const positions = EmployeeDb.getAllPositions();
    const attendanceData = JSON.parse(
      localStorage.getItem("hrm_attendance") || "[]"
    );
    const leaveData = JSON.parse(localStorage.getItem("hrm_leaves") || "[]");

    // Tính toán thống kê
    const totalEmployees = employees.length;
    const totalDepartments = departments.length;
    const totalPositions = positions.length;
    const avgSalary =
      employees.length > 0
        ? Math.round(
            employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) /
              employees.length
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
    const totalMonthlyCost = employees.reduce(
      (sum, emp) =>
        sum + (emp.salary || 0) + (emp.bonus || 0) - (emp.deduction || 0),
      0
    );

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
                  <td><strong>${emp.name}</strong></td>
                  <td>${dept}</td>
                  <td>${pos}</td>
                  <td>${(emp.salary || 0).toLocaleString()} VNĐ</td>
                  <td>${emp.hireDate || "-"}</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    viewEl.innerHTML = dashboardHTML;
  },
  "employees-add": () => AddEmployeeModule.mount(viewEl, pageTitleEl),
  "employees-edit": () => EditEmployeeModule.mount(viewEl, pageTitleEl),
  "employees-delete": () => DeleteEmployeeModule.mount(viewEl, pageTitleEl),
  "employees-search": () => SearchEmployeeModule.mount(viewEl, pageTitleEl),
  departments: () => DepartmentModule.mount(viewEl, pageTitleEl),
  positions: () => PositionModule.mount(viewEl, pageTitleEl),
  salary: () => SalaryModule.mount(viewEl, pageTitleEl),
  attendance: () => AttendanceModule.mount(viewEl, pageTitleEl),
  leave: () => LeaveModule.mount(viewEl, pageTitleEl),
  performance: () => PerformanceModule.mount(viewEl, pageTitleEl),
};

// Gắn sự kiện cho menu sidebar và nút reset data
function registerMenuHandlers() {
  document.querySelectorAll(".menu [data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(btn.getAttribute("data-route"));
    });
  });
  if (resetBtn) {
    resetBtn.addEventListener("click", resetData);
  }
}

// Đánh dấu menu đang hoạt động theo route hiện tại
function setActive(route) {
  document.querySelectorAll(".menu [data-route]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-route") === route);
  });
}

// Điều hướng SPA tới route, đồng thời kích hoạt hàm mount tương ứng
function navigate(route) {
  const fn = routes[route] || routes.dashboard;
  setActive(route);
  fn();
}

// Khởi tạo ứng dụng: theme, dữ liệu demo, menu, session
async function init() {
  initTheme();
  AuthModule.ensureInitialized();
  EmployeeDb.ensureInitialized();
  registerMenuHandlers();
  logoutBtn.addEventListener("click", () => {
    AuthModule.logout();
    showAuth();
  });
  const session = AuthModule.getSession();
  if (!session) {
    showAuth();
    return;
  }
  showApp();
  navigate("dashboard");
}

// Hiển thị màn hình đăng nhập và xử lý form auth
function showAuth() {
  appEl.classList.add("auth");
  pageTitleEl.textContent = "";
  viewEl.innerHTML = "";
  const container = document.createElement("div");
  container.className = "card auth-container";
  container.innerHTML = `
    <h1>Chào mừng trở lại 👋</h1>
    <p>Đăng nhập để truy cập hệ thống HRM</p>
    <form id="loginForm">
      <div>
        <label>Tên đăng nhập</label>
        <input id="username" required />
      </div>
      <div>
        <label>Mật khẩu</label>
        <input id="password" type="password" required />
      </div>
      <div style="display:flex; gap:8px;">
        <button type="submit" class="primary">Đăng nhập</button>
        <button type="button" id="registerBtn" class="secondary">Đăng ký nhanh</button>
      </div>
      <div id="loginAlert"></div>
    </form>
  `;
  viewEl.appendChild(container);

  const form = document.getElementById("loginForm");
  const alertEl = document.getElementById("loginAlert");
  document.getElementById("registerBtn").addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    try {
      await AuthModule.register(username, password);
      alertEl.innerHTML =
        '<div class="alert success">Đăng ký thành công. Hãy đăng nhập.</div>';
    } catch (err) {
      alertEl.innerHTML = `<div class="alert error">${err.message}</div>`;
    }
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    try {
      await AuthModule.login(username, password);
      showApp();
      navigate("dashboard");
    } catch (err) {
      alertEl.innerHTML = `<div class="alert error">${err.message}</div>`;
    }
  });
}

// Thoát chế độ auth để hiển thị ứng dụng chính
function showApp() {
  appEl.classList.remove("auth");
}

init();
