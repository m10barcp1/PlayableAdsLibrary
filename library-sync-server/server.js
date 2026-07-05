'use strict';

// -----------------------------------------------------------------------------
// iKame Library sync server
//
// Self-hosted, portable ("chạy trên máy nào cũng được"): plain Node + Express +
// SQLite, no build step. Mirrors ONE folder — a Cocos project's
// assets/library-extension — so any machine can push its library up and any
// other can pull it down, with .meta files carried verbatim (UUIDs preserved).
//
//   data/library.db   SQLite CSDL: file catalog/index + delete tombstones + a
//                     monotonic `version` counter (fast manifest, no FS walk).
//   data/library/**   the actual bytes, mirroring the library-extension tree.
//
// Client diffs by rel_path + SHA-256 hash, so only new/changed files transfer.
//
// Env:
//   PORT        (default 4650)
//   DATA_DIR    (default ./data)
//   SYNC_TOKEN  (optional) — when set, requests must send header x-sync-token
// -----------------------------------------------------------------------------

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const Database = require('better-sqlite3');

const PORT = parseInt(process.env.PORT || '4650', 10);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const LIB_DIR = path.join(DATA_DIR, 'library');
const DB_PATH = path.join(DATA_DIR, 'library.db');
const TOKEN = process.env.SYNC_TOKEN || '';

// Top-level folder -> album kind, mirroring ASSET_TYPES in the extension's
// library/asset-types.ts. Derived server-side so the client can't disagree.
const KIND_BY_TOP = {
    _VFX: 'vfx', Animation: 'animation', Spine: 'spine',
    FBX: 'fbx', Audio: 'audio', Prefab: 'prefab', Texture: 'texture',
};

fs.mkdirSync(LIB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS files (
  rel_path   TEXT PRIMARY KEY,
  hash       TEXT NOT NULL,
  size       INTEGER NOT NULL,
  ext        TEXT,
  kind       TEXT,
  updated_at INTEGER NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`);

const stmt = {
    upsert: db.prepare(`INSERT INTO files (rel_path, hash, size, ext, kind, updated_at, deleted)
        VALUES (@rel_path, @hash, @size, @ext, @kind, @updated_at, 0)
        ON CONFLICT(rel_path) DO UPDATE SET
          hash=@hash, size=@size, ext=@ext, kind=@kind, updated_at=@updated_at, deleted=0`),
    get: db.prepare('SELECT * FROM files WHERE rel_path = ?'),
    live: db.prepare('SELECT rel_path, hash, size, ext, kind, updated_at FROM files WHERE deleted = 0 ORDER BY rel_path'),
    tombstones: db.prepare('SELECT rel_path FROM files WHERE deleted = 1'),
    tombstone: db.prepare('UPDATE files SET deleted = 1, updated_at = ? WHERE rel_path = ?'),
    getMeta: db.prepare('SELECT value FROM meta WHERE key = ?'),
    setMeta: db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
};

function getVersion() {
    const row = stmt.getMeta.get('version');
    return row ? parseInt(row.value, 10) || 0 : 0;
}
function bumpVersion() {
    const v = getVersion() + 1;
    const now = Date.now();
    stmt.setMeta.run('version', String(v));
    stmt.setMeta.run('updatedAt', String(now));
    return { version: v, updatedAt: now };
}
function getUpdatedAt() {
    const row = stmt.getMeta.get('updatedAt');
    return row ? parseInt(row.value, 10) || 0 : 0;
}

function kindForRelPath(rel) {
    const top = rel.split('/')[0];
    return KIND_BY_TOP[top] || '';
}

// Normalize a client-supplied rel path to forward slashes and reject anything
// that would escape the library dir (path traversal / absolute paths).
function resolveRel(relRaw) {
    const rel = String(relRaw || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!rel) return null;
    const segs = rel.split('/');
    if (segs.some((s) => s === '' || s === '.' || s === '..')) return null;
    const abs = path.join(LIB_DIR, ...segs);
    const rootWithSep = LIB_DIR.endsWith(path.sep) ? LIB_DIR : LIB_DIR + path.sep;
    if (abs !== LIB_DIR && !abs.startsWith(rootWithSep)) return null;
    return { rel, abs };
}

function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

const app = express();
app.disable('x-powered-by');

// Minimal request log so a Sync Up visibly shows one line per transferred file.
app.use((req, _res, next) => {
    if (req.path.startsWith('/api/library/file') || req.method !== 'GET') {
        const q = req.query.path ? ` ${req.query.path}` : '';
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}${q}`);
    }
    next();
});

// Optional shared-token gate. Health + landing stay open so a browser/client can
// probe reachability without a token.
app.use((req, res, next) => {
    if (!TOKEN || req.path === '/health' || req.path === '/') return next();
    if (req.get('x-sync-token') === TOKEN) return next();
    return res.status(401).json({ error: 'invalid or missing x-sync-token' });
});

