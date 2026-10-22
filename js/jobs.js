// Job Board Controller
// Implements job search, filtering, application workflow, job posting, and applicant tracking

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

let allJobs = [];
let filteredJobs = [];

document.addEventListener('DOMContentLoaded', () => {
  allJobs = StorageService.getJobs();
  setupEventListeners();
  applyFiltersAndRender();
});

function setupEventListeners() {
  const searchInput = document.getElementById('job-search');
  const typeFilter = document.getElementById('job-type-filter');
  const locFilter = document.getElementById('job-location-filter');
  const tabFilter = document.getElementById('job-tab-filter');
  const postBtn = document.getElementById('post-job-btn');
  const applyForm = document.getElementById('apply-job-form');
  const postForm = document.getElementById('post-job-form');

  if (searchInput) searchInput.addEventListener('input', () => applyFiltersAndRender());
  if (typeFilter) typeFilter.addEventListener('change', () => applyFiltersAndRender());
  if (locFilter) locFilter.addEventListener('change', () => applyFiltersAndRender());
  if (tabFilter) tabFilter.addEventListener('change', () => applyFiltersAndRender());

  if (postBtn) {
    postBtn.addEventListener('click', () => {
      const user = AuthService.getCurrentUser();
      if (!user || (user.role !== 'alumni' && user.role !== 'admin')) {
        UI.toast('Posting Notice', 'Only Alumni and Admins can post job openings. Please switch role.', 'warning');
        return;
      }
      document.getElementById('post-job-modal')?.classList.add('active');
    });
  }

  if (applyForm) {
    applyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleApplySubmit();
    });
  }

  if (postForm) {
    postForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePostJobSubmit();
    });
  }
}

function applyFiltersAndRender() {
  const search = document.getElementById('job-search')?.value.trim().toLowerCase() || '';
  const type = document.getElementById('job-type-filter')?.value || '';
  const loc = document.getElementById('job-location-filter')?.value || '';
  const tab = document.getElementById('job-tab-filter')?.value || 'all';
  const user = AuthService.getCurrentUser();

  allJobs = StorageService.getJobs();

  filteredJobs = allJobs.filter(job => {
    // Search
    if (search) {
      const matchTitle = job.title.toLowerCase().includes(search);
      const matchCompany = job.company.toLowerCase().includes(search);
      const matchDesc = job.description.toLowerCase().includes(search);
      if (!matchTitle && !matchCompany && !matchDesc) return false;
    }

    // Type
    if (type && job.type !== type) return false;

    // Location
    if (loc && !job.location.toLowerCase().includes(loc.toLowerCase())) return false;

    // Tab
    if (tab === 'my-apps') {
      return user && Array.isArray(job.applicantIds) && job.applicantIds.includes(user.id);
    } else if (tab === 'my-postings') {
      return user && (job.postedBy === user.id || user.role === 'admin');
    }

    return true;
  });

  renderJobs();
}

