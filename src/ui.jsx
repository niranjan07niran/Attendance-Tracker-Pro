import React, { useState } from 'react';
import {
  Settings, Plus, Minus, X, Check, Wifi, Percent, Ban, ChevronLeft, ChevronRight,
  ShieldCheck, AlertTriangle, CircleSlash, Users, BarChart3, CalendarDays,
} from 'lucide-react';
import {
  formatNum, attendanceRate, bunkInfo, bunkLabel, monthGrid, shiftMonth,
  toDateKey, fromDateKey, orderedWeekdays, WEEKDAY_LETTER, WEEKDAY_SHORT,
} from './lib/attendance.js';

export function labelClass() {
  return 'text-xs font-semibold uppercase tracking-wide mb-1.5 block t3';
}
export function inputClass() {
  return 'w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none surface-inset input-token';
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDayLabel(dateKey, todayKey = toDateKey()) {
  if (dateKey === todayKey) return 'Today';
  const d = fromDateKey(dateKey);
  const y = fromDateKey(todayKey);
  y.setDate(y.getDate() - 1);
  if (toDateKey(y) === dateKey) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function timeAgo(iso) {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

/** Soft accent-tinted orbs behind everything; this is what the glass blurs. */
export function AmbientBackground({ glow, isDark }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute rounded-full" style={{ top: '-12%', right: '-28%', width: '90%', aspectRatio: '1', background: glow, opacity: isDark ? 0.26 : 0.17, filter: 'blur(70px)' }} />
      <div className="absolute rounded-full" style={{ bottom: '2%', left: '-32%', width: '80%', aspectRatio: '1', background: glow, opacity: isDark ? 0.16 : 0.11, filter: 'blur(80px)' }} />
      <div className="absolute rounded-full" style={{ top: '38%', left: '52%', width: '55%', aspectRatio: '1', background: isDark ? '#57534e' : '#ffffff', opacity: isDark ? 0.22 : 0.55, filter: 'blur(60px)' }} />
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="relative z-10 shrink-0 flex items-center justify-between px-6 pt-3 pb-1 t1">
      <span className="text-xs font-semibold font-display tabular-nums">9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-0.5 h-2.5">
          <div className="w-1 h-1 rounded-sm bg-current" />
          <div className="w-1 h-1.5 rounded-sm bg-current" />
          <div className="w-1 h-2 rounded-sm bg-current" />
          <div className="w-1 h-2.5 rounded-sm bg-current" />
        </div>
        <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />
        <div className="w-6 h-3 rounded-sm border border-current flex items-center p-0.5">
          <div className="w-full h-full rounded-sm bg-current" />
        </div>
      </div>
    </div>
  );
}

export function TopBar({ activeTab, onSettingsClick, accent, userName }) {
  const active = activeTab === 'settings';
  const name = (userName || '').trim();
  return (
    <div className="relative z-10 shrink-0 h-14 flex items-center justify-between gap-3 px-5">
      <div className="min-w-0">
        <div className="font-display font-bold text-lg truncate t1">
          {getGreeting()}{name ? `, ${name}!` : '!'}
        </div>
      </div>
      <button
        onClick={onSettingsClick}
        aria-label="Settings"
        className={`p-2.5 rounded-full shrink-0 transition-colors ${active ? `${accent.solid} text-white` : 'glass t2'}`}
      >
        <Settings className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
      </button>
    </div>
  );
}

/** Branded splash shown on open: covers data load, holds ~0.9s, then fades. */
export function SplashScreen({ accent, isDark, leaving }) {
  return (
    <div className={`absolute inset-0 z-50 app-bg flex flex-col items-center justify-center transition-opacity duration-300 ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <AmbientBackground glow={accent.glow} isDark={isDark} />
      <div className={`relative z-10 splash-pop w-20 h-20 rounded-3xl flex items-center justify-center text-white ${accent.solid}`} style={{ boxShadow: `0 12px 40px ${accent.glow}66` }}>
        <Percent className="w-9 h-9" strokeWidth={2.5} />
      </div>
      <h1 className="relative z-10 splash-rise font-display font-bold text-3xl mt-5 t1">Tally Pro</h1>
      <p className="relative z-10 splash-rise text-sm mt-1 t3">Attendance, counted beautifully</p>
    </div>
  );
}

/** First-run onboarding: name + attendance target. */
export function OnboardingScreen({ accent, isDark, onComplete, initialTarget = 75 }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState(initialTarget);
  const canContinue = name.trim().length > 0;
  function submit() {
    if (canContinue) onComplete(name.trim(), target);
  }
  return (
    <div className="absolute inset-0 z-50 app-bg flex flex-col justify-center px-6">
      <AmbientBackground glow={accent.glow} isDark={isDark} />
      <div className="relative z-10 w-full glass rounded-3xl p-6 splash-pop">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 ${accent.solid}`} style={{ boxShadow: `0 8px 28px ${accent.glow}55` }}>
          <Percent className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <h1 className="font-display font-bold text-2xl t1">Welcome to Tally Pro</h1>
        <p className="text-sm mt-1 mb-5 t2">Two quick things and you're set.</p>
        <label className={labelClass()}>Your name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="e.g. Priya"
          maxLength={24}
          autoFocus
          className={inputClass()}
        />
        <label className={labelClass() + ' mt-4'}>Minimum attendance you need</label>
        <TargetPicker value={target} onChange={setTarget} accent={accent} />
        <p className="text-xs mt-2 t3">We'll tell you how many classes you can safely skip, or how many you need to attend.</p>
        <button
          onClick={submit}
          disabled={!canContinue}
          className={`w-full mt-5 py-3 rounded-full font-semibold text-sm text-white transition-opacity disabled:opacity-40 ${accent.solid}`}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

export function TargetPicker({ value, onChange, accent }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: accent.glow }}
          aria-label="Target attendance percent"
        />
        <span className="font-display font-bold text-lg tabular-nums w-14 text-right t1">{value}%</span>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 min-w-0 flex-1 rounded-full transition-colors ${active ? 'surface-inset t1' : 't3'}`} aria-label={label} aria-current={active ? 'page' : undefined}>
      <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
      <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}

/** Floating glass dock - the signature Liquid Glass element. */
export function BottomNav({ activeTab, onTabChange, onAddClick, accent }) {
  return (
    <div className="absolute bottom-4 inset-x-4 z-30">
      <div className="glass rounded-full flex items-center justify-around gap-1 px-2 py-2">
        <NavButton icon={CalendarDays} label="Today" active={activeTab === 'today'} onClick={() => onTabChange('today')} />
        <NavButton icon={Users} label="Items" active={activeTab === 'items'} onClick={() => onTabChange('items')} />
        <button
          onClick={onAddClick}
          aria-label="Add new item"
          className={`flex items-center justify-center w-12 h-12 shrink-0 rounded-full text-white active:scale-95 transition-transform ${accent.solid}`}
          style={{ boxShadow: `0 6px 20px ${accent.glow}55` }}
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <NavButton icon={BarChart3} label="Stats" active={activeTab === 'stats'} onClick={() => onTabChange('stats')} />
      </div>
    </div>
  );
}

export function Sheet({ isOpen, onClose, title, children, footer }) {
  return (
    <div className={`absolute inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div onClick={onClose} className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-40' : 'opacity-0'}`} />
      <div role="dialog" aria-label={title} className={`absolute inset-x-0 bottom-0 top-16 rounded-t-3xl glass-strong flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="relative shrink-0 flex items-center justify-between px-5 pt-5 pb-3 hairline-b">
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 rounded-full track-bg" />
          <h2 className="font-display font-semibold text-lg t1">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full surface-inset t2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && <div className="shrink-0 px-5 py-4 hairline-t">{footer}</div>}
      </div>
    </div>
  );
}

export function ActionSheet({ isOpen, onClose, title, options }) {
  return (
    <div className={`absolute inset-0 z-40 flex items-end ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div onClick={onClose} className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-40' : 'opacity-0'}`} />
      <div className={`relative w-full max-h-[28rem] overflow-y-auto rounded-t-3xl glass-strong pb-6 pt-2 px-3 transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-10 h-1 rounded-full mx-auto mb-3 track-bg" />
        {title && <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide t3">{title}</div>}
        <div className="flex flex-col gap-0.5">
          {(options || []).map((opt, idx) => {
            const OptIcon = opt.icon;
            return (
              <button
                key={idx}
                onClick={opt.onClick}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors ${opt.destructive ? 'text-red-500' : 't1'} ${opt.active ? 'surface-inset' : ''}`}
              >
                {OptIcon && <OptIcon className="w-4 h-4 shrink-0" />}
                <span className="font-medium text-sm flex-1">{opt.label}</span>
                {opt.active && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm = () => {}, title = '', message = '', confirmLabel = 'Confirm', destructive = false, isDark }) {
  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-6 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div onClick={onClose} className={`absolute inset-0 bg-black transition-opacity duration-200 ${isOpen ? 'opacity-40' : 'opacity-0'}`} />
      <div role="alertdialog" className={`relative w-full max-w-xs rounded-3xl glass-strong p-5 transition-all duration-200 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <h3 className="font-display font-semibold text-lg mb-1.5 t1">{title}</h3>
        <p className="text-sm mb-5 t2">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full font-medium text-sm surface-inset t1">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 py-2.5 rounded-full font-medium text-sm text-white ${destructive ? 'bg-red-600' : isDark ? 'bg-stone-700' : 'bg-stone-900'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/** Toast with an optional Undo action. */
export function Toast({ toast, onUndo }) {
  const visible = !!(toast && toast.message);
  return (
    <div className={`absolute left-0 right-0 bottom-24 flex justify-center px-4 z-50 pointer-events-none transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`} role="status" aria-live="polite">
      <div className={`flex items-center gap-3 pl-4 ${toast && toast.undo ? 'pr-1.5' : 'pr-4'} py-1.5 rounded-full glass-strong text-sm font-medium t1 ${visible ? 'pointer-events-auto' : ''}`}>
        <span className="py-1">{toast ? toast.message : ''}</span>
        {toast && toast.undo && (
          <button onClick={onUndo} className="px-3 py-1 rounded-full surface-inset text-sm font-semibold t1">Undo</button>
        )}
      </div>
    </div>
  );
}

export function ItemAvatar({ item, colorClass, size = 'md' }) {
  const sizeClasses = { sm: 'w-9 h-9 text-base', md: 'w-11 h-11 text-lg', lg: 'w-16 h-16 text-3xl' };
  return (
    <div className={`shrink-0 rounded-full flex items-center justify-center text-white font-semibold ${colorClass} ${sizeClasses[size]}`}>
      {item.emoji ? <span>{item.emoji}</span> : <span>{item.name.charAt(0).toUpperCase()}</span>}
    </div>
  );
}

const COUNTER_SIZE_MAP = {
  sm: { btn: 'w-7 h-7', icon: 'w-3.5 h-3.5', numText: 'text-sm' },
  md: { btn: 'w-9 h-9', icon: 'w-4 h-4', numText: 'text-base' },
};

/** +/- control. + = attended a class (step credit), - = correct attended down. */
export function CounterControl({ attended, total, onDecrement, onIncrement, colorSolid, size = 'md' }) {
  const s = COUNTER_SIZE_MAP[size] || COUNTER_SIZE_MAP.md;
  const btnBase = `flex items-center justify-center rounded-full transition-transform active:scale-90 shrink-0 ${s.btn}`;
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDecrement} disabled={attended <= 0} aria-label="Decrease attended" className={`${btnBase} surface-inset t2 disabled:opacity-40 disabled:cursor-not-allowed`}>
        <Minus className={s.icon} strokeWidth={2.5} />
      </button>
      <span className={`min-w-max text-center font-display font-bold tabular-nums whitespace-nowrap px-0.5 ${s.numText} t1`}>
        {formatNum(attended)}<span className="t3">/{formatNum(total)}</span>
      </span>
      <button onClick={onIncrement} aria-label="Mark attended" className={`${btnBase} ${colorSolid} text-white`}>
        <Plus className={s.icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* Signature element: split-flap / odometer digit tiles. */
function OdometerDigitRow({ text, isDark, muted }) {
  const chars = String(text).split('');
  const bg = muted ? (isDark ? 'bg-stone-800' : 'bg-stone-200') : (isDark ? 'bg-stone-950' : 'bg-stone-900');
  const fg = muted ? 'text-stone-500' : 'text-white';
  const dotColor = muted ? (isDark ? 'bg-stone-500' : 'bg-stone-400') : 'bg-white';
  return (
    <div className="flex gap-1">
      {chars.map((ch, i) => (
        ch === '.' ? (
          <div key={i} className="w-2 h-12 flex items-end justify-center pb-3">
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          </div>
        ) : (
          <div key={i} className={`relative w-9 h-12 rounded-lg flex items-center justify-center font-display font-bold text-2xl tabular-nums overflow-hidden ${fg} ${bg}`}>
            {ch}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-black opacity-30" />
            <div className="absolute left-0 right-0 top-0 h-1/2 bg-white opacity-5" />
          </div>
        )
      ))}
    </div>
  );
}

export function OdometerFraction({ attended, total, isDark }) {
  return (
    <div className="flex items-end gap-2">
      <OdometerDigitRow text={formatNum(attended)} isDark={isDark} muted={false} />
      <span className="font-display font-bold text-2xl pb-1.5 t3">/</span>
      <OdometerDigitRow text={formatNum(total)} isDark={isDark} muted={true} />
    </div>
  );
}

export function CategoryChip({ label, active, onClick, accentSolid }) {
  return (
    <button onClick={onClick} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? `${accentSolid} text-white` : 'glass t2'}`}>
      {label}
    </button>
  );
}

export function StatCard({ label, value, icon: Icon, colorText, sub }) {
  return (
    <div className="rounded-2xl glass p-3 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium t3">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${colorText}`} />}
      </div>
      <div className="font-display font-bold text-xl tabular-nums truncate t1">{value}</div>
      {sub && <div className="text-xs mt-0.5 truncate t3">{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, accentSolid }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-3xl surface-inset flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 t3" />
      </div>
      <h3 className="font-display font-semibold text-base mb-1 t1">{title}</h3>
      <p className="text-sm mb-5 max-w-xs t3">{message}</p>
      {actionLabel && (
        <button onClick={onAction} className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white ${accentSolid}`}>{actionLabel}</button>
      )}
    </div>
  );
}

