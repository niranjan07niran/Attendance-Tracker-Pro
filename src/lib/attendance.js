/* ---------------------------------------------------------------------- */
/* Pure attendance logic - no React, no DOM. Unit-tested in               */
/* attendance.test.js. Everything that touches numbers or dates lives     */
/* here so the UI layer only renders.                                     */
/*                                                                        */
/* Item model (v2):                                                       */
/*   { id, name, category, emoji, color, attended, total,                 */
/*     target: number|null   (per-item target %, null = use default)      */
/*     schedule: number[]    (weekdays 0=Sun..6=Sat the class meets)      */
/*     log: LogEntry[]       (newest last)                                */
/*     createdAt, updatedAt }                                             */
/*                                                                        */
/* LogEntry: { id, date:'YYYY-MM-DD', at: ISO, status, dA, dT }           */
/*   status: 'present' | 'absent' | 'cancelled' | 'adjust'               */
/*   dA/dT: the change actually applied to attended/total, so removing   */
/*   an entry reverses it exactly.                                        */
/*                                                                        */
/* attended/total stay the source of truth (v1 data has no log), the log  */
/* is the history layered on top.                                         */
/* ---------------------------------------------------------------------- */

export const LOG_LIMIT = 1500;
export const COUNTED_STATUSES = ['present', 'absent'];

let idCounter = 0;
export function generateId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function round2(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/** Clean decimal formatting: 5.50 -> "5.5", 5 -> "5". */
export function formatNum(n) {
  return String(round2(n));
}

export function formatFraction(attended, total) {
  return `${formatNum(attended)}/${formatNum(total)}`;
}

export function clampTotal(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return 0;
  return round2(Math.max(0, v));
}

export function clampAttended(value, total) {
  const v = Number(value);
  if (!Number.isFinite(v)) return 0;
  return round2(Math.max(0, Math.min(v, total)));
}

export function attendanceRate(attended, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (attended / total) * 100));
}

export function effectiveTarget(item, defaultTarget) {
  const t = item && item.target != null ? Number(item.target) : Number(defaultTarget);
  if (!Number.isFinite(t)) return 75;
  return Math.max(0, Math.min(100, t));
}

/**
 * The "bunk calculator".
 *  - safe:       at/above target; canSkip = classes you can miss in a row
 *                and still be at/above target.
 *  - behind:     below target; need = classes to attend in a row to get back.
 *  - impossible: target is 100% and you've already missed one.
 *  - empty:      no classes yet.
 */
export function bunkInfo(attended, total, targetPct) {
  const t = Math.max(0, Math.min(100, Number(targetPct))) / 100;
  if (!total || total <= 0) return { kind: 'empty' };
  const EPS = 1e-9;
  if (attended / total + EPS >= t) {
    if (t <= 0) return { kind: 'safe', canSkip: Infinity };
    const canSkip = Math.max(0, Math.floor(attended / t - total + EPS));
    return { kind: 'safe', canSkip };
  }
  if (t >= 1) return { kind: 'impossible' };
  const need = Math.max(1, Math.ceil((t * total - attended) / (1 - t) - EPS));
  return { kind: 'behind', need };
}

export function bunkLabel(info) {
  switch (info.kind) {
    case 'empty': return 'No classes yet';
    case 'impossible': return "Target can't be reached";
    case 'behind': return `Attend ${info.need} more to reach target`;
    case 'safe':
      if (info.canSkip === Infinity) return 'No target set';
      if (info.canSkip === 0) return "On target - don't skip the next one";
      return `Safe to skip ${info.canSkip} class${info.canSkip === 1 ? '' : 'es'}`;
    default: return '';
  }
}

/* ---------------------------- Dates ---------------------------------- */

function pad(n) { return String(n).padStart(2, '0'); }

