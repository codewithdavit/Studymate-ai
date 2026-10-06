/**
 * storage.js — localStorage read/write helpers
 * StudyMate AI – Intelligent Student Study Assistant
 *
 * Provides typed get/save functions for tasks, schedule, and progress,
 * built on top of generic helpers that never throw.
 */

// ---------------------------------------------------------------------------
// Key constants
// ---------------------------------------------------------------------------

const KEYS = {
  TASKS:    'studymate_tasks',
  SCHEDULE: 'studymate_schedule',
  PROGRESS: 'studymate_progress',
};

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/**
 * Persist any serialisable value under the given localStorage key.
 * Silently catches QuotaExceededError (and any other serialisation error)
 * so callers are never interrupted by storage failures.
 *
 * @param {string} key
 * @param {*} value
 */
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[storage] saveData failed for key "${key}":`, err);
  }
}

/**
 * Read and deserialise a value from localStorage.
 * Returns `defaultValue` when the key is absent, the stored string is not
 * valid JSON, or any other error occurs — never throws.
 *
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[storage] loadData failed for key "${key}":`, err);
    return defaultValue;
  }
}

// ---------------------------------------------------------------------------
// Typed exports — Tasks
// ---------------------------------------------------------------------------

/**
 * Return the saved tasks array, or an empty array if none are stored.
 * @returns {Array}
 */
export function getTasks() {
  return loadData(KEYS.TASKS, []);
}

/**
 * Persist the tasks array to localStorage.
 * @param {Array} tasks
 */
export function saveTasks(tasks) {
  saveData(KEYS.TASKS, tasks);
}

// ---------------------------------------------------------------------------
// Typed exports — Schedule
// ---------------------------------------------------------------------------

/**
 * Return the saved schedule object, or null if none is stored.
 * @returns {Object|null}
 */
export function getSchedule() {
  return loadData(KEYS.SCHEDULE, null);
}

/**
 * Persist the schedule object to localStorage.
 * @param {Object} schedule
 */
export function saveSchedule(schedule) {
  saveData(KEYS.SCHEDULE, schedule);
}

// ---------------------------------------------------------------------------
// Typed exports — Progress
// ---------------------------------------------------------------------------

/**
 * Return the saved progress object, or a zeroed default if none is stored.
 * @returns {{ completed: number, total: number }}
 */
export function getProgress() {
  return loadData(KEYS.PROGRESS, { completed: 0, total: 0 });
}

/**
 * Persist the progress object to localStorage.
 * @param {{ completed: number, total: number }} progress
 */
export function saveProgress(progress) {
  saveData(KEYS.PROGRESS, progress);
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Remove all three StudyMate keys from localStorage.
 * Useful for testing and hard-reset flows.
 */
export function clearAll() {
  localStorage.removeItem(KEYS.TASKS);
  localStorage.removeItem(KEYS.SCHEDULE);
  localStorage.removeItem(KEYS.PROGRESS);
}
