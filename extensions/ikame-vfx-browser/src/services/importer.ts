'use strict';

import * as path from 'path';
import * as fs from 'fs';
import { VFXApiClient } from './api';
import { ImportExecuteData, ImportEntry, ImportResult, MapperContext } from '../mappers/types';
import { mapAllModules } from '../mappers/index';
import { getString, getObj, getArr, isModuleEnabled } from '../utils/json-helpers';
import { meshToGlb, FlatMesh } from '../utils/mesh-to-glb';
import { sanitizeCategoryPath } from '../library/asset-types';

const BUILTIN_PARTICLE_EFFECT_UUID = 'd1346436-ac96-4271-b863-1f4fdead95b0';
const EFFECT_PATH = 'db://assets/effects/vfx-particle.effect';

async function resolveEffectUuid(): Promise<string> {
    try {
        const info: any = await Editor.Message.request('asset-db', 'query-asset-info', EFFECT_PATH);
        if (info?.uuid) {
            console.log(`[VFX] Using custom effect: ${info.uuid}`);
            return info.uuid;
        }
    } catch { /* not found */ }
    console.log(`[VFX] Custom effect not found, fallback to built-in`);
    return BUILTIN_PARTICLE_EFFECT_UUID;
}

export class VFXImporter {
    private _effectUuid: string = BUILTIN_PARTICLE_EFFECT_UUID;

