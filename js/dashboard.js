/**
 * dashboard.js
 * Renders the Dashboard view — greeting, date, and live summary stats.
 * Called by the router each time the dashboard view is activated.
 */

import { getTasks, getSchedule } from './storage.js';

/**
 * Returns a greeting string based on the current hour.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning! ☀️';
  if (hour < 17) return 'Good afternoon! 🌤️';
  return 'Good evening! 🌙';
}

/**
 * Formats today's date as a readable string, e.g. "Monday, 14 July 2025".
 */
function formatDate() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

/**
 * Initialises and renders the dashboard view.
 * Reads current tasks and schedule from localStorage and updates stat widgets.
 */
export function initDashboard() {
  // Greeting and date
  const greetingEl = document.getElementById('dashboard-greeting');
  const dateEl = document.getElementById('dashboard-date');
  if (greetingEl) greetingEl.textContent = getGreeting();
  if (dateEl) dateEl.textContent = formatDate();

  // Task stats
  const tasks = getTasks();
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  const pendingEl = document.getElementById('stat-pending');
  const completedEl = document.getElementById('stat-completed');
  if (pendingEl) pendingEl.textContent = pending;
  if (completedEl) completedEl.textContent = completed;

  // Schedule subjects count
  const schedule = getSchedule();
  const subjectCount = schedule && Array.isArray(schedule.subjects) ? schedule.subjects.length : 0;
  const subjectsEl = document.getElementById('stat-subjects');
  if (subjectsEl) subjectsEl.textContent = subjectCount;
}
