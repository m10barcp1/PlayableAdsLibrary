# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A **Cocos Creator 3.8.7** project (`package.json` declares `creator.version: 3.8.7`) that serves as the host/sandbox for an in-house editor extension, **playable-ads-library** (Cocos package name `vfx-browser`, panel title "Playable Ads Library") — now the primary thing actively developed in this repo. There is no game/application source code to speak of; the interesting surface area is the extensions, and above all `playable-ads-library`.

The current `assets/` tree is:
- `assets/effects/` — `vfx-particle.effect` (a stable-UUID particle effect the extension scaffolds and bundles).
- `assets/library-extension/` — the new **format-keyed asset library**: `Animation/`, `Audio/`, `FBX/`, `Material/`, `Prefab/`, `Spine/`, `Texture/`, `_VFX/`. This is the library `playable-ads-library` browses, bundles, and syncs.
- `scene.scene` + `scene-001.scene` — two working scenes.

(The old `assets/NewComponent.ts` stub, `assets/Scripts/Spline/*`, and the `assets/Sprite/` art library have all been deleted — ignore any lingering references to them.)

## Architecture: the four editor extensions

All four live under `extensions/` and are loaded by Cocos Creator when the project opens. Two of them (`cocos-mcp-v1.7.6-all`, `ScriptableAsset`) are **distributed as prebuilt `dist/` bundles** with no repo source; `super-html` and `playable-ads-library` ship real TypeScript sources. Only `cocos-mcp`'s `dist` is obfuscated and off-limits.

### `extensions/playable-ads-library` — the primary, in-house extension (package `vfx-browser`)

An **editable, source-included** Cocos 3.8 extension that browses, bundles, reimports and syncs the multi-format asset library under `assets/library-extension/`, imports server-authored VFX, and renders live animated-GIF thumbnails for renderable formats. Its internal id is **`vfx-browser`** (used for `Editor.Message` routing, `Editor.Profile.getProject('vfx-browser', …)`, panel ids `vfx-browser.browser` / `vfx-browser.import-review`, and `vfx-browser:*` broadcasts) — only the display title and folder are "Playable Ads Library". Refer to all three names so searches resolve.

**Build (this is the real build story):** it is a genuine npm package (`node_modules`, `package-lock.json`) but has **no runtime dependencies** — only devDeps `typescript`/`@types/node`, so nothing but the compiler needs installing and the extension folder is portable on its own. Compile with:

```
cd extensions/playable-ads-library && npm run build     # or: npx tsc  /  npm run watch
```

`tsconfig.json` has `rootDir ./src`, `outDir ./dist`, `module commonjs`, `strict`. Edit `src/**/*.ts` and rebuild — the editor loads the generated `dist/`, never `src/`. **Never hand-edit `dist/`.**

**Source layout (`src/`):**
- `main.ts` — main-process entry: message-routed `methods`, `load()`/`unload()`. Handles panel open, import kickoff, portable bundle/reimport, sync up/down/status, and startup scaffolding (copies `assets/effects/vfx-particle.effect` + creates `assets/library-extension/<Format>` folders from `ASSET_TYPES`).
- `scene.ts` — scene-process script (`contributions.scene.script`); `require('cc')` live-engine work. Four offscreen-RenderTexture capture routines (`captureParticlePreview`, `captureSpinePreview`, `captureModelPreview`, `captureMaterialPreview`) return base64 frame sequences the panel GIF-encodes, plus `buildVFXHierarchy` which builds a live ParticleSystem node tree from a descriptor.
- `panels/browser/` — the dockable "Playable Ads Library" panel (`index.ts` = one `Editor.Panel.define`, no framework; all CSS in `style.ts`).
- `panels/import-review/` — the simple "Import Review" modal shown before server-fetched VFX are written.
- `services/` — I/O + codec layer: `api.ts` (`VFXApiClient`, HTTP client for the external VFX Hub content server), `importer.ts` (`VFXImporter`, the only Editor-dependent service — downloads Hub assets, writes textures/GLB/`.mtl`/`.prefab`, drives scene scripts + `set-property`), `library-sync.ts` (client half of the external library-sync-server; manifest/file/health diff by rel-path + SHA-256), `gif-encoder.ts` (dependency-free NeuQuant+LZW GIF89a encoder). Keep `api.ts`/`library-sync.ts`/`gif-encoder.ts` free of the `Editor` global — `main.ts` and the panel own all IPC.
- `mappers/` + `utils/` — pure particle-system translation layer: `mappers/index.ts` orchestrates a `registry` of one `ModuleMapper` per Unity ParticleSystem module, `mapAllModules()` turns exported Unity per-module JSON into Cocos ParticleSystem descriptors; `utils/` holds value converters (`convertCurve`, `convertGradient`), JSON accessors, and mesh export (`mesh-to-glb.ts`, `mesh-to-obj.ts`). Mappers must stay side-effect-free (only push lossy-conversion notes to `ctx.warnings`).
- `library/asset-types.ts` — **single source of truth** for the library (see below).

