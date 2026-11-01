import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUpDown, Eye, Pencil, RotateCcw, Trash2, Check, X, Ban } from 'lucide-react';
import {
  DESIGN_STYLE, PALETTE_KEYS, DEFAULT_SETTINGS, SORT_OPTIONS_CONFIG, STORAGE_KEY_DATA,
  STORAGE_KEY_SETTINGS, SEED_ITEMS, colorOf,
} from './theme.js';
import {
  generateId, attendanceRate, applyMark, removeLogEntry, clampAttended, clampTotal,
  toDateKey, migrateItem, migrateSettings, effectiveTarget, toCsv, makeBackup, parseBackup,
} from './lib/attendance.js';
import {
  IS_NATIVE, appStorage, haptic, setHapticsEnabled, onBackButton, scheduleDailyReminder,
  exportTextFile, pickTextFile,
} from './lib/native.js';
import {
  AmbientBackground, StatusBar, TopBar, SplashScreen, OnboardingScreen, BottomNav,
  ActionSheet, ConfirmDialog, Toast,
} from './ui.jsx';
import { TodayScreen, ItemsScreen, StatsScreen, SettingsScreen } from './screens.jsx';
import { DetailSheet, AddItemSheet } from './sheets.jsx';

function useSystemDark() {
  const query = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const [dark, setDark] = useState(query ? query.matches : false);
  useEffect(() => {
    if (!query) return undefined;
    const fn = e => setDark(e.matches);
    if (query.addEventListener) query.addEventListener('change', fn); else query.addListener(fn);
    return () => { if (query.removeEventListener) query.removeEventListener('change', fn); else query.removeListener(fn); };
  }, []);
  return dark;
}

