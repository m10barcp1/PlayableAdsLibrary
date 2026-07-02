'use strict';

export const browserStyle = `
:host {
  --bg-app:#1b1b1f; --bg-sunken:#161619; --surface-1:#212127; --surface-2:#26262d; --surface-3:#2e2e37; --surface-4:#383842;
  --border:#34343d; --border-strong:#41414c; --border-subtle:#2a2a31; --border-hover:#4d4d59;
  --text-1:#e8e8ee; --text-2:#b4b4c0; --text-3:#9a9aa8; --text-on-accent:#ffffff;
  --accent:#6366f1; --accent-hover:#818cf8; --accent-active:#4f46e5; --accent-weak:#3b3b6b;
  --accent-btn:#5457e5; --accent-text:#93a0fb;
  --accent-ghost:rgba(99,102,241,0.12); --accent-ring:rgba(99,102,241,0.45);
  --success:#34d399; --success-ghost:rgba(52,211,153,0.15); --success-border:rgba(52,211,153,0.45);
  --warning:#f59e0b; --warning-ghost:rgba(245,158,11,0.15); --warning-border:rgba(245,158,11,0.45);
  --danger:#ef4444; --danger-fill:#7f2330; --danger-text:#ffd9dc; --danger-hover:#93313d;
  --r-xs:4px; --r-sm:6px; --r-md:8px; --r-lg:10px; --r-pill:999px;
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px; --s-6:24px;
  --shadow-1:0 1px 2px rgba(0,0,0,0.30);
  --shadow-2:0 2px 6px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.30);
  --shadow-card-hover:0 6px 18px rgba(0,0,0,0.42), 0 0 0 1px var(--accent);
  --ring:0 0 0 3px var(--accent-ring);
  --ease:cubic-bezier(0.2,0.6,0.2,1); --t-fast:130ms; --t-med:150ms;
  --font:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;

  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--font);
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg-app);
  -webkit-font-smoothing: antialiased;
}

/* ---- Thin scrollbars ---- */
:host ::-webkit-scrollbar { width: 10px; height: 10px; }
:host ::-webkit-scrollbar-track { background: transparent; }
:host ::-webkit-scrollbar-thumb {
  background: #3a3a44; border-radius: var(--r-pill);
  border: 2px solid transparent; background-clip: padding-box;
}
:host ::-webkit-scrollbar-thumb:hover { background: #4a4a57; background-clip: padding-box; }
:host :focus-visible { outline-color: var(--accent-ring); }

/* ---- Toolbar ---- */
.toolbar {
  display: flex; align-items: center; gap: var(--s-2);
  padding: var(--s-2) var(--s-3);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-1);
}
.toolbar label {
  white-space: nowrap; font-weight: 600; font-size: 11px;
  letter-spacing: 0.02em; color: var(--text-3); margin-left: var(--s-1);
}
.toolbar input[type="text"] {
  flex: 1; min-width: 120px;
  background: var(--bg-sunken);
  border: 1px solid var(--border-strong);
  color: var(--text-1);
  padding: 5px 9px; border-radius: var(--r-sm);
  transition: border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
}
.toolbar input[type="text"]::placeholder { color: var(--text-3); }
.toolbar input[type="text"]:hover { border-color: var(--border-hover); }
.toolbar input[type="text"]:focus { outline: none; border-color: var(--accent); box-shadow: var(--ring); }

/* Brand mark (added in template before .tabs) */
.brand { display: flex; align-items: center; gap: 5px; padding-right: var(--s-1); margin-right: var(--s-1); border-right: 1px solid var(--border); }
.brand-mark { font-size: 13px; color: var(--accent-hover); line-height: 1; }
.brand-name { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; color: var(--text-1); white-space: nowrap; }

/* Tabs as a segmented control */
.tabs {
  display: flex; gap: 2px; padding: 2px; margin-right: 2px;
  background: var(--bg-sunken);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.tab {
  padding: 4px 14px;
  background: transparent; border: none;
  color: var(--text-2); border-radius: var(--r-sm);
  cursor: pointer; font-weight: 600; font-size: 12px; letter-spacing: 0.01em;
  white-space: nowrap;
  transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease);
}
.tab:hover { background: var(--surface-3); color: var(--text-1); }
.tab.active { background: var(--accent-btn); color: var(--text-on-accent); box-shadow: var(--shadow-1); }
.tab.active:hover { background: var(--accent); }
.tab:focus-visible { outline: 2px solid var(--accent-ring); outline-offset: 1px; }

/* Generic toolbar buttons */
.toolbar button {
  padding: 5px 13px;
  background: var(--surface-3); border: 1px solid var(--border-strong);
  color: var(--text-1); border-radius: var(--r-sm); cursor: pointer;
  font-weight: 600;
  transition: background var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
}
.toolbar button:hover { background: var(--surface-4); border-color: var(--border-hover); }
.toolbar button:active { transform: translateY(0.5px); }
.toolbar button:disabled { background: var(--surface-2); border-color: var(--border); color: var(--text-3); cursor: not-allowed; }
.toolbar button:focus-visible { outline: none; box-shadow: var(--ring); }

/* Import All (primary; danger while running) */
.toolbar button#importAll {
  background: var(--accent-btn); border-color: var(--accent-btn);
  color: var(--text-on-accent); white-space: nowrap; box-shadow: var(--shadow-1);
}
.toolbar button#importAll:hover { background: var(--accent); border-color: var(--accent); }
.toolbar button#importAll:active { background: var(--accent-active); border-color: var(--accent-active); }
.toolbar button#importAll:disabled { background: var(--surface-2); border-color: var(--border); color: var(--text-3); box-shadow: none; }
.toolbar button#importAll.btn-importing { background: var(--danger-fill); border-color: var(--danger); color: var(--danger-text); }
.toolbar button#importAll.btn-importing:hover { background: var(--danger-hover); border-color: var(--danger); }

/* Library actions (Bundle / reImport) — compact ghost buttons */
.toolbar .lib-btn {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-2);
  font-size: 11px; font-weight: 600;
  padding: 5px 10px;
  white-space: nowrap;
}
.toolbar .lib-btn:hover { background: var(--surface-3); color: var(--text-1); border-color: var(--border-hover); }
.toolbar .lib-btn:active { transform: translateY(0.5px); }
.toolbar .lib-btn:disabled { background: var(--surface-2); color: var(--text-3); border-color: var(--border); cursor: not-allowed; }
.toolbar .lib-btn#reimportBtn:hover { color: var(--accent-text); border-color: var(--accent); }

/* Bundle status chip (date + size from manifest.json) */
.toolbar .bundle-info {
  font-size: 10.5px; font-weight: 500; letter-spacing: 0.01em;
  color: var(--text-3); white-space: nowrap; cursor: default;
  padding: 2px 8px; border-radius: var(--r-pill);
  background: var(--surface-2); border: 1px solid var(--border);
  max-width: 200px; overflow: hidden; text-overflow: ellipsis;
}
.toolbar .bundle-info:empty { display: none; }
.toolbar .bundle-info.empty { color: var(--text-3); font-style: italic; opacity: 0.8; }

/* ---- Column 1: vertical format nav (asset types) ---- */
.type-nav {
  display: flex; flex-direction: column; gap: 2px;
  flex: 0 0 auto; width: 130px;
  padding: var(--s-2) var(--s-1);
  background: var(--surface-1);
  border-right: 1px solid var(--border);
  overflow-y: auto;
}
.type-item {
  display: flex; align-items: center; gap: 9px;
  padding: 6px 10px; margin: 0 2px;
  border-radius: var(--r-sm);
  color: var(--text-2); font-size: 12px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease);
}
.type-item:hover { background: var(--surface-3); color: var(--text-1); }
.type-item.active {
  background: var(--accent-ghost);
  color: var(--accent-text);
  box-shadow: inset 2px 0 0 var(--accent);
}
.type-item:focus-visible { outline: 2px solid var(--accent-ring); outline-offset: -2px; }
.type-glyph {
  width: 18px; flex: 0 0 18px;
  text-align: center; font-size: 13px; line-height: 1;
}
.type-label { overflow: hidden; text-overflow: ellipsis; }

/* Regenerate = ghost/secondary row pinned to the bottom of the nav; danger when running */
.album-regen {
  margin: auto var(--s-1) 0;
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  color: var(--text-2); font-size: 11.5px; font-weight: 500;
  cursor: pointer; white-space: nowrap;
  transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease);
}
.album-regen:hover { background: var(--surface-3); color: var(--text-1); border-color: var(--border-hover); }
.album-regen.running { background: var(--danger-fill); border-color: var(--danger); color: var(--danger-text); }
.album-regen.running:hover { background: var(--danger-hover); }
.album-regen:focus-visible { outline: none; box-shadow: var(--ring); }

/* ---- Search bar ---- */
.search-bar {
  padding: var(--s-2) var(--s-3);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
}
.search-field { position: relative; display: flex; align-items: center; }
.search-icon {
  position: absolute; left: 9px; pointer-events: none;
  font-size: 13px; color: var(--text-3); line-height: 1;
}
.search-bar input {
  width: 100%; box-sizing: border-box;
  background: var(--bg-sunken);
  border: 1px solid var(--border-strong);
  color: var(--text-1);
  padding: 6px 28px 6px 28px;
  border-radius: var(--r-sm);
  transition: border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
}
.search-bar input::placeholder { color: var(--text-3); }
.search-bar input:hover { border-color: var(--border-hover); }
.search-bar input:focus { outline: none; border-color: var(--accent); box-shadow: var(--ring); }
.search-clear {
  position: absolute; right: 6px; visibility: hidden;
  border: 0; background: transparent; color: var(--text-3);
  cursor: pointer; font-size: 15px; line-height: 1; padding: 2px 5px; border-radius: var(--r-xs);
  transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease);
}
.search-clear:hover { color: var(--text-1); background: var(--surface-3); }
.search-clear:focus-visible { outline: none; box-shadow: var(--ring); }

/* ---- Body / content ---- */
.body { display: flex; flex: 1; overflow: hidden; }
.content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* ---- Column 2: category tree of the selected format ---- */
.sidebar {
  flex: 0 0 auto; width: 186px; min-width: 140px;
  background: var(--surface-1);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: var(--s-2) var(--s-1);
}
.sidebar .cat-item {
  display: flex; align-items: center;
  padding: 5px 10px;
  margin: 1px 2px;
  border-radius: var(--r-sm);
  cursor: pointer; color: var(--text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease);
}
.sidebar .cat-item:hover { background: var(--surface-3); color: var(--text-1); }
.sidebar .cat-item.parent { font-weight: 650; color: var(--text-2); }
.sidebar .cat-item.child { font-weight: 500; color: var(--text-3); }
.sidebar .cat-item.active {
  background: var(--accent-ghost);
  color: var(--accent-text);
  font-weight: 650;
  box-shadow: inset 2px 0 0 var(--accent);
}
.sidebar .cat-item.active.child { color: var(--accent-text); }
.sidebar .cat-item:focus-visible { outline: 2px solid var(--accent-ring); outline-offset: -2px; }

/* ---- Card grid (comfortable gallery) ---- */
.vfx-list {
  flex: 1; overflow-y: auto;
  padding: var(--s-3);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: min-content;
  gap: var(--s-3);
  align-content: start;
}
.vfx-card {
  display: flex; flex-direction: column;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  box-shadow: var(--shadow-1);
  transition: transform var(--t-med) var(--ease), box-shadow var(--t-med) var(--ease), border-color var(--t-med) var(--ease);
}
.vfx-card:hover { transform: translateY(-2px); border-color: var(--accent); box-shadow: var(--shadow-card-hover); }
.vfx-card:focus-within { border-color: var(--accent); box-shadow: var(--ring); }

.card-thumb-wrap {
  position: relative; width: 100%; aspect-ratio: 16 / 10;
  background: var(--bg-sunken);
  border-bottom: 1px solid var(--border-subtle);
  overflow: hidden;
}
.card-thumb { width: 100%; height: 100%; object-fit: contain; display: block; }
.card-thumb.thumb-error { visibility: hidden; }
.card-thumb-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 700; letter-spacing: 1px;
  color: #5a5a6e;
  background: radial-gradient(120% 100% at 30% 0%, #2c2c36 0%, #202028 55%, #191920 100%);
  text-shadow: 0 1px 0 rgba(0,0,0,0.4);
}

.card-thumb-wrap.thumb-regenable { cursor: pointer; }
.card-thumb-wrap.thumb-regenable:hover::after {
  content: '\\21bb';
  position: absolute; top: 8px; right: 8px;
  width: 22px; height: 22px; line-height: 22px; text-align: center;
  font-size: 13px; color: var(--text-on-accent);
  background: rgba(99,102,241,0.88);
  border: 1px solid var(--accent-hover);
  border-radius: var(--r-pill);
  box-shadow: var(--shadow-1);
  pointer-events: none;
}

/* Format glyph placeholder (Animation / FBX / Audio and unrendered previews) */
.card-thumb-placeholder.type-icon {
  font-size: 34px; font-weight: 400; letter-spacing: 0;
  color: #6a6a82;
}

/* File-extension chip (top-right of the preview) */
.card-ext {
  position: absolute; top: 8px; right: 8px;
  padding: 2px 7px;
  background: rgba(20,20,26,0.72);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--r-xs);
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em; line-height: 1.4;
  color: var(--text-3);
  pointer-events: none;
  backdrop-filter: blur(6px) saturate(1.1);
  -webkit-backdrop-filter: blur(6px) saturate(1.1);
  box-shadow: var(--shadow-1);
}

/* When both chips are present (non-render albums), keep the category badge
   from stretching under the extension chip. */
.card-ext ~ .card-badge { max-width: calc(100% - 64px); }

/* Audio play/pause control, centered over the placeholder */
.audio-play {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(99,102,241,0.22);
  border: 1px solid var(--accent);
  border-radius: var(--r-pill);
  color: var(--text-1); font-size: 15px; line-height: 1;
  cursor: pointer;
  transition: background var(--t-fast) var(--ease), transform var(--t-fast) var(--ease);
}
.audio-play:hover { background: rgba(99,102,241,0.45); transform: translate(-50%, -50%) scale(1.06); }
.audio-play:active { transform: translate(-50%, -50%) scale(0.97); }
.audio-play.playing {
  background: var(--accent-btn); border-color: var(--accent-hover);
  color: var(--text-on-accent);
  box-shadow: 0 0 0 4px var(--accent-ghost);
}
.audio-play:focus-visible { outline: none; box-shadow: var(--ring); }

.card-badge {
  position: absolute; top: 8px; left: 8px;
  max-width: calc(100% - 16px);
  padding: 2px 8px;
  background: rgba(20,20,26,0.72);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: var(--r-xs);
  font-size: 10px; font-weight: 600; letter-spacing: 0.03em; line-height: 1.4;
  color: var(--text-2);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  pointer-events: none;
  backdrop-filter: blur(6px) saturate(1.1);
  -webkit-backdrop-filter: blur(6px) saturate(1.1);
  box-shadow: var(--shadow-1);
}

.card-body { display: flex; flex-direction: column; gap: var(--s-2); padding: var(--s-3); }

.card-import {
  width: 100%; padding: 7px 8px;
  background: var(--accent-btn); border: 1px solid var(--accent-btn);
  color: var(--text-on-accent); border-radius: var(--r-sm);
  cursor: pointer; font-size: 12px; font-weight: 600; letter-spacing: 0.01em;
  transition: background var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
}
.card-import:hover { background: var(--accent); border-color: var(--accent); }
.card-import:active { background: var(--accent-active); border-color: var(--accent-active); }
.card-import:disabled { background: var(--surface-3); border-color: var(--border-strong); color: var(--text-3); cursor: not-allowed; }
.card-import:focus-visible { outline: none; box-shadow: var(--ring); }

.card-import.card-imported {
  background: var(--success-ghost); border-color: var(--success-border);
  color: var(--success); font-weight: 600;
}
.card-import.card-imported:hover { background: rgba(52,211,153,0.22); }

.card-import.card-locate {
  background: var(--surface-3); border-color: var(--border-strong); color: var(--text-1);
}
.card-import.card-locate:hover { background: var(--surface-4); border-color: var(--border-hover); }

.card-name {
  font-size: 13px; font-weight: 600; letter-spacing: -0.005em;
  color: var(--text-1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-meta {
  display: flex; gap: var(--s-3);
  font-size: 11px; font-weight: 500; letter-spacing: 0.01em;
  color: var(--text-3);
}

/* Spine card controls: skin + animation-state selectors */
.spine-controls { display: flex; gap: var(--s-1); }
.spine-controls select {
  flex: 1; min-width: 0;
  background: var(--bg-sunken);
  border: 1px solid var(--border-strong);
  color: var(--text-1);
  border-radius: var(--r-xs);
  font-size: 11px; padding: 3px 4px;
  cursor: pointer;
  transition: border-color var(--t-fast) var(--ease);
}
.spine-controls select:hover { border-color: var(--border-hover); }
.spine-controls select:focus { outline: none; border-color: var(--accent); }
.spine-controls select:disabled { color: var(--text-3); cursor: default; }
.card-meta span { display: inline-flex; align-items: center; }

/* ---- Empty state ---- */
.empty-hint {
  grid-column: 1 / -1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--s-2);
  padding: 56px 24px; min-height: 180px;
  text-align: center; color: var(--text-3); font-size: 13px; line-height: 1.5;
}
.empty-hint::before {
  content: "\\2726";
  font-size: 34px; color: var(--accent-weak); opacity: 0.9; line-height: 1;
}

/* ---- Skeleton shimmer (loading; needs-JS to inject .vfx-card.skeleton nodes) ---- */
.vfx-card.skeleton { pointer-events: none; }
.skel-box, .skel-line {
  background: linear-gradient(100deg, var(--surface-2) 30%, var(--surface-4) 50%, var(--surface-2) 70%);
  background-size: 200% 100%;
  animation: vfx-shimmer 1.2s linear infinite;
  border-radius: var(--r-sm);
}
.skel-box { width: 100%; aspect-ratio: 16 / 10; border-radius: 0; }
.skel-line { height: 12px; margin: 6px 0; }
.skel-line.skel-btn { height: 32px; border-radius: var(--r-sm); }
.skel-line.skel-name { width: 70%; height: 11px; }
@keyframes vfx-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* ---- Status bar (dot via ::before; turns indigo/pulses when .busy is toggled in JS) ---- */
.status-bar {
  display: flex; align-items: center; gap: var(--s-2);
  padding: 5px var(--s-3);
  background: var(--surface-1);
  border-top: 1px solid var(--border);
  font-size: 11px; font-weight: 500; color: var(--text-3);
}
.status-bar::before {
  content: ""; width: 7px; height: 7px; border-radius: var(--r-pill);
  background: var(--success);
  box-shadow: 0 0 0 3px var(--success-ghost);
  flex: 0 0 auto;
}
.status-bar.busy { color: var(--text-2); }
.status-bar.busy::before {
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ghost);
  animation: vfx-pulse 1s ease-in-out infinite;
}
@keyframes vfx-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

@media (prefers-reduced-motion: reduce) {
  :host *, :host *::before, :host *::after { transition: none !important; animation: none !important; }
}
`;
