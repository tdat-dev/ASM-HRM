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
const sidebarToggleBtn = document.getElementById("sidebarToggle");
const sidebar = document.querySelector(".sidebar");

const THEME_KEY = "hrm_theme";
const SIDEBAR_KEY = "hrm_sidebar_collapsed";

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

  // Sidebar toggle
  loadSidebarState();
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", toggleSidebar);
  }
}

// Định nghĩa các route và hàm mount tương ứng
const routes = {
  dashboard: async () => {
    pageTitleEl.textContent = "Dashboard";
    viewEl.innerHTML =
      '<div style="text-align: center; padding: 40px;"><p>⏳ Đang tải dữ liệu...</p></div>';

    // Lấy dữ liệu (AWAIT API calls)
    const employees = await EmployeeDb.getAllEmployees();
    const departments = await EmployeeDb.getAllDepartments();
    const positions = await EmployeeDb.getAllPositions();
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
  logoutBtn.addEventListener("click", async () => {
    await AuthModule.logout();
    showAuth();
  });

  // Mặc định hiển thị màn hình login trước
  showAuth();

  // Kiểm tra session (AWAIT để đợi kết quả)
  const session = await AuthModule.getSession();
  if (session) {
    // Nếu đã đăng nhập, hiển thị app
    showApp();
    await navigate("dashboard");
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
        <input 
          id="password" 
          type="password"
          autocomplete="current-password"
          placeholder="Nhập mật khẩu"
          required 
        />
        <div id="password-strength" class="password-strength" style="display:none;">
          <div class="password-strength-bar"></div>
        </div>
        <div id="password-helper" class="auth-helper"></div>
      </div>

      <div id="field-confirm" class="auth-field hidden">
        <label>
          <i class="fas fa-lock"></i> Xác nhận mật khẩu
          <span class="required">*</span>
        </label>
        <input 
          id="passwordConfirm" 
          type="password"
          autocomplete="new-password"
          placeholder="Nhập lại mật khẩu"
        />
        <div id="confirm-helper" class="auth-helper"></div>
      </div>

      <div class="auth-actions">
        <button type="submit" id="authSubmit" class="primary">
          <i class="fas fa-sign-in-alt"></i> Đăng nhập
        </button>
        <button type="button" id="authCancel" class="secondary" style="display:none;">
          <i class="fas fa-times"></i> Hủy
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

  // Mode: 'login' or 'register'
  let mode = "login";

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
      passwordStrength.style.display = "block";
      const result = checkPasswordStrength(password);
      passwordStrengthBar.className = `password-strength-bar ${result.strength}`;

      if (password.length < 8) {
        passwordHelper.textContent = "⚠️ Mật khẩu phải có ít nhất 8 ký tự";
        passwordHelper.className = "auth-helper error";
      } else {
        passwordHelper.textContent = `✓ Độ mạnh: ${result.text}`;
        passwordHelper.className = "auth-helper success";
      }
    } else {
      passwordStrength.style.display = "none";
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
      confirmHelper.textContent = "✓ Mật khẩu khớp";
      confirmHelper.className = "auth-helper success";
    } else {
      confirmHelper.textContent = "✗ Mật khẩu không khớp";
      confirmHelper.className = "auth-helper error";
    }
  }

  // Username validation
  document.getElementById("username").addEventListener("input", (e) => {
    const username = e.target.value.trim();
    if (username && username.length < 3) {
      usernameHelper.textContent = "⚠️ Tên đăng nhập phải có ít nhất 3 ký tự";
      usernameHelper.className = "auth-helper error";
    } else if (username) {
      usernameHelper.textContent = "✓ Hợp lệ";
      usernameHelper.className = "auth-helper success";
    } else {
      usernameHelper.textContent = "";
    }
  });

  function setMode(m) {
    mode = m;
    alertEl.innerHTML = "";
    passwordHelper.textContent = "";
    confirmHelper.textContent = "";
    usernameHelper.textContent = "";
    passwordStrength.style.display = "none";

    if (mode === "login") {
      fieldConfirm.classList.add("hidden");
      authSubmit.innerHTML = '<i class="fas fa-sign-in-alt"></i> Đăng nhập';
      authCancel.style.display = "none";
      authSubtitle.textContent = "Đăng nhập để truy cập hệ thống HRM";
      passwordInput.setAttribute("autocomplete", "current-password");
      showLoginBtn.classList.add("primary");
      showLoginBtn.classList.remove("secondary");
      showRegisterBtn.classList.add("secondary");
      showRegisterBtn.classList.remove("primary");
    } else {
      fieldConfirm.classList.remove("hidden");
      authSubmit.innerHTML = '<i class="fas fa-user-plus"></i> Đăng ký';
      authCancel.style.display = "inline-block";
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
      return;
    }

    if (username.length < 3) {
      alertEl.innerHTML =
        '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Tên đăng nhập phải có ít nhất 3 ký tự</div>';
      return;
    }

    if (mode === "register") {
      if (password.length < 8) {
        alertEl.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Mật khẩu phải có ít nhất 8 ký tự</div>';
        return;
      }

      const strength = checkPasswordStrength(password);
      if (strength.score < 2) {
        alertEl.innerHTML =
          '<div class="alert warning"><i class="fas fa-shield-alt"></i> Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn</div>';
        return;
      }

      if (password !== passwordConfirm) {
        alertEl.innerHTML =
          '<div class="alert error"><i class="fas fa-exclamation-triangle"></i> Mật khẩu xác nhận không khớp</div>';
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
        await navigate("dashboard");
      }, 500);
    } catch (err) {
      alertEl.innerHTML = `<div class="alert error"><i class="fas fa-times-circle"></i> ${err.message}</div>`;
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
