// Alumni Profile Logic
// Handles profile viewing, edit forms with validation, mentorship indicators, and localStorage persistence

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

let currentAlumnus = null;
let isOwnerOrAdmin = false;

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  setupEditForm();
});

function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get('id');
  const user = AuthService.getCurrentUser();

  if (paramId) {
    currentAlumnus = StorageService.getAlumnusById(paramId);
  } else if (user && user.alumniId) {
    currentAlumnus = StorageService.getAlumnusById(user.alumniId);
  }

  // Fallback to first alumnus if none matched
  if (!currentAlumnus) {
    const list = StorageService.getAlumni();
    currentAlumnus = list.length > 0 ? list[0] : null;
  }

  if (!currentAlumnus) {
    UI.toast('Error', 'Alumni profile could not be loaded.', 'danger');
    return;
  }

  isOwnerOrAdmin = user && (user.role === 'admin' || user.alumniId === currentAlumnus.id || user.email === currentAlumnus.email);

  renderProfileHeader();
  renderProfileDetails();
  renderMentorshipStatus();
  renderActions();
}

function renderProfileHeader() {
  const photo = document.getElementById('prof-photo');
  const name = document.getElementById('prof-name');
  const batchBadge = document.getElementById('prof-batch-badge');
  const roleCompany = document.getElementById('prof-role-company');
  const branch = document.getElementById('prof-branch');
  const location = document.getElementById('prof-location');
  const email = document.getElementById('prof-email');
  const socialLinks = document.getElementById('prof-social-links');

  if (photo) photo.src = currentAlumnus.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';
  if (name) name.textContent = currentAlumnus.name;
  if (batchBadge) batchBadge.textContent = `Class of ${currentAlumnus.batch}`;
  if (roleCompany) roleCompany.textContent = `${currentAlumnus.profession} at ${currentAlumnus.company}`;
  if (branch) branch.textContent = `🎓 ${currentAlumnus.branch}`;
  if (location) location.textContent = `📍 ${currentAlumnus.location}`;
  if (email) email.textContent = `✉️ ${currentAlumnus.email}`;

  if (socialLinks) {
    const links = currentAlumnus.socialLinks || {};
    socialLinks.innerHTML = `
      ${links.linkedin ? `<a href="${links.linkedin}" target="_blank" class="badge badge-neutral" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">🔗 LinkedIn</a>` : ''}
      ${links.github ? `<a href="${links.github}" target="_blank" class="badge badge-neutral" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">🐙 GitHub</a>` : ''}
      ${links.twitter ? `<a href="${links.twitter}" target="_blank" class="badge badge-neutral" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">🐦 Twitter</a>` : ''}
    `;
  }
}

function renderProfileDetails() {
  const bio = document.getElementById('prof-bio');
  const experience = document.getElementById('prof-experience');
  const education = document.getElementById('prof-education');
  const skillsContainer = document.getElementById('prof-skills-container');

  if (bio) bio.textContent = currentAlumnus.bio;
  if (experience) experience.textContent = currentAlumnus.experience || `Current: ${currentAlumnus.profession} at ${currentAlumnus.company}`;
  if (education) education.textContent = currentAlumnus.education || `B.Tech in ${currentAlumnus.branch}, Batch of ${currentAlumnus.batch}`;

  if (skillsContainer) {
    skillsContainer.innerHTML = (currentAlumnus.skills || []).map(skill => `
      <span class="badge badge-primary" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">${skill}</span>
    `).join('');
  }
}

function renderMentorshipStatus() {
  const content = document.getElementById('prof-mentorship-content');
  if (!content) return;

  const mentor = StorageService.getMentorByAlumniId(currentAlumnus.id);
  const user = AuthService.getCurrentUser();

  if (mentor) {
    content.innerHTML = `
      <div style="margin-bottom: 0.75rem;">
        <span class="badge badge-success" style="margin-bottom: 0.5rem;">Active Mentor</span>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">
          ⏱️ <strong>Availability:</strong> ${mentor.availability || '2 hours/week'}
        </div>
      </div>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">
          Topics Open For Guidance
        </div>
        <ul style="padding-left: 1.2rem; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
          ${(mentor.topics || mentor.expertise || []).map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>

      ${user && user.role !== 'visitor' ? `
        <a href="mentorship.html?mentorId=${mentor.id}" class="btn btn-primary btn-sm" style="width: 100%;">
          Request 1-on-1 Mentorship
        </a>
      ` : `
        <a href="login.html" class="btn btn-outline btn-sm" style="width: 100%;">
          Log In to Request Mentorship
        </a>
      `}
    `;
  } else {
    content.innerHTML = `
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        This alumnus is not currently listed on the mentorship directory.
      </p>
      ${isOwnerOrAdmin ? `
        <a href="mentorship.html" class="btn btn-outline btn-sm" style="width: 100%;">
          Become a Mentor
        </a>
      ` : ''}
    `;
  }
}

function renderActions() {
  const container = document.getElementById('prof-actions-container');
  if (!container) return;

  if (isOwnerOrAdmin) {
    container.innerHTML = `
      <button id="edit-profile-btn" class="btn btn-primary">
        ✏️ Edit Profile
      </button>
    `;
    const btn = document.getElementById('edit-profile-btn');
    if (btn) {
      btn.addEventListener('click', openEditModal);
    }
  } else {
    container.innerHTML = `
      <a href="directory.html" class="btn btn-outline">← Back to Directory</a>
      <a href="mentorship.html" class="btn btn-primary">Connect</a>
    `;
  }
}

function openEditModal() {
  const modal = document.getElementById('edit-profile-modal');
  if (!modal || !currentAlumnus) return;

  document.getElementById('edit-name').value = currentAlumnus.name || '';
  document.getElementById('edit-email').value = currentAlumnus.email || '';
  document.getElementById('edit-profession').value = currentAlumnus.profession || 'Software Engineer';
  document.getElementById('edit-company').value = currentAlumnus.company || '';
  document.getElementById('edit-batch').value = currentAlumnus.batch || '';
  document.getElementById('edit-branch').value = currentAlumnus.branch || 'Computer Science';
  document.getElementById('edit-location').value = currentAlumnus.location || 'Bangalore';
  document.getElementById('edit-photo').value = currentAlumnus.photo || '';
  document.getElementById('edit-bio').value = currentAlumnus.bio || '';
  document.getElementById('edit-skills').value = (currentAlumnus.skills || []).join(', ');
  document.getElementById('edit-experience').value = currentAlumnus.experience || '';
  document.getElementById('edit-linkedin').value = currentAlumnus.socialLinks?.linkedin || '';
  document.getElementById('edit-github').value = currentAlumnus.socialLinks?.github || '';

  modal.classList.add('active');
}

function setupEditForm() {
  const form = document.getElementById('edit-profile-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const batch = document.getElementById('edit-batch').value.trim();
    let batchRange = '2021–2025';
    const batchNum = parseInt(batch, 10);
    if (batchNum >= 2010 && batchNum <= 2015) batchRange = '2010–2015';
    else if (batchNum >= 2016 && batchNum <= 2020) batchRange = '2016–2020';

    const rawSkills = document.getElementById('edit-skills').value;
    const skills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);

    const updated = {
      ...currentAlumnus,
      name: document.getElementById('edit-name').value.trim(),
      email: document.getElementById('edit-email').value.trim(),
      profession: document.getElementById('edit-profession').value,
      company: document.getElementById('edit-company').value.trim(),
      batch: batch,
      batchRange: batchRange,
      branch: document.getElementById('edit-branch').value,
      location: document.getElementById('edit-location').value,
      photo: document.getElementById('edit-photo').value.trim() || currentAlumnus.photo,
      bio: document.getElementById('edit-bio').value.trim(),
      skills: skills,
      experience: document.getElementById('edit-experience').value.trim(),
      education: `B.Tech in ${document.getElementById('edit-branch').value}, Class of ${batch}`,
      socialLinks: {
        linkedin: document.getElementById('edit-linkedin').value.trim(),
        github: document.getElementById('edit-github').value.trim()
      }
    };

    StorageService.saveAlumnus(updated);
    currentAlumnus = updated;

    // Update current session name/avatar if editing logged in user
    const user = AuthService.getCurrentUser();
    if (user && (user.alumniId === updated.id || user.email === updated.email)) {
      user.name = updated.name;
      user.avatar = updated.photo;
      user.title = `${updated.profession} at ${updated.company}`;
      AuthService.setCurrentUser(user);
    }

    document.getElementById('edit-profile-modal').classList.remove('active');
    UI.toast('Profile Updated', 'Your profile changes have been saved to localStorage!', 'success');
    
    // Re-render
    renderProfileHeader();
    renderProfileDetails();
    UI.renderHeader();
  });
}
