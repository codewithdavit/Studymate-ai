# StudyMate AI – Intelligent Student Study Assistant

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![Offline](https://img.shields.io/badge/works-offline-orange)

StudyMate AI is a fully client-side web application that helps students plan their revision, practice with subject-specific questions, and track their study progress — all without any installation, server, or internet connection. Every feature runs in the browser, and all data is stored locally using `localStorage`, so nothing ever leaves the user's device.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [Usage Guide](#usage-guide)
- [Testing](#testing)
- [Known Limitations](#known-limitations)
- [Technology Stack](#technology-stack)
- [License](#license)

---

## Features

### 1. 📊 Live Dashboard
The dashboard is the landing page of the application. It greets the user with a time-aware message (Good morning / afternoon / evening) and displays today's date. Three summary stat cards give an at-a-glance view of the user's current study state:
- **Pending Tasks** — number of uncompleted tasks in the Progress Tracker
- **Completed Tasks** — number of tasks marked done
- **Subjects in Schedule** — number of subjects in the most recently generated study schedule

Quick-access cards link directly to the three core feature views.

### 2. 🗓️ Study Planner
Allows the user to build a personalised day-by-day study schedule by entering subject and topic information, estimating required hours, and specifying a target completion date.
- Add up to any number of subject rows (＋ Add Subject button)
- Each row takes a subject name, optional topic, and hours needed
- Set daily available study hours and a target completion date
- Click **Generate Schedule** to produce a proportional per-day allocation
- View subject summary cards (total hours, daily allocation per subject)
- Expand the collapsible **Day-by-Day Schedule** table to see every day's plan
- **Clear Schedule** removes the saved plan and hides the output panel
- Schedule is persisted in `localStorage` and restored on next visit

### 3. ❓ Practice Question Generator
Generates practice questions from a curated bank of 288 questions across 6 subjects, or falls back to template-based generated questions for any free-text topic.
- Type-ahead autocomplete for the 6 built-in subjects (Mathematics, Physics, Chemistry, Biology, History, Computer Science)
- Select difficulty: **Easy**, **Medium**, or **Hard**
- Choose the number of questions: 3, 5, 8, or 10
- Click **Generate Questions** (or press Enter) to display question cards
- Each card shows the question with the answer hidden; click **👁 Reveal Answer** to expose it
- **Reveal All** button reveals every answer at once
- A source badge indicates whether questions came from the bank or were generated

### 4. 📋 Progress Tracker
A persistent task checklist that tracks study tasks with optional due dates and a visual progress bar.
- Add tasks with a Subject, Description, and optional Due Date
- Tasks are rendered as cards with a checkbox (to mark complete), a subject badge, description, and due date
- Overdue tasks (past due date, not completed) are highlighted in red
- Filter the list by **All**, **Pending**, or **Completed**
- **Clear Completed** removes all finished tasks after confirmation
- A progress bar and percentage label always reflect the full unfiltered task list
- All tasks are persisted in `localStorage` across sessions

### 5. ℹ️ About
An informational page describing the purpose of the application, its three-step workflow (Plan → Practice → Track), and a grid of the six core features. Includes a "Who Is This For?" section aimed at secondary and university students.

### 6. 🛠️ Developer / Project Info
A technical reference page for academic submission. Contains project details (name, version, type, status, licence), the full technology stack table, a three-layer architecture overview, the project folder structure, run instructions, and developer information.

### 7. 🔔 Toast Notifications
Every meaningful user action produces a non-blocking ephemeral toast notification at the bottom-right of the screen. Toasts auto-dismiss after 3 seconds and can be clicked to dismiss early. Types: success (green), info (blue), warning (amber), error (red).

### 8. 📱 Fully Responsive Layout
The layout adapts to all screen sizes. On desktop it uses multi-column card grids; at ≤ 768 px a hamburger menu replaces the inline navigation and grids collapse to two columns; at ≤ 480 px everything stacks to a single column. The navigation closes automatically when a link is tapped on mobile.

---

## Project Structure

```
studymate-ai/
├── index.html              # Single-page application shell — all views live here
├── README.md               # This file
│
├── css/
│   ├── style.css           # Design tokens, reset, layout, navigation, typography
│   ├── components.css      # Buttons, cards, badges, toasts, modals, task items, question cards
│   └── responsive.css      # Media queries for tablet (≤768px) and mobile (≤480px)
│
├── js/
│   ├── app.js              # Entry point: SPA router, mobile nav, per-view init dispatch
│   ├── dashboard.js        # Dashboard view — greeting, date, live stat cards
│   ├── planner.js          # Study planner — form, validation, schedule generation, rendering
│   ├── questions.js        # Question engine — bank lookup, template fallback, card rendering
│   ├── progress.js         # Progress tracker — task CRUD, filtering, progress bar
│   ├── storage.js          # localStorage abstraction — getTasks/saveTasks/getSchedule/saveSchedule
│   └── ui.js               # Shared UI utilities — showToast, openModal, closeModal
│
└── data/
    └── questionBank.js     # Static question bank — 288 questions, 6 subjects × 3 difficulties
```

---

## How to Run

StudyMate AI requires **no installation, no build step, and no internet connection**.

1. Download or clone the `studymate-ai/` folder to your computer.
2. **Open `index.html`** directly in any modern browser — that's it.
   - Supported browsers: **Chrome**, **Firefox**, **Edge**, **Safari**
3. All data is saved automatically in your browser's `localStorage`.
4. To clear all data, open the browser's DevTools → Application → Local Storage → clear the keys prefixed with `studymate_`.

> **Note on ES Modules and CORS:** StudyMate AI uses native ES modules (`<script type="module">`). Most browsers open local files without restriction, but some environments (particularly Chrome with strict security settings) block ES module imports from `file://` URLs. If you see a blank page or a CORS error in the console, serve the files from a local HTTP server instead:
>
> **Python (built-in, no install):**
> ```bash
> cd studymate-ai
> python -m http.server 8000
> # then open http://localhost:8000 in your browser
> ```
>
> **VS Code:** Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

---

## Usage Guide

### 1. Dashboard

When you open the app you land on the Dashboard. The header card shows a personalised greeting and today's date. The three stat cards pull live data from `localStorage`:

- **Pending Tasks** and **Completed Tasks** reflect your Progress Tracker data.
- **Subjects in Schedule** reflects the last schedule you generated in the Planner.

The three Quick Access cards at the bottom are clickable links that navigate directly to each feature.

---

### 2. Study Planner

1. **Enter subjects** — each row contains a subject name (required), a topic (optional), and hours needed (required, minimum 0.5).
2. Click **＋ Add Subject** to add more rows. The ✕ remove button appears on each row when there are two or more.
3. Set **Daily Study Hours Available** (how many hours per day you can study).
4. Set a **Target Completion Date** (must be today or in the future).
5. Click **Generate Schedule**. Validation errors are shown inline; on success, the output panel appears with:
   - Subject summary cards showing total and daily hours per subject.
   - A collapsed **▼ Show Day-by-Day Schedule** button — click it to expand the full table showing every date, subject, topic, and hours.
6. Click **Clear Schedule** (bottom of the output panel) to delete the saved schedule.

The generated schedule is saved to `localStorage` and restored automatically on your next visit.

---

### 3. Practice Questions

1. Type a subject or topic in the **Subject / Topic** field. Use the dropdown suggestions or type any topic (e.g. "Photosynthesis", "Algebra", "World War II").
2. Choose a **Difficulty**: Easy, Medium, or Hard.
3. Choose the **Number of Questions**: 3, 5, 8, or 10.
4. Click **Generate Questions** (or press **Enter**).
5. Each question card shows the question text and a difficulty badge. The answer is hidden.
6. Click **👁 Reveal Answer** on any card to reveal just that answer (click again to hide it).
7. Click **Reveal All** (top-right of the output area) to reveal every answer at once.
8. A source badge indicates whether the questions came from the curated bank or were generated from templates.

---

### 4. Progress Tracker

1. Fill in **Subject**, **Description**, and optionally a **Due Date**, then click **＋ Add Task**.
2. Tasks appear as cards in the list. Check the checkbox to mark a task complete (strikethrough styling).
3. Tasks with a past due date that are not yet complete are highlighted in red with "— overdue".
4. Use the **All / Pending / Completed** filter buttons to narrow the displayed list.
5. Click the **✕** button on a task card to delete it permanently.
6. Click **Clear Completed** to remove all completed tasks at once (a confirmation dialog appears).
7. The progress bar and percentage label above the list always reflect the full task list regardless of the active filter.

---

### 5. About / Developer

Both pages are purely informational. **About** describes the app's mission and features. **Developer** is a technical reference page suitable for academic submission — it includes the technology stack, architecture overview, project structure, and run instructions.

---

## Testing

The following manual test checklist covers all major features and edge cases.

| Area | Test | Expected result |
|---|---|---|
| **Navigation** | Click each nav link (Dashboard, Planner, Questions, Progress, About, Developer) | Correct view appears; active link is highlighted |
| **Navigation** | Resize to < 768px; tap hamburger | Mobile menu opens; tap a link — menu closes |
| **Navigation** | Navigate to each view; check browser tab title | Title updates to e.g. "Dashboard — StudyMate AI" |
| **Planner** | Submit with empty fields | Inline error list appears |
| **Planner** | Set target date to yesterday | Error: "Target completion date must be today or in the future" |
| **Planner** | Fill valid data; generate | Summary cards shown; toast "Schedule generated!" |
| **Planner** | Expand Day-by-Day Schedule | Table fills with correct rows |
| **Planner** | Clear Schedule | Output panel hides; toast "Schedule cleared." |
| **Planner** | Refresh page; go to Planner | Saved schedule is restored |
| **Questions** | Click Generate with no subject | Error message shown; focus moves to input |
| **Questions** | Type "math"; generate | Questions from bank; source badge shows "From Question Bank" |
| **Questions** | Type "Astrophysics"; generate | Template questions; source badge shows "Generated Questions" |
| **Questions** | Click Reveal Answer | Answer appears; button text changes to "Hide Answer" |
| **Questions** | Click Reveal All | All answers revealed; toast "All answers revealed" |
| **Progress** | Submit with empty fields | Toast warning "Please fill in Subject and Description" |
| **Progress** | Add a valid task | Task card appears; toast "Task added" |
| **Progress** | Check a task | Task fades; toast "Task marked complete ✓" |
| **Progress** | Uncheck a task | Task restored; toast "Task marked pending" |
| **Progress** | Delete a task | Card removed; toast "Task removed" |
| **Progress** | Clear Completed with none done | Toast "No completed tasks to clear" |
| **Progress** | Clear Completed with done tasks | Confirmation dialog; on confirm, done tasks removed; toast |
| **Progress** | Filter by Pending / Completed | Only matching tasks shown; empty state if none match |
| **Dashboard** | Add tasks in Progress, return to Dashboard | Stat cards update immediately |
| **Responsive** | Resize to 480px | All grids single-column; nav hamburger visible |
| **Accessibility** | Tab through Planner form | All fields and buttons reachable by keyboard |
| **Accessibility** | Inspect hamburger button | Has `aria-label` and `aria-expanded` attributes |

---

## Known Limitations

- **No real AI** — the question engine uses a static bank of 288 curated questions and template-based fallbacks. It does not call any external AI service.
- **localStorage only** — data is stored in the browser's localStorage (typically 5–10 MB per origin). There is no server-side persistence.
- **No multi-device sync** — tasks and schedules are specific to the browser and device where they were created.
- **ES module CORS restriction** — on some browsers with strict `file://` security settings, the app may fail to load. Use a local HTTP server as described in [How to Run](#how-to-run).
- **No calendar export** — the generated schedule cannot be exported to iCal, Google Calendar, or any external format.
- **No recurring tasks** — the Progress Tracker supports one-off tasks only; there is no repeat/recurrence feature.

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| HTML5 | 5 | Page structure, semantic markup, single-page application shell |
| CSS3 | 3 | Styling, CSS custom properties (design tokens), responsive layout |
| JavaScript (ES6+) | ES2020+ | Application logic, DOM manipulation, SPA routing, data persistence |
| Web Storage API | Browser built-in | `localStorage` for persisting tasks and schedule across sessions |
| Crypto API | Browser built-in | `crypto.randomUUID()` for generating unique task IDs |

---

## License

MIT License

Copyright (c) 2025 Student Developer

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
