/**
 * API Utility - Gọi backend API
 */

// Base URL của API
const API_BASE_URL = "http://localhost/ASM-HRM/backend/api.php";

/**
 * Gọi API với fetch
 */
export async function callAPI(endpoint, options = {}) {
  // Tách endpoint và query params nếu có
  const [path, queryString] = endpoint.split("?");
  let url = `${API_BASE_URL}?path=${path}`;

  // Thêm query params vào URL nếu có
  if (queryString) {
    url += `&${queryString}`;
  }

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Gửi cookie/session
  };

  // Thêm body nếu có data
  if (options.data) {
    config.body = JSON.stringify(options.data);
  }

  try {
    const response = await fetch(url, config);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "API call failed");
    }

    return result;
  } catch (error) {
    // Không log "Chưa đăng nhập" vì đây là trạng thái bình thường
    if (!error.message?.includes("Chưa đăng nhập")) {
      console.error("API Error:", error);
    }
    throw error;
  }
}

/**
 * Auth API
 */
export const authAPI = {
  login: (username, password) =>
    callAPI("auth/login", {
      method: "POST",
      data: { username, password },
    }),

  register: (userData) =>
    callAPI("auth/register", {
      method: "POST",
      data: userData,
    }),

  logout: () =>
    callAPI("auth/logout", {
      method: "POST",
    }),

  getSession: () => callAPI("auth/session"),
};

/**
 * Employee API
 */
export const employeeAPI = {
  getAll: () => callAPI("employees"),

  getById: (id) => callAPI(`employees/${id}`),

  create: (employeeData) =>
    callAPI("employees", {
      method: "POST",
      data: employeeData,
    }),

  update: (id, employeeData) =>
    callAPI(`employees/${id}`, {
      method: "PUT",
      data: employeeData,
    }),

  delete: (id) =>
    callAPI(`employees/${id}`, {
      method: "DELETE",
    }),

  search: (filters) =>
    callAPI("employees/search", {
      method: "POST",
      data: filters,
    }),

  getStats: () => callAPI("employees/stats"),
};

/**
 * Department API
 */
export const departmentAPI = {
  getAll: () => callAPI("departments"),

  create: (departmentData) =>
    callAPI("departments", {
      method: "POST",
      data: departmentData,
    }),

  update: (id, departmentData) =>
    callAPI(`departments/${id}`, {
      method: "PUT",
      data: departmentData,
    }),

  delete: (id) =>
    callAPI(`departments/${id}`, {
      method: "DELETE",
    }),
};

/**
 * Position API
 */
export const positionAPI = {
  getAll: () => callAPI("positions"),

  create: (positionData) =>
    callAPI("positions", {
      method: "POST",
      data: positionData,
    }),

  update: (id, positionData) =>
    callAPI(`positions/${id}`, {
      method: "PUT",
      data: positionData,
    }),

  delete: (id) =>
    callAPI(`positions/${id}`, {
      method: "DELETE",
    }),
};

/**
 * Attendance API
 */
export const attendanceAPI = {
  getAll: () => callAPI("attendance"),

  checkIn: (employeeId) =>
    callAPI("attendance/checkin", {
      method: "POST",
      data: { employee_id: employeeId },
    }),

  checkOut: (employeeId) =>
    callAPI("attendance/checkout", {
      method: "POST",
      data: { employee_id: employeeId },
    }),

  getReport: (employeeId, startDate, endDate) =>
    callAPI("attendance/report", {
      method: "POST",
      data: {
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
      },
    }),

  getTodayCount: () => callAPI("attendance/today-count"),
};

/**
 * Leave API
 */
export const leaveAPI = {
  getAll: () => callAPI("leaves"),

  create: (leaveData) =>
    callAPI("leaves", {
      method: "POST",
      data: leaveData,
    }),

  approve: (leaveId) =>
    callAPI("leaves/approve", {
      method: "POST",
      data: { id: leaveId },
    }),

  reject: (leaveId, reason) =>
    callAPI("leaves/reject", {
      method: "POST",
      data: { id: leaveId, reason },
    }),

  getBalance: (employeeId) => callAPI(`leaves/balance/${employeeId}`),

  getPendingCount: () => callAPI("leaves/pending-count"),
};

/**
 * Review API
 */
export const reviewAPI = {
  getAll: () => callAPI("reviews"),

  create: (reviewData) =>
    callAPI("reviews", {
      method: "POST",
      data: reviewData,
    }),

  getAverage: (employeeId) => callAPI(`reviews/average/${employeeId}`),

  getTopPerformers: (limit = 10) =>
    callAPI(`reviews/top-performers?limit=${limit}`),
};
