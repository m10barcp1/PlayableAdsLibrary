'use strict';

import { join } from 'path';
module.paths.push(join(Editor.App.path, 'node_modules'));

export function load() {
    console.log('[VFX Browser] Scene script loaded');
}

export function unload() {
    console.log('[VFX Browser] Scene script unloaded');
}

/** Minimal base64 for a byte buffer — works with or without Node's Buffer. */
function bytesToBase64(bytes: Uint8Array): string {
    if (typeof Buffer !== 'undefined') { return Buffer.from(bytes).toString('base64'); }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let out = '';
    let i = 0;
    for (; i + 2 < bytes.length; i += 3) {
        const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63] + chars[(n >> 6) & 63] + chars[n & 63];
    }
    if (i < bytes.length) {
        const rem = bytes.length - i;
        const n = (bytes[i] << 16) | (rem > 1 ? bytes[i + 1] << 8 : 0);
        out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63];
        out += rem > 1 ? chars[(n >> 6) & 63] : '=';
        out += '=';
    }
    return out;
}

export const methods = {
    /**
     * Render a particle-effect prefab to an offscreen RenderTexture and capture
     * a short sequence of frames (top-down RGBA, opaque over a dark background).
     * Returns frames as base64 so the panel can encode them into an animated GIF.
     *
     * Everything is built under a temporary, non-serialised root that is torn
     * down in `finally`, so the user's open scene is never modified or saved.
     */
    async captureParticlePreview(prefabUuid: string, opts: any): Promise<any> {
        const cc = require('cc');
        const { director, Node, Camera, RenderTexture, Vec3, Color, instantiate, assetManager, geometry } = cc;
        const warnings: string[] = [];

        const W = (opts && opts.width) || 160;
        const H = (opts && opts.height) || 100;
        const frameCount = (opts && opts.frameCount) || 12;
        const delayMs = (opts && opts.delayMs) || 80;
        const warmupMs = (opts && opts.warmupMs) || 250;

        const scene = director.getScene();
        if (!scene) { return { ok: false, error: 'No active scene', warnings }; }

        const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

        let root: any = null;
        let rt: any = null;
        try {
            // Load the prefab by uuid.
            const prefab: any = await new Promise((resolve, reject) => {
                assetManager.loadAny({ uuid: prefabUuid }, (err: any, asset: any) => {
                    if (err || !asset) reject(err || new Error('prefab not found')); else resolve(asset);
                });
            });

            // Temporary, hidden, non-saved root holding the instance + camera.
            root = new Node('__vfx_thumb_root__');
            const Flags = cc.CCObject && cc.CCObject.Flags;
            if (Flags) { root.hideFlags = (Flags.DontSave | Flags.HideInHierarchy) >>> 0; }
            scene.addChild(root);
            // Park the rig far below the origin so it never flashes in the user's
            // editor viewport while we render (modest offset keeps FP precision sane).
            root.setPosition(0, -100000, 0);

            const inst: any = instantiate(prefab);
            root.addChild(inst);
            inst.setPosition(0, 0, 0);

            // Offscreen render target + camera.
            rt = new RenderTexture();
            rt.reset({ width: W, height: H });

            const camNode = new Node('__vfx_thumb_cam__');
            root.addChild(camNode);
            const cam = camNode.addComponent(Camera);
            cam.projection = Camera.ProjectionType ? Camera.ProjectionType.PERSPECTIVE : 0;
            cam.fov = 45;
            cam.near = 0.01;
            cam.far = 1000000; // large, so oversized effects aren't clipped by the far plane
            cam.clearFlags = (Camera.ClearFlag && Camera.ClearFlag.SOLID_COLOR) != null
                ? Camera.ClearFlag.SOLID_COLOR : 7;
            cam.clearColor = new Color(12, 12, 16, 255); // opaque, matches the card backdrop
            cam.priority = 1000;
            cam.visibility = 0xffffffff;
            cam.targetTexture = rt;

            // A directional light so lit-material (mesh) effects aren't pitch black.
            // Unlit/additive particles ignore it.
            try {
                const DirectionalLight = cc.DirectionalLight;
                if (DirectionalLight) {
                    const lightNode = new Node('__vfx_thumb_light__');
                    root.addChild(lightNode);
                    const dl = lightNode.addComponent(DirectionalLight);
                    try { dl.illuminance = 80000; } catch { /* older prop name */ }
                    lightNode.setRotationFromEuler(-50, -40, 0);
                }
            } catch { /* lighting optional */ }

            // Start every particle system in the instance.
            const PS = cc.ParticleSystem;
            const systems: any[] = PS ? inst.getComponentsInChildren(PS) : [];
            for (const ps of systems) {
                try { ps.stop && ps.stop(); ps.clear && ps.clear(); ps.play && ps.play(); } catch { /* ignore */ }
            }

            // The editor renders on-demand and won't advance our offscreen camera
            // or the particles on its own, so we pump the engine deterministically.
            const dt = Math.max(0.016, delayMs / 1000);
            let tickOk = typeof director.tick === 'function';
            const pump = async () => {
                if (tickOk) {
                    try { director.tick(dt); return; }
                    catch (e: any) { warnings.push(`tick: ${e.message}`); tickOk = false; }
                }
                await sleep(delayMs);
            };

            // Warm up so particles spawn before we frame + capture.
            const warmupTicks = Math.max(1, Math.round(warmupMs / (dt * 1000)));
            for (let i = 0; i < warmupTicks; i++) { await pump(); }

            // Initial framing from geometry — only a starting guess; the real fit
            // comes from measuring the rendered pixels below.
            const center = new Vec3(0, 0, 0);
            let radius = 2.0;
            try {
                const bounds = computeWorldBounds(inst, cc);
                if (bounds) {
                    center.set(bounds.center);
                    radius = Math.max(0.25, bounds.radius);
                }
            } catch (e: any) { warnings.push(`bounds: ${e.message}`); }

            const fovRad = (cam.fov * Math.PI) / 180;
            const pad = (opts && opts.padding) || 1.35;
            const dir = new Vec3(0, 0.18, 1);
            dir.normalize();
            let dist = (radius / Math.sin(fovRad / 2)) * pad;
            if (!isFinite(dist) || dist <= 0) dist = 6;

            const rowBytes = W * 4;
            const place = () => {
                camNode.setWorldPosition(center.x + dir.x * dist, center.y + dir.y * dist, center.z + dir.z * dist);
                camNode.lookAt(center);
            };
            place();

            // Bounding box of "content" (pixels clearly off the clear colour) in a
            // bottom-up RGBA buffer. Returns null when effectively empty.
            const contentBBox = (raw: Uint8Array): any => {
                let minX = W, minY = H, maxX = -1, maxY = -1, count = 0;
                for (let y = 0; y < H; y++) {
                    const rowOff = y * rowBytes;
                    for (let x = 0; x < W; x++) {
                        const p = rowOff + x * 4;
                        if (Math.abs(raw[p] - 12) > 24 || Math.abs(raw[p + 1] - 12) > 24 || Math.abs(raw[p + 2] - 16) > 24) {
                            if (x < minX) minX = x; if (x > maxX) maxX = x;
                            if (y < minY) minY = y; if (y > maxY) maxY = y;
                            count++;
                        }
                    }
                }
                if (maxX < 0 || count < W * H * 0.001) return null;
                return { minX, minY, maxX, maxY };
            };

            // Auto-fit: probe the rendered pixels, then adjust distance + centring so
            // the effect fills ~targetFill of the frame without being cut off. This
            // corrects cases where geometry bounds underestimate the visual spread
            // (big assets / wide particles → camera ends up too close).
            const autofit = !(opts && opts.autofit === false);
            const targetFill = (opts && opts.targetFill) || 0.8;
            let fitFrac = 0;
            if (autofit) {
                const worldUp = new Vec3(0, 1, 0);
                const minDist = Math.max(0.2, radius * 0.35);
                for (let attempt = 0; attempt < 4; attempt++) {
                    // Union the content box over a few frames (spread varies over time).
                    let bb: any = null;
                    for (let k = 0; k < 3; k++) {
                        await pump();
                        let raw: Uint8Array | null = null;
                        try { raw = rt.readPixels(); } catch { /* ignore */ }
                        if (!raw || raw.length < rowBytes * H) continue;
                        const b2 = contentBBox(raw);
                        if (b2) {
                            bb = bb ? {
                                minX: Math.min(bb.minX, b2.minX), minY: Math.min(bb.minY, b2.minY),
                                maxX: Math.max(bb.maxX, b2.maxX), maxY: Math.max(bb.maxY, b2.maxY),
                            } : b2;
                        }
                    }
                    if (!bb) break; // nothing to fit to
                    const frac = Math.max((bb.maxX - bb.minX + 1) / W, (bb.maxY - bb.minY + 1) / H);
                    fitFrac = +frac.toFixed(3);

                    // Recentre on the content box centre (bottom-up coords).
                    const cx = (bb.minX + bb.maxX) / 2;
                    const cy = (bb.minY + bb.maxY) / 2;
                    const viewH = 2 * dist * Math.tan(fovRad / 2);
                    const viewW = viewH * (W / H);
                    const offX = (cx / W - 0.5) * viewW;
                    const offY = (cy / H - 0.5) * viewH;
                    const fwd = new Vec3(-dir.x, -dir.y, -dir.z); fwd.normalize();
                    const rgt = new Vec3(); Vec3.cross(rgt, fwd, worldUp); rgt.normalize();
                    const upv = new Vec3(); Vec3.cross(upv, rgt, fwd); upv.normalize();
                    center.x += rgt.x * offX + upv.x * offY;
                    center.y += rgt.y * offX + upv.y * offY;
                    center.z += rgt.z * offX + upv.z * offY;

                    // Scale distance toward the target fill (size ∝ 1/dist).
                    let newDist = dist * (frac / targetFill);
                    if (!isFinite(newDist) || newDist <= 0) newDist = dist;
                    dist = Math.max(minDist, newDist);
                    place();

                    const centred = Math.abs(cx / W - 0.5) < 0.06 && Math.abs(cy / H - 0.5) < 0.06;
                    if (frac > 0.6 && frac < 0.92 && centred) break; // good enough
                }
            }

            // Capture: pump one step, then read the offscreen texture.
            const frames: string[] = [];
            let nonZero = 0, nonClear = 0, sampled = 0; // diagnostics
            for (let f = 0; f < frameCount; f++) {
                await pump();
                let raw: Uint8Array | null = null;
                try { raw = rt.readPixels(); } catch (e: any) { warnings.push(`readPixels: ${e.message}`); }
                if (!raw || raw.length < rowBytes * H) { continue; }
                // readPixels is bottom-up; flip to top-down for the GIF encoder.
                const flipped = new Uint8Array(rowBytes * H);
                for (let y = 0; y < H; y++) {
                    const src = (H - 1 - y) * rowBytes;
                    flipped.set(raw.subarray(src, src + rowBytes), y * rowBytes);
                }
                // Sample content vs clear-colour to diagnose black output.
                for (let p = 0; p < flipped.length; p += 64) {
                    const r = flipped[p], g = flipped[p + 1], b = flipped[p + 2];
                    if (r > 2 || g > 2 || b > 2) nonZero++;
                    if (Math.abs(r - 12) > 8 || Math.abs(g - 12) > 8 || Math.abs(b - 16) > 8) nonClear++;
                    sampled++;
                }
                frames.push(bytesToBase64(flipped));
            }

            const diag = {
                psCount: systems.length,
                ticked: tickOk,
                nonZeroFrac: sampled ? +(nonZero / sampled).toFixed(3) : 0,
                nonClearFrac: sampled ? +(nonClear / sampled).toFixed(3) : 0,
                radius: +radius.toFixed(2),
                fitFrac,
                dist: +dist.toFixed(2),
            };
            if (frames.length === 0) { return { ok: false, error: 'no frames captured', warnings, diag }; }
            return { ok: true, width: W, height: H, delayMs, frameCount: frames.length, frames, warnings, diag };
        } catch (err: any) {
            return { ok: false, error: err && err.message ? err.message : String(err), warnings };
        } finally {
            try { if (rt) { rt.destroy(); } } catch { /* ignore */ }
            try { if (root) { root.destroy(); } } catch { /* ignore */ }
        }
    },

    /**
     * Render a Spine skeleton to an offscreen RenderTexture and capture a short
     * looping frame sequence (one animation, one skin). Also reports the asset's
     * full skin/animation lists so the panel can build its selectors.
     *
     * Mirrors captureParticlePreview's approach (temp non-serialised root, tick
     * pumping, pixel-probe autofit) but renders 2D via RenderRoot2D + an
     * orthographic camera.
     */
    async captureSpinePreview(skelUuid: string, opts: any): Promise<any> {
        const cc = require('cc');
        const { director, Node, Camera, RenderTexture, Color, assetManager } = cc;
        const sp = cc.sp;
        const warnings: string[] = [];
        if (!sp || !sp.Skeleton) { return { ok: false, error: 'spine module unavailable', warnings }; }

        const W = (opts && opts.width) || 160;
        const H = (opts && opts.height) || 100;
        const frameCount = (opts && opts.frameCount) || 12;
        const delayMs = (opts && opts.delayMs) || 80;

        const scene = director.getScene();
        if (!scene) { return { ok: false, error: 'No active scene', warnings }; }
        const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

        let root: any = null;
        let rt: any = null;
        try {
            const asset: any = await new Promise((resolve, reject) => {
                assetManager.loadAny({ uuid: skelUuid }, (err: any, a: any) => {
                    if (err || !a) reject(err || new Error('skeleton not found')); else resolve(a);
                });
            });

            // Skin/animation lists from the runtime data (works for .json and .skel).
            let rd: any = null;
            try { rd = asset.getRuntimeData ? asset.getRuntimeData() : null; } catch { /* ignore */ }
            const skins: string[] = rd && rd.skins ? rd.skins.map((s: any) => s.name) : [];
            const animations: string[] = rd && rd.animations ? rd.animations.map((a: any) => a.name) : [];
            // The implicit "default" skin only holds attachments not assigned to any
            // named skin — for skin-based exports it is empty and renders nothing.
            // When no skin was requested, prefer the first skin that has attachments.
            const skinHasAttachments = (s: any): boolean => {
                try {
                    const att = s.attachments;
                    if (!att) return false;
                    if (typeof att.length === 'number') {
                        for (let i = 0; i < att.length; i++) {
                            const slot = att[i];
                            if (slot && Object.keys(slot).length > 0) { return true; }
                        }
                        return false;
                    }
                    return Object.keys(att).length > 0;
                } catch { return true; } // unknown binding shape — assume renderable
            };
            let usedSkin = '';
            if (opts && opts.skin && skins.indexOf(opts.skin) >= 0) {
                usedSkin = opts.skin;
            } else if (rd && rd.skins && rd.skins.length) {
                const withAtt = rd.skins.find((s: any) => skinHasAttachments(s));
                usedSkin = withAtt ? withAtt.name
                    : (skins.indexOf('default') >= 0 ? 'default' : (skins[0] || ''));
            }
            const usedAnimation = (opts && opts.animation && animations.indexOf(opts.animation) >= 0)
                ? opts.animation
                : (animations[0] || '');

            // Temporary, hidden, non-saved root parked far below the origin.
            root = new Node('__spine_thumb_root__');
            const Flags = cc.CCObject && cc.CCObject.Flags;
            if (Flags) { root.hideFlags = (Flags.DontSave | Flags.HideInHierarchy) >>> 0; }
            scene.addChild(root);
            root.setPosition(0, -100000, 0);
            const RenderRoot2D = cc.RenderRoot2D || cc.Canvas;
            if (RenderRoot2D) { root.addComponent(RenderRoot2D); }

            const skelNode = new Node('__spine_thumb_skel__');
            root.addChild(skelNode);
            try { skelNode.layer = cc.Layers.Enum.UI_2D; } catch { /* default layer */ }
            const skel = skelNode.addComponent(sp.Skeleton);
            // sp.Skeleton.__preload force-pauses in the editor (EDITOR_NOT_IN_PREVIEW),
            // and SkeletonSystem.postUpdate skips paused skeletons — without this the
            // pumped ticks never advance the animation and all frames are identical.
            try { skel.paused = false; } catch { /* older engine w/o the flag */ }
            skel.skeletonData = asset;
            try { if (usedSkin) skel.setSkin(usedSkin); } catch (e: any) { warnings.push(`setSkin: ${e.message}`); }
            try { if (usedAnimation) skel.setAnimation(0, usedAnimation, true); } catch (e: any) { warnings.push(`setAnimation: ${e.message}`); }

            rt = new RenderTexture();
            rt.reset({ width: W, height: H });
            const camNode = new Node('__spine_thumb_cam__');
            root.addChild(camNode);
            const cam = camNode.addComponent(Camera);
            cam.projection = Camera.ProjectionType ? Camera.ProjectionType.ORTHO : 0;
            cam.near = 1;
            cam.far = 4000;
            cam.clearFlags = (Camera.ClearFlag && Camera.ClearFlag.SOLID_COLOR) != null
                ? Camera.ClearFlag.SOLID_COLOR : 7;
            cam.clearColor = new Color(12, 12, 16, 255);
            cam.priority = 1000;
            cam.visibility = 0xffffffff;
            cam.targetTexture = rt;

            // Initial framing from the skeleton's setup-pose AABB (x/y/width/height
            // in skeleton-local pixels); the pixel autofit below refines it.
            let cx = 0, cy = 0;
            let orthoH = 200;
            if (rd && rd.width && rd.height) {
                cx = (rd.x || 0) + rd.width / 2;
                cy = (rd.y || 0) + rd.height / 2;
                orthoH = Math.max(rd.height, rd.width * (H / W)) * 0.62;
            }
            const place = () => { camNode.setPosition(cx, cy, 1000); };
            cam.orthoHeight = orthoH;
            place();

            const dt = Math.max(0.016, delayMs / 1000);
            let tickOk = typeof director.tick === 'function';
            const pump = async () => {
                if (tickOk) {
                    try { director.tick(dt); return; }
                    catch (e: any) { warnings.push(`tick: ${e.message}`); tickOk = false; }
                }
                await sleep(delayMs);
            };
            for (let i = 0; i < 4; i++) { await pump(); } // let the first pose land

            const rowBytes = W * 4;
            const contentBBox = (raw: Uint8Array): any => {
                let minX = W, minY = H, maxX = -1, maxY = -1, count = 0;
                for (let y = 0; y < H; y++) {
                    const rowOff = y * rowBytes;
                    for (let x = 0; x < W; x++) {
                        const p = rowOff + x * 4;
                        if (Math.abs(raw[p] - 12) > 24 || Math.abs(raw[p + 1] - 12) > 24 || Math.abs(raw[p + 2] - 16) > 24) {
                            if (x < minX) minX = x; if (x > maxX) maxX = x;
                            if (y < minY) minY = y; if (y > maxY) maxY = y;
                            count++;
                        }
                    }
                }
                if (maxX < 0 || count < W * H * 0.001) return null;
                return { minX, minY, maxX, maxY };
            };

            // Pixel-probe autofit: recenter on the rendered content and scale the
            // ortho height toward the target fill (size ∝ orthoHeight).
            const targetFill = (opts && opts.targetFill) || 0.8;
            let fitFrac = 0;
            const runAutofit = async () => {
                fitFrac = 0;
                for (let attempt = 0; attempt < 4; attempt++) {
                    let bb: any = null;
                    for (let k = 0; k < 3; k++) {
                        await pump();
                        let raw: Uint8Array | null = null;
                        try { raw = rt.readPixels(); } catch { /* ignore */ }
                        if (!raw || raw.length < rowBytes * H) continue;
                        const b2 = contentBBox(raw);
                        if (b2) {
                            bb = bb ? {
                                minX: Math.min(bb.minX, b2.minX), minY: Math.min(bb.minY, b2.minY),
                                maxX: Math.max(bb.maxX, b2.maxX), maxY: Math.max(bb.maxY, b2.maxY),
                            } : b2;
                        }
                    }
                    if (!bb) break;
                    const frac = Math.max((bb.maxX - bb.minX + 1) / W, (bb.maxY - bb.minY + 1) / H);
                    fitFrac = +frac.toFixed(3);
                    // readPixels rows are bottom-up, which matches world +Y up — the
                    // bbox centre maps to the view offset directly.
                    const bbcx = (bb.minX + bb.maxX) / 2;
                    const bbcy = (bb.minY + bb.maxY) / 2;
                    const viewH = 2 * cam.orthoHeight;
                    const viewW = viewH * (W / H);
                    cx += (bbcx / W - 0.5) * viewW;
                    cy += (bbcy / H - 0.5) * viewH;
                    let next = cam.orthoHeight * (frac / targetFill);
                    if (!isFinite(next) || next <= 0) next = cam.orthoHeight;
                    cam.orthoHeight = Math.max(1, next);
                    place();
                    const centred = Math.abs(bbcx / W - 0.5) < 0.06 && Math.abs(bbcy / H - 0.5) < 0.06;
                    if (frac > 0.6 && frac < 0.92 && centred) break;
                }
            };
            await runAutofit();

            // Nothing rendered and the skin wasn't an explicit request: the chosen
            // skin may still be empty (heuristic can't always see attachments) —
            // probe the other skins and settle on the first one that shows pixels.
            if (fitFrac === 0 && !(opts && opts.skin) && skins.length > 1) {
                for (const cand of skins) {
                    if (cand === usedSkin) continue;
                    try { skel.setSkin(cand); } catch { continue; }
                    for (let i = 0; i < 4; i++) { await pump(); }
                    let raw: Uint8Array | null = null;
                    try { raw = rt.readPixels(); } catch { /* ignore */ }
                    if (raw && raw.length >= rowBytes * H && contentBBox(raw)) {
                        usedSkin = cand;
                        warnings.push(`skin fallback -> "${cand}" (first choice rendered empty)`);
                        await runAutofit();
                        break;
                    }
                }
            }

            const frames: string[] = [];
            let nonZero = 0, nonClear = 0, sampled = 0;
            for (let f = 0; f < frameCount; f++) {
                await pump();
                let raw: Uint8Array | null = null;
                try { raw = rt.readPixels(); } catch (e: any) { warnings.push(`readPixels: ${e.message}`); }
                if (!raw || raw.length < rowBytes * H) { continue; }
                const flipped = new Uint8Array(rowBytes * H);
                for (let y = 0; y < H; y++) {
                    const src = (H - 1 - y) * rowBytes;
                    flipped.set(raw.subarray(src, src + rowBytes), y * rowBytes);
                }
                for (let p = 0; p < flipped.length; p += 64) {
                    const r = flipped[p], g = flipped[p + 1], b = flipped[p + 2];
                    if (r > 2 || g > 2 || b > 2) nonZero++;
                    if (Math.abs(r - 12) > 8 || Math.abs(g - 12) > 8 || Math.abs(b - 16) > 8) nonClear++;
                    sampled++;
                }
                frames.push(bytesToBase64(flipped));
            }

            const diag = {
                skins: skins.length,
                animations: animations.length,
                ticked: tickOk,
                nonZeroFrac: sampled ? +(nonZero / sampled).toFixed(3) : 0,
                nonClearFrac: sampled ? +(nonClear / sampled).toFixed(3) : 0,
                orthoHeight: +cam.orthoHeight.toFixed(1),
                fitFrac,
            };
            if (frames.length === 0) {
                return { ok: false, error: 'no frames captured', warnings, diag, skins, animations, usedSkin, usedAnimation };
            }
            return {
                ok: true, width: W, height: H, delayMs, frameCount: frames.length, frames,
                skins, animations, usedSkin, usedAnimation, warnings, diag,
            };
        } catch (err: any) {
            return { ok: false, error: err && err.message ? err.message : String(err), warnings };
        } finally {
            try { if (rt) { rt.destroy(); } } catch { /* ignore */ }
            try { if (root) { root.destroy(); } } catch { /* ignore */ }
        }
    },

    buildVFXHierarchy(descriptors: any, prefabDir: string): any {
        const cc = require('cc');
        const { director, Node, Vec3, Quat, ParticleSystem } = cc;

        const scene = director.getScene();
        if (!scene) {
            return { nodesCreated: 0, warnings: ['No active scene'], rootUuid: null, psNodes: [] };
        }

        let nodesCreated = 0;
        const warnings: string[] = [];
        const psNodes: { nodeUuid: string; materialUuid: string; rendererModule: any; startSizeX: any }[] = [];

        function buildNode(desc: any, parent: any): any {
            const node = new Node(desc.name);
            parent.addChild(node);

            if (desc.transform) {
                const pos = desc.transform.localPosition;
                if (Array.isArray(pos) && pos.length >= 3) {
                    node.setPosition(new Vec3(pos[0], pos[1], -pos[2]));
                }
                const rot = desc.transform.localRotation;
                if (Array.isArray(rot) && rot.length >= 4) {
                    node.setRotation(new Quat(-rot[0], -rot[1], rot[2], rot[3]));
                }
                const scl = desc.transform.localScale;
                if (Array.isArray(scl) && scl.length >= 3) {
                    node.setScale(new Vec3(scl[0], scl[1], scl[2]));
                }
            }

            if (desc.hasParticleSystem) {
                try {
                    const ps = node.addComponent(ParticleSystem);
                    if (ps) {
                        applyModules(ps, desc.modules, desc, warnings, cc);
                        nodesCreated++;
                        psNodes.push({
                            nodeUuid: node.uuid || node._id,
                            materialUuid: desc.materialUuid || '',
                            rendererModule: desc.modules?.rendererModule || null,
                            startSizeX: desc.modules?.mainModule?.startSize || null,
                        });
                    } else {
                        warnings.push(`addComponent(ParticleSystem) returned null on "${desc.name}"`);
                    }
                } catch (err: any) {
                    warnings.push(`Failed to create ParticleSystem on "${desc.name}": ${err.message}`);
                }
            }

            if (desc.children && Array.isArray(desc.children)) {
                for (const childDesc of desc.children) {
                    buildNode(childDesc, node);
                }
            }

            return node;
        }

        const rootNode = buildNode(descriptors, scene);

        return { nodesCreated, warnings, rootUuid: rootNode._id || rootNode.uuid, psNodes };
    },
};

