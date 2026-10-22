// Alumni Directory Controller
// Implements multi-filtering, debounced search, sorting, pagination, card/list views, and quick modals

import { StorageService } from './storage.js';
import { UI } from './ui.js';

let allAlumni = [];
let filteredAlumni = [];
let currentPage = 1;
const itemsPerPage = 9;
let currentViewMode = 'card'; // 'card' or 'list'

document.addEventListener('DOMContentLoaded', () => {
  allAlumni = StorageService.getAlumni();
  filteredAlumni = [...allAlumni];
  
  setupEventListeners();
  applyFiltersAndRender();
});

function setupEventListeners() {
  const searchInput = document.getElementById('dir-search');
  const filterBatch = document.getElementById('filter-batch');
  const filterBranch = document.getElementById('filter-branch');
  const filterLocation = document.getElementById('filter-location');
  const filterProfession = document.getElementById('filter-profession');
  const sortSelect = document.getElementById('dir-sort');
  const clearBtn = document.getElementById('filter-clear-btn');
  const viewCardBtn = document.getElementById('view-card-btn');
  const viewListBtn = document.getElementById('view-list-btn');

  // Debounced search
  let debounceTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        currentPage = 1;
        applyFiltersAndRender();
      }, 200);
    });
  }

  [filterBatch, filterBranch, filterLocation, filterProfession, sortSelect].forEach(select => {
    if (select) {
      select.addEventListener('change', () => {
        currentPage = 1;
        applyFiltersAndRender();
      });
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (filterBatch) filterBatch.value = '';
      if (filterBranch) filterBranch.value = '';
      if (filterLocation) filterLocation.value = '';
      if (filterProfession) filterProfession.value = '';
      if (sortSelect) sortSelect.value = 'batch-desc';
      currentPage = 1;
      applyFiltersAndRender();
    });
  }

  if (viewCardBtn && viewListBtn) {
    viewCardBtn.addEventListener('click', () => {
      currentViewMode = 'card';
      viewCardBtn.style.background = 'var(--color-primary-light)';
      viewCardBtn.style.color = 'var(--color-primary)';
      viewListBtn.style.background = 'transparent';
      viewListBtn.style.color = 'var(--text-primary)';
      renderAlumni();
    });

    viewListBtn.addEventListener('click', () => {
      currentViewMode = 'list';
      viewListBtn.style.background = 'var(--color-primary-light)';
      viewListBtn.style.color = 'var(--color-primary)';
      viewCardBtn.style.background = 'transparent';
      viewCardBtn.style.color = 'var(--text-primary)';
      renderAlumni();
    });
  }
}

function applyFiltersAndRender() {
  const search = document.getElementById('dir-search')?.value.trim().toLowerCase() || '';
  const batch = document.getElementById('filter-batch')?.value || '';
  const branch = document.getElementById('filter-branch')?.value || '';
  const location = document.getElementById('filter-location')?.value || '';
  const profession = document.getElementById('filter-profession')?.value || '';
  const sort = document.getElementById('dir-sort')?.value || 'batch-desc';

  filteredAlumni = allAlumni.filter(alm => {
    // Search query check
    if (search) {
      const matchName = alm.name.toLowerCase().includes(search);
      const matchCompany = alm.company.toLowerCase().includes(search);
      const matchBio = alm.bio.toLowerCase().includes(search);
      const matchProf = alm.profession.toLowerCase().includes(search);
      const matchSkills = Array.isArray(alm.skills) && alm.skills.some(s => s.toLowerCase().includes(search));
      if (!matchName && !matchCompany && !matchBio && !matchProf && !matchSkills) return false;
    }

    // Batch range check
    if (batch && alm.batchRange !== batch) return false;

    // Branch check
    if (branch && alm.branch !== branch) return false;

    // Location check
    if (location && alm.location !== location) return false;

    // Profession check
    if (profession && alm.profession !== profession) return false;

    return true;
  });

  // Sort
  filteredAlumni.sort((a, b) => {
    if (sort === 'batch-desc') return Number(b.batch) - Number(a.batch);
    if (sort === 'batch-asc') return Number(a.batch) - Number(b.batch);
    if (sort === 'name-asc') return a.name.localeCompare(b.name);
    if (sort === 'name-desc') return b.name.localeCompare(a.name);
    return 0;
  });

  updateCountAndTags(search, batch, branch, location, profession);
  renderAlumni();
  renderPagination();
}

function updateCountAndTags(search, batch, branch, location, profession) {
  const countText = document.getElementById('dir-count-text');
  if (countText) {
    countText.textContent = `Showing ${filteredAlumni.length} of ${allAlumni.length} alumni`;
  }

  const tagsContainer = document.getElementById('active-tags-container');
  if (!tagsContainer) return;

  const tags = [];
  if (search) tags.push(`Query: "${search}"`);
  if (batch) tags.push(`Batch: ${batch}`);
  if (branch) tags.push(`Branch: ${branch}`);
  if (location) tags.push(`Location: ${location}`);
  if (profession) tags.push(`Role: ${profession}`);

  tagsContainer.innerHTML = tags.map(t => `
    <span class="badge badge-primary" style="padding: 0.35rem 0.65rem;">${t}</span>
  `).join('');
}

