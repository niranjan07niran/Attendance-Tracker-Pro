import { describe, it, expect } from 'vitest';
import {
  bunkInfo, bunkLabel, applyMark, removeLogEntry, formatNum, attendanceRate,
  toDateKey, addDays, startOfWeek, weekDays, monthGrid, shiftMonth, migrateItem,
  migrateSettings, streaks, weeklyTrend, weekdayBreakdown, parseBackup, makeBackup,
  toCsv, effectiveTarget, isScheduledOn,
} from './attendance.js';

const base = { id: 'a', name: 'Maths', category: 'Sem 1', emoji: '📚', color: 'amber', attended: 0, total: 0, target: null, schedule: [], log: [] };

describe('bunkInfo', () => {
  it('counts classes you can skip', () => {
    expect(bunkInfo(14, 16, 75)).toEqual({ kind: 'safe', canSkip: 2 });
    expect(bunkInfo(3, 4, 75)).toEqual({ kind: 'safe', canSkip: 0 });
  });
  it('counts classes you need to attend', () => {
    expect(bunkInfo(4, 6, 75)).toEqual({ kind: 'behind', need: 2 });
    expect(bunkInfo(0, 1, 75)).toEqual({ kind: 'behind', need: 3 });
  });
  it('handles edge cases', () => {
    expect(bunkInfo(0, 0, 75).kind).toBe('empty');
    expect(bunkInfo(9, 10, 100).kind).toBe('impossible');
    expect(bunkInfo(10, 10, 100)).toEqual({ kind: 'safe', canSkip: 0 });
    expect(bunkInfo(5.5, 8, 60)).toEqual({ kind: 'safe', canSkip: 1 });
  });
  it('labels', () => {
    expect(bunkLabel({ kind: 'safe', canSkip: 1 })).toBe('Safe to skip 1 class');
    expect(bunkLabel({ kind: 'behind', need: 4 })).toBe('Attend 4 more to reach target');
  });
  it('per-item target overrides default', () => {
    expect(effectiveTarget({ target: 80 }, 75)).toBe(80);
    expect(effectiveTarget({ target: null }, 65)).toBe(65);
  });
});

describe('applyMark / removeLogEntry', () => {
  it('present, absent, cancelled update counts and log', () => {
    let it1 = applyMark(base, 'present', { date: '2026-10-05' });
    expect([it1.attended, it1.total]).toEqual([1, 1]);
    it1 = applyMark(it1, 'absent', { date: '2026-10-06' });
    expect([it1.attended, it1.total]).toEqual([1, 2]);
    it1 = applyMark(it1, 'cancelled', { date: '2026-10-07' });
    expect([it1.attended, it1.total]).toEqual([1, 2]);
    expect(it1.log.map(e => e.status)).toEqual(['present', 'absent', 'cancelled']);
  });
  it('partial present uses step', () => {
    const r = applyMark(base, 'present', { step: 0.5 });
    expect([r.attended, r.total]).toEqual([0.5, 1]);
  });
  it('adjust clamps and records the applied delta', () => {
    const start = { ...base, attended: 0.25, total: 3 };
    const r = applyMark(start, 'adjust', { dA: -1 });
    expect(r.attended).toBe(0);
    expect(r.log[0].dA).toBe(-0.25);
    expect(applyMark({ ...base }, 'adjust', { dA: -1 })).toEqual(base);
  });
  it('removing an entry reverses it exactly', () => {
    const a = applyMark({ ...base, attended: 5.5, total: 8 }, 'present', { step: 0.25 });
    const b = applyMark(a, 'absent');
    const c = removeLogEntry(b, a.log[0].id);
    expect([c.attended, c.total]).toEqual([5.5, 9]);
    expect(c.log).toHaveLength(1);
  });
});

