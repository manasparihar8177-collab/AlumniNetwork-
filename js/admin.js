// Admin Dashboard Controller
// Strict route guarding, KPI calculations, Chart.js integrations, CRUD management, CSV & printable PDF exports

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

let batchChartInstance = null;
let profChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  const isAdmin = checkAdminAccess();
  if (isAdmin) {
    initAdminDashboard();
  }
});

function checkAdminAccess() {
  const guardBanner = document.getElementById('admin-guard-banner');
  const portalContent = document.getElementById('admin-portal-content');
  const user = AuthService.getCurrentUser();

  if (!user || user.role !== 'admin') {
    if (guardBanner) guardBanner.style.display = 'block';
    if (portalContent) portalContent.style.display = 'none';
    return false;
  } else {
    if (guardBanner) guardBanner.style.display = 'none';
    if (portalContent) portalContent.style.display = 'block';
    return true;
  }
}

function initAdminDashboard() {
  renderKpis();
  renderCharts();
  setupTabs();
  renderAlumniTable();
  renderEventsTable();
  renderJobsTable();
  renderCampaignsTable();
  renderActivityTable();
  setupExportButtons();
}

function renderKpis() {
  const alumni = StorageService.getAlumni();
  const events = StorageService.getEvents();
  const jobs = StorageService.getJobs();
  const campaigns = StorageService.getCampaigns();

  const totalDonations = campaigns.reduce((acc, c) => acc + (Number(c.raised) || 0), 0);

  document.getElementById('adm-stat-alumni').textContent = alumni.length;
  document.getElementById('adm-stat-events').textContent = events.length;
  document.getElementById('adm-stat-jobs').textContent = jobs.length;
  document.getElementById('adm-stat-donations').textContent = `₹${(totalDonations / 100000).toFixed(1)}L`;
}

