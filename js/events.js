// Events Module Controller
// Handles event listing, category/timeframe filtering, capacity tracking, live RSVPs, and event creation

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

let allEvents = [];
let filteredEvents = [];

document.addEventListener('DOMContentLoaded', () => {
  allEvents = StorageService.getEvents();
  setupEventListeners();
  applyFiltersAndRender();
});

function setupEventListeners() {
  const searchInput = document.getElementById('event-search');
  const categoryFilter = document.getElementById('event-category-filter');
  const timeframeFilter = document.getElementById('event-timeframe-filter');
  const createBtn = document.getElementById('create-event-btn');
  const createForm = document.getElementById('create-event-form');

  if (searchInput) {
    searchInput.addEventListener('input', () => applyFiltersAndRender());
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => applyFiltersAndRender());
  }

  if (timeframeFilter) {
    timeframeFilter.addEventListener('change', () => applyFiltersAndRender());
  }

  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const user = AuthService.getCurrentUser();
      if (!user || (user.role !== 'admin' && user.role !== 'alumni')) {
        UI.toast('Access Notice', 'Only Alumni and Admins can create new events. Please switch role.', 'warning');
        return;
      }
      document.getElementById('create-event-modal')?.classList.add('active');
    });
  }

  if (createForm) {
    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleCreateEvent();
    });
  }
}

function applyFiltersAndRender() {
  const search = document.getElementById('event-search')?.value.trim().toLowerCase() || '';
  const category = document.getElementById('event-category-filter')?.value || '';
  const timeframe = document.getElementById('event-timeframe-filter')?.value || 'upcoming';
  const user = AuthService.getCurrentUser();
  const today = new Date().toISOString().split('T')[0];

  allEvents = StorageService.getEvents();

  filteredEvents = allEvents.filter(evt => {
    // Search
    if (search) {
      const matchTitle = evt.title.toLowerCase().includes(search);
      const matchVenue = evt.venue.toLowerCase().includes(search);
      const matchDesc = evt.description.toLowerCase().includes(search);
      if (!matchTitle && !matchVenue && !matchDesc) return false;
    }

    // Category
    if (category && evt.category !== category) return false;

    // Timeframe
    if (timeframe === 'upcoming') {
      return evt.date >= today;
    } else if (timeframe === 'past') {
      return evt.date < today;
    } else if (timeframe === 'my-rsvps') {
      return user && Array.isArray(evt.rsvpIds) && evt.rsvpIds.includes(user.id);
    }

    return true;
  });

  // Sort upcoming first
  filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  renderEvents();
}

function renderEvents() {
  const container = document.getElementById('events-grid');
  if (!container) return;

  if (filteredEvents.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📅</div>
        <h3 class="empty-state-title">No Events Found</h3>
        <p class="empty-state-desc">
          No events match your selected filters. Try switching timeframes or clearing your search term.
        </p>
      </div>
    `;
    return;
  }

  const user = AuthService.getCurrentUser();
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = filteredEvents.map(evt => {
    const isPast = evt.date < today;
    const isRsvp = user && Array.isArray(evt.rsvpIds) && evt.rsvpIds.includes(user.id);
    const count = evt.rsvpIds?.length || 0;
    const capacityPct = Math.min(100, Math.round((count / (evt.capacity || 100)) * 100));
    const isFull = count >= (evt.capacity || 100);
    const dateFormatted = new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <div class="card card-hoverable" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
        <div style="position: relative; height: 190px; overflow: hidden;">
          <img src="${evt.image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'}" alt="${evt.title}" style="width: 100%; height: 100%; object-fit: cover;">
          <div style="position: absolute; top: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); color: #fff; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; font-weight: 700;">
            📅 ${dateFormatted}
          </div>
          <div style="position: absolute; top: 12px; right: 12px; display: flex; gap: 0.4rem;">
            <span class="badge ${isPast ? 'badge-neutral' : 'badge-primary'}">${evt.category}</span>
            ${isPast ? '<span class="badge badge-neutral">Completed</span>' : ''}
          </div>
        </div>

        <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
          <h3 style="font-size: 1.2rem; margin-bottom: 0.4rem; line-height: 1.3;">${evt.title}</h3>

          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.35rem;">
            ⏰ ${evt.time || '10:00 - 16:00'}
          </div>

          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.85rem;">
            📍 ${evt.venue}
          </div>

          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem; flex: 1;">
            ${evt.description.length > 120 ? evt.description.substring(0, 120) + '...' : evt.description}
          </p>

          <div style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.35rem;">
              <span>${count} / ${evt.capacity} registered</span>
              <span>${isFull ? '<strong style="color: var(--color-danger);">FULL</strong>' : `${capacityPct}%`}</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${capacityPct}%; background: ${isFull ? 'var(--color-danger)' : 'linear-gradient(90deg, var(--color-primary), #0284C7)'};"></div>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: auto;">
            ${isPast ? `
              <button class="btn btn-outline btn-sm event-detail-btn" data-id="${evt.id}" style="width: 100%;">
                View Recap & Photos
              </button>
            ` : `
              <button class="btn ${isRsvp ? 'btn-secondary' : isFull ? 'btn-outline' : 'btn-primary'} btn-sm event-rsvp-btn" 
                data-id="${evt.id}" ${isFull && !isRsvp ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''} style="flex: 1;">
                ${isRsvp ? '✓ RSVP Attending' : isFull ? 'Event Full' : 'RSVP Now'}
              </button>
              <button class="btn btn-outline btn-sm event-detail-btn" data-id="${evt.id}">
                Details
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachCardEvents();
}

function attachCardEvents() {
  document.querySelectorAll('.event-rsvp-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.getAttribute('data-id');
      const user = AuthService.getCurrentUser();
      if (!user) {
        UI.toast('Authentication Required', 'Please log in to RSVP for events.', 'warning');
        return;
      }

      const res = StorageService.toggleRSVP(eventId, user.id, user.name);
      if (res.success) {
        applyFiltersAndRender();
        UI.renderHeader(); // update notification badge
      } else {
        UI.toast('RSVP Notice', res.message, 'warning');
      }
    });
  });

  document.querySelectorAll('.event-detail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const eventId = btn.getAttribute('data-id');
      openEventDetail(eventId);
    });
  });
}