describe('dates', () => {
  it('week helpers', () => {
    expect(startOfWeek('2026-11-01', 1)).toBe('2026-10-26'); // Sunday -> previous Monday
    expect(startOfWeek('2026-11-01', 0)).toBe('2026-11-01');
    expect(weekDays('2026-11-04', 1)[0]).toBe('2026-11-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('month grid and shifting', () => {
    const g = monthGrid('2026-11', 1);
    expect(g).toHaveLength(42);
    expect(g[0]).toBe('2026-10-26');
    expect(g).toContain('2026-11-30');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
  it('schedule', () => {
    expect(isScheduledOn({ schedule: [1, 3] }, '2026-11-02')).toBe(true); // Monday
    expect(isScheduledOn({ schedule: [1, 3] }, '2026-11-03')).toBe(false);
  });
});

describe('migration', () => {
  it('upgrades v1 items and settings', () => {
    const m = migrateItem({ id: 'x', name: ' Yoga ', category: 'Fit', emoji: '🧘', color: 'rose', attended: 9, total: 8 }, ['amber', 'rose']);
    expect(m).toMatchObject({ name: 'Yoga', attended: 8, total: 8, target: null, schedule: [], log: [] });
    expect(migrateItem({ name: '' })).toBeNull();
    expect(migrateItem({ name: 'A', color: 'neon' }, ['amber']).color).toBe('amber');
    const s = migrateSettings({ darkMode: true, accentColor: 'sky' }, { theme: 'system', defaultTarget: 75 });
    expect(s.theme).toBe('dark');
    expect(s.darkMode).toBeUndefined();
    expect(s.defaultTarget).toBe(75);
  });
});

describe('stats', () => {
  const items = [
    { ...base, log: [
      { id: '1', date: '2026-10-26', at: '2026-10-26T09:00:00Z', status: 'present', dA: 1, dT: 1 },
      { id: '2', date: '2026-10-27', at: '2026-10-27T09:00:00Z', status: 'absent', dA: 0, dT: 1 },
      { id: '3', date: '2026-10-28', at: '2026-10-28T09:00:00Z', status: 'present', dA: 1, dT: 1 },
      { id: '4', date: '2026-10-29', at: '2026-10-29T09:00:00Z', status: 'cancelled', dA: 0, dT: 0 },
    ] },
    { ...base, id: 'b', log: [
      { id: '5', date: '2026-10-30', at: '2026-10-30T09:00:00Z', status: 'present', dA: 1, dT: 1 },
      { id: '6', date: '2026-10-19', at: '2026-10-19T09:00:00Z', status: 'present', dA: 1, dT: 1 },
    ] },
  ];
  it('streaks', () => {
    expect(streaks(items)).toEqual({ current: 2, best: 2 });
  });
  it('weekly trend', () => {
    const t = weeklyTrend(items, { weeks: 3, today: '2026-11-01', weekStartsOn: 1 });
    expect(t.map(w => w.start)).toEqual(['2026-10-12', '2026-10-19', '2026-10-26']);
    expect(t[0].rate).toBeNull();
    expect(t[1].rate).toBe(100);
    expect(t[2].rate).toBe(75);
  });
  it('weekday breakdown', () => {
    const w = weekdayBreakdown(items, 1);
    expect(w[0]).toMatchObject({ label: 'Mon', attended: 2, total: 2, rate: 100 });
    expect(w[1]).toMatchObject({ label: 'Tue', rate: 0 });
    expect(w[6].rate).toBeNull();
  });
  it('rate', () => {
    expect(attendanceRate(1, 0)).toBe(0);
    expect(formatNum(5.499999)).toBe('5.5');
  });
});

describe('backup', () => {
  it('round-trips', () => {
    const backup = JSON.stringify(makeBackup([{ ...base }], { theme: 'dark', defaultTarget: 80 }));
    const { items, settings } = parseBackup(backup, ['amber'], { theme: 'system', defaultTarget: 75 });
    expect(items).toHaveLength(1);
    expect(settings).toMatchObject({ theme: 'dark', defaultTarget: 80 });
  });
  it('rejects junk', () => {
    expect(() => parseBackup('nope', [], {})).toThrow(/valid JSON/);
    expect(() => parseBackup('{"a":1}', [], {})).toThrow(/No items/);
  });
  it('csv escapes', () => {
    const csv = toCsv([{ ...base, name: 'A, "B"', attended: 3, total: 4 }], 75);
    expect(csv).toContain('"A, ""B"""');
    expect(csv.split('\n')[0]).toContain('Attendance %');
  });
});
