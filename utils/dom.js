// DOM utilities - Các hàm tiện ích để tạo và thao tác DOM

/**
 * Escape HTML để chống XSS (Cross-Site Scripting)
 * Chuyển đổi các ký tự đặc biệt HTML thành entities
 * @param {string} text - Chuỗi cần escape
 * @returns {string} Chuỗi đã được escape an toàn
 */
export function escapeHTML(text) {
  if (text == null) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Tạo phần tử HTML với thuộc tính và children
 * @param {string} tagName - Tên thẻ HTML (vd: "div", "button")
 * @param {Object} attributes - Thuộc tính của phần tử (vd: { id: "btn1", className: "primary" })
 * @param {Array|string|HTMLElement} children - Phần tử con (có thể là mảng, string HTML, hoặc phần tử DOM)
 * @returns {HTMLElement} Phần tử HTML đã tạo
 */
export function createElement(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);

  // Xử lý các thuộc tính
  Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
    // Xử lý className riêng vì trong HTML là "class" nhưng JavaScript dùng "className"
    if (attributeName === "className") {
      element.className = attributeValue;
    }
    // Xử lý event listeners (onclick, onchange, etc.)
    else if (
      attributeName.startsWith("on") &&
      typeof attributeValue === "function"
    ) {
      const eventName = attributeName.slice(2).toLowerCase(); // "onclick" → "click"
      element.addEventListener(eventName, attributeValue);
    }
    // Xử lý các thuộc tính thông thường
    else if (attributeValue !== undefined && attributeValue !== null) {
      element.setAttribute(attributeName, String(attributeValue));
    }
  });

  // Xử lý children (phần tử con)
  const childrenList = Array.isArray(children) ? children : [children];
  childrenList.forEach((child) => {
    if (child == null) return; // Bỏ qua null/undefined

    if (typeof child === "string") {
      // Nếu là string, thêm như HTML
      element.insertAdjacentHTML("beforeend", child);
    } else {
      // Nếu là phần tử DOM, thêm trực tiếp
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Hiển thị thông báo (alert) trong container
 * @param {HTMLElement} container - Phần tử HTML chứa thông báo
 * @param {string} alertType - Loại thông báo: "success", "error", "warning"
 * @param {string} message - Nội dung thông báo (sẽ được escape tự động)
 */
export function showAlert(container, alertType, message) {
  container.innerHTML = `<div class="alert ${alertType}">${escapeHTML(message)}</div>`;
}

/**
 * Render bảng HTML từ dữ liệu
 * @param {HTMLElement} container - Phần tử chứa bảng
 * @param {Array} columns - Mảng các cột: [{ header: "Tên cột", cell: (row) => row.field }]
 * @param {Array} rows - Mảng dữ liệu hàng
 * @param {boolean} escapeData - Có escape dữ liệu tự động không (mặc định: true để chống XSS)
 */
export function renderTable(container, columns, rows, escapeData = true) {
  // Tạo phần header (thead) - header luôn được escape
  const tableHeader = `<thead><tr>${columns
    .map((column) => `<th>${escapeHTML(column.header)}</th>`)
    .join("")}</tr></thead>`;

  // Tạo phần body (tbody)
  // Lưu ý: cell function có thể trả về HTML, nên không tự động escape
  // Developer phải tự escape trong cell function nếu cần
  const tableBody = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => {
            const cellContent = column.cell(row);
            // Nếu cell trả về string thuần, escape nó
            // Nếu trả về HTML (có tags), giữ nguyên (nhưng phải đảm bảo an toàn)
            return `<td>${escapeData && typeof cellContent === "string" ? escapeHTML(cellContent) : cellContent}</td>`;
          })
          .join("")}</tr>`
    )
    .join("")}</tbody>`;

  // Gộp thành bảng hoàn chỉnh
  container.innerHTML = `<table class="table">${tableHeader}${tableBody}</table>`;
}

/**
 * Chuẩn hóa và format tiền tệ VND theo locale vi-VN
 * - Chấp nhận string chứa ký tự, sẽ lọc số trước khi format
 * - Mặc định không hiển thị phần thập phân .00
 * @param {number|string} amount
 * @param {Intl.NumberFormatOptions} options
 * @returns {string}
 */
export function formatVND(amount, options = {}) {
  if (amount == null) return "0 VNĐ";
  const cleaned =
    typeof amount === "string" ? amount.replace(/[^0-9.-]/g, "") : amount;
  const number = Number(cleaned);
  const safe = Number.isFinite(number) ? number : 0;
  const nf = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
    ...options,
  });
  return `${nf.format(safe)} VNĐ`;
}
