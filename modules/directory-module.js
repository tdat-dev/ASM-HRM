import { EmployeeDb } from "./employee-db-module.js";
import { escapeHTML, showToast } from "../utils/dom.js";
import { createProfileEditor, DEFAULT_AVATAR } from "./profile-editor.js";
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
    const editor = createProfileEditor(editorWrapper, { showExport: false });
    const cardRefs = new Map();

    let currentItems = [...employees];
    let activeEmployeeId = null;
    let currentSortKey = "name";
    let currentSortOrder = "asc"; // 'asc' | 'desc'
    const collator = new Intl.Collator("vi", { sensitivity: "base" });

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
        const indexAll = employees.findIndex((item) => item.id === employee.id);
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
            <img class="directory-avatar" src="${avatar}" alt="" />
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
      drawer.classList.remove("is-hidden");
      if (drawerClose) {
        drawerClose.focus();
      }
    }

    function closeDrawer() {
      drawer.classList.add("is-hidden");
    }

    async function selectEmployee(employee) {
      activeEmployeeId = employee.id;
      const profile = await loadProfile(employee.id);
      editor.setEmployee(getEmployeeInfo(employee), profile);
      openDrawer();
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

    if (drawerClose) {
      drawerClose.addEventListener("click", closeDrawer);
    }
    if (drawer) {
      drawer.addEventListener("click", (e) => {
        const target = e.target;
        if (
          target &&
          target.getAttribute &&
          target.getAttribute("data-action") === "close"
        ) {
          closeDrawer();
        }
      });
    }
  },
};
