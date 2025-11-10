import { escapeHTML } from "../utils/dom.js";
import { safeJSONParse } from "../utils/storage.js";

// Constants
const STORAGE_KEY_JOBS = "hrm_jobs";
const STORAGE_KEY_CANDIDATES = "hrm_candidates";

export const RecruitmentModule = {
  mount(viewEl, titleEl) {
    titleEl.textContent = "Tuyển dụng";
    viewEl.innerHTML = "";
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="card">
        <h3>📣 Tin tuyển dụng</h3>
        <form id="jobForm" style="display:grid; gap: 8px; margin-bottom: 12px;">
          <input id="jobTitle" type="text" placeholder="Chức danh" required />
          <input id="jobDept" type="text" placeholder="Phòng ban" />
          <textarea id="jobDesc" placeholder="Mô tả công việc" rows="3"></textarea>
          <button class="primary" type="submit"><i class="fas fa-plus"></i> Đăng tin</button>
          <div id="jobAlert"></div>
        </form>
        <div id="jobsList"></div>
      </div>
      <div class="card" style="margin-top: 16px;">
        <h3>🗂 Hồ sơ ứng viên (ATS)</h3>
        <form id="candidateForm" style="display:grid; gap: 8px; margin-bottom: 12px;">
          <input id="candName" type="text" placeholder="Họ tên" required />
          <input id="candEmail" type="email" placeholder="Email" required />
          <input id="candForJob" type="text" placeholder="Ứng tuyển vị trí" />
          <button class="primary" type="submit"><i class="fas fa-user-plus"></i> Thêm hồ sơ</button>
          <div id="candidateAlert"></div>
        </form>
        <div id="candidatesList"></div>
      </div>
    `;
    viewEl.appendChild(container);

    // Jobs
    const jobsEl = container.querySelector("#jobsList");
    const jobForm = container.querySelector("#jobForm");
    const jobAlert = container.querySelector("#jobAlert");
    const jobs = safeJSONParse(localStorage.getItem(STORAGE_KEY_JOBS), []);
    
    const renderJobs = () => {
      if (jobs.length === 0) {
        jobsEl.innerHTML = `<div class="muted">Chưa có tin tuyển dụng.</div>`;
      } else {
        // Escape tất cả dữ liệu động
        jobsEl.innerHTML = `
          <table class="table">
            <thead><tr><th>Chức danh</th><th>Phòng ban</th><th>Ngày đăng</th></tr></thead>
            <tbody>
              ${jobs
                .slice()
                .reverse()
                .map(
                  (j) =>
                    `<tr>
                      <td>${escapeHTML(j.title || "")}</td>
                      <td>${escapeHTML(j.dept || "-")}</td>
                      <td>${new Date(j.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
    };
    
    renderJobs();
    
    jobForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = container.querySelector("#jobTitle").value.trim();
      
      // Validation với feedback
      if (!title) {
        jobAlert.innerHTML = '<div class="alert error">Vui lòng nhập chức danh.</div>';
        return;
      }
      
      const dept = container.querySelector("#jobDept").value.trim();
      const desc = container.querySelector("#jobDesc").value.trim();
      
      jobs.push({ 
        id: Date.now(), 
        title: escapeHTML(title), // Escape để chống XSS
        dept: escapeHTML(dept), 
        desc: escapeHTML(desc), 
        createdAt: new Date().toISOString() 
      });
      
      localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
      jobAlert.innerHTML = '<div class="alert success">Đăng tin thành công!</div>';
      jobForm.reset();
      renderJobs();
      
      // Xóa thông báo sau 3 giây
      setTimeout(() => {
        jobAlert.innerHTML = "";
      }, 3000);
    });

    // Candidates
    const candEl = container.querySelector("#candidatesList");
    const candForm = container.querySelector("#candidateForm");
    const candidateAlert = container.querySelector("#candidateAlert");
    const candidates = safeJSONParse(localStorage.getItem(STORAGE_KEY_CANDIDATES), []);
    
    const renderCandidates = () => {
      if (candidates.length === 0) {
        candEl.innerHTML = `<div class="muted">Chưa có hồ sơ ứng viên.</div>`;
      } else {
        // Escape tất cả dữ liệu động
        candEl.innerHTML = `
          <table class="table">
            <thead><tr><th>Họ tên</th><th>Email</th><th>Vị trí</th><th>Trạng thái</th></tr></thead>
            <tbody>
              ${candidates
                .slice()
                .reverse()
                .map(
                  (c) =>
                    `<tr>
                      <td>${escapeHTML(c.name || "")}</td>
                      <td>${escapeHTML(c.email || "")}</td>
                      <td>${escapeHTML(c.forJob || "-")}</td>
                      <td>${escapeHTML(c.status || "mới")}</td>
                    </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      }
    };
    
    renderCandidates();
    
    candForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = container.querySelector("#candName").value.trim();
      const email = container.querySelector("#candEmail").value.trim();
      
      // Validation với feedback
      if (!name || !email) {
        candidateAlert.innerHTML = '<div class="alert error">Vui lòng nhập đủ thông tin (họ tên và email).</div>';
        return;
      }
      
      // Kiểm tra định dạng email cơ bản
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        candidateAlert.innerHTML = '<div class="alert error">Email không hợp lệ.</div>';
        return;
      }
      
      const forJob = container.querySelector("#candForJob").value.trim();
      candidates.push({
        id: Date.now(),
        name: escapeHTML(name), // Escape để chống XSS
        email: escapeHTML(email),
        forJob: escapeHTML(forJob),
        status: "mới",
        createdAt: new Date().toISOString(),
      });
      
      localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(candidates));
      candidateAlert.innerHTML = '<div class="alert success">Thêm hồ sơ thành công!</div>';
      candForm.reset();
      renderCandidates();
      
      // Xóa thông báo sau 3 giây
      setTimeout(() => {
        candidateAlert.innerHTML = "";
      }, 3000);
    });
  },
};
