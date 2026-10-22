// Storage abstraction for AlumniNetwork
// Manages localStorage initialization, persistence, and state updates across all modules

import { SEED_DATA } from './data.js';

const STORAGE_KEYS = {
  ALUMNI: 'alumninetwork_alumni',
  EVENTS: 'alumninetwork_events',
  JOBS: 'alumninetwork_jobs',
  MENTORS: 'alumninetwork_mentors',
  CAMPAIGNS: 'alumninetwork_campaigns',
  NEWS: 'alumninetwork_news',
  STORIES: 'alumninetwork_stories',
  GALLERY: 'alumninetwork_gallery',
  USERS: 'alumninetwork_users',
  NOTIFICATIONS: 'alumninetwork_notifications',
  ACTIVITY_LOGS: 'alumninetwork_activity_logs',
  THEME: 'alumninetwork_theme',
  SESSION: 'alumninetwork_session'
};

export class StorageService {
  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.ALUMNI)) {
      this.resetToDefaults();
    }
  }

  static resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.ALUMNI, JSON.stringify(SEED_DATA.alumni));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(SEED_DATA.events));
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(SEED_DATA.jobs));
    localStorage.setItem(STORAGE_KEYS.MENTORS, JSON.stringify(SEED_DATA.mentors));
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(SEED_DATA.campaigns));
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(SEED_DATA.news));
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(SEED_DATA.successStories));
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(SEED_DATA.gallery));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_DATA.users));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_DATA.notifications));
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(SEED_DATA.activityLogs));
  }

  static get(key, defaultValue = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  }

  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  }

  // Alumni
  static getAlumni() {
    return this.get(STORAGE_KEYS.ALUMNI, []);
  }

  static getAlumnusById(id) {
    return this.getAlumni().find(a => a.id === id);
  }

  static saveAlumnus(alumnus) {
    const list = this.getAlumni();
    const index = list.findIndex(a => a.id === alumnus.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...alumnus };
    } else {
      list.unshift(alumnus);
    }
    this.set(STORAGE_KEYS.ALUMNI, list);
    this.logActivity(index >= 0 ? "Profile Updated" : "Alumnus Registered", `${alumnus.name} profile saved.`);
    return list[index >= 0 ? index : 0];
  }

  static deleteAlumnus(id) {
    const list = this.getAlumni();
    const item = list.find(a => a.id === id);
    const updated = list.filter(a => a.id !== id);
    this.set(STORAGE_KEYS.ALUMNI, updated);
    if (item) this.logActivity("Alumnus Removed", `Alumnus ${item.name} removed by Admin.`);
    return true;
  }

  // Events
  static getEvents() {
    return this.get(STORAGE_KEYS.EVENTS, []);
  }

  static getEventById(id) {
    return this.getEvents().find(e => e.id === id);
  }

  static saveEvent(event) {
    const list = this.getEvents();
    const index = list.findIndex(e => e.id === event.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...event };
    } else {
      list.unshift(event);
    }
    this.set(STORAGE_KEYS.EVENTS, list);
    this.logActivity(index >= 0 ? "Event Updated" : "Event Created", `Event "${event.title}" saved.`);
    return list[index >= 0 ? index : 0];
  }

  static deleteEvent(id) {
    const list = this.getEvents();
    const item = list.find(e => e.id === id);
    const updated = list.filter(e => e.id !== id);
    this.set(STORAGE_KEYS.EVENTS, updated);
    if (item) this.logActivity("Event Cancelled", `Event "${item.title}" was removed.`);
    return true;
  }

  static toggleRSVP(eventId, userId, userName = "User") {
    const list = this.getEvents();
    const index = list.findIndex(e => e.id === eventId);
    if (index === -1) return { success: false, message: "Event not found" };

    const event = list[index];
    if (!Array.isArray(event.rsvpIds)) event.rsvpIds = [];

    const isRsvp = event.rsvpIds.includes(userId);
    if (isRsvp) {
      event.rsvpIds = event.rsvpIds.filter(id => id !== userId);
      this.set(STORAGE_KEYS.EVENTS, list);
      this.logActivity("RSVP Cancelled", `${userName} cancelled RSVP for ${event.title}`);
      this.notify(userId, "RSVP Cancelled", `You have cancelled your registration for ${event.title}.`, "info");
      return { success: true, rsvp: false, count: event.rsvpIds.length, event };
    } else {
      if (event.capacity && event.rsvpIds.length >= event.capacity) {
        return { success: false, message: "This event has reached full capacity." };
      }
      event.rsvpIds.push(userId);
      this.set(STORAGE_KEYS.EVENTS, list);
      this.logActivity("Event RSVP", `${userName} RSVP'd for ${event.title}`);
      this.notify(userId, "RSVP Confirmed!", `Your seat is confirmed for ${event.title}. See you there!`, "success");
      return { success: true, rsvp: true, count: event.rsvpIds.length, event };
    }
  }

  // Jobs
  static getJobs() {
    return this.get(STORAGE_KEYS.JOBS, []);
  }

  static getJobById(id) {
    return this.getJobs().find(j => j.id === id);
  }

  static saveJob(job) {
    const list = this.getJobs();
    const index = list.findIndex(j => j.id === job.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...job };
    } else {
      list.unshift(job);
    }
    this.set(STORAGE_KEYS.JOBS, list);
    this.logActivity(index >= 0 ? "Job Updated" : "Job Posted", `Job "${job.title}" at ${job.company} posted.`);
    return list[index >= 0 ? index : 0];
  }

  static deleteJob(id) {
    const list = this.getJobs();
    const item = list.find(j => j.id === id);
    const updated = list.filter(j => j.id !== id);
    this.set(STORAGE_KEYS.JOBS, updated);
    if (item) this.logActivity("Job Deleted", `Job "${item.title}" was removed.`);
    return true;
  }

  static applyToJob(jobId, application) {
    const list = this.getJobs();
    const job = list.find(j => j.id === jobId);
    if (!job) return { success: false, message: "Job not found" };

    if (!Array.isArray(job.applicantIds)) job.applicantIds = [];
    if (!Array.isArray(job.applications)) job.applications = [];

    if (job.applicantIds.includes(application.userId)) {
      return { success: false, message: "You have already applied to this position." };
    }

    job.applicantIds.push(application.userId);
    job.applications.push({
      id: 'app-' + Date.now(),
      ...application,
      appliedAt: new Date().toISOString().split('T')[0]
    });

    this.set(STORAGE_KEYS.JOBS, list);
    this.logActivity("Job Application", `${application.name} applied for "${job.title}" at ${job.company}`);
    this.notify(application.userId, "Application Submitted", `Your application for "${job.title}" at ${job.company} was submitted successfully!`, "success");
    return { success: true, job };
  }

  // Mentorship
  static getMentors() {
    return this.get(STORAGE_KEYS.MENTORS, []);
  }

  static getMentorById(id) {
    return this.getMentors().find(m => m.id === id);
  }

  static getMentorByAlumniId(alumniId) {
    return this.getMentors().find(m => m.alumniId === alumniId);
  }

  static saveMentor(mentor) {
    const list = this.getMentors();
    const index = list.findIndex(m => m.id === mentor.id || m.alumniId === mentor.alumniId);
    if (index >= 0) {
      list[index] = { ...list[index], ...mentor };
    } else {
      list.unshift(mentor);
    }
    this.set(STORAGE_KEYS.MENTORS, list);
    this.logActivity("Mentor Profile Saved", `Mentor profile updated.`);
    return list[index >= 0 ? index : 0];
  }

  static sendMentorshipRequest(mentorId, requestData) {
    const list = this.getMentors();
    const mentor = list.find(m => m.id === mentorId);
    if (!mentor) return { success: false, message: "Mentor not found" };

    if (!Array.isArray(mentor.requests)) mentor.requests = [];
    
    // Check if duplicate pending request
    const existing = mentor.requests.find(r => r.studentId === requestData.studentId && r.status === 'pending');
    if (existing) {
      return { success: false, message: "You already have a pending request with this mentor." };
    }

    const request = {
      id: 'req-' + Date.now(),
      ...requestData,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    mentor.requests.unshift(request);
    this.set(STORAGE_KEYS.MENTORS, list);

    this.logActivity("Mentorship Requested", `${requestData.studentName} requested mentorship.`);
    this.notify(requestData.studentId, "Mentorship Request Sent", `Your request to connect was sent to the mentor!`, "info");
    return { success: true, request };
  }

  static updateMentorshipStatus(mentorId, requestId, status) {
    const list = this.getMentors();
    const mentor = list.find(m => m.id === mentorId);
    if (!mentor || !mentor.requests) return { success: false, message: "Mentor or request not found" };

    const req = mentor.requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: "Request not found" };

    req.status = status;
    this.set(STORAGE_KEYS.MENTORS, list);

    this.logActivity("Mentorship Updated", `Request marked as ${status}`);
    this.notify(req.studentId, `Mentorship Request ${status === 'accepted' ? 'Accepted!' : 'Declined'}`, 
      `Your mentorship request was marked as ${status}. Check your mentorship dashboard for details.`, 
      status === 'accepted' ? 'success' : 'info'
    );
    return { success: true, req };
  }

  // Campaigns & Donations
  static getCampaigns() {
    return this.get(STORAGE_KEYS.CAMPAIGNS, []);
  }

  static getCampaignById(id) {
    return this.getCampaigns().find(c => c.id === id);
  }

  static saveCampaign(campaign) {
    const list = this.getCampaigns();
    const index = list.findIndex(c => c.id === campaign.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...campaign };
    } else {
      list.unshift(campaign);
    }
    this.set(STORAGE_KEYS.CAMPAIGNS, list);
    this.logActivity(index >= 0 ? "Campaign Updated" : "Campaign Launched", `Campaign "${campaign.title}" saved.`);
    return list[index >= 0 ? index : 0];
  }

  static donateToCampaign(campaignId, donation) {
    const list = this.getCampaigns();
    const campaign = list.find(c => c.id === campaignId);
    if (!campaign) return { success: false, message: "Campaign not found" };

    if (!Array.isArray(campaign.donations)) campaign.donations = [];

    const newDonation = {
      id: 'don-' + Date.now(),
      campaignId,
      donorId: donation.donorId || null,
      donorName: donation.isAnonymous ? "Anonymous Alumnus" : (donation.donorName || "Alumni Contributor"),
      amount: Number(donation.amount),
      date: new Date().toISOString().split('T')[0],
      message: donation.message || "Best wishes to our alma mater!",
      isAnonymous: Boolean(donation.isAnonymous)
    };

    campaign.donations.unshift(newDonation);
    campaign.raised = (Number(campaign.raised) || 0) + Number(donation.amount);

    this.set(STORAGE_KEYS.CAMPAIGNS, list);
    this.logActivity("Donation Received", `₹${newDonation.amount.toLocaleString('en-IN')} donated to "${campaign.title}"`);
    
    if (donation.userId) {
      this.notify(donation.userId, "Thank You for Your Donation!", `Your generous contribution of ₹${newDonation.amount.toLocaleString('en-IN')} to "${campaign.title}" was processed. Tax receipt generated.`, "success");
    }

    return { success: true, campaign, donation: newDonation };
  }

  // News
  static getNews() {
    return this.get(STORAGE_KEYS.NEWS, []);
  }

  static saveNews(newsItem) {
    const list = this.getNews();
    const index = list.findIndex(n => n.id === newsItem.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...newsItem };
    } else {
      list.unshift(newsItem);
    }
    this.set(STORAGE_KEYS.NEWS, list);
    this.logActivity("News Published", `"${newsItem.title}" published.`);
    return list[index >= 0 ? index : 0];
  }

  static deleteNews(id) {
    const list = this.getNews();
    const updated = list.filter(n => n.id !== id);
    this.set(STORAGE_KEYS.NEWS, updated);
    return true;
  }

  // Stories & Gallery
  static getStories() {
    return this.get(STORAGE_KEYS.STORIES, []);
  }

  static getGallery() {
    return this.get(STORAGE_KEYS.GALLERY, []);
  }

  // Notifications
  static getNotifications(userId = null) {
    const list = this.get(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!userId) return list;
    return list.filter(n => !n.userId || n.userId === userId);
  }

  static notify(userId, title, message, type = "info") {
    const list = this.get(STORAGE_KEYS.NOTIFICATIONS, []);
    const notif = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId,
      title,
      message,
      type,
      date: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    list.unshift(notif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    // Dispatch custom event for real-time UI updates
    window.dispatchEvent(new CustomEvent('alumni-notification', { detail: notif }));
    return notif;
  }

  static markNotificationRead(notifId) {
    const list = this.get(STORAGE_KEYS.NOTIFICATIONS, []);
    const item = list.find(n => n.id === notifId);
    if (item) {
      item.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    }
  }

  static markAllNotificationsRead(userId) {
    const list = this.get(STORAGE_KEYS.NOTIFICATIONS, []);
    list.forEach(n => {
      if (!n.userId || n.userId === userId) n.read = true;
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  // Activity Log
  static getActivityLogs() {
    return this.get(STORAGE_KEYS.ACTIVITY_LOGS, []);
  }

  static logActivity(action, details) {
    const list = this.get(STORAGE_KEYS.ACTIVITY_LOGS, []);
    const item = {
      id: 'act-' + Date.now(),
      timestamp: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      action,
      details
    };
    list.unshift(item);
    if (list.length > 50) list.pop();
    this.set(STORAGE_KEYS.ACTIVITY_LOGS, list);
  }

  // Users
  static getUsers() {
    return this.get(STORAGE_KEYS.USERS, []);
  }

  static saveUser(user) {
    const list = this.getUsers();
    const index = list.findIndex(u => u.id === user.id || u.email === user.email);
    if (index >= 0) {
      list[index] = { ...list[index], ...user };
    } else {
      list.unshift(user);
    }
    this.set(STORAGE_KEYS.USERS, list);
    return list[index >= 0 ? index : 0];
  }

  // Theme
  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  static setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
}

// Auto-initialize when loaded
StorageService.init();