    async execute(data: ImportExecuteData): Promise<ImportResult> {
        console.log('[VFX] Import started');
        this._effectUuid = await resolveEffectUuid();
        const { prefabName, importFolder, particleJson, entries, serverUrl, vfxId, category, particleCount, fileSize } = data;
        const api = new VFXApiClient(serverUrl);
        const warnings: string[] = [];

        let texturesImported = 0;
        let materialsCreated = 0;
        let meshesImported = 0;

        const texturePaths = new Map<string, string>();
        const meshPaths = new Map<string, string>();
        const meshDataMap = new Map<string, any>();
        const materialPaths = new Map<string, string>();

        const selectedEntries = entries.filter(e => e.selected);
        // Nest each effect under its hub category so the import folder's on-disk
        // tree mirrors the VFX Hub catalog (<importFolder>/<category>/<name>/...).
        const prefabDir = `db://${importFolder}/${sanitizeCategoryPath(category || '')}/${prefabName}`;

        // Phase 1: import textures & meshes
        for (const entry of selectedEntries) {
            try {
                if (entry.status === 'exists' && entry.existingPath) {
                    this.recordPath(entry, texturePaths, meshPaths, materialPaths, entry.existingPath);
                    continue;
                }

                switch (entry.type) {
                    case 'texture': {
                        const buffer = await api.downloadAssetBinary(entry.guid);
                        const ext = this.guessTextureExt(entry.name);
                        const assetUrl = `${prefabDir}/textures/${entry.name}${ext}`;
                        await this.writeAssetBinary(assetUrl, buffer);
                        texturePaths.set(entry.guid, assetUrl);
                        texturesImported++;
                        break;
                    }
                    case 'mesh': {
                        const meshRaw = await api.downloadAssetBinary(entry.guid);
                        const meshJsonStr = meshRaw.toString('utf-8');
                        const meshJson = JSON.parse(meshJsonStr);
                        const flatMesh = this.flattenMeshJson(meshJson);
                        meshDataMap.set(entry.guid, flatMesh);
                        const glbBuffer = meshToGlb(flatMesh, entry.name);
                        const assetUrl = `${prefabDir}/meshes/${entry.name}.glb`;
                        await this.writeAssetBinary(assetUrl, glbBuffer);
                        meshPaths.set(entry.guid, assetUrl);
                        meshesImported++;
                        break;
                    }
                    case 'material': {
                        const meta = await api.downloadAssetMeta(entry.guid);
                        materialPaths.set(entry.guid, JSON.stringify(meta));
                        materialsCreated++;
                        break;
                    }
                    default:
                        warnings.push(`Unknown asset type "${entry.type}" for "${entry.name}" — skipped`);
                }
            } catch (err: any) {
                warnings.push(`Failed to import ${entry.type} "${entry.name}": ${err.message}`);
            }
        }

        for (const entry of entries) {
            if (!entry.selected && entry.status === 'exists' && entry.existingPath) {
                this.recordPath(entry, texturePaths, meshPaths, materialPaths, entry.existingPath);
            }
        }

        // Resolve mesh sub-asset UUIDs from imported GLB files
        const meshUuidMap = new Map<string, string>();
        for (const [guid, dbUrl] of meshPaths) {
            const meshSubUuid = this.resolveMeshSubUuid(dbUrl);
            if (meshSubUuid) {
                meshUuidMap.set(guid, meshSubUuid);
            } else {
                warnings.push(`Failed to resolve mesh sub-UUID for "${dbUrl}"`);
            }
        }

        const rootNode = getObj(particleJson, 'root');
        if (!rootNode) {
            return {
                success: false, vfxId, prefabName, nodesCreated: 0,
                texturesImported, materialsCreated, meshesImported, warnings,
                error: 'No "root" node in particle.json',
            };
        }

        // Phase 2: create .mtl files per PS node (needs texture UUIDs from phase 1)
        const materialUuidMap = new Map<string, string>(); // key = "AB|texDbUrl" -> material UUID
        const texturesDict = particleJson['textures'] || {};
        await this.createMaterialFiles(rootNode, {
            textures: texturePaths,
            texturesDict,
            prefabDir,
            warnings,
            materialUuidMap,
        });
        materialsCreated = materialUuidMap.size;

        // Phase 3: build node descriptors (now with material UUIDs)
        const nodeDescriptors = this.buildNodeDescriptors(rootNode, {
            textures: texturePaths,
            meshes: meshPaths,
            meshDataMap,
            meshUuidMap,
            materials: materialPaths,
            importFolder,
            warnings,
            nodeName: '',
            texturesDict: particleJson['textures'] || {},
        }, materialUuidMap);

        // Phase 4: scene script creates nodes (returns psNodes for material assignment)
        let nodesCreated = 0;
        let rootUuid = '';
        let psNodes: { nodeUuid: string; materialUuid: string; rendererModule?: any; startSizeX?: any }[] = [];
        try {
            const result: any = await Editor.Message.request(
                'scene', 'execute-scene-script',
                { name: 'vfx-browser', method: 'buildVFXHierarchy', args: [nodeDescriptors, prefabDir] }
            );
            nodesCreated = result?.nodesCreated || 0;
            rootUuid = result?.rootUuid || '';
            psNodes = result?.psNodes || [];
            if (result?.warnings) warnings.push(...result.warnings);
        } catch (err: any) {
            return {
                success: false, vfxId, prefabName, nodesCreated: 0,
                texturesImported, materialsCreated, meshesImported, warnings,
                error: `Scene script error: ${err.message}`,
            };
        }

        // Phase 5: assign materials & renderer via Editor scene API
        for (const psNode of psNodes) {
            // Material assignment
            if (psNode.materialUuid) {
                try {
                    const matPaths = [
                        '__comps__.0.sharedMaterials.0',
                        '__comps__.0.renderer.sharedMaterials.0',
                    ];
                    let assigned = false;
                    for (const propPath of matPaths) {
                        try {
                            await Editor.Message.request('scene', 'set-property', {
                                uuid: psNode.nodeUuid,
                                path: propPath,
                                dump: {
                                    type: 'cc.Material',
                                    value: { uuid: psNode.materialUuid },
                                },
                            });
                            assigned = true;
                            break;
                        } catch { /* try next path */ }
                    }
                    if (!assigned) {
                        warnings.push(`Material assignment failed for node ${psNode.nodeUuid}`);
                    }
                } catch (err: any) {
                    warnings.push(`Material assignment failed: ${err.message}`);
                }
            }

            // Renderer properties via set-property (scene script may not persist these)
            const rn = psNode.rendererModule;
            if (rn) {
                await this.setPropertySafe(psNode.nodeUuid, '__comps__.0.renderer.renderMode', rn.renderMode ?? 0, warnings);
                if (rn.renderMode === 1) {
                    await this.setPropertySafe(psNode.nodeUuid, '__comps__.0.renderer.velocityScale', rn.velocityScale ?? 0, warnings);
                    await this.setPropertySafe(psNode.nodeUuid, '__comps__.0.renderer.lengthScale', rn.lengthScale ?? 2, warnings);
                }
                // Mesh assignment for mesh render mode
                if (rn.renderMode === 4 && rn.meshUuid) {
                    try {
                        await Editor.Message.request('scene', 'set-property', {
                            uuid: psNode.nodeUuid,
                            path: '__comps__.0.renderer.mesh',
                            dump: { type: 'cc.Mesh', value: { uuid: rn.meshUuid } },
                        });
                    } catch {
                        warnings.push(`Mesh assignment failed for node ${psNode.nodeUuid}`);
                    }
                }
            }
        }

        // Phase 6: save the built hierarchy as a .prefab inside a "prefab" subfolder of the
        // asset folder, and link the live scene node to it (Cocos native scene.create-prefab).
        let prefabPath = '';
        let prefabUuid = '';
        if (rootUuid && nodesCreated > 0) {
            try {
                const prefabFolder = `${prefabDir}/prefab`;
                await this.ensureFolder(prefabFolder);
                prefabPath = `${prefabFolder}/${prefabName}.prefab`;
                const created: any = await Editor.Message.request('scene', 'create-prefab', rootUuid, prefabPath);
                prefabUuid = (typeof created === 'string' ? created : created?.uuid) || '';
                // create-prefab's asset import can lag; fall back to querying asset-db.
                if (!prefabUuid) {
                    prefabUuid = await this.queryAssetUuidRetry(prefabPath, 6, 200);
                }
                if (prefabUuid) {
                    console.log(`[VFX] Prefab created: ${prefabPath} (${prefabUuid})`);
                } else {
                    warnings.push(`Prefab created but UUID not resolved for "${prefabPath}"`);
                }
            } catch (err: any) {
                warnings.push(`Failed to create prefab: ${err.message}`);
                prefabPath = '';
            }
        } else {
            warnings.push('No particle node created — prefab not generated');
        }

        // Phase 7: the prefab asset now exists on disk, so remove the temporary
        // instance from the live scene — import shouldn't leave nodes behind.
        if (rootUuid && prefabPath) {
            try {
                await Editor.Message.request('scene', 'remove-node', { uuid: rootUuid });
                console.log(`[VFX] Removed temporary scene node ${rootUuid} after import`);
            } catch (err: any) {
                warnings.push(`Failed to remove scene node after import: ${err.message}`);
            }
        }

        // Cache the webm thumbnail + metadata locally (outside assets/) so the Local page can
        // show this asset offline. Done here in the main process — Editor.Project.path is
        // reliable and it doesn't depend on any panel broadcast being delivered.
        if (prefabPath) {
            await this.cacheLocalThumbnail(api, vfxId, prefabName,
                { category, particleCount, fileSize }, prefabPath, prefabUuid, warnings);
        }

        this.logSummary(prefabName, nodesCreated, texturesImported, materialsCreated, meshesImported, warnings);
        return { success: true, vfxId, prefabPath, prefabUuid, prefabName, nodesCreated, texturesImported, materialsCreated, meshesImported, warnings };
    }