function renderCharts() {
  const alumni = StorageService.getAlumni();

  // Cohort Counts
  const cohorts = { "2010–2015": 0, "2016–2020": 0, "2021–2025": 0 };
  alumni.forEach(a => {
    if (cohorts[a.batchRange] !== undefined) {
      cohorts[a.batchRange]++;
    } else {
      cohorts["2021–2025"]++;
    }
  });

  // Profession Counts
  const profs = {};
  alumni.forEach(a => {
    profs[a.profession] = (profs[a.profession] || 0) + 1;
  });

  // Chart 1: Batches (Bar)
  const ctxBatch = document.getElementById('chart-batches')?.getContext('2d');
  if (ctxBatch) {
    if (batchChartInstance) batchChartInstance.destroy();
    batchChartInstance = new Chart(ctxBatch, {
      type: 'bar',
      data: {
        labels: Object.keys(cohorts),
        datasets: [{
          label: 'Alumni Count',
          data: Object.values(cohorts),
          backgroundColor: ['#0EA5E9', '#0284C7', '#38BDF8'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  // Chart 2: Professions (Doughnut)
  const ctxProf = document.getElementById('chart-professions')?.getContext('2d');
  if (ctxProf) {
    if (profChartInstance) profChartInstance.destroy();
    profChartInstance = new Chart(ctxProf, {
      type: 'doughnut',
      data: {
        labels: Object.keys(profs),
        datasets: [{
          data: Object.values(profs),
          backgroundColor: ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }
}

function setupTabs() {
  const tabs = [
    { btn: 'tab-btn-alumni', content: 'admin-tab-alumni' },
    { btn: 'tab-btn-events', content: 'admin-tab-events' },
    { btn: 'tab-btn-jobs', content: 'admin-tab-jobs' },
    { btn: 'tab-btn-campaigns', content: 'admin-tab-campaigns' },
    { btn: 'tab-btn-activity', content: 'admin-tab-activity' }
  ];

  tabs.forEach(tab => {
    const btn = document.getElementById(tab.btn);
    if (!btn) return;
    btn.addEventListener('click', () => {
      tabs.forEach(t => {
        const b = document.getElementById(t.btn);
        const c = document.getElementById(t.content);
        if (b) b.className = 'btn btn-sm btn-outline';
        if (c) c.style.display = 'none';
      });
      btn.className = 'btn btn-sm btn-primary';
      const activeContent = document.getElementById(tab.content);
      if (activeContent) activeContent.style.display = 'block';
    });
  });

  // Search in alumni table
  const searchInput = document.getElementById('adm-alumni-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderAlumniTable(e.target.value.toLowerCase().trim());
    });
  }

  // Add new alumni button
  const addBtn = document.getElementById('adm-add-alumni-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      document.getElementById('admin-alm-id').value = '';
      document.getElementById('admin-alm-modal-title').textContent = 'Add New Alumnus Record';
      document.getElementById('admin-alumni-form')?.reset();
      document.getElementById('admin-alumni-modal')?.classList.add('active');
    });
  }

  // Form submit
  const form = document.getElementById('admin-alumni-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveAlumnus();
    });
  }

  // Admin Reset button
  const resetBtn = document.getElementById('admin-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Reset ALL data (alumni, events, jobs, donations, campaigns) back to seed state?")) {
        StorageService.resetToDefaults();
        UI.toast('Reset Complete', 'Database reset to original seed state.', 'info');
        setTimeout(() => window.location.reload(), 400);
      }
    });
  }
}

function renderAlumniTable(query = '') {
  const container = document.getElementById('adm-alumni-table-container');
  if (!container) return;

  let alumni = StorageService.getAlumni();
  if (query) {
    alumni = alumni.filter(a => a.name.toLowerCase().includes(query) || a.company.toLowerCase().includes(query) || a.email.toLowerCase().includes(query));
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Name & Email</th>
            <th>Batch & Branch</th>
            <th>Profession</th>
            <th>Company</th>
            <th>Location</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${alumni.map(alm => `
            <tr>
              <td>
                <div style="font-weight: 700;">${alm.name}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${alm.email}</div>
              </td>
              <td>${alm.batch} (${alm.branch})</td>
              <td><span class="badge badge-primary">${alm.profession}</span></td>
              <td>${alm.company}</td>
              <td>${alm.location}</td>
              <td style="text-align: right;">
                <button class="btn btn-outline btn-sm adm-edit-alm-btn" data-id="${alm.id}">Edit</button>
                <button class="btn btn-outline btn-sm adm-del-alm-btn" data-id="${alm.id}" data-name="${alm.name}" style="color: var(--color-danger);">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach delete handlers with confirmation
  container.querySelectorAll('.adm-del-alm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      if (confirm(`Are you sure you want to delete alumnus "${name}"? This action cannot be undone.`)) {
        StorageService.deleteAlumnus(id);
        UI.toast('Deleted', `Alumnus "${name}" was removed.`, 'info');
        renderAlumniTable();
        renderKpis();
        renderCharts();
      }
    });
  });

  // Attach edit handlers
  container.querySelectorAll('.adm-edit-alm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const alm = StorageService.getAlumnusById(id);
      if (!alm) return;

      document.getElementById('admin-alm-id').value = alm.id;
      document.getElementById('admin-alm-modal-title').textContent = `Edit Alumnus: ${alm.name}`;
      document.getElementById('adm-alm-name').value = alm.name;
      document.getElementById('adm-alm-email').value = alm.email;
      document.getElementById('adm-alm-profession').value = alm.profession;
      document.getElementById('adm-alm-company').value = alm.company;
      document.getElementById('adm-alm-batch').value = alm.batch;
      document.getElementById('adm-alm-branch').value = alm.branch;
      document.getElementById('adm-alm-location').value = alm.location;
      document.getElementById('adm-alm-skills').value = (alm.skills || []).join(', ');
      document.getElementById('adm-alm-bio').value = alm.bio || '';

      document.getElementById('admin-alumni-modal')?.classList.add('active');
    });
  });
}

function handleSaveAlumnus() {
  const id = document.getElementById('admin-alm-id').value;
  const name = document.getElementById('adm-alm-name').value.trim();
  const email = document.getElementById('adm-alm-email').value.trim();
  const profession = document.getElementById('adm-alm-profession').value;
  const company = document.getElementById('adm-alm-company').value.trim();
  const batch = document.getElementById('adm-alm-batch').value.trim();
  const branch = document.getElementById('adm-alm-branch').value;
  const location = document.getElementById('adm-alm-location').value;
  const skills = document.getElementById('adm-alm-skills').value.split(',').map(s => s.trim()).filter(Boolean);
  const bio = document.getElementById('adm-alm-bio').value.trim();

  let batchRange = '2021–2025';
  const num = parseInt(batch, 10);
  if (num >= 2010 && num <= 2015) batchRange = '2010–2015';
  else if (num >= 2016 && num <= 2020) batchRange = '2016–2020';

  const alumnusData = {
    id: id || ('alm-' + Date.now()),
    name,
    email,
    profession,
    company,
    batch,
    batchRange,
    branch,
    location,
    skills,
    bio,
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    education: `B.Tech in ${branch}, Batch of ${batch}`,
    experience: `${profession} at ${company}`
  };

  StorageService.saveAlumnus(alumnusData);
  document.getElementById('admin-alumni-modal')?.classList.remove('active');
  UI.toast('Record Saved', `Alumnus "${name}" successfully saved.`, 'success');
  renderAlumniTable();
  renderKpis();
  renderCharts();
}

function renderEventsTable() {
  const container = document.getElementById('adm-events-table-container');
  if (!container) return;

  const events = StorageService.getEvents();

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Event Title</th>
            <th>Date & Time</th>
            <th>Category</th>
            <th>Venue</th>
            <th>RSVP / Capacity</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${events.map(e => `
            <tr>
              <td style="font-weight: 700;">${e.title}</td>
              <td>${e.date} (${e.time})</td>
              <td><span class="badge badge-primary">${e.category}</span></td>
              <td>${e.venue}</td>
              <td>${e.rsvpIds?.length || 0} / ${e.capacity}</td>
              <td style="text-align: right;">
                <button class="btn btn-outline btn-sm adm-del-evt-btn" data-id="${e.id}" data-title="${e.title}" style="color: var(--color-danger);">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.adm-del-evt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      if (confirm(`Are you sure you want to delete event "${title}"?`)) {
        StorageService.deleteEvent(id);
        UI.toast('Deleted', `Event "${title}" was removed.`, 'info');
        renderEventsTable();
        renderKpis();
      }
    });
  });
}

function renderJobsTable() {
  const container = document.getElementById('adm-jobs-table-container');
  if (!container) return;

  const jobs = StorageService.getJobs();

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Role Title</th>
            <th>Company</th>
            <th>Type</th>
            <th>Location</th>
            <th>Applicants</th>
            <th>Deadline</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${jobs.map(j => `
            <tr>
              <td style="font-weight: 700;">${j.title}</td>
              <td>${j.company}</td>
              <td><span class="badge badge-warning">${j.type}</span></td>
              <td>${j.location}</td>
              <td><strong>${j.applicantIds?.length || 0}</strong> applicants</td>
              <td>${j.deadline}</td>
              <td style="text-align: right;">
                <button class="btn btn-outline btn-sm adm-del-job-btn" data-id="${j.id}" data-title="${j.title}" style="color: var(--color-danger);">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.adm-del-job-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      if (confirm(`Are you sure you want to remove job listing "${title}"?`)) {
        StorageService.deleteJob(id);
        UI.toast('Deleted', `Job "${title}" deleted.`, 'info');
        renderJobsTable();
        renderKpis();
      }
    });
  });
}

function renderCampaignsTable() {
  const container = document.getElementById('adm-campaigns-table-container');
  if (!container) return;

  const campaigns = StorageService.getCampaigns();

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Campaign Title</th>
            <th>Category</th>
            <th>Target Goal</th>
            <th>Raised Total</th>
            <th>Progress</th>
            <th>Donors</th>
            <th>Deadline</th>
          </tr>
        </thead>
        <tbody>
          ${campaigns.map(c => {
            const pct = Math.min(100, Math.round(((Number(c.raised) || 0) / Number(c.goal)) * 100));
            return `
              <tr>
                <td style="font-weight: 700;">${c.title}</td>
                <td><span class="badge badge-primary">${c.category}</span></td>
                <td>₹${(Number(c.goal)).toLocaleString('en-IN')}</td>
                <td style="font-weight: 700; color: var(--color-primary);">₹${(Number(c.raised)).toLocaleString('en-IN')}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="progress-container" style="width: 80px; height: 6px;">
                      <div class="progress-bar" style="width: ${pct}%;"></div>
                    </div>
                    <span style="font-size: 0.75rem;">${pct}%</span>
                  </div>
                </td>
                <td>${(c.donations || []).length}</td>
                <td>${c.deadline}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderActivityTable() {
  const container = document.getElementById('adm-activity-table-container');
  if (!container) return;

  const logs = StorageService.getActivityLogs();

  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action Category</th>
            <th>Activity Details</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td style="font-size: 0.8rem; color: var(--text-muted);">${log.timestamp}</td>
              <td><span class="badge badge-neutral">${log.action}</span></td>
              <td>${log.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function setupExportButtons() {
  // CSV Export
  const csvBtn = document.getElementById('export-csv-btn');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      exportAlumniCSV();
    });
  }

  // PDF / Print
  const printBtn = document.getElementById('print-pdf-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

function exportAlumniCSV() {
  const alumni = StorageService.getAlumni();
  if (alumni.length === 0) {
    UI.toast('Export Notice', 'No alumni records found to export.', 'warning');
    return;
  }

  const headers = ['ID', 'Name', 'Email', 'Batch', 'Branch', 'Location', 'Profession', 'Company', 'Skills'];
  const rows = alumni.map(a => [
    `"${a.id}"`,
    `"${a.name.replace(/"/g, '""')}"`,
    `"${a.email}"`,
    `"${a.batch}"`,
    `"${a.branch}"`,
    `"${a.location}"`,
    `"${a.profession}"`,
    `"${a.company.replace(/"/g, '""')}"`,
    `"${(a.skills || []).join('; ')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `AlumniNetwork_Directory_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  UI.toast('CSV Export Ready', 'Alumni directory CSV downloaded successfully!', 'success');
}
