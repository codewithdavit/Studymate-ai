/**
 * planner.js — Study planner and schedule generator
 * StudyMate AI – Intelligent Student Study Assistant
 *
 * ES module. Exported entry point: initPlanner()
 * Called by the router each time the planner view becomes active.
 */

import { getSchedule, saveSchedule } from './storage.js';
import { showToast } from './ui.js';

// ---------------------------------------------------------------------------
// Guard against double-binding when the user navigates back to this view
// ---------------------------------------------------------------------------
let _initialized = false;

// ---------------------------------------------------------------------------
// Module-level DOM references (set once inside initPlanner)
// ---------------------------------------------------------------------------
let formEl, subjectRowsEl, addSubjectBtn, dailyHoursEl, targetDateEl;
let plannerErrorsEl, plannerOutputEl, scheduleSummaryEl;
let toggleDayviewBtn, scheduleDayviewEl, scheduleTbodyEl, clearScheduleBtn;

// ---------------------------------------------------------------------------
// addSubjectRow
// ---------------------------------------------------------------------------

/**
 * Append a fresh subject row to the given container, wiring its remove button.
 * Also refreshes the remove-button visibility across all rows.
 *
 * @param {HTMLElement} container  The #subject-rows element
 */
function addSubjectRow(container) {
  const row = document.createElement('div');
  row.className = 'subject-row';
  row.innerHTML = `
    <input type="text"   name="subject-name"  placeholder="e.g. Mathematics" aria-label="Subject name" />
    <input type="text"   name="subject-topic" placeholder="e.g. Algebra"     aria-label="Topic" />
    <input type="number" name="subject-hours" placeholder="Hours needed" min="0.5" step="0.5" class="hours-input" aria-label="Hours needed" />
    <button type="button" class="btn btn-danger btn-sm" aria-label="Remove subject row">✕</button>
  `;

  // Wire the remove button for this row
  row.querySelector('button').addEventListener('click', () => {
    row.remove();
    _updateRemoveButtons(container);
  });

  container.appendChild(row);
  _updateRemoveButtons(container);
}

/**
 * Show remove buttons only when there is more than one row.
 * @param {HTMLElement} container
 */
function _updateRemoveButtons(container) {
  const rows = container.querySelectorAll('.subject-row');
  rows.forEach(r => {
    const btn = r.querySelector('button[aria-label="Remove subject row"]');
    if (btn) btn.style.display = rows.length > 1 ? '' : 'none';
  });
}

// ---------------------------------------------------------------------------
// validateForm
// ---------------------------------------------------------------------------

/**
 * Validate planner form inputs.
 *
 * @param {{ name: string, topic: string, hours: number }[]} subjects
 * @param {number} dailyHours
 * @param {string} targetDate  ISO date string (YYYY-MM-DD)
 * @returns {string[]}  Array of error messages; empty means valid
 */
