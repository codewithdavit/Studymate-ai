/**
 * app.js — Entry point, SPA router, global initialisation
 * StudyMate AI – Intelligent Student Study Assistant
 *
 * Responsibilities:
 *  - Read URL hash and show the matching view section
 *  - Call per-view init functions on activation
 *  - Handle mobile hamburger menu toggle
 */

import { initDashboard }  from './dashboard.js';
import { initPlanner }    from './planner.js';
import { initQuestions }  from './questions.js';
import { initProgress }   from './progress.js';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** All valid view IDs (without the "view-" prefix). */
const VIEWS = ['dashboard', 'planner', 'questions', 'progress', 'about', 'developer'];

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

/**
 * Read the current URL hash and activate the matching view section.
 * Falls back to 'dashboard' when the hash is empty or unrecognised.
 */
function router() {
  // Strip the leading '#'
  const raw = location.hash.slice(1).toLowerCase();
  const viewId = VIEWS.includes(raw) ? raw : 'dashboard';

  // Hide all view sections
  document.querySelectorAll('.view-section').forEach(el => {
    el.classList.remove('active');
  });

  // Show the active view
  const activeSection = document.getElementById(`view-${viewId}`);
  if (activeSection) {
    activeSection.classList.add('active');
  }

  // Update nav link highlight
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkView = link.getAttribute('data-view');
    link.classList.toggle('active', linkView === viewId);
  });

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    planner: 'Study Planner',
    questions: 'Practice Questions',
    progress: 'Progress Tracker',
    about: 'About',
    developer: 'Developer Info',
  };
  document.title = `${titles[viewId] || viewId} — StudyMate AI`;

  // Sync hash in case we defaulted to dashboard
  if (!VIEWS.includes(raw)) {
    history.replaceState(null, '', `#dashboard`);
  }

  // Run per-view initialisation
  initView(viewId);

  // Close mobile nav menu (if open)
  closeNavMenu();
}

/* ------------------------------------------------------------------ */
/* Per-view initialisation dispatcher                                  */
/* ------------------------------------------------------------------ */

/**
 * Call the appropriate init function when a view becomes active.
 * Static views (about, developer) require no JS initialisation.
 *
 * @param {string} id - View ID (e.g. 'dashboard', 'planner')
 */
function initView(id) {
  switch (id) {
    case 'dashboard':
      initDashboard();
      break;
    case 'planner':
      initPlanner();
      break;
    case 'questions':
      initQuestions();
      break;
    case 'progress':
      initProgress();
      break;
    // 'about' and 'developer' are pure HTML — no init needed
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/* Mobile navigation toggle                                            */
/* ------------------------------------------------------------------ */

function openNavMenu() {
  const menu   = document.getElementById('nav-menu');
  const toggle = document.getElementById('nav-toggle');
  menu.classList.add('open');
  toggle.setAttribute('aria-expanded', 'true');
}

function closeNavMenu() {
  const menu   = document.getElementById('nav-menu');
  const toggle = document.getElementById('nav-toggle');
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu   = document.getElementById('nav-menu');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('open')) {
      closeNavMenu();
    } else {
      openNavMenu();
    }
  });

  // Close nav when any nav link is clicked
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => closeNavMenu());
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    const nav = document.getElementById('main-nav');
    if (nav && !nav.contains(e.target)) {
      closeNavMenu();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Bootstrap                                                           */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  router();
});

window.addEventListener('hashchange', router);
