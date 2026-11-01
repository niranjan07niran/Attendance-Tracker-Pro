import React, { useMemo, useState } from 'react';
import {
  BarChart3, Search, MoreVertical, RotateCcw, Trash2, ArrowUpDown,
  LayoutList, LayoutGrid, Layers, Target, ChevronLeft, ChevronRight,
  ChevronDown, CalendarDays, Flame, AlertTriangle, Download, Upload, FileSpreadsheet,
  Bell, Smartphone, CalendarCheck,
} from 'lucide-react';
import {
  attendanceRate, formatFraction, formatNum, bunkInfo, effectiveTarget, toDateKey,
  weekDays, addDays, weekdayOf, entriesOn, isScheduledOn, streaks, weeklyTrend,
  weekdayBreakdown, hasAnyLog, fromDateKey, WEEKDAY_LETTER, WEEKDAY_SHORT,
} from './lib/attendance.js';
import { PALETTE, PALETTE_KEYS, STEP_SIZE_OPTIONS, colorOf } from './theme.js';
import {
  ItemAvatar, CounterControl, CategoryChip, StatCard, EmptyState, ToggleSwitch,
  SegmentedControl, SettingsSection, SettingsRow, BunkPill, isAtRisk, ProgressRing,
  MarkButtons, DayMarks, PercentBarChart, TargetPicker, inputClass, formatDayLabel,
} from './ui.jsx';

/* ======================================================================= */
/* Today                                                                    */
/* ======================================================================= */

function TodayRow({ item, dateKey, target, onMark, onRemoveEntry, onOpenDetail }) {
  const color = colorOf(item.color);
  const rate = attendanceRate(item.attended, item.total);
  const marks = entriesOn(item, dateKey);
  return (
    <div className="glass rounded-3xl p-3.5">
      <button onClick={() => onOpenDetail(item.id)} className="w-full flex items-center gap-3 text-left mb-3">
        <ItemAvatar item={item} colorClass={color.avatarBg} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium truncate t1">{item.name}</span>
            <span className="font-display font-bold text-sm tabular-nums shrink-0 t1">{Math.round(rate)}%<span className="t3 font-medium text-xs"> · {formatFraction(item.attended, item.total)}</span></span>
          </div>
          <div className="mt-1"><BunkPill attended={item.attended} total={item.total} target={target} /></div>
        </div>
      </button>
      {marks.some(e => e.status !== 'adjust') && (
        <div className="mb-2.5"><DayMarks entries={marks} onRemove={(eid) => onRemoveEntry(item.id, eid)} /></div>
      )}
      <MarkButtons size="sm" onMark={(st) => onMark(item.id, st, dateKey)} />
    </div>
  );
}

