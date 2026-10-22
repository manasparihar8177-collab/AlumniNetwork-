// Simulated Authentication & Role-Based Access Control (RBAC)
// Supports Visitor, Student, Alumni, Admin roles with session persistence in localStorage

import { StorageService } from './storage.js';

const SESSION_KEY = 'alumninetwork_session';

export class AuthService {
  // Demo accounts for quick testing
  static DEMO_ACCOUNTS = {
    admin: {
      id: "usr-admin-1",
      name: "Dr. Vikram Seth",
      email: "admin@alumni.edu",
      role: "admin",
      alumniId: "alm-1",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      title: "Dean of Alumni Relations & Academician"
    },
    alumni: {
      id: "usr-alumni-1",
      name: "Priya Sundaram",
      email: "priya.alumni@tech.com",
      role: "alumni",
      alumniId: "alm-2",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
      title: "Staff Software Engineer at Stripe"
    },
    student: {
      id: "usr-student-1",
      name: "Rahul Verma",
      email: "rahul.student@edu.in",
      role: "student",
      alumniId: null,
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
      title: "Final Year Computer Science Undergrad"
    }
  };

  static getCurrentUser() {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) return JSON.parse(session);
    } catch (e) {
      console.error("Session parse error", e);
    }
    // Default to Alumni demo user for seamless interactive experience if no session yet
    const defaultUser = this.DEMO_ACCOUNTS.alumni;
    this.setCurrentUser(defaultUser);
    return defaultUser;
  }

  static setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new CustomEvent('alumni-auth-change', { detail: user }));
  }

  static login(email, password = "password", role = null) {
    const users = StorageService.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Check demo accounts
      for (const key of Object.keys(this.DEMO_ACCOUNTS)) {
        if (this.DEMO_ACCOUNTS[key].email.toLowerCase() === email.toLowerCase()) {
          user = this.DEMO_ACCOUNTS[key];
          break;
        }
      }
    }

    if (user) {
      this.setCurrentUser(user);
      StorageService.logActivity("User Login", `${user.name} logged in as ${user.role}.`);
      return { success: true, user };
    }

    // If custom email typed during simulated login, generate user with chosen role
    const newUser = {
      id: 'usr-' + Date.now(),
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      email,
      role: role || "alumni",
      alumniId: role === "alumni" ? "alm-" + Date.now() : null,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      title: role === "admin" ? "Alumni Network Admin" : role === "student" ? "Undergraduate Student" : "Alumnus"
    };

    StorageService.saveUser(newUser);
    this.setCurrentUser(newUser);
    StorageService.logActivity("User Registered", `${newUser.name} created account as ${newUser.role}.`);
    return { success: true, user: newUser };
  }

  static register(name, email, role, extra = {}) {
    let alumniId = null;

    if (role === 'alumni') {
      alumniId = 'alm-' + Date.now();
      const newAlumnus = {
        id: alumniId,
        name,
        email,
        batch: extra.batch || "2024",
        batchRange: "2021–2025",
        branch: extra.branch || "Computer Science",
        location: extra.location || "Bangalore",
        profession: extra.profession || "Software Engineer",
        company: extra.company || "Independent",
        bio: extra.bio || `Passionate ${extra.branch || 'Engineering'} graduate eager to collaborate.`,
        skills: extra.skills || ["Collaboration", "Problem Solving"],
        photo: extra.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
        education: `B.Tech in ${extra.branch || 'Computer Science'}, Batch of ${extra.batch || '2024'}`,
        experience: extra.company ? `Engineer at ${extra.company}` : "Graduate Professional",
        socialLinks: { linkedin: "https://linkedin.com", github: "https://github.com" },
        featured: false
      };
      StorageService.saveAlumnus(newAlumnus);
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name,
      email,
      role,
      alumniId,
      avatar: extra.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      title: role === 'admin' ? "Alumni Coordinator" : role === 'student' ? "Engineering Student" : `${extra.profession || 'Professional'} at ${extra.company || 'Tech'}`
    };

    StorageService.saveUser(newUser);
    this.setCurrentUser(newUser);
    StorageService.logActivity("New Registration", `${name} joined as ${role}.`);
    return { success: true, user: newUser };
  }

  static switchRole(roleName) {
    if (this.DEMO_ACCOUNTS[roleName]) {
      const user = this.DEMO_ACCOUNTS[roleName];
      this.setCurrentUser(user);
      StorageService.logActivity("Switched Role", `Demo session switched to ${roleName.toUpperCase()}: ${user.name}`);
      return user;
    }
    return null;
  }

  static logout() {
    const user = this.getCurrentUser();
    if (user) {
      StorageService.logActivity("User Logout", `${user.name} logged out.`);
    }
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('alumni-auth-change', { detail: null }));
  }

  static isAuthenticated() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role !== 'visitor');
  }

  static isAdmin() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role === 'admin');
  }

  static isAlumni() {
    const user = this.getCurrentUser();
    return Boolean(user && (user.role === 'alumni' || user.role === 'admin'));
  }

  static isStudent() {
    const user = this.getCurrentUser();
    return Boolean(user && user.role === 'student');
  }

  // Route guard helper
  static guardRoute(requiredRole = null) {
    const user = this.getCurrentUser();
    if (!user || user.role === 'visitor') {
      window.location.href = this.resolvePath('pages/login.html') + `?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
      return false;
    }

    return true;
  }

  static resolvePath(relativePath) {
    const isInPages = window.location.pathname.includes('/pages/');
    if (isInPages) {
      return relativePath.startsWith('pages/') ? relativePath.replace('pages/', '') : '../' + relativePath;
    }
    return relativePath;
  }
}