    /** Download the webm thumbnail + write a metadata record into the local cache. */
    private async cacheLocalThumbnail(
        api: VFXApiClient, vfxId: string, prefabName: string,
        meta: { category?: string; particleCount?: number; fileSize?: number },
        prefabPath: string, prefabUuid: string, warnings: string[]
    ): Promise<void> {
        try {
            const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();
            const dir = path.join(projectPath, 'local', 'vfx-thumbs');
            fs.mkdirSync(dir, { recursive: true });
            const safe = prefabName.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const rec: any = {
                id: vfxId || '',
                name: prefabName,
                category: meta.category || '',
                particleCount: meta.particleCount || 0,
                fileSize: meta.fileSize || 0,
                prefabPath: prefabPath || '',
                prefabUuid: prefabUuid || '',
                importedAt: Date.now(),
            };
            if (vfxId) {
                try {
                    const buf = await api.downloadThumbnail(vfxId);
                    fs.writeFileSync(path.join(dir, `${safe}.webm`), buf);
                    rec.thumb = `${safe}.webm`;
                } catch (e: any) {
                    warnings.push(`Thumbnail cache failed: ${e.message}`);
                }
            }
            fs.writeFileSync(path.join(dir, `${safe}.json`), JSON.stringify(rec, null, 2), 'utf-8');
        } catch (e: any) {
            warnings.push(`Local cache write failed: ${e.message}`);
        }
    }

