// Home / Landing Page Logic
// Renders dynamic live statistics, featured alumni, events, stories, campaigns, and news

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initStats();
  renderFeaturedAlumni();
  renderUpcomingEvents();
  renderSuccessStories();
  renderCampaignsPreview();
  renderNewsPreview();
});

function initStats() {
  const alumni = StorageService.getAlumni();
  const events = StorageService.getEvents();
  const jobs = StorageService.getJobs();
  const campaigns = StorageService.getCampaigns();

  const totalDonations = campaigns.reduce((acc, c) => acc + (Number(c.raised) || 0), 0);

  const elAlumni = document.getElementById('stat-alumni-count');
  const elEvents = document.getElementById('stat-events-count');
  const elJobs = document.getElementById('stat-jobs-count');
  const elDonations = document.getElementById('stat-donations-count');

  if (elAlumni) elAlumni.textContent = `${alumni.length}+`;
  if (elEvents) elEvents.textContent = `${events.length}`;
  if (elJobs) elJobs.textContent = `${jobs.length}`;
  if (elDonations) elDonations.textContent = `₹${(totalDonations / 100000).toFixed(1)}L`;
}

function renderFeaturedAlumni() {
  const container = document.getElementById('featured-alumni-grid');
  if (!container) return;

  const alumni = StorageService.getAlumni().filter(a => a.featured).slice(0, 4);

  container.innerHTML = alumni.map(alm => `
    <div class="card card-hoverable" style="display: flex; flex-direction: column;">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
        <img src="${alm.photo}" alt="${alm.name}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary-light);">
        <div>
          <h4 style="font-size: 1.05rem; margin-bottom: 0.2rem;">${alm.name}</h4>
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">${alm.profession}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${alm.company}</div>
        </div>
      </div>

      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem;">
        🎓 ${alm.branch} • Batch of ${alm.batch}
      </div>

      <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem; flex: 1;">
        ${alm.bio.length > 100 ? alm.bio.substring(0, 100) + '...' : alm.bio}
      </p>

      <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
        ${alm.skills.slice(0, 3).map(skill => `<span class="badge badge-neutral">${skill}</span>`).join('')}
      </div>

      <a href="pages/profile.html?id=${alm.id}" class="btn btn-outline btn-sm" style="width: 100%;">
        View Full Profile →
      </a>
    </div>
  `).join('');
}

function renderUpcomingEvents() {
  const container = document.getElementById('upcoming-events-grid');
  if (!container) return;

  const user = AuthService.getCurrentUser();
  const events = StorageService.getEvents().slice(0, 3);

  container.innerHTML = events.map(evt => {
    const isRsvp = user && Array.isArray(evt.rsvpIds) && evt.rsvpIds.includes(user.id);
    const dateFormatted = new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const capacityPct = Math.min(100, Math.round(((evt.rsvpIds?.length || 0) / evt.capacity) * 100));

    return `
      <div class="card card-hoverable" style="overflow: hidden; padding: 0; display: flex; flex-direction: column;">
        <div style="position: relative; height: 180px; overflow: hidden;">
          <img src="${evt.image}" alt="${evt.title}" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; top: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); color: #fff; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.78rem; font-weight: 700;">
            📅 ${dateFormatted}
          </div>
          <div style="position: absolute; top: 12px; right: 12px;">
            <span class="badge badge-primary">${evt.category}</span>
          </div>
        </div>

        <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
          <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem; line-height: 1.3;">${evt.title}</h3>
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
            📍 ${evt.venue}
          </div>

          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem; flex: 1;">
            ${evt.description.length > 110 ? evt.description.substring(0, 110) + '...' : evt.description}
          </p>

          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">
              <span>Attendees: ${evt.rsvpIds?.length || 0} / ${evt.capacity}</span>
              <span>${capacityPct}%</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${capacityPct}%"></div>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <button class="btn ${isRsvp ? 'btn-secondary' : 'btn-primary'} btn-sm home-rsvp-btn" data-id="${evt.id}" style="flex: 1;">
              ${isRsvp ? '✓ Attending' : 'RSVP Now'}
            </button>
            <a href="pages/events.html" class="btn btn-outline btn-sm">Details</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach RSVP handlers
  container.querySelectorAll('.home-rsvp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.getAttribute('data-id');
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        UI.toast('Sign In Required', 'Please log in to RSVP for events.', 'warning');
        return;
      }
      const res = StorageService.toggleRSVP(eventId, currentUser.id, currentUser.name);
      if (res.success) {
        UI.toast(res.rsvp ? 'RSVP Confirmed!' : 'RSVP Cancelled', 
          res.rsvp ? `You're registered for "${res.event.title}"` : `RSVP cancelled for "${res.event.title}"`,
          res.rsvp ? 'success' : 'info'
        );
        renderUpcomingEvents();
      } else {
        UI.toast('RSVP Failed', res.message, 'danger');
      }
    });
  });
}

