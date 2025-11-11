// Async storage wrapper for localStorage with JSON and artificial delay
import { logger } from "./logger.js";
const DEFAULT_DELAY_MS = 120;
const NAMESPACE = "hrm";

// Mô phỏng độ trễ bất đồng bộ cho các thao tác lưu trữ
const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
// Đính kèm namespace để tránh đụng độ khóa trong LocalStorage
const withNs = (key) => `${NAMESPACE}:${key}`;

/**
 * Parse JSON an toàn với error handling
 * @param {string} jsonString - Chuỗi JSON cần parse
 * @param {*} fallback - Giá trị mặc định nếu parse lỗi (mặc định: [])
 * @returns {*} Dữ liệu đã parse hoặc fallback
 */
export function safeJSONParse(jsonString, fallback = []) {
  try {
    if (!jsonString) return fallback;
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn("storage_json_parse_failed", { message: error?.message || "parse error" });
    return fallback;
  }
}

export const storage = {
  async get(key, fallback = null) {
    const raw = localStorage.getItem(withNs(key));
    await delay(DEFAULT_DELAY_MS);
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      logger.warn("storage_get_parse_failed", { key, message: error?.message || "parse error" });
      return fallback;
    }
  },
  async set(key, value) {
    localStorage.setItem(withNs(key), JSON.stringify(value));
    await delay(DEFAULT_DELAY_MS);
    return true;
  },
  async remove(key) {
    localStorage.removeItem(withNs(key));
    await delay(DEFAULT_DELAY_MS);
    return true;
  },
  // transactional update convenience
  async update(key, updater, initial = null) {
    const current = await this.get(key, initial);
    const next = typeof updater === "function" ? updater(current) : updater;
    await this.set(key, next);
    return next;
  },
};
