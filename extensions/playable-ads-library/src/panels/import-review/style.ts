'use strict';

export const importReviewStyle = `
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

:host ::-webkit-scrollbar { width: 10px; height: 10px; }
:host ::-webkit-scrollbar-track { background: transparent; }
:host ::-webkit-scrollbar-thumb {
  background: #3a3a44; border-radius: var(--r-pill);
  border: 2px solid transparent; background-clip: padding-box;
}
:host ::-webkit-scrollbar-thumb:hover { background: #4a4a57; background-clip: padding-box; }
:host :focus-visible { outline-color: var(--accent-ring); }

/* ---- Header ---- */
.header {
  padding: var(--s-3) var(--s-4);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-1);
}
.header h2 {
  margin: 0 0 var(--s-1) 0;
  font-size: 14px; font-weight: 650; letter-spacing: -0.01em;
  color: var(--text-1);
}
.header .target {
  color: var(--text-3); font-size: 11px; font-weight: 500;
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
}

/* ---- Summary strip (accent left rail) ---- */
.summary {
  padding: var(--s-2) var(--s-4);
  background: var(--surface-1);
  border-bottom: 1px solid var(--border);
  border-left: 2px solid var(--accent);
  font-size: 11px; font-weight: 500; color: var(--text-2);
}

/* ---- Bulk actions ---- */
.bulk-actions {
  display: flex; gap: var(--s-2); align-items: center;
  padding: var(--s-2) var(--s-4);
  background: var(--bg-app);
  border-bottom: 1px solid var(--border);
}
.bulk-actions button {
  padding: 4px 10px;
  background: var(--surface-2);
  border: 1px solid var(--border-strong);
  color: var(--text-2);
  border-radius: var(--r-sm);
  cursor: pointer; font-size: 11px; font-weight: 600; letter-spacing: 0.01em;
  transition: background var(--t-fast) var(--ease), color var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease);
}
.bulk-actions button:hover { background: var(--surface-3); color: var(--text-1); border-color: var(--border-hover); }
.bulk-actions button:active { transform: translateY(0.5px); }
.bulk-actions button:focus-visible { outline: none; box-shadow: var(--ring); }
.bulk-actions button#btnNewOnly:hover { border-color: var(--success-border); color: var(--success); }

/* ---- Entry list ---- */
.entry-list { flex: 1; overflow-y: auto; padding: var(--s-1) 0; }
.entry-row {
  display: flex; align-items: center; gap: var(--s-2);
  padding: 6px var(--s-4);
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
}
.entry-row:hover { background: var(--surface-2); }
.entry-row.selected { background: var(--accent-ghost); box-shadow: inset 2px 0 0 var(--accent); }
.entry-row.selected:hover { background: var(--accent-ghost); }
.entry-row input[type="checkbox"] {
  margin: 0; cursor: pointer;
  width: 14px; height: 14px;
  accent-color: var(--accent);
}
.entry-row input[type="checkbox"]:focus-visible { outline: none; box-shadow: var(--ring); }

.badge {
  padding: 2px 7px;
  border-radius: var(--r-xs);
  font-size: 9.5px; font-weight: 700; letter-spacing: 0.05em;
  min-width: 46px; text-align: center; text-transform: uppercase;
  border: 1px solid transparent;
}
.badge.new { background: var(--success-ghost); color: var(--success); border-color: var(--success-border); }
.badge.exists { background: var(--warning-ghost); color: var(--warning); border-color: var(--warning-border); }

.type-label {
  color: var(--text-3); min-width: 64px;
  font-size: 11px; font-weight: 500; letter-spacing: 0.02em; text-transform: lowercase;
}
.entry-name {
  flex: 1; color: var(--text-1); font-size: 12px; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.entry-path {
  color: var(--text-3); font-size: 11px; max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
}

/* ---- Footer ---- */
.footer {
  display: flex; justify-content: flex-end; gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  background: var(--surface-1);
  border-top: 1px solid var(--border);
  box-shadow: 0 -1px 2px rgba(0,0,0,0.25);
}
.footer button {
  padding: 7px 18px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-sm);
  cursor: pointer; font-size: 12px; font-weight: 600; letter-spacing: 0.01em;
  transition: background var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease);
}
.footer button:focus-visible { outline: none; box-shadow: var(--ring); }
.btn-cancel { background: var(--surface-3); color: var(--text-1); }
.btn-cancel:hover { background: var(--surface-4); border-color: var(--border-hover); }
.btn-import {
  background: var(--accent-btn); border-color: var(--accent-btn); color: var(--text-on-accent);
  box-shadow: var(--shadow-1);
}
.btn-import:hover { background: var(--accent); border-color: var(--accent); }
.btn-import:active { background: var(--accent-active); border-color: var(--accent-active); }
.btn-import:disabled { background: var(--surface-3); border-color: var(--border-strong); color: var(--text-3); cursor: not-allowed; box-shadow: none; }

@media (prefers-reduced-motion: reduce) {
  :host *, :host *::before, :host *::after { transition: none !important; animation: none !important; }
}
`;
