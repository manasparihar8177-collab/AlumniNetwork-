// Fundraising Module Controller
// Handles campaign display, live progress bars, simulated donation processing, and donor walls

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { UI } from './ui.js';

let allCampaigns = [];

document.addEventListener('DOMContentLoaded', () => {
  allCampaigns = StorageService.getCampaigns();
  setupEventListeners();
  renderImpactStats();
  renderCampaigns();
  renderDonorWall();
  checkUrlParams();
});

function setupEventListeners() {
  const startBtn = document.getElementById('start-campaign-btn');
  const showWallBtn = document.getElementById('show-donor-wall-btn');
  const donationForm = document.getElementById('donation-form');
  const startCampForm = document.getElementById('start-campaign-form');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const user = AuthService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        UI.toast('Access Notice', 'Only University Admins can launch institutional campaigns.', 'warning');
        return;
      }
      document.getElementById('start-campaign-modal')?.classList.add('active');
    });
  }

  if (showWallBtn) {
    showWallBtn.addEventListener('click', () => {
      const wall = document.getElementById('donor-wall-section');
      if (wall) {
        wall.style.display = wall.style.display === 'none' ? 'block' : 'none';
        if (wall.style.display === 'block') {
          wall.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // Preset amount buttons
  document.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tier-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-primary)';
      });
      btn.style.background = 'var(--color-primary-light)';
      btn.style.color = 'var(--color-primary-dark)';
      const amt = btn.getAttribute('data-amt');
      const input = document.getElementById('donate-custom-amount');
      if (input) input.value = amt;
    });
  });

  if (donationForm) {
    donationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleDonationSubmit();
    });
  }

  if (startCampForm) {
    startCampForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleStartCampaignSubmit();
    });
  }
}

function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const campId = params.get('id');
  if (campId) {
    setTimeout(() => {
      openDonationModal(campId);
    }, 200);
  }
}

function renderImpactStats() {
  allCampaigns = StorageService.getCampaigns();
  const totalRaised = allCampaigns.reduce((acc, c) => acc + (Number(c.raised) || 0), 0);
  let totalDonors = 0;
  allCampaigns.forEach(c => {
    totalDonors += (c.donations || []).length;
  });

  const elRaised = document.getElementById('fund-total-raised');
  const elActive = document.getElementById('fund-active-campaigns');
  const elDonors = document.getElementById('fund-donors-count');

  if (elRaised) elRaised.textContent = `₹${(totalRaised / 100000).toFixed(1)}L`;
  if (elActive) elActive.textContent = `${allCampaigns.length}`;
  if (elDonors) elDonors.textContent = `${totalDonors}+`;
}