function renderAlumni() {
  const container = document.getElementById('directory-container');
  if (!container) return;

  if (filteredAlumni.length === 0) {
    container.style.display = 'block';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔎</div>
        <h3 class="empty-state-title">No Alumni Found</h3>
        <p class="empty-state-desc">
          We couldn't find any alumni matching your specific filters. Try clearing some filters or searching for different keywords.
        </p>
        <button class="btn btn-primary" onclick="document.getElementById('filter-clear-btn').click()">
          Clear All Filters
        </button>
      </div>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredAlumni.slice(startIndex, startIndex + itemsPerPage);

  if (currentViewMode === 'card') {
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(290px, 1fr))';
    container.innerHTML = pageItems.map(alm => `
      <div class="card card-hoverable" style="display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <img src="${alm.photo}" alt="${alm.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary-light);">
          <div style="flex: 1; overflow: hidden;">
            <h4 style="font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alm.name}</h4>
            <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${alm.profession}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${alm.company}
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
          <span class="badge badge-neutral">🎓 ${alm.batch}</span>
          <span class="badge badge-neutral">📍 ${alm.location}</span>
          <span class="badge badge-primary">${alm.branch}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem; flex: 1;">
          ${alm.bio.length > 115 ? alm.bio.substring(0, 115) + '...' : alm.bio}
        </p>

        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
          ${alm.skills.slice(0, 3).map(s => `<span class="badge badge-neutral" style="font-size: 0.72rem;">${s}</span>`).join('')}
          ${alm.skills.length > 3 ? `<span class="badge badge-neutral" style="font-size: 0.72rem;">+${alm.skills.length - 3}</span>` : ''}
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button class="btn btn-outline btn-sm quick-view-btn" data-id="${alm.id}" style="flex: 1;">
            Quick View
          </button>
          <a href="profile.html?id=${alm.id}" class="btn btn-primary btn-sm" style="flex: 1;">
            Profile →
          </a>
        </div>
      </div>
    `).join('');
  } else {
    // List view table
    container.style.display = 'block';
    container.innerHTML = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Alumnus</th>
              <th>Profession & Company</th>
              <th>Batch & Branch</th>
              <th>Location</th>
              <th>Top Skills</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${pageItems.map(alm => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${alm.photo}" alt="${alm.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <div>
                      <div style="font-weight: 700;">${alm.name}</div>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">${alm.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600;">${alm.profession}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">${alm.company}</div>
                </td>
                <td>
                  <div>Class of ${alm.batch}</div>
                  <div style="font-size: 0.78rem; color: var(--text-muted);">${alm.branch}</div>
                </td>
                <td>📍 ${alm.location}</td>
                <td>
                  <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                    ${alm.skills.slice(0, 2).map(s => `<span class="badge badge-neutral" style="font-size: 0.7rem;">${s}</span>`).join('')}
                  </div>
                </td>
                <td style="text-align: right;">
                  <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                    <button class="btn btn-outline btn-sm quick-view-btn" data-id="${alm.id}">View</button>
                    <a href="profile.html?id=${alm.id}" class="btn btn-primary btn-sm">Full Profile</a>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Attach quick view triggers
  container.querySelectorAll('.quick-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openQuickViewModal(id);
    });
  });
}

function renderPagination() {
  const container = document.getElementById('directory-pagination');
  if (!container) return;

  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn-outline btn-sm" ${currentPage === 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} id="page-prev-btn">
      ← Prev
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="btn btn-sm ${currentPage === i ? 'btn-primary' : 'btn-outline'}" data-page="${i}">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="btn btn-outline btn-sm" ${currentPage === totalPages ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} id="page-next-btn">
      Next →
    </button>
  `;

  container.innerHTML = html;

  container.querySelectorAll('[data-page]').forEach(b => {
    b.addEventListener('click', () => {
      currentPage = Number(b.getAttribute('data-page'));
      renderAlumni();
      renderPagination();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  });

  const prevBtn = document.getElementById('page-prev-btn');
  const nextBtn = document.getElementById('page-next-btn');

  if (prevBtn && currentPage > 1) {
    prevBtn.addEventListener('click', () => {
      currentPage--;
      renderAlumni();
      renderPagination();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  }

  if (nextBtn && currentPage < totalPages) {
    nextBtn.addEventListener('click', () => {
      currentPage++;
      renderAlumni();
      renderPagination();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  }
}

function openQuickViewModal(alumnusId) {
  const alm = StorageService.getAlumnusById(alumnusId);
  if (!alm) return;

  const modalBody = document.getElementById('modal-profile-body');
  const fullProfileLink = document.getElementById('modal-full-profile-btn');

  if (fullProfileLink) {
    fullProfileLink.href = `profile.html?id=${alm.id}`;
  }

  if (modalBody) {
    modalBody.innerHTML = `
      <div style="display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <img src="${alm.photo}" alt="${alm.name}" style="width: 90px; height: 90px; border-radius: var(--radius-lg); object-fit: cover; border: 3px solid var(--color-primary-light);">
        <div style="flex: 1;">
          <h2 style="font-size: 1.4rem; margin-bottom: 0.25rem;">${alm.name}</h2>
          <div style="font-size: 0.95rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.25rem;">
            ${alm.profession} at ${alm.company}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <span>🎓 Class of ${alm.batch} (${alm.branch})</span>
            <span>📍 ${alm.location}</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">
          Biography
        </h4>
        <p style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.6;">
          ${alm.bio}
        </p>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">
          Education & Career Highlights
        </h4>
        <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.35rem;">
          📚 <strong>Education:</strong> ${alm.education || 'B.Tech Graduate'}
        </div>
        <div style="font-size: 0.88rem; color: var(--text-secondary);">
          💼 <strong>Experience:</strong> ${alm.experience || 'Industry Professional'}
        </div>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">
          Skills & Expertise
        </h4>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${alm.skills.map(s => `<span class="badge badge-primary">${s}</span>`).join('')}
        </div>
      </div>

      <div style="padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 0.85rem; color: var(--text-muted);">✉️ ${alm.email}</span>
        <a href="mentorship.html" class="btn btn-outline btn-sm">Request Mentorship</a>
      </div>
    `;
  }

  const modal = document.getElementById('alumni-modal');
  if (modal) modal.classList.add('active');
}
