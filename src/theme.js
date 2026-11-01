/* ---------------------------------------------------------------------- */
/* Design system - "Liquid Glass" edition                                  */
/*                                                                         */
/* Tokens live as CSS variables scoped by .theme-light / .theme-dark, so   */
/* every surface reads from one palette instead of scattered ternaries:    */
/*   Text:      .t1 (primary) .t2 (secondary) .t3 (tertiary)              */
/*   Materials: .glass (cards, dock) .glass-strong (sheets, dialogs)      */
/*              .surface-inset (controls INSIDE glass - never nest blur)  */
/*   Lines:     .divide-token .hairline-b .hairline-t .phone-edge         */
/*   Status:    .st-present .st-absent .st-cancelled (always paired with  */
/*              an icon + label, never color alone)                       */
/* Radius language: rounded-3xl surfaces, rounded-2xl inputs/small cards, */
/* rounded-full for every pill control. Accent stays in PALETTE; each      */
/* color carries a glow hex that drives the ambient orbs + button glow.   */
/* ---------------------------------------------------------------------- */

export const DESIGN_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
  .font-body { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }
  .tabular-nums { font-variant-numeric: tabular-nums; }
  * { -webkit-tap-highlight-color: transparent; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { scrollbar-width: none; }

  .theme-light {
    color-scheme: light;
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
    --present: #047857; --present-bg: rgba(5, 150, 105, 0.14);
    --absent: #be123c;  --absent-bg: rgba(225, 29, 72, 0.12);
    --cancel: #57534e;  --cancel-bg: rgba(87, 83, 78, 0.12);
    --warn: #b45309;    --warn-bg: rgba(217, 119, 6, 0.14);
  }
  .theme-dark {
    color-scheme: dark;
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
    --present: #34d399; --present-bg: rgba(52, 211, 153, 0.16);
    --absent: #fb7185;  --absent-bg: rgba(251, 113, 133, 0.16);
    --cancel: #a8a29e;  --cancel-bg: rgba(168, 162, 158, 0.16);
    --warn: #fbbf24;    --warn-bg: rgba(251, 191, 36, 0.14);
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

  .st-present { color: var(--present); background: var(--present-bg); }
  .st-absent { color: var(--absent); background: var(--absent-bg); }
  .st-cancelled { color: var(--cancel); background: var(--cancel-bg); }
  .st-warn { color: var(--warn); background: var(--warn-bg); }
  .tx-present { color: var(--present); }
  .tx-absent { color: var(--absent); }
  .tx-warn { color: var(--warn); }
  .fill-present { background: var(--present); }
  .fill-absent { background: var(--absent); }
  .fill-cancel { background: var(--cancel); }

  @keyframes splash-pop {
    0% { opacity: 0; transform: scale(0.7); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes splash-rise {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes screen-in {
    0% { opacity: 0; transform: translateY(6px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .splash-pop { animation: splash-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .splash-rise { animation: splash-rise 0.5s ease-out 0.22s both; }
  .screen-in { animation: screen-in 0.25s ease-out both; }
  @media (prefers-reduced-motion: reduce) {
    .splash-pop, .splash-rise, .screen-in { animation: none; }
  }
`;

export const PALETTE = {
  amber:   { name: 'Brass',   glow: '#d97706', solid: 'bg-amber-600',   avatarBg: 'bg-amber-500',   text: 'text-amber-700',   badgeLight: 'bg-amber-100 text-amber-800',     badgeDark: 'bg-amber-950 text-amber-300',     ring: 'ring-amber-500' },
  violet:  { name: 'Violet',  glow: '#7c3aed', solid: 'bg-violet-600',  avatarBg: 'bg-violet-500',  text: 'text-violet-700',  badgeLight: 'bg-violet-100 text-violet-800',   badgeDark: 'bg-violet-950 text-violet-300',   ring: 'ring-violet-500' },
  sky:     { name: 'Sky',     glow: '#0284c7', solid: 'bg-sky-600',     avatarBg: 'bg-sky-500',     text: 'text-sky-700',     badgeLight: 'bg-sky-100 text-sky-800',         badgeDark: 'bg-sky-950 text-sky-300',         ring: 'ring-sky-500' },
  emerald: { name: 'Emerald', glow: '#059669', solid: 'bg-emerald-600', avatarBg: 'bg-emerald-500', text: 'text-emerald-700', badgeLight: 'bg-emerald-100 text-emerald-800', badgeDark: 'bg-emerald-950 text-emerald-300', ring: 'ring-emerald-500' },
  rose:    { name: 'Rose',    glow: '#e11d48', solid: 'bg-rose-600',    avatarBg: 'bg-rose-500',    text: 'text-rose-700',    badgeLight: 'bg-rose-100 text-rose-800',       badgeDark: 'bg-rose-950 text-rose-300',       ring: 'ring-rose-500' },
  orange:  { name: 'Orange',  glow: '#ea580c', solid: 'bg-orange-600',  avatarBg: 'bg-orange-500',  text: 'text-orange-700',  badgeLight: 'bg-orange-100 text-orange-800',   badgeDark: 'bg-orange-950 text-orange-300',   ring: 'ring-orange-500' },
  teal:    { name: 'Teal',    glow: '#0d9488', solid: 'bg-teal-600',    avatarBg: 'bg-teal-500',    text: 'text-teal-700',    badgeLight: 'bg-teal-100 text-teal-800',       badgeDark: 'bg-teal-950 text-teal-300',       ring: 'ring-teal-500' },
  pink:    { name: 'Pink',    glow: '#db2777', solid: 'bg-pink-600',    avatarBg: 'bg-pink-500',    text: 'text-pink-700',    badgeLight: 'bg-pink-100 text-pink-800',       badgeDark: 'bg-pink-950 text-pink-300',       ring: 'ring-pink-500' },
};
export const PALETTE_KEYS = Object.keys(PALETTE);
export function colorOf(key) { return PALETTE[key] || PALETTE.amber; }

export const EMOJI_OPTIONS = ['📚', '🧑‍🎓', '👩‍🏫', '🔬', '🧪', '💻', '📐', '🧮', '🌍', '🎨', '🎵', '⚽', '🏀', '🧘', '🏃', '💼', '🎯', '🥋', '🌟', '👥', '🎓', '🍎', '📝', '👤'];

export const DEFAULT_SETTINGS = {
  theme: 'system',
  accentColor: 'amber',
  layout: 'list',
  compact: false,
  stepSize: 1,
  userName: '',
  defaultTarget: 75,
  weekStartsOn: 1,
  haptics: true,
  reminderEnabled: false,
  reminderTime: '18:00',
};

export const STEP_SIZE_OPTIONS = [
  { value: 1, label: '±1' },
  { value: 0.5, label: '±0.5' },
  { value: 0.25, label: '±¼' },
];

export const TARGET_PRESETS = [60, 65, 70, 75, 80, 85, 90];

export const SORT_OPTIONS_CONFIG = [
  { value: 'name-asc', label: 'Name (A to Z)' },
  { value: 'name-desc', label: 'Name (Z to A)' },
  { value: 'rate-desc', label: 'Attendance (High to Low)' },
  { value: 'rate-asc', label: 'Attendance (Low to High)' },
  { value: 'risk', label: 'Most at Risk' },
  { value: 'recent', label: 'Recently Updated' },
];

export const STORAGE_KEY_DATA = 'tally-app-data';
export const STORAGE_KEY_SETTINGS = 'tally-app-settings';

const NOW_ISO = new Date().toISOString();
export const SEED_ITEMS = [
  { id: 'seed-1', name: 'Data Structures', category: 'Semester 3', emoji: '💻', color: 'sky', attended: 14, total: 16, target: null, schedule: [1, 3, 5], log: [], createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-2', name: 'Discrete Maths', category: 'Semester 3', emoji: '🧮', color: 'violet', attended: 11, total: 16, target: null, schedule: [2, 4], log: [], createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-3', name: 'Physics Lab', category: 'Semester 3', emoji: '🔬', color: 'emerald', attended: 5.5, total: 8, target: 80, schedule: [3], log: [], createdAt: NOW_ISO, updatedAt: NOW_ISO },
  { id: 'seed-4', name: 'Yoga Class', category: 'Personal', emoji: '🧘', color: 'rose', attended: 6.75, total: 9, target: 60, schedule: [6], log: [], createdAt: NOW_ISO, updatedAt: NOW_ISO },
];
