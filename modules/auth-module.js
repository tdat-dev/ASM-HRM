// AuthModule: quản lý đăng ký/đăng nhập và session
import { authAPI } from "../utils/api.js";

export const AuthModule = {
  /**
   * Khởi tạo user mặc định (admin) nếu chưa có - không cần thiết với backend
   */
  ensureInitialized() {
    // Backend đã có user admin mặc định trong database
  },

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
    return result;
  },

  /**
   * Đăng xuất
   */
  async logout() {
    const result = await authAPI.logout();
    return result;
  },

  /**
   * Lấy thông tin session hiện tại
   */
  async getSession() {
    try {
      const result = await authAPI.getSession();
      return result.data;
    } catch (error) {
      return null;
    }
  },
};
