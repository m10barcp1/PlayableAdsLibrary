'use strict';

// ---------------------------------------------------------------------------
// The library lives under a single project folder; every supported asset
// format gets its own subfolder. Both the main process (folder scaffolding,
// bundle/reimport) and the browser panel (albums, scanning, previews) key off
// this catalog, so adding a format here is the only change needed.
// ---------------------------------------------------------------------------

/** How a card renders its thumbnail. */
export type PreviewKind = 'render' | 'icon' | 'audio' | 'image';

/** One supported asset format ("kind") in the library. */
export interface AssetTypeDef {
    key: string;
    label: string;
    /** Subfolder under LIBRARY_ROOT that holds this kind. */
    folder: string;
    /** File extensions (lowercase, with leading dot) that belong to this kind. */
    extensions: string[];
    preview: PreviewKind;
    icon: string;
    /** If set, only assets imported by one of these importers count as this kind. */
    importers?: string[];
    /** VFX only: top-level subfolders shown flattened as their own category. */
    flattenTopFolders?: string[];
    /** If set, category paths are trimmed to this many leading segments for display. */
    categoryDepth?: number;
    /** Shown when the kind's folder is empty. */
    emptyHint?: string;
}

export const LIBRARY_ROOT = 'assets/library-extension';

/**
 * Where server-imported VFX land (also the default of the importFolder
 * profile). The VFX library groups effects as _VFX/{3DCartoon, UniversalCartoon,
 * Custom_VFX}; the importer nests each effect under its hub category inside
 * this folder (<importFolder>/<category>/<name>/...), so Custom_VFX's on-disk
 * folder tree mirrors the VFX Hub catalog.
 */
export const DEFAULT_VFX_IMPORT_FOLDER = `${LIBRARY_ROOT}/_VFX/Custom_VFX`;

/**
 * Turn a hub category path ("EpicToonFX/Combat/Nova") into a safe relative
 * folder path: each segment loses characters Windows forbids plus trailing
 * dots/spaces; empty input falls back to "Uncategorized".
 */
