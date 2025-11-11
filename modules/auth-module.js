// AuthModule: quản lý đăng ký/đăng nhập và session
import { authAPI } from "../utils/api.js";

export const AuthModule = {
  /**
   * Đăng ký user mới
   */
  async register(username, password) {
    if (!username || !password) {
      throw new Error("Vui lòng nhập đủ thông tin");
    }

    const result = await authAPI.register({ username, password });
    return result;
  },

  /**
   * Đăng nhập
   */
  async login(username, password) {
    const result = await authAPI.login(username, password);
    // Lưu session tạm thời trên client để UI có thể dùng ngay (server vẫn là nguồn truth)
    if (result && result.data) {
      try {
        localStorage.setItem("hrm_session", JSON.stringify(result.data));
      } catch (e) {
        // ignore storage errors
      }
    }
    return result;
  },

  /**
   * Đăng xuất
   */
  async logout() {
    const result = await authAPI.logout();
    try {
      localStorage.removeItem("hrm_session");
    } catch (e) {}
    return result;
  },

  /**
   * Lấy thông tin session hiện tại
   */
  async getSession() {
    try {
      const result = await authAPI.getSession();
      if (result && result.data) {
        try {
          localStorage.setItem("hrm_session", JSON.stringify(result.data));
        } catch (e) {}
        return result.data;
      }
      return null;
    } catch (error) {
      // Fallback: nếu server không phản hồi, dùng localStorage nếu có
      try {
        const s = localStorage.getItem("hrm_session");
        return s ? JSON.parse(s) : null;
      } catch (e) {
        return null;
      }
    }
  },
};