export function ToggleSwitch({ checked, onChange, accentSolid, label = 'Toggle' }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? accentSolid : 'track-bg'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex p-1 rounded-full gap-1 surface-inset">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 px-2 rounded-full text-sm font-medium transition-colors ${value === opt.value ? 'seg-thumb t1' : 't3'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsSection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 px-1 t3">{title}</h3>
      <div className="rounded-3xl overflow-hidden glass divide-y divide-token">
        {children}
      </div>
    </div>
  );
}

export function SettingsRow({ label, description, control }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium t1">{label}</div>
        {description && <div className="text-xs mt-0.5 t3">{description}</div>}
      </div>
      {control}
    </div>
  );
}

/* ---------------------------- New: attendance UI ---------------------- */

/** Safe-to-skip / attend-N-more pill. Icon + text, never color alone. */
export function BunkPill({ attended, total, target, size = 'sm' }) {
  const info = bunkInfo(attended, total, target);
  const label = bunkLabel(info);
  let cls = 'st-cancelled';
  let Icon = CircleSlash;
  if (info.kind === 'safe') {
    cls = info.canSkip === 0 ? 'st-warn' : 'st-present';
    Icon = info.canSkip === 0 ? AlertTriangle : ShieldCheck;
  } else if (info.kind === 'behind' || info.kind === 'impossible') {
    cls = 'st-absent';
    Icon = AlertTriangle;
  }
  const sz = size === 'lg' ? 'text-sm px-3 py-1.5 gap-1.5' : 'text-xs px-2 py-0.5 gap-1';
  return (
    <span className={`inline-flex items-center rounded-full font-semibold max-w-full ${sz} ${cls}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4 shrink-0' : 'w-3 h-3 shrink-0'} strokeWidth={2.5} />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function isAtRisk(item, target) {
  const info = bunkInfo(item.attended, item.total, target);
  return info.kind === 'behind' || info.kind === 'impossible';
}

/** SVG progress ring with an optional target tick. */
export function ProgressRing({ value, target, size = 120, stroke = 10, color, label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const tAngle = target != null ? (Math.max(0, Math.min(100, target)) / 100) * 2 * Math.PI - Math.PI / 2 : null;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(pct)} percent${target != null ? `, target ${target} percent` : ''}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track-bg)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {tAngle != null && (
          <line
            x1={size / 2 + (r - stroke / 2 - 3) * Math.cos(tAngle)} y1={size / 2 + (r - stroke / 2 - 3) * Math.sin(tAngle)}
            x2={size / 2 + (r + stroke / 2 + 3) * Math.cos(tAngle)} y2={size / 2 + (r + stroke / 2 + 3) * Math.sin(tAngle)}
            stroke="var(--t1)" strokeWidth="2" strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-display font-bold text-2xl tabular-nums t1">{label != null ? label : `${Math.round(pct)}%`}</div>
        {sub && <div className="text-xs t3">{sub}</div>}
      </div>
    </div>
  );
}

const MARK_META = {
  present: { label: 'Present', short: 'P', Icon: Check, cls: 'st-present' },
  absent: { label: 'Absent', short: 'A', Icon: X, cls: 'st-absent' },
  cancelled: { label: 'Cancelled', short: 'C', Icon: Ban, cls: 'st-cancelled' },
  adjust: { label: 'Adjusted', short: '±', Icon: Minus, cls: 'st-cancelled' },
};
export function markMeta(status) { return MARK_META[status] || MARK_META.adjust; }

/** Present / Absent / Cancelled triplet. */
export function MarkButtons({ onMark, size = 'md', showLabels = true }) {
  const pad = size === 'sm' ? 'h-9 px-3 text-xs gap-1' : 'h-11 px-3 text-sm gap-1.5';
  return (
    <div className="flex items-stretch gap-2 w-full">
      {['present', 'absent', 'cancelled'].map(st => {
        const m = MARK_META[st];
        return (
          <button
            key={st}
            onClick={() => onMark(st)}
            aria-label={`Mark ${m.label.toLowerCase()}`}
            className={`flex-1 flex items-center justify-center rounded-full font-semibold transition-transform active:scale-95 ${pad} ${m.cls}`}
          >
            <m.Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={2.75} />
            {showLabels && <span>{size === 'sm' && st === 'cancelled' ? 'Off' : m.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Tiny chips summarising the marks already made for a day. */
export function DayMarks({ entries, onRemove }) {
  const visible = entries.filter(e => e.status !== 'adjust');
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(e => {
        const m = markMeta(e.status);
        return (
          <button
            key={e.id}
            onClick={onRemove ? () => onRemove(e.id) : undefined}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.cls}`}
            aria-label={`${m.label}${onRemove ? ', tap to remove' : ''}`}
          >
            <m.Icon className="w-3 h-3" strokeWidth={3} />
            {m.label}{e.status === 'present' && e.dA !== 1 ? ` ${formatNum(e.dA)}` : ''}
            {onRemove && <X className="w-3 h-3 opacity-60" />}
          </button>
        );
      })}
    </div>
  );
}

