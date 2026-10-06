/**
 * ui.js — Shared UI utilities
 * StudyMate AI – Intelligent Student Study Assistant
 *
 * Exports:
 *  - showToast(message, type)  — ephemeral notification strip
 *  - openModal(title, body)    — generic modal overlay
 *  - closeModal()              — dismiss modal overlay
 */

/* ------------------------------------------------------------------ */
/* Toast Notifications                                                 */
/* ------------------------------------------------------------------ */

/**
 * Display a toast notification that auto-dismisses after 3 seconds.
 *
 * @param {string} message - Text to display inside the toast.
 * @param {'info'|'success'|'error'|'warning'} [type='info'] - Visual style.
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');

  container.appendChild(toast);

  // Begin fade-out slightly before removal so the animation is visible
  const DISPLAY_MS   = 3000;
  const FADE_OUT_MS  = 300;

  const fadeTimer = setTimeout(() => {
    toast.classList.add('toast-fade-out');
  }, DISPLAY_MS - FADE_OUT_MS);

  const removeTimer = setTimeout(() => {
    toast.remove();
  }, DISPLAY_MS);

  // Allow early dismissal on click
  toast.addEventListener('click', () => {
    clearTimeout(fadeTimer);
    clearTimeout(removeTimer);
    toast.remove();
  });
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

/**
 * Open the shared modal overlay with the given title and body HTML.
 *
 * @param {string} title    - Modal heading text.
 * @param {string} bodyHTML - Inner HTML for the modal body area.
 */
export function openModal(title, bodyHTML) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');
  if (!overlay || !box) return;

  box.innerHTML = `
    <h2 class="modal-title" id="modal-title">${escapeHtml(title)}</h2>
    <div class="modal-body">${bodyHTML}</div>
  `;

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  // Focus first focusable element inside modal for accessibility
  const focusable = box.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable) focusable.focus();
}

/**
 * Close (hide) the shared modal overlay.
 */
export function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

/* ------------------------------------------------------------------ */
/* Modal event listeners (initialised once)                            */
/* ------------------------------------------------------------------ */

// Close when clicking the dark backdrop (outside modal-box)
document.addEventListener('click', (e) => {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay || overlay.classList.contains('hidden')) return;
  if (e.target === overlay) closeModal();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ------------------------------------------------------------------ */
/* Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Escape a string for safe insertion as HTML text content.
 * Prevents XSS when modal titles come from user input.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}