**Asset library model.** `library/asset-types.ts` defines `ASSET_TYPES` — one `AssetTypeDef` per supported kind (`key`/`label`/`folder`/`extensions`/`preview`/`icon`/optional `importers` filter, plus VFX-only display hints). The ten kinds: vfx (`_VFX`), animation, spine, fbx, audio, prefab, material, texture, effect, script. `LIBRARY_ROOT = 'assets/library-extension'`. Both the main process (scaffolding, bundle/reimport) and the browser panel (albums/scan/preview) import this one file, so **adding a format is a one-file change here** — keep it dependency-free (no editor/DOM imports). Some kinds (spine, material) are classified by asset-db *importer* (`spine-data`/`material`), not just extension. `LEGACY_VFX_SCAN_ROOTS` / `LEGACY_BUNDLE_ROOTS` are load-bearing hardcodes for pre-conversion layouts (paths never written to the profile) — do not delete them.

**Three-process / IPC model.** Panel (UI) ↔ Main (`main.ts`) ↔ Scene (`scene.ts`), communicating only via `Editor.Message`:
- Panel→main: `Editor.Message.request('vfx-browser', <kebab-message>, …)` using the names in `contributions.messages`.
- Main→scene: `Editor.Message.request('scene', 'execute-scene-script', { name:'vfx-browser', method, args })` — `scene.ts`'s exported `methods` are the callable targets.
- Notifying panels: `contributions.messages.methods` routes **only to main-process methods**, so panels are notified via a fully-qualified broadcast (`Editor.Message.broadcast('vfx-browser:import-complete' | 'vfx-browser:sync-progress', …)`) that the panel subscribes to. Don't try to make a panel a `methods` target.