/**
 * Estimate a world-space bounding sphere for a freshly-instantiated effect.
 * Merges mesh-renderer AABBs with all descendant node positions (so pure
 * billboard emitters are still framed), then inflates a little to leave room
 * for the particles that spread out from each emitter.
 */
function computeWorldBounds(inst: any, cc: any): { center: any; radius: number } | null {
    const { Vec3, MeshRenderer } = cc;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    const expand = (x: number, y: number, z: number) => {
        if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
    };

    const renderers: any[] = MeshRenderer ? inst.getComponentsInChildren(MeshRenderer) : [];
    for (const r of renderers) {
        const wb = r.model && r.model.worldBounds;
        if (wb && wb.center && wb.halfExtents) {
            expand(wb.center.x - wb.halfExtents.x, wb.center.y - wb.halfExtents.y, wb.center.z - wb.halfExtents.z);
            expand(wb.center.x + wb.halfExtents.x, wb.center.y + wb.halfExtents.y, wb.center.z + wb.halfExtents.z);
        }
    }

    const tmp = new Vec3();
    const walk = (node: any) => {
        if (!node) return;
        node.getWorldPosition(tmp);
        expand(tmp.x, tmp.y, tmp.z);
        const children = node.children || [];
        for (const c of children) walk(c);
    };
    walk(inst);

    if (!isFinite(minX) || !isFinite(maxX)) return null;
    const center = new Vec3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    const half = new Vec3((maxX - minX) / 2, (maxY - minY) / 2, (maxZ - minZ) / 2);
    const radius = Math.max(half.x, half.y, half.z, 0.5) * 1.6;
    return { center, radius };
}