export function sanitizeCategoryPath(category: string): string {
    const clean = (category || '')
        .split('/')
        .map((s) => s.replace(/[\\:*?"<>|]/g, '_').trim().replace(/[. ]+$/, ''))
        .filter(Boolean)
        .join('/');
    return clean || 'Uncategorized';
}

/**
 * Pre-conversion VFX locations. The importFolder profile default used to be
 * assets/_VFX/Imported and the packs had their own hardcoded albums; nothing
 * ever persisted those paths into the project profile, so they must stay
 * hardcoded here or every pre-conversion project loses its VFX from the scan.
 * The VFX album scans these in addition to the library folder.
 */
export const LEGACY_VFX_SCAN_ROOTS: Array<{ folder: string; excludeGpu?: boolean }> = [
    { folder: 'assets/_VFX/Imported' },
    { folder: 'assets/3D cartoon effects/prefabs' },
    { folder: 'assets/ Universal cartoon particle FX I/Particle', excludeGpu: true },
];

/**
 * Folders the pre-conversion bundle carried. Still bundled (when present) so
 * re-bundling in a legacy-layout project keeps covering the old locations
 * instead of silently producing an empty bundle.
 */
export const LEGACY_BUNDLE_ROOTS = [
    'assets/_VFX',
    'assets/3D cartoon effects',
    'assets/ Universal cartoon particle FX I',
];

export const ASSET_TYPES: AssetTypeDef[] = [
    {
        key: 'vfx', label: 'VFX', folder: '_VFX',
        extensions: ['.prefab'], preview: 'render', icon: '✦',
        flattenTopFolders: ['3DCartoon', 'UniversalCartoon'],
        emptyHint: 'Import effects from the Hub tab, or drop VFX prefabs into 3DCartoon / UniversalCartoon / Custom_VFX subfolders.',
    },
    {
        key: 'animation', label: 'Animation', folder: 'Animation',
        extensions: ['.anim'], preview: 'icon', icon: '▶',
        emptyHint: 'Drop .anim clips into this folder.',
    },
    {
        key: 'spine', label: 'Spine', folder: 'Spine',
        // Rendered live in the scene process: cards show an animated capture of
        // one (skin, animation) combination, selectable on the card.
        extensions: ['.json', '.skel'], importers: ['spine-data'], preview: 'render', icon: '🦴',
        emptyHint: 'Drop Spine skeletons (.json/.skel with their .atlas + textures) into this folder.',
    },
    {
        // Rendered live in the scene process: cards show an animated turntable (or,
        // if the model rigs a skeletal clip, that clip) captured from the FBX/glTF
        // prefab sub-asset. See captureModelPreview in scene.ts.
        key: 'fbx', label: 'FBX', folder: 'FBX',
        extensions: ['.fbx', '.glb', '.gltf'], preview: 'render', icon: '◆',
        emptyHint: 'Drop .fbx/.glb/.gltf models into this folder.',
    },
    {
        key: 'audio', label: 'Audio', folder: 'Audio',
        extensions: ['.mp3', '.wav', '.ogg', '.m4a'], preview: 'audio', icon: '♪',
        emptyHint: 'Drop audio clips (.mp3/.wav/.ogg/.m4a) into this folder.',
    },
    {
        key: 'prefab', label: 'Prefab', folder: 'Prefab',
        extensions: ['.prefab'], preview: 'render', icon: '⬡',
        emptyHint: 'Drop .prefab files into this folder.',
    },
    {
        // Rendered live in the scene process: the .mtl is applied to a lit sphere
        // and captured as an animated turntable GIF. See captureMaterialPreview in
        // scene.ts. The importer filter keeps plain .mtl material assets and drops
        // anything that shares the extension but imports as something else.
        key: 'material', label: 'Material', folder: 'Material',
        extensions: ['.mtl'], importers: ['material'], preview: 'render', icon: '🔮',
        emptyHint: 'Drop .mtl material files into this folder.',
    },
    {
        key: 'texture', label: 'Texture', folder: 'Texture',
        extensions: ['.png', '.jpg', '.jpeg', '.webp'], preview: 'image', icon: '🖼',
        emptyHint: 'Drop images (.png/.jpg/.webp) into this folder.',
    },
    // Code kinds for playable-ad building (curated from the resource sheet). No
    // live render preview — shaders/scripts show an icon card like Animation.
    {
        // Card shows a sibling preview image (<name>.gif/.png next to the .effect,
        // e.g. lifted from the source repo's README GIFs); falls back to the 🎨
        // glyph when no sibling exists. See the 'image' branch in browser scanning.
        key: 'effect', label: 'Effect', folder: 'Effect',
        extensions: ['.effect'], preview: 'image', icon: '🎨',
        emptyHint: 'Drop .effect shaders here (e.g. from yeshao2069/CocosCreatorShader — 3.7.x, MIT): the FX/hook layer.',
    },
    {
        // Reusable gameplay/mechanic + perf/ui scripts, grouped by subfolder
        // (Scripts/mechanics, Scripts/perf, Scripts/ui) which show as categories.
        key: 'script', label: 'Script', folder: 'Scripts',
        extensions: ['.ts'], preview: 'icon', icon: '⚙',
        emptyHint: 'Drop reusable .ts scripts into Scripts/mechanics, Scripts/perf or Scripts/ui.',
    },
];

export function assetTypeByKey(key: string): AssetTypeDef | undefined {
    return ASSET_TYPES.find((t) => t.key === key);
}

/** Project-relative folder for a type, e.g. "assets/library-extension/Audio". */
export function libraryTypeDir(def: AssetTypeDef): string {
    return `${LIBRARY_ROOT}/${def.folder}`;
}

/** Best-effort MIME type for previewing a local file via a Blob URL. */
export function mimeForExt(ext: string): string {
    switch (ext.toLowerCase()) {
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.webp': return 'image/webp';
        case '.gif': return 'image/gif';
        case '.mp3': return 'audio/mpeg';
        case '.wav': return 'audio/wav';
        case '.ogg': return 'audio/ogg';
        case '.m4a': return 'audio/mp4';
        case '.webm': return 'video/webm';
        default: return 'application/octet-stream';
    }
}
