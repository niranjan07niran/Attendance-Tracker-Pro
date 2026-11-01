import React, { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Pencil, RotateCcw, Trash2, Check, X, History, StickyNote } from 'lucide-react';
import {
  attendanceRate, formatNum, clampAttended, clampTotal, toDateKey, dayStatusMap,
  entriesOn, effectiveTarget, bunkInfo, WEEKDAY_SHORT, fromDateKey,
} from './lib/attendance.js';
import { PALETTE, PALETTE_KEYS, EMOJI_OPTIONS, TARGET_PRESETS } from './theme.js';
import {
  Sheet, ItemAvatar, OdometerFraction, BunkPill, MarkButtons, DayMarks, MonthCalendar,
  WeekdayPicker, labelClass, inputClass, formatShortDate, timeAgo, formatDayLabel, markMeta,
  ProgressRing,
} from './ui.jsx';

/* ======================================================================= */
/* Detail                                                                   */
/* ======================================================================= */

export function DetailSheet({ item, color, isOpen, onClose, onMark, onRemoveEntry, onIncrement, onDecrement, onSetExact, onEdit, onReset, onDelete, isDark, stepSize, defaultTarget, weekStartsOn }) {
  const todayKey = toDateKey();
  const [attendedValue, setAttendedValue] = useState('0');
  const [totalValue, setTotalValue] = useState('0');
  const [markDate, setMarkDate] = useState(todayKey);
  const [month, setMonth] = useState(todayKey.slice(0, 7));
  const [showAll, setShowAll] = useState(false);
  const itemId = item ? item.id : null;

  useEffect(() => {
    setMarkDate(todayKey);
    setMonth(todayKey.slice(0, 7));
    setShowAll(false);
  }, [itemId, isOpen]);

  useEffect(() => {
    if (item) {
      setAttendedValue(formatNum(item.attended));
      setTotalValue(formatNum(item.total));
    }
  }, [itemId, item ? item.attended : null, item ? item.total : null]);

  const statusMap = useMemo(() => (item ? dayStatusMap(item) : {}), [item]);

  function handleSetExact() {
    if (!item) return;
    const a = parseFloat(attendedValue);
    const t = parseFloat(totalValue);
    if (!isNaN(a) && !isNaN(t) && a >= 0 && t >= 0) {
      onSetExact(item.id, a, t);
    } else {
      setAttendedValue(formatNum(item.attended));
      setTotalValue(formatNum(item.total));
    }
  }

  const rate = item ? attendanceRate(item.attended, item.total) : 0;
  const target = item ? effectiveTarget(item, defaultTarget) : defaultTarget;
  const history = item ? [...(item.log || [])].reverse() : [];
  const visibleHistory = showAll ? history : history.slice(0, 8);
  const dayEntries = item ? entriesOn(item, markDate) : [];
  const info = item ? bunkInfo(item.attended, item.total, target) : null;

  return (
    <Sheet isOpen={isOpen && !!item} onClose={onClose} title="Item Details">
      {item && (
        <React.Fragment>
          <div className="flex flex-col items-center text-center pt-1 pb-5">
            <ItemAvatar item={item} colorClass={color.avatarBg} size="lg" />
            <h3 className="font-display font-bold text-xl mt-3 t1">{item.name}</h3>
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1.5">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isDark ? color.badgeDark : color.badgeLight}`}>{item.category}</span>
              {(item.schedule || []).length > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full surface-inset t2">{item.schedule.map(d => WEEKDAY_SHORT[d]).join(' · ')}</span>
              )}
            </div>
            <div className="mt-5">
              <OdometerFraction attended={item.attended} total={item.total} isDark={isDark} />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => onDecrement(item.id)} disabled={item.attended <= 0} aria-label="Decrease attended" className="flex items-center justify-center w-9 h-9 rounded-full surface-inset t2 transition-transform active:scale-90 disabled:opacity-40">
                <Minus className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <div className={`text-sm font-semibold ${color.text} ${isDark ? 'brightness-150' : ''}`}>{Math.round(rate)}% · target {target}%</div>
              <button onClick={() => onIncrement(item.id)} aria-label={`Attended, plus ${formatNum(stepSize)}`} className={`flex items-center justify-center w-9 h-9 rounded-full text-white transition-transform active:scale-90 ${color.solid}`}>
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="mt-3"><BunkPill attended={item.attended} total={item.total} target={target} size="lg" /></div>
          </div>

          {info && info.kind === 'safe' && Number.isFinite(info.canSkip) && (
            <div className="grid grid-cols-2 gap-2 mb-5 text-center">
              <div className="rounded-2xl surface-inset p-3">
                <div className="text-xs t3">If you skip the next one</div>
                <div className="font-display font-bold text-lg tabular-nums t1">{Math.round(attendanceRate(item.attended, item.total + 1) * 10) / 10}%</div>
              </div>
              <div className="rounded-2xl surface-inset p-3">
                <div className="text-xs t3">If you attend the next one</div>
                <div className="font-display font-bold text-lg tabular-nums t1">{Math.round(attendanceRate(item.attended + 1, item.total + 1) * 10) / 10}%</div>
              </div>
            </div>
          )}

          <div className="rounded-3xl surface-inset p-3.5 mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide t3">Mark for</span>
              <span className="text-sm font-semibold t1">{formatDayLabel(markDate, todayKey)}</span>
            </div>
            <MarkButtons onMark={(st) => onMark(item.id, st, markDate)} />
            {dayEntries.some(e => e.status !== 'adjust') && (
              <div className="mt-2.5"><DayMarks entries={dayEntries} onRemove={(eid) => onRemoveEntry(item.id, eid)} /></div>
            )}
          </div>

          <div className="mb-5">
            <MonthCalendar
              month={month}
              onMonthChange={setMonth}
              statusMap={statusMap}
              selected={markDate}
              onSelect={setMarkDate}
              weekStartsOn={weekStartsOn}
              scheduleDays={item.schedule || []}
              todayKey={todayKey}
            />
            <p className="text-xs text-center mt-1 t3">Tap a past day to mark or fix it.</p>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass() + ' mb-0'}>History</label>
              {history.length > 8 && (
                <button onClick={() => setShowAll(v => !v)} className="text-xs font-semibold t2">{showAll ? 'Show less' : `Show all ${history.length}`}</button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="rounded-2xl surface-inset px-4 py-4 text-sm text-center t3 flex items-center justify-center gap-2"><History className="w-4 h-4" />No marks yet - history starts with your next one.</div>
            ) : (
              <div className="rounded-2xl surface-inset divide-y divide-token">
                {visibleHistory.map(e => {
                  const m = markMeta(e.status);
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-3 py-2">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.cls}`}><m.Icon className="w-3.5 h-3.5" strokeWidth={2.75} /></span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium t1">{m.label}{e.status === 'adjust' || (e.status === 'present' && e.dA !== 1) ? ` (${e.dA >= 0 ? '+' : ''}${formatNum(e.dA)}${e.dT ? ` / +${formatNum(e.dT)}` : ''})` : ''}</div>
                        <div className="text-xs t3">{fromDateKey(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                      <button onClick={() => onRemoveEntry(item.id, e.id)} aria-label="Remove this mark" className="p-1.5 rounded-full t3"><X className="w-4 h-4" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {item.notes && (
            <div className="mb-5">
              <label className={labelClass()}>Notes</label>
              <div className="rounded-2xl surface-inset px-4 py-3 text-sm whitespace-pre-wrap t2 flex gap-2"><StickyNote className="w-4 h-4 shrink-0 mt-0.5 t3" /><span className="min-w-0">{item.notes}</span></div>
            </div>
          )}

          <div className="mb-5">
            <label className={labelClass()}>Set exact values (attended / total)</label>
            <div className="flex items-center gap-2">
              <input type="number" inputMode="decimal" min="0" step="0.01" value={attendedValue} onChange={e => setAttendedValue(e.target.value)} className={inputClass() + ' flex-1 min-w-0'} aria-label="Attended" />
              <span className="font-display font-bold t3">/</span>
              <input type="number" inputMode="decimal" min="0" step="0.01" value={totalValue} onChange={e => setTotalValue(e.target.value)} className={inputClass() + ' flex-1 min-w-0'} aria-label="Total" />
              <button onClick={handleSetExact} className={`px-4 py-3 rounded-full font-medium text-sm text-white shrink-0 ${color.solid}`}>Set</button>
            </div>
          </div>

          <div className="rounded-3xl surface-inset overflow-hidden mb-4 divide-y divide-token">
            <button onClick={() => onEdit(item)} className="w-full flex items-center gap-3 px-4 py-3 text-left t1">
              <Pencil className="w-4 h-4" /><span className="text-sm font-medium">Edit item</span>
            </button>
            <button onClick={() => onReset(item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left t1">
              <RotateCcw className="w-4 h-4" /><span className="text-sm font-medium">Reset attendance & history</span>
            </button>
            <button onClick={() => onDelete(item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500">
              <Trash2 className="w-4 h-4" /><span className="text-sm font-medium">Delete item</span>
            </button>
          </div>

          <div className="text-xs space-y-1 t3">
            <div>Added {formatShortDate(item.createdAt)}</div>
            <div>Last updated {timeAgo(item.updatedAt)}</div>
          </div>
        </React.Fragment>
      )}
    </Sheet>
  );
}

/* ======================================================================= */
/* Add / Edit                                                               */
/* ======================================================================= */

export function AddItemSheet({ isOpen, onClose, onSave, editingItem, categories, isDark, defaultTarget, weekStartsOn }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState('amber');
  const [attendedInput, setAttendedInput] = useState('0');
  const [totalInput, setTotalInput] = useState('0');
  const [schedule, setSchedule] = useState([]);
  const [target, setTarget] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingItem) {
      const isKnownCategory = categories.includes(editingItem.category);
      setName(editingItem.name);
      setUseCustomCategory(!isKnownCategory);
      setCategory(isKnownCategory ? editingItem.category : (categories[0] || ''));
      setCustomCategory(isKnownCategory ? '' : editingItem.category);
      setEmoji(editingItem.emoji);
      setColor(editingItem.color);
      setAttendedInput(formatNum(editingItem.attended));
      setTotalInput(formatNum(editingItem.total));
      setSchedule(editingItem.schedule || []);
      setTarget(editingItem.target != null ? editingItem.target : null);
      setNotes(editingItem.notes || '');
    } else {
      setName('');
      setCategory(categories[0] || '');
      setCustomCategory('');
      setUseCustomCategory(categories.length === 0);
      setEmoji(EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)]);
      setColor(PALETTE_KEYS[Math.floor(Math.random() * PALETTE_KEYS.length)]);
      setAttendedInput('0');
      setTotalInput('0');
      setSchedule([]);
      setTarget(null);
      setNotes('');
    }
  }, [isOpen, editingItem]);

  const finalCategory = (useCustomCategory ? customCategory : category).trim();
  const canSubmit = name.trim().length > 0 && finalCategory.length > 0;
  const pal = PALETTE[color] || PALETTE.amber;
  const previewTotal = clampTotal(parseFloat(totalInput));
  const previewAttended = clampAttended(parseFloat(attendedInput) || 0, previewTotal);

  function handleSubmit() {
    if (!canSubmit) return;
    onSave({
      name: name.trim(),
      category: finalCategory,
      emoji,
      color,
      attended: previewAttended,
      total: previewTotal,
      schedule,
      target,
      notes: notes.trim(),
    });
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Item' : 'Add New Item'}
      footer={
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 rounded-full font-semibold text-sm text-white transition-opacity disabled:opacity-40 ${pal.solid}`}
        >
          {editingItem ? 'Save Changes' : 'Add Item'}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <ProgressRing value={attendanceRate(previewAttended, previewTotal)} target={target != null ? target : defaultTarget} size={64} stroke={6} color={pal.glow} label={<span className="text-2xl">{emoji}</span>} />
          <div className="flex-1 min-w-0">
            <label className={labelClass()}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Data Structures" maxLength={40} className={inputClass()} />
          </div>
        </div>

        <div>
          <label className={labelClass()}>Category</label>
          {categories.length > 0 && !useCustomCategory && (
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${category === c ? pal.solid + ' text-white' : 'surface-inset t2'}`}>{c}</button>
              ))}
              <button onClick={() => setUseCustomCategory(true)} className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-dashed phone-edge t3">+ New</button>
            </div>
          )}
          {(useCustomCategory || categories.length === 0) && (
            <div className="flex gap-2">
              <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g. Semester 3" maxLength={30} className={inputClass()} />
              {categories.length > 0 && (
                <button onClick={() => setUseCustomCategory(false)} className="px-3.5 rounded-full text-xs font-medium shrink-0 surface-inset t2">Cancel</button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass()}>Class days</label>
          <WeekdayPicker value={schedule} onChange={setSchedule} weekStartsOn={weekStartsOn} activeClass={pal.solid} />
          <p className="text-xs mt-1.5 t3">Scheduled classes appear on the Today tab on these days.</p>
        </div>

        <div>
          <label className={labelClass()}>Attendance target</label>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            <button onClick={() => setTarget(null)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${target == null ? pal.solid + ' text-white' : 'surface-inset t2'}`}>Default ({defaultTarget}%)</button>
            {TARGET_PRESETS.map(t => (
              <button key={t} onClick={() => setTarget(t)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold tabular-nums ${target === t ? pal.solid + ' text-white' : 'surface-inset t2'}`}>{t}%</button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass()}>Classes attended / Total classes so far</label>
          <div className="flex items-center gap-2">
            <input type="number" inputMode="decimal" min="0" step="0.01" value={attendedInput} onChange={e => setAttendedInput(e.target.value)} placeholder="0" className={inputClass() + ' flex-1 min-w-0'} aria-label="Classes attended" />
            <span className="font-display font-bold t3">/</span>
            <input type="number" inputMode="decimal" min="0" step="0.01" value={totalInput} onChange={e => setTotalInput(e.target.value)} placeholder="0" className={inputClass() + ' flex-1 min-w-0'} aria-label="Total classes" />
          </div>
          <div className="flex items-center justify-between mt-1.5 gap-2">
            <p className="text-xs t3">Partial values like 5.5 are fine.</p>
            {previewTotal > 0 && <BunkPill attended={previewAttended} total={previewTotal} target={target != null ? target : defaultTarget} />}
          </div>
        </div>

        <div>
          <label className={labelClass()}>Icon</label>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                onClick={() => setEmoji(em)}
                aria-pressed={emoji === em}
                className={`aspect-square rounded-2xl surface-inset flex items-center justify-center text-lg transition-all ${emoji === em ? `ring-2 ${pal.ring} ring-offset-2 ${isDark ? 'ring-offset-stone-900' : 'ring-offset-white'}` : ''}`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass()}>Color</label>
          <div className="flex flex-wrap gap-2.5">
            {PALETTE_KEYS.map(key => (
              <button
                key={key}
                onClick={() => setColor(key)}
                aria-label={PALETTE[key].name}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${PALETTE[key].avatarBg} ${color === key ? `ring-2 ring-offset-2 ${isDark ? 'ring-white ring-offset-stone-900' : 'ring-stone-900 ring-offset-white'}` : ''}`}
              >
                {color === key && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass()}>Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={300} placeholder="Teacher, room, exam rules…" className={inputClass() + ' resize-none'} />
        </div>
      </div>
    </Sheet>
  );
}