    /** Ensure a db:// folder exists on disk and is registered in the asset-db. */
    private async ensureFolder(dbUrl: string): Promise<void> {
        const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();
        const absPath = path.join(projectPath, dbUrl.replace('db://', ''));
        fs.mkdirSync(absPath, { recursive: true });
        try { await Editor.Message.request('asset-db', 'refresh-asset', dbUrl); } catch { /* best-effort */ }
    }

    /** Poll asset-db for a freshly-written asset's UUID (import can lag behind creation). */
    private async queryAssetUuidRetry(dbUrl: string, attempts: number, delayMs: number): Promise<string> {
        for (let i = 0; i < attempts; i++) {
            try {
                const info: any = await Editor.Message.request('asset-db', 'query-asset-info', dbUrl);
                if (info?.uuid) return info.uuid;
            } catch { /* not imported yet */ }
            await new Promise<void>((res) => setTimeout(res, delayMs));
        }
        return '';
    }

    /**
     * Walk node tree, for each PS create a .mtl file per unique (blendMode + textureGuid).
     * Same texture GUID = share material. Different texture = different material.
     */
    private async createMaterialFiles(
        nodeJson: Record<string, any>,
        ctx: {
            textures: Map<string, string>;
            texturesDict: Record<string, any>;
            prefabDir: string;
            warnings: string[];
            materialUuidMap: Map<string, string>;
        }
    ): Promise<void> {
        const psJson = getObj(nodeJson, 'particleSystem');
        const nodeName = getString(nodeJson, 'name', '?');
        if (psJson) {
            const blendMode = getString(psJson, 'blendMode', 'AB');
            let mainTexGuid = getString(psJson, 'mainTexture', '');
            const matKey = blendMode === 'ADD' ? 'ADD' : 'AB';
            const matProps = getObj(psJson, 'materialProps') || {};

            // TSA sprites mode: texture comes from sprite atlas, overrides mainTexture
            const tsa = getObj(psJson, 'textureSheetAnimationModule');
            if (tsa && isModuleEnabled(tsa) && getString(tsa, 'mode', 'grid') === 'sprites') {
                const sprites: string[] = getArr(tsa, 'sprites');
                if (sprites.length > 0) {
                    const texGuid = this.findTextureGuidForSprite(sprites[0], ctx.texturesDict);
                    if (texGuid) mainTexGuid = texGuid;
                }
            }

            if (mainTexGuid) {
                const dedupeKey = `${matKey}|${mainTexGuid}`;
                if (!ctx.materialUuidMap.has(dedupeKey)) {
                    const texDbUrl = ctx.textures.get(mainTexGuid) || '';
                    const texSubUuid = texDbUrl ? this.resolveTextureSubUuid(texDbUrl) : '';
                    const texName = texDbUrl ? path.basename(texDbUrl, path.extname(texDbUrl)) : mainTexGuid.substring(0, 8);
                    const safeName = `mat_${matKey}_${texName}`;
                    const matDbUrl = `${ctx.prefabDir}/materials/${safeName}.mtl`;

                    const mtlContent = this.buildMtlJson(safeName, matKey, texSubUuid, matProps, ctx.textures);
                    await this.writeAssetText(matDbUrl, mtlContent);

                    const matUuid = this.resolveAssetUuid(matDbUrl);
                    if (matUuid) {
                        ctx.materialUuidMap.set(dedupeKey, matUuid);
                    } else {
                        ctx.warnings.push(`Failed to resolve UUID for material "${matDbUrl}"`);
                    }
                }
            } else {
                const fallbackKey = `${matKey}|__default__`;
                if (!ctx.materialUuidMap.has(fallbackKey)) {
                    const safeName = `mat_${matKey}_default`;
                    const matDbUrl = `${ctx.prefabDir}/materials/${safeName}.mtl`;
                    const mtlContent = this.buildMtlJson(safeName, matKey, '', matProps, ctx.textures);
                    await this.writeAssetText(matDbUrl, mtlContent);
                    const matUuid = this.resolveAssetUuid(matDbUrl);
                    if (matUuid) ctx.materialUuidMap.set(fallbackKey, matUuid);
                }
            }

            // Store resolved texture GUID back so buildNodeDescriptors can use it for dedup lookup
            if (mainTexGuid) {
                (psJson as any)['_resolvedTexGuid'] = mainTexGuid;
            }
        }

        const children = getArr(nodeJson, 'children');
        for (const child of children) {
            await this.createMaterialFiles(child, ctx);
        }
    }