/** Local-time date key, YYYY-MM-DD. */
export function toDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(key, n) {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function weekdayOf(key) {
  return fromDateKey(key).getDay();
}

/** First day of the week containing `key`. weekStartsOn: 0=Sun, 1=Mon. */
export function startOfWeek(key, weekStartsOn = 1) {
  const day = weekdayOf(key);
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(key, -diff);
}

export function weekDays(key, weekStartsOn = 1) {
  const start = startOfWeek(key, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** 6x7 grid of date keys covering the month of `monthKey` (YYYY-MM or any date key). */
export function monthGrid(monthKey, weekStartsOn = 1) {
  const [y, m] = String(monthKey).split('-').map(Number);
  const first = toDateKey(new Date(y, m - 1, 1));
  const start = startOfWeek(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function shiftMonth(monthKey, delta) {
  const [y, m] = String(monthKey).split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function orderedWeekdays(weekStartsOn = 1) {
  return Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);
}

/* ---------------------------- Marking -------------------------------- */

/**
 * Apply a mark and return the new item. Pure.
 * opts: { date, step (attended credit for present), dA/dT (for 'adjust'), now }
 */
export function applyMark(item, status, opts = {}) {
  const now = opts.now || new Date().toISOString();
  const date = opts.date || toDateKey(new Date(now));
  let reqA = 0;
  let reqT = 0;
  if (status === 'present') { reqA = opts.step != null ? Number(opts.step) : 1; reqT = 1; }
  else if (status === 'absent') { reqA = 0; reqT = 1; }
  else if (status === 'cancelled') { reqA = 0; reqT = 0; }
  else if (status === 'adjust') { reqA = Number(opts.dA) || 0; reqT = Number(opts.dT) || 0; }
  else throw new Error(`Unknown status: ${status}`);

  const newTotal = clampTotal(item.total + reqT);
  const newAttended = clampAttended(item.attended + reqA, newTotal);
  const dA = round2(newAttended - item.attended);
  const dT = round2(newTotal - item.total);
  if (status === 'adjust' && dA === 0 && dT === 0) return item;

  const entry = { id: generateId('log'), date, at: now, status, dA, dT };
  const log = [...(item.log || []), entry];
  return {
    ...item,
    attended: newAttended,
    total: newTotal,
    log: log.length > LOG_LIMIT ? log.slice(log.length - LOG_LIMIT) : log,
    updatedAt: now,
  };
}

/** Remove a log entry and reverse its effect on the counts. */
export function removeLogEntry(item, entryId, now = new Date().toISOString()) {
  const entry = (item.log || []).find(e => e.id === entryId);
  if (!entry) return item;
  const newTotal = clampTotal(item.total - entry.dT);
  const newAttended = clampAttended(item.attended - entry.dA, newTotal);
  return {
    ...item,
    attended: newAttended,
    total: newTotal,
    log: item.log.filter(e => e.id !== entryId),
    updatedAt: now,
  };
}

export function entriesOn(item, dateKey) {
  return (item.log || []).filter(e => e.date === dateKey);
}

/** Per-day summary for an item: { [date]: { present, absent, cancelled } } (counts). */
export function dayStatusMap(item) {
  const map = {};
  for (const e of item.log || []) {
    if (e.status === 'adjust') continue;
    if (!map[e.date]) map[e.date] = { present: 0, absent: 0, cancelled: 0 };
    map[e.date][e.status] += 1;
  }
  return map;
}

export function isScheduledOn(item, dateKey) {
  return Array.isArray(item.schedule) && item.schedule.includes(weekdayOf(dateKey));
}

/* ---------------------------- Migration ------------------------------ */

export function migrateItem(raw, validColors = [], fallbackEmoji = '👤') {
  if (!raw || typeof raw !== 'object') return null;
  const total = clampTotal(raw.total);
  const now = new Date().toISOString();
  const name = String(raw.name || '').trim();
  if (!name) return null;
  return {
    id: raw.id ? String(raw.id) : generateId(),
    name,
    category: String(raw.category || 'General').trim() || 'General',
    emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji : fallbackEmoji,
    color: validColors.length === 0 || validColors.includes(raw.color) ? (raw.color || 'amber') : validColors[0],
    attended: clampAttended(raw.attended, total),
    total,
    target: raw.target == null || raw.target === '' || !Number.isFinite(Number(raw.target)) ? null : Math.max(0, Math.min(100, Number(raw.target))),
    schedule: Array.isArray(raw.schedule) ? [...new Set(raw.schedule.map(Number).filter(d => d >= 0 && d <= 6))].sort() : [],
    log: Array.isArray(raw.log) ? raw.log.filter(e => e && e.id && e.date && e.status).slice(-LOG_LIMIT) : [],
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    createdAt: raw.createdAt || now,
    updatedAt: raw.updatedAt || now,
  };
}

export function migrateSettings(raw, defaults) {
  const s = { ...defaults, ...(raw || {}) };
  // v1 used a boolean darkMode; v2 uses theme: light | dark | system.
  if (!raw || !raw.theme) s.theme = raw && raw.darkMode ? 'dark' : (defaults.theme || 'system');
  delete s.darkMode;
  s.defaultTarget = Math.max(0, Math.min(100, Number(s.defaultTarget) || defaults.defaultTarget));
  return s;
}

/* ---------------------------- Stats ---------------------------------- */

function flattenCounted(items) {
  const out = [];
  for (const item of items) {
    for (const e of item.log || []) {
      if (COUNTED_STATUSES.includes(e.status)) out.push({ ...e, itemId: item.id });
    }
  }
  out.sort((a, b) => (a.date === b.date ? (a.at < b.at ? -1 : a.at > b.at ? 1 : 0) : a.date < b.date ? -1 : 1));
  return out;
}

/** Consecutive present marks (across all items), current and best. */
export function streaks(items) {
  const entries = flattenCounted(items);
  let best = 0;
  let run = 0;
  for (const e of entries) {
    if (e.status === 'present') { run += 1; best = Math.max(best, run); }
    else run = 0;
  }
  return { current: run, best };
}

/** Attendance % per week for the last `weeks` weeks (from the log). */
export function weeklyTrend(items, { weeks = 8, today = toDateKey(), weekStartsOn = 1 } = {}) {
  const thisWeek = startOfWeek(today, weekStartsOn);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    return { start, end: addDays(start, 6), attended: 0, total: 0 };
  });
  const first = buckets[0].start;
  for (const e of flattenCounted(items)) {
    if (e.date < first || e.date > buckets[weeks - 1].end) continue;
    const idx = Math.floor((fromDateKey(e.date) - fromDateKey(first)) / (7 * 86400000) + 1e-6);
    const b = buckets[idx];
    if (!b) continue;
    b.attended += e.dA;
    b.total += e.dT;
  }
  return buckets.map(b => ({ ...b, rate: b.total > 0 ? attendanceRate(b.attended, b.total) : null }));
}

/** Attendance % by weekday (from the log). */
export function weekdayBreakdown(items, weekStartsOn = 1) {
  const acc = Array.from({ length: 7 }, () => ({ attended: 0, total: 0 }));
  for (const e of flattenCounted(items)) {
    const d = weekdayOf(e.date);
    acc[d].attended += e.dA;
    acc[d].total += e.dT;
  }
  return orderedWeekdays(weekStartsOn).map(d => ({
    weekday: d,
    label: WEEKDAY_SHORT[d],
    ...acc[d],
    rate: acc[d].total > 0 ? attendanceRate(acc[d].attended, acc[d].total) : null,
  }));
}

export function hasAnyLog(items) {
  return items.some(i => (i.log || []).some(e => COUNTED_STATUSES.includes(e.status)));
}

/* ---------------------------- Export --------------------------------- */

function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(items, defaultTarget) {
  const header = ['Name', 'Category', 'Attended', 'Total', 'Attendance %', 'Target %', 'Status', 'Schedule'];
  const rows = items.map(i => {
    const target = effectiveTarget(i, defaultTarget);
    return [
      i.name, i.category, formatNum(i.attended), formatNum(i.total),
      formatNum(attendanceRate(i.attended, i.total)), formatNum(target),
      bunkLabel(bunkInfo(i.attended, i.total, target)),
      (i.schedule || []).map(d => WEEKDAY_SHORT[d]).join(' '),
    ];
  });
  const logHeader = ['Date', 'Name', 'Category', 'Status', 'Attended change', 'Total change'];
  const logRows = [];
  for (const i of items) {
    for (const e of i.log || []) logRows.push([e.date, i.name, i.category, e.status, formatNum(e.dA), formatNum(e.dT)]);
  }
  logRows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const lines = [header, ...rows, [], logHeader, ...logRows].map(r => r.map(csvCell).join(','));
  return lines.join('\n') + '\n';
}

export const BACKUP_APP = 'tally';
export const BACKUP_VERSION = 2;

export function makeBackup(items, settings) {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), items, settings };
}

/** Parse a backup file. Throws with a readable message when invalid. */
export function parseBackup(text, validColors, defaults) {
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error('That file isn\'t valid JSON.'); }
  const rawItems = Array.isArray(data) ? data : data && Array.isArray(data.items) ? data.items : null;
  if (!rawItems) throw new Error('No items found in that file.');
  const seen = new Set();
  const items = [];
  for (const raw of rawItems) {
    const it = migrateItem(raw, validColors);
    if (!it) continue;
    if (seen.has(it.id)) it.id = generateId();
    seen.add(it.id);
    items.push(it);
  }
  const settings = data && data.settings && typeof data.settings === 'object' ? migrateSettings(data.settings, defaults) : null;
  return { items, settings };
}
