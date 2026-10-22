# AlumniNetwork 🎓

A modern, responsive, frontend-only platform connecting alumni with their alma mater and each other.

Built strictly according to the **AlumniNetwork Product Requirements Document (PRD)**.

---

## 🌟 Highlights & Architecture

- **Zero-Build & Ultra-Fast**: Pure HTML5, Vanilla CSS3 with CSS Custom Properties, and modular JavaScript (ES6 Modules). No complex bundler or npm installation required.
- **Simulated Client-Side Database & Persistence**: All users, alumni profiles, events, jobs, mentorship requests, and fundraising donations are stored in JavaScript arrays and persisted reactively in `localStorage`.
- **Role-Based Access Control (RBAC)**:
  - **Visitor**: Explores landing page, public events, news, success stories, and registration.
  - **Student**: Searches alumni directory, requests 1-on-1 mentorship, applies to jobs and internships.
  - **Alumni**: Manages full profile, RSVPs to events, posts career openings, offers mentorship, and donates.
  - **Admin**: Executive oversight dashboard with Chart.js analytics, audit logs, CRUD controls, and CSV/PDF report downloads.
- **Interactive 1-Click Role Switcher**: A quick persona toggle button in the header allows instant switching between **Student**, **Alumni**, and **Admin** roles without re-typing passwords.

---

## 📂 Project Structure

```
alumninetwork/
│── index.html              # Home landing page with hero, live metrics, spotlights
│── server.js               # Lightweight local Node.js static server
│── README.md               # Documentation & testing guide
│
├── pages/
│   ├── directory.html      # Searchable alumni directory with multi-filters & modal
│   ├── profile.html        # Detailed member profile view & live edit form
│   ├── events.html         # Upcoming/past events, capacity meters & live RSVPs
│   ├── jobs.html           # Job board, application modal & applicant viewer
│   ├── mentorship.html     # Mentorship hub, request workflow & mentor approvals
│   ├── fundraising.html    # Campaign progress bars, donation modal & donor wall
│   ├── admin.html          # Protected admin dashboard, Chart.js graphs & exports
│   ├── login.html          # Authentication with 1-click test login buttons
│   ├── register.html       # Role-specific registration form with validations
│   ├── gallery.html        # Reunion photo gallery with full interactive lightbox
│   └── news.html           # Campus announcements & article modal reader
│
├── css/
│   ├── style.css           # Design tokens, typography, cards, buttons, toasts, modals
│   ├── responsive.css      # Breakpoints (1024px, 768px, 480px, 360px) & mobile drawer
│   └── dark.css            # Dark mode palette overrides and contrast styling
│
├── js/
│   ├── data.js             # Comprehensive seed datasets (35 alumni, 8 events, 10 jobs, 6 mentors, 4 campaigns)
│   ├── storage.js          # Reactive localStorage CRUD abstraction with audit logger
│   ├── auth.js             # Simulated session management, RBAC checks & route guards
│   ├── ui.js               # Universal header/footer renderer, toast alerts, dark mode
│   ├── home.js             # Landing page metrics and dynamic spotlight cards
│   ├── directory.js        # Multi-filter search, sort, pagination, card/list views
│   ├── profile.js          # Profile view, editing with form validation, and persistence
│   ├── events.js           # Live RSVP counter, capacity limit tracking, event creation
│   ├── jobs.js             # Job filtering, applications, postings, applicant tracking
│   ├── mentorship.js       # Mentor directory, request dispatch, student/mentor dashboard
│   ├── fundraising.js      # Goal percentage tracking, donation simulation & donor wall
│   ├── admin.js            # Chart.js analytics, user/event/job management, CSV/PDF export
│   ├── gallery.js          # Category filters and keyboard-accessible lightbox
│   ├── news.js             # Searchable news feed and article reader
│   └── auth-pages.js       # Fast demo logins and registration validation
│
└── assets/
    └── images/             # Static image assets
```

---

## ⚡ Quick Start

### Option 1: Using the Built-in Node Static Server
```bash
node server.js
```
Open **`http://localhost:8085/`** in any modern web browser.

### Option 2: Using Any Static Server
You can also serve the files with Python or VS Code Live Server:
```bash
python -m http.server 8080
```
Or simply double-click **`index.html`** in your file manager.

---

## 🎭 Pre-Configured Test Personas

Use the **Role Pill Button** in the navigation bar or test accounts on the login page:

| Persona | Name | Role | Email | Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Vikram Seth | `admin` | `admin@alumni.edu` | Access to Admin Dashboard, charts, add/edit/delete records, CSV/PDF export |
| **Alumni** | Priya Sundaram | `alumni` | `priya.alumni@tech.com` | Edit own profile, create events, post jobs, offer mentorship, donate |
| **Student** | Rahul Verma | `student` | `rahul.student@edu.in` | Browse alumni, apply to jobs/internships, send mentorship requests |

---

## ✅ Acceptance Criteria & Feature Checklist

- [x] **Directory Search & Multi-Filters**: Real-time debounced search combining Batch ranges (2010–2015, 2016–2020, 2021–2025), Branch, Location, and Profession.
- [x] **Card & List View**: Toggle between responsive grid cards and clean tabular list view.
- [x] **Events & RSVP**: Real-time RSVP button state change, attendee counter increment/decrement, and capacity limits with progress bars.
- [x] **Job Board**: Postings with filters (Full-time, Internship, Remote, Contract), application modal, and applicant tracker.
- [x] **Mentorship Program**: Mentor directory with topic filters, 1-on-1 request modal, and incoming request approval/declining dashboard.
- [x] **Campaigns & Giving**: Live progress bar toward target goals, donation modal with preset contribution tiers, and honor donor wall.
- [x] **Profile Management**: Bio, education, work history, skills, social links, and edit modal with localStorage persistence.
- [x] **Admin Dashboard**: Stat cards, **Chart.js** cohort and profession distributions, management tables with confirmation before delete, and CSV/PDF export.
- [x] **Simulated Notifications & Toasts**: Real-time feedback alerts and notification center dropdown for RSVPs, applications, and donations.
- [x] **Dark Mode Toggle**: Persistent theme switcher in the navbar.
- [x] **Mobile Responsiveness**: Adaptive layout with slide-in mobile hamburger drawer tested across 360px to 1440px+.