    private buildMtlJson(
        name: string, blendMode: string, textureSubUuid: string,
        matProps?: Record<string, any>, textures?: Map<string, string>
    ): string {
        const techIdx = blendMode === 'ADD' ? 0 : 1;
        const props: Record<string, any> = {};

        // Main texture
        if (textureSubUuid) {
            props['mainTexture'] = { '__uuid__': textureSubUuid };
        }

        // Tint color — always white; Unity _TintColor is decorative (shader *2 compensates 0.5 default)
        props['tintColor'] = { '__type__': 'cc.Color', 'r': 255, 'g': 255, 'b': 255, 'a': 255 };

        // Tiling/offset
        const to = matProps?.tilingOffset;
        if (Array.isArray(to) && to.length >= 4) {
            props['mainTiling_Offset'] = { '__type__': 'cc.Vec4', 'x': to[0], 'y': to[1], 'z': to[2], 'w': to[3] };
        }

        // Emission extra multiplier (shader already has hardcoded *2.0 like built-in)
        if (matProps?.emission != null) {
            props['emissionScale'] = { '__type__': 'cc.Vec4', 'x': matProps.emission, 'y': 0, 'z': 0, 'w': 0 };
        }

        // UV scroll speed
        const spd = matProps?.speedMainTexUV_NoiseZW;
        if (Array.isArray(spd) && spd.length >= 4) {
            props['speedMainTexUVNoiseZW'] = { '__type__': 'cc.Vec4', 'x': spd[0], 'y': spd[1], 'z': spd[2], 'w': spd[3] };
        }

        // Distortion
        const dist = matProps?.distortionSpeedXY_PowerZ;
        if (Array.isArray(dist) && dist.length >= 4) {
            props['distortSpeedXYPowerZW'] = { '__type__': 'cc.Vec4', 'x': dist[0], 'y': dist[1], 'z': dist[2], 'w': dist[3] };
        }

        // Noise texture
        if (matProps?.noiseTexture && textures) {
            const noiseSubUuid = this.resolveTexSubUuidByGuid(matProps.noiseTexture, textures);
            if (noiseSubUuid) props['noiseTexture'] = { '__uuid__': noiseSubUuid };
        }

        // Mask texture
        if (matProps?.maskTexture && textures) {
            const maskSubUuid = this.resolveTexSubUuidByGuid(matProps.maskTexture, textures);
            if (maskSubUuid) props['maskTexture'] = { '__uuid__': maskSubUuid };
        }

        // Flow texture
        if (matProps?.flowTexture && textures) {
            const flowSubUuid = this.resolveTexSubUuidByGuid(matProps.flowTexture, textures);
            if (flowSubUuid) props['flowTexture'] = { '__uuid__': flowSubUuid };
        }

        const mtl = {
            '__type__': 'cc.Material',
            '_name': name,
            '_effectAsset': { '__uuid__': this._effectUuid },
            '_techIdx': techIdx,
            '_defines': [{}],
            '_states': [{}],
            '_props': [props],
        };
        return JSON.stringify(mtl, null, 2);
    }