**Panels & tabs.** The browser panel (Extensions menu → "Playable Ads Library" / message `open-browser`) has four tabs: **Local** (`_page === 'project'`; the same 3-column album-rail → category tree → card grid, but scanning the whole project under `assets/` — its rail gains an **All** album that mixes every format, and categories are the asset's own folder path), **Library** (default; `_page === 'local'` — the curated grid over `assets/library-extension`, and the only page carrying the Bundle/reImport/Sync actions), **VFX Hub** (hidden via inline `display:none` but fully wired — do not delete its logic), and **Settings**. Note the internal page keys are off-by-one from the labels: `'local'` is the *Library* tab, `'project'` is the *Local* tab.

**Scope: this extension is the asset library, nothing else.** Each extension in this repo owns exactly one job, and cross-extension UI does not belong here. The panel used to carry a Cocos MCP tab (a reimplementation of `cocos-mcp-server`'s control panel) and a vendored HTML-export builder; both were removed — MCP is driven from its own extension's panel, HTML/playable export from `super-html`. Don't re-add another extension's UI here.

**Messages / features** (`contributions.messages` → `main.ts` methods): `open-browser`→openBrowser, `open-import-review`/`getImportReviewData` (review panel), `start-import`→startImport, `import-complete` (broadcast-only sink), `bundle-library`/`reimport-library`/`get-bundle-info` (portable bundling of `assets/library-extension` into the extension's `library/` folder, with `.meta` kept so UUIDs survive across projects), `sync-up`/`sync-down`/`get-sync-status` (backed by `services/library-sync.ts` against an external library-sync-server). Thumbnails cache under `local/vfx-thumbs/`. Project profile keys: `serverUrl` (VFX Hub content server), `importFolder` (declared default `assets/library-extension/VFX`, but code uses `DEFAULT_VFX_IMPORT_FOLDER = assets/library-extension/_VFX/Custom_VFX`), `syncUrl` (default `http://127.0.0.1:4650`), `syncToken`. This extension registers **no builder**: HTML/playable export belongs to `super-html` (see below), which owns both the build hook and its own options UI.

### `extensions/cocos-mcp-v1.7.6-all`

A commercial editor extension (`cocos-mcp-server` v1.7.6, author LiDaxian) that exposes the Cocos Creator editor over an **HTTP MCP server**, so external LLM clients (Claude Desktop, Cursor, etc.) can drive the editor. Its own panels are the only UI for it. Its `dist/*` is **obfuscated, minified single-line JS (string-array rotation + RC4-style decoder); treat it as a binary — do not read or edit it.**

- **Transport**: HTTP server at `http://127.0.0.1:3000/mcp` (see `settings/mcp-server.json` — `port: 3000`, `autoStart: false`).
- **Tool surface**: A single `cocos_*` family of tools, each a *router* that dispatches on an `action` field. The full enabled list and per-tool descriptions live in `settings/tool-manager.json` (the source of truth for what's currently exposed). Categories: `scene`, `node`, `component`, `prefab`, `asset`, `editor`, `view`, `composite`, `knowledge`, `validate`, `template`, `capture`, `builder`, `animation`, `spine`, `label`. Each tool entry's `description` field carries action lists, "use X not Y" hints, and batch guidance — read these before calling an unfamiliar tool.
- **Tool implementations**: `dist/tools/cocos/handlers/*-handler.js` (one handler per category, registered in `dist/tools/cocos/cocos-tools.js`).
- **Editor-side scene operations**: `dist/scene.js`, registered in `package.json → contributions.scene.methods`, runs in Cocos' scene process; the MCP server calls these via Editor IPC to reach the live scene.
- **Settings UI**: `dist/panels/default` (server start/stop, port) and `dist/panels/tool-manager` (enable/disable tools, manage config slots). Tool state persists to `settings/tool-manager.json` (`configurations[]`, `currentConfigId`, `maxConfigSlots: 5`).
- **Licensing/update**: `dist/auth/*` (`license-manager`, `device-identity`, `update-checker`). The extension phones home; the `check-license`, `activate-license`, etc. messages in `package.json` are this subsystem. Don't fight this code.
- **Client integration helpers**: `dist/mcp-client-configs.js` + the `add-to-client` / `add-to-all-clients` messages can write `mcpServers` entries into Claude Desktop / Cursor config files automatically.

### `extensions/ScriptableAsset`

Third-party extension (AILHC, v1.0.4) that adds a Unity-`ScriptableObject`-style `.sasset` data file format to Cocos. Registers an asset-db importer (`dist/importer.js`), a custom inspector section, and a right-click create menu. **Templates required by this extension live in `.creator/asset-template/typescript/`**. Source is not in the repo — only the prebuilt `dist/` and a `runtime/` directory mounted into the asset database (see `package.json → contributions.asset-db.mount`).

### `extensions/super-html`

Third-party extension (magician-f, v3.0.0) that bundles HTML/CSS/JS export functionality. Has TypeScript sources alongside its `dist/` (`extensions/super-html/tsconfig.json`, scripts `build: tsc -b` and `watch: tsc -w`) and registers global editor shortcuts (`ctrl+f`, `ctrl+g`, `ctrl+h`) — be aware these may collide with usual key bindings.

**This extension is the single owner of HTML/playable export.** It registers the builder hook (`contributions.builder → ./dist/3x/builder.js`) and its own options panel, which reads/writes `settings/super-html-options.json`. `playable-ads-library` used to vendor a fork of this engine (`html-export/`) plus a duplicate options section in its Settings tab — both are gone, so two builders no longer compete for the same build. Change export behaviour in `super-html`, not in the library extension.

## How to work on this project

There is no build/test/lint pipeline at the **root** level. The root `package.json` (name `TestingMCPSever`) is just the Cocos project marker, not an npm package. Root `tsconfig.json` extends `./temp/tsconfig.cocos.json`, regenerated by the editor — `temp/` is gitignored, so terminal type-checking of project scripts won't work unless the editor has been opened at least once.

- **Working on `playable-ads-library`** (the main task in this repo): edit `extensions/playable-ads-library/src/**/*.ts`, then `cd extensions/playable-ads-library && npm run build`. The editor loads `dist/`, which is generated output — never hand-edit it. To add an asset format, edit `src/library/asset-types.ts` only.
- **Editing project scripts** (`assets/**/*.ts`): just edit. Cocos Creator's watcher compiles on save. Cocos provides `cc` (e.g. `import { _decorator, Component } from 'cc'`).
- **Modifying MCP tooling**: you can't — the cocos-mcp `dist/` is obfuscated. To change tool behavior, edit `settings/tool-manager.json` to enable/disable tools or rewrite a tool's `description` (what the LLM consumer sees).
- **MCP server lifecycle**: `autoStart: false` — the server does **not** come up with the editor. Start it manually via the cocos-mcp extension's own panel (`dist/panels/default`). From a client, point at `http://127.0.0.1:3000/mcp`.
- **Adding the server to an MCP client**: copy the JSON snippet from `extensions/cocos-mcp-v1.7.6-all/INSTALL.md`, or use the extension panel's "add to client" buttons (`dist/mcp-client-configs.js`).

## Conventions worth knowing

- **Asset library layout**: assets live under `assets/library-extension/` in **format-keyed** subfolders (`Animation`, `Audio`, `FBX`, `Material`, `Prefab`, `Spine`, `Texture`, `_VFX`). The set of kinds and their folders/extensions/preview modes is defined in `extensions/playable-ads-library/src/library/asset-types.ts` (`ASSET_TYPES`), mirrored server-side by `KIND_BY_TOP` in the external library-sync-server.
- **Keep `src/library/` tracked**: the `.gitignore` `library/` rule is re-included for this path — `src/library/asset-types.ts` is the library's source of truth and must stay in version control (don't let a blanket `library/` ignore drop it). The extension's **own** `extensions/playable-ads-library/library/` is the opposite case: it is the ~200 MB output of the panel's Bundle button and stays ignored — rebuild it with Bundle, never commit it. (It was briefly tracked when the Cocos ignore rules got deleted by accident; both are restored.)
- **Bundling keeps `.meta`**: bundle/reimport and library-sync deliberately carry `.meta` files verbatim so asset UUIDs stay stable across projects — dropping `.meta` breaks every reference.
- **Engine modules**: `settings/v2/packages/engine.json → includeModules` is the canonical list of Cocos engine modules linked into builds (physics-ammo, physics-2d-box2d, spine-3.8, custom render pipeline, etc.). Adjust here, not in code.
- **`.creator/asset-template/typescript/`** is where Cocos picks up "New Script" templates — also where ScriptableAsset expects its template to live.

## Things not to do

- Don't read or modify `extensions/cocos-mcp-v1.7.6-all/dist/*.js` — heavily obfuscated (string-array rotation + RC4-style decoder). They won't fit in context and editing them breaks signatures.
- Don't hand-edit `extensions/playable-ads-library/dist/*` — it's generated by `tsc` from `src/`. Edit `src/` and rebuild with `npm run build` instead. (This is the opposite of cocos-mcp's `dist`, which must not be touched at all.)
- Don't edit `temp/`, `library/` (the editor's, not the extension's `src/library/`), `local/`, `build/`, `profiles/`, `native/`, or `node_modules/` — all gitignored editor scratch space.
- Don't change the `port: 3000` in `settings/mcp-server.json` casually — every MCP client config in the codebase and in `INSTALL.md` assumes 3000. (`autoStart` is `false`; the server is started manually.)
