// News & Announcements Controller
// Handles article feeds, search, modal reading, and admin announcement publishing

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

let allNews = [];
let filteredNews = [];

document.addEventListener('DOMContentLoaded', () => {
  allNews = StorageService.getNews();
  setupEventListeners();
  applyFiltersAndRender();
});

function setupEventListeners() {
  const searchInput = document.getElementById('news-search');
  const catFilter = document.getElementById('news-category-filter');
  const postBtn = document.getElementById('post-news-btn');
  const postForm = document.getElementById('post-news-form');

  if (searchInput) searchInput.addEventListener('input', () => applyFiltersAndRender());
  if (catFilter) catFilter.addEventListener('change', () => applyFiltersAndRender());

  if (postBtn) {
    postBtn.addEventListener('click', () => {
      const user = AuthService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        UI.toast('Access Notice', 'Only University Admins can publish official news bulletins.', 'warning');
        return;
      }
      document.getElementById('post-news-modal')?.classList.add('active');
    });
  }

  if (postForm) {
    postForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handlePostNewsSubmit();
    });
  }
}

function applyFiltersAndRender() {
  const search = document.getElementById('news-search')?.value.trim().toLowerCase() || '';
  const category = document.getElementById('news-category-filter')?.value || '';

  allNews = StorageService.getNews();

  filteredNews = allNews.filter(n => {
    if (search) {
      const matchTitle = n.title.toLowerCase().includes(search);
      const matchBody = n.body.toLowerCase().includes(search);
      const matchAuthor = (n.author || '').toLowerCase().includes(search);
      if (!matchTitle && !matchBody && !matchAuthor) return false;
    }

    if (category && n.category !== category) return false;

    return true;
  });

  renderNews();
}

function renderNews() {
  const container = document.getElementById('news-grid');
  if (!container) return;

  if (filteredNews.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">📰</div>
        <h3 class="empty-state-title">No News Found</h3>
        <p class="empty-state-desc">Try clearing your search keyword or selecting a different category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredNews.map(n => `
    <div class="card card-hoverable" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
      <div style="height: 190px; overflow: hidden;">
        <img src="${n.image}" alt="${n.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>

      <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
          <span class="badge badge-primary">${n.category}</span>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${n.readTime || '3 min read'}</span>
        </div>

        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; line-height: 1.35;">
          ${n.title}
        </h3>

        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          By ${n.author} • ${n.date}
        </div>

        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem; flex: 1;">
          ${n.body.length > 130 ? n.body.substring(0, 130) + '...' : n.body}
        </p>

        <button class="btn btn-outline btn-sm read-article-btn" data-id="${n.id}" style="width: 100%;">
          Read Full Story →
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.read-article-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openArticleModal(id);
    });
  });
}

function openArticleModal(id) {
  const item = allNews.find(n => n.id === id);
  if (!item) return;

  const modal = document.getElementById('news-reader-modal');
  const title = document.getElementById('reader-title');
  const body = document.getElementById('reader-body');

  if (title) title.textContent = item.title;
  if (body) {
    body.innerHTML = `
      <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 240px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 1.25rem;">
      <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1rem;">
        <span class="badge badge-primary">${item.category}</span>
        <span style="font-size: 0.82rem; color: var(--text-muted);">Published on ${item.date} by ${item.author}</span>
      </div>
      <div style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.8;">
        ${item.body}
      </div>
    `;
  }

  modal?.classList.add('active');
}

function handlePostNewsSubmit() {
  const title = document.getElementById('news-title').value.trim();
  const category = document.getElementById('news-cat').value;
  const author = document.getElementById('news-author').value.trim();
  const image = document.getElementById('news-image').value.trim() || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80';
  const body = document.getElementById('news-body').value.trim();

  const newItem = {
    id: 'news-' + Date.now(),
    title,
    category,
    author,
    image,
    body,
    date: new Date().toISOString().split('T')[0],
    readTime: '3 min read'
  };

  StorageService.saveNews(newItem);
  document.getElementById('post-news-modal')?.classList.remove('active');
  document.getElementById('post-news-form')?.reset();

  UI.toast('Announcement Published!', `"${title}" is now visible to all alumni.`, 'success');
  applyFiltersAndRender();
}
