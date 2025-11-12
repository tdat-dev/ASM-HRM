import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML, showToast } from "../utils/dom.js";
import { createProfileEditor, DEFAULT_AVATAR } from "./profile-editor.js";
import { AuthModule } from "./auth-module.js";
import { loadProfile, saveProfile } from "./profile-store.js";

export const DirectoryModule = {
  async mount(viewEl, titleEl) {
    titleEl.textContent = "Danh bạ nhân viên";
    viewEl.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <div class="directory">
        <div class="directory-toolbar">
          <div class="directory-search">
            <input id="dirSearchInput" placeholder="Tìm theo tên, kỹ năng, vị trí, phòng ban..." aria-label="Tìm kiếm danh bạ" />
            <button id="dirSearchBtn" class="secondary" title="Tìm kiếm" aria-label="Tìm kiếm"><i class="fas fa-search"></i></button>
          </div>
          <div class="directory-sort">
            <label for="dirSortKey" class="sr-only">Sắp xếp theo</label>
            <select id="dirSortKey" title="Sắp xếp theo">
              <option value="name">Tên</option>
              <option value="department">Phòng ban</option>
              <option value="position">Vị trí</option>
              <option value="id">Mã NV</option>
            </select>
            <button id="dirSortOrder" class="secondary" title="Đổi thứ tự" aria-label="Đổi thứ tự A-Z/Z-A" data-order="asc">
              <i class="fas fa-sort-alpha-down" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="directory-layout">
          <div id="dirList" class="directory-list"></div>
        </div>
        <div id="dirDrawer" class="drawer is-hidden" role="dialog" aria-modal="true" aria-labelledby="drawerTitle">
          <div class="drawer-backdrop" data-action="close"></div>
          <div class="drawer-panel">
            <div class="drawer-header">
              <h3 id="drawerTitle">Chỉnh sửa hồ sơ</h3>
              <button id="drawerClose" class="secondary" title="Đóng" aria-label="Đóng"><i class="fas fa-times"></i></button>
            </div>
            <div id="dirEditorWrapper" class="drawer-content"></div>
          </div>
        </div>
      </div>
    `;
    viewEl.appendChild(wrap);

    const employees = await EmployeeDb.getAllEmployees();
    const positions = await EmployeeDb.getAllPositions();
    const departments = await EmployeeDb.getAllDepartments();
    const positionById = Object.fromEntries(
      positions.map((p) => [p.id, p.title])
    );
    const departmentById = Object.fromEntries(
      departments.map((d) => [d.id, d.name])
    );

    const listEl = wrap.querySelector("#dirList");
    const searchInput = wrap.querySelector("#dirSearchInput");
    const searchBtn = wrap.querySelector("#dirSearchBtn");
    const sortKeyEl = wrap.querySelector("#dirSortKey");
    const sortOrderBtn = wrap.querySelector("#dirSortOrder");
    const editorWrapper = wrap.querySelector("#dirEditorWrapper");
    const drawer = wrap.querySelector("#dirDrawer");
    const drawerClose = wrap.querySelector("#drawerClose");
    const layoutEl = wrap.querySelector(".directory-layout");
    const session = await AuthModule.getSession();
    const role = session?.role || "employee";
    const canEdit = role === "admin" || role === "hr";
    const editor = canEdit
      ? createProfileEditor(editorWrapper, { showExport: false })
      : null;

    // Với role chỉ xem (manager/employee), không hiển thị drawer chỉnh sửa
    if (!canEdit && drawer) {
      drawer.remove();
    }

    // Di chuyển drawer ra ngoài body để tránh cảm giác bị "gói" trong #view
    // và đảm bảo lớp phủ hiển thị đúng trong mọi ngữ cảnh (z-index, overlay).
    if (canEdit && drawer && drawer.parentElement !== document.body) {
      document.body.appendChild(drawer);
    }

    // Panel hiển thị thông tin read-only khi không có quyền chỉnh sửa
    let detailsPanel = null;
    if (layoutEl) {
      detailsPanel = document.createElement("div");
      detailsPanel.id = "dirDetails";
      detailsPanel.className = "directory-details card is-hidden";
      layoutEl.appendChild(detailsPanel);
    }
    const cardRefs = new Map();

    let currentItems = [...employees];
    let activeEmployeeId = null;
    let currentSortKey = "name";
    let currentSortOrder = "asc"; // 'asc' | 'desc'
    const collator = new Intl.Collator("vi", { sensitivity: "base" });

    if (editor) {
      editor.onSave(async (employee, profile) => {
        if (!employee) return;
        try {
          await saveProfile(employee.id, profile);
          showToast("Đã lưu hồ sơ.", "success");
          const updatedEmployee = {
            ...employee,
            profile_skills: profile.skills,
            profile_avatar: profile.avatar,
          };
          const indexAll = employees.findIndex(
            (item) => item.id === employee.id
          );
          if (indexAll !== -1) {
            employees[indexAll] = updatedEmployee;
          }
          const indexCurrent = currentItems.findIndex(
            (item) => item.id === employee.id
          );
          if (indexCurrent !== -1) {
            currentItems[indexCurrent] = updatedEmployee;
          }
          applySortAndRender();
        } catch (error) {
          showToast(
            error.message || "Không thể lưu hồ sơ. Vui lòng thử lại.",
            "error"
          );
        }
      });

      editor.onExport(() => {});
    }

    function getEmployeeInfo(employee) {
      return {
        ...employee,
        departmentName: departmentById[employee.departmentId] || "-",
        positionTitle: positionById[employee.positionId] || "-",
      };
    }

    function sortItems(items) {
      const factor = currentSortOrder === "asc" ? 1 : -1;
      return items.slice().sort((a, b) => {
        if (currentSortKey === "id") {
          return (Number(a.id) - Number(b.id)) * factor;
        }
        if (currentSortKey === "department") {
          const da = departmentById[a.departmentId] || "";
          const db = departmentById[b.departmentId] || "";
          return collator.compare(da, db) * factor;
        }
        if (currentSortKey === "position") {
          const pa = positionById[a.positionId] || "";
          const pb = positionById[b.positionId] || "";
          return collator.compare(pa, pb) * factor;
        }
        // default name
        const na = a.name || "";
        const nb = b.name || "";
        return collator.compare(na, nb) * factor;
      });
    }

    function renderList(items) {
      listEl.innerHTML = "";
      cardRefs.clear();

      if (items.length === 0) {
        listEl.innerHTML = `<div class="muted">Không tìm thấy nhân viên phù hợp.</div>`;
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach((employee) => {
        const avatar = employee.profile_avatar || DEFAULT_AVATAR;
        const safeAvatar =
          typeof avatar === "string" &&
          (/^data:image\//i.test(avatar) || /^https?:\/\//i.test(avatar))
            ? avatar
            : DEFAULT_AVATAR;
        const skills = employee.profile_skills || "";
        const card = document.createElement("button");
        card.type = "button";
        card.className = "directory-card";
        if (employee.id === activeEmployeeId) {
          card.classList.add("active");
        }
        card.setAttribute("data-id", String(employee.id));
        card.innerHTML = `
          <div class="directory-card-body">
            <img class="directory-avatar" src="${safeAvatar}" alt="" />
            <div>
              <div><span class="id-badge">#${
                employee.id
              }</span> <span class="directory-name">${escapeHTML(
          employee.name || ""
        )}</span></div>
              <div class="directory-meta muted">${escapeHTML(
                positionById[employee.positionId] || "-"
              )} • ${escapeHTML(
          departmentById[employee.departmentId] || "-"
        )}</div>
              <div class="directory-skills muted">${escapeHTML(skills)}</div>
            </div>
          </div>
        `;
        card.addEventListener("click", () => selectEmployee(employee));
        fragment.appendChild(card);
        cardRefs.set(employee.id, card);
      });
      listEl.appendChild(fragment);
    }

    function openDrawer() {
      if (!canEdit || !drawer) return;
      drawer.classList.remove("is-hidden");
      if (drawerClose) {
        drawerClose.focus();
      }
      document.body.classList.add("modal-open");
      // ESC to close
      const escHandler = (e) => {
        if (e.key === "Escape") {
          closeDrawer();
        }
      };
      drawer._escHandler = escHandler;
      window.addEventListener("keydown", escHandler);
    }

    function closeDrawer() {
      if (!canEdit || !drawer) return;
      drawer.classList.add("is-hidden");
      document.body.classList.remove("modal-open");
      if (drawer._escHandler) {
        window.removeEventListener("keydown", drawer._escHandler);
        drawer._escHandler = null;
      }
    }

    function renderDetails(employee, profile) {
      if (!detailsPanel) return;
      const info = getEmployeeInfo(employee);
      const data = profile || {};
      const avatar = info.profile_avatar || data.avatar || DEFAULT_AVATAR;

      const emergency =
        Array.isArray(data.emergencyContacts) &&
        data.emergencyContacts.length > 0
          ? `<section>
               <h4>Liên hệ khẩn cấp</h4>
               <ul>
                 ${data.emergencyContacts
                   .map(
                     (c) =>
                       `<li><strong>${escapeHTML(
                         c.name || ""
                       )}</strong> • ${escapeHTML(
                         c.relation || "-"
                       )} • ${escapeHTML(c.phone || "-")}</li>`
                   )
                   .join("")}
               </ul>
             </section>`
          : "";

      const dependents =
        Array.isArray(data.dependents) && data.dependents.length > 0
          ? `<section>
               <h4>Người phụ thuộc</h4>
               <ul>
                 ${data.dependents
                   .map(
                     (d) =>
                       `<li><strong>${escapeHTML(
                         d.name || ""
                       )}</strong> • ${escapeHTML(
                         d.relation || "-"
                       )} • ${escapeHTML(d.dob || "-")}</li>`
                   )
                   .join("")}
               </ul>
             </section>`
          : "";

      const skillsSection = data.skills
        ? `<section>
             <h4>Kỹ năng</h4>
             <p>${escapeHTML(data.skills)}</p>
           </section>`
        : "";

      const bank =
        data.bank?.bankName || data.bank?.accountNumber
          ? `<div class="muted">Ngân hàng: ${escapeHTML(
              data.bank.bankName || "-"
            )} • ${escapeHTML(data.bank.accountNumber || "-")}</div>`
          : "";

      detailsPanel.innerHTML = `
        <div class="directory-details-header">
          <div class="directory-details-avatar">
            <img src="${avatar}" alt="" />
          </div>
          <div>
            <div class="directory-details-name">
              <span class="id-badge">#${info.id}</span>
              <strong>${escapeHTML(info.name || "")}</strong>
            </div>
            <div class="muted">${escapeHTML(info.positionTitle)} • ${escapeHTML(
        info.departmentName
      )}</div>
            ${bank}
          </div>
        </div>
        ${
          skillsSection || emergency || dependents
            ? `${skillsSection}${emergency}${dependents}`
            : '<p class="muted">Chưa có hồ sơ bổ sung.</p>'
        }
      `;
      detailsPanel.classList.remove("is-hidden");
    }

    async function selectEmployee(employee) {
      activeEmployeeId = employee.id;
      const profile = await loadProfile(employee.id);

      if (canEdit && editor) {
        editor.setEmployee(getEmployeeInfo(employee), profile);
        openDrawer();
      } else {
        renderDetails(employee, profile);
      }

      cardRefs.forEach((card, id) => {
        if (Number(id) === employee.id) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
    }

    function applySearch() {
      const query = (searchInput.value || "").toLowerCase().trim();
      if (!query) {
        currentItems = [...employees];
        applySortAndRender();
        return;
      }
      currentItems = employees.filter((employee) => {
        const name = (employee.name || "").toLowerCase();
        const skills = (employee.profile_skills || "").toLowerCase();
        const position = (
          positionById[employee.positionId] || ""
        ).toLowerCase();
        const department = (
          departmentById[employee.departmentId] || ""
        ).toLowerCase();
        return (
          name.includes(query) ||
          skills.includes(query) ||
          position.includes(query) ||
          department.includes(query)
        );
      });
      applySortAndRender();
    }

    function applySortAndRender() {
      const sorted = sortItems(currentItems);
      renderList(sorted);
    }

    applySortAndRender();

    searchBtn.addEventListener("click", applySearch);
    searchInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") applySearch();
    });

    sortKeyEl.addEventListener("change", () => {
      currentSortKey = sortKeyEl.value;
      applySortAndRender();
    });
    sortOrderBtn.addEventListener("click", () => {
      currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
      sortOrderBtn.setAttribute("data-order", currentSortOrder);
      // đổi icon theo thứ tự
      sortOrderBtn.innerHTML =
        currentSortOrder === "asc"
          ? '<i class="fas fa-sort-alpha-down" aria-hidden="true"></i>'
          : '<i class="fas fa-sort-alpha-up" aria-hidden="true"></i>';
      applySortAndRender();
    });

    if (canEdit && drawerClose) {
      drawerClose.addEventListener("click", closeDrawer);
    }
    if (canEdit && drawer) {
      const drawerBackdrop = drawer.querySelector(".drawer-backdrop");
      if (drawerBackdrop) {
        drawerBackdrop.addEventListener("click", closeDrawer);
      }
    }
  },
};
