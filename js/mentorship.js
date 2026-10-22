// Mentorship Hub Controller
// Manages mentor directory, 1-on-1 request submissions, and mentor approval dashboards

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

let allMentors = [];
let filteredMentors = [];

document.addEventListener('DOMContentLoaded', () => {
  allMentors = StorageService.getMentors();
  setupEventListeners();
  applyFiltersAndRender();
  checkUrlParams();
});

function setupEventListeners() {
  const searchInput = document.getElementById('mentor-search');
  const expertiseFilter = document.getElementById('mentor-expertise-filter');
  const tabBrowseBtn = document.getElementById('tab-browse-btn');
  const tabDashBtn = document.getElementById('tab-my-requests-btn');
  const becomeBtn = document.getElementById('become-mentor-btn');
  const reqForm = document.getElementById('request-mentorship-form');
  const mentorForm = document.getElementById('become-mentor-form');

  if (searchInput) searchInput.addEventListener('input', () => applyFiltersAndRender());
  if (expertiseFilter) expertiseFilter.addEventListener('change', () => applyFiltersAndRender());

  if (tabBrowseBtn && tabDashBtn) {
    tabBrowseBtn.addEventListener('click', () => {
      tabBrowseBtn.className = 'btn btn-sm btn-primary';
      tabDashBtn.className = 'btn btn-sm btn-outline';
      document.getElementById('tab-browse-content').style.display = 'block';
      document.getElementById('tab-dashboard-content').style.display = 'none';
    });

    tabDashBtn.addEventListener('click', () => {
      tabDashBtn.className = 'btn btn-sm btn-primary';
      tabBrowseBtn.className = 'btn btn-sm btn-outline';
      document.getElementById('tab-browse-content').style.display = 'none';
      document.getElementById('tab-dashboard-content').style.display = 'block';
      renderDashboard();
    });
  }

  if (becomeBtn) {
    becomeBtn.addEventListener('click', () => {
      const user = AuthService.getCurrentUser();
      if (!user || (user.role !== 'alumni' && user.role !== 'admin')) {
        UI.toast('Access Notice', 'Only alumni can register as mentors. Please switch role to Alumni.', 'warning');
        return;
      }
      openBecomeMentorModal();
    });
  }

  if (reqForm) {
    reqForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleRequestSubmit();
    });
  }

  if (mentorForm) {
    mentorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleMentorFormSubmit();
    });
  }
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const mentorId = params.get('mentorId');
  if (mentorId) {
    setTimeout(() => {
      openRequestModal(mentorId);
    }, 200);
  }
}

function applyFiltersAndRender() {
  const search = document.getElementById('mentor-search')?.value.trim().toLowerCase() || '';
  const expertise = document.getElementById('mentor-expertise-filter')?.value || '';

  allMentors = StorageService.getMentors();

  filteredMentors = allMentors.filter(mentor => {
    const alm = StorageService.getAlumnusById(mentor.alumniId) || {};
    
    // Search
    if (search) {
      const matchName = (alm.name || '').toLowerCase().includes(search);
      const matchCompany = (alm.company || '').toLowerCase().includes(search);
      const matchBio = (mentor.bio || '').toLowerCase().includes(search);
      const matchExp = (mentor.expertise || []).some(e => e.toLowerCase().includes(search));
      if (!matchName && !matchCompany && !matchBio && !matchExp) return false;
    }

    // Expertise
    if (expertise) {
      const hasExp = (mentor.expertise || []).some(e => e.toLowerCase().includes(expertise.toLowerCase()));
      if (!hasExp) return false;
    }

    return true;
  });

  renderMentors();
}