function renderSuccessStories() {
  const container = document.getElementById('stories-grid');
  if (!container) return;

  const stories = StorageService.getStories().slice(0, 3);

  container.innerHTML = stories.map(s => `
    <div class="card card-hoverable" style="display: flex; flex-direction: column;">
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.25rem;">
        <img src="${s.photo}" alt="${s.name}" style="width: 60px; height: 60px; border-radius: var(--radius-md); object-fit: cover;">
        <div>
          <h4 style="font-size: 1.05rem;">${s.name}</h4>
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-primary);">${s.role}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.batch}</div>
        </div>
      </div>

      <h5 style="font-size: 0.98rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary); line-height: 1.35;">
        "${s.headline}"
      </h5>

      <p style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic; margin-bottom: 1.25rem; flex: 1; border-left: 3px solid var(--color-primary); padding-left: 0.75rem;">
        "${s.quote}"
      </p>

      <a href="pages/profile.html?id=${s.alumniId}" class="btn btn-outline btn-sm" style="width: 100%;">
        Read Career Journey →
      </a>
    </div>
  `).join('');
}

function renderCampaignsPreview() {
  const container = document.getElementById('campaigns-preview-grid');
  if (!container) return;

  const campaigns = StorageService.getCampaigns().slice(0, 3);

  container.innerHTML = campaigns.map(c => {
    const pct = Math.min(100, Math.round(((Number(c.raised) || 0) / Number(c.goal)) * 100));

    return `
      <div class="card card-hoverable" style="overflow: hidden; padding: 0; display: flex; flex-direction: column;">
        <div style="height: 160px; overflow: hidden; position: relative;">
          <img src="${c.image}" alt="${c.title}" style="width: 100%; height: 100%; object-fit: cover;">
          <span class="badge badge-primary" style="position: absolute; top: 12px; left: 12px;">${c.category}</span>
        </div>

        <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
          <h3 style="font-size: 1.1rem; margin-bottom: 0.6rem; line-height: 1.3;">${c.title}</h3>
          
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 1.25rem; flex: 1;">
            ${c.description.length > 100 ? c.description.substring(0, 100) + '...' : c.description}
          </p>

          <div style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.35rem;">
              <span style="color: var(--color-primary);">₹${(c.raised / 100000).toFixed(1)}L Raised</span>
              <span style="color: var(--text-muted); font-size: 0.78rem;">Goal: ₹${(c.goal / 100000).toFixed(1)}L</span>
            </div>
            <div class="progress-container" style="height: 8px;">
              <div class="progress-bar" style="width: ${pct}%"></div>
            </div>
          </div>

          <a href="pages/fundraising.html?id=${c.id}" class="btn btn-primary btn-sm" style="width: 100%;">
            Support This Campaign
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function renderNewsPreview() {
  const container = document.getElementById('news-preview-grid');
  if (!container) return;

  const news = StorageService.getNews().slice(0, 3);

  container.innerHTML = news.map(n => `
    <div class="card card-hoverable" style="display: flex; flex-direction: column; overflow: hidden; padding: 0;">
      <div style="height: 150px; overflow: hidden;">
        <img src="${n.image}" alt="${n.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="padding: 1.25rem; flex: 1; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span class="badge badge-neutral">${n.category}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${n.date}</span>
        </div>
        <h4 style="font-size: 1rem; margin-bottom: 0.5rem; line-height: 1.35;">${n.title}</h4>
        <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 1rem; flex: 1;">
          ${n.body.length > 95 ? n.body.substring(0, 95) + '...' : n.body}
        </p>
        <a href="pages/news.html" class="btn btn-outline btn-sm" style="width: 100%;">
          Read Article →
        </a>
      </div>
    </div>
  `).join('');
}
