// AuthModule: quản lý đăng ký/đăng nhập và session
const USERS_STORAGE_KEY = "hrm_users";
const SESSION_STORAGE_KEY = "hrm_session";
const PASSWORD_HASH_SECRET = "hrm_salt_v1";
const DEFAULT_DELAY_MS = 300; // Độ trễ giả lập cho async operations
const HASH_SHIFT_VALUE = 5; // Giá trị shift cho hash algorithm

// Hash đơn giản bằng closure + băm ký tự, cho mục đích học tập
const createPasswordHasher = () => {
  return (plainTextPassword) => {
    let hashValue = 0;
    const combinedInput = `${plainTextPassword}|${PASSWORD_HASH_SECRET}`;

    for (let index = 0; index < combinedInput.length; index++) {
      hashValue =
        (hashValue << HASH_SHIFT_VALUE) -
        hashValue +
        combinedInput.charCodeAt(index);
      hashValue |= 0; // Convert to 32bit integer
    }

    return `h${Math.abs(hashValue)}`;
  };
};
const hashPassword = createPasswordHasher();

// Giả lập độ trễ bất đồng bộ để mô phỏng gọi API
const delayExecution = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// Đọc danh sách người dùng hiện có từ LocalStorage
function readUsersFromStorage() {
  const rawData = localStorage.getItem(USERS_STORAGE_KEY);
  return rawData ? JSON.parse(rawData) : [];
}

// Ghi danh sách người dùng xuống LocalStorage
function writeUsersToStorage(usersList) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersList));
}

export const AuthModule = {
  /**
   * Khởi tạo user mặc định (admin) nếu chưa có
   */
  ensureInitialized() {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      const defaultAdmin = {
        id: 1,
        username: "admin",
        password: hashPassword("admin123"),
      };
      writeUsersToStorage([defaultAdmin]);
    }
  },

  /**
   * Đăng ký user mới
   */
  async register(username, password) {
    if (!username || !password) {
      throw new Error("Vui lòng nhập đủ thông tin");
    }

    await delayExecution(DEFAULT_DELAY_MS);
    const existingUsers = readUsersFromStorage();

    const usernameExists = existingUsers.some(
      (user) => user.username === username
    );
    if (usernameExists) {
      throw new Error("Username đã tồn tại");
    }

    const newUser = {
      id: Date.now(),
      username,
      password: hashPassword(password),
    };
    existingUsers.push(newUser);
    writeUsersToStorage(existingUsers);
  },

  /**
   * Đăng nhập
   */
  async login(username, password) {
    await delayExecution(DEFAULT_DELAY_MS);
    const allUsers = readUsersFromStorage();

    const authenticatedUser = allUsers.find(
      (user) =>
        user.username === username && user.password === hashPassword(password)
    );

    if (!authenticatedUser) {
      throw new Error("Sai thông tin đăng nhập");
    }

    const sessionData = {
      userId: authenticatedUser.id,
      username: authenticatedUser.username,
      timestamp: Date.now(),
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  },

  /**
   * Đăng xuất
   */
  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  },

  /**
   * Lấy thông tin session hiện tại
   */
  getSession() {
    const rawSessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    return rawSessionData ? JSON.parse(rawSessionData) : null;
  },
};