export function TodayScreen({ items, dateKey, onDateChange, weekStartsOn, defaultTarget, onMark, onRemoveEntry, onOpenDetail, accent, onAddClick }) {
  const [showOthers, setShowOthers] = useState(false);
  const todayKey = toDateKey();
  const days = weekDays(dateKey, weekStartsOn);
  const anySchedule = items.some(i => (i.schedule || []).length > 0);
  const scheduled = anySchedule ? items.filter(i => isScheduledOn(i, dateKey)) : items;
  const others = anySchedule ? items.filter(i => !isScheduledOn(i, dateKey)) : [];
  const markedCount = scheduled.filter(i => entriesOn(i, dateKey).some(e => e.status !== 'adjust')).length;
  const atRisk = items.filter(i => isAtRisk(i, effectiveTarget(i, defaultTarget)));
  const dateTitle = formatDayLabel(dateKey, todayKey);
  const fullDate = fromDateKey(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (items.length === 0) {
    return (
      <div className="px-5 pt-2 pb-28 screen-in">
        <h1 className="font-display font-bold text-2xl t1">Today</h1>
        <EmptyState icon={CalendarDays} title="Nothing to mark yet" message="Add your subjects or classes, pick the days they meet, and they'll show up here every day." actionLabel="Add your first class" onAction={onAddClick} accentSolid={accent.solid} />
      </div>
    );
  }

  return (
    <div className="px-5 pt-2 pb-28 screen-in">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display font-bold text-2xl t1">{dateTitle}</h1>
          <p className="text-sm mt-0.5 t3 truncate">{dateTitle === 'Today' || dateTitle === 'Yesterday' ? fullDate : fromDateKey(dateKey).getFullYear()}</p>
        </div>
        {dateKey !== todayKey && (
          <button onClick={() => onDateChange(todayKey)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${accent.solid}`}>Jump to today</button>
        )}
      </div>

      <div className="glass rounded-3xl p-2 mb-4 flex items-center gap-1">
        <button onClick={() => onDateChange(addDays(dateKey, -7))} aria-label="Previous week" className="p-1.5 rounded-full t3 shrink-0"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex-1 grid grid-cols-7 gap-1">
          {days.map(k => {
            const sel = k === dateKey;
            const future = k > todayKey;
            const hasMarks = items.some(i => entriesOn(i, k).some(e => e.status !== 'adjust'));
            const hasClass = items.some(i => isScheduledOn(i, k));
            return (
              <button
                key={k}
                disabled={future}
                onClick={() => onDateChange(k)}
                aria-label={fromDateKey(k).toDateString()}
                aria-pressed={sel}
                className={`relative flex flex-col items-center py-1.5 rounded-2xl transition-colors ${sel ? `${accent.solid} text-white` : future ? 't3 opacity-40' : k === todayKey ? 'surface-inset t1' : 't2'}`}
              >
                <span className={`text-[10px] font-semibold ${sel ? 'text-white/80' : 't3'}`}>{WEEKDAY_LETTER[weekdayOf(k)]}</span>
                <span className="font-display font-bold text-sm tabular-nums">{Number(k.slice(8))}</span>
                <span className={`w-1 h-1 rounded-full mt-0.5 ${hasMarks ? (sel ? 'bg-white' : 'fill-present') : hasClass ? (sel ? 'bg-white/50' : 'track-bg') : 'bg-transparent'}`} />
              </button>
            );
          })}
        </div>
        <button onClick={() => onDateChange(addDays(dateKey, 7))} disabled={addDays(days[0], 7) > todayKey} aria-label="Next week" className="p-1.5 rounded-full t3 shrink-0 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {scheduled.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="t2">{markedCount} of {scheduled.length} marked</span>
            {markedCount === scheduled.length && <span className="tx-present">All done ✓</span>}
          </div>
          <div className="h-1.5 rounded-full overflow-hidden track-bg">
            <div className={`h-full rounded-full ${accent.solid} transition-all duration-500`} style={{ width: `${(markedCount / scheduled.length) * 100}%` }} />
          </div>
        </div>
      )}

      {atRisk.length > 0 && (
        <div className="rounded-3xl st-absent px-4 py-3 mb-4 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2.5} />
          <div className="text-sm font-medium min-w-0">
            <span className="font-semibold">{atRisk.length} below target: </span>
            {atRisk.slice(0, 3).map(i => i.name).join(', ')}{atRisk.length > 3 ? ` +${atRisk.length - 3}` : ''}
          </div>
        </div>
      )}

      {!anySchedule && (
        <div className="rounded-3xl surface-inset px-4 py-3 mb-4 text-xs t2">
          <span className="font-semibold t1">Tip:</span> set the days each class meets (Edit item → Class days) and this screen becomes your daily timetable.
        </div>
      )}

      {anySchedule && scheduled.length === 0 && (
        <div className="glass rounded-3xl px-4 py-6 mb-4 text-center">
          <CalendarCheck className="w-6 h-6 mx-auto mb-2 t3" />
          <div className="font-display font-semibold t1">No classes on {WEEKDAY_SHORT[weekdayOf(dateKey)]}</div>
          <div className="text-sm t3">Enjoy the day off, or mark an extra class below.</div>
        </div>
      )}

      <div className="space-y-3">
        {scheduled.map(item => (
          <TodayRow key={item.id} item={item} dateKey={dateKey} target={effectiveTarget(item, defaultTarget)} onMark={onMark} onRemoveEntry={onRemoveEntry} onOpenDetail={onOpenDetail} />
        ))}
      </div>

      {others.length > 0 && (
        <div className="mt-5">
          <button onClick={() => setShowOthers(v => !v)} className="w-full flex items-center justify-between px-1 py-2 text-sm font-semibold t2" aria-expanded={showOthers}>
            <span>Extra / unscheduled classes ({others.length})</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showOthers ? 'rotate-180' : ''}`} />
          </button>
          {showOthers && (
            <div className="space-y-3 mt-1">
              {others.map(item => (
                <TodayRow key={item.id} item={item} dateKey={dateKey} target={effectiveTarget(item, defaultTarget)} onMark={onMark} onRemoveEntry={onRemoveEntry} onOpenDetail={onOpenDetail} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ======================================================================= */
/* Items                                                                    */
/* ======================================================================= */

function ItemRow({ item, target, onIncrement, onDecrement, onOpenDetail, onOpenMenu, compact }) {
  const color = colorOf(item.color);
  const rate = attendanceRate(item.attended, item.total);
  const risk = isAtRisk(item, target);
  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-2' : 'py-3'}`}>
      <button onClick={() => onOpenDetail(item.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <ItemAvatar item={item} colorClass={color.avatarBg} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <div className={`font-medium truncate t1 ${compact ? 'text-sm' : 'text-base'}`}>{item.name}</div>
          <div className={`text-xs truncate ${compact ? '' : 'mb-1'} ${risk ? 'tx-absent font-semibold' : 't3'}`}>
            {risk && <AlertTriangle className="inline w-3 h-3 -mt-0.5 mr-0.5" strokeWidth={2.5} />}
            {Math.round(rate)}%<span className="t3 font-normal"> · {item.category}</span>
          </div>
          {!compact && (
            <div className="relative h-1 rounded-full track-bg">
              <div className={`h-full rounded-full ${color.solid}`} style={{ width: `${Math.max(4, rate)}%` }} />
              <div className="absolute -top-0.5 w-0.5 h-2 rounded-full" style={{ left: `${target}%`, background: 'var(--t2)' }} aria-hidden="true" />
            </div>
          )}
        </div>
      </button>
      <CounterControl attended={item.attended} total={item.total} onDecrement={() => onDecrement(item.id)} onIncrement={() => onIncrement(item.id)} colorSolid={color.solid} size="sm" />
      <button onClick={() => onOpenMenu(item.id)} aria-label="More options" className="p-1.5 rounded-full t3 shrink-0">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
}

function ItemCard({ item, target, onIncrement, onDecrement, onOpenDetail, onOpenMenu }) {
  const color = colorOf(item.color);
  const rate = attendanceRate(item.attended, item.total);
  return (
    <div className="relative rounded-3xl glass p-3 flex flex-col items-center text-center min-w-0">
      <button onClick={() => onOpenMenu(item.id)} aria-label="More options" className="absolute top-2 right-2 p-1 rounded-full t3">
        <MoreVertical className="w-4 h-4" />
      </button>
      <button onClick={() => onOpenDetail(item.id)} className="flex flex-col items-center gap-2 w-full min-w-0">
        <ProgressRing value={rate} target={target} size={64} stroke={6} color={color.glow} label={<span className="text-2xl">{item.emoji}</span>} />
        <div className="min-w-0 w-full">
          <div className="font-medium text-sm truncate t1">{item.name}</div>
          <div className={`text-xs truncate ${isAtRisk(item, target) ? 'tx-absent font-semibold' : 't3'}`}>{Math.round(rate)}% · {item.category}</div>
        </div>
      </button>
      <div className="mt-3">
        <CounterControl attended={item.attended} total={item.total} onDecrement={() => onDecrement(item.id)} onIncrement={() => onIncrement(item.id)} colorSolid={color.solid} size="sm" />
      </div>
    </div>
  );
}

export function ItemsScreen({ items, allCategories, search, onSearchChange, categoryFilter, onCategoryFilterChange, onOpenSortMenu, sortLabel, layout, onLayoutChange, onIncrement, onDecrement, onOpenDetail, onOpenMenu, accent, compact, onAddClick, hasAnyItems, defaultTarget }) {
  return (
    <div className="px-5 pt-2 pb-28 screen-in">
      <div className="mb-4">
        <h1 className="font-display font-bold text-2xl t1">All Items</h1>
        <p className="text-sm mt-0.5 t3">{items.length} tracked · tap + when you attend, − to correct</p>
      </div>

      <div className="glass rounded-full flex items-center gap-2 px-4 py-2.5 mb-3">
        <Search className="w-4 h-4 shrink-0 t3" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by name or category"
          className="bg-transparent outline-none text-sm flex-1 min-w-0 input-token"
          aria-label="Search items"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-3 -mx-5 px-5">
        {allCategories.map(cat => (
          <CategoryChip key={cat} label={cat} active={categoryFilter === cat} onClick={() => onCategoryFilterChange(cat)} accentSolid={accent.solid} />
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={onOpenSortMenu} className="flex items-center gap-1.5 text-sm font-medium t2">
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortLabel}
        </button>
        <div className="flex items-center rounded-full p-1 surface-inset">
          <button onClick={() => onLayoutChange('list')} aria-label="List view" className={`p-1.5 rounded-full ${layout === 'list' ? 'seg-thumb t1' : 't3'}`}>
            <LayoutList className="w-4 h-4" />
          </button>
          <button onClick={() => onLayoutChange('grid')} aria-label="Grid view" className={`p-1.5 rounded-full ${layout === 'grid' ? 'seg-thumb t1' : 't3'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Search}
          title={hasAnyItems ? 'No matches' : 'No items yet'}
          message={hasAnyItems ? 'Try a different search term or category filter.' : 'Add subjects, classes, teams or habits to start tracking attendance.'}
          actionLabel={hasAnyItems ? undefined : 'Add your first item'}
          onAction={onAddClick}
          accentSolid={accent.solid}
        />
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <ItemCard key={item.id} item={item} target={effectiveTarget(item, defaultTarget)} onIncrement={onIncrement} onDecrement={onDecrement} onOpenDetail={onOpenDetail} onOpenMenu={onOpenMenu} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl px-4 divide-y divide-token">
          {items.map(item => (
            <ItemRow key={item.id} item={item} target={effectiveTarget(item, defaultTarget)} onIncrement={onIncrement} onDecrement={onDecrement} onOpenDetail={onOpenDetail} onOpenMenu={onOpenMenu} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ======================================================================= */
/* Stats                                                                    */
/* ======================================================================= */

export function StatsScreen({ items, accent, defaultTarget, weekStartsOn, onOpenDetail }) {
  const todayKey = toDateKey();
  const trend = useMemo(() => weeklyTrend(items, { weeks: 8, today: todayKey, weekStartsOn }), [items, todayKey, weekStartsOn]);
  const byWeekday = useMemo(() => weekdayBreakdown(items, weekStartsOn), [items, weekStartsOn]);
  const streak = useMemo(() => streaks(items), [items]);

  if (items.length === 0) {
    return (
      <div className="px-5 pt-2 pb-28 screen-in">
        <h1 className="font-display font-bold text-2xl mb-4 t1">Statistics</h1>
        <EmptyState icon={BarChart3} title="Nothing to show yet" message="Add and tally some items to see stats here." accentSolid={accent.solid} />
      </div>
    );
  }

  const totalAttended = items.reduce((s, i) => s + i.attended, 0);
  const totalClasses = items.reduce((s, i) => s + i.total, 0);
  const overallRate = attendanceRate(totalAttended, totalClasses);
  const categories = Array.from(new Set(items.map(i => i.category)));
  const withRate = items.map(i => ({ item: i, rate: attendanceRate(i.attended, i.total), target: effectiveTarget(i, defaultTarget) }));
  const atRisk = withRate
    .filter(x => isAtRisk(x.item, x.target))
    .map(x => ({ ...x, info: bunkInfo(x.item.attended, x.item.total, x.target) }))
    .sort((a, b) => (b.info.need || Infinity) - (a.info.need || Infinity));
  const safeSkips = withRate.reduce((s, x) => {
    const info = bunkInfo(x.item.attended, x.item.total, x.target);
    return info.kind === 'safe' && Number.isFinite(info.canSkip) ? s + info.canSkip : s;
  }, 0);
  const topItems = [...withRate].sort((a, b) => b.rate - a.rate).slice(0, 6);
  const categoryStats = categories.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const a = catItems.reduce((s, i) => s + i.attended, 0);
    const t = catItems.reduce((s, i) => s + i.total, 0);
    return { category: cat, count: catItems.length, rate: attendanceRate(a, t), attended: a, total: t };
  }).sort((a, b) => b.rate - a.rate);
  const logged = hasAnyLog(items);
  const fmtShort = k => fromDateKey(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="px-5 pt-2 pb-28 screen-in">
      <h1 className="font-display font-bold text-2xl mb-4 t1">Statistics</h1>

      <div className="glass rounded-3xl p-4 mb-4 flex items-center gap-4">
        <ProgressRing value={overallRate} target={defaultTarget} size={112} stroke={10} color={accent.glow} sub="overall" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide t3">Attended</div>
          <div className="font-display font-bold text-xl tabular-nums t1">{formatFraction(totalAttended, totalClasses)}</div>
          <div className="text-xs mt-2 t3">Target {defaultTarget}% <span aria-hidden="true">(tick on ring)</span></div>
          <div className={`text-sm font-semibold mt-0.5 ${overallRate >= defaultTarget ? 'tx-present' : 'tx-absent'}`}>
            {overallRate >= defaultTarget ? `${Math.round((overallRate - defaultTarget) * 10) / 10} pts above` : `${Math.round((defaultTarget - overallRate) * 10) / 10} pts below`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <StatCard label="At risk" value={atRisk.length} sub={atRisk.length ? 'below their target' : 'all on track'} icon={AlertTriangle} colorText={atRisk.length ? 'tx-absent' : 'tx-present'} />
        <StatCard label="Safe skips" value={safeSkips} sub="across all items" icon={Target} colorText={accent.text} />
        <StatCard label="Present streak" value={streak.current} sub={`best ${streak.best}`} icon={Flame} colorText={accent.text} />
        <StatCard label="Items" value={items.length} sub={`${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`} icon={Layers} colorText={accent.text} />
      </div>

      {atRisk.length > 0 && (
        <div className="glass rounded-3xl p-4 mb-6">
          <h2 className="font-display font-semibold text-base mb-3 t1">Needs attention</h2>
          <div className="divide-y divide-token">
            {atRisk.map(({ item, rate, target }) => (
              <button key={item.id} onClick={() => onOpenDetail(item.id)} className="w-full flex items-center gap-3 py-2.5 text-left">
                <ItemAvatar item={item} colorClass={colorOf(item.color).avatarBg} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate t1">{item.name}</div>
                  <BunkPill attended={item.attended} total={item.total} target={target} />
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display font-bold text-sm tabular-nums tx-absent">{Math.round(rate)}%</div>
                  <div className="text-xs t3">of {target}%</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-3xl p-4 mb-6">
        <h2 className="font-display font-semibold text-base t1">Weekly attendance</h2>
        <p className="text-xs mb-2 t3">Last 8 weeks, from your Present/Absent marks. Dashed line = {defaultTarget}% target.</p>
        {logged ? (
          <PercentBarChart
            ariaLabel="Weekly attendance percent for the last 8 weeks"
            colorHex={accent.glow}
            target={defaultTarget}
            data={trend.map((w, i) => ({
              value: w.rate,
              label: i === trend.length - 1 ? 'This' : fmtShort(w.start).split(' ')[1],
              tooltip: `Week of ${fmtShort(w.start)}`,
              detail: w.total ? `${formatFraction(w.attended, w.total)} classes` : '',
            }))}
          />
        ) : (
          <div className="text-sm py-6 text-center t3">Mark a few classes as Present or Absent on the Today tab and your weekly trend appears here.</div>
        )}
      </div>

      {logged && (
        <div className="glass rounded-3xl p-4 mb-6">
          <h2 className="font-display font-semibold text-base t1">By weekday</h2>
          <p className="text-xs mb-2 t3">Which days you tend to miss.</p>
          <PercentBarChart
            ariaLabel="Attendance percent by weekday"
            colorHex={accent.glow}
            target={defaultTarget}
            height={96}
            data={byWeekday.map(d => ({
              value: d.rate,
              label: d.label.slice(0, 2),
              tooltip: d.label,
              detail: d.total ? `${formatFraction(d.attended, d.total)} classes` : '',
            }))}
          />
        </div>
      )}

      <div className="glass rounded-3xl p-4 mb-6">
        <h2 className="font-display font-semibold text-base mb-3 t1">Top attendance</h2>
        <div className="space-y-3">
          {topItems.map(({ item, rate, target }) => {
            const color = colorOf(item.color);
            return (
              <button key={item.id} onClick={() => onOpenDetail(item.id)} className="block w-full text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate t2">{item.emoji} {item.name}</span>
                  <span className="text-sm font-semibold tabular-nums t1">{Math.round(rate)}%<span className="t3 font-medium"> · {formatFraction(item.attended, item.total)}</span></span>
                </div>
                <div className="relative h-2 rounded-full track-bg">
                  <div className={`h-full rounded-full ${color.solid} transition-all duration-500`} style={{ width: `${Math.max(4, rate)}%` }} />
                  <div className="absolute -top-0.5 w-0.5 h-3 rounded-full" style={{ left: `${target}%`, background: 'var(--t2)' }} aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-3xl p-4">
        <h2 className="font-display font-semibold text-base mb-3 t1">By category</h2>
        <div className="space-y-4">
          {categoryStats.map(cs => (
            <div key={cs.category}>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-sm font-semibold truncate t1">{cs.category}</span>
                <span className="text-xs shrink-0 t3">{cs.count} item{cs.count !== 1 ? 's' : ''} · {Math.round(cs.rate)}% · {formatFraction(cs.attended, cs.total)}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden track-bg">
                <div className={`h-full rounded-full ${accent.solid} transition-all duration-500`} style={{ width: `${Math.max(4, cs.rate)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ======================================================================= */
/* Settings                                                                 */
/* ======================================================================= */

export function SettingsScreen({ settings, onUpdateSettings, onRequestResetAll, onRequestDeleteAll, onExportJson, onExportCsv, onImport, onToggleReminder, onReminderTime, itemCount, overallRate, isDark, isNative }) {
  const accent = colorOf(settings.accentColor);
  return (
    <div className="px-5 pt-2 pb-28 screen-in">
      <h1 className="font-display font-bold text-2xl mb-5 t1">Settings</h1>

      <SettingsSection title="Profile">
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">Your Name</div>
          <input
            key={settings.userName}
            defaultValue={settings.userName}
            maxLength={24}
            placeholder="Your name"
            onBlur={e => { const v = e.target.value.trim(); if (v) onUpdateSettings({ userName: v }); }}
            onKeyDown={e => { if (e.key === 'Enter') { const v = e.target.value.trim(); if (v) onUpdateSettings({ userName: v }); e.target.blur(); } }}
            className={inputClass()}
          />
          <p className="text-xs mt-2 t3">Used for the greeting in the top corner.</p>
        </div>
      </SettingsSection>

      <SettingsSection title="Attendance">
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-1 t1">Default target</div>
          <TargetPicker value={settings.defaultTarget} onChange={v => onUpdateSettings({ defaultTarget: v })} accent={accent} />
          <p className="text-xs mt-1 t3">Used for "safe to skip" maths. Any item can override it.</p>
        </div>
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">"+" button credit</div>
          <SegmentedControl options={STEP_SIZE_OPTIONS} value={settings.stepSize} onChange={v => onUpdateSettings({ stepSize: v })} />
          <p className="text-xs mt-2 t3">Use 0.5 or 0.25 for half- or quarter-class attendance.</p>
        </div>
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">Week starts on</div>
          <SegmentedControl options={[{ value: 1, label: 'Monday' }, { value: 0, label: 'Sunday' }]} value={settings.weekStartsOn} onChange={v => onUpdateSettings({ weekStartsOn: v })} />
        </div>
      </SettingsSection>

      <SettingsSection title="Reminders">
        <SettingsRow
          label="Daily reminder"
          description={isNative ? 'A nudge to mark your attendance' : 'Available in the Android app'}
          control={<ToggleSwitch label="Daily reminder" checked={settings.reminderEnabled} onChange={onToggleReminder} accentSolid={accent.solid} />}
        />
        {settings.reminderEnabled && (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="text-sm font-medium t1 flex items-center gap-2"><Bell className="w-4 h-4 t2" />Remind me at</div>
            <input type="time" value={settings.reminderTime} onChange={e => onReminderTime(e.target.value)} className="rounded-2xl px-3 py-2 text-sm font-semibold outline-none surface-inset input-token" />
          </div>
        )}
      </SettingsSection>

      <SettingsSection title="Appearance">
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">Theme</div>
          <SegmentedControl options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Auto' }]} value={settings.theme} onChange={v => onUpdateSettings({ theme: v })} />
        </div>
        <SettingsRow label="Compact View" description="Tighter spacing in your item list" control={<ToggleSwitch label="Compact view" checked={settings.compact} onChange={v => onUpdateSettings({ compact: v })} accentSolid={accent.solid} />} />
        {isNative && (
          <SettingsRow label="Haptic feedback" description="Vibrate lightly when you mark" control={<ToggleSwitch label="Haptic feedback" checked={settings.haptics} onChange={v => onUpdateSettings({ haptics: v })} accentSolid={accent.solid} />} />
        )}
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">Accent Color</div>
          <div className="flex flex-wrap gap-2.5">
            {PALETTE_KEYS.map(key => (
              <button
                key={key}
                onClick={() => onUpdateSettings({ accentColor: key })}
                aria-label={PALETTE[key].name}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${PALETTE[key].avatarBg} ${settings.accentColor === key ? `ring-2 ring-offset-2 ${isDark ? 'ring-white ring-offset-stone-900' : 'ring-stone-900 ring-offset-white'}` : ''}`}
              >
                {settings.accentColor === key && <span className="text-white text-xs font-bold">✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">Default Layout</div>
          <SegmentedControl options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} value={settings.layout} onChange={v => onUpdateSettings({ layout: v })} />
        </div>
      </SettingsSection>

      <SettingsSection title="Backup & export">
        <button onClick={onExportJson} className="w-full flex items-center gap-3 px-4 py-3 text-left">
          <Download className="w-4 h-4 t2" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium t1">Back up data</div>
            <div className="text-xs t3">Everything, as a .json file you can restore later</div>
          </div>
        </button>
        <button onClick={onImport} className="w-full flex items-center gap-3 px-4 py-3 text-left">
          <Upload className="w-4 h-4 t2" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium t1">Restore from backup</div>
            <div className="text-xs t3">Replaces current items with a .json backup</div>
          </div>
        </button>
        <button onClick={onExportCsv} className="w-full flex items-center gap-3 px-4 py-3 text-left">
          <FileSpreadsheet className="w-4 h-4 t2" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium t1">Export spreadsheet</div>
            <div className="text-xs t3">Summary + full history as .csv (Excel, Sheets)</div>
          </div>
        </button>
      </SettingsSection>

      <SettingsSection title="Danger zone">
        <button onClick={onRequestResetAll} className="w-full flex items-center gap-3 px-4 py-3 text-left">
          <RotateCcw className="w-4 h-4 t2" />
          <span className="text-sm font-medium flex-1 t1">Reset All Attendance</span>
        </button>
        <button onClick={onRequestDeleteAll} className="w-full flex items-center gap-3 px-4 py-3 text-left">
          <Trash2 className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium flex-1 text-red-500">Delete All Items</span>
        </button>
      </SettingsSection>

      <div className="text-center py-4 t3">
        <p className="text-xs">{itemCount} items · {Math.round(overallRate)}% overall attendance</p>
        <p className="text-xs mt-1 inline-flex items-center gap-1"><Smartphone className="w-3 h-3" />Tally Pro · v2.0</p>
      </div>
    </div>
  );
}
