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
        </form>
        <div id="candidatesList"></div>
      </div>
    `;
    viewEl.appendChild(container);

    // Jobs
    const jobsEl = container.querySelector("#jobsList");
    const jobForm = container.querySelector("#jobForm");
    const jobs = JSON.parse(localStorage.getItem("hrm_jobs") || "[]");
    const renderJobs = () => {
      if (jobs.length === 0) {
        jobsEl.innerHTML = `<div class="muted">Chưa có tin tuyển dụng.</div>`;
      } else {
        jobsEl.innerHTML = `
          <table class="table">
            <thead><tr><th>Chức danh</th><th>Phòng ban</th><th>Ngày đăng</th></tr></thead>
            <tbody>
              ${jobs
                .slice()
                .reverse()
                .map(
                  (j) =>
                    `<tr><td>${j.title}</td><td>${j.dept || "-"}</td><td>${new Date(
                      j.createdAt
                    ).toLocaleDateString()}</td></tr>`
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
      if (!title) return;
      const dept = container.querySelector("#jobDept").value.trim();
      const desc = container.querySelector("#jobDesc").value.trim();
      jobs.push({ id: Date.now(), title, dept, desc, createdAt: new Date().toISOString() });
      localStorage.setItem("hrm_jobs", JSON.stringify(jobs));
      jobForm.reset();
      renderJobs();
    });

    // Candidates
    const candEl = container.querySelector("#candidatesList");
    const candForm = container.querySelector("#candidateForm");
    const candidates = JSON.parse(localStorage.getItem("hrm_candidates") || "[]");
    const renderCandidates = () => {
      if (candidates.length === 0) {
        candEl.innerHTML = `<div class="muted">Chưa có hồ sơ ứng viên.</div>`;
      } else {
        candEl.innerHTML = `
          <table class="table">
            <thead><tr><th>Họ tên</th><th>Email</th><th>Vị trí</th><th>Trạng thái</th></tr></thead>
            <tbody>
              ${candidates
                .slice()
                .reverse()
                .map(
                  (c) =>
                    `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.forJob || "-"}</td><td>${c.status || "mới"}</td></tr>`
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
      if (!name || !email) return;
      const forJob = container.querySelector("#candForJob").value.trim();
      candidates.push({
        id: Date.now(),
        name,
        email,
        forJob,
        status: "mới",
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("hrm_candidates", JSON.stringify(candidates));
      candForm.reset();
      renderCandidates();
    });
  },
};