    private resolveTexSubUuidByGuid(guid: string, textures: Map<string, string>): string {
        const texDbUrl = textures.get(guid);
        if (!texDbUrl) return '';
        return this.resolveTextureSubUuid(texDbUrl);
    }

    private findTextureGuidForSprite(spriteName: string, texturesDict: Record<string, any>): string {
        if (!spriteName) return '';
        for (const [guid, texInfo] of Object.entries(texturesDict)) {
            const info = texInfo as any;
            // Match single-sprite textures by texture name
            if (info.name === spriteName) return guid;
            // Match atlas sub-sprites by sprite name
            const sprites: any[] = info.sprites || [];
            if (sprites.some((s: any) => s.name === spriteName)) return guid;
        }
        return '';
    }

    private buildNodeDescriptors(
        nodeJson: Record<string, any>,
        parentCtx: Omit<MapperContext, 'nodeName'> & { nodeName: string },
        materialUuidMap: Map<string, string>
    ): Record<string, any> {
        const name = getString(nodeJson, 'name', 'VFXNode');
        const transform = getObj(nodeJson, 'transform') || {};
        const psJson = getObj(nodeJson, 'particleSystem');

        const ctx: MapperContext = {
            nodeName: name,
            textures: parentCtx.textures,
            meshes: parentCtx.meshes,
            meshDataMap: parentCtx.meshDataMap,
            meshUuidMap: parentCtx.meshUuidMap,
            materials: parentCtx.materials,
            importFolder: parentCtx.importFolder,
            warnings: parentCtx.warnings,
            texturesDict: parentCtx.texturesDict,
        };

        let modules: Record<string, any> = {};
        let blendMode = 'AB';
        let materialUuid = '';

        if (psJson) {
            modules = mapAllModules(psJson, ctx);
            blendMode = getString(psJson, 'blendMode', 'AB');
            const mainTexGuid = (psJson as any)['_resolvedTexGuid'] || getString(psJson, 'mainTexture', '');
            const matKey = blendMode === 'ADD' ? 'ADD' : 'AB';
            const dedupeKey = mainTexGuid ? `${matKey}|${mainTexGuid}` : `${matKey}|__default__`;
            materialUuid = materialUuidMap.get(dedupeKey) || '';
        }

        const children = getArr(nodeJson, 'children').map((child: any) =>
            this.buildNodeDescriptors(child, parentCtx, materialUuidMap)
        );

        return {
            name,
            transform: {
                localPosition: transform['localPosition'] || [0, 0, 0],
                localRotation: transform['localRotation'] || [0, 0, 0, 1],
                localScale: transform['localScale'] || [1, 1, 1],
            },
            hasParticleSystem: !!psJson,
            modules,
            blendMode,
            materialUuid,
            children,
        };
    }

    private recordPath(
        entry: ImportEntry,
        textures: Map<string, string>,
        meshes: Map<string, string>,
        materials: Map<string, string>,
        assetPath: string
    ): void {
        switch (entry.type) {
            case 'texture': textures.set(entry.guid, assetPath); break;
            case 'mesh': meshes.set(entry.guid, assetPath); break;
            case 'material': materials.set(entry.guid, assetPath); break;
        }
    }

    private guessTextureExt(name: string): string {
        const lower = name.toLowerCase();
        if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return '';
        return '.png';
    }