function renderCampaigns() {
  const container = document.getElementById('campaigns-grid');
  if (!container) return;

  allCampaigns = StorageService.getCampaigns();

  container.innerHTML = allCampaigns.map(camp => {
    const raised = Number(camp.raised) || 0;
    const goal = Number(camp.goal) || 1;
    const pct = Math.min(100, Math.round((raised / goal) * 100));
    const donorCount = (camp.donations || []).length;

    // Calculate days left
    const now = new Date();
    const end = new Date(camp.deadline);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isEnded = diffDays < 0;

    return `
      <div class="card card-hoverable" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
        <div style="position: relative; height: 200px; overflow: hidden;">
          <img src="${camp.image}" alt="${camp.title}" style="width: 100%; height: 100%; object-fit: cover;">
          <span class="badge badge-primary" style="position: absolute; top: 12px; left: 12px;">
            ${camp.category}
          </span>
          <span class="badge ${isEnded ? 'badge-danger' : 'badge-neutral'}" style="position: absolute; top: 12px; right: 12px; background: rgba(15, 23, 42, 0.85); color: #fff;">
            ⏳ ${isEnded ? 'Campaign Ended' : `${diffDays} Days Left`}
          </span>
        </div>

        <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column;">
          <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; line-height: 1.35;">
            ${camp.title}
          </h3>

          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.5rem; flex: 1;">
            ${camp.description}
          </p>

          <!-- Progress Block -->
          <div style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
              <span style="font-size: 1.2rem; font-weight: 800; color: var(--color-primary);">
                ₹${raised.toLocaleString('en-IN')}
              </span>
              <span style="font-size: 0.82rem; color: var(--text-muted);">
                Goal: ₹${goal.toLocaleString('en-IN')} (${pct}%)
              </span>
            </div>

            <div class="progress-container" style="height: 10px;">
              <div class="progress-bar" style="width: ${pct}%;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
              <span>${donorCount} Alumni Donors</span>
              <span>Deadline: ${camp.deadline}</span>
            </div>
          </div>

          <button class="btn btn-primary open-donate-btn" data-id="${camp.id}" data-title="${camp.title}" style="width: 100%;">
            💝 Make a Donation
          </button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.open-donate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const campId = btn.getAttribute('data-id');
      openDonationModal(campId);
    });
  });
}

function openDonationModal(campId) {
  const camp = StorageService.getCampaignById(campId);
  if (!camp) return;

  const user = AuthService.getCurrentUser();

  document.getElementById('donate-campaign-id').value = camp.id;
  document.getElementById('modal-campaign-title').textContent = `Contribute to: ${camp.title}`;
  document.getElementById('donate-name').value = user ? user.name : 'Alumni Well-Wisher';

  document.getElementById('donate-modal')?.classList.add('active');
}

function handleDonationSubmit() {
  const campId = document.getElementById('donate-campaign-id').value;
  const amount = parseInt(document.getElementById('donate-custom-amount').value, 10);
  const donorName = document.getElementById('donate-name').value.trim();
  const isAnonymous = document.getElementById('donate-anonymous').checked;
  const message = document.getElementById('donate-message').value.trim();
  const user = AuthService.getCurrentUser();

  if (isNaN(amount) || amount < 100) {
    UI.toast('Invalid Amount', 'Please enter a valid amount of at least ₹100.', 'warning');
    return;
  }

  const res = StorageService.donateToCampaign(campId, {
    donorId: user ? user.alumniId || user.id : null,
    userId: user ? user.id : null,
    donorName,
    amount,
    isAnonymous,
    message
  });

  if (res.success) {
    document.getElementById('donate-modal')?.classList.remove('active');
    document.getElementById('donation-form')?.reset();

    UI.toast('Donation Successful! 🎉', `Thank you for contributing ₹${amount.toLocaleString('en-IN')}!`, 'success');
    renderImpactStats();
    renderCampaigns();
    renderDonorWall();
    UI.renderHeader();
  }
}

function renderDonorWall() {
  const container = document.getElementById('donor-wall-container');
  if (!container) return;

  allCampaigns = StorageService.getCampaigns();
  const allDonations = [];

  allCampaigns.forEach(c => {
    (c.donations || []).forEach(d => {
      allDonations.push({ ...d, campaignTitle: c.title });
    });
  });

  allDonations.sort((a, b) => (b.amount || 0) - (a.amount || 0));

  if (allDonations.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
        Be the first alumnus to contribute to our university campaigns!
      </div>
    `;
    return;
  }

  container.innerHTML = allDonations.slice(0, 12).map(d => `
    <div class="card" style="padding: 1.15rem; background: var(--bg-muted);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
        <div style="font-weight: 700; font-size: 0.95rem;">
          ${d.isAnonymous ? 'Anonymous Alumnus' : d.donorName}
        </div>
        <span class="badge badge-success" style="font-size: 0.78rem;">
          ₹${(Number(d.amount)).toLocaleString('en-IN')}
        </span>
      </div>

      <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.5rem;">
        For: ${d.campaignTitle}
      </div>

      <p style="font-size: 0.82rem; color: var(--text-secondary); font-style: italic;">
        "${d.message || 'Proud to support our alma mater!'}"
      </p>
    </div>
  `).join('');
}

function handleStartCampaignSubmit() {
  const title = document.getElementById('camp-title').value.trim();
  const goal = parseInt(document.getElementById('camp-goal').value, 10);
  const deadline = document.getElementById('camp-deadline').value;
  const category = document.getElementById('camp-category').value;
  const image = document.getElementById('camp-image').value.trim() || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80';
  const desc = document.getElementById('camp-desc').value.trim();

  const newCampaign = {
    id: 'cmp-' + Date.now(),
    title,
    goal,
    raised: 0,
    deadline,
    category,
    image,
    description: desc,
    donations: []
  };

  StorageService.saveCampaign(newCampaign);
  document.getElementById('start-campaign-modal')?.classList.remove('active');
  document.getElementById('start-campaign-form')?.reset();

  UI.toast('Campaign Launched!', `"${title}" is now open for community donations.`, 'success');
  renderImpactStats();
  renderCampaigns();
}