/** Month calendar showing each day's marks. Tap a day to select it. */
export function MonthCalendar({ month, onMonthChange, statusMap, selected, onSelect, weekStartsOn = 1, scheduleDays = [], todayKey = toDateKey() }) {
  const days = monthGrid(month, weekStartsOn);
  const [y, m] = month.split('-').map(Number);
  const title = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => onMonthChange(shiftMonth(month, -1))} aria-label="Previous month" className="p-1.5 rounded-full surface-inset t2"><ChevronLeft className="w-4 h-4" /></button>
        <div className="font-display font-semibold text-sm t1">{title}</div>
        <button onClick={() => onMonthChange(shiftMonth(month, 1))} aria-label="Next month" className="p-1.5 rounded-full surface-inset t2"><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {orderedWeekdays(weekStartsOn).map(d => (
          <div key={d} className="text-center text-xs font-semibold t3">{WEEKDAY_LETTER[d]}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(key => {
          const inMonth = key.slice(0, 7) === month;
          const s = statusMap[key];
          const isFuture = key > todayKey;
          const scheduled = scheduleDays.includes(fromDateKey(key).getDay());
          const isSel = key === selected;
          return (
            <button
              key={key}
              disabled={isFuture}
              onClick={() => onSelect(key)}
              aria-label={`${key}${s ? `: ${s.present} present, ${s.absent} absent, ${s.cancelled} cancelled` : ''}`}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs tabular-nums transition-colors ${inMonth ? 't1' : 't3 opacity-40'} ${isFuture ? 'opacity-30' : ''} ${isSel ? 'ring-2 ring-current' : ''} ${key === todayKey ? 'font-bold' : 'font-medium'} ${scheduled && inMonth ? 'surface-inset' : ''}`}
            >
              {Number(key.slice(8))}
              {s && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {s.present > 0 && <span className="w-1.5 h-1.5 rounded-full fill-present" />}
                  {s.absent > 0 && <span className="w-1.5 h-1.5 rounded-full fill-absent" />}
                  {s.cancelled > 0 && <span className="w-1.5 h-1.5 rounded-full fill-cancel" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3 mt-2 text-xs t3">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full fill-present" />Present</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full fill-absent" />Absent</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full fill-cancel" />Cancelled</span>
      </div>
    </div>
  );
}

/** Weekday chip picker for the class schedule. */
export function WeekdayPicker({ value, onChange, weekStartsOn = 1, activeClass }) {
  const set = new Set(value || []);
  return (
    <div className="flex gap-1.5">
      {orderedWeekdays(weekStartsOn).map(d => {
        const on = set.has(d);
        return (
          <button
            key={d}
            onClick={() => {
              const next = new Set(set);
              if (on) next.delete(d); else next.add(d);
              onChange([...next].sort());
            }}
            aria-pressed={on}
            aria-label={WEEKDAY_SHORT[d]}
            className={`flex-1 h-10 rounded-full text-xs font-semibold transition-colors ${on ? `${activeClass} text-white` : 'surface-inset t2'}`}
          >
            {WEEKDAY_SHORT[d].slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Single-series vertical bar chart (0-100%), with a dashed target line.
 * Tap/hover a bar to read its exact value; null values render as an empty
 * slot with a dash so "no data" is never confused with 0%.
 */
export function PercentBarChart({ data, target, colorHex, height = 120, ariaLabel }) {
  const [active, setActive] = useState(null);
  const shown = active != null ? data[active] : null;
  return (
    <div>
      <div className="h-5 mb-1 text-xs t2 tabular-nums" aria-live="polite">
        {shown ? `${shown.tooltip}: ${shown.value == null ? 'no classes' : `${Math.round(shown.value)}%`}${shown.detail ? ` · ${shown.detail}` : ''}` : <span className="t3">Tap a bar for details</span>}
      </div>
      <div className="relative" style={{ height }} role="img" aria-label={ariaLabel}>
        {[0, 50, 100].map(g => (
          <div key={g} className="absolute left-0 right-0 hairline-t" style={{ bottom: `${g}%` }}>
            <span className="absolute -top-2 right-0 text-[10px] leading-none t3 bg-transparent">{g}</span>
          </div>
        ))}
        {target != null && (
          <div className="absolute left-0 right-6 border-t-2 border-dashed" style={{ bottom: `${target}%`, borderColor: 'var(--t3)' }} aria-hidden="true" />
        )}
        <div className="absolute inset-0 right-6 flex items-end gap-1.5">
          {data.map((d, i) => (
            <button
              key={i}
              onClick={() => setActive(active === i ? null : i)}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className="relative flex-1 h-full flex items-end justify-center"
              aria-label={`${d.tooltip}: ${d.value == null ? 'no classes' : `${Math.round(d.value)} percent`}`}
            >
              {d.value == null ? (
                <span className="text-xs t3 mb-1">–</span>
              ) : (
                <span
                  className="block w-full max-w-[22px] rounded-t transition-all duration-500"
                  style={{ height: `${Math.max(2, d.value)}%`, background: colorHex, opacity: active == null || active === i ? 1 : 0.45 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 mt-1.5 pr-6">
        {data.map((d, i) => (
          <div key={i} className={`flex-1 text-center text-[10px] leading-tight truncate ${active === i ? 't1 font-semibold' : 't3'}`}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

export function rateOf(item) { return attendanceRate(item.attended, item.total); }