    private async writeAssetBinary(dbUrl: string, buffer: Buffer): Promise<void> {
        const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();
        const relativePath = dbUrl.replace('db://', '');
        const absPath = path.join(projectPath, relativePath);
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, buffer);
        await Editor.Message.request('asset-db', 'refresh-asset', dbUrl);
    }

    private async writeAssetText(dbUrl: string, content: string): Promise<void> {
        const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();
        const relativePath = dbUrl.replace('db://', '');
        const absPath = path.join(projectPath, relativePath);
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, content, 'utf-8');
        await Editor.Message.request('asset-db', 'refresh-asset', dbUrl);
    }

    private resolveAssetUuid(dbUrl: string): string {
        try {
            const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();
            const relativePath = dbUrl.replace('db://', '');
            const absPath = path.join(projectPath, relativePath);
            const metaPath = absPath + '.meta';
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                return meta.uuid || '';
            }
        } catch (err) { /* ignore */ }
        return '';
    }

    private resolveTextureSubUuid(dbUrl: string): string {
        try {
            const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();
            const relativePath = dbUrl.replace('db://', '');
            const absPath = path.join(projectPath, relativePath);
            const metaPath = absPath + '.meta';
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                // Texture sub-asset UUID: uuid@6c48a
                if (meta.subMetas) {
                    for (const [subId, subMeta] of Object.entries(meta.subMetas)) {
                        const sm = subMeta as any;
                        if (sm.importer === 'texture' && sm.uuid) {
                            return sm.uuid; // e.g. "88473391-...@6c48a"
                        }
                    }
                }
                return meta.uuid || '';
            }
        } catch (err) { /* ignore */ }
        return '';
    }

    private resolveMeshSubUuid(dbUrl: string): string {
        try {
            const projectPath = Editor.Project?.path || (Editor as any).projectPath || process.cwd();
            const relativePath = dbUrl.replace('db://', '');
            const absPath = path.join(projectPath, relativePath);
            const metaPath = absPath + '.meta';
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                if (meta.subMetas) {
                    for (const [, subMeta] of Object.entries(meta.subMetas)) {
                        const sm = subMeta as any;
                        if (sm.importer === 'gltf-mesh' && sm.uuid) {
                            return sm.uuid;
                        }
                        // Recurse into nested subMetas (mesh may be nested under a node)
                        if (sm.subMetas) {
                            for (const [, nested] of Object.entries(sm.subMetas)) {
                                const nsm = nested as any;
                                if (nsm.importer === 'gltf-mesh' && nsm.uuid) {
                                    return nsm.uuid;
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) { /* ignore */ }
        return '';
    }

    private flattenMeshJson(meshJson: Record<string, any>): FlatMesh {
        const verts: number[][] = meshJson.vertices || [];
        const tris: number[] = meshJson.triangles || [];
        const norms: number[][] = meshJson.normals || [];
        const uvArr: number[][] = meshJson.uvs || [];

        const positions: number[] = [];
        for (const v of verts) {
            positions.push(v[0], v[1], -v[2]);
        }

        // Reverse winding order to compensate for Z negation
        const indices: number[] = [];
        for (let i = 0; i < tris.length; i += 3) {
            indices.push(tris[i], tris[i + 2], tris[i + 1]);
        }

        const normals: number[] = [];
        for (const n of norms) {
            normals.push(n[0], n[1], -n[2]);
        }

        const uvs: number[] = [];
        for (const uv of uvArr) {
            uvs.push(uv[0], uv[1]);
        }

        return { positions, indices, normals, uvs };
    }

    private async setPropertySafe(nodeUuid: string, propPath: string, value: any, warnings: string[]): Promise<void> {
        try {
            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUuid,
                path: propPath,
                dump: { type: typeof value === 'number' ? 'cc.Float' : 'cc.CurveRange', value },
            });
        } catch {
            warnings.push(`set-property "${propPath}" failed on node ${nodeUuid}`);
        }
    }

    private logSummary(
        prefabName: string, nodesCreated: number, texturesImported: number,
        materialsCreated: number, meshesImported: number, warnings: string[]
    ): void {
        const lines: string[] = [];
        lines.push(`[VFX] Import "${prefabName}" completed:`);
        lines.push(`  ${nodesCreated} nodes, ${texturesImported} textures, ${materialsCreated} materials, ${meshesImported} meshes`);
        if (warnings.length > 0) {
            lines.push(`  Warnings:`);
            warnings.forEach(w => lines.push(`    - ${w}`));
        }
        const msg = lines.join('\n');
        if (warnings.length > 0) { console.warn(msg); } else { console.log(msg); }
    }
}
