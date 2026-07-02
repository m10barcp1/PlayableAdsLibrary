'use strict';

import * as path from 'path';
import * as fs from 'fs';
import {
    ASSET_TYPES, LIBRARY_ROOT, DEFAULT_VFX_IMPORT_FOLDER, LEGACY_BUNDLE_ROOTS, libraryTypeDir,
} from './library/asset-types';

let _importReviewData: any = null;

const EFFECT_FILES = ['vfx-particle.effect'];
const EFFECTS_DST_DIR = 'db://assets/effects';

async function ensureEffectsInstalled(): Promise<void> {
    const staticDir = path.join(__dirname, '..', 'static', 'effects');
    const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();

    for (const file of EFFECT_FILES) {
        const srcPath = path.join(staticDir, file);
        if (!fs.existsSync(srcPath)) {
            console.warn(`[VFX] Effect source not found: ${srcPath}`);
            continue;
        }

        const dstDir = path.join(projectPath, 'assets', 'effects');
        const dstPath = path.join(dstDir, file);
        fs.mkdirSync(dstDir, { recursive: true });

        // Install/refresh the .effect AND its sibling .meta. The .meta carries a stable
        // UUID, so the effect keeps the same id in every project — bundled materials that
        // reference it (by UUID) keep resolving without re-linking.
        const srcMeta = srcPath + '.meta';
        const dstMeta = dstPath + '.meta';
        const dstExists = fs.existsSync(dstPath);
        const effectChanged = !dstExists ||
            fs.readFileSync(srcPath, 'utf-8') !== fs.readFileSync(dstPath, 'utf-8');
        const metaMissing = fs.existsSync(srcMeta) && !fs.existsSync(dstMeta);

        if (!effectChanged && !metaMissing) {
            console.log(`[VFX] Effect up to date: ${file}`);
            continue;
        }

        fs.copyFileSync(srcPath, dstPath);
        if (fs.existsSync(srcMeta)) { fs.copyFileSync(srcMeta, dstMeta); }
        console.log(`[VFX] ${dstExists ? 'Updated' : 'Installed'} effect: ${file}`);

        // Refresh asset-db so Cocos picks up the change
        try {
            await Editor.Message.request('asset-db', 'refresh-asset', `${EFFECTS_DST_DIR}/${file}`);
        } catch { /* asset-db may not be ready at startup */ }
    }
}

// ---------------------------------------------------------------------------
// Portable library: bundle the project's library assets INTO the extension
// folder so the extension can be copied to another project and recreate them
// there (reImport) without moving the assets folder. Assets are copied
// verbatim with their .meta files, so UUIDs — and every internal reference —
// are preserved. Every format under assets/library-extension/ is carried:
// VFX, Animation, Spine, FBX, Audio, Prefab, Texture.
// ---------------------------------------------------------------------------

const LIBRARY_DIRNAME = 'library';
// Asset folders (project-relative) the bundle carries. Each is copied whole,
// plus its sibling .meta so the folder's own UUID survives reImport. Legacy
// roots are still bundled when present so pre-conversion projects don't lose
// their VFX from the bundle.
const BUNDLE_ROOTS = [
    LIBRARY_ROOT,
    ...LEGACY_BUNDLE_ROOTS,
];
// Single-file assets carried with their .meta (UUID preserved => bundled
// materials that reference the effect keep resolving in the new project).
const BUNDLE_FILES = [
    'assets/effects/vfx-particle.effect',
];
const THUMB_REL = 'local/vfx-thumbs';

// Create assets/library-extension/<Format>/ for every supported asset type so
// the library structure exists as soon as the extension loads.
async function ensureLibraryFolders(): Promise<void> {
    const proj = projectRoot();
    let created = false;
    for (const def of ASSET_TYPES) {
        const dir = path.join(proj, libraryTypeDir(def));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            created = true;
        }
    }
    if (created) {
        try { await Editor.Message.request('asset-db', 'refresh-asset', `db://${LIBRARY_ROOT}`); }
        catch { /* asset-db may not be ready at startup */ }
        console.log(`[Library] Scaffolded ${LIBRARY_ROOT}/ format folders`);
    }
}

function extensionRoot(): string { return path.join(__dirname, '..'); }
function libraryRoot(): string { return path.join(extensionRoot(), LIBRARY_DIRNAME); }
function projectRoot(): string {
    return Editor.Project?.path || (Editor as any).projectPath || process.cwd();
}

