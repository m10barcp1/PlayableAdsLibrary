'use strict';

// -----------------------------------------------------------------------------
// Client half of the library sync: talks to library-sync-server to push (Sync
// Up) / pull (Sync Down) the project's assets/library-extension folder. Diffs by
// rel-path + SHA-256 so only new/changed files transfer; .meta files ride along
// verbatim, preserving UUIDs (same guarantee the local bundle gives).
//
// Pure Node (fs/crypto/http) — no Editor dependency — so main.ts owns the
// asset-db refresh and progress broadcasting.
// -----------------------------------------------------------------------------

import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { URL } from 'url';
import { LIBRARY_ROOT } from '../library/asset-types';

export interface LocalFile { path: string; hash: string; size: number; ext: string; abs: string; }
export interface RemoteFile { path: string; hash: string; size: number; ext: string; kind: string; updatedAt: number; }
export interface Manifest { version: number; updatedAt: number; count: number; files: RemoteFile[]; deletedPaths: string[]; }
export type Progress = (msg: string, cur?: number, total?: number) => void;
export interface SyncOptions { mirror?: boolean; }

function libAbs(proj: string): string {
    return path.join(proj, ...LIBRARY_ROOT.split('/'));
}

// SHA-256 of a file, streamed so a large asset never loads wholesale and the
// event loop (editor UI) stays responsive across thousands of files.
function hashFile(abs: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const h = crypto.createHash('sha256');
        fs.createReadStream(abs)
            .on('error', reject)
            .on('data', (c) => h.update(c))
            .on('end', () => resolve(h.digest('hex')));
    });
}

// Walk assets/library-extension and hash every file (including .meta). Returns
// entries keyed by forward-slash rel-path under the library root.
export async function buildLocalManifest(proj: string, onProgress?: Progress): Promise<LocalFile[]> {
    const root = libAbs(proj);
    const out: LocalFile[] = [];
    if (!fs.existsSync(root)) return out;

    const stack: string[] = [root];
    const filesAbs: string[] = [];
    while (stack.length) {
        const dir = stack.pop() as string;
        let entries: fs.Dirent[] = [];
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
        for (const e of entries) {
            const abs = path.join(dir, e.name);
            if (e.isDirectory()) { stack.push(abs); }
            else if (e.isFile()) { filesAbs.push(abs); }
        }
    }
    for (let i = 0; i < filesAbs.length; i++) {
        const abs = filesAbs[i];
        const rel = path.relative(root, abs).split(path.sep).join('/');
        let size = 0;
        try { size = fs.statSync(abs).size; } catch { /* vanished mid-scan */ continue; }
        const hash = await hashFile(abs);
        out.push({ path: rel, hash, size, ext: path.extname(rel).toLowerCase(), abs });
        if (onProgress && (i % 200 === 0)) { onProgress(`Scanning local library… ${i + 1}/${filesAbs.length}`, i + 1, filesAbs.length); }
    }
    return out;
}

function reqModule(u: URL) { return u.protocol === 'https:' ? https : http; }

/**
 * Idle-socket timeout for every sync request. Inactivity, not total duration —
 * a large asset that keeps streaming is never cut off, but a server that has
 * gone away (or a routable-yet-dead LAN host) fails fast instead of leaving the
 * promise pending. That matters here because the panel disables its Sync
 * buttons for the whole call: a hung request used to lock them until the panel
 * was closed.
 */
const REQUEST_TIMEOUT_MS = 30000;

/** Fail a stalled request instead of hanging on it forever. */
function attachTimeout(req: http.ClientRequest, label: string, reject: (e: Error) => void): void {
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        reject(new Error(`Timeout after ${REQUEST_TIMEOUT_MS / 1000}s: ${label}`));
        req.destroy();
    });
}

function withToken(headers: http.OutgoingHttpHeaders, token?: string): http.OutgoingHttpHeaders {
    if (token) { headers['x-sync-token'] = token; }
    return headers;
}

function getJson(urlStr: string, token?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const req = reqModule(u).get(u, { headers: withToken({}, token) }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf-8');
                if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} ${urlStr}: ${body.slice(0, 200)}`)); return; }
                try { resolve(JSON.parse(body)); } catch (e: any) { reject(new Error(`Bad JSON from ${urlStr}: ${e.message}`)); }
            });
        });
        attachTimeout(req, urlStr, reject);
        req.on('error', (e) => reject(new Error(`Network error ${urlStr}: ${e.message}`)));
    });
}

function getBuffer(urlStr: string, token?: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const req = reqModule(u).get(u, { headers: withToken({}, token) }, (res) => {
            if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} ${urlStr}`)); res.resume(); return; }
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        });
        attachTimeout(req, urlStr, reject);
        req.on('error', (e) => reject(new Error(`Network error ${urlStr}: ${e.message}`)));
    });
}