/**
 * Safe module getter — Cocos PS3D property names may vary.
 * Returns the module or null if not found.
 */
function getModule(ps: any, ...names: string[]): any {
    for (const name of names) {
        if (ps[name] != null) return ps[name];
    }
    return null;
}

function applyModules(ps: any, modules: Record<string, any>, desc: any, warnings: string[], cc: any): void {

    // Main module — properties are directly on ps
    if (modules.mainModule) {
        const m = modules.mainModule;
        try {
            ps.duration = m.duration ?? 5;
            ps.loop = m.loop ?? true;
            ps.playOnAwake = m.playOnAwake ?? true;
            ps.capacity = m.capacity ?? 1000;
            if (m.simulationSpace != null) ps.simulationSpace = m.simulationSpace;
            if (m.scaleSpace != null) ps.scaleSpace = m.scaleSpace;
            applyCurve(ps, 'startLifetime', m.startLifetime, cc);
            applyCurve(ps, 'startSpeed', m.startSpeed, cc);
            applyCurve(ps, 'startSizeX', m.startSize, cc);
            if (m.startSizeY) applyCurve(ps, 'startSizeY', m.startSizeY, cc);
            if (m.startSizeZ) applyCurve(ps, 'startSizeZ', m.startSizeZ, cc);
            applyCurve(ps, 'startRotationZ', m.startRotationZ, cc);
            if (m.startRotationX) applyCurve(ps, 'startRotationX', m.startRotationX, cc);
            if (m.startRotationY) applyCurve(ps, 'startRotationY', m.startRotationY, cc);
            applyCurve(ps, 'startDelay', m.startDelay, cc);
            applyCurve(ps, 'gravityModifier', m.gravityModifier, cc);
            if (m.startColor) {
                applyGradient(ps, 'startColor', m.startColor, cc);
            }
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": mainModule error: ${err.message}`);
        }
    }

    // Emission — no sub-module in Cocos, properties are directly on PS
    if (modules.emissionModule) {
        try {
            const em = modules.emissionModule;
            applyCurve(ps, 'rateOverTime', em.rateOverTime, cc);
            applyCurve(ps, 'rateOverDistance', em.rateOverDistance, cc);
            if (em.bursts && em.bursts.length > 0) {
                const Burst = cc.Burst || cc.ParticleSystem?.Burst;
                if (Burst) {
                    ps.bursts = em.bursts.map((b: any) => {
                        const burst = new Burst();
                        burst.time = b.time ?? 0;
                        burst.repeatCount = b.repeatCount ?? 0;
                        burst.repeatInterval = b.repeatInterval ?? 0.01;
                        applyCurve(burst, 'count', b.count, cc);
                        return burst;
                    });
                } else {
                    warnings.push(`Node "${desc.name}": cc.Burst class not found — bursts skipped`);
                }
            }
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": emission error: ${err.message}`);
        }
    } else {
        applyCurve(ps, 'rateOverTime', { mode: 0, constant: 0 }, cc);
        applyCurve(ps, 'rateOverDistance', { mode: 0, constant: 0 }, cc);
        ps.bursts = [];
    }

    // Shape
    const shape = getModule(ps, 'shapeModule', '_shapeModule');
    if (modules.shapeModule && shape) {
        try {
            const sh = modules.shapeModule;
            shape.enable = true;
            shape.shapeType = sh.shapeType ?? 2;
            shape.radius = sh.radius ?? 1;
            shape.radiusThickness = sh.radiusThickness ?? 1;
            shape.angle = sh.angle ?? 25;
            shape.arc = sh.arc ?? 360;
            shape.arcMode = sh.arcMode ?? 0;
            shape.length = sh.length ?? 5;
            // emitFrom only for Cone (2), other shapes use radiusThickness for shell/volume
            if (sh.shapeType === 2) {
                shape.emitFrom = sh.emitFrom ?? 0;
            }
            shape.alignToDirection = sh.alignToDirection ?? false;
            if (sh.position) {
                shape.position = new cc.Vec3(sh.position.x ?? 0, sh.position.y ?? 0, -(sh.position.z ?? 0));
            }
            if (sh.rotation) {
                shape.rotation = new cc.Vec3(sh.rotation.x ?? 0, sh.rotation.y ?? 0, sh.rotation.z ?? 0);
            }
            if (sh.scale) {
                shape.scale = new cc.Vec3(sh.scale.x ?? 1, sh.scale.y ?? 1, sh.scale.z ?? 1);
            }
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": shapeModule error: ${err.message}`);
        }
    }

    // Velocity over Lifetime
    const velOT = getModule(ps, 'velocityOvertimeModule', '_velocityOvertimeModule');
    if (modules.velocityOverLifetimeModule && velOT) {
        try {
            const v = modules.velocityOverLifetimeModule;
            velOT.enable = true;
            if (v.space != null) velOT.space = v.space;
            applyCurve(velOT, 'x', v.x, cc);
            applyCurve(velOT, 'y', v.y, cc);
            applyCurve(velOT, 'z', v.z, cc);
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": velocityOverLifetime error: ${err.message}`);
        }
    }

    // Force over Lifetime
    const forceOT = getModule(ps, 'forceOvertimeModule', '_forceOvertimeModule');
    if (modules.forceOverLifetimeModule && forceOT) {
        try {
            const f = modules.forceOverLifetimeModule;
            forceOT.enable = true;
            if (f.space != null) forceOT.space = f.space;
            applyCurve(forceOT, 'x', f.x, cc);
            applyCurve(forceOT, 'y', f.y, cc);
            applyCurve(forceOT, 'z', f.z, cc);
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": forceOverLifetime error: ${err.message}`);
        }
    }

    // Color over Lifetime — Cocos uses 'colorOverLifetimeModule' (not 'Overtime')
    const colorOT = getModule(ps, 'colorOverLifetimeModule', 'colorOvertimeModule', '_colorOverLifetimeModule');
    if (modules.colorOverLifetimeModule && colorOT) {
        try {
            colorOT.enable = true;
            applyGradient(colorOT, 'color', modules.colorOverLifetimeModule.color, cc);
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": colorOverLifetime error: ${err.message}`);
        }
    }

    // Size over Lifetime
    const sizeOT = getModule(ps, 'sizeOvertimeModule', '_sizeOvertimeModule');
    if (modules.sizeOverLifetimeModule && sizeOT) {
        try {
            const s = modules.sizeOverLifetimeModule;
            sizeOT.enable = true;
            sizeOT.separateAxes = s.separateAxes ?? false;
            applyCurve(sizeOT, 'size', s.size, cc);
            if (s.separateAxes) {
                applyCurve(sizeOT, 'x', s.x, cc);
                applyCurve(sizeOT, 'y', s.y, cc);
                applyCurve(sizeOT, 'z', s.z, cc);
            }
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": sizeOverLifetime error: ${err.message}`);
        }
    }

    // Rotation over Lifetime
    const rotOT = getModule(ps, 'rotationOvertimeModule', '_rotationOvertimeModule');
    if (modules.rotationOverLifetimeModule && rotOT) {
        try {
            const r = modules.rotationOverLifetimeModule;
            rotOT.enable = true;
            rotOT.separateAxes = r.separateAxes ?? false;
            applyCurve(rotOT, 'z', r.z, cc);
            if (r.separateAxes) {
                applyCurve(rotOT, 'x', r.x, cc);
                applyCurve(rotOT, 'y', r.y, cc);
            }
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": rotationOverLifetime error: ${err.message}`);
        }
    }

    // Limit Velocity
    const limitVel = getModule(ps, 'limitVelocityOvertimeModule', '_limitVelocityOvertimeModule');
    if (modules.limitVelocityOverLifetimeModule && limitVel) {
        try {
            const lv = modules.limitVelocityOverLifetimeModule;
            limitVel.enable = true;
            limitVel.dampen = (lv.dampen ?? 0) * 0.5;
            limitVel.separateAxes = lv.separateAxes ?? false;
            applyCurve(limitVel, 'limit', lv.speed, cc);
            if (lv.separateAxes) {
                applyCurve(limitVel, 'limitX', lv.speedX, cc);
                applyCurve(limitVel, 'limitY', lv.speedY, cc);
                applyCurve(limitVel, 'limitZ', lv.speedZ, cc);
            }
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": limitVelocity error: ${err.message}`);
        }
    }

    // Texture Sheet Animation — mapper already converts sprites→grid
    const texAnim = getModule(ps, 'textureAnimationModule', '_textureAnimationModule');
    if (modules.textureSheetAnimationModule && texAnim) {
        try {
            const tsa = modules.textureSheetAnimationModule;
            texAnim.enable = true;
            texAnim.numTilesX = tsa.numTilesX ?? 1;
            texAnim.numTilesY = tsa.numTilesY ?? 1;
            texAnim.cycleCount = tsa.cycleCount ?? 1;
            applyCurve(texAnim, 'frameOverTime', tsa.frameOverTime, cc);
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": textureSheetAnimation error: ${err.message}`);
        }
    }

    // Trails
    const trail = getModule(ps, 'trailModule', '_trailModule');
    if (modules.trailModule && trail) {
        try {
            const tr = modules.trailModule;
            trail.enable = true;
            trail.minParticleDistance = tr.minVertexDistance ?? 0.2;
            trail.space = tr.worldSpace ? 1 : 0;
            applyCurve(trail, 'widthRatio', tr.widthRatio, cc);
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": trailModule error: ${err.message}`);
        }
    }

    // Renderer
    if (modules.rendererModule) {
        try {
            const rn = modules.rendererModule;
            const ren = ps.renderer || ps._renderer;
            if (ren) {
                ren.renderMode = rn.renderMode ?? 0;
                if (rn.renderMode === 1) {
                    ren.velocityScale = rn.velocityScale ?? 0;
                    ren.lengthScale = rn.lengthScale ?? 2;
                }
                if (rn.renderMode === 4 && rn.meshData) {
                    const createMesh = cc.utils?.MeshUtils?.createMesh || cc.utils?.createMesh;
                    if (createMesh) {
                        const mesh = createMesh(rn.meshData);
                        ren.mesh = mesh;
                    } else {
                        warnings.push(`Node "${desc.name}": cc.utils.MeshUtils.createMesh not available`);
                    }
                }
            } else {
                warnings.push(`Node "${desc.name}": ps.renderer not found`);
            }
        } catch (err: any) {
            warnings.push(`Node "${desc.name}": renderer error: ${err.message}`);
        }
    }

    // Material assignment is handled by the importer via Editor.Message 'set-property'
    // (scene script async loadAny doesn't persist in editor serialization)
}

