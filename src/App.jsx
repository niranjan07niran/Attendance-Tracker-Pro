import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, BarChart3, Settings, Plus, Minus, X, Search, MoreVertical,
  Pencil, Trash2, RotateCcw, Check, ArrowUpDown, LayoutList, LayoutGrid,
  Layers, Eye, Wifi, Percent, Target,
} from 'lucide-react';

/* ---------------------------------------------------------------------- */
/* Design system - "Liquid Glass" edition                                  */
/*                                                                         */
/* Tokens live as CSS variables scoped by .theme-light / .theme-dark, so   */
/* every surface reads from one palette instead of scattered ternaries:    */
/*   Text:      .t1 (primary) .t2 (secondary) .t3 (tertiary)              */
/*   Materials: .glass (cards, dock) .glass-strong (sheets, dialogs)      */
/*              .surface-inset (controls INSIDE glass - never nest blur)  */
/*   Lines:     .divide-token .hairline-b .hairline-t .phone-edge         */
/* Radius language: rounded-3xl surfaces, rounded-2xl inputs/small cards, */
/* rounded-full for every pill control. Accent stays in PALETTE; each      */
/* color carries a glow hex that drives the ambient orbs + button glow.   */
/* ---------------------------------------------------------------------- */

const DESIGN_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
  .font-body { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }
  .tabular-nums { font-variant-numeric: tabular-nums; }
  * { -webkit-tap-highlight-color: transparent; }

  .theme-light {
    --app-bg: linear-gradient(165deg, #fafaf9 0%, #f5f4f2 45%, #edeae7 100%);
    --t1: #1c1917;
    --t2: #57534e;
    --t3: #78716c;
    --glass-bg: rgba(255, 255, 255, 0.55);
    --glass-bg-strong: rgba(255, 255, 255, 0.78);
    --glass-border: rgba(255, 255, 255, 0.7);
    --glass-inner: rgba(255, 255, 255, 0.85);
    --glass-shadow: 0 8px 32px rgba(28, 25, 23, 0.08);
    --inset-bg: rgba(28, 25, 23, 0.06);
    --track-bg: rgba(28, 25, 23, 0.09);
    --divider: rgba(28, 25, 23, 0.09);
    --seg-thumb: rgba(255, 255, 255, 0.95);
    --seg-shadow: 0 2px 8px rgba(28, 25, 23, 0.14);
  }
  .theme-dark {
    --app-bg: linear-gradient(165deg, #12100f 0%, #181514 55%, #1c1917 100%);
    --t1: #fafaf9;
    --t2: #d6d3d1;
    --t3: #a8a29e;
    --glass-bg: rgba(44, 40, 38, 0.52);
    --glass-bg-strong: rgba(32, 29, 28, 0.82);
    --glass-border: rgba(255, 255, 255, 0.12);
    --glass-inner: rgba(255, 255, 255, 0.09);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    --inset-bg: rgba(255, 255, 255, 0.07);
    --track-bg: rgba(255, 255, 255, 0.1);
    --divider: rgba(255, 255, 255, 0.09);
    --seg-thumb: rgba(255, 255, 255, 0.16);
    --seg-shadow: none;
  }

  .app-bg { background: var(--app-bg); }
  .t1 { color: var(--t1); }
  .t2 { color: var(--t2); }
  .t3 { color: var(--t3); }

  .glass {
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(1.5);
    -webkit-backdrop-filter: blur(18px) saturate(1.5);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-inner);
  }
  .glass-strong {
    background: var(--glass-bg-strong);
    backdrop-filter: blur(28px) saturate(1.6);
    -webkit-backdrop-filter: blur(28px) saturate(1.6);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-inner);
  }
  .surface-inset {
    background: var(--inset-bg);
    border: 1px solid var(--divider);
  }
  .track-bg { background: var(--track-bg); }
  .seg-thumb { background: var(--seg-thumb); box-shadow: var(--seg-shadow); }
  .divide-token > :not([hidden]) ~ :not([hidden]) { border-color: var(--divider); }
  .hairline-b { border-bottom: 1px solid var(--divider); }
  .hairline-t { border-top: 1px solid var(--divider); }
  .phone-edge { border-color: var(--divider); }
  .input-token { color: var(--t1); }
  .input-token::placeholder { color: var(--t3); }

  @keyframes splash-pop {
    0% { opacity: 0; transform: scale(0.7); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes splash-rise {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .splash-pop { animation: splash-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .splash-rise { animation: splash-rise 0.5s ease-out 0.22s both; }
`;

const STORAGE_KEY_DATA = 'tally-app-data';
const STORAGE_KEY_SETTINGS = 'tally-app-settings';

/* Storage adapter: prefers Claude's window.storage when present (artifact
   preview); otherwise falls back to localStorage (standalone web / Android
   APK via Capacitor, where WebView localStorage persists with the app). */
const appStorage = {
  async get(key) {
    if (typeof window !== 'undefined' && window.storage) {
      try { return await window.storage.get(key); } catch (e) { return null; }
    }
    try {
      const value = window.localStorage.getItem(key);
      return value == null ? null : { key, value };
    } catch (e) { return null; }
  },
  async set(key, value) {
    if (typeof window !== 'undefined' && window.storage) {
      try { return await window.storage.set(key, value); } catch (e) { return null; }
    }
    try { window.localStorage.setItem(key, value); return { key, value }; } catch (e) { return null; }
  },
};

/* True when running inside a Capacitor-wrapped native app: hide the fake
   status bar (the phone has a real one) and go full-bleed edge to edge. */
const IS_NATIVE_APP = typeof window !== 'undefined' && !!window.Capacitor;

const PALETTE = {
  amber:   { name: 'Brass',   glow: '#d97706', solid: 'bg-amber-600',   avatarBg: 'bg-amber-500',   text: 'text-amber-700',   badgeLight: 'bg-amber-100 text-amber-800',     badgeDark: 'bg-amber-950 text-amber-300',     ring: 'ring-amber-500' },
  violet:  { name: 'Violet',  glow: '#7c3aed', solid: 'bg-violet-600',  avatarBg: 'bg-violet-500',  text: 'text-violet-700',  badgeLight: 'bg-violet-100 text-violet-800',   badgeDark: 'bg-violet-950 text-violet-300',   ring: 'ring-violet-500' },
  sky:     { name: 'Sky',     glow: '#0284c7', solid: 'bg-sky-600',     avatarBg: 'bg-sky-500',     text: 'text-sky-700',     badgeLight: 'bg-sky-100 text-sky-800',         badgeDark: 'bg-sky-950 text-sky-300',         ring: 'ring-sky-500' },
  emerald: { name: 'Emerald', glow: '#059669', solid: 'bg-emerald-600', avatarBg: 'bg-emerald-500', text: 'text-emerald-700', badgeLight: 'bg-emerald-100 text-emerald-800', badgeDark: 'bg-emerald-950 text-emerald-300', ring: 'ring-emerald-500' },
  rose:    { name: 'Rose',    glow: '#e11d48', solid: 'bg-rose-600',    avatarBg: 'bg-rose-500',    text: 'text-rose-700',    badgeLight: 'bg-rose-100 text-rose-800',       badgeDark: 'bg-rose-950 text-rose-300',       ring: 'ring-rose-500' },
  orange:  { name: 'Orange',  glow: '#ea580c', solid: 'bg-orange-600',  avatarBg: 'bg-orange-500',  text: 'text-orange-700',  badgeLight: 'bg-orange-100 text-orange-800',   badgeDark: 'bg-orange-950 text-orange-300',   ring: 'ring-orange-500' },
  teal:    { name: 'Teal',    glow: '#0d9488', solid: 'bg-teal-600',    avatarBg: 'bg-teal-500',    text: 'text-teal-700',    badgeLight: 'bg-teal-100 text-teal-800',       badgeDark: 'bg-teal-950 text-teal-300',       ring: 'ring-teal-500' },
  pink:    { name: 'Pink',    glow: '#db2777', solid: 'bg-pink-600',    avatarBg: 'bg-pink-500',    text: 'text-pink-700',    badgeLight: 'bg-pink-100 text-pink-800',       badgeDark: 'bg-pink-950 text-pink-300',       ring: 'ring-pink-500' },
};
const PALETTE_KEYS = Object.keys(PALETTE);

const EMOJI_OPTIONS = ['👤', '🧑‍🎓', '👩‍🏫', '🏃', '🧘', '⚽', '🏀', '🎨', '🎵', '📚', '💼', '🔬', '🎯', '🥋', '🌟', '👥', '🎓', '🍎'];

const DEFAULT_SETTINGS = {
  darkMode: false,
  accentColor: 'amber',
  layout: 'list',
  compact: false,
  stepSize: 1,
  userName: '',
};

const STEP_SIZE_OPTIONS = [
  { value: 1, label: '\u00b11' },
  { value: 0.5, label: '\u00b10.5' },
  { value: 0.25, label: '\u00b1\u00bc' },
];

const SORT_OPTIONS_CONFIG = [
  { value: 'name-asc', label: 'Name (A to Z)' },
  { value: 'name-desc', label: 'Name (Z to A)' },
  { value: 'rate-desc', label: 'Attendance (High to Low)' },
  { value: 'rate-asc', label: 'Attendance (Low to High)' },
  { value: 'recent', label: 'Recently Updated' },
];

const NOW_ISO = new Date().toISOString();
const SEED_ITEMS = [
  { id: 'seed-1', name: 'Maya Patel', category: 'Team Standup', emoji: '💼', color: 'amber', attended: 14, total: 16, createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-2', name: 'Jordan Lee', category: 'Team Standup', emoji: '💼', color: 'sky', attended: 12, total: 16, createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-3', name: 'Sam Rivera', category: 'Team Standup', emoji: '💼', color: 'emerald', attended: 15, total: 16, createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-4', name: 'Priya Nair', category: 'Yoga Class', emoji: '🧘', color: 'rose', attended: 5.5, total: 8, createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-5', name: 'Chen Wei', category: 'Yoga Class', emoji: '🧘', color: 'violet', attended: 6.75, total: 9, createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-6', name: 'Aisha Mohammed', category: 'Book Club', emoji: '📚', color: 'teal', attended: 4, total: 6, createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-7', name: 'Diego Fernandez', category: 'Book Club', emoji: '📚', color: 'pink', attended: 5, total: 6, createdAt: NOW_ISO, updatedAt: NOW_ISO },
];

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

let __idCounter = 0;
function generateId() {
  __idCounter += 1;
  return `id_${Date.now().toString(36)}_${__idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Clean decimal formatting: trims float noise, drops trailing zeros (5.50 -> "5.5", 5 -> "5"). */
function formatNum(n) {
  const num = Number(n);
  if (isNaN(num)) return '0';
  const r = Math.round((num + Number.EPSILON) * 100) / 100;
  return String(r);
}

function formatFraction(attended, total) {
  return `${formatNum(attended)}/${formatNum(total)}`;
}

function clampAttended(value, total) {
  if (isNaN(value)) return 0;
  return Math.max(0, Math.min(value, total));
}

function clampTotal(value) {
  if (isNaN(value)) return 0;
  return Math.max(0, value);
}

function attendanceRate(attended, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (attended / total) * 100));
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(iso) {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function labelClass() {
  return 'text-xs font-semibold uppercase tracking-wide mb-1.5 block t3';
}
function inputClass() {
  return 'w-full rounded-2xl px-4 py-3 text-sm font-medium outline-none surface-inset input-token';
}

/* ---------------------------------------------------------------------- */
/* Base UI primitives                                                      */
/* ---------------------------------------------------------------------- */

/** Soft accent-tinted orbs behind everything; this is what the glass blurs. */
function AmbientBackground({ glow, isDark }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute rounded-full" style={{ top: '-12%', right: '-28%', width: '90%', aspectRatio: '1', background: glow, opacity: isDark ? 0.26 : 0.17, filter: 'blur(70px)' }} />
      <div className="absolute rounded-full" style={{ bottom: '2%', left: '-32%', width: '80%', aspectRatio: '1', background: glow, opacity: isDark ? 0.16 : 0.11, filter: 'blur(80px)' }} />
      <div className="absolute rounded-full" style={{ top: '38%', left: '52%', width: '55%', aspectRatio: '1', background: isDark ? '#57534e' : '#ffffff', opacity: isDark ? 0.22 : 0.55, filter: 'blur(60px)' }} />
    </div>
  );
}

function StatusBar() {
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

function TopBar({ activeTab, onSettingsClick, accent, userName }) {
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
function SplashScreen({ accent, isDark, leaving }) {
  return (
    <div className={`absolute inset-0 z-50 app-bg flex flex-col items-center justify-center transition-opacity duration-300 ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <AmbientBackground glow={accent.glow} isDark={isDark} />
      <div className={`relative z-10 splash-pop w-20 h-20 rounded-3xl flex items-center justify-center text-white ${accent.solid}`} style={{ boxShadow: `0 12px 40px ${accent.glow}66` }}>
        <Percent className="w-9 h-9" strokeWidth={2.5} />
      </div>
      <h1 className="relative z-10 splash-rise font-display font-bold text-3xl mt-5 t1">Tally</h1>
      <p className="relative z-10 splash-rise text-sm mt-1 t3">Attendance, counted beautifully</p>
    </div>
  );
}

/** First-run onboarding: asks the user's name, which drives the greeting. */
function OnboardingScreen({ accent, isDark, onComplete }) {
  const [name, setName] = useState('');
  const canContinue = name.trim().length > 0;
  function submit() {
    if (canContinue) onComplete(name.trim());
  }
  return (
    <div className="absolute inset-0 z-50 app-bg flex flex-col justify-center px-6">
      <AmbientBackground glow={accent.glow} isDark={isDark} />
      <div className="relative z-10 w-full glass rounded-3xl p-6 splash-pop">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 ${accent.solid}`} style={{ boxShadow: `0 8px 28px ${accent.glow}55` }}>
          <Percent className="w-7 h-7" strokeWidth={2.5} />
        </div>
        <h1 className="font-display font-bold text-2xl t1">Welcome to Tally</h1>
        <p className="text-sm mt-1 mb-5 t2">What should we call you? Your name personalizes your greeting every time you open the app.</p>
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
        <button
          onClick={submit}
          disabled={!canContinue}
          className={`w-full mt-4 py-3 rounded-full font-semibold text-sm text-white transition-opacity disabled:opacity-40 ${accent.solid}`}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 min-w-0 rounded-full transition-colors ${active ? 'surface-inset t1' : 't3'}`} aria-label={label}>
      <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
      <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}

/** Floating glass dock - the signature Liquid Glass element. */
function BottomNav({ activeTab, onTabChange, onAddClick, accent }) {
  return (
    <div className="absolute bottom-4 inset-x-4 z-30">
      <div className="glass rounded-full flex items-center justify-around px-3 py-2">
        <NavButton icon={Users} label="Items" active={activeTab === 'items'} onClick={() => onTabChange('items')} />
        <button
          onClick={onAddClick}
          aria-label="Add new item"
          className={`flex items-center justify-center w-12 h-12 rounded-full text-white active:scale-95 transition-transform ${accent.solid}`}
          style={{ boxShadow: `0 6px 20px ${accent.glow}55` }}
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
        <NavButton icon={BarChart3} label="Stats" active={activeTab === 'stats'} onClick={() => onTabChange('stats')} />
      </div>
    </div>
  );
}

function Sheet({ isOpen, onClose, title, children, isDark, footer }) {
  return (
    <div className={`absolute inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-40' : 'opacity-0'}`} />
      <div className={`absolute inset-x-0 bottom-0 top-24 rounded-t-3xl glass-strong flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
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

function ActionSheet({ isOpen, onClose, title, options, isDark }) {
  return (
    <div className={`absolute inset-0 z-40 flex items-end ${isOpen ? '' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-40' : 'opacity-0'}`} />
      <div className={`relative w-full max-h-96 overflow-y-auto rounded-t-3xl glass-strong pb-6 pt-2 px-3 transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
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

function ConfirmDialog({ isOpen, onClose, onConfirm = () => {}, title = '', message = '', confirmLabel = 'Confirm', destructive = false, isDark }) {
  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center p-6 ${isOpen ? '' : 'pointer-events-none'}`}>
      <div onClick={onClose} className={`absolute inset-0 bg-black transition-opacity duration-200 ${isOpen ? 'opacity-40' : 'opacity-0'}`} />
      <div className={`relative w-full max-w-xs rounded-3xl glass-strong p-5 transition-all duration-200 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <h3 className="font-display font-semibold text-lg mb-1.5 t1">{title}</h3>
        <p className="text-sm mb-5 t2">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full font-medium text-sm surface-inset t1">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className={`flex-1 py-2.5 rounded-full font-medium text-sm text-white ${destructive ? 'bg-red-600' : 'bg-stone-900'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  return (
    <div className={`absolute left-0 right-0 bottom-24 flex justify-center px-4 z-50 pointer-events-none transition-all duration-300 ${message ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="px-4 py-2.5 rounded-full glass-strong text-sm font-medium t1">
        {message}
      </div>
    </div>
  );
}

function ItemAvatar({ item, colorClass, size = 'md' }) {
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

/** +/- control. Operates on `attended`; `total` is shown as fixed context. */
function CounterControl({ attended, total, onDecrement, onIncrement, colorSolid, size = 'md' }) {
  const s = COUNTER_SIZE_MAP[size] || COUNTER_SIZE_MAP.md;
  const btnBase = `flex items-center justify-center rounded-full transition-transform active:scale-90 shrink-0 ${s.btn}`;
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={onDecrement} disabled={attended <= 0} aria-label="Decrease" className={`${btnBase} surface-inset t2 disabled:opacity-40 disabled:cursor-not-allowed`}>
        <Minus className={s.icon} strokeWidth={2.5} />
      </button>
      <span className={`min-w-max text-center font-display font-bold tabular-nums whitespace-nowrap px-0.5 ${s.numText} t1`}>
        {formatNum(attended)}<span className="t3">/{formatNum(total)}</span>
      </span>
      <button onClick={onIncrement} aria-label="Increase" className={`${btnBase} ${colorSolid} text-white disabled:opacity-40 disabled:cursor-not-allowed`}>
        <Plus className={s.icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/* Signature element: split-flap / odometer digit tiles rendering the full
   attended/total fraction - attended in solid tiles, total in muted tiles.
   Kept intentionally solid so the mechanical counter reads clearly through
   the surrounding glass. */
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

function OdometerFraction({ attended, total, isDark }) {
  return (
    <div className="flex items-end gap-2">
      <OdometerDigitRow text={formatNum(attended)} isDark={isDark} muted={false} />
      <span className="font-display font-bold text-2xl pb-1.5 t3">/</span>
      <OdometerDigitRow text={formatNum(total)} isDark={isDark} muted={true} />
    </div>
  );
}

function CategoryChip({ label, active, onClick, accentSolid }) {
  return (
    <button onClick={onClick} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? `${accentSolid} text-white` : 'glass t2'}`}>
      {label}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, colorText }) {
  return (
    <div className="rounded-2xl glass p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium t3">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${colorText}`} />}
      </div>
      <div className="font-display font-bold text-xl tabular-nums truncate t1">{value}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, actionLabel, onAction, accentSolid }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
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

function ToggleSwitch({ checked, onChange, accentSolid }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-label="Toggle"
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? accentSolid : 'track-bg'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function SegmentedControl({ options, value, onChange }) {
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

function SettingsSection({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 px-1 t3">{title}</h3>
      <div className="rounded-3xl overflow-hidden glass divide-y divide-token">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ label, description, control }) {
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

function ItemRow({ item, color, onIncrement, onDecrement, onOpenDetail, onOpenMenu, compact }) {
  const rate = attendanceRate(item.attended, item.total);
  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-2' : 'py-3'}`}>
      <button onClick={() => onOpenDetail(item.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <ItemAvatar item={item} colorClass={color.avatarBg} size={compact ? 'sm' : 'md'} />
        <div className="min-w-0 flex-1">
          <div className={`font-medium truncate t1 ${compact ? 'text-sm' : 'text-base'}`}>{item.name}</div>
          <div className={`text-xs truncate t3 ${compact ? '' : 'mb-1'}`}>{item.category} &middot; {Math.round(rate)}%</div>
          {!compact && (
            <div className="h-1 rounded-full overflow-hidden track-bg">
              <div className={`h-full rounded-full ${color.solid}`} style={{ width: `${Math.max(4, rate)}%` }} />
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

function ItemCard({ item, color, onIncrement, onDecrement, onOpenDetail, onOpenMenu }) {
  const rate = attendanceRate(item.attended, item.total);
  return (
    <div className="relative rounded-3xl glass p-3 flex flex-col items-center text-center">
      <button onClick={() => onOpenMenu(item.id)} aria-label="More options" className="absolute top-2 right-2 p-1 rounded-full t3">
        <MoreVertical className="w-4 h-4" />
      </button>
      <button onClick={() => onOpenDetail(item.id)} className="flex flex-col items-center gap-2 w-full">
        <ItemAvatar item={item} colorClass={color.avatarBg} size="md" />
        <div className="min-w-0 w-full">
          <div className="font-medium text-sm truncate t1">{item.name}</div>
          <div className="text-xs truncate t3">{item.category} &middot; {Math.round(rate)}%</div>
        </div>
        <div className="w-full h-1 rounded-full overflow-hidden track-bg">
          <div className={`h-full rounded-full ${color.solid}`} style={{ width: `${Math.max(4, rate)}%` }} />
        </div>
      </button>
      <div className="mt-3">
        <CounterControl attended={item.attended} total={item.total} onDecrement={() => onDecrement(item.id)} onIncrement={() => onIncrement(item.id)} colorSolid={color.solid} size="sm" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Screens                                                                 */
/* ---------------------------------------------------------------------- */

function ItemsScreen({ items, allCategories, search, onSearchChange, categoryFilter, onCategoryFilterChange, onOpenSortMenu, sortLabel, layout, onLayoutChange, onIncrement, onDecrement, onOpenDetail, onOpenMenu, isDark, accent, compact, onAddClick, hasAnyItems }) {
  return (
    <div className="px-5 pt-2 pb-28">
      <div className="mb-4">
        <h1 className="font-display font-bold text-2xl t1">All Items</h1>
        <p className="text-sm mt-0.5 t3">{items.length} tracked</p>
      </div>

      <div className="glass rounded-full flex items-center gap-2 px-4 py-2.5 mb-3">
        <Search className="w-4 h-4 shrink-0 t3" />
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search by name or category"
          className="bg-transparent outline-none text-sm flex-1 min-w-0 input-token"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-5 px-5">
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
          message={hasAnyItems ? 'Try a different search term or category filter.' : 'Add people, teams, or habits to start tracking attendance.'}
          actionLabel={hasAnyItems ? undefined : 'Add your first item'}
          onAction={onAddClick}
          accentSolid={accent.solid}
        />
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map(item => (
            <ItemCard key={item.id} item={item} color={PALETTE[item.color] || PALETTE.amber} onIncrement={onIncrement} onDecrement={onDecrement} onOpenDetail={onOpenDetail} onOpenMenu={onOpenMenu} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl px-4 divide-y divide-token">
          {items.map(item => (
            <ItemRow key={item.id} item={item} color={PALETTE[item.color] || PALETTE.amber} onIncrement={onIncrement} onDecrement={onDecrement} onOpenDetail={onOpenDetail} onOpenMenu={onOpenMenu} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatsScreen({ items, isDark, accent }) {
  if (items.length === 0) {
    return (
      <div className="px-5 pt-2 pb-28">
        <h1 className="font-display font-bold text-2xl mb-4 t1">Statistics</h1>
        <EmptyState icon={BarChart3} title="Nothing to show yet" message="Add and tally some items to see stats here." accentSolid={accent.solid} />
      </div>
    );
  }

  const totalAttended = items.reduce((s, i) => s + i.attended, 0);
  const totalClasses = items.reduce((s, i) => s + i.total, 0);
  const overallRate = attendanceRate(totalAttended, totalClasses);
  const totalItems = items.length;
  const categories = Array.from(new Set(items.map(i => i.category)));
  const bestItem = items.reduce((best, i) => {
    const r = attendanceRate(i.attended, i.total);
    return (!best || r > best.rate) ? { item: i, rate: r } : best;
  }, null);
  const topItems = [...items]
    .map(i => ({ item: i, rate: attendanceRate(i.attended, i.total) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 6);
  const categoryStats = categories.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const catAttended = catItems.reduce((s, i) => s + i.attended, 0);
    const catTotal = catItems.reduce((s, i) => s + i.total, 0);
    return { category: cat, count: catItems.length, rate: attendanceRate(catAttended, catTotal), attended: catAttended, total: catTotal };
  }).sort((a, b) => b.rate - a.rate);

  return (
    <div className="px-5 pt-2 pb-28">
      <h1 className="font-display font-bold text-2xl mb-4 t1">Statistics</h1>

      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <StatCard label="Total Items" value={totalItems} icon={Users} colorText={accent.text} />
        <StatCard label="Attendance" value={`${Math.round(overallRate)}%`} icon={Percent} colorText={accent.text} />
        <StatCard label="Categories" value={categories.length} icon={Layers} colorText={accent.text} />
        <StatCard label="Best Attendance" value={bestItem ? bestItem.item.name.split(' ')[0] : '\u2014'} icon={Target} colorText={accent.text} />
      </div>

      <div className="glass rounded-3xl p-4 mb-6">
        <h2 className="font-display font-semibold text-base mb-3 t1">Top Attendance</h2>
        <div className="space-y-3">
          {topItems.map(({ item, rate }) => {
            const color = PALETTE[item.color] || PALETTE.amber;
            return (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate t2">{item.name}</span>
                  <span className="text-sm font-semibold tabular-nums t1">{formatFraction(item.attended, item.total)}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden track-bg">
                  <div className={`h-full rounded-full ${color.solid} transition-all duration-500`} style={{ width: `${Math.max(4, rate)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-3xl p-4">
        <h2 className="font-display font-semibold text-base mb-3 t1">By Category</h2>
        <div className="space-y-4">
          {categoryStats.map(cs => (
            <div key={cs.category}>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-sm font-semibold truncate t1">{cs.category}</span>
                <span className="text-xs shrink-0 t3">{cs.count} item{cs.count !== 1 ? 's' : ''} &middot; {formatFraction(cs.attended, cs.total)}</span>
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

function SettingsScreen({ settings, onUpdateSettings, onRequestResetAll, onRequestDeleteAll, itemCount, overallRate, isDark }) {
  const accent = PALETTE[settings.accentColor] || PALETTE.amber;
  return (
    <div className="px-5 pt-2 pb-28">
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

      <SettingsSection title="Appearance">
        <SettingsRow label="Dark Mode" description="Switch to a darker color scheme" control={<ToggleSwitch checked={settings.darkMode} onChange={v => onUpdateSettings({ darkMode: v })} accentSolid={accent.solid} />} />
        <SettingsRow label="Compact View" description="Tighter spacing in your item list" control={<ToggleSwitch checked={settings.compact} onChange={v => onUpdateSettings({ compact: v })} accentSolid={accent.solid} />} />
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
                {settings.accentColor === key && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">Default Layout</div>
          <SegmentedControl options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} value={settings.layout} onChange={v => onUpdateSettings({ layout: v })} />
        </div>
      </SettingsSection>

      <SettingsSection title="Behavior">
        <div className="px-4 py-3">
          <div className="text-sm font-medium mb-2.5 t1">Counter Step Size</div>
          <SegmentedControl options={STEP_SIZE_OPTIONS} value={settings.stepSize} onChange={v => onUpdateSettings({ stepSize: v })} />
          <p className="text-xs mt-2 t3">Use 0.5 or 0.25 for half- or quarter-class attendance.</p>
        </div>
      </SettingsSection>

      <SettingsSection title="Data">
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
        <p className="text-xs">{itemCount} items &middot; {Math.round(overallRate)}% overall attendance</p>
        <p className="text-xs mt-1">Tally &middot; v1.0</p>
      </div>
    </div>
  );
}

function DetailSheet({ item, color, isOpen, onClose, onIncrement, onDecrement, onSetExact, onEdit, onReset, onDelete, isDark, stepSize }) {
  const [attendedValue, setAttendedValue] = useState('0');
  const [totalValue, setTotalValue] = useState('0');

  useEffect(() => {
    if (item) {
      setAttendedValue(formatNum(item.attended));
      setTotalValue(formatNum(item.total));
    }
  }, [item ? item.id : null, item ? item.attended : null, item ? item.total : null]);

  function handleSetExact() {
    if (!item) return;
    const parsedAttended = parseFloat(attendedValue);
    const parsedTotal = parseFloat(totalValue);
    if (!isNaN(parsedAttended) && !isNaN(parsedTotal) && parsedAttended >= 0 && parsedTotal >= 0) {
      onSetExact(item.id, parsedAttended, parsedTotal);
    } else {
      setAttendedValue(formatNum(item.attended));
      setTotalValue(formatNum(item.total));
    }
  }

  const rate = item ? attendanceRate(item.attended, item.total) : 0;

  return (
    <Sheet isOpen={isOpen && !!item} onClose={onClose} title="Item Details" isDark={isDark}>
      {item && (
        <React.Fragment>
          <div className="flex flex-col items-center text-center pt-2 pb-6">
            <ItemAvatar item={item} colorClass={color.avatarBg} size="lg" />
            <h3 className="font-display font-bold text-xl mt-3 t1">{item.name}</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full mt-1.5 ${isDark ? color.badgeDark : color.badgeLight}`}>{item.category}</span>

            <div className="mt-6">
              <OdometerFraction attended={item.attended} total={item.total} isDark={isDark} />
            </div>
            <div className={`text-sm font-semibold mt-2 ${color.text}`}>{Math.round(rate)}% attendance</div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={() => onDecrement(item.id)} disabled={item.attended <= 0} aria-label="Decrease" className="flex items-center justify-center w-11 h-11 rounded-full surface-inset t2 transition-transform active:scale-90 disabled:opacity-40">
                <Minus className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <span className="text-xs font-medium t3">step {formatNum(stepSize)}</span>
              <button onClick={() => onIncrement(item.id)} aria-label="Increase" className={`flex items-center justify-center w-11 h-11 rounded-full text-white transition-transform active:scale-90 ${color.solid}`}>
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className={labelClass()}>Set exact values (attended / total)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={attendedValue}
                onChange={(e) => setAttendedValue(e.target.value)}
                className={inputClass() + ' flex-1'}
              />
              <span className="font-display font-bold t3">/</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className={inputClass() + ' flex-1'}
              />
              <button onClick={handleSetExact} className={`px-4 py-3 rounded-full font-medium text-sm text-white shrink-0 ${color.solid}`}>Set</button>
            </div>
          </div>

          <div className="rounded-3xl surface-inset overflow-hidden mb-4 divide-y divide-token">
            <button onClick={() => onEdit(item)} className="w-full flex items-center gap-3 px-4 py-3 text-left t1">
              <Pencil className="w-4 h-4" /><span className="text-sm font-medium">Edit item</span>
            </button>
            <button onClick={() => onReset(item.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left t1">
              <RotateCcw className="w-4 h-4" /><span className="text-sm font-medium">Reset attended to 0</span>
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

function AddItemSheet({ isOpen, onClose, onSave, editingItem, categories, isDark }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState('amber');
  const [attendedInput, setAttendedInput] = useState('0');
  const [totalInput, setTotalInput] = useState('0');

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
    } else {
      setName('');
      setCategory(categories[0] || '');
      setCustomCategory('');
      setUseCustomCategory(categories.length === 0);
      setEmoji(EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)]);
      setColor(PALETTE_KEYS[Math.floor(Math.random() * PALETTE_KEYS.length)]);
      setAttendedInput('0');
      setTotalInput('0');
    }
  }, [isOpen, editingItem]);

  const finalCategory = (useCustomCategory ? customCategory : category).trim();
  const canSubmit = name.trim().length > 0 && finalCategory.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    const parsedTotal = clampTotal(parseFloat(totalInput));
    const rawAttended = parseFloat(attendedInput);
    const parsedAttended = clampAttended(isNaN(rawAttended) ? 0 : rawAttended, parsedTotal);
    onSave({
      name: name.trim(),
      category: finalCategory,
      emoji,
      color,
      attended: isNaN(parsedAttended) ? 0 : parsedAttended,
      total: isNaN(parsedTotal) ? 0 : parsedTotal,
    });
  }

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Item' : 'Add New Item'}
      isDark={isDark}
      footer={
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 rounded-full font-semibold text-sm text-white transition-opacity disabled:opacity-40 ${PALETTE[color].solid}`}
        >
          {editingItem ? 'Save Changes' : 'Add Item'}
        </button>
      }
    >
      <div className="space-y-5">
        <div>
          <label className={labelClass()}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jamie Wong" className={inputClass()} />
        </div>

        <div>
          <label className={labelClass()}>Category</label>
          {categories.length > 0 && !useCustomCategory && (
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${category === c ? PALETTE[color].solid + ' text-white' : 'surface-inset t2'}`}>{c}</button>
              ))}
              <button onClick={() => setUseCustomCategory(true)} className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-dashed phone-edge t3">+ New</button>
            </div>
          )}
          {(useCustomCategory || categories.length === 0) && (
            <div className="flex gap-2">
              <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="e.g. Yoga Class" className={inputClass()} />
              {categories.length > 0 && (
                <button onClick={() => setUseCustomCategory(false)} className="px-3.5 rounded-full text-xs font-medium shrink-0 surface-inset t2">Cancel</button>
              )}
            </div>
          )}
        </div>

        <div>
          <label className={labelClass()}>Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                onClick={() => setEmoji(em)}
                className={`aspect-square rounded-2xl surface-inset flex items-center justify-center text-lg transition-all ${emoji === em ? `ring-2 ${PALETTE[color].ring} ring-offset-2 ${isDark ? 'ring-offset-stone-900' : 'ring-offset-white'}` : ''}`}
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
          <label className={labelClass()}>Classes attended / Total classes</label>
          <div className="flex items-center gap-2">
            <input type="number" min="0" step="0.01" value={attendedInput} onChange={e => setAttendedInput(e.target.value)} placeholder="0" className={inputClass() + ' flex-1'} />
            <span className="font-display font-bold t3">/</span>
            <input type="number" min="0" step="0.01" value={totalInput} onChange={e => setTotalInput(e.target.value)} placeholder="0" className={inputClass() + ' flex-1'} />
          </div>
          <p className="text-xs mt-1.5 t3">Partial values like 5.5 or 6.75 are fine.</p>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------------------------------------------------------------------- */
/* Main App                                                                */
/* ---------------------------------------------------------------------- */

function AttendanceTrackerApp() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [detailItemId, setDetailItemId] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemMenuFor, setItemMenuFor] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState('');
  const [splashPhase, setSplashPhase] = useState('visible');
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (splashPhase === 'visible' && minSplashDone && !loading) {
      setSplashPhase('leaving');
    }
  }, [minSplashDone, loading, splashPhase]);

  useEffect(() => {
    if (splashPhase === 'leaving') {
      const t = setTimeout(() => setSplashPhase('gone'), 320);
      return () => clearTimeout(t);
    }
  }, [splashPhase]);

  const toastTimeoutRef = useRef(null);
  const saveDataTimeoutRef = useRef(null);
  const dataLoadedTransitionRef = useRef(true);
  const settingsLoadedTransitionRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      let loadedItems = SEED_ITEMS;
      let loadedSettings = DEFAULT_SETTINGS;

      try {
        const dataResult = await appStorage.get(STORAGE_KEY_DATA);
        if (dataResult && dataResult.value) {
          const parsed = JSON.parse(dataResult.value);
          if (Array.isArray(parsed.items)) loadedItems = parsed.items;
        }
      } catch (e) {
        /* use seed defaults */
      }
      try {
        const settingsResult = await appStorage.get(STORAGE_KEY_SETTINGS);
        if (settingsResult && settingsResult.value) {
          loadedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsResult.value) };
        }
      } catch (e) {
        /* use defaults */
      }

      if (!cancelled) {
        setItems(loadedItems);
        setSettings(loadedSettings);
        setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (dataLoadedTransitionRef.current) {
      dataLoadedTransitionRef.current = false;
      return;
    }
    if (saveDataTimeoutRef.current) clearTimeout(saveDataTimeoutRef.current);
    saveDataTimeoutRef.current = setTimeout(() => {
      appStorage.set(STORAGE_KEY_DATA, JSON.stringify({ items })).catch(() => {});
    }, 400);
    return () => { if (saveDataTimeoutRef.current) clearTimeout(saveDataTimeoutRef.current); };
  }, [items, loading]);

  useEffect(() => {
    if (loading) return;
    if (settingsLoadedTransitionRef.current) {
      settingsLoadedTransitionRef.current = false;
      return;
    }
    appStorage.set(STORAGE_KEY_SETTINGS, JSON.stringify(settings)).catch(() => {});
  }, [settings, loading]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(''), 2200);
  }

  const categoryNames = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);
  const filterCategories = useMemo(() => ['All', ...categoryNames], [categoryNames]);

  useEffect(() => {
    if (categoryFilter !== 'All' && !categoryNames.includes(categoryFilter)) {
      setCategoryFilter('All');
    }
  }, [categoryNames, categoryFilter]);

  const filteredSortedItems = useMemo(() => {
    let result = items;
    if (categoryFilter !== 'All') result = result.filter(i => i.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    const sorted = [...result];
    if (sortBy === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === 'rate-desc') sorted.sort((a, b) => attendanceRate(b.attended, b.total) - attendanceRate(a.attended, a.total));
    else if (sortBy === 'rate-asc') sorted.sort((a, b) => attendanceRate(a.attended, a.total) - attendanceRate(b.attended, b.total));
    else if (sortBy === 'recent') sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted;
  }, [items, categoryFilter, search, sortBy]);

  function handleIncrement(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const now = new Date().toISOString();
    const newTotal = clampTotal(item.total + 1);
    const newAttended = clampAttended(item.attended + settings.stepSize, newTotal);
    setItems(prev => prev.map(i => i.id === id ? { ...i, attended: newAttended, total: newTotal, updatedAt: now } : i));
  }
  function handleDecrement(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newAttended = clampAttended(item.attended - settings.stepSize, item.total);
    if (newAttended === item.attended) return;
    const now = new Date().toISOString();
    setItems(prev => prev.map(i => i.id === id ? { ...i, attended: newAttended, updatedAt: now } : i));
  }

  function setExactValues(id, rawAttended, rawTotal) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const finalTotal = clampTotal(rawTotal);
    const finalAttended = clampAttended(rawAttended, finalTotal);
    const now = new Date().toISOString();
    setItems(prev => prev.map(i => i.id === id ? { ...i, attended: finalAttended, total: finalTotal, updatedAt: now } : i));
    showToast('Values updated');
  }

  function handleSaveItem(itemData) {
    const now = new Date().toISOString();
    if (editingItem) {
      setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, name: itemData.name, category: itemData.category, emoji: itemData.emoji, color: itemData.color, attended: itemData.attended, total: itemData.total, updatedAt: now } : i));
      showToast('Item updated');
    } else {
      const newItem = { id: generateId(), name: itemData.name, category: itemData.category, emoji: itemData.emoji, color: itemData.color, attended: itemData.attended, total: itemData.total, createdAt: now, updatedAt: now };
      setItems(prev => [...prev, newItem]);
      showToast('Item added');
    }
    setShowAddSheet(false);
    setEditingItem(null);
  }

  function handleDeleteItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Item deleted');
    setDetailItemId(null);
  }

  function handleResetItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const now = new Date().toISOString();
    setItems(prev => prev.map(i => i.id === id ? { ...i, attended: 0, updatedAt: now } : i));
    showToast('Attendance reset');
  }

  function resetAllAttendance() {
    const now = new Date().toISOString();
    setItems(prev => prev.map(i => ({ ...i, attended: 0, updatedAt: now })));
    showToast('All attendance reset');
  }

  function deleteAllItems() {
    setItems([]);
    showToast('All items deleted');
  }

  function updateSettings(partial) {
    setSettings(prev => ({ ...prev, ...partial }));
  }

  function openDetail(id) { setDetailItemId(id); }
  function closeDetail() { setDetailItemId(null); }
  function openAddSheet() { setEditingItem(null); setShowAddSheet(true); }
  function closeAddSheet() { setShowAddSheet(false); setEditingItem(null); }
  function openItemMenu(id) { setItemMenuFor(id); }
  function closeItemMenu() { setItemMenuFor(null); }

  const itemMenuItem = items.find(i => i.id === itemMenuFor) || null;
  const itemMenuOptions = itemMenuItem ? [
    { label: 'View Details', icon: Eye, onClick: () => { openDetail(itemMenuItem.id); closeItemMenu(); } },
    { label: 'Edit Item', icon: Pencil, onClick: () => { setEditingItem(itemMenuItem); setShowAddSheet(true); closeItemMenu(); } },
    { label: 'Reset Attendance', icon: RotateCcw, onClick: () => { closeItemMenu(); setConfirmDialog({ title: 'Reset attendance?', message: `Set ${itemMenuItem.name}'s attended count back to 0. Total stays the same.`, confirmLabel: 'Reset', destructive: false, onConfirm: () => handleResetItem(itemMenuItem.id) }); } },
    { label: 'Delete Item', icon: Trash2, destructive: true, onClick: () => { closeItemMenu(); setConfirmDialog({ title: 'Delete item?', message: `This removes ${itemMenuItem.name} and their attendance history. This can't be undone.`, confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteItem(itemMenuItem.id) }); } },
  ] : [];

  const sortMenuOptions = SORT_OPTIONS_CONFIG.map(opt => ({
    label: opt.label,
    icon: ArrowUpDown,
    active: sortBy === opt.value,
    onClick: () => { setSortBy(opt.value); setShowSortMenu(false); },
  }));
  const sortLookup = SORT_OPTIONS_CONFIG.find(o => o.value === sortBy);
  const currentSortLabel = sortLookup ? sortLookup.label : 'Sort';

  function requestResetAll() {
    setConfirmDialog({ title: 'Reset all attendance?', message: `This sets every item's attended count back to 0. Totals and other details are kept.`, confirmLabel: 'Reset All', destructive: true, onConfirm: resetAllAttendance });
  }
  function requestDeleteAll() {
    setConfirmDialog({ title: 'Delete all items?', message: `This permanently removes all ${items.length} items and their history.`, confirmLabel: 'Delete All', destructive: true, onConfirm: deleteAllItems });
  }

  const isDark = settings.darkMode;
  const accent = PALETTE[settings.accentColor] || PALETTE.amber;
  const detailItem = items.find(i => i.id === detailItemId) || null;
  const detailColor = PALETTE[(detailItem && detailItem.color) || 'amber'] || PALETTE.amber;
  const totalAttendedAll = items.reduce((s, i) => s + i.attended, 0);
  const totalClassesAll = items.reduce((s, i) => s + i.total, 0);
  const overallRateAll = attendanceRate(totalAttendedAll, totalClassesAll);
  const needsOnboarding = !loading && !(settings.userName && settings.userName.trim());

  return (
    <div className={`h-screen w-full flex justify-center font-body app-bg ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <style>{DESIGN_STYLE}</style>
      <div className={`relative w-full h-full flex flex-col overflow-hidden ${IS_NATIVE_APP ? '' : 'max-w-sm sm:border-x phone-edge'}`}>
        <AmbientBackground glow={accent.glow} isDark={isDark} />
        {!IS_NATIVE_APP && <StatusBar />}
        <TopBar activeTab={activeTab} onSettingsClick={() => setActiveTab('settings')} accent={accent} userName={settings.userName} />

        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain">
          {activeTab === 'items' && (
            <ItemsScreen
              items={filteredSortedItems}
              allCategories={filterCategories}
              search={search}
              onSearchChange={setSearch}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              onOpenSortMenu={() => setShowSortMenu(true)}
              sortLabel={currentSortLabel}
              layout={settings.layout}
              onLayoutChange={(v) => updateSettings({ layout: v })}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onOpenDetail={openDetail}
              onOpenMenu={openItemMenu}
              isDark={isDark}
              accent={accent}
              compact={settings.compact}
              onAddClick={openAddSheet}
              hasAnyItems={items.length > 0}
            />
          )}
          {activeTab === 'stats' && <StatsScreen items={items} isDark={isDark} accent={accent} />}
          {activeTab === 'settings' && (
            <SettingsScreen settings={settings} onUpdateSettings={updateSettings} onRequestResetAll={requestResetAll} onRequestDeleteAll={requestDeleteAll} itemCount={items.length} overallRate={overallRateAll} isDark={isDark} />
          )}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onAddClick={openAddSheet} accent={accent} />

        <DetailSheet
          item={detailItem}
          color={detailColor}
          isOpen={!!detailItemId}
          onClose={closeDetail}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onSetExact={setExactValues}
          onEdit={(it) => { setEditingItem(it); setShowAddSheet(true); setDetailItemId(null); }}
          onReset={(id) => setConfirmDialog({ title: 'Reset attendance?', message: `Set this item's attended count back to 0. Total stays the same.`, confirmLabel: 'Reset', destructive: false, onConfirm: () => handleResetItem(id) })}
          onDelete={(id) => setConfirmDialog({ title: 'Delete item?', message: `This removes this item and its attendance history. This can't be undone.`, confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteItem(id) })}
          isDark={isDark}
          stepSize={settings.stepSize}
        />

        <AddItemSheet
          isOpen={showAddSheet}
          onClose={closeAddSheet}
          onSave={handleSaveItem}
          editingItem={editingItem}
          categories={categoryNames}
          isDark={isDark}
        />

        <ActionSheet isOpen={!!itemMenuFor} onClose={closeItemMenu} options={itemMenuOptions} isDark={isDark} title={itemMenuItem ? itemMenuItem.name : ''} />
        <ActionSheet isOpen={showSortMenu} onClose={() => setShowSortMenu(false)} options={sortMenuOptions} isDark={isDark} title="Sort By" />

        <ConfirmDialog {...(confirmDialog || {})} isOpen={!!confirmDialog} onClose={() => setConfirmDialog(null)} isDark={isDark} />

        <Toast message={toast} />

        {needsOnboarding && (
          <OnboardingScreen accent={accent} isDark={isDark} onComplete={(name) => updateSettings({ userName: name })} />
        )}
        {splashPhase !== 'gone' && (
          <SplashScreen accent={accent} isDark={isDark} leaving={splashPhase === 'leaving'} />
        )}
      </div>
    </div>
  );
}

export default AttendanceTrackerApp;
