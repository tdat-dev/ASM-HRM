import { validateEmployeeId, validateRating } from "../utils/validators.js";

const REVIEWS_KEY = "hrm_reviews";

// Đọc toàn bộ đánh giá hiệu suất từ LocalStorage
function read() {
  const raw = localStorage.getItem(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : [];
}
// Lưu danh sách đánh giá xuống LocalStorage
function write(list) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
}

export const PerformanceModule = {
  // Thêm đánh giá mới cho nhân viên với rating và feedback tương ứng
  addReview(employeeId, rating, feedback) {
    if (!employeeId || !rating) throw new Error("Thiếu dữ liệu");
    const messages = [];
    const { ok, errors } = validateEmployeeId(employeeId);
    if (!ok) {
      messages.push(...errors);
    }
    const { ok: ratingOk, errors: ratingErrors } = validateRating(rating);
    if (!ratingOk) {
      messages.push(...ratingErrors);
    }
    if (messages.length > 0) {
      throw new Error(messages.join(", "));
    }
    const list = read();
    list.push({
      id: Date.now(),
      employeeId,
      date: new Date().toISOString().slice(0, 10),
      rating: Number(rating),
      feedback: feedback || "",
    });
    write(list);
  },
  // Tính điểm trung bình của một nhân viên (làm tròn hai chữ số thập phân)
  getAverageRating(employeeId) {
    const reviews = read().filter((review) => review.employeeId === employeeId);
    if (reviews.length === 0) return 0;
    return (
      Math.round(
        (reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length) *
          100
      ) / 100
    );
  },
  mount(viewEl, titleEl) {
    // Render giao diện nhập đánh giá và bảng xếp hạng nhân viên
    titleEl.textContent = "Hiệu suất";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
			<form id="rvForm" style="display:grid;gap:8px;max-width:520px;">
				<input id="rvEmp" type="number" placeholder="Employee ID" required />
				<input id="rvRate" type="number" min="1" max="5" step="1" placeholder="Rating 1-5" required />
				<input id="rvFb" placeholder="Feedback" />
				<button class="primary">Thêm đánh giá</button>
			</form>
			<div style="margin-top:12px;">
				<h3>Top performers</h3>
				<table class="table"><thead><tr><th>Emp</th><th>Avg</th></tr></thead><tbody id="rvBody"></tbody></table>
			</div>
		`;
    viewEl.appendChild(wrap);

    const body = wrap.querySelector("#rvBody");
    // Cập nhật bảng xếp hạng từ dữ liệu đánh giá hiện tại
    const render = () => {
      const grouped = read().reduce((accumulator, review) => {
        accumulator[review.employeeId] = accumulator[review.employeeId] || [];
        accumulator[review.employeeId].push(review);
        return accumulator;
      }, {});
      const rows = Object.entries(grouped)
        .map(([empId, reviews]) => ({
          empId: Number(empId),
          avg:
            Math.round(
              (reviews.reduce((sum, review) => sum + review.rating, 0) /
                reviews.length) *
                100
            ) / 100,
        }))
        .sort((a, b) => b.avg - a.avg);
      body.innerHTML = rows
        .map((row) => `<tr><td>${row.empId}</td><td>${row.avg}</td></tr>`)
        .join("");
    };
    render();

    wrap.querySelector("#rvForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const id = Number(wrap.querySelector("#rvEmp").value);
      const rating = Number(wrap.querySelector("#rvRate").value);
      const fb = wrap.querySelector("#rvFb").value.trim();
      try {
        this.addReview(id, rating, fb);
      } catch (err) {
        alert(err.message);
        return;
      }
      e.target.reset();
      render();
    });
  },
};