function validateForm(subjects, dailyHours, targetDate) {
  const errors = [];

  if (subjects.length === 0) {
    errors.push('Add at least one subject.');
  }

  subjects.forEach((s, i) => {
    const label = s.name.trim() ? `"${s.name.trim()}"` : `Row ${i + 1}`;
    if (!s.name.trim()) errors.push(`Row ${i + 1}: subject name is required.`);
    if (!(s.hours > 0))  errors.push(`${label}: hours needed must be greater than 0.`);
  });

  if (!(dailyHours > 0)) {
    errors.push('Daily study hours must be greater than 0.');
  }

  if (!targetDate) {
    errors.push('Target completion date is required.');
  } else {
    // Compare calendar dates only (strip time component)
    const today = _todayStr();
    if (targetDate < today) {
      errors.push('Target completion date must be today or in the future.');
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// generateSchedule
// ---------------------------------------------------------------------------

/**
 * Return today's date as an ISO string (YYYY-MM-DD) in local time.
 * @returns {string}
 */
function _todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Build a full schedule object from validated inputs.
 *
 * @param {{ name: string, topic: string, hours: number }[]} subjects
 * @param {number} dailyHours
 * @param {string} targetDate  YYYY-MM-DD
 * @returns {{ subjects: object[], days: object[] }}
 */
function generateSchedule(subjects, dailyHours, targetDate) {
  const today = new Date(_todayStr());             // midnight local
  const end   = new Date(targetDate + 'T00:00:00'); // midnight local

  // Number of calendar days, inclusive of today and target; minimum 1
  const msPerDay = 86_400_000;
  const numDays  = Math.max(1, Math.round((end - today) / msPerDay) + 1);

  const totalHoursNeeded = subjects.reduce((s, r) => s + r.hours, 0);

  // Per-subject proportional daily allocation
  const summary = subjects.map(s => {
    const dailyAlloc = totalHoursNeeded > 0
      ? (s.hours / totalHoursNeeded) * dailyHours
      : dailyHours / subjects.length;
    return {
      name:       s.name.trim(),
      topic:      s.topic.trim(),
      totalHours: s.hours,
      dailyHours: Math.round(dailyAlloc * 10) / 10,
    };
  });

  // Build day entries
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today.getTime() + i * msPerDay);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const displayDate = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const assignments = summary.map(s => ({
      subject: s.name,
      topic:   s.topic,
      hours:   s.dailyHours,
    }));
    days.push({ dateStr, displayDate, assignments });
  }

  return { subjects: summary, days };
}

// ---------------------------------------------------------------------------
// renderSummary
// ---------------------------------------------------------------------------

/**
 * Inject subject summary cards and an overview header into #schedule-summary.
 * @param {{ subjects: object[], days: object[] }} schedule
 */
function renderSummary(schedule) {
  const totalHours = schedule.subjects.reduce((s, r) => s + r.totalHours, 0);
  const numDays    = schedule.days.length;

  let html = `
    <div style="margin-bottom:1rem;">
      <span style="font-size:0.875rem; color:var(--color-muted);">
        <strong style="color:var(--color-text);">${numDays} day${numDays !== 1 ? 's' : ''}</strong> plan &nbsp;·&nbsp;
        <strong style="color:var(--color-text);">${totalHours} total hours</strong> across ${schedule.subjects.length} subject${schedule.subjects.length !== 1 ? 's' : ''}
      </span>
    </div>
    <div class="grid-3">
  `;

  schedule.subjects.forEach(s => {
    html += `
      <div class="card" style="padding:1rem;">
        <div style="font-weight:700; font-size:1rem; margin-bottom:0.15rem;">${_esc(s.name)}</div>
        <div style="font-size:0.8rem; color:var(--color-muted); margin-bottom:0.75rem;">${_esc(s.topic) || '<em>No topic specified</em>'}</div>
        <div style="display:flex; gap:1.5rem;">
          <div>
            <div style="font-size:1.25rem; font-weight:700; color:var(--color-primary);">${s.totalHours}h</div>
            <div style="font-size:0.75rem; color:var(--color-muted);">Total</div>
          </div>
          <div>
            <div style="font-size:1.25rem; font-weight:700; color:var(--color-primary);">${s.dailyHours}h</div>
            <div style="font-size:0.75rem; color:var(--color-muted);">Per day</div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  scheduleSummaryEl.innerHTML = html;
}

// ---------------------------------------------------------------------------
// renderDayByDay
// ---------------------------------------------------------------------------

/**
 * Populate #schedule-tbody with one row per assignment per day.
 * The first row for each new date gets a left-accent style and shows the date;
 * subsequent rows for the same date show an empty date cell.
 *
 * @param {{ subjects: object[], days: object[] }} schedule
 */
function renderDayByDay(schedule) {
  scheduleTbodyEl.innerHTML = '';

  schedule.days.forEach(day => {
    day.assignments.forEach((a, idx) => {
      const tr = document.createElement('tr');
      if (idx === 0) tr.classList.add('day-first-row');

      const dateCell = idx === 0 ? _esc(day.displayDate) : '';
      tr.innerHTML = `
        <td style="white-space:nowrap; color:${idx === 0 ? 'var(--color-text)' : 'transparent'};">${dateCell}</td>
        <td>${_esc(a.subject)}</td>
        <td style="color:var(--color-muted);">${_esc(a.topic) || '—'}</td>
        <td>${a.hours}h</td>
      `;
      scheduleTbodyEl.appendChild(tr);
    });
  });
}

// ---------------------------------------------------------------------------
// toggleDayView
// ---------------------------------------------------------------------------

function toggleDayView() {
  const isHidden = scheduleDayviewEl.style.display === 'none';
  scheduleDayviewEl.style.display = isHidden ? 'block' : 'none';
  toggleDayviewBtn.textContent = isHidden
    ? '▲ Hide Day-by-Day Schedule'
    : '▼ Show Day-by-Day Schedule';
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** HTML-escape a string to prevent XSS. */
function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Read all subject rows from the DOM and return structured objects. */
function _readSubjects() {
  const rows = subjectRowsEl.querySelectorAll('.subject-row');
  return Array.from(rows).map(row => ({
    name:  row.querySelector('[name="subject-name"]').value,
    topic: row.querySelector('[name="subject-topic"]').value,
    hours: parseFloat(row.querySelector('[name="subject-hours"]').value) || 0,
  }));
}

// ---------------------------------------------------------------------------
// initPlanner — exported entry point
// ---------------------------------------------------------------------------

/**
 * Initialise the planner view.
 * Safe to call multiple times (subsequent calls are no-ops due to _initialized guard).
 */
export function initPlanner() {
  if (_initialized) return;
  _initialized = true;

  // Cache DOM references
  formEl           = document.getElementById('planner-form');
  subjectRowsEl    = document.getElementById('subject-rows');
  addSubjectBtn    = document.getElementById('add-subject-btn');
  dailyHoursEl     = document.getElementById('daily-hours');
  targetDateEl     = document.getElementById('target-date');
  plannerErrorsEl  = document.getElementById('planner-errors');
  plannerOutputEl  = document.getElementById('planner-output');
  scheduleSummaryEl = document.getElementById('schedule-summary');
  toggleDayviewBtn = document.getElementById('toggle-dayview-btn');
  scheduleDayviewEl = document.getElementById('schedule-dayview');
  scheduleTbodyEl  = document.getElementById('schedule-tbody');
  clearScheduleBtn = document.getElementById('clear-schedule-btn');

  // Wire the remove button on the initial (only) row
  _updateRemoveButtons(subjectRowsEl);
  const firstRemoveBtn = subjectRowsEl.querySelector('.subject-row button[aria-label="Remove subject row"]');
  firstRemoveBtn.addEventListener('click', () => {
    firstRemoveBtn.closest('.subject-row').remove();
    _updateRemoveButtons(subjectRowsEl);
  });

  // ＋ Add Subject
  addSubjectBtn.addEventListener('click', () => addSubjectRow(subjectRowsEl));

  // Form submit → validate → generate → save → render
  formEl.addEventListener('submit', e => {
    e.preventDefault();

    const subjects   = _readSubjects();
    const dailyHours = parseFloat(dailyHoursEl.value) || 0;
    const targetDate = targetDateEl.value;

    const errors = validateForm(subjects, dailyHours, targetDate);

    if (errors.length > 0) {
      plannerErrorsEl.innerHTML = `<ul>${errors.map(err => `<li>${_esc(err)}</li>`).join('')}</ul>`;
      plannerErrorsEl.style.display = 'block';
      return;
    }

    plannerErrorsEl.style.display = 'none';

    const schedule = generateSchedule(subjects, dailyHours, targetDate);
    saveSchedule(schedule);
    renderSummary(schedule);
    renderDayByDay(schedule);
    plannerOutputEl.style.display = 'block';
    // Reset day-by-day to collapsed state
    scheduleDayviewEl.style.display = 'none';
    toggleDayviewBtn.textContent = '▼ Show Day-by-Day Schedule';
    showToast('Schedule generated!', 'success');
  });

  // Toggle day-by-day view
  toggleDayviewBtn.addEventListener('click', toggleDayView);

  // Clear schedule
  clearScheduleBtn.addEventListener('click', () => {
    if (!confirm('Clear your saved schedule?')) return;
    saveSchedule(null);
    plannerOutputEl.style.display = 'none';
    scheduleDayviewEl.style.display = 'none';
    toggleDayviewBtn.textContent = '▼ Show Day-by-Day Schedule';
    showToast('Schedule cleared.', 'info');
  });

  // Restore saved schedule if one exists
  const saved = getSchedule();
  if (saved) {
    renderSummary(saved);
    renderDayByDay(saved);
    plannerOutputEl.style.display = 'block';
  }
}