function renderJobs() {
  const container = document.getElementById('jobs-container');
  if (!container) return;

  if (filteredJobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💼</div>
        <h3 class="empty-state-title">No Jobs Found</h3>
        <p class="empty-state-desc">
          No career opportunities match your current criteria. Try loosening filters or posting a new position!
        </p>
      </div>
    `;
    return;
  }

  const user = AuthService.getCurrentUser();

  container.innerHTML = filteredJobs.map(job => {
    const isApplied = user && Array.isArray(job.applicantIds) && job.applicantIds.includes(user.id);
    const isMyPosting = user && (job.postedBy === user.id || user.role === 'admin');
    const applicantsCount = job.applicantIds?.length || 0;

    return `
      <div class="card card-hoverable" style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
              <h3 style="font-size: 1.25rem; font-weight: 700;">${job.title}</h3>
              <span class="badge ${job.type === 'Internship' ? 'badge-warning' : 'badge-primary'}">${job.type}</span>
              ${isApplied ? '<span class="badge badge-success">Applied ✓</span>' : ''}
            </div>
            <div style="font-size: 0.95rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.35rem;">
              🏢 ${job.company}
            </div>
            <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap;">
              <span>📍 ${job.location}</span>
              ${job.salary ? `<span>💰 ${job.salary}</span>` : ''}
              <span>⏳ Deadline: ${job.deadline}</span>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; align-items: center;">
            ${isMyPosting ? `
              <button class="btn btn-outline btn-sm view-applicants-btn" data-id="${job.id}">
                👥 View Applicants (${applicantsCount})
              </button>
            ` : ''}

            ${isApplied ? `
              <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.8; cursor: default;">
                ✓ Applied
              </button>
            ` : `
              <button class="btn btn-primary btn-sm open-apply-btn" data-id="${job.id}" data-title="${job.title}" data-company="${job.company}">
                Apply Now →
              </button>
            `}
          </div>
        </div>

        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
          ${job.description}
        </p>

        ${Array.isArray(job.requirements) && job.requirements.length > 0 ? `
          <div style="background: var(--bg-muted); padding: 0.85rem 1.15rem; border-radius: var(--radius-md);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
              Key Requirements
            </div>
            <ul style="padding-left: 1.2rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
              ${job.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  attachJobEvents();
}

function attachJobEvents() {
  document.querySelectorAll('.open-apply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const user = AuthService.getCurrentUser();
      if (!user) {
        UI.toast('Authentication Required', 'Please log in to apply for job opportunities.', 'warning');
        return;
      }

      const jobId = btn.getAttribute('data-id');
      const jobTitle = btn.getAttribute('data-title');
      const company = btn.getAttribute('data-company');

      document.getElementById('apply-job-id').value = jobId;
      document.getElementById('modal-apply-title').textContent = `Apply for ${jobTitle} at ${company}`;
      document.getElementById('apply-name').value = user.name || '';
      document.getElementById('apply-email').value = user.email || '';
      document.getElementById('apply-job-modal')?.classList.add('active');
    });
  });

  document.querySelectorAll('.view-applicants-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-id');
      openApplicantsModal(jobId);
    });
  });
}

function handleApplySubmit() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const jobId = document.getElementById('apply-job-id').value;
  const name = document.getElementById('apply-name').value.trim();
  const email = document.getElementById('apply-email').value.trim();
  const resume = document.getElementById('apply-resume').value.trim();
  const cover = document.getElementById('apply-cover').value.trim();

  const application = {
    userId: user.id,
    name,
    email,
    resume,
    cover
  };

  const res = StorageService.applyToJob(jobId, application);
  if (res.success) {
    document.getElementById('apply-job-modal')?.classList.remove('active');
    document.getElementById('apply-job-form')?.reset();
    UI.toast('Application Submitted!', 'Your application has been received by the hiring alumnus.', 'success');
    applyFiltersAndRender();
    UI.renderHeader();
  } else {
    UI.toast('Submission Notice', res.message, 'warning');
  }
}

function handlePostJobSubmit() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const title = document.getElementById('post-title').value.trim();
  const company = document.getElementById('post-company').value.trim();
  const type = document.getElementById('post-type').value;
  const location = document.getElementById('post-location').value.trim();
  const salary = document.getElementById('post-salary').value.trim();
  const desc = document.getElementById('post-desc').value.trim();
  const deadline = document.getElementById('post-deadline').value;
  const reqs = document.getElementById('post-reqs').value.split(',').map(r => r.trim()).filter(Boolean);

  const newJob = {
    id: 'job-' + Date.now(),
    title,
    company,
    type,
    location,
    salary: salary || "Competitive Compensation",
    description: desc,
    requirements: reqs,
    deadline,
    postedBy: user.id,
    postedDate: new Date().toISOString().split('T')[0],
    applicantIds: []
  };

  StorageService.saveJob(newJob);
  document.getElementById('post-job-modal')?.classList.remove('active');
  document.getElementById('post-job-form')?.reset();

  UI.toast('Job Published', `"${title}" has been listed on the board!`, 'success');
  applyFiltersAndRender();
}

function openApplicantsModal(jobId) {
  const job = StorageService.getJobById(jobId);
  if (!job) return;

  const modal = document.getElementById('applicants-modal');
  const title = document.getElementById('applicants-modal-title');
  const body = document.getElementById('applicants-modal-body');

  if (title) title.textContent = `Applicants for "${job.title}"`;
  
  const applications = job.applications || [];

  if (body) {
    if (applications.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No candidates have submitted applications yet.
        </div>
      `;
    } else {
      body.innerHTML = applications.map(app => `
        <div class="card" style="margin-bottom: 0.75rem; padding: 1rem; background: var(--bg-muted);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <div style="font-weight: 700;">${app.name}</div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${app.appliedAt || 'Recent'}</span>
          </div>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            ✉️ ${app.email} • <a href="${app.resume}" target="_blank" style="color: var(--color-primary); font-weight: 600;">View Resume / Portfolio</a>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
            "${app.cover}"
          </div>
        </div>
      `).join('');
    }
  }

  modal?.classList.add('active');
}
