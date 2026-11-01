/* =====================================================================
   DueWise – script.js
   Vanilla JavaScript. No frameworks, no backend, no API keys.

   How this file is organised:
     1.  Constants
     2.  Icons (inline SVG, so the app works offline)
     3.  Small helpers (dates, text safety, storage)
     4.  App state
     5.  Loading + saving assignments (LocalStorage)
     6.  Filtering, sorting and statistics
     7.  Rendering (sidebar, dashboard, list, calendar, notifications)
     8.  Modals, confirm dialog and toast notifications
     9.  Actions (add, edit, delete, complete, sample data, export)
     10. Theme and profile
     11. Navigation and event wiring
     12. Start-up
   ===================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. CONSTANTS
  ------------------------------------------------------------------ */
  const STORAGE_KEYS = {
    assignments: 'duewise.assignments',
    theme: 'duewise.theme',
    profile: 'duewise.profile'
  };

  const PRIORITIES = ['low', 'medium', 'high'];
  const PRIORITY_WEIGHT = { low: 1, medium: 2, high: 3 };
  const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

  // Views that show the assignment list (All / Pending / Completed share one panel)
  const LIST_VIEWS = ['all', 'pending', 'completed'];

  const VIEW_META = {
    dashboard: { title: 'Dashboard', panel: 'view-dashboard' },
    all: { title: 'All Assignments', panel: 'view-list', subtitle: 'Every assignment in one place. Search, filter and sort to find what you need.' },
    pending: { title: 'Pending Assignments', panel: 'view-list', subtitle: 'Work that still needs your attention, including anything overdue.' },
    completed: { title: 'Completed Assignments', panel: 'view-list', subtitle: 'Finished work. Move anything back to pending if you need to revisit it.' },
    calendar: { title: 'Calendar', panel: 'view-calendar' },
    settings: { title: 'Settings', panel: 'view-settings' }
  };

  const SAMPLE_SUBJECTS = [
    'Web Technology',
    'Database Management System',
    'C Programming',
    'Mathematics',
    'Computer Fundamentals'
  ];

  const MOTIVATION = [
    'A calm Sunday plan makes a confident week. Pick one task and begin.',
    'Small, steady steps beat last-minute sprints.',
    'Progress, not perfection. Finish one thing, then the next.',
    'A deadline is a promise to your future self. Keep it.',
    'Focus on the next 25 minutes, not the whole semester.',
    'Done is better than perfect. Submit, learn, improve.',
    'You do not have to do everything today, just the right thing.'
  ];

  /* ------------------------------------------------------------------
     2. ICONS (Lucide-style inline SVG paths, no CDN needed)
  ------------------------------------------------------------------ */
  const ICON_PATHS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    chevL: '<polyline points="15 18 9 12 15 6"/>',
    chevR: '<polyline points="9 18 15 12 9 6"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17v4M17 19h4"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    undo: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'
  };

  /** Returns an inline SVG string for the named icon. */
  function icon(name, size) {
    const px = size || 18;
    const paths = ICON_PATHS[name] || ICON_PATHS.book;
    return '<svg class="icon" width="' + px + '" height="' + px + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + '</svg>';
  }

  /** Fills every <i data-icon="..."> in the page with its SVG. */
  function hydrateIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      el.innerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 18);
    });
  }

  /* ------------------------------------------------------------------
     3. HELPERS
  ------------------------------------------------------------------ */
  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  /** Escapes user text so it can never be interpreted as HTML (prevents XSS). */
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* ----- Dates -----
     Due dates are stored as plain "YYYY-MM-DD" text and always compared as
     LOCAL calendar days, so time zones can never shift a deadline. */
  function pad(n) { return String(n).padStart(2, '0'); }

  function toISODate(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function todayISO() { return toISODate(new Date()); }

  function isValidISODate(text) {
    if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const parts = text.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getFullYear() === parts[0] && d.getMonth() === parts[1] - 1 && d.getDate() === parts[2];
  }

  function parseISODate(text) {
    const parts = text.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  /** Whole days from `base` (default today) to `iso`. Negative = in the past. */
  function dayDiff(iso, base) {
    const a = parseISODate(iso);
    const b = parseISODate(base || todayISO());
    const msA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const msB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((msA - msB) / 86400000);
  }

  function addDays(iso, amount) {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + amount);
    return toISODate(d);
  }

  function formatDate(iso) {
    return parseISODate(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatShortDate(iso) {
    return parseISODate(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function formatLongDate(iso) {
    return parseISODate(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ----- Safe LocalStorage access (can fail in private mode or when full) ----- */
  let storageWarningShown = false;
  const storage = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    }
  };

  /* ------------------------------------------------------------------
     4. APP STATE
  ------------------------------------------------------------------ */
  const state = {
    assignments: [],
    view: 'dashboard',
    filters: { search: '', subject: 'all', priority: 'all', status: 'all', quick: 'all' },
    sortBy: 'due',
    calendar: { year: new Date().getFullYear(), month: new Date().getMonth(), selected: todayISO() },
    editingId: null,
    profileName: 'Student'
  };

  // Element lookup table, filled once the page is ready
  const els = {};
  const ELEMENT_IDS = [
    'greetingText', 'todayDate', 'searchInput', 'notifBtn', 'notifBadge', 'notifPanel', 'notifList',
    'themeToggle', 'profileBtn', 'profileInitials', 'profileMenu', 'profileMenuInitials', 'profileMenuName',
    'navAllCount', 'navPendingCount', 'navCompletedCount', 'sidebarPercent', 'sidebarProgressFill', 'sidebarProgressText',
    'welcomeTitle', 'welcomeSub', 'heroSampleBtn',
    'statTotal', 'statTotalNote', 'statPending', 'statPendingNote', 'statCompleted', 'statCompletedNote',
    'statOverdue', 'statOverdueNote', 'statCardOverdue',
    'progressPercent', 'progressText', 'progressBar', 'progressFill',
    'upcomingBody', 'ringChart', 'ringPercent', 'insightWorkload', 'insightHigh', 'insightCompleted', 'insightOverdue',
    'priorityBars', 'weekChart',
    'listTitle', 'listSubtitle', 'listToolbar', 'filterSubject', 'filterPriority', 'filterStatus', 'statusFilterWrap',
    'sortBy', 'clearFiltersBtn', 'resultCount', 'assignmentList',
    'calTitle', 'calGrid', 'dayTitle', 'daySub', 'dayList', 'dayAddBtn',
    'profileForm', 'profileName', 'errProfile', 'demoInfo',
    'assignmentModal', 'modalTitle', 'modalSubtitle', 'assignmentForm', 'fieldTitle', 'fieldSubject', 'fieldDue',
    'fieldDescription', 'descCount', 'errTitle', 'errSubject', 'errDue', 'subjectOptions', 'saveBtn',
    'confirmModal', 'confirmIcon', 'confirmTitle', 'confirmMessage', 'confirmCancel', 'confirmOk',
    'toastStack', 'main'
  ];

  /* ------------------------------------------------------------------
     5. LOADING + SAVING ASSIGNMENTS
  ------------------------------------------------------------------ */

  /** Checks one stored object and returns a clean assignment, or null if it is unusable. */
  function sanitizeAssignment(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = String(raw.title == null ? '' : raw.title).trim().slice(0, 100);
    const subject = String(raw.subject == null ? '' : raw.subject).trim().slice(0, 60);
    if (!title || !subject || !isValidISODate(raw.dueDate)) return null;
    const completed = raw.completed === true;
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
      title: title,
      subject: subject,
      dueDate: raw.dueDate,
      priority: PRIORITIES.indexOf(raw.priority) !== -1 ? raw.priority : 'medium',
      description: String(raw.description == null ? '' : raw.description).trim().slice(0, 500),
      completed: completed,
      completedAt: completed && Number.isFinite(raw.completedAt) ? raw.completedAt : null,
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
      isDemo: raw.isDemo === true
    };
  }

  /** Reads assignments from LocalStorage. Corrupt or missing data results in an empty list, never a crash. */
  function loadAssignments() {
    const stored = storage.get(STORAGE_KEYS.assignments);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error('Stored data is not a list');
      const seen = {};
      const clean = [];
      parsed.forEach(function (item) {
        const a = sanitizeAssignment(item);
        if (a && !seen[a.id]) { seen[a.id] = true; clean.push(a); }
      });
      return clean;
    } catch (error) {
      // Keep a copy of the unreadable data so nothing is silently destroyed, then start fresh.
      storage.set(STORAGE_KEYS.assignments + '.corrupt', stored);
      return [];
    }
  }

  /** Writes the current assignments to LocalStorage. Called after EVERY change. */
  function saveAssignments() {
    const ok = storage.set(STORAGE_KEYS.assignments, JSON.stringify(state.assignments));
    if (!ok && !storageWarningShown) {
      storageWarningShown = true;
      showToast('Your browser blocked saving. Changes will be lost when you close this tab.', 'error', 6000);
    }
    return ok;
  }

  function findAssignment(id) {
    return state.assignments.find(function (a) { return a.id === id; }) || null;
  }

  /* ------------------------------------------------------------------
     6. STATUS, FILTERING, SORTING, STATISTICS
  ------------------------------------------------------------------ */

  /** An assignment is overdue ONLY if it is not completed and its due date is before today. */
  function isOverdue(a) {
    return !a.completed && dayDiff(a.dueDate) < 0;
  }

  function getStatus(a) {
    if (a.completed) return 'completed';
    return isOverdue(a) ? 'overdue' : 'pending';
  }

  function dueLabel(a) {
    if (a.completed) return 'Completed';
    const d = dayDiff(a.dueDate);
    if (d < 0) return plural(-d, 'day') + ' overdue';
    if (d === 0) return 'Due today';
    if (d === 1) return 'Due tomorrow';
    return 'Due in ' + plural(d, 'day');
  }

  function computeStats() {
    const list = state.assignments;
    const total = list.length;
    const completed = list.filter(function (a) { return a.completed; }).length;
    const pending = total - completed; // pending includes overdue items
    const overdue = list.filter(isOverdue).length;
    const highPending = list.filter(function (a) { return !a.completed && a.priority === 'high'; }).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const subjects = {};
    list.forEach(function (a) { subjects[a.subject.toLowerCase()] = true; });
    return { total: total, completed: completed, pending: pending, overdue: overdue, highPending: highPending, percent: percent, subjectCount: Object.keys(subjects).length };
  }

  /** Does the assignment belong to the current list view (All / Pending / Completed)? */
  function inViewScope(a) {
    if (state.view === 'pending') return !a.completed;
    if (state.view === 'completed') return a.completed;
    return true;
  }

  /** Applies search + subject + priority + status + quick filter (all combine together). */
  function matchesFilters(a) {
    const f = state.filters;
    const query = f.search.trim().toLowerCase();
    if (query && a.title.toLowerCase().indexOf(query) === -1) return false;
    if (f.subject !== 'all' && a.subject.toLowerCase() !== f.subject.toLowerCase()) return false;
    if (f.priority !== 'all' && a.priority !== f.priority) return false;

    // The status dropdown only exists on the "All Assignments" view
    if (state.view === 'all' && f.status !== 'all') {
      const status = getStatus(a);
      if (f.status === 'pending' && a.completed) return false;
      if (f.status === 'completed' && !a.completed) return false;
      if (f.status === 'overdue' && status !== 'overdue') return false;
    }

    if (f.quick !== 'all') {
      const d = dayDiff(a.dueDate);
      if (f.quick === 'today' && d !== 0) return false;
      if (f.quick === 'week' && (d < 0 || d > 6)) return false;
      if (f.quick === 'overdue' && !isOverdue(a)) return false;
    }
    return true;
  }

  function byDueThenPriority(a, b) {
    return a.dueDate.localeCompare(b.dueDate) || PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || a.createdAt - b.createdAt;
  }

  const COMPARATORS = {
    due: function (a, b) { return (Number(a.completed) - Number(b.completed)) || byDueThenPriority(a, b); },
    priority: function (a, b) { return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || byDueThenPriority(a, b); },
    newest: function (a, b) { return b.createdAt - a.createdAt; },
    title: function (a, b) { return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }); }
  };

  function getFilteredAssignments() {
    return state.assignments.filter(function (a) { return inViewScope(a) && matchesFilters(a); }).sort(COMPARATORS[state.sortBy] || COMPARATORS.due);
  }

  function activeFilterCount() {
    const f = state.filters;
    let n = 0;
    if (f.search.trim()) n++;
    if (f.subject !== 'all') n++;
    if (f.priority !== 'all') n++;
    if (f.status !== 'all' && state.view === 'all') n++;
    if (f.quick !== 'all') n++;
    return n;
  }

  function resetFilters() {
    state.filters = { search: '', subject: 'all', priority: 'all', status: 'all', quick: 'all' };
    els.searchInput.value = '';
    els.filterPriority.value = 'all';
    els.filterStatus.value = 'all';
  }

  function getUniqueSubjects() {
    const seen = {};
    const result = [];
    state.assignments.forEach(function (a) {
      const key = a.subject.toLowerCase();
      if (!seen[key]) { seen[key] = true; result.push(a.subject); }
    });
    return result.sort(function (x, y) { return x.localeCompare(y, undefined, { sensitivity: 'base' }); });
  }

  /* ------------------------------------------------------------------
     7. RENDERING
  ------------------------------------------------------------------ */

  /** Remembers which button had keyboard focus so we can restore it after re-rendering. */
  function captureFocus() {
    const el = document.activeElement;
    if (el && el.dataset && el.dataset.action && el.dataset.id) {
      return '[data-action="' + el.dataset.action + '"][data-id="' + el.dataset.id + '"]';
    }
    return null;
  }

  function restoreFocus(selector) {
    if (!selector) return;
    const match = $$(selector).filter(function (el) { return !el.closest('[hidden]'); })[0];
    if (match) match.focus({ preventScroll: true });
  }

  /** Re-draws everything that depends on the data. Cheap enough to call after any change. */
  function renderAll() {
    const focusSelector = captureFocus();
    renderChrome();
    renderSubjectOptions();
    renderDashboard();
    renderList();
    renderCalendar();
    renderNotifications();
    renderSettings();
    restoreFocus(focusSelector);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function getInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'S';
    const first = Array.from(parts[0])[0];
    const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
    return (first + last).toUpperCase();
  }

  /** Top bar, sidebar counters and profile bits. */
  function renderChrome() {
    const stats = computeStats();
    els.greetingText.textContent = getGreeting() + ', ' + state.profileName;
    els.todayDate.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const initials = getInitials(state.profileName);
    els.profileInitials.textContent = initials;
    els.profileMenuInitials.textContent = initials;
    els.profileMenuName.textContent = state.profileName;

    els.navAllCount.textContent = stats.total;
    els.navPendingCount.textContent = stats.pending;
    els.navCompletedCount.textContent = stats.completed;

    els.sidebarPercent.textContent = stats.percent + '%';
    els.sidebarProgressFill.style.width = stats.percent + '%';
    els.sidebarProgressText.textContent = stats.total
      ? stats.completed + ' of ' + plural(stats.total, 'assignment') + ' completed'
      : 'Add an assignment to begin.';
  }

  /** Updates a number and plays a small "pop" animation only when it actually changes. */
  function setStat(el, value) {
    const text = String(value);
    if (el.textContent !== text) {
      el.textContent = text;
      el.classList.remove('pop');
      void el.offsetWidth; // restart the CSS animation
      el.classList.add('pop');
    }
  }

  function renderDashboard() {
    const stats = computeStats();

    els.welcomeTitle.textContent = 'Welcome back, ' + state.profileName + '!';
    els.welcomeSub.textContent = MOTIVATION[new Date().getDay()];
    els.heroSampleBtn.hidden = stats.total > 0;

    setStat(els.statTotal, stats.total);
    setStat(els.statPending, stats.pending);
    setStat(els.statCompleted, stats.completed);
    setStat(els.statOverdue, stats.overdue);

    els.statTotalNote.textContent = stats.total ? 'Across ' + plural(stats.subjectCount, 'subject') : 'Nothing added yet';
    els.statPendingNote.textContent = stats.pending ? (stats.overdue ? 'Includes ' + stats.overdue + ' overdue' : 'All on schedule') : 'Nothing waiting';
    els.statCompletedNote.textContent = stats.total ? stats.percent + '% of your work' : 'Finish one to start';
    els.statOverdueNote.textContent = stats.overdue ? 'Needs attention now' : 'You are on track';
    els.statCardOverdue.classList.toggle('has-overdue', stats.overdue > 0);

    // Completion progress bar
    els.progressPercent.textContent = stats.percent + '%';
    els.progressFill.style.width = stats.percent + '%';
    els.progressBar.setAttribute('aria-valuenow', String(stats.percent));
    els.progressText.textContent = stats.total
      ? stats.completed + ' of ' + plural(stats.total, 'assignment') + ' completed'
      : 'No assignments yet. Add one to start tracking.';

    renderUpcoming(stats);
    renderInsights(stats);
  }

  /** Groups unfinished assignments into: due today, due tomorrow, and the following days up to 7 days out. */
  function getUpcoming() {
    const result = { today: [], tomorrow: [], week: [] };
    state.assignments.forEach(function (a) {
      if (a.completed) return;
      const d = dayDiff(a.dueDate);
      if (d === 0) result.today.push(a);
      else if (d === 1) result.tomorrow.push(a);
      else if (d >= 2 && d <= 7) result.week.push(a);
    });
    result.today.sort(byDueThenPriority);
    result.tomorrow.sort(byDueThenPriority);
    result.week.sort(byDueThenPriority);
    return result;
  }

  function upcomingItemHTML(a) {
    const when = formatShortDate(a.dueDate);
    return '<li class="upcoming-item priority-' + a.priority + '">' +
      '<button type="button" class="check-btn" data-action="toggle" data-id="' + a.id + '" ' +
      'aria-label="Mark ' + escapeHtml(a.title) + ' as completed" title="Mark as completed">' + icon('check', 16) + '</button>' +
      '<div class="upcoming-body"><p class="upcoming-title">' + escapeHtml(a.title) + '</p>' +
      '<p class="upcoming-meta">' + escapeHtml(a.subject) + ' &middot; ' + when + '</p></div>' +
      '<span class="badge badge-' + a.priority + '">' + PRIORITY_LABEL[a.priority] + '</span></li>';
  }

  function renderUpcoming(stats) {
    const groups = getUpcoming();
    let html = '';

    if (stats.overdue > 0) {
      html += '<button type="button" class="alert-strip" data-goto="overdue">' + icon('alert', 18) +
        '<span><strong>' + plural(stats.overdue, 'assignment') + ' overdue.</strong> Review and finish these first.</span>' +
        icon('chevR', 16) + '</button>';
    }

    const sections = [
      { label: 'Due today', list: groups.today },
      { label: 'Due tomorrow', list: groups.tomorrow },
      { label: 'Next 7 days', list: groups.week }
    ];
    const hasAny = sections.some(function (s) { return s.list.length > 0; });

    if (!hasAny) {
      if (stats.total === 0) {
        html += '<div class="mini-empty"><span class="empty-icon">' + icon('calendar', 26) + '</span>' +
          '<p>Your deadlines will appear here once you add an assignment.</p>' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="add">' + icon('plus', 16) + 'Add Assignment</button></div>';
      } else {
        html += '<div class="mini-empty"><span class="empty-icon">' + icon('checkCircle', 26) + '</span>' +
          '<p>Nothing is due in the next 7 days. Enjoy the breathing room.</p></div>';
      }
    } else {
      sections.forEach(function (s) {
        if (!s.list.length) return;
        html += '<div class="upcoming-group"><h3 class="group-title">' + s.label + '<span class="count-pill">' + s.list.length + '</span></h3>' +
          '<ul class="upcoming-list">' + s.list.map(upcomingItemHTML).join('') + '</ul></div>';
      });
    }
    els.upcomingBody.innerHTML = html;
  }

  function renderInsights(stats) {
    els.ringChart.style.setProperty('--pct', String(stats.percent));
    els.ringChart.setAttribute('aria-label', stats.percent + ' percent complete');
    els.ringPercent.textContent = stats.percent + '%';
    els.insightWorkload.textContent = stats.pending;
    els.insightHigh.textContent = stats.highPending;
    els.insightCompleted.textContent = stats.completed;
    els.insightOverdue.textContent = stats.overdue;

    // Pending assignments grouped by priority
    const pendingList = state.assignments.filter(function (a) { return !a.completed; });
    const counts = { high: 0, medium: 0, low: 0 };
    pendingList.forEach(function (a) { counts[a.priority]++; });
    const maxCount = Math.max(1, counts.high, counts.medium, counts.low);
    els.priorityBars.innerHTML = ['high', 'medium', 'low'].map(function (p) {
      const width = Math.round((counts[p] / maxCount) * 100);
      return '<div class="bar-row"><span>' + PRIORITY_LABEL[p] + '</span>' +
        '<div class="bar-track"><div class="bar-fill ' + p + '" style="width:' + width + '%"></div></div>' +
        '<span class="bar-value">' + counts[p] + '</span></div>';
    }).join('');

    // Pending assignments due on each of the next 7 days
    const today = todayISO();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDays(today, i);
      const count = pendingList.filter(function (a) { return a.dueDate === iso; }).length;
      days.push({ iso: iso, count: count });
    }
    const maxDay = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.count; })));
    els.weekChart.innerHTML = days.map(function (d, i) {
      const height = d.count ? Math.max(14, Math.round((d.count / maxDay) * 100)) : 0;
      const label = i === 0 ? 'Today' : parseISODate(d.iso).toLocaleDateString('en-IN', { weekday: 'short' });
      return '<div class="week-col' + (i === 0 ? ' is-today' : '') + '" title="' + plural(d.count, 'assignment') + ' due ' + formatShortDate(d.iso) + '">' +
        '<span class="week-count">' + d.count + '</span>' +
        '<div class="week-bar-wrap"><div class="week-bar' + (d.count ? ' has-items' : '') + '" style="height:' + (d.count ? height + '%' : '6px') + '"></div></div>' +
        '<span class="week-label">' + label + '</span></div>';
    }).join('');
  }

  /* ----- Assignment list view ----- */

  function assignmentCardHTML(a) {
    const status = getStatus(a);
    const safeTitle = escapeHtml(a.title);

    let statusBadge;
    if (status === 'completed') statusBadge = '<span class="badge badge-completed">' + icon('checkCircle', 13) + 'Completed</span>';
    else if (status === 'overdue') statusBadge = '<span class="badge badge-overdue">' + icon('alert', 13) + 'Overdue</span>';
    else statusBadge = '<span class="badge badge-pending">' + icon('clock', 13) + 'Pending</span>';

    const priorityBadge = '<span class="badge badge-' + a.priority + '">' + icon('flag', 13) + PRIORITY_LABEL[a.priority] + ' priority</span>';

    const toggleButton = a.completed
      ? '<button type="button" class="btn btn-sm btn-soft" data-action="toggle" data-id="' + a.id + '" title="Move back to pending">' + icon('undo', 16) + 'Mark pending</button>'
      : '<button type="button" class="btn btn-sm btn-success" data-action="toggle" data-id="' + a.id + '" title="Mark as completed">' + icon('check', 16) + 'Mark complete</button>';

    return '<article class="assignment-card priority-' + a.priority + ' is-' + status + '">' +
      '<div class="card-badges">' + statusBadge + priorityBadge + '</div>' +
      '<h3 class="card-title">' + safeTitle + '</h3>' +
      '<p class="card-subject">' + icon('book', 15) + escapeHtml(a.subject) + '</p>' +
      (a.description ? '<p class="card-desc">' + escapeHtml(a.description) + '</p>' : '') +
      '<div class="card-meta"><span class="due ' + status + '">' + icon('calendar', 15) + formatDate(a.dueDate) + '</span>' +
      '<span class="due-rel ' + status + '">' + dueLabel(a) + '</span></div>' +
      '<div class="card-actions">' + toggleButton +
      '<button type="button" class="icon-btn" data-action="edit" data-id="' + a.id + '" aria-label="Edit ' + safeTitle + '" title="Edit">' + icon('edit', 18) + '</button>' +
      '<button type="button" class="icon-btn danger" data-action="delete" data-id="' + a.id + '" aria-label="Delete ' + safeTitle + '" title="Delete">' + icon('trash', 18) + '</button>' +
      '</div></article>';
  }

  function emptyStateHTML(iconName, heading, message, buttons) {
    return '<div class="empty-state"><span class="empty-icon">' + icon(iconName, 38) + '</span>' +
      '<h3>' + heading + '</h3><p>' + message + '</p>' +
      (buttons ? '<div class="empty-actions">' + buttons + '</div>' : '') + '</div>';
  }

  const ADD_BUTTON = '<button type="button" class="btn btn-primary" data-action="add">' + icon('plus', 18) + 'Add Assignment</button>';

  function listEmptyHTML() {
    if (state.assignments.length === 0) {
      return emptyStateHTML('inbox', 'No assignments yet',
        'Add your first assignment to start tracking deadlines, or load some sample data to explore DueWise.',
        ADD_BUTTON + '<button type="button" class="btn btn-ghost" data-action="load-sample">' + icon('sparkles', 16) + 'Load sample data</button>');
    }
    if (activeFilterCount() > 0) {
      return emptyStateHTML('search', 'No matching assignments',
        'Nothing matches your search and filters. Try different keywords or clear the filters.',
        '<button type="button" class="btn btn-primary" data-action="clear-filters">' + icon('x', 16) + 'Clear filters</button>');
    }
    if (state.view === 'pending') {
      return emptyStateHTML('checkCircle', 'You are all caught up!', 'No pending assignments right now. Add a new one when something comes up.', ADD_BUTTON);
    }
    if (state.view === 'completed') {
      return emptyStateHTML('target', 'Nothing completed yet', 'Mark an assignment as complete and it will appear here.', '');
    }
    return emptyStateHTML('inbox', 'No assignments to show', 'Add an assignment to get started.', ADD_BUTTON);
  }

  /** Rebuilds the subject dropdown (filter) and the datalist (form suggestions) from current data. */
  function renderSubjectOptions() {
    const subjects = getUniqueSubjects();

    // Keep a valid selection: if the chosen subject no longer exists, fall back to "all"
    const stillExists = subjects.some(function (s) { return s.toLowerCase() === state.filters.subject.toLowerCase(); });
    if (state.filters.subject !== 'all' && !stillExists) state.filters.subject = 'all';

    let options = '<option value="all">All subjects</option>';
    subjects.forEach(function (s) {
      const selected = s.toLowerCase() === state.filters.subject.toLowerCase() ? ' selected' : '';
      options += '<option value="' + escapeHtml(s) + '"' + selected + '>' + escapeHtml(s) + '</option>';
    });
    els.filterSubject.innerHTML = options;
    els.filterSubject.value = state.filters.subject === 'all' ? 'all' : (subjects.filter(function (s) { return s.toLowerCase() === state.filters.subject.toLowerCase(); })[0] || 'all');

    // Suggestions for the form: sample subjects + the student's own subjects
    const suggestions = [];
    const seen = {};
    SAMPLE_SUBJECTS.concat(subjects).forEach(function (s) {
      const key = s.toLowerCase();
      if (!seen[key]) { seen[key] = true; suggestions.push(s); }
    });
    els.subjectOptions.innerHTML = suggestions.map(function (s) { return '<option value="' + escapeHtml(s) + '"></option>'; }).join('');
  }

  function renderList() {
    if (LIST_VIEWS.indexOf(state.view) === -1) return;
    const meta = VIEW_META[state.view];
    els.listTitle.textContent = meta.title;
    els.listSubtitle.textContent = meta.subtitle;
    els.statusFilterWrap.hidden = state.view !== 'all';
    els.listToolbar.hidden = state.assignments.length === 0;

    $$('[data-quick]').forEach(function (btn) {
      const active = btn.dataset.quick === state.filters.quick;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    els.clearFiltersBtn.disabled = activeFilterCount() === 0;
    els.sortBy.value = state.sortBy;

    const scopeCount = state.assignments.filter(inViewScope).length;
    const list = getFilteredAssignments();
    els.resultCount.textContent = scopeCount
      ? 'Showing ' + list.length + ' of ' + plural(scopeCount, 'assignment')
      : '';

    if (list.length) {
      els.assignmentList.classList.remove('is-empty');
      els.assignmentList.innerHTML = list.map(assignmentCardHTML).join('');
    } else {
      els.assignmentList.classList.add('is-empty');
      els.assignmentList.innerHTML = listEmptyHTML();
    }
  }

  /* ----- Calendar view ----- */

  function renderCalendar() {
    const year = state.calendar.year;
    const month = state.calendar.month;
    const today = todayISO();

    els.calTitle.textContent = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // Group assignments by their due date
    const byDate = {};
    state.assignments.forEach(function (a) {
      (byDate[a.dueDate] = byDate[a.dueDate] || []).push(a);
    });

    const startOffset = new Date(year, month, 1).getDay(); // 0 = Sunday
    let html = '';
    for (let i = 0; i < 42; i++) {
      const date = new Date(year, month, 1 - startOffset + i);
      const iso = toISODate(date);
      const items = byDate[iso] || [];
      const classes = ['cal-day'];
      if (date.getMonth() !== month) classes.push('other-month');
      if (iso === today) classes.push('is-today');
      if (iso === state.calendar.selected) classes.push('is-selected');
      if (items.length) classes.push('has-items');
      if (items.some(isOverdue)) classes.push('has-overdue');

      const dots = items.slice(0, 3).map(function (a) {
        return '<i class="dot ' + (a.completed ? 'dot-done' : 'dot-' + a.priority) + '"></i>';
      }).join('');

      const label = formatLongDate(iso) + (items.length ? ', ' + plural(items.length, 'assignment') : ', no assignments');
      html += '<button type="button" class="' + classes.join(' ') + '" data-action="cal-select" data-date="' + iso + '" ' +
        'aria-label="' + label + '" aria-pressed="' + (iso === state.calendar.selected) + '">' +
        '<span class="cal-num">' + date.getDate() + '</span>' +
        (items.length ? '<span class="cal-dots">' + dots + '</span><span class="cal-count">' + items.length + '</span>' : '') +
        '</button>';
    }
    els.calGrid.innerHTML = html;

    renderDayPanel(byDate);
  }

  function renderDayPanel(byDate) {
    const iso = state.calendar.selected;
    const items = (byDate[iso] || []).slice().sort(COMPARATORS.due);
    const diff = dayDiff(iso);
    const relative = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : '';

    els.dayTitle.textContent = relative ? relative : 'Selected day';
    els.daySub.textContent = formatLongDate(iso) + ' · ' + (items.length ? plural(items.length, 'assignment') + ' due' : 'nothing due');
    els.dayList.innerHTML = items.length
      ? items.map(assignmentCardHTML).join('')
      : '<div class="mini-empty"><span class="empty-icon">' + icon('calendar', 26) + '</span><p>No assignments are due on this day.</p></div>';
    els.dayAddBtn.dataset.date = iso;
  }

  /* ----- Notifications (bell) ----- */

  function renderNotifications() {
    const urgent = state.assignments
      .filter(function (a) { return !a.completed && dayDiff(a.dueDate) <= 1; })
      .sort(byDueThenPriority);

    els.notifBadge.hidden = urgent.length === 0;
    els.notifBadge.textContent = urgent.length > 9 ? '9+' : String(urgent.length);
    els.notifBtn.setAttribute('aria-label', urgent.length
      ? 'Deadline alerts: ' + plural(urgent.length, 'urgent deadline')
      : 'Deadline alerts: no urgent deadlines');

    if (!urgent.length) {
      els.notifList.innerHTML = '<li class="notif-empty">No urgent deadlines. You are all caught up!</li>';
      return;
    }
    const shown = urgent.slice(0, 6);
    let html = shown.map(function (a) {
      const d = dayDiff(a.dueDate);
      const tone = d < 0 ? 'danger' : d === 0 ? 'warning' : 'info';
      return '<li><button type="button" class="notif-item" data-action="notif-open" data-date="' + a.dueDate + '">' +
        '<span class="notif-dot ' + tone + '"></span><span><strong>' + escapeHtml(a.title) + '</strong>' +
        '<small>' + escapeHtml(a.subject) + ' &middot; ' + dueLabel(a) + '</small></span></button></li>';
    }).join('');
    if (urgent.length > shown.length) html += '<li class="notif-more">+ ' + (urgent.length - shown.length) + ' more in your calendar</li>';
    els.notifList.innerHTML = html;
  }

  function renderSettings() {
    const demoCount = state.assignments.filter(function (a) { return a.isDemo; }).length;
    els.demoInfo.textContent = demoCount
      ? 'You currently have ' + plural(demoCount, 'sample assignment') + ' loaded, out of ' + plural(state.assignments.length, 'assignment') + ' in total.'
      : 'You have ' + plural(state.assignments.length, 'assignment') + ' saved in this browser. No sample data is loaded.';
    updateThemeControls();
  }

  /* ------------------------------------------------------------------
     8. MODALS, CONFIRM DIALOG, TOASTS
  ------------------------------------------------------------------ */
  let assignmentReturnFocus = null;
  let confirmResolve = null;
  let confirmReturnFocus = null;

  function openOverlay(overlay) {
    overlay.hidden = false;
    void overlay.offsetWidth; // let the browser register the starting state, so the fade-in animates
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeOverlay(overlay) {
    overlay.classList.remove('open');
    window.setTimeout(function () {
      if (!overlay.classList.contains('open')) overlay.hidden = true;
      if (!document.querySelector('.overlay.open')) document.body.classList.remove('modal-open');
    }, 220);
  }

  /** Keeps Tab / Shift+Tab inside the open dialog. */
  function trapFocus(event, container) {
    if (event.key !== 'Tab') return;
    const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])', container)
      .filter(function (el) { return !el.closest('[hidden]'); });
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  /* ----- Add / Edit modal ----- */
  function clearFormErrors() {
    [['fieldTitle', 'errTitle'], ['fieldSubject', 'errSubject'], ['fieldDue', 'errDue']].forEach(function (pair) {
      els[pair[0]].classList.remove('is-invalid');
      els[pair[0]].removeAttribute('aria-invalid');
      els[pair[1]].textContent = '';
    });
  }

  function updateDescriptionCounter() {
    els.descCount.textContent = els.fieldDescription.value.length + ' / 500';
  }

  function openAssignmentModal(assignment, defaults) {
    const preset = defaults || {};
    assignmentReturnFocus = document.activeElement;
    state.editingId = assignment ? assignment.id : null;
    clearFormErrors();

    els.modalTitle.textContent = assignment ? 'Edit Assignment' : 'Add Assignment';
    els.modalSubtitle.textContent = assignment ? 'Update the details and save your changes.' : 'Fields marked with * are required.';
    els.saveBtn.textContent = assignment ? 'Save Changes' : 'Add Assignment';

    els.fieldTitle.value = assignment ? assignment.title : '';
    els.fieldSubject.value = assignment ? assignment.subject : (preset.subject || '');
    els.fieldDue.value = assignment ? assignment.dueDate : (preset.dueDate || '');
    els.fieldDescription.value = assignment ? assignment.description : '';
    const priority = assignment ? assignment.priority : 'medium';
    els.assignmentForm.querySelector('input[name="priority"][value="' + priority + '"]').checked = true;
    updateDescriptionCounter();

    closeDropdowns();
    openOverlay(els.assignmentModal);
    els.fieldTitle.focus();
  }

  function closeAssignmentModal() {
    if (!els.assignmentModal.classList.contains('open')) return;
    closeOverlay(els.assignmentModal);
    if (assignmentReturnFocus && document.contains(assignmentReturnFocus) && typeof assignmentReturnFocus.focus === 'function') {
      assignmentReturnFocus.focus({ preventScroll: true });
    }
  }

  function readForm() {
    const checked = els.assignmentForm.querySelector('input[name="priority"]:checked');
    return {
      title: els.fieldTitle.value.replace(/\s+/g, ' ').trim(),
      subject: els.fieldSubject.value.replace(/\s+/g, ' ').trim(),
      dueDate: els.fieldDue.value,
      priority: checked ? checked.value : 'medium',
      description: els.fieldDescription.value.trim()
    };
  }

  /** Returns an object of error messages. An empty object means the form is valid. */
  function validateForm(data) {
    const errors = {};
    if (!data.title) errors.title = 'Please enter an assignment title.';
    else if (data.title.length > 100) errors.title = 'The title must be 100 characters or fewer.';

    if (!data.subject) errors.subject = 'Please choose or type a subject.';

    if (!data.dueDate) errors.due = 'Please choose a due date.';
    else if (!isValidISODate(data.dueDate)) errors.due = 'That date does not look valid. Please pick it again.';
    else if (data.dueDate < '2000-01-01' || data.dueDate > '2100-12-31') errors.due = 'Please pick a date between the years 2000 and 2100.';

    if (PRIORITIES.indexOf(data.priority) === -1) errors.priority = 'Please choose a priority.';
    return errors;
  }

  function showFormErrors(errors) {
    clearFormErrors();
    const map = { title: ['fieldTitle', 'errTitle'], subject: ['fieldSubject', 'errSubject'], due: ['fieldDue', 'errDue'] };
    let firstInvalid = null;
    Object.keys(map).forEach(function (key) {
      if (!errors[key]) return;
      const input = els[map[key][0]];
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      els[map[key][1]].textContent = errors[key];
      if (!firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const data = readForm();
    const errors = validateForm(data);

    if (Object.keys(errors).length) {
      showFormErrors(errors);
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }

    if (state.editingId) {
      const existing = findAssignment(state.editingId);
      if (!existing) { closeAssignmentModal(); showToast('That assignment no longer exists.', 'error'); return; }
      existing.title = data.title;
      existing.subject = data.subject;
      existing.dueDate = data.dueDate;
      existing.priority = data.priority;
      existing.description = data.description;
      existing.isDemo = false; // once a student edits a sample item, it becomes their own
      saveAssignments();
      closeAssignmentModal();
      renderAll();
      showToast('Assignment updated.', 'success');
      return;
    }

    const created = {
      id: createId(),
      title: data.title,
      subject: data.subject,
      dueDate: data.dueDate,
      priority: data.priority,
      description: data.description,
      completed: false,
      completedAt: null,
      createdAt: Date.now(),
      isDemo: false
    };
    state.assignments.push(created);
    saveAssignments();
    closeAssignmentModal();

    // If the current filters would hide the new assignment, clear them so the student can see it.
    let message = 'Assignment added successfully.';
    if (LIST_VIEWS.indexOf(state.view) !== -1 && inViewScope(created) && !matchesFilters(created)) {
      resetFilters();
      message = 'Assignment added. Filters were cleared so you can see it.';
    }
    renderAll();
    showToast(message, 'success');
  }

  /* ----- Confirm dialog (returns a Promise<boolean>) ----- */
  function confirmDialog(options) {
    return new Promise(function (resolve) {
      if (confirmResolve) confirmResolve(false);
      confirmResolve = resolve;
      confirmReturnFocus = document.activeElement;
      els.confirmTitle.textContent = options.title;
      els.confirmMessage.textContent = options.message;
      els.confirmOk.textContent = options.confirmText || 'Confirm';
      els.confirmOk.className = 'btn ' + (options.danger ? 'btn-danger' : 'btn-primary');
      els.confirmIcon.className = 'confirm-icon ' + (options.danger ? 'danger' : 'info');
      els.confirmIcon.innerHTML = icon(options.danger ? 'trash' : 'sparkles', 28);
      closeDropdowns();
      openOverlay(els.confirmModal);
      els.confirmCancel.focus(); // safest default: the harmless choice
    });
  }

  function closeConfirm(result) {
    if (!confirmResolve) return;
    const resolve = confirmResolve;
    confirmResolve = null;
    closeOverlay(els.confirmModal);
    if (confirmReturnFocus && document.contains(confirmReturnFocus) && typeof confirmReturnFocus.focus === 'function') {
      confirmReturnFocus.focus({ preventScroll: true });
    }
    resolve(result);
  }

  /* ----- Toast notifications ----- */
  function showToast(message, type, duration, action) {
    const kind = type || 'success';
    const icons = { success: 'checkCircle', error: 'alert', info: 'sparkles' };
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + kind;
    toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    toast.innerHTML = '<span class="toast-icon">' + icon(icons[kind] || 'sparkles', 18) + '</span>' +
      '<span class="toast-msg">' + escapeHtml(message) + '</span>' +
      (action ? '<button type="button" class="toast-action">' + escapeHtml(action.label) + '</button>' : '') +
      '<button type="button" class="icon-btn toast-close" aria-label="Dismiss notification">' + icon('x', 16) + '</button>';

    function dismiss() {
      if (toast.classList.contains('leaving')) return;
      toast.classList.add('leaving');
      window.setTimeout(function () { toast.remove(); }, 260);
    }
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    if (action) {
      toast.querySelector('.toast-action').addEventListener('click', function () { action.onClick(); dismiss(); });
    }

    // Keep at most 4 toasts on screen
    while (els.toastStack.children.length >= 4) els.toastStack.firstElementChild.remove();
    els.toastStack.appendChild(toast);
    window.setTimeout(dismiss, duration || (action ? 6000 : 3600));
  }

  /* ------------------------------------------------------------------
     9. ACTIONS
  ------------------------------------------------------------------ */
  function toggleStatus(id) {
    const a = findAssignment(id);
    if (!a) return;
    a.completed = !a.completed;
    a.completedAt = a.completed ? Date.now() : null;
    saveAssignments();
    renderAll();
    showToast(
      a.completed ? 'Nice work! Marked as completed.' : 'Moved back to pending.',
      'success', 5000,
      { label: 'Undo', onClick: function () { toggleStatus(id); } }
    );
  }

  function deleteAssignment(id) {
    const a = findAssignment(id);
    if (!a) return;
    confirmDialog({
      title: 'Delete this assignment?',
      message: '"' + a.title + '" will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      danger: true
    }).then(function (confirmed) {
      if (!confirmed) return;
      state.assignments = state.assignments.filter(function (x) { return x.id !== id; });
      saveAssignments();
      renderAll();
      showToast('Assignment deleted.', 'success');
    });
  }

  /** Builds realistic sample assignments with dates relative to today, so the demo always looks fresh. */
  function buildSampleData() {
    const today = todayISO();
    const now = Date.now();
    const rows = [
      ['Web Technology', 'Build a responsive portfolio website', 2, 'high', false, 'Use HTML, CSS and a working contact form. Submit the project folder as a ZIP file.'],
      ['Web Technology', 'CSS Flexbox and Grid practice sheet', -2, 'medium', false, 'Complete all 10 layout exercises from the lab manual.'],
      ['Web Technology', 'JavaScript DOM mini quiz app', 9, 'medium', false, 'A small quiz with score tracking using only vanilla JavaScript.'],
      ['Database Management System', 'ER diagram for Library Management System', 1, 'high', false, 'Show entities, attributes, relationships and cardinality.'],
      ['Database Management System', 'SQL worksheet: joins and subqueries', 5, 'medium', false, 'Write queries for the 12 questions given in class.'],
      ['Database Management System', 'Normalization exercises (1NF to 3NF)', -6, 'high', true, ''],
      ['C Programming', 'Lab record: arrays and strings programs', -1, 'high', false, 'Write the aim, algorithm, program and output for each program.'],
      ['C Programming', 'Pointers and functions practice set', 0, 'medium', false, 'Solve questions 1 to 8 from the practice handout.'],
      ['C Programming', 'Menu-driven bank account program', 12, 'low', false, 'Deposit, withdraw, balance enquiry and exit options.'],
      ['Mathematics', 'Matrices and determinants problem set', 3, 'medium', false, 'Show every step of your working.'],
      ['Mathematics', 'Unit 2 revision: sets and relations', -4, 'low', true, ''],
      ['Computer Fundamentals', 'Number systems conversion worksheet', 6, 'low', false, 'Binary, octal, decimal and hexadecimal conversions.'],
      ['Computer Fundamentals', 'Presentation: evolution of computers', -3, 'medium', true, 'Five slides covering generations of computers.'],
      ['Computer Fundamentals', 'Short essay: impact of AI on education', 14, 'low', false, 'About 400 words with at least two examples.']
    ];
    return rows.map(function (r, index) {
      return {
        id: createId(),
        subject: r[0],
        title: r[1],
        dueDate: addDays(today, r[2]),
        priority: r[3],
        completed: r[4],
        completedAt: r[4] ? now - 86400000 : null,
        description: r[5],
        createdAt: now - (rows.length - index) * 1000,
        isDemo: true
      };
    });
  }

  function loadSampleData() {
    const existing = state.assignments.length;
    const proceed = existing
      ? confirmDialog({
          title: 'Add sample assignments?',
          message: 'You already have ' + plural(existing, 'assignment') + '. Sample data will be added alongside them. Your own assignments will not be changed or overwritten.',
          confirmText: 'Add sample data',
          danger: false
        })
      : Promise.resolve(true);

    proceed.then(function (confirmed) {
      if (!confirmed) return;
      // Replace any older sample set so repeated clicks never create duplicates
      state.assignments = state.assignments.filter(function (a) { return !a.isDemo; }).concat(buildSampleData());
      saveAssignments();
      resetFilters();
      renderAll();
      showToast('Sample assignments loaded.', 'success');
    });
  }

  function clearDemoData() {
    const demoCount = state.assignments.filter(function (a) { return a.isDemo; }).length;
    if (!demoCount) { showToast('There is no sample data to clear.', 'info'); return; }
    confirmDialog({
      title: 'Clear demo data?',
      message: plural(demoCount, 'sample assignment') + ' will be removed. Assignments you added yourself will stay.',
      confirmText: 'Clear demo data',
      danger: true
    }).then(function (confirmed) {
      if (!confirmed) return;
      state.assignments = state.assignments.filter(function (a) { return !a.isDemo; });
      saveAssignments();
      renderAll();
      showToast('Demo data cleared.', 'success');
    });
  }

  function deleteAllData() {
    if (!state.assignments.length) { showToast('There is nothing to delete.', 'info'); return; }
    confirmDialog({
      title: 'Delete ALL assignments?',
      message: 'All ' + plural(state.assignments.length, 'assignment') + ' saved in this browser will be permanently removed. This cannot be undone.',
      confirmText: 'Delete everything',
      danger: true
    }).then(function (confirmed) {
      if (!confirmed) return;
      state.assignments = [];
      saveAssignments();
      resetFilters();
      renderAll();
      showToast('All assignments deleted.', 'success');
    });
  }

  function exportData() {
    closeDropdowns();
    if (!state.assignments.length) { showToast('Nothing to download yet. Add an assignment first.', 'info'); return; }
    const payload = { app: 'DueWise', version: 1, exportedAt: new Date().toISOString(), assignments: state.assignments };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'duewise-backup-' + todayISO() + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    showToast('Backup downloaded.', 'success');
  }

  /* ----- Calendar actions ----- */
  function shiftMonth(delta) {
    const target = new Date(state.calendar.year, state.calendar.month + delta, 1);
    state.calendar.year = target.getFullYear();
    state.calendar.month = target.getMonth();
    // Select a sensible day in the new month: today if visible, otherwise the 1st
    const now = new Date();
    state.calendar.selected = (now.getFullYear() === target.getFullYear() && now.getMonth() === target.getMonth())
      ? todayISO()
      : toISODate(target);
    renderCalendar();
  }

  function selectCalendarDate(iso, shouldFocus) {
    if (!isValidISODate(iso)) return;
    const d = parseISODate(iso);
    state.calendar.selected = iso;
    state.calendar.year = d.getFullYear();
    state.calendar.month = d.getMonth();
    renderCalendar();
    if (shouldFocus) {
      const cell = els.calGrid.querySelector('[data-date="' + iso + '"]');
      if (cell) cell.focus();
    }
  }

  /* ------------------------------------------------------------------
     10. THEME AND PROFILE
  ------------------------------------------------------------------ */
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updateThemeControls() {
    const dark = currentTheme() === 'dark';
    els.themeToggle.innerHTML = icon(dark ? 'sun' : 'moon', 20);
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    els.themeToggle.setAttribute('aria-label', label);
    els.themeToggle.title = label;
    $$('[data-theme-value]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.themeValue === currentTheme()));
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0A0F28' : '#0F1535');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    storage.set(STORAGE_KEYS.theme, theme === 'dark' ? 'dark' : 'light');
    updateThemeControls();
  }

  function loadProfile() {
    const raw = storage.get(STORAGE_KEYS.profile);
    if (!raw) return;
    try {
      const profile = JSON.parse(raw);
      if (profile && typeof profile.name === 'string' && profile.name.trim()) {
        state.profileName = profile.name.trim().slice(0, 30);
      }
    } catch (e) { /* ignore unreadable profile data and keep the default name */ }
  }

  function handleProfileSubmit(event) {
    event.preventDefault();
    const name = els.profileName.value.replace(/\s+/g, ' ').trim();
    if (!name) {
      els.errProfile.textContent = 'Please enter your name.';
      els.profileName.classList.add('is-invalid');
      els.profileName.focus();
      return;
    }
    els.errProfile.textContent = '';
    els.profileName.classList.remove('is-invalid');
    state.profileName = name.slice(0, 30);
    storage.set(STORAGE_KEYS.profile, JSON.stringify({ name: state.profileName }));
    renderAll();
    showToast('Profile saved. Hello, ' + state.profileName + '!', 'success');
  }

  /* ------------------------------------------------------------------
     11. NAVIGATION + EVENT WIRING
  ------------------------------------------------------------------ */
  const DROPDOWNS = [
    { button: 'notifBtn', panel: 'notifPanel' },
    { button: 'profileBtn', panel: 'profileMenu' }
  ];

  function closeDropdowns(exceptPanel) {
    DROPDOWNS.forEach(function (d) {
      if (d.panel === exceptPanel) return;
      els[d.panel].hidden = true;
      els[d.button].setAttribute('aria-expanded', 'false');
    });
  }

  function toggleDropdown(panelId) {
    const d = DROPDOWNS.filter(function (x) { return x.panel === panelId; })[0];
    const willOpen = els[d.panel].hidden;
    closeDropdowns(willOpen ? panelId : undefined);
    els[d.panel].hidden = !willOpen;
    els[d.button].setAttribute('aria-expanded', String(willOpen));
  }

  function setView(view) {
    if (!VIEW_META[view]) view = 'dashboard';
    state.view = view;
    closeDropdowns();

    const activePanel = VIEW_META[view].panel;
    ['view-dashboard', 'view-list', 'view-calendar', 'view-settings'].forEach(function (id) {
      document.getElementById(id).hidden = id !== activePanel;
    });

    $$('[data-nav]').forEach(function (btn) {
      if (btn.dataset.nav === view) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    document.title = VIEW_META[view].title + ' | DueWise';
    if (view === 'settings') els.profileName.value = state.profileName;
    renderAll();
    try { window.scrollTo(0, 0); } catch (e) { /* not supported in some test environments */ }
  }

  /** Handles the clickable statistic cards and the overdue alert strip. */
  function handleGoto(target) {
    resetFilters();
    if (target === 'overdue') {
      state.filters.quick = 'overdue';
      setView('all');
    } else {
      setView(target);
    }
  }

  function handleAction(action, el) {
    const id = el.dataset.id;
    switch (action) {
      case 'add': openAssignmentModal(null); break;
      case 'add-on-date': openAssignmentModal(null, { dueDate: el.dataset.date || state.calendar.selected }); break;
      case 'edit': { const a = findAssignment(id); if (a) openAssignmentModal(a); break; }
      case 'delete': deleteAssignment(id); break;
      case 'toggle': toggleStatus(id); break;
      case 'close-modal': closeAssignmentModal(); break;
      case 'load-sample': loadSampleData(); break;
      case 'clear-demo': clearDemoData(); break;
      case 'delete-all': deleteAllData(); break;
      case 'export-data': exportData(); break;
      case 'clear-filters': resetFilters(); renderAll(); break;
      case 'cal-prev': shiftMonth(-1); break;
      case 'cal-next': shiftMonth(1); break;
      case 'cal-today': {
        const now = new Date();
        state.calendar.year = now.getFullYear();
        state.calendar.month = now.getMonth();
        state.calendar.selected = todayISO();
        renderCalendar();
        break;
      }
      case 'cal-select': selectCalendarDate(el.dataset.date, true); break;
      case 'notif-open': closeDropdowns(); setView('calendar'); selectCalendarDate(el.dataset.date); break;
      case 'toggle-notif': toggleDropdown('notifPanel'); break;
      case 'toggle-profile': toggleDropdown('profileMenu'); break;
      case 'goto-settings': setView('settings'); break;
      case 'toggle-theme': applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'); closeDropdowns(); break;
      case 'set-theme': applyTheme(el.dataset.themeValue); break;
      default: break;
    }
  }

  function bindEvents() {
    // One click handler for the whole page (event delegation). Works for cards drawn later too.
    document.addEventListener('click', function (event) {
      const target = event.target;

      if (!target.closest('.dropdown-wrap')) closeDropdowns();

      // Clicking the dark backdrop behind a dialog closes it
      if (target === els.assignmentModal) { closeAssignmentModal(); return; }
      if (target === els.confirmModal) { closeConfirm(false); return; }

      const nav = target.closest('[data-nav]');
      if (nav) { setView(nav.dataset.nav); return; }

      const go = target.closest('[data-goto]');
      if (go) { handleGoto(go.dataset.goto); return; }

      const quick = target.closest('[data-quick]');
      if (quick) { state.filters.quick = quick.dataset.quick; renderList(); return; }

      const actionEl = target.closest('[data-action]');
      if (actionEl) handleAction(actionEl.dataset.action, actionEl);
    });

    // Search (top bar). Typing while on another page jumps to the list.
    els.searchInput.addEventListener('input', function () {
      state.filters.search = els.searchInput.value;
      if (LIST_VIEWS.indexOf(state.view) === -1) setView('all');
      else renderAll();
    });

    els.filterSubject.addEventListener('change', function () { state.filters.subject = els.filterSubject.value; renderAll(); });
    els.filterPriority.addEventListener('change', function () { state.filters.priority = els.filterPriority.value; renderAll(); });
    els.filterStatus.addEventListener('change', function () { state.filters.status = els.filterStatus.value; renderAll(); });
    els.sortBy.addEventListener('change', function () { state.sortBy = els.sortBy.value; renderAll(); });

    // Add / edit form
    els.assignmentForm.addEventListener('submit', handleFormSubmit);
    els.fieldDescription.addEventListener('input', updateDescriptionCounter);
    [['fieldTitle', 'errTitle'], ['fieldSubject', 'errSubject'], ['fieldDue', 'errDue']].forEach(function (pair) {
      els[pair[0]].addEventListener('input', function () {
        els[pair[0]].classList.remove('is-invalid');
        els[pair[0]].removeAttribute('aria-invalid');
        els[pair[1]].textContent = '';
      });
    });

    // Confirm dialog buttons
    els.confirmOk.addEventListener('click', function () { closeConfirm(true); });
    els.confirmCancel.addEventListener('click', function () { closeConfirm(false); });

    els.profileForm.addEventListener('submit', handleProfileSubmit);

    // Arrow keys move between calendar days
    els.calGrid.addEventListener('keydown', function (event) {
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      const cell = event.target.closest('.cal-day');
      if (!delta || !cell) return;
      event.preventDefault();
      selectCalendarDate(addDays(cell.dataset.date, delta), true);
    });

    // Keyboard: Escape closes things, Tab stays inside dialogs, "/" and "N" are shortcuts
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (els.confirmModal.classList.contains('open')) { closeConfirm(false); return; }
        if (els.assignmentModal.classList.contains('open')) { closeAssignmentModal(); return; }
        closeDropdowns();
        return;
      }
      if (event.key === 'Tab') {
        if (els.confirmModal.classList.contains('open')) { trapFocus(event, els.confirmModal); return; }
        if (els.assignmentModal.classList.contains('open')) { trapFocus(event, els.assignmentModal); return; }
      }

      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((event.target.tagName || ''));
      const modalOpen = !!document.querySelector('.overlay.open');
      if (typing || modalOpen || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === '/') { event.preventDefault(); els.searchInput.focus(); }
      else if (event.key === 'n' || event.key === 'N') { event.preventDefault(); openAssignmentModal(null); }
    });

    // Re-check overdue status when midnight passes or the tab becomes visible again
    let lastDay = todayISO();
    function refreshIfDayChanged() {
      if (todayISO() !== lastDay) { lastDay = todayISO(); renderAll(); }
    }
    window.setInterval(refreshIfDayChanged, 60000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshIfDayChanged(); });

    // If another browser tab changes the data, stay in sync
    window.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEYS.assignments) { state.assignments = loadAssignments(); renderAll(); }
    });
  }

  /* ------------------------------------------------------------------
     12. START-UP
  ------------------------------------------------------------------ */
  function init() {
    ELEMENT_IDS.forEach(function (id) { els[id] = document.getElementById(id); });
    hydrateIcons();
    loadProfile();
    state.assignments = loadAssignments();
    bindEvents();
    updateThemeControls();
    setView('dashboard');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();