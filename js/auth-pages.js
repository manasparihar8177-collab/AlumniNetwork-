// Auth Pages Controller (Login & Register)
// Handles quick demo presets, client form validation, role-based field toggles, and redirects

import { AuthService } from './auth.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupRegister();
});

function setupLogin() {
  const loginForm = document.getElementById('login-form');
  const demoBtns = document.querySelectorAll('.demo-login-btn');

  // Quick 1-click test accounts
  demoBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      const user = AuthService.switchRole(role);
      if (user) {
        UI.toast('Logged In', `Switched session to ${user.name} (${role.toUpperCase()})`, 'success');
        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'directory.html';
          }
        }, 500);
      }
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const role = document.getElementById('login-role').value;

      if (!email) {
        UI.toast('Validation', 'Please provide a valid email.', 'warning');
        return;
      }

      const res = AuthService.login(email, password, role);
      if (res.success) {
        UI.toast('Welcome Back!', `Signed in as ${res.user.name}`, 'success');
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          if (redirect) {
            window.location.href = redirect;
          } else if (res.user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'directory.html';
          }
        }, 400);
      }
    });
  }
}

function setupRegister() {
  const regForm = document.getElementById('register-form');
  const roleSelect = document.getElementById('reg-role');
  const alumniFields = document.getElementById('alumni-specific-fields');

  if (roleSelect && alumniFields) {
    roleSelect.addEventListener('change', () => {
      if (roleSelect.value === 'alumni') {
        alumniFields.style.display = 'block';
      } else {
        alumniFields.style.display = 'none';
      }
    });
  }

  if (regForm) {
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const role = document.getElementById('reg-role').value;

      let extra = {};
      if (role === 'alumni') {
        extra = {
          batch: document.getElementById('reg-batch')?.value.trim() || '2024',
          branch: document.getElementById('reg-branch')?.value || 'Computer Science',
          location: document.getElementById('reg-location')?.value || 'Bangalore',
          profession: document.getElementById('reg-profession')?.value || 'Software Engineer',
          company: document.getElementById('reg-company')?.value.trim() || 'Tech Enterprise',
          bio: document.getElementById('reg-bio')?.value.trim() || `Alumnus passionate about connecting and mentoring.`
        };
      }

      const res = AuthService.register(name, email, role, extra);
      if (res.success) {
        UI.toast('Account Created!', `Welcome to AlumniNetwork, ${name}!`, 'success');
        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'directory.html';
          }
        }, 400);
      }
    });
  }
}