function sendBuffer(method: string, urlStr: string, buf: Buffer, token?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const u = new URL(urlStr);
        const req = reqModule(u).request(u, {
            method,
            headers: withToken({ 'Content-Type': 'application/octet-stream', 'Content-Length': buf.length }, token),
        }, (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString('utf-8');
                if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} ${method} ${urlStr}: ${body.slice(0, 200)}`)); return; }
                try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); }
            });
        });
        attachTimeout(req, `${method} ${urlStr}`, reject);
        req.on('error', (e) => reject(new Error(`Network error ${method} ${urlStr}: ${e.message}`)));
        req.end(buf);
    });
}

function del(urlStr: string, token?: string): Promise<any> {
    return sendBuffer('DELETE', urlStr, Buffer.alloc(0), token);
}

function fileUrl(base: string, rel: string, extra?: Record<string, string>): string {
    const u = new URL(base.replace(/\/+$/, '') + '/api/library/file');
    u.searchParams.set('path', rel);
    for (const [k, v] of Object.entries(extra || {})) { u.searchParams.set(k, v); }
    return u.toString();
}

export async function fetchManifest(serverUrl: string, token?: string): Promise<Manifest> {
    const base = serverUrl.replace(/\/+$/, '');
    const m = await getJson(`${base}/api/library/manifest`, token);
    return {
        version: m.version || 0, updatedAt: m.updatedAt || 0, count: m.count || 0,
        files: m.files || [], deletedPaths: m.deletedPaths || [],
    };
}

export async function ping(serverUrl: string, token?: string): Promise<any> {
    return getJson(serverUrl.replace(/\/+$/, '') + '/health', token);
}

// Push local library up: upload every file the server lacks or has at a
// different hash; with mirror, also tombstone server files gone from local.
export async function syncUp(proj: string, serverUrl: string, token: string, opts: SyncOptions, onProgress: Progress) {
    const base = serverUrl.replace(/\/+$/, '');
    onProgress('Scanning local library…');
    const local = await buildLocalManifest(proj, onProgress);
    onProgress('Fetching server manifest…');
    const remote = await fetchManifest(base, token);
    const remoteHash = new Map(remote.files.map((f) => [f.path, f.hash]));

    const toUpload = local.filter((f) => remoteHash.get(f.path) !== f.hash);
    let uploaded = 0;
    for (let i = 0; i < toUpload.length; i++) {
        const f = toUpload[i];
        onProgress(`Uploading ${f.path}`, i + 1, toUpload.length);
        const buf = fs.readFileSync(f.abs);
        await sendBuffer('PUT', fileUrl(base, f.path, { hash: f.hash }), buf, token);
        uploaded++;
    }

    let deleted = 0;
    if (opts.mirror) {
        const localSet = new Set(local.map((f) => f.path));
        const stale = remote.files.filter((f) => !localSet.has(f.path));
        for (let i = 0; i < stale.length; i++) {
            onProgress(`Removing on server ${stale[i].path}`, i + 1, stale.length);
            await del(fileUrl(base, stale[i].path), token);
            deleted++;
        }
    }
    return { uploaded, deleted, unchanged: local.length - uploaded, total: local.length, mirror: !!opts.mirror };
}

// Pull server library down: write every file missing locally or at a different
// hash (temp+rename, hash-verified); with mirror, delete local files the server
// has tombstoned. Returns whether anything changed so the caller can refresh.
export async function syncDown(proj: string, serverUrl: string, token: string, opts: SyncOptions, onProgress: Progress) {
    const base = serverUrl.replace(/\/+$/, '');
    const root = libAbs(proj);
    onProgress('Fetching server manifest…');
    const remote = await fetchManifest(base, token);
    onProgress('Scanning local library…');
    const local = await buildLocalManifest(proj, onProgress);
    const localHash = new Map(local.map((f) => [f.path, f.hash]));

    const toDownload = remote.files.filter((f) => localHash.get(f.path) !== f.hash);
    let downloaded = 0;
    for (let i = 0; i < toDownload.length; i++) {
        const f = toDownload[i];
        onProgress(`Downloading ${f.path}`, i + 1, toDownload.length);
        const buf = await getBuffer(fileUrl(base, f.path), token);
        const got = crypto.createHash('sha256').update(buf).digest('hex');
        if (f.hash && got !== f.hash) { throw new Error(`Hash mismatch downloading ${f.path} (server ${f.hash}, got ${got})`); }
        const abs = path.join(root, ...f.path.split('/'));
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        const tmp = abs + '.tmp-' + process.pid + '-' + Date.now();
        fs.writeFileSync(tmp, buf);
        fs.renameSync(tmp, abs);
        downloaded++;
    }

    let removed = 0;
    if (opts.mirror) {
        const localSet = new Set(local.map((f) => f.path));
        for (const rel of remote.deletedPaths) {
            if (!localSet.has(rel)) { continue; }
            const abs = path.join(root, ...rel.split('/'));
            try { if (fs.existsSync(abs)) { fs.rmSync(abs); removed++; } } catch { /* best-effort */ }
        }
    }
    return { downloaded, removed, unchanged: remote.count - downloaded, total: remote.count, changed: downloaded > 0 || removed > 0, mirror: !!opts.mirror };
}