function applySplineKeyframes(spline: any, keyframes: any[], cc: any): void {
    if (!spline || !keyframes || keyframes.length === 0) return;
    const RealInterpolationMode = cc.RealInterpolationMode;
    const interpMode = RealInterpolationMode?.LINEAR ?? 2;
    if (typeof spline.assignSorted === 'function') {
        const times = keyframes.map((kf: any) => kf.time ?? 0);
        const values = keyframes.map((kf: any) => ({
            value: kf.value ?? 0,
            leftTangent: kf.inTangent ?? 0,
            rightTangent: kf.outTangent ?? 0,
            interpolationMode: interpMode,
        }));
        spline.assignSorted(times, values);
    } else if (typeof spline.addKeyFrame === 'function') {
        for (const kf of keyframes) {
            spline.addKeyFrame(kf.time ?? 0, {
                value: kf.value ?? 0,
                leftTangent: kf.inTangent ?? 0,
                rightTangent: kf.outTangent ?? 0,
                interpolationMode: interpMode,
            });
        }
    } else if (Array.isArray(spline.keyFrames)) {
        spline.keyFrames = keyframes.map((kf: any) => ({
            time: kf.time ?? 0,
            value: kf.value ?? 0,
            inTangent: kf.inTangent ?? 0,
            outTangent: kf.outTangent ?? 0,
        }));
    }
}

