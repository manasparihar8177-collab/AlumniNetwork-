// Photo Gallery Controller
// Implements category filtering and a responsive, keyboard-navigable Lightbox viewer

import { StorageService } from './storage.js';

let allItems = [];
let currentCategory = 'all';
let currentLightboxIndex = 0;
let displayedItems = [];

document.addEventListener('DOMContentLoaded', () => {
  allItems = StorageService.getGallery();
  displayedItems = [...allItems];
  setupEventListeners();
  renderGallery();
});

function setupEventListeners() {
  document.querySelectorAll('.gal-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gal-filter-btn').forEach(b => {
        b.className = 'btn btn-sm btn-outline gal-filter-btn';
      });
      btn.className = 'btn btn-sm btn-primary gal-filter-btn';
      currentCategory = btn.getAttribute('data-cat');
      filterGallery();
    });
  });

  // Lightbox controls
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  const lightboxModal = document.getElementById('gallery-lightbox');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', showPrevPhoto);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', showNextPhoto);
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // Keyboard navigation for lightbox
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('gallery-lightbox')?.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') showPrevPhoto();
    if (e.key === 'ArrowRight') showNextPhoto();
    if (e.key === 'Escape') closeLightbox();
  });
}

function filterGallery() {
  if (currentCategory === 'all') {
    displayedItems = [...allItems];
  } else {
    displayedItems = allItems.filter(item => item.category === currentCategory);
  }
  renderGallery();
}

function renderGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  container.innerHTML = displayedItems.map((item, index) => `
    <div class="card card-hoverable photo-card" data-index="${index}" style="padding: 0; overflow: hidden; cursor: pointer; display: flex; flex-direction: column;">
      <div style="height: 220px; overflow: hidden; position: relative;">
        <img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">
        <span class="badge badge-primary" style="position: absolute; top: 12px; left: 12px; background: rgba(14, 165, 233, 0.9);">
          ${item.category}
        </span>
      </div>
      <div style="padding: 1.15rem; flex: 1; display: flex; flex-direction: column;">
        <h4 style="font-size: 1rem; margin-bottom: 0.35rem; line-height: 1.3;">${item.title}</h4>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          📅 ${item.eventName} • ${item.date}
        </div>
        <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; flex: 1;">
          ${item.caption}
        </p>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.photo-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-index'), 10);
      openLightbox(idx);
    });
  });
}

function openLightbox(index) {
  currentLightboxIndex = index;
  updateLightboxContent();
  document.getElementById('gallery-lightbox')?.classList.add('active');
}

function closeLightbox() {
  document.getElementById('gallery-lightbox')?.classList.remove('active');
}

function showPrevPhoto() {
  if (currentLightboxIndex > 0) {
    currentLightboxIndex--;
  } else {
    currentLightboxIndex = displayedItems.length - 1;
  }
  updateLightboxContent();
}

function showNextPhoto() {
  if (currentLightboxIndex < displayedItems.length - 1) {
    currentLightboxIndex++;
  } else {
    currentLightboxIndex = 0;
  }
  updateLightboxContent();
}

function updateLightboxContent() {
  const item = displayedItems[currentLightboxIndex];
  if (!item) return;

  const img = document.getElementById('lightbox-img');
  const title = document.getElementById('lightbox-title');
  const cat = document.getElementById('lightbox-category');
  const caption = document.getElementById('lightbox-caption');
  const date = document.getElementById('lightbox-date');

  if (img) img.src = item.imageUrl;
  if (title) title.textContent = item.title;
  if (cat) cat.textContent = item.category;
  if (caption) caption.textContent = item.caption;
  if (date) date.textContent = `${item.eventName} • ${item.date}`;
}