function renderMentors() {
  const container = document.getElementById('mentors-grid');
  if (!container) return;

  if (filteredMentors.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🤝</div>
        <h3 class="empty-state-title">No Mentors Match</h3>
        <p class="empty-state-desc">Try clearing your filters to explore all available alumni mentors.</p>
      </div>
    `;
    return;
  }

  const user = AuthService.getCurrentUser();

  container.innerHTML = filteredMentors.map(m => {
    const alm = StorageService.getAlumnusById(m.alumniId) || {
      name: "Alumni Mentor",
      profession: "Engineering Leader",
      company: "Industry",
      photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      batch: "2015",
      branch: "Computer Science"
    };

    const hasPendingReq = user && (m.requests || []).some(r => r.studentId === user.id && r.status === 'pending');
    const hasAcceptedReq = user && (m.requests || []).some(r => r.studentId === user.id && r.status === 'accepted');

    return `
      <div class="card card-hoverable" style="display: flex; flex-direction: column;">
        <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
          <img src="${alm.photo}" alt="${alm.name}" style="width: 64px; height: 64px; border-radius: var(--radius-lg); object-fit: cover; border: 2px solid var(--color-primary-light);">
          <div style="flex: 1; overflow: hidden;">
            <h3 style="font-size: 1.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alm.name}</h3>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary);">${alm.profession}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${alm.company} • Class of ${alm.batch}</div>
          </div>
        </div>

        <div style="background: var(--bg-muted); padding: 0.65rem 0.85rem; border-radius: var(--radius-md); font-size: 0.8rem; margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
          <span>⏱️</span>
          <span><strong>Availability:</strong> ${m.availability || '2 hours/week'}</span>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem; flex: 1;">
          ${m.bio}
        </p>

        <div style="margin-bottom: 1.25rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">
            Expertise & Guidance Topics
          </div>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            ${(m.expertise || []).map(exp => `<span class="badge badge-primary" style="font-size: 0.72rem;">${exp}</span>`).join('')}
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: auto;">
          <a href="profile.html?id=${alm.id}" class="btn btn-outline btn-sm" style="flex: 1;">
            View Bio
          </a>

          ${hasAcceptedReq ? `
            <button class="btn btn-secondary btn-sm" style="flex: 1;" onclick="document.getElementById('tab-my-requests-btn').click()">
              ✓ Connected
            </button>
          ` : hasPendingReq ? `
            <button class="btn btn-outline btn-sm" style="flex: 1; opacity: 0.8; cursor: default;">
              ⏳ Request Sent
            </button>
          ` : `
            <button class="btn btn-primary btn-sm request-mentor-btn" data-id="${m.id}" data-name="${alm.name}" style="flex: 1;">
              Request Mentorship
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.request-mentor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mentorId = btn.getAttribute('data-id');
      openRequestModal(mentorId);
    });
  });
}

function openRequestModal(mentorId) {
  const user = AuthService.getCurrentUser();
  if (!user) {
    UI.toast('Sign In Required', 'Please log in to send mentorship requests.', 'warning');
    return;
  }

  const mentor = StorageService.getMentorById(mentorId);
  if (!mentor) return;
  const alm = StorageService.getAlumnusById(mentor.alumniId) || { name: "Alumni Mentor" };

  document.getElementById('req-mentor-id').value = mentor.id;
  document.getElementById('modal-req-title').textContent = `Request Mentorship from ${alm.name}`;
  document.getElementById('request-mentorship-modal')?.classList.add('active');
}

function handleRequestSubmit() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const mentorId = document.getElementById('req-mentor-id').value;
  const topic = document.getElementById('req-topic').value.trim();
  const message = document.getElementById('req-message').value.trim();
  const schedule = document.getElementById('req-schedule').value.trim();

  const reqData = {
    studentId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    topic,
    message: `${message}${schedule ? ` (Preferred time: ${schedule})` : ''}`
  };

  const res = StorageService.sendMentorshipRequest(mentorId, reqData);
  if (res.success) {
    document.getElementById('request-mentorship-modal')?.classList.remove('active');
    document.getElementById('request-mentorship-form')?.reset();
    UI.toast('Request Sent!', 'The mentor has been notified. Check your Mentorship Dashboard for updates.', 'success');
    applyFiltersAndRender();
    UI.renderHeader();
  } else {
    UI.toast('Notice', res.message, 'warning');
  }
}

function renderDashboard() {
  const container = document.getElementById('dashboard-container');
  if (!container) return;

  const user = AuthService.getCurrentUser();
  if (!user) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">Please Sign In</h3>
        <p class="empty-state-desc">Log in to view incoming and outgoing mentorship requests.</p>
        <a href="login.html" class="btn btn-primary">Sign In</a>
      </div>
    `;
    return;
  }

  // Check if current user is also a mentor
  const myMentorProfile = StorageService.getMentorByAlumniId(user.alumniId || user.id);
  const allMentorsList = StorageService.getMentors();

  // Find all requests where user is the student
  const mySentRequests = [];
  allMentorsList.forEach(m => {
    const alm = StorageService.getAlumnusById(m.alumniId);
    (m.requests || []).forEach(r => {
      if (r.studentId === user.id) {
        mySentRequests.push({ ...r, mentorName: alm ? alm.name : 'Mentor', mentorEmail: alm ? alm.email : '', mentorPhoto: alm ? alm.photo : '' });
      }
    });
  });

  const incomingRequests = myMentorProfile ? (myMentorProfile.requests || []) : [];

  container.innerHTML = `
    ${myMentorProfile ? `
      <!-- Incoming Requests for Mentors -->
      <div style="margin-bottom: 3rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700;">Incoming Requests from Students (${incomingRequests.length})</h2>
          <span class="badge badge-success">Mentor Active</span>
        </div>

        ${incomingRequests.length === 0 ? `
          <div class="card" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No pending incoming mentorship requests right now.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${incomingRequests.map(req => `
              <div class="card" style="border-left: 4px solid ${req.status === 'accepted' ? 'var(--color-success)' : req.status === 'declined' ? 'var(--color-danger)' : 'var(--color-primary)'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <div>
                    <h4 style="font-size: 1.1rem; font-weight: 700;">${req.studentName}</h4>
                    <div style="font-size: 0.82rem; color: var(--text-muted);">✉️ ${req.studentEmail} • Sent on ${req.date}</div>
                  </div>
                  <div>
                    <span class="badge ${req.status === 'accepted' ? 'badge-success' : req.status === 'declined' ? 'badge-danger' : 'badge-warning'}">
                      ${req.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div style="font-size: 0.9rem; font-weight: 600; color: var(--color-primary); margin-bottom: 0.4rem;">
                  Goal: ${req.topic}
                </div>

                <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
                  "${req.message}"
                </p>

                ${req.status === 'pending' ? `
                  <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-primary btn-sm accept-req-btn" data-mentor="${myMentorProfile.id}" data-req="${req.id}">
                      ✓ Accept Mentorship
                    </button>
                    <button class="btn btn-outline btn-sm decline-req-btn" data-mentor="${myMentorProfile.id}" data-req="${req.id}" style="color: var(--color-danger);">
                      Decline
                    </button>
                  </div>
                ` : `
                  <div style="font-size: 0.82rem; color: var(--text-muted);">
                    Status updated to <strong>${req.status}</strong>.
                  </div>
                `}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    ` : ''}

    <!-- Outgoing Requests Sent by User -->
    <div>
      <h2 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 1.25rem;">
        My Mentorship Requests (${mySentRequests.length})
      </h2>

      ${mySentRequests.length === 0 ? `
        <div class="card" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📬</div>
          <p style="font-size: 0.95rem; margin-bottom: 1rem;">You have not sent any mentorship requests yet.</p>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('tab-browse-btn').click()">
            Explore Mentors & Request
          </button>
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${mySentRequests.map(req => `
            <div class="card" style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <img src="${req.mentorPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                  <div>
                    <h4 style="font-size: 1.05rem; font-weight: 700;">Mentor: ${req.mentorName}</h4>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Requested on: ${req.date}</div>
                  </div>
                </div>

                <span class="badge ${req.status === 'accepted' ? 'badge-success' : req.status === 'declined' ? 'badge-danger' : 'badge-warning'}">
                  ${req.status === 'accepted' ? '✓ Request Accepted' : req.status === 'declined' ? 'Declined' : '⏳ Pending Response'}
                </span>
              </div>

              <div style="font-size: 0.88rem; color: var(--text-secondary);">
                <strong>Topic:</strong> ${req.topic}
              </div>

              <div style="font-size: 0.85rem; color: var(--text-muted); background: var(--bg-muted); padding: 0.75rem; border-radius: var(--radius-md);">
                "${req.message}"
              </div>

              ${req.status === 'accepted' ? `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--color-success); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem;">
                  🎉 <strong>Congratulations!</strong> Your mentor is ready to connect. You can reach out directly via email at: <strong><a href="mailto:${req.mentorEmail}">${req.mentorEmail}</a></strong>.
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;

  // Attach Accept & Decline listeners
  container.querySelectorAll('.accept-req-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mentorId = btn.getAttribute('data-mentor');
      const reqId = btn.getAttribute('data-req');
      StorageService.updateMentorshipStatus(mentorId, reqId, 'accepted');
      UI.toast('Mentorship Accepted', 'Student has been notified!', 'success');
      renderDashboard();
      UI.renderHeader();
    });
  });

  container.querySelectorAll('.decline-req-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mentorId = btn.getAttribute('data-mentor');
      const reqId = btn.getAttribute('data-req');
      StorageService.updateMentorshipStatus(mentorId, reqId, 'declined');
      UI.toast('Request Declined', 'Status updated.', 'info');
      renderDashboard();
      UI.renderHeader();
    });
  });
}

