import { reviewAPI } from "../utils/api.js";
import { validateEmployeeId, validateRating } from "../utils/validators.js";
import { showToast, escapeHTML } from "../utils/dom.js";

export const PerformanceModule = {
  // Thêm đánh giá mới cho nhân viên với rating và feedback tương ứng
  async addReview(employeeId, rating, feedback) {
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

    await reviewAPI.create({
      employee_id: employeeId,
      rating: Number(rating),
      feedback: feedback || "",
    });
  },

  // Tính điểm trung bình của một nhân viên (làm tròn hai chữ số thập phân)
  async getAverageRating(employeeId) {
    const result = await reviewAPI.getAverage(employeeId);
    return result.average || 0;
  },

  async mount(viewEl, titleEl) {
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
    const render = async () => {
      try {
        const result = await reviewAPI.getTopPerformers(10);
        const rows = result.data || [];
        body.innerHTML = rows
          .map(
            (row) =>
              `<tr><td>${row.employee_id}</td><td>${Number(
                row.avg_rating
              ).toFixed(2)}</td></tr>`
          )
          .join("");
      } catch (error) {
        body.innerHTML = `<tr><td colspan="2" class="alert error">${escapeHTML(error.message || "Có lỗi xảy ra")}</td></tr>`;
      }
    };
    await render();

    wrap.querySelector("#rvForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = Number(wrap.querySelector("#rvEmp").value);
      const rating = Number(wrap.querySelector("#rvRate").value);
      const fb = wrap.querySelector("#rvFb").value.trim();
      try {
        await this.addReview(id, rating, fb);
        showToast("Đã thêm đánh giá thành công.", "success");
      } catch (err) {
        showToast(err.message, "error");
        return;
      }
      e.target.reset();
      await render();
    });
  },
};
