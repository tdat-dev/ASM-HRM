// DOM utilities - Các hàm tiện ích để tạo và thao tác DOM

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
 * @param {string} message - Nội dung thông báo
 */
export function showAlert(container, alertType, message) {
  container.innerHTML = `<div class="alert ${alertType}">${message}</div>`;
}

/**
 * Render bảng HTML từ dữ liệu
 * @param {HTMLElement} container - Phần tử chứa bảng
 * @param {Array} columns - Mảng các cột: [{ header: "Tên cột", cell: (row) => row.field }]
 * @param {Array} rows - Mảng dữ liệu hàng
 */
export function renderTable(container, columns, rows) {
  // Tạo phần header (thead)
  const tableHeader = `<thead><tr>${columns
    .map((column) => `<th>${column.header}</th>`)
    .join("")}</tr></thead>`;

  // Tạo phần body (tbody)
  const tableBody = `<tbody>${rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${column.cell(row)}</td>`)
          .join("")}</tr>`
    )
    .join("")}</tbody>`;

  // Gộp thành bảng hoàn chỉnh
  container.innerHTML = `<table class="table">${tableHeader}${tableBody}</table>`;
}
