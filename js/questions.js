/**
 * questions.js — Practice question engine
 * StudyMate AI – Intelligent Student Study Assistant
 */

import { QUESTION_BANK } from '../data/questionBank.js';
import { showToast } from './ui.js';

/* ------------------------------------------------------------------ */
/* Initialisation guard                                                 */
/* ------------------------------------------------------------------ */

let _initialized = false;

/* ------------------------------------------------------------------ */
/* normalizeSubject                                                     */
/* Finds a matching key in QUESTION_BANK from free-text input.         */
/* ------------------------------------------------------------------ */

function normalizeSubject(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const keys = Object.keys(QUESTION_BANK);
  const lc = trimmed.toLowerCase();

  // 1. Exact match (case-insensitive)
  const exact = keys.find(k => k.toLowerCase() === lc);
  if (exact) return exact;

  // 2. Partial match: input is a substring of a bank key
  //    e.g. "math" matches "Mathematics", "bio" matches "Biology"
  const partial = keys.find(k => k.toLowerCase().includes(lc));
  if (partial) return partial;

  // 3. A bank key word appears in the input (whole-word only)
  //    e.g. "Advanced Mathematics" → "Mathematics"
  //    Avoids "Astrophysics" matching "Physics"
  const reverse = keys.find(k => {
    const words = k.toLowerCase().split(/\s+/);
    return words.every(word => lc.split(/\s+/).includes(word));
  });
  if (reverse) return reverse;

  return null;
}

/* ------------------------------------------------------------------ */
/* shuffle — Fisher-Yates, returns new array                           */
/* ------------------------------------------------------------------ */

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ------------------------------------------------------------------ */
/* buildTemplateQuestions                                               */
/* ------------------------------------------------------------------ */

function buildTemplateQuestions(subject, difficulty, count) {
  const templates = {
    easy: [
      `What is the definition of ${subject}?`,
      `Name two key concepts in ${subject}.`,
      `Give an example of ${subject} in everyday life.`,
      `What tools or methods are used in ${subject}?`,
      `Why is ${subject} important?`,
      `Describe a basic principle of ${subject}.`,
      `What are the main components studied in ${subject}?`,
      `How would you introduce ${subject} to a complete beginner?`,
    ],
    medium: [
      `Explain a core principle of ${subject} in your own words.`,
      `Compare two different approaches used in ${subject}.`,
      `Describe a problem that ${subject} helps solve.`,
      `What are the main challenges in ${subject}?`,
      `How is ${subject} applied in a real-world scenario?`,
      `What assumptions are commonly made in ${subject}?`,
      `Explain the relationship between two key ideas in ${subject}.`,
      `Give a worked example that demonstrates a core concept in ${subject}.`,
    ],
    hard: [
      `Critically evaluate the limitations of current methods in ${subject}.`,
      `Design a solution to an advanced problem in ${subject}.`,
      `Synthesise knowledge from ${subject} to address a novel scenario.`,
      `Analyse the relationship between ${subject} and a related field.`,
      `Evaluate the historical development of ${subject} and its future direction.`,
      `What unresolved questions remain at the frontier of ${subject}?`,
      `How do ethical considerations apply to advanced work in ${subject}?`,
      `Construct an argument for or against a controversial position within ${subject}.`,
    ],
  };

  const pool = templates[difficulty] || templates.medium;
  const answer = `Think about this carefully — this question is designed to test your deeper understanding of ${subject}.`;

  return pool.slice(0, count).map(q => ({ q, a: answer, source: 'template' }));
}

/* ------------------------------------------------------------------ */
/* getQuestions                                                         */
/* ------------------------------------------------------------------ */

function getQuestions(subject, difficulty, count) {
  const key = normalizeSubject(subject);
  const tier = QUESTION_BANK[key]?.[difficulty];

  if (key && tier && tier.length > 0) {
    return shuffle(tier).slice(0, count).map(q => ({ ...q, source: 'bank' }));
  }

  return buildTemplateQuestions(subject, difficulty, count);
}

/* ------------------------------------------------------------------ */
/* buildQuestionCard                                                    */
/* ------------------------------------------------------------------ */