// `assets` counts real asset payload (non-.meta files) — scaffolded-but-empty
// library folders still produce folder .meta files, which must not make an
// empty bundle look non-empty.
function copyDir(src: string, dst: string): { files: number; bytes: number; assets: number } {
    const acc = { files: 0, bytes: 0, assets: 0 };
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, e.name);
        const d = path.join(dst, e.name);
        if (e.isDirectory()) {
            const r = copyDir(s, d);
            acc.files += r.files; acc.bytes += r.bytes; acc.assets += r.assets;
        } else {
            fs.copyFileSync(s, d);
            acc.files++;
            if (!e.name.endsWith('.meta')) { acc.assets++; }
            try { acc.bytes += fs.statSync(d).size; } catch { /* ignore */ }
        }
    }
    return acc;
}

function copyFile(src: string, dst: string): boolean {
    if (!fs.existsSync(src)) return false;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    return true;
}

export const methods: Record<string, (...args: any[]) => any> = {
    openBrowser() {
        Editor.Panel.open('vfx-browser.browser');
    },

    // Gom toàn bộ library (assets/library-extension + các folder VFX legacy còn
    // tồn tại) của project hiện tại vào extensions/<ext>/library/ (portable).
    // Builds into a temp dir first and only swaps it in when it actually holds
    // assets — a click in an empty project must not destroy an existing bundle.
    async bundleLibrary() {
        const proj = projectRoot();
        const lib = libraryRoot();
        const tmp = lib + '.tmp';
        try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* none */ }
        fs.mkdirSync(tmp, { recursive: true });

        // Record where imports actually land, not the compile-time default —
        // reImport diagnostics and future migrations read this from the manifest.
        let importFolder = DEFAULT_VFX_IMPORT_FOLDER;
        try {
            importFolder = (await Editor.Profile.getProject('vfx-browser', 'importFolder'))
                || DEFAULT_VFX_IMPORT_FOLDER;
        } catch { /* profile unavailable */ }

        const manifest: any = {
            version: 2,
            createdAt: Date.now(),
            importFolder,
            roots: [] as string[],
            files: [] as string[],
            thumbs: false,
            totalFiles: 0,
            totalBytes: 0,
        };

        let assetFiles = 0; // real asset payload — .meta/effect/thumbs don't count
        for (const rel of BUNDLE_ROOTS) {
            const src = path.join(proj, rel);
            if (!fs.existsSync(src)) { continue; }
            const r = copyDir(src, path.join(tmp, rel));
            copyFile(src + '.meta', path.join(tmp, rel + '.meta'));
            manifest.roots.push(rel);
            manifest.totalFiles += r.files; manifest.totalBytes += r.bytes;
            assetFiles += r.assets;
        }
        for (const rel of BUNDLE_FILES) {
            const src = path.join(proj, rel);
            if (copyFile(src, path.join(tmp, rel))) {
                copyFile(src + '.meta', path.join(tmp, rel + '.meta'));
                manifest.files.push(rel);
                manifest.totalFiles++;
                try { manifest.totalBytes += fs.statSync(path.join(tmp, rel)).size; } catch { /* ignore */ }
            }
        }
        const thumbsSrc = path.join(proj, THUMB_REL);
        if (fs.existsSync(thumbsSrc)) {
            const r = copyDir(thumbsSrc, path.join(tmp, 'thumbs'));
            manifest.thumbs = true;
            manifest.totalFiles += r.files; manifest.totalBytes += r.bytes;
        }

        if (assetFiles === 0) {
            try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* none */ }
            return {
                success: false,
                error: `Nothing to bundle — no assets found under ${LIBRARY_ROOT} (or legacy VFX folders). The existing bundle was left untouched.`,
            };
        }

        fs.writeFileSync(path.join(tmp, 'manifest.json'), JSON.stringify(manifest, null, 2));

        // Swap via rename so a locked file (Explorer, antivirus) can never leave the
        // old bundle half-deleted: renaming it aside either succeeds whole or fails
        // fast while it is still intact, and it is restored if the final swap fails.
        const old = lib + '.old';
        try { fs.rmSync(old, { recursive: true, force: true }); } catch { /* none */ }
        try {
            if (fs.existsSync(lib)) { fs.renameSync(lib, old); }
        } catch (e: any) {
            try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* none */ }
            return { success: false, error: `Bundle folder is in use (${e.message}) — existing bundle left untouched.` };
        }
        try {
            fs.renameSync(tmp, lib);
        } catch (e: any) {
            try { if (fs.existsSync(old) && !fs.existsSync(lib)) { fs.renameSync(old, lib); } } catch { /* best-effort restore */ }
            try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* none */ }
            return { success: false, error: `Failed to install new bundle (${e.message}) — previous bundle restored.` };
        }
        try { fs.rmSync(old, { recursive: true, force: true }); } catch { /* stale .old is harmless */ }

        console.log(`[Library] Bundled: ${manifest.totalFiles} files, ${(manifest.totalBytes / 1048576).toFixed(1)} MB -> ${lib}`);
        return { success: true, ...manifest };
    },

    // Tạo lại các asset từ bundle vào project ĐANG mở, rồi refresh asset-db.
    async reimportLibrary() {
        const proj = projectRoot();
        const lib = libraryRoot();
        const manifestPath = path.join(lib, 'manifest.json');
        if (!fs.existsSync(manifestPath)) {
            return { success: false, error: 'No bundled library found — run Bundle first.' };
        }
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        let files = 0;

        for (const rel of (manifest.roots || [])) {
            const src = path.join(lib, rel);
            if (!fs.existsSync(src)) continue;
            const r = copyDir(src, path.join(proj, rel));
            copyFile(path.join(lib, rel + '.meta'), path.join(proj, rel + '.meta'));
            files += r.files;
        }
        for (const rel of (manifest.files || [])) {
            if (copyFile(path.join(lib, rel), path.join(proj, rel))) {
                copyFile(path.join(lib, rel + '.meta'), path.join(proj, rel + '.meta'));
                files++;
            }
        }
        if (manifest.thumbs) {
            const tsrc = path.join(lib, 'thumbs');
            if (fs.existsSync(tsrc)) { files += copyDir(tsrc, path.join(proj, THUMB_REL)).files; }
        }

        // Reimport everything just written so Cocos picks up the new assets.
        try { await Editor.Message.request('asset-db', 'refresh-asset', 'db://assets'); }
        catch (e) { console.warn('[Library] reImport: asset-db refresh failed', e); }
        console.log(`[Library] reImport: ${files} files -> ${proj}`);
        return { success: true, roots: manifest.roots || [], thumbs: !!manifest.thumbs, files };
    },

    // Read-only status of the bundled library (for the panel's status chip).
    getBundleInfo() {
        const manifestPath = path.join(libraryRoot(), 'manifest.json');
        if (!fs.existsSync(manifestPath)) { return { exists: false }; }
        try {
            const m = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            return {
                exists: true,
                createdAt: m.createdAt || 0,
                totalBytes: m.totalBytes || 0,
                totalFiles: m.totalFiles || 0,
                roots: m.roots || [],
                files: m.files || [],
                thumbs: !!m.thumbs,
            };
        } catch (e: any) {
            return { exists: false, error: e.message };
        }
    },

    openImportReview(data: any) {
        _importReviewData = data;
        Editor.Panel.open('vfx-browser.import-review');
    },

    getImportReviewData() {
        return _importReviewData;
    },

    async startImport(data: any) {
        const { VFXImporter } = require('./services/importer');
        const importer = new VFXImporter();
        const vfxId = data?.vfxId;
        // Defense-in-depth: whatever the (possibly stale) panel put in the payload,
        // imports only ever land inside the library. A destination outside
        // assets/library-extension (e.g. the pre-conversion assets/_VFX/Imported)
        // is rewritten to the pinned default.
        if (data && (!data.importFolder || !String(data.importFolder).startsWith(LIBRARY_ROOT))) {
            if (data.importFolder) {
                console.warn(`[Library] import destination "${data.importFolder}" is outside ${LIBRARY_ROOT} — using ${DEFAULT_VFX_IMPORT_FOLDER}`);
            }
            data.importFolder = DEFAULT_VFX_IMPORT_FOLDER;
        }
        try {
            const result = await importer.execute(data);
            // Broadcast so the (still-open) browser panel can clear the row's "Importing..." lock.
            // Use a fully-qualified broadcast name + panel `messages` subscription — package
            // `contributions.messages.methods` only routes to main-process methods, not panels.
            Editor.Message.broadcast('vfx-browser:import-complete', { ...result, vfxId });
            return result;
        } catch (err: any) {
            const errorMsg = `Import failed: ${err.message}`;
            console.error(errorMsg);
            const result = { success: false, vfxId, prefabName: data?.prefabName, error: errorMsg };
            // Notify on failure too, otherwise the row stays stuck on "Importing..." forever.
            Editor.Message.broadcast('vfx-browser:import-complete', result);
            return result;
        }
    },
};

export async function load() {
    console.log('[iKame Library] Extension loaded');
    await ensureEffectsInstalled();
    await ensureLibraryFolders();
}

export function unload() {
    console.log('[VFX Browser] Extension unloaded');
    _importReviewData = null;
}