// Friendly landing page — opening the root in a browser shows status instead of 404.
app.get('/', (_req, res) => {
    const count = stmt.live.all().length;
    res.type('html').send(`<!doctype html><meta charset="utf-8"><title>library-sync-server</title>
<body style="font:14px system-ui;max-width:640px;margin:40px auto;color:#222">
<h2>library-sync-server ✓ đang chạy</h2>
<p>Catalog version <b>${getVersion()}</b> · <b>${count}</b> file.</p>
<ul>
<li><a href="/health">/health</a></li>
<li><a href="/api/library/manifest">/api/library/manifest</a></li>
</ul>
<p>Trong extension iKame Library (Settings → Library Sync), đặt <b>Server URL</b> =
<code>http://127.0.0.1:${PORT}</code> (hoặc IP máy này nếu dùng từ máy khác).</p>
</body>`);
});

app.get('/health', (_req, res) => {
    res.json({ ok: true, name: 'library-sync-server', version: getVersion(), updatedAt: getUpdatedAt() });
});

app.get('/api/library/manifest', (_req, res) => {
    const files = stmt.live.all().map((r) => ({
        path: r.rel_path, hash: r.hash, size: r.size, ext: r.ext, kind: r.kind, updatedAt: r.updated_at,
    }));
    const deletedPaths = stmt.tombstones.all().map((r) => r.rel_path);
    res.json({ version: getVersion(), updatedAt: getUpdatedAt(), count: files.length, files, deletedPaths });
});

app.get('/api/library/file', (req, res) => {
    const r = resolveRel(req.query.path);
    if (!r) return res.status(400).json({ error: 'bad path' });
    const row = stmt.get.get(r.rel);
    if (!row || row.deleted || !fs.existsSync(r.abs)) return res.status(404).json({ error: 'not found' });
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('x-hash', row.hash);
    fs.createReadStream(r.abs).on('error', () => res.status(500).end()).pipe(res);
});

app.put('/api/library/file', express.raw({ type: () => true, limit: '128mb' }), (req, res) => {
    const r = resolveRel(req.query.path);
    if (!r) return res.status(400).json({ error: 'bad path' });
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const hash = sha256(body);
    const claimed = String(req.query.hash || '');
    if (claimed && claimed !== hash) {
        return res.status(400).json({ error: 'hash mismatch', expected: claimed, got: hash });
    }
    try {
        fs.mkdirSync(path.dirname(r.abs), { recursive: true });
        // Write to a temp sibling then rename, so a reader never sees a half file.
        const tmp = r.abs + '.tmp-' + process.pid + '-' + Date.now();
        fs.writeFileSync(tmp, body);
        fs.renameSync(tmp, r.abs);
    } catch (e) {
        return res.status(500).json({ error: 'write failed: ' + e.message });
    }
    const ext = (path.extname(r.rel) || '').toLowerCase();
    const { version, updatedAt } = bumpVersion();
    stmt.upsert.run({
        rel_path: r.rel, hash, size: body.length, ext, kind: kindForRelPath(r.rel), updated_at: updatedAt,
    });
    res.json({ ok: true, path: r.rel, hash, size: body.length, version });
});

app.delete('/api/library/file', (req, res) => {
    const r = resolveRel(req.query.path);
    if (!r) return res.status(400).json({ error: 'bad path' });
    const row = stmt.get.get(r.rel);
    if (!row) return res.json({ ok: true, path: r.rel, missing: true });
    const { version, updatedAt } = bumpVersion();
    stmt.tombstone.run(updatedAt, r.rel);
    try { if (fs.existsSync(r.abs)) fs.rmSync(r.abs); } catch { /* best-effort */ }
    res.json({ ok: true, path: r.rel, deleted: true, version });
});

app.use((_req, res) => res.status(404).json({ error: 'no such route' }));

const server = app.listen(PORT, () => {
    console.log(`[library-sync-server] mở bằng trình duyệt: http://127.0.0.1:${PORT}  (đang lắng nghe mọi IP: 0.0.0.0:${PORT})`);
    console.log(`[library-sync-server] data dir: ${DATA_DIR}`);
    console.log(`[library-sync-server] auth: ${TOKEN ? 'x-sync-token required' : 'open (no token)'}`);
    console.log(`[library-sync-server] catalog version: ${getVersion()} (${stmt.live.all().length} files)`);
});
server.on('error', (e) => {
    if (e && e.code === 'EADDRINUSE') {
        console.error(`[library-sync-server] Cổng ${PORT} đang bị chiếm — có thể đã có 1 server chạy rồi.`);
        console.error(`[library-sync-server] Dùng server đang chạy, hoặc đổi cổng:  PORT=4651 npm start`);
    } else {
        console.error('[library-sync-server] listen error:', (e && e.message) || e);
    }
    process.exit(1);
});