function buildQuestionCard(q, index, difficulty) {
  const card = document.createElement('div');
  card.className = 'card question-card';

  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  card.innerHTML = `
    <div class="q-number">Question ${index + 1}</div>
    <div class="q-text">${escapeHtml(q.q)}</div>
    <span class="badge badge-${difficulty}" style="margin-bottom:0.5rem;">${diffLabel}</span>
    <div class="q-answer-wrap">
      <button class="btn btn-outline btn-sm reveal-btn" type="button" aria-label="Reveal answer for question ${index + 1}">👁 Reveal Answer</button>
      <div class="q-answer">${escapeHtml(q.a)}</div>
    </div>
  `;

  const revealBtn = card.querySelector('.reveal-btn');
  const answerDiv = card.querySelector('.q-answer');

  revealBtn.addEventListener('click', () => {
    const isRevealed = answerDiv.classList.toggle('revealed');
    revealBtn.textContent = isRevealed ? 'Hide Answer' : '👁 Reveal Answer';
    revealBtn.setAttribute('aria-label', isRevealed
      ? `Hide answer for question ${index + 1}`
      : `Reveal answer for question ${index + 1}`);
  });

  return card;
}

/* ------------------------------------------------------------------ */
/* renderQuestions                                                      */
/* ------------------------------------------------------------------ */

function renderQuestions(questions, subject, difficulty) {
  const output = document.getElementById('q-output');
  const title = document.getElementById('q-output-title');
  const badge = document.getElementById('q-source-badge');
  const container = document.getElementById('q-cards-container');
  const revealAllBtn = document.getElementById('q-reveal-all-btn');

  if (!questions || questions.length === 0) {
    if (container) {
      container.innerHTML = '';
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<div class="empty-state-icon">❓</div><p>No questions could be generated for that topic. Try a different subject or topic.</p>';
      container.appendChild(empty);
      if (output) output.style.display = 'block';
    }
    return;
  }

  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  title.textContent = `${subject} — ${diffLabel} (${questions.length} question${questions.length !== 1 ? 's' : ''})`;

  const hasBank = questions.some(q => q.source === 'bank');
  const hasTemplate = questions.some(q => q.source === 'template');

  if (hasBank && hasTemplate) {
    badge.textContent = 'From Question Bank + Generated';
  } else if (hasBank) {
    badge.textContent = 'From Question Bank';
  } else {
    badge.textContent = 'Generated Questions';
  }
  badge.className = 'badge badge-info';

  container.innerHTML = '';
  questions.forEach((q, i) => {
    container.appendChild(buildQuestionCard(q, i, difficulty));
  });

  output.style.display = 'block';
  revealAllBtn.style.display = 'inline-flex';
}

/* ------------------------------------------------------------------ */
/* escapeHtml helper                                                    */
/* ------------------------------------------------------------------ */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ------------------------------------------------------------------ */
/* initQuestions — public entry point called by the router             */
/* ------------------------------------------------------------------ */

export function initQuestions() {
  if (_initialized) return;
  _initialized = true;

  const generateBtn = document.getElementById('q-generate-btn');
  const revealAllBtn = document.getElementById('q-reveal-all-btn');
  const subjectInput = document.getElementById('q-subject');
  const errorEl = document.getElementById('q-error');

  function generate() {
    const subject = subjectInput?.value?.trim() ?? '';
    const difficulty = document.getElementById('q-difficulty')?.value ?? 'medium';
    const count = parseInt(document.getElementById('q-count')?.value ?? '5', 10);

    // Validate
    if (!subject) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a subject or topic.';
        errorEl.style.display = 'block';
      }
      subjectInput?.focus();
      return;
    }

    if (errorEl) errorEl.style.display = 'none';

    const questions = getQuestions(subject, difficulty, count);
    renderQuestions(questions, subject, difficulty);

    const source = questions[0]?.source === 'bank' ? 'bank questions' : 'generated questions';
    showToast(`${questions.length} ${source} ready — good luck!`, 'success');
  }

  generateBtn?.addEventListener('click', generate);

  subjectInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generate();
  });

  revealAllBtn?.addEventListener('click', () => {
    document.querySelectorAll('#q-cards-container .q-answer').forEach(el => {
      el.classList.add('revealed');
    });
    document.querySelectorAll('#q-cards-container .reveal-btn').forEach(btn => {
      btn.textContent = 'Hide Answer';
    });
    showToast('All answers revealed', 'info');
  });
}