function openBecomeMentorModal() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const existingMentor = StorageService.getMentorByAlumniId(user.alumniId || user.id);
  if (existingMentor) {
    document.getElementById('mentor-availability').value = existingMentor.availability || '';
    document.getElementById('mentor-expertise').value = (existingMentor.expertise || []).join(', ');
    document.getElementById('mentor-topics').value = (existingMentor.topics || []).join(', ');
    document.getElementById('mentor-bio').value = existingMentor.bio || '';
  }

  document.getElementById('become-mentor-modal')?.classList.add('active');
}

function handleMentorFormSubmit() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const availability = document.getElementById('mentor-availability').value.trim();
  const expertise = document.getElementById('mentor-expertise').value.split(',').map(s => s.trim()).filter(Boolean);
  const topics = document.getElementById('mentor-topics').value.split(',').map(s => s.trim()).filter(Boolean);
  const bio = document.getElementById('mentor-bio').value.trim();

  const existingMentor = StorageService.getMentorByAlumniId(user.alumniId || user.id);

  const mentorData = {
    id: existingMentor ? existingMentor.id : ('men-' + Date.now()),
    alumniId: user.alumniId || user.id,
    availability,
    expertise,
    topics,
    bio,
    requests: existingMentor ? existingMentor.requests : []
  };

  StorageService.saveMentor(mentorData);
  document.getElementById('become-mentor-modal')?.classList.remove('active');
  UI.toast('Mentor Profile Saved', 'You are now listed in the alumni mentorship directory!', 'success');
  applyFiltersAndRender();
}