function applyCurve(target: any, propName: string, curveDesc: any, cc?: any): void {
    if (!curveDesc || !target) return;
    try {
        const CurveRange = cc?.CurveRange;
        if (CurveRange) {
            const cr = new CurveRange();
            switch (curveDesc.mode) {
                case 0:
                    cr.mode = 0;
                    cr.constant = curveDesc.constant ?? 0;
                    break;
                case 1:
                    cr.mode = 1;
                    cr.multiplier = curveDesc.multiplier ?? 1;
                    if (curveDesc.spline?.keyframes) {
                        applySplineKeyframes(cr.spline, curveDesc.spline.keyframes, cc);
                    }
                    break;
                case 2: // TwoCurves in Cocos
                    cr.mode = 2;
                    cr.multiplier = curveDesc.multiplier ?? 1;
                    if (curveDesc.splineMin?.keyframes) {
                        applySplineKeyframes(cr.splineMin, curveDesc.splineMin.keyframes, cc);
                    }
                    if (curveDesc.splineMax?.keyframes) {
                        applySplineKeyframes(cr.splineMax, curveDesc.splineMax.keyframes, cc);
                    }
                    break;
                case 3: // TwoConstants in Cocos
                    cr.mode = 3;
                    cr.constantMin = curveDesc.constantMin ?? 0;
                    cr.constantMax = curveDesc.constantMax ?? 0;
                    break;
            }
            target[propName] = cr;
        } else {
            const prop = target[propName];
            if (!prop) return;
            switch (curveDesc.mode) {
                case 0: prop.mode = 0; prop.constant = curveDesc.constant ?? 0; break;
                case 1:
                    prop.mode = 1;
                    prop.multiplier = curveDesc.multiplier ?? 1;
                    if (curveDesc.spline?.keyframes) {
                        applySplineKeyframes(prop.spline, curveDesc.spline.keyframes, cc);
                    }
                    break;
                case 2:
                    prop.mode = 2;
                    prop.multiplier = curveDesc.multiplier ?? 1;
                    break;
                case 3:
                    prop.mode = 3;
                    prop.constantMin = curveDesc.constantMin ?? 0;
                    prop.constantMax = curveDesc.constantMax ?? 0;
                    break;
            }
        }
    } catch (err: any) {
        console.warn(`[VFX] applyCurve "${propName}" error: ${err.message}`);
    }
}