export default function AttendanceTrackerApp() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name-asc');
  const [detailItemId, setDetailItemId] = useState(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemMenuFor, setItemMenuFor] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const [splashPhase, setSplashPhase] = useState('visible');
  const [minSplashDone, setMinSplashDone] = useState(false);
  const systemDark = useSystemDark();

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const toastTimeoutRef = useRef(null);
  const saveDataTimeoutRef = useRef(null);
  const dataLoadedTransitionRef = useRef(true);
  const settingsLoadedTransitionRef = useRef(true);

  /* ---------------- Splash ---------------- */
  useEffect(() => {
    const t = setTimeout(() => setMinSplashDone(true), 900);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (splashPhase === 'visible' && minSplashDone && !loading) setSplashPhase('leaving');
  }, [minSplashDone, loading, splashPhase]);
  useEffect(() => {
    if (splashPhase === 'leaving') {
      const t = setTimeout(() => setSplashPhase('gone'), 320);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [splashPhase]);

  /* ---------------- Load + migrate ---------------- */
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      let loadedItems = SEED_ITEMS;
      let loadedSettings = migrateSettings(null, DEFAULT_SETTINGS);
      try {
        const dataResult = await appStorage.get(STORAGE_KEY_DATA);
        if (dataResult && dataResult.value) {
          const parsed = JSON.parse(dataResult.value);
          if (Array.isArray(parsed.items)) loadedItems = parsed.items;
        }
      } catch (e) { /* seed defaults */ }
      try {
        const settingsResult = await appStorage.get(STORAGE_KEY_SETTINGS);
        if (settingsResult && settingsResult.value) {
          loadedSettings = migrateSettings(JSON.parse(settingsResult.value), DEFAULT_SETTINGS);
        }
      } catch (e) { /* defaults */ }
      if (!cancelled) {
        setItems(loadedItems.map(i => migrateItem(i, PALETTE_KEYS)).filter(Boolean));
        setSettings(loadedSettings);
        setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  /* ---------------- Persist ---------------- */
  useEffect(() => {
    if (loading) return undefined;
    if (dataLoadedTransitionRef.current) { dataLoadedTransitionRef.current = false; return undefined; }
    if (saveDataTimeoutRef.current) clearTimeout(saveDataTimeoutRef.current);
    saveDataTimeoutRef.current = setTimeout(() => {
      appStorage.set(STORAGE_KEY_DATA, JSON.stringify({ version: 2, items })).catch(() => {});
    }, 300);
    return undefined;
  }, [items, loading]);

  // Flush pending writes when the app is backgrounded so a quick swipe-away never loses a mark.
  useEffect(() => {
    function flush() {
      if (document.visibilityState === 'hidden' && !loading) {
        if (saveDataTimeoutRef.current) clearTimeout(saveDataTimeoutRef.current);
        appStorage.set(STORAGE_KEY_DATA, JSON.stringify({ version: 2, items: itemsRef.current })).catch(() => {});
      }
    }
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush); };
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (settingsLoadedTransitionRef.current) { settingsLoadedTransitionRef.current = false; return; }
    appStorage.set(STORAGE_KEY_SETTINGS, JSON.stringify(settings)).catch(() => {});
  }, [settings, loading]);

  useEffect(() => { setHapticsEnabled(settings.haptics); }, [settings.haptics]);

  // Roll "today" forward if the app was left open past midnight.
  const lastTodayRef = useRef(toDateKey());
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      const now = toDateKey();
      if (now !== lastTodayRef.current) {
        setSelectedDate(prev => (prev === lastTodayRef.current ? now : prev));
        lastTodayRef.current = now;
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  /* ---------------- Toast + undo ---------------- */
  function showToast(message, undoSnapshot) {
    setToast({ message, undo: undoSnapshot ? () => setItems(undoSnapshot) : null });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), undoSnapshot ? 4000 : 2200);
  }
  function handleUndo() {
    if (toast && toast.undo) {
      toast.undo();
      haptic('light');
    }
    setToast(null);
  }

  /** Apply an items update with an Undo-able toast. */
  function commit(updater, message) {
    const snapshot = itemsRef.current;
    setItems(updater);
    if (message) showToast(message, snapshot);
  }

  /* ---------------- Derived ---------------- */
  const categoryNames = useMemo(() => Array.from(new Set(items.map(i => i.category))).sort(), [items]);
  const filterCategories = useMemo(() => ['All', ...categoryNames], [categoryNames]);

  useEffect(() => {
    if (categoryFilter !== 'All' && !categoryNames.includes(categoryFilter)) setCategoryFilter('All');
  }, [categoryNames, categoryFilter]);

  const filteredSortedItems = useMemo(() => {
    let result = items;
    if (categoryFilter !== 'All') result = result.filter(i => i.category === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    }
    const sorted = [...result];
    const r = i => attendanceRate(i.attended, i.total);
    if (sortBy === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortBy === 'rate-desc') sorted.sort((a, b) => r(b) - r(a));
    else if (sortBy === 'rate-asc') sorted.sort((a, b) => r(a) - r(b));
    else if (sortBy === 'risk') sorted.sort((a, b) => (r(a) - effectiveTarget(a, settings.defaultTarget)) - (r(b) - effectiveTarget(b, settings.defaultTarget)));
    else if (sortBy === 'recent') sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted;
  }, [items, categoryFilter, search, sortBy, settings.defaultTarget]);

  /* ---------------- Mutations ---------------- */
  const STATUS_TOAST = { present: 'Marked present', absent: 'Marked absent', cancelled: 'Marked cancelled' };

  function markItem(id, status, dateKey) {
    const item = itemsRef.current.find(i => i.id === id);
    if (!item) return;
    commit(prev => prev.map(i => (i.id === id ? applyMark(i, status, { date: dateKey }) : i)), `${item.name}: ${STATUS_TOAST[status]}`);
    haptic(status === 'present' ? 'success' : status === 'absent' ? 'warning' : 'light');
  }

  function handleIncrement(id) {
    const today = toDateKey();
    setItems(prev => prev.map(i => (i.id === id ? applyMark(i, 'present', { date: today, step: settings.stepSize }) : i)));
    haptic('light');
  }

  function handleDecrement(id) {
    setItems(prev => prev.map(i => (i.id === id ? applyMark(i, 'adjust', { dA: -settings.stepSize, dT: 0 }) : i)));
    haptic('light');
  }

  function handleRemoveEntry(id, entryId) {
    commit(prev => prev.map(i => (i.id === id ? removeLogEntry(i, entryId) : i)), 'Mark removed');
  }

  function setExactValues(id, rawAttended, rawTotal) {
    const finalTotal = clampTotal(rawTotal);
    const finalAttended = clampAttended(rawAttended, finalTotal);
    const now = new Date().toISOString();
    commit(prev => prev.map(i => (i.id === id ? { ...i, attended: finalAttended, total: finalTotal, updatedAt: now } : i)), 'Values updated');
  }

  function handleSaveItem(data) {
    const now = new Date().toISOString();
    if (editingItem) {
      const editId = editingItem.id;
      commit(prev => prev.map(i => (i.id === editId ? { ...i, ...data, updatedAt: now } : i)), 'Item updated');
    } else {
      const newItem = { id: generateId(), ...data, log: [], createdAt: now, updatedAt: now };
      commit(prev => [...prev, newItem], 'Item added');
    }
    setShowAddSheet(false);
    setEditingItem(null);
  }

  function handleDeleteItem(id) {
    const item = itemsRef.current.find(i => i.id === id);
    if (!item) return;
    commit(prev => prev.filter(i => i.id !== id), `${item.name} deleted`);
    setDetailItemId(null);
  }

  function handleResetItem(id) {
    const now = new Date().toISOString();
    commit(prev => prev.map(i => (i.id === id ? { ...i, attended: 0, total: 0, log: [], updatedAt: now } : i)), 'Attendance reset');
  }

  function resetAllAttendance() {
    const now = new Date().toISOString();
    commit(prev => prev.map(i => ({ ...i, attended: 0, total: 0, log: [], updatedAt: now })), 'All attendance reset');
  }

  function deleteAllItems() {
    commit(() => [], 'All items deleted');
  }

  function updateSettings(partial) {
    setSettings(prev => ({ ...prev, ...partial }));
  }

  /* ---------------- Reminders ---------------- */
  async function toggleReminder(enabled) {
    const res = await scheduleDailyReminder(enabled, settings.reminderTime);
    if (res.ok) {
      updateSettings({ reminderEnabled: enabled });
      showToast(enabled ? `Reminder set for ${settings.reminderTime}` : 'Reminder off');
    } else {
      updateSettings({ reminderEnabled: false });
      showToast(res.reason);
    }
  }
  async function changeReminderTime(time) {
    updateSettings({ reminderTime: time });
    if (settings.reminderEnabled && time) {
      const res = await scheduleDailyReminder(true, time);
      if (!res.ok) showToast(res.reason);
    }
  }

  /* ---------------- Backup ---------------- */
  async function exportJson() {
    try {
      await exportTextFile(`tally-backup-${toDateKey()}.json`, JSON.stringify(makeBackup(items, settings), null, 2), 'application/json');
      if (!IS_NATIVE) showToast('Backup downloaded');
    } catch (e) {
      showToast('Export cancelled');
    }
  }
  async function exportCsv() {
    try {
      await exportTextFile(`tally-attendance-${toDateKey()}.csv`, toCsv(items, settings.defaultTarget), 'text/csv');
      if (!IS_NATIVE) showToast('Spreadsheet downloaded');
    } catch (e) {
      showToast('Export cancelled');
    }
  }
  async function importJson() {
    let parsed;
    try {
      const text = await pickTextFile();
      if (text == null) return;
      parsed = parseBackup(text, PALETTE_KEYS, DEFAULT_SETTINGS);
    } catch (e) {
      showToast(e.message || 'Could not read that file');
      return;
    }
    setConfirmDialog({
      title: 'Restore backup?',
      message: `This replaces your ${items.length} current item${items.length === 1 ? '' : 's'} with ${parsed.items.length} from the backup.`,
      confirmLabel: 'Restore',
      destructive: true,
      onConfirm: () => {
        commit(() => parsed.items, `Restored ${parsed.items.length} items`);
        if (parsed.settings) {
          setSettings(prev => ({ ...parsed.settings, userName: parsed.settings.userName || prev.userName, reminderEnabled: prev.reminderEnabled, reminderTime: prev.reminderTime }));
        }
      },
    });
  }

  /* ---------------- Navigation ---------------- */
  function openDetail(id) { setDetailItemId(id); }
  function closeDetail() { setDetailItemId(null); }
  function openAddSheet() { setEditingItem(null); setShowAddSheet(true); }
  function closeAddSheet() { setShowAddSheet(false); setEditingItem(null); }
  function openItemMenu(id) { setItemMenuFor(id); }
  function closeItemMenu() { setItemMenuFor(null); }

  // Android back button: close the top-most layer first, then go to Today, then minimise.
  const backHandlerRef = useRef(() => false);
  backHandlerRef.current = () => {
    if (confirmDialog) { setConfirmDialog(null); return true; }
    if (showSortMenu) { setShowSortMenu(false); return true; }
    if (itemMenuFor) { closeItemMenu(); return true; }
    if (showAddSheet) { closeAddSheet(); return true; }
    if (detailItemId) { closeDetail(); return true; }
    if (activeTab !== 'today') { setActiveTab('today'); return true; }
    return false;
  };
  useEffect(() => onBackButton(() => backHandlerRef.current()), []);

  const itemMenuItem = items.find(i => i.id === itemMenuFor) || null;
  const today = toDateKey();
  const itemMenuOptions = itemMenuItem ? [
    { label: 'Present today', icon: Check, onClick: () => { markItem(itemMenuItem.id, 'present', today); closeItemMenu(); } },
    { label: 'Absent today', icon: X, onClick: () => { markItem(itemMenuItem.id, 'absent', today); closeItemMenu(); } },
    { label: 'Cancelled today', icon: Ban, onClick: () => { markItem(itemMenuItem.id, 'cancelled', today); closeItemMenu(); } },
    { label: 'View details & history', icon: Eye, onClick: () => { openDetail(itemMenuItem.id); closeItemMenu(); } },
    { label: 'Edit item', icon: Pencil, onClick: () => { setEditingItem(itemMenuItem); setShowAddSheet(true); closeItemMenu(); } },
    { label: 'Reset attendance', icon: RotateCcw, onClick: () => { closeItemMenu(); setConfirmDialog({ title: 'Reset attendance?', message: `Set ${itemMenuItem.name} back to 0/0 and clear its history. You can undo right after.`, confirmLabel: 'Reset', destructive: true, onConfirm: () => handleResetItem(itemMenuItem.id) }); } },
    { label: 'Delete item', icon: Trash2, destructive: true, onClick: () => { closeItemMenu(); setConfirmDialog({ title: 'Delete item?', message: `This removes ${itemMenuItem.name} and its attendance history. You can undo right after.`, confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteItem(itemMenuItem.id) }); } },
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
    setConfirmDialog({ title: 'Reset all attendance?', message: 'Sets every item to 0/0 and clears all history - handy for a new semester. Names, schedules and targets are kept.', confirmLabel: 'Reset All', destructive: true, onConfirm: resetAllAttendance });
  }
  function requestDeleteAll() {
    setConfirmDialog({ title: 'Delete all items?', message: `This removes all ${items.length} items and their history. Consider backing up first.`, confirmLabel: 'Delete All', destructive: true, onConfirm: deleteAllItems });
  }

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark);
  const accent = colorOf(settings.accentColor);
  const detailItem = items.find(i => i.id === detailItemId) || null;
  const detailColor = colorOf(detailItem && detailItem.color);
  const totalAttendedAll = items.reduce((s, i) => s + i.attended, 0);
  const totalClassesAll = items.reduce((s, i) => s + i.total, 0);
  const overallRateAll = attendanceRate(totalAttendedAll, totalClassesAll);
  const needsOnboarding = !loading && !(settings.userName && settings.userName.trim());

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#12100f' : '#fafaf9');
  }, [isDark]);

  return (
    <div className={`h-screen w-full flex justify-center font-body app-bg ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <style>{DESIGN_STYLE}</style>
      <div className={`relative w-full h-full flex flex-col overflow-hidden ${IS_NATIVE ? '' : 'max-w-sm sm:border-x phone-edge'}`}>
        <AmbientBackground glow={accent.glow} isDark={isDark} />
        {!IS_NATIVE && <StatusBar />}
        <TopBar activeTab={activeTab} onSettingsClick={() => setActiveTab('settings')} accent={accent} userName={settings.userName} />

        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain" key={activeTab}>
          {activeTab === 'today' && (
            <TodayScreen
              items={items}
              dateKey={selectedDate}
              onDateChange={setSelectedDate}
              weekStartsOn={settings.weekStartsOn}
              defaultTarget={settings.defaultTarget}
              onMark={markItem}
              onRemoveEntry={handleRemoveEntry}
              onOpenDetail={openDetail}
              accent={accent}
              onAddClick={openAddSheet}
            />
          )}
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
              onLayoutChange={v => updateSettings({ layout: v })}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onOpenDetail={openDetail}
              onOpenMenu={openItemMenu}
              accent={accent}
              compact={settings.compact}
              onAddClick={openAddSheet}
              hasAnyItems={items.length > 0}
              defaultTarget={settings.defaultTarget}
            />
          )}
          {activeTab === 'stats' && (
            <StatsScreen items={items} accent={accent} defaultTarget={settings.defaultTarget} weekStartsOn={settings.weekStartsOn} onOpenDetail={openDetail} />
          )}
          {activeTab === 'settings' && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={updateSettings}
              onRequestResetAll={requestResetAll}
              onRequestDeleteAll={requestDeleteAll}
              onExportJson={exportJson}
              onExportCsv={exportCsv}
              onImport={importJson}
              onToggleReminder={toggleReminder}
              onReminderTime={changeReminderTime}
              itemCount={items.length}
              overallRate={overallRateAll}
              isDark={isDark}
              isNative={IS_NATIVE}
            />
          )}
        </div>

        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onAddClick={openAddSheet} accent={accent} />

        <DetailSheet
          item={detailItem}
          color={detailColor}
          isOpen={!!detailItemId}
          onClose={closeDetail}
          onMark={markItem}
          onRemoveEntry={handleRemoveEntry}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onSetExact={setExactValues}
          onEdit={it => { setEditingItem(it); setShowAddSheet(true); setDetailItemId(null); }}
          onReset={id => setConfirmDialog({ title: 'Reset attendance?', message: 'Set this item back to 0/0 and clear its history. You can undo right after.', confirmLabel: 'Reset', destructive: true, onConfirm: () => handleResetItem(id) })}
          onDelete={id => setConfirmDialog({ title: 'Delete item?', message: 'This removes this item and its attendance history. You can undo right after.', confirmLabel: 'Delete', destructive: true, onConfirm: () => handleDeleteItem(id) })}
          isDark={isDark}
          stepSize={settings.stepSize}
          defaultTarget={settings.defaultTarget}
          weekStartsOn={settings.weekStartsOn}
        />

        <AddItemSheet
          isOpen={showAddSheet}
          onClose={closeAddSheet}
          onSave={handleSaveItem}
          editingItem={editingItem}
          categories={categoryNames}
          isDark={isDark}
          defaultTarget={settings.defaultTarget}
          weekStartsOn={settings.weekStartsOn}
        />

        <ActionSheet isOpen={!!itemMenuFor} onClose={closeItemMenu} options={itemMenuOptions} title={itemMenuItem ? itemMenuItem.name : ''} />
        <ActionSheet isOpen={showSortMenu} onClose={() => setShowSortMenu(false)} options={sortMenuOptions} title="Sort By" />

        <ConfirmDialog {...(confirmDialog || {})} isOpen={!!confirmDialog} onClose={() => setConfirmDialog(null)} isDark={isDark} />

        <Toast toast={toast} onUndo={handleUndo} />

        {needsOnboarding && (
          <OnboardingScreen accent={accent} isDark={isDark} initialTarget={settings.defaultTarget} onComplete={(name, target) => updateSettings({ userName: name, defaultTarget: target })} />
        )}
        {splashPhase !== 'gone' && (
          <SplashScreen accent={accent} isDark={isDark} leaving={splashPhase === 'leaving'} />
        )}
      </div>
    </div>
  );
}