function openEventDetail(eventId) {
  const evt = StorageService.getEventById(eventId);
  if (!evt) return;

  const modal = document.getElementById('event-detail-modal');
  const title = document.getElementById('modal-event-title');
  const body = document.getElementById('modal-event-body');
  const footer = document.getElementById('modal-event-footer');
  const user = AuthService.getCurrentUser();
  const isRsvp = user && Array.isArray(evt.rsvpIds) && evt.rsvpIds.includes(user.id);
  const count = evt.rsvpIds?.length || 0;

  if (title) title.textContent = evt.title;
  if (body) {
    body.innerHTML = `
      <img src="${evt.image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'}" alt="${evt.title}" style="width: 100%; height: 220px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 1.25rem;">

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
        <span class="badge badge-primary">${evt.category}</span>
        <span class="badge badge-neutral">📅 ${evt.date}</span>
        <span class="badge badge-neutral">⏰ ${evt.time || 'All Day'}</span>
        <span class="badge badge-success">${count} Attendees Registered</span>
      </div>

      <div style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem;">
        📍 Venue: ${evt.venue}
      </div>

      <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">
        ${evt.description}
      </div>

      <div style="background: var(--bg-muted); padding: 1rem; border-radius: var(--radius-md);">
        <h5 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; color: var(--text-muted);">
          Capacity & Availability
        </h5>
        <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
          ${count} out of ${evt.capacity} seats taken (${Math.max(0, evt.capacity - count)} spots remaining)
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${Math.min(100, (count / evt.capacity) * 100)}%;"></div>
        </div>
      </div>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <button class="btn btn-outline" onclick="document.getElementById('event-detail-modal').classList.remove('active')">Close</button>
      <button id="modal-rsvp-btn" class="btn ${isRsvp ? 'btn-secondary' : 'btn-primary'}">
        ${isRsvp ? '✓ Cancel My RSVP' : 'RSVP to Attend'}
      </button>
    `;

    document.getElementById('modal-rsvp-btn')?.addEventListener('click', () => {
      if (!user) {
        UI.toast('Authentication Required', 'Please log in to RSVP for events.', 'warning');
        return;
      }
      StorageService.toggleRSVP(evt.id, user.id, user.name);
      modal?.classList.remove('active');
      applyFiltersAndRender();
      UI.renderHeader();
    });
  }

  modal?.classList.add('active');
}

function handleCreateEvent() {
  const user = AuthService.getCurrentUser();
  if (!user) return;

  const title = document.getElementById('evt-title').value.trim();
  const date = document.getElementById('evt-date').value;
  const time = document.getElementById('evt-time').value.trim();
  const category = document.getElementById('evt-category').value;
  const capacity = parseInt(document.getElementById('evt-capacity').value, 10);
  const venue = document.getElementById('evt-venue').value.trim();
  const image = document.getElementById('evt-image').value.trim() || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80';
  const desc = document.getElementById('evt-desc').value.trim();

  const newEvent = {
    id: 'evt-' + Date.now(),
    title,
    date,
    time,
    venue,
    description: desc,
    category,
    capacity,
    rsvpIds: [user.id],
    image,
    createdBy: user.id
  };

  StorageService.saveEvent(newEvent);
  document.getElementById('create-event-modal')?.classList.remove('active');
  document.getElementById('create-event-form')?.reset();

  UI.toast('Event Created!', `"${title}" has been published to the community calendar.`, 'success');
  applyFiltersAndRender();
}