function applyGradient(target: any, propName: string, gradDesc: any, cc: any): void {
    if (!gradDesc || !target) return;
    const prop = target[propName];
    if (!prop) return;
    try {
        switch (gradDesc.mode) {
            case 0:
                prop.mode = 0;
                if (gradDesc.color) {
                    prop.color = new cc.Color(gradDesc.color.r, gradDesc.color.g, gradDesc.color.b, gradDesc.color.a);
                }
                break;
            case 1:
                prop.mode = 1;
                if (gradDesc.gradient) { applyGradientKeys(prop, gradDesc.gradient, cc); }
                break;
            case 2:
                prop.mode = 2;
                if (gradDesc.colorMin) { prop.colorMin = new cc.Color(gradDesc.colorMin.r, gradDesc.colorMin.g, gradDesc.colorMin.b, gradDesc.colorMin.a); }
                if (gradDesc.colorMax) { prop.colorMax = new cc.Color(gradDesc.colorMax.r, gradDesc.colorMax.g, gradDesc.colorMax.b, gradDesc.colorMax.a); }
                break;
            case 3:
                prop.mode = 3;
                if (gradDesc.gradientMin) { applyGradientKeys(prop, gradDesc.gradientMin, cc, 'gradientMin'); }
                if (gradDesc.gradientMax) { applyGradientKeys(prop, gradDesc.gradientMax, cc, 'gradientMax'); }
                break;
            case 4:
                prop.mode = 4;
                if (gradDesc.gradient) { applyGradientKeys(prop, gradDesc.gradient, cc); }
                break;
        }
    } catch (err) { /* silently skip */ }
}

function applyGradientKeys(prop: any, gradObj: any, cc: any, targetProp: string = 'gradient'): void {
    if (!gradObj) return;
    try {
        const gradient = prop[targetProp] || new cc.Gradient();
        if (gradObj.colorKeys && Array.isArray(gradObj.colorKeys)) {
            gradient.colorKeys = gradObj.colorKeys.map((ck: any) => ({
                time: ck.time,
                color: new cc.Color(ck.color.r, ck.color.g, ck.color.b, ck.color.a),
            }));
        }
        if (gradObj.alphaKeys && Array.isArray(gradObj.alphaKeys)) {
            gradient.alphaKeys = gradObj.alphaKeys.map((ak: any) => ({
                time: ak.time,
                alpha: ak.alpha,
            }));
        }
        prop[targetProp] = gradient;
    } catch (err) { /* skip */ }
}
