/**
 * progress.js — Progress tracker and task checklist
 * StudyMate AI – Intelligent Student Study Assistant
 *
 * Manages a persisted list of study tasks:
 *   - createTask / addTask / toggleTask / deleteTask / clearCompleted
 *   - renderTasks  — builds DOM from current task array + active filter
 *   - updateProgressBar — syncs the stats and progress bar
 *   - initProgress — wires all event listeners (idempotent via _initialized guard)
 */

import { getTasks, saveTasks } from './storage.js';
import { showToast } from './ui.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** Currently active filter: 'all' | 'pending' | 'completed' */
let _currentFilter = 'all';

/** Prevents wiring event listeners more than once across SPA navigations */
let _initialized = false;

// ---------------------------------------------------------------------------
// Task factory
// ---------------------------------------------------------------------------

/**
 * Build a new task object with a unique id.
 *
 * @param {string} subject
 * @param {string} description
 * @param {string} dueDate  — 'YYYY-MM-DD' or empty string
 * @returns {{ id: string, subject: string, description: string, dueDate: string, completed: boolean, createdAt: string }}
 */
function createTask(subject, description, dueDate) {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).slice(2);

  return {
    id,
    subject: subject.trim(),
    description: description.trim(),
    dueDate: dueDate || '',
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

/**
 * Add a new task, persist, re-render, and show a toast.
 */
function addTask(subject, description, dueDate) {
  const tasks = getTasks();
  tasks.push(createTask(subject, description, dueDate));
  saveTasks(tasks);
  renderTasks(tasks, _currentFilter);
  showToast('Task added', 'success');
}

/**
 * Toggle the completed state of the task with the given id.
 */
function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks(tasks);
  renderTasks(tasks, _currentFilter);
  showToast(task.completed ? 'Task marked complete ✓' : 'Task marked pending', 'info');
}

/**
 * Permanently remove the task with the given id.
 */
function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  renderTasks(tasks, _currentFilter);
  showToast('Task removed', 'info');
}

/**
 * Remove all completed tasks.
 */
function clearCompleted() {
  const tasks = getTasks().filter(t => !t.completed);
  saveTasks(tasks);
  renderTasks(tasks, _currentFilter);
  showToast('Completed tasks cleared', 'info');
}

// ---------------------------------------------------------------------------
// DOM builders
// ---------------------------------------------------------------------------

/**
 * Build and return a single .task-item element for the given task.
 *
 * @param {{ id: string, subject: string, description: string, dueDate: string, completed: boolean }} task
 * @returns {HTMLElement}
 */
function buildTaskItem(task) {
  const item = document.createElement('div');
  item.className = 'task-item' + (task.completed ? ' completed' : '');
  item.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', `Mark "${task.description}" as ${task.completed ? 'pending' : 'complete'}`);
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Body
  const body = document.createElement('div');
  body.className = 'task-body';

  const badge = document.createElement('span');
  badge.className = 'task-subject-badge';
  badge.textContent = task.subject;

  const desc = document.createElement('p');
  desc.className = 'task-description';
  desc.textContent = task.description;

  body.appendChild(badge);
  body.appendChild(desc);

  // Due date (optional)
  if (task.dueDate) {
    const due = document.createElement('p');
    due.className = 'task-due';

    // Format date for display
    const [year, month, day] = task.dueDate.split('-');
    due.textContent = `Due: ${day}/${month}/${year}`;

    // Mark overdue: past date and not completed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    if (!task.completed && dueDate < today) {
      due.classList.add('overdue');
      due.textContent += ' — overdue';
    }

    body.appendChild(due);
  }

  // Delete button
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-sm btn-danger';
  deleteBtn.textContent = '✕';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.description}`);
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  actions.appendChild(deleteBtn);

  item.appendChild(checkbox);
  item.appendChild(body);
  item.appendChild(actions);

  return item;
}

/**
 * Render the task list, applying the given filter.
 * Always uses the full tasks array for progress bar calculations.
 *
 * @param {Array} tasks  — full unfiltered array
 * @param {'all'|'pending'|'completed'} filter
 */
function renderTasks(tasks, filter = 'all') {
  const container = document.getElementById('task-list-container');
  if (!container) return;

  // Apply filter for display only
  const visible =
    filter === 'pending'
      ? tasks.filter(t => !t.completed)
      : filter === 'completed'
      ? tasks.filter(t => t.completed)
      : tasks;

  container.innerHTML = '';

  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent =
      filter === 'completed' ? '🎯' : filter === 'pending' ? '✅' : '📝';

    const msg = document.createElement('p');
    msg.textContent =
      filter === 'completed'
        ? 'No completed tasks yet. Start checking things off! 🎯'
        : filter === 'pending'
        ? 'No pending tasks. Great work! ✅'
        : 'No tasks yet. Add your first study task above! 📝';

    empty.appendChild(icon);
    empty.appendChild(msg);
    container.appendChild(empty);
  } else {
    visible.forEach(task => container.appendChild(buildTaskItem(task)));
  }

  // Progress bar always reflects the full list
  updateProgressBar(tasks);
}

/**
 * Update the progress bar and stat numbers based on the full task list.
 *
 * @param {Array} tasks
 */
function updateProgressBar(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const remaining = total - completed;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  const bar = document.getElementById('prog-bar');
  const labelTotal = document.getElementById('prog-total');
  const labelCompleted = document.getElementById('prog-completed');
  const labelRemaining = document.getElementById('prog-remaining');
  const labelPct = document.getElementById('prog-percent-label');

  if (bar) bar.style.width = pct + '%';
  if (labelTotal) labelTotal.textContent = total;
  if (labelCompleted) labelCompleted.textContent = completed;
  if (labelRemaining) labelRemaining.textContent = remaining;
  if (labelPct) labelPct.textContent = pct + '% complete';
}

// ---------------------------------------------------------------------------
// Init (exported — called by router on each navigation to this view)
// ---------------------------------------------------------------------------

/**
 * Initialise the Progress Tracker view.
 * Safe to call on every navigation — event listeners are attached only once.
 */
export function initProgress() {
  // Always re-render with current data so the view is fresh on each visit
  const tasks = getTasks();
  renderTasks(tasks, _currentFilter);

  // Restore active filter button state
  document.querySelectorAll('.task-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === _currentFilter);
  });

  // Wire event listeners only once
  if (_initialized) return;
  _initialized = true;

  // --- Add task form ---
  const form = document.getElementById('add-task-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const subject = document.getElementById('task-subject').value.trim();
      const description = document.getElementById('task-description').value.trim();
      const dueDate = document.getElementById('task-due').value;

      if (!subject || !description) {
        showToast('Please fill in Subject and Description', 'warning');
        return;
      }

      addTask(subject, description, dueDate);
      form.reset();
    });
  }

  // --- Filter buttons ---
  document.querySelectorAll('.task-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _currentFilter = btn.dataset.filter;

      // Update active class
      document.querySelectorAll('.task-filter-btn').forEach(b =>
        b.classList.toggle('active', b === btn)
      );

      renderTasks(getTasks(), _currentFilter);
    });
  });

  // --- Clear completed ---
  const clearBtn = document.getElementById('clear-completed-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const tasks = getTasks();
      const doneCount = tasks.filter(t => t.completed).length;
      if (doneCount === 0) {
        showToast('No completed tasks to clear', 'info');
        return;
      }
      if (window.confirm(`Remove ${doneCount} completed task${doneCount > 1 ? 's' : ''}?`)) {
        clearCompleted();
      }
    });
  }
}
