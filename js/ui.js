// UI Framework & Global Component Renderer for AlumniNetwork
// Handles responsive header, mobile navigation, dark mode toggle, notification center, toasts, and modals

import { AuthService } from './auth.js';
import { StorageService } from './storage.js';

export class UI {
  static init() {
    this.applyTheme(StorageService.getTheme());
    this.renderHeader();
    this.renderFooter();
    this.setupGlobalListeners();
  }

  static applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    StorageService.setTheme(theme);
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  static toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
  }

  static getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : './';
  }

  static renderHeader() {
    const headerEl = document.getElementById('app-header');
    if (!headerEl) return;

    const base = this.getBasePath();
    const user = AuthService.getCurrentUser();
    const notifications = StorageService.getNotifications(user ? user.id : null);
    const unreadCount = notifications.filter(n => !n.read).length;
    const currentPath = window.location.pathname;

    headerEl.className = 'app-header';
    headerEl.innerHTML = `
      <div class="container header-container">
        <!-- Logo -->
        <a href="${base}index.html" class="logo-brand">
          <div class="brand-icon">🎓</div>
          <span class="brand-text">Alumni<span class="brand-highlight">Network</span></span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="nav-desktop">
          <a href="${base}index.html" class="nav-link ${currentPath.endsWith('index.html') || currentPath.endsWith('/') ? 'active' : ''}">
            <span>Home</span>
          </a>
          <a href="${base}pages/directory.html" class="nav-link ${currentPath.includes('directory.html') ? 'active' : ''}">
            <span>Directory</span>
          </a>
          <a href="${base}pages/events.html" class="nav-link ${currentPath.includes('events.html') ? 'active' : ''}">
            <span>Events</span>
          </a>
          <a href="${base}pages/jobs.html" class="nav-link ${currentPath.includes('jobs.html') ? 'active' : ''}">
            <span>Job Board</span>
          </a>
          <a href="${base}pages/mentorship.html" class="nav-link ${currentPath.includes('mentorship.html') ? 'active' : ''}">
            <span>Mentorship</span>
          </a>
          <a href="${base}pages/fundraising.html" class="nav-link ${currentPath.includes('fundraising.html') ? 'active' : ''}">
            <span>Fundraising</span>
          </a>

          <!-- More Dropdown -->
          <div class="nav-dropdown">
            <button class="nav-link" aria-haspopup="true">
              <span>More</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="dropdown-menu">
              <a href="${base}pages/news.html" class="dropdown-item">
                <span>📰 News & Updates</span>
              </a>
              <a href="${base}pages/gallery.html" class="dropdown-item">
                <span>🖼️ Photo Gallery</span>
              </a>
              <a href="${base}pages/profile.html" class="dropdown-item">
                <span>👤 My Profile</span>
              </a>
              ${user && user.role === 'admin' ? `
                <div style="border-top: 1px solid var(--border-subtle); margin: 0.25rem 0;"></div>
                <a href="${base}pages/admin.html" class="dropdown-item" style="color: var(--color-danger-dark); font-weight: 700;">
                  <span>⚙️ Admin Dashboard</span>
                </a>
              ` : `
                <div style="border-top: 1px solid var(--border-subtle); margin: 0.25rem 0;"></div>
                <a href="${base}pages/admin.html" class="dropdown-item" style="color: var(--color-primary);">
                  <span>⚙️ Admin Portal</span>
                </a>
              `}
            </div>
          </div>
        </nav>

        <!-- Right Controls -->
        <div class="header-actions">
          <!-- Role Switcher Pill -->
          <button id="role-switcher-btn" class="role-badge-btn role-${user ? user.role : 'visitor'}" title="Click to quickly switch simulated role">
            <span>🎭</span>
            <span class="role-text">${user ? user.role : 'Visitor'}</span>
          </button>

          <!-- Dark Mode Toggle -->
          <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle Dark Mode">
            <span id="theme-toggle-icon">${StorageService.getTheme() === 'dark' ? '☀️' : '🌙'}</span>
          </button>

          <!-- Notification Bell -->
          <div class="notif-container">
            <button id="notif-toggle-btn" class="notif-btn" aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount}</span>` : ''}
            </button>

            <!-- Notification Drawer Dropdown -->
            <div id="notif-panel" class="notif-panel">
              <div class="notif-header">
                <h4>Notifications (${unreadCount} unread)</h4>
                <button id="mark-read-btn" class="btn btn-sm btn-outline" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">Mark All Read</button>
              </div>
              <ul class="notif-list">
                ${notifications.length === 0 ? `
                  <li style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    No notifications right now
                  </li>
                ` : notifications.slice(0, 8).map(n => `
                  <li class="notif-item ${!n.read ? 'unread' : ''}" data-id="${n.id}">
                    <div class="notif-icon ${n.type}">
                      ${n.type === 'success' ? '✓' : n.type === 'warning' ? '!' : 'ℹ'}
                    </div>
                    <div class="notif-content">
                      <div class="notif-title">${n.title}</div>
                      <div class="notif-desc">${n.message}</div>
                      <div class="notif-time">${n.date}</div>
                    </div>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- User Profile / Auth Button -->
          ${user ? `
            <div class="user-menu-container">
              <button id="user-profile-btn" class="user-profile-btn">
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}" class="user-avatar" alt="${user.name}">
                <div class="user-meta">
                  <div class="user-name">${user.name}</div>
                  <div class="user-role-label">${user.role}</div>
                </div>
              </button>
            </div>
          ` : `
            <a href="${base}pages/login.html" class="btn btn-primary btn-sm">Sign In</a>
          `}

          <!-- Mobile Toggle -->
          <button id="mobile-toggle" class="mobile-nav-toggle" aria-label="Open Navigation Menu">
            ☰
          </button>
        </div>
      </div>

      <!-- Mobile Drawer Navigation -->
      <div id="mobile-overlay" class="mobile-drawer-overlay"></div>
      <div id="mobile-drawer" class="mobile-drawer">
        <div class="mobile-drawer-header">
          <div class="logo-brand">
            <span class="brand-text">Alumni<span class="brand-highlight">Network</span></span>
          </div>
          <button id="mobile-close" class="modal-close" style="font-size: 1.5rem;">✕</button>
        </div>

        <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-muted); border-radius: var(--radius-md);">
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem;">Simulated Active Role:</div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-sm btn-outline role-quick-btn" data-role="student">Student</button>
            <button class="btn btn-sm btn-outline role-quick-btn" data-role="alumni">Alumni</button>
            <button class="btn btn-sm btn-outline role-quick-btn" data-role="admin">Admin</button>
          </div>
        </div>

        <nav class="mobile-nav-links">
          <a href="${base}index.html" class="mobile-nav-item">🏠 Home</a>
          <a href="${base}pages/directory.html" class="mobile-nav-item">👥 Alumni Directory</a>
          <a href="${base}pages/events.html" class="mobile-nav-item">📅 Events & Reunions</a>
          <a href="${base}pages/jobs.html" class="mobile-nav-item">💼 Job Board</a>
          <a href="${base}pages/mentorship.html" class="mobile-nav-item">🤝 Mentorship Hub</a>
          <a href="${base}pages/fundraising.html" class="mobile-nav-item">❤️ Campaigns & Giving</a>
          <a href="${base}pages/news.html" class="mobile-nav-item">📰 News & Updates</a>
          <a href="${base}pages/gallery.html" class="mobile-nav-item">🖼️ Photo Gallery</a>
          <a href="${base}pages/profile.html" class="mobile-nav-item">👤 My Profile</a>
          ${user && user.role === 'admin' ? `
            <a href="${base}pages/admin.html" class="mobile-nav-item" style="color: var(--color-danger); font-weight: 700;">⚙️ Admin Dashboard</a>
          ` : `
            <a href="${base}pages/admin.html" class="mobile-nav-item">⚙️ Admin Dashboard</a>
          `}
          <div style="border-top: 1px solid var(--border-subtle); margin: 0.75rem 0;"></div>
          ${user ? `
            <button id="mobile-logout-btn" class="mobile-nav-item" style="color: var(--color-danger); width: 100%; text-align: left; background: none; border: none;">🚪 Logout (${user.name})</button>
          ` : `
            <a href="${base}pages/login.html" class="mobile-nav-item" style="color: var(--color-primary); font-weight: 700;">🔑 Log In / Register</a>
          `}
        </nav>
      </div>

      <!-- Quick Role Switcher Modal -->
      <div id="role-modal" class="modal-backdrop">
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header">
            <h3 class="modal-title">🎭 Select Simulated Test Role</h3>
            <button class="modal-close" onclick="document.getElementById('role-modal').classList.remove('active')">✕</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
              The PRD requires a frontend-only simulated platform. Switch instantly between roles to test permissions, RSVPs, job postings, mentorship, and admin controls!
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div class="card card-hoverable" style="padding: 1rem; cursor: pointer;" onclick="window.AlumniUI.switchUserRole('admin')">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${AuthService.DEMO_ACCOUNTS.admin.avatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">
                    <div>
                      <div style="font-weight: 700;">Dr. Vikram Seth</div>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">Dean of Alumni Relations</div>
                    </div>
                  </div>
                  <span class="badge badge-danger">ADMIN</span>
                </div>
              </div>

              <div class="card card-hoverable" style="padding: 1rem; cursor: pointer;" onclick="window.AlumniUI.switchUserRole('alumni')">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${AuthService.DEMO_ACCOUNTS.alumni.avatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">
                    <div>
                      <div style="font-weight: 700;">Priya Sundaram</div>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">Staff Engineer at Stripe (Alumni 2015)</div>
                    </div>
                  </div>
                  <span class="badge badge-primary">ALUMNI</span>
                </div>
              </div>

              <div class="card card-hoverable" style="padding: 1rem; cursor: pointer;" onclick="window.AlumniUI.switchUserRole('student')">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${AuthService.DEMO_ACCOUNTS.student.avatar}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover;">
                    <div>
                      <div style="font-weight: 700;">Rahul Verma</div>
                      <div style="font-size: 0.78rem; color: var(--text-muted);">Undergraduate Student (Final Year)</div>
                    </div>
                  </div>
                  <span class="badge badge-success">STUDENT</span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="document.getElementById('role-modal').classList.remove('active')">Cancel</button>
          </div>
        </div>
      </div>
    `;

    this.attachHeaderEvents();
  }

  static attachHeaderEvents() {
    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Role switcher modal
    const roleBtn = document.getElementById('role-switcher-btn');
    if (roleBtn) {
      roleBtn.addEventListener('click', () => {
        const modal = document.getElementById('role-modal');
        if (modal) modal.classList.add('active');
      });
    }

    // Notification dropdown
    const notifBtn = document.getElementById('notif-toggle-btn');
    const notifPanel = document.getElementById('notif-panel');
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPanel.classList.toggle('active');
      });
      document.addEventListener('click', (e) => {
        if (!notifPanel.contains(e.target) && !notifBtn.contains(e.target)) {
          notifPanel.classList.remove('active');
        }
      });
    }

    // Mark read
    const markReadBtn = document.getElementById('mark-read-btn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        const user = AuthService.getCurrentUser();
        StorageService.markAllNotificationsRead(user ? user.id : null);
        this.renderHeader();
        this.toast('Notifications', 'All notifications marked as read', 'info');
      });
    }

    // Mobile Drawer
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileClose = document.getElementById('mobile-close');

    const toggleDrawer = (open) => {
      if (mobileDrawer) mobileDrawer.classList.toggle('open', open);
      if (mobileOverlay) mobileOverlay.classList.toggle('open', open);
    };

    if (mobileToggle) mobileToggle.addEventListener('click', () => toggleDrawer(true));
    if (mobileClose) mobileClose.addEventListener('click', () => toggleDrawer(false));
    if (mobileOverlay) mobileOverlay.addEventListener('click', () => toggleDrawer(false));

    // Mobile quick role buttons
    document.querySelectorAll('.role-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-role');
        this.switchUserRole(role);
      });
    });

    // Mobile logout
    const mobileLogout = document.getElementById('mobile-logout-btn');
    if (mobileLogout) {
      mobileLogout.addEventListener('click', () => {
        AuthService.logout();
        window.location.reload();
      });
    }

    // User profile click -> Profile page or logout
    const userProfileBtn = document.getElementById('user-profile-btn');
    if (userProfileBtn) {
      userProfileBtn.addEventListener('click', () => {
        window.location.href = this.getBasePath() + 'pages/profile.html';
      });
    }
  }

  static switchUserRole(role) {
    AuthService.switchRole(role);
    const modal = document.getElementById('role-modal');
    if (modal) modal.classList.remove('active');
    this.toast('Role Switched', `Active session changed to ${role.toUpperCase()}`, 'success');
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  static renderFooter() {
    const footerEl = document.getElementById('app-footer');
    if (!footerEl) return;
    const base = this.getBasePath();

    footerEl.className = 'app-footer';
    footerEl.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="logo-brand" style="margin-bottom: 0.5rem;">
              <div class="brand-icon">🎓</div>
              <span>Alumni<span class="brand-highlight">Network</span></span>
            </div>
            <p>
              Connecting alumni worldwide with their alma mater. Discover lifelong peers, mentorship opportunities, career advancements, and meaningful community impact.
            </p>
            <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
              <a href="https://linkedin.com" target="_blank" class="theme-toggle-btn" aria-label="LinkedIn">🔗</a>
              <a href="https://twitter.com" target="_blank" class="theme-toggle-btn" aria-label="Twitter">🐦</a>
              <a href="https://github.com" target="_blank" class="theme-toggle-btn" aria-label="GitHub">🐙</a>
            </div>
          </div>

          <div class="footer-col">
            <h5>Explore</h5>
            <ul class="footer-links">
              <li><a href="${base}pages/directory.html">Alumni Directory</a></li>
              <li><a href="${base}pages/events.html">Events & Galas</a></li>
              <li><a href="${base}pages/jobs.html">Career Opportunities</a></li>
              <li><a href="${base}pages/mentorship.html">Mentorship Program</a></li>
              <li><a href="${base}pages/fundraising.html">Giving & Campaigns</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h5>Community</h5>
            <ul class="footer-links">
              <li><a href="${base}pages/news.html">News & Press</a></li>
              <li><a href="${base}pages/gallery.html">Reunion Gallery</a></li>
              <li><a href="${base}pages/profile.html">Member Profile</a></li>
              <li><a href="${base}pages/admin.html">Admin Portal</a></li>
              <li><a href="${base}pages/login.html">Login / Register</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h5>Alma Mater Office</h5>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
              Office of Alumni Affairs & Community Engagement<br>
              Main Campus Quadrangle, Bangalore - 560012
            </p>
            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
              📞 +91 80 2345 6789<br>
              ✉️ alumni.relations@university.edu
            </div>
            <div style="margin-top: 1.25rem;">
              <button class="btn btn-sm btn-outline" onclick="window.AlumniUI.resetDataPrompt()">
                🔄 Reset Demo Data
              </button>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div>© ${new Date().getFullYear()} AlumniNetwork Platform. Designed to PRD specifications. All data stored in localStorage.</div>
          <div style="display: flex; gap: 1.5rem;">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Code of Conduct</a>
          </div>
        </div>
      </div>
    `;
  }

  static resetDataPrompt() {
    if (confirm("Reset all alumni, events, jobs, and donations back to default seed state?")) {
      StorageService.resetToDefaults();
      this.toast("Data Reset", "All data successfully reset to seed defaults.", "info");
      setTimeout(() => window.location.reload(), 500);
    }
  }

  static toast(title, message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;
    toastEl.innerHTML = `
      <div style="font-size: 1.1rem; line-height: 1;">
        ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'}
      </div>
      <div style="flex: 1;">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button style="color: var(--text-muted); cursor: pointer;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateX(20px)';
      toastEl.style.transition = 'all 0.3s ease';
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  }

  static openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  static closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  static setupGlobalListeners() {
    window.addEventListener('alumni-notification', (e) => {
      const notif = e.detail;
      this.toast(notif.title, notif.message, notif.type);
      this.renderHeader();
    });

    // Close modals on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('active');
      }
    });

    // Escape key closes modals and mobile drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
        const drawer = document.getElementById('mobile-drawer');
        const overlay = document.getElementById('mobile-overlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
      }
    });
  }

  static formatINR(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }
}

// Expose on window for easy inline event handlers
window.AlumniUI = UI;

// Auto-run UI bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UI.init());
} else {
  UI.init();
}
