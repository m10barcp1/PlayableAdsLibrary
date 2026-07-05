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

        const W = (opts && opts.width) || 320;
        const H = (opts && opts.height) || 200;
        const frameCount = (opts && opts.frameCount) || 50;
        const delayMs = (opts && opts.delayMs) || 20;
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

            // Auto-fit: normalise every effect to ~targetFill of the frame, measured
            // over the WHOLE capture window so a burst that grows later can't overflow.
            // Two things drive consistent sizing (see the empirical audit: with the old
            // early-window + [0.6,0.92] logic ~69% of one pack clipped at the edges):
            //  - When the content box touches a frame edge its measured size saturates
            //    (we can't tell how far past the edge it spreads), so the proportional
            //    frac/targetFill scale badly under-corrects. Escape clipping first with
            //    a fixed aggressive zoom-out until the whole effect is inside the frame,
            //    THEN fine-fit proportionally.
            //  - Fit the PEAK extent unioned across the window, not one early frame, so
            //    the biggest moment of the animation still fits.
            const autofit = !(opts && opts.autofit === false);
            const targetFill = (opts && opts.targetFill) || 0.78;
            const worldUp = new Vec3(0, 1, 0);
            let fitFrac = 0;

            const resetParticles = () => {
                for (const ps of systems) {
                    try { ps.stop && ps.stop(); ps.clear && ps.clear(); ps.play && ps.play(); } catch { /* ignore */ }
                }
            };
            const warmup = async () => { for (let i = 0; i < warmupTicks; i++) { await pump(); } };

            // Union of the content box across a full capture-length window (peak spread).
            const measurePeak = async (): Promise<any> => {
                let bb: any = null;
                const probe = Math.max(1, Math.round(frameCount / 8)); // ~8 reads across the window
                for (let f = 0; f < frameCount; f++) {
                    await pump();
                    if (f % probe !== 0) continue;
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
                return bb;
            };

            if (autofit) {
                const minDist = Math.max(0.08, radius * 0.05);
                const maxDist = (Math.max(dist, radius) + 1) * 500;
                for (let attempt = 0; attempt < 6; attempt++) {
                    resetParticles();
                    const bb = await measurePeak();
                    if (!bb) break; // empty render — keep the geometry framing
                    const frac = Math.max((bb.maxX - bb.minX + 1) / W, (bb.maxY - bb.minY + 1) / H);
                    fitFrac = +frac.toFixed(3);
                    const touches = bb.minX <= 1 || bb.minY <= 1 || bb.maxX >= W - 2 || bb.maxY >= H - 2;
                    const cx = (bb.minX + bb.maxX) / 2;
                    const cy = (bb.minY + bb.maxY) / 2;

                    // Recentre only when the whole box is visible: a clipped box biases
                    // the centre and would chase the effect further off-frame.
                    if (!touches) {
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
                    }

                    const centred = Math.abs(cx / W - 0.5) < 0.06 && Math.abs(cy / H - 0.5) < 0.06;
                    if (!touches && frac >= targetFill - 0.06 && frac <= targetFill + 0.06 && centred) break;

                    // Escape clipping with a fixed aggressive zoom-out (true size unknown
                    // while clamped); otherwise scale proportionally toward targetFill.
                    let newDist = touches ? dist * 1.8 : dist * (frac / targetFill);
                    if (!isFinite(newDist) || newDist <= 0) newDist = dist;
                    dist = Math.min(maxDist, Math.max(minDist, newDist));
                    place();
                }
            }

            // Fresh, warmed start so the captured window matches the framing we fitted.
            resetParticles();
            await warmup();

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

        const W = (opts && opts.width) || 320;
        const H = (opts && opts.height) || 200;
        const frameCount = (opts && opts.frameCount) || 50;
        const delayMs = (opts && opts.delayMs) || 20;

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
                // Advance the Spine animation clock explicitly. In the editor scene
                // process (EDITOR_NOT_IN_PREVIEW) the SkeletonSystem's postUpdate does
                // not step the skeleton, so relying on director.tick alone leaves every
                // captured frame on the same pose (all GIF frames identical -> looks
                // static). Driving updateAnimation(dt) here is what actually animates
                // the thumbnail; the tick below only flushes the 2D render + readPixels.
                try { skel.updateAnimation(dt); } catch { /* older engine without the method */ }
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
                // Pin this frame to an ABSOLUTE animation time (f * dt) by resetting
                // the track and advancing once, rather than stepping incrementally.
                // director.tick's post-update may ALSO advance the skeleton (gated on
                // director._paused — a runtime state we can't observe here) and the
                // editor's own render loop can advance it between awaits; incremental
                // stepping would then accumulate and play faster than real time.
                // Re-seeking to f*dt every frame makes the captured motion exactly 1x
                // regardless, the way Cocos's own inspector preview scrubs time. (The
                // pump() below may add a constant within-frame offset — harmless, since
                // the next frame's reset overwrites it, so frame spacing stays == dt.)
                try {
                    if (usedAnimation) {
                        skel.setAnimation(0, usedAnimation, true);
                        skel.updateAnimation(f * dt);
                    }
                } catch (e: any) { warnings.push(`seek: ${e.message}`); }
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

    /**
     * Render a 3D model (FBX/glTF prefab sub-asset) to an offscreen RenderTexture
     * and capture a short looping sequence. If the model carries a skeletal-
     * animation clip, that clip plays; otherwise the model spins on a Y-axis
     * turntable (a full 360° across the capture window).
     *
     * Mirrors captureParticlePreview (temp non-serialised root parked far below the
     * origin, tick pumping, perspective camera, pixel-probe autofit) but frames the
     * geometry by its bounding SPHERE so the turntable rotation never clips, and
     * lights the model with a key + fill directional pair so no facing goes black.
     *
     * `prefabUuid` is the gltf-scene sub-asset (`<fbxUuid>@<id>`); when a mesh-only
     * glb has no prefab, `opts.meshUuid` is wrapped in a bare MeshRenderer instead.
     */
    async captureModelPreview(prefabUuid: string, opts: any): Promise<any> {
        const cc = require('cc');
        const { director, Node, Camera, RenderTexture, Vec3, Color, instantiate, assetManager } = cc;
        const warnings: string[] = [];

        const W = (opts && opts.width) || 320;
        const H = (opts && opts.height) || 200;
        const frameCount = (opts && opts.frameCount) || 50;
        const delayMs = (opts && opts.delayMs) || 20;

        const scene = director.getScene();
        if (!scene) { return { ok: false, error: 'No active scene', warnings }; }
        const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

        let root: any = null;
        let rt: any = null;
        try {
            // Load the model prefab (gltf-scene sub-asset) by uuid.
            let prefab: any = null;
            if (prefabUuid) {
                try {
                    prefab = await new Promise((resolve, reject) => {
                        assetManager.loadAny({ uuid: prefabUuid }, (err: any, asset: any) => {
                            if (err || !asset) reject(err || new Error('prefab not found')); else resolve(asset);
                        });
                    });
                } catch (e: any) { warnings.push(`loadPrefab: ${e.message}`); }
            }

            // Temporary, hidden, non-saved root parked far below the origin so it
            // never flashes in the user's viewport while we render.
            root = new Node('__model_thumb_root__');
            const Flags = cc.CCObject && cc.CCObject.Flags;
            if (Flags) { root.hideFlags = (Flags.DontSave | Flags.HideInHierarchy) >>> 0; }
            scene.addChild(root);
            root.setPosition(0, -100000, 0);

            // Spin pivot: the model gets re-centred onto this node's origin so a
            // Y-rotation turntable spins it in place instead of orbiting off-frame.
            const spin = new Node('__model_thumb_spin__');
            root.addChild(spin);
            const T = new Vec3(); spin.getWorldPosition(T);

            let inst: any = null;
            if (prefab) {
                inst = instantiate(prefab);
            } else if (opts && opts.meshUuid) {
                // Mesh-only glb (no prefab sub-asset): wrap the mesh in a bare
                // MeshRenderer so it still previews (material left to the engine default).
                try {
                    const mesh: any = await new Promise((resolve, reject) => {
                        assetManager.loadAny({ uuid: opts.meshUuid }, (err: any, a: any) => {
                            if (err || !a) reject(err || new Error('mesh not found')); else resolve(a);
                        });
                    });
                    inst = new Node('__model_mesh__');
                    const MeshRenderer = cc.MeshRenderer;
                    if (MeshRenderer) { const mr = inst.addComponent(MeshRenderer); mr.mesh = mesh; }
                } catch (e: any) { warnings.push(`loadMesh: ${e.message}`); }
            }
            if (!inst) { return { ok: false, error: 'no model to render', warnings }; }
            spin.addChild(inst);
            inst.setPosition(0, 0, 0);

            // Offscreen render target + perspective camera.
            rt = new RenderTexture();
            rt.reset({ width: W, height: H });
            const camNode = new Node('__model_thumb_cam__');
            root.addChild(camNode);
            const cam = camNode.addComponent(Camera);
            cam.projection = Camera.ProjectionType ? Camera.ProjectionType.PERSPECTIVE : 0;
            cam.fov = 40;
            cam.near = 0.01;
            cam.far = 1000000;
            cam.clearFlags = (Camera.ClearFlag && Camera.ClearFlag.SOLID_COLOR) != null
                ? Camera.ClearFlag.SOLID_COLOR : 7;
            cam.clearColor = new Color(12, 12, 16, 255); // opaque, matches the card backdrop
            cam.priority = 1000;
            cam.visibility = 0xffffffff;
            cam.targetTexture = rt;

            // Key + fill directional lights: lit (PBR) FBX materials would be pitch
            // black otherwise, and as the turntable spins a single light would leave
            // the far side dark. Fixed in world so the spin reveals the model's form.
            try {
                const DirectionalLight = cc.DirectionalLight;
                if (DirectionalLight) {
                    const kn = new Node('__model_key__'); root.addChild(kn);
                    const kl = kn.addComponent(DirectionalLight);
                    try { kl.illuminance = 60000; } catch { /* older prop name */ }
                    try { kl.color = new Color(255, 252, 245, 255); } catch { /* ignore */ }
                    kn.setRotationFromEuler(-45, -35, 0);
                    const fn = new Node('__model_fill__'); root.addChild(fn);
                    const fl = fn.addComponent(DirectionalLight);
                    try { fl.illuminance = 22000; } catch { /* ignore */ }
                    try { fl.color = new Color(215, 225, 255, 255); } catch { /* ignore */ }
                    fn.setRotationFromEuler(-15, 145, 0);
                }
            } catch { /* lighting optional */ }

            // Deterministic engine pump (the editor won't advance our offscreen camera
            // or skinning on its own).
            const dt = Math.max(0.016, delayMs / 1000);
            let tickOk = typeof director.tick === 'function';
            const pump = async () => {
                if (tickOk) {
                    try { director.tick(dt); return; }
                    catch (e: any) { warnings.push(`tick: ${e.message}`); tickOk = false; }
                }
                await sleep(delayMs);
            };

            // Warm up so each MeshRenderer's GPU model (and skinned bounds) initialise
            // before we measure geometry.
            for (let i = 0; i < 3; i++) { await pump(); }

            // Geometry framing: centre C, bounding-SPHERE radius R (rotation-safe).
            let C = new Vec3(T.x, T.y, T.z);
            let R = 1;
            try {
                const b = computeModelBounds(inst, cc);
                if (b) { C.set(b.center); R = Math.max(0.02, b.radius); }
                else { warnings.push('no mesh bounds'); }
            } catch (e: any) { warnings.push(`bounds: ${e.message}`); }

            // Shift the model so its bounds centre lands on the spin pivot (world T),
            // making the Y-turntable spin about the model's middle.
            const iw = new Vec3(); inst.getWorldPosition(iw);
            inst.setWorldPosition(iw.x + (T.x - C.x), iw.y + (T.y - C.y), iw.z + (T.z - C.z));

            const fovRad = (cam.fov * Math.PI) / 180;
            const targetFill = (opts && opts.targetFill) || 0.82;
            const dir = new Vec3(0.35, 0.28, 1); dir.normalize(); // 3/4 elevated front view
            let dist = (R / Math.sin(fovRad / 2)) * (1 / targetFill);
            if (!isFinite(dist) || dist <= 0) { dist = R * 3 || 6; }
            const place = () => {
                camNode.setWorldPosition(T.x + dir.x * dist, T.y + dir.y * dist, T.z + dir.z * dist);
                camNode.lookAt(T);
            };
            place();

            // Decide turntable vs animation up front so the autofit probes the same
            // motion the capture will show.
            let mode = 'turntable';
            let animState: any = null;
            let animDur = 0;
            let animName = '';
            const wantAnim = !(opts && (opts.mode === 'turntable' || opts.turntable === true));
            try {
                const SkeletalAnimation = cc.SkeletalAnimation;
                const anim = SkeletalAnimation ? inst.getComponentInChildren(SkeletalAnimation) : null;
                const clips: any[] = anim ? (anim.clips || []).filter(Boolean) : [];
                if (wantAnim && anim && clips.length) {
                    const clip = anim.defaultClip || clips[0];
                    // Unbaked so we can sample arbitrary times in the editor scene process
                    // (mirrors how the Inspector scrubs a clip), the way the Spine capture
                    // pins absolute time — see captureSpinePreview.
                    try { anim.useBakedAnimation = false; } catch { /* ignore */ }
                    anim.play(clip.name);
                    animState = anim.getState(clip.name);
                    if (animState) {
                        animDur = animState.duration || clip.duration || 1;
                        animName = clip.name;
                        animState.setTime(0); animState.sample(); // verify it doesn't throw
                        mode = 'animation';
                    }
                }
            } catch (e: any) { warnings.push(`anim: ${e.message}`); mode = 'turntable'; animState = null; }

            // Pose the model at step i of n (a rotation angle, or an absolute
            // animation time) — shared by the autofit probe and the real capture.
            const poseAt = (i: number, n: number) => {
                if (mode === 'animation' && animState) {
                    try { animState.setTime(animDur > 0 ? ((i / n) * animDur) : 0); animState.sample(); }
                    catch (e: any) { warnings.push(`sample: ${e.message}`); }
                } else {
                    spin.setRotationFromEuler(0, (i / n) * 360, 0);
                }
            };

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

            // Pixel autofit: scale the camera distance so the PEAK silhouette (unioned
            // across the motion — the model's widest moment as it spins/animates)
            // fills ~targetFill of the frame. No recentre: for a Y-turntable framed on
            // the geometric centre, the content is already centred.
            let fitFrac = 0;
            const autofit = !(opts && opts.autofit === false);
            if (autofit) {
                const minDist = Math.max(0.02, R * 0.2);
                const maxDist = R * 5000 + 100;
                const probes = 6;
                for (let attempt = 0; attempt < 5; attempt++) {
                    let bb: any = null;
                    for (let p = 0; p < probes; p++) {
                        poseAt(p, probes);
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
                    if (frac >= targetFill - 0.05 && frac <= targetFill + 0.05) break;
                    let nd = dist * (frac / targetFill);
                    if (!isFinite(nd) || nd <= 0) nd = dist;
                    dist = Math.min(maxDist, Math.max(minDist, nd));
                    place();
                }
            }
            // Animated limbs can swing past the static-pose silhouette we fitted — pull
            // back a touch so a raised arm doesn't clip the frame edge.
            if (mode === 'animation') { dist *= 1.12; place(); }

            // Capture: pose, pump, read the offscreen texture.
            const frames: string[] = [];
            let nonZero = 0, nonClear = 0, sampled = 0;
            for (let f = 0; f < frameCount; f++) {
                poseAt(f, frameCount);
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
                for (let p = 0; p < flipped.length; p += 64) {
                    const r = flipped[p], g = flipped[p + 1], b = flipped[p + 2];
                    if (r > 2 || g > 2 || b > 2) nonZero++;
                    if (Math.abs(r - 12) > 8 || Math.abs(g - 12) > 8 || Math.abs(b - 16) > 8) nonClear++;
                    sampled++;
                }
                frames.push(bytesToBase64(flipped));
            }

            let meshCount = -1;
            try { meshCount = inst.getComponentsInChildren(cc.MeshRenderer).length; } catch { /* ignore */ }
            const diag = {
                kind: 'model', mode, meshCount, ticked: tickOk,
                nonZeroFrac: sampled ? +(nonZero / sampled).toFixed(3) : 0,
                nonClearFrac: sampled ? +(nonClear / sampled).toFixed(3) : 0,
                radius: +R.toFixed(2), fitFrac, dist: +dist.toFixed(2),
            };
            if (frames.length === 0) { return { ok: false, error: 'no frames captured', warnings, diag }; }
            return { ok: true, width: W, height: H, delayMs, frameCount: frames.length, frames, mode, animation: animName, warnings, diag };
        } catch (err: any) {
            return { ok: false, error: err && err.message ? err.message : String(err), warnings };
        } finally {
            try { if (rt) { rt.destroy(); } } catch { /* ignore */ }
            try { if (root) { root.destroy(); } } catch { /* ignore */ }
        }
    },

    /**
     * Render a material to an offscreen RenderTexture by applying it to a lit
     * sphere and capturing a short turntable sequence. Mirrors captureModelPreview
     * (same camera, lighting, dark clear colour and return contract) but builds a
     * primitive sphere mesh and assigns the loaded .mtl instead of instantiating a
     * prefab, so a Material card gets the same animated-GIF preview as the other
     * renderable formats. The sphere radius is fixed, so the camera is framed
     * directly (no pixel autofit needed).
     */
    async captureMaterialPreview(materialUuid: string, opts: any): Promise<any> {
        const cc = require('cc');
        const { director, Node, Camera, RenderTexture, Vec3, Color, assetManager, MeshRenderer, primitives, utils } = cc;
        const warnings: string[] = [];

        const W = (opts && opts.width) || 320;
        const H = (opts && opts.height) || 200;
        const frameCount = (opts && opts.frameCount) || 50;
        const delayMs = (opts && opts.delayMs) || 20;

        const scene = director.getScene();
        if (!scene) { return { ok: false, error: 'No active scene', warnings }; }
        const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

        let root: any = null;
        let rt: any = null;
        try {
            // Load the material asset by uuid (the scene process can't reach the
            // asset-db, so the panel passes the .mtl's main uuid).
            let material: any = null;
            if (materialUuid) {
                try {
                    material = await new Promise((resolve, reject) => {
                        assetManager.loadAny({ uuid: materialUuid }, (err: any, asset: any) => {
                            if (err || !asset) reject(err || new Error('material not found')); else resolve(asset);
                        });
                    });
                } catch (e: any) { warnings.push(`loadMaterial: ${e.message}`); }
            }
            if (!material) { return { ok: false, error: 'material not found', warnings }; }

            // Build a unit sphere (radius 0.5) to carry the material. createMesh is
            // exported as a deprecated free function AND a MeshUtils static; accept
            // whichever this engine build exposes.
            const R = 0.5;
            let mesh: any = null;
            try {
                const geo = primitives.sphere(R, { segments: 48 });
                const createMesh = (utils && utils.createMesh)
                    || (utils && utils.MeshUtils && utils.MeshUtils.createMesh);
                mesh = createMesh ? createMesh(geo) : null;
            } catch (e: any) { warnings.push(`createMesh: ${e.message}`); }
            if (!mesh) { return { ok: false, error: 'sphere mesh unavailable', warnings }; }

            // Temporary, hidden, non-saved root parked far below the origin so it
            // never flashes in the user's viewport while we render.
            root = new Node('__mat_thumb_root__');
            const Flags = cc.CCObject && cc.CCObject.Flags;
            if (Flags) { root.hideFlags = (Flags.DontSave | Flags.HideInHierarchy) >>> 0; }
            scene.addChild(root);
            root.setPosition(0, -100000, 0);

            // Spin pivot at the origin; the ball spins in place about Y.
            const spin = new Node('__mat_thumb_spin__');
            root.addChild(spin);
            const T = new Vec3(); spin.getWorldPosition(T);

            const ball = new Node('__mat_thumb_ball__');
            spin.addChild(ball);
            ball.setPosition(0, 0, 0);
            const mr = ball.addComponent(MeshRenderer);
            mr.mesh = mesh;
            try { mr.material = material; }
            catch (e: any) { warnings.push(`assignMaterial: ${e.message}`); }

            // Offscreen render target + perspective camera.
            rt = new RenderTexture();
            rt.reset({ width: W, height: H });
            const camNode = new Node('__mat_thumb_cam__');
            root.addChild(camNode);
            const cam = camNode.addComponent(Camera);
            cam.projection = Camera.ProjectionType ? Camera.ProjectionType.PERSPECTIVE : 0;
            cam.fov = 40;
            cam.near = 0.01;
            cam.far = 1000000;
            cam.clearFlags = (Camera.ClearFlag && Camera.ClearFlag.SOLID_COLOR) != null
                ? Camera.ClearFlag.SOLID_COLOR : 7;
            cam.clearColor = new Color(12, 12, 16, 255); // opaque, matches the card backdrop
            cam.priority = 1000;
            cam.visibility = 0xffffffff;
            cam.targetTexture = rt;

            // Key + fill directional lights: lit (PBR) materials would be pitch black
            // otherwise. Fixed in world so a normal/emissive map is revealed as the
            // sphere spins.
            try {
                const DirectionalLight = cc.DirectionalLight;
                if (DirectionalLight) {
                    const kn = new Node('__mat_key__'); root.addChild(kn);
                    const kl = kn.addComponent(DirectionalLight);
                    try { kl.illuminance = 60000; } catch { /* older prop name */ }
                    try { kl.color = new Color(255, 252, 245, 255); } catch { /* ignore */ }
                    kn.setRotationFromEuler(-45, -35, 0);
                    const fn = new Node('__mat_fill__'); root.addChild(fn);
                    const fl = fn.addComponent(DirectionalLight);
                    try { fl.illuminance = 22000; } catch { /* ignore */ }
                    try { fl.color = new Color(215, 225, 255, 255); } catch { /* ignore */ }
                    fn.setRotationFromEuler(-15, 145, 0);
                }
            } catch { /* lighting optional */ }

            // Deterministic engine pump (the editor won't advance our offscreen camera
            // on its own).
            const dt = Math.max(0.016, delayMs / 1000);
            let tickOk = typeof director.tick === 'function';
            const pump = async () => {
                if (tickOk) {
                    try { director.tick(dt); return; }
                    catch (e: any) { warnings.push(`tick: ${e.message}`); tickOk = false; }
                }
                await sleep(delayMs);
            };
            // Warm up so the sphere's GPU model initialises before we capture.
            for (let i = 0; i < 3; i++) { await pump(); }

            // Fixed-radius framing: place the camera so the sphere fills ~targetFill
            // of the frame from a 3/4 elevated front view.
            const fovRad = (cam.fov * Math.PI) / 180;
            const targetFill = (opts && opts.targetFill) || 0.8;
            const dir = new Vec3(0.35, 0.28, 1); dir.normalize();
            let dist = (R / Math.sin(fovRad / 2)) * (1 / targetFill);
            if (!isFinite(dist) || dist <= 0) { dist = R * 4 || 4; }
            camNode.setWorldPosition(T.x + dir.x * dist, T.y + dir.y * dist, T.z + dir.z * dist);
            camNode.lookAt(T);

            // Capture: spin, pump, read the offscreen texture.
            const rowBytes = W * 4;
            const frames: string[] = [];
            let nonZero = 0, nonClear = 0, sampled = 0;
            for (let f = 0; f < frameCount; f++) {
                spin.setRotationFromEuler(0, (f / frameCount) * 360, 0);
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
                for (let p = 0; p < flipped.length; p += 64) {
                    const r = flipped[p], g = flipped[p + 1], b = flipped[p + 2];
                    if (r > 2 || g > 2 || b > 2) nonZero++;
                    if (Math.abs(r - 12) > 8 || Math.abs(g - 12) > 8 || Math.abs(b - 16) > 8) nonClear++;
                    sampled++;
                }
                frames.push(bytesToBase64(flipped));
            }

            const diag = {
                kind: 'material', mode: 'turntable', ticked: tickOk,
                nonZeroFrac: sampled ? +(nonZero / sampled).toFixed(3) : 0,
                nonClearFrac: sampled ? +(nonClear / sampled).toFixed(3) : 0,
                radius: R, dist: +dist.toFixed(2),
                // The panel's stale-scene check only tests for the presence of
                // `fitFrac`; the sphere is framed directly, so report the target fill.
                fitFrac: targetFill,
            };
            if (frames.length === 0) { return { ok: false, error: 'no frames captured', warnings, diag }; }
            return { ok: true, width: W, height: H, delayMs, frameCount: frames.length, frames, mode: 'turntable', warnings, diag };
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
 * Tight world-space bounds for a model instance (FBX/glTF prefab). Unions each
 * MeshRenderer/SkinnedMeshRenderer's GPU worldBounds AABB; if those haven't been
 * produced yet, falls back to transforming each mesh's local min/max by its node
 * world matrix. Returns the centre plus a bounding-SPHERE radius (the AABB
 * half-diagonal) so a Y-axis turntable rotation is guaranteed to stay in frame.
 */
function computeModelBounds(inst: any, cc: any): { center: any; radius: number } | null {
    const { Vec3, MeshRenderer } = cc;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let found = false;
    const expand = (x: number, y: number, z: number) => {
        if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
        found = true;
    };

    // SkinnedMeshRenderer extends MeshRenderer, so this catches both.
    const renderers: any[] = MeshRenderer ? inst.getComponentsInChildren(MeshRenderer) : [];
    for (const r of renderers) {
        const wb = r.model && r.model.worldBounds;
        if (wb && wb.center && wb.halfExtents) {
            expand(wb.center.x - wb.halfExtents.x, wb.center.y - wb.halfExtents.y, wb.center.z - wb.halfExtents.z);
            expand(wb.center.x + wb.halfExtents.x, wb.center.y + wb.halfExtents.y, wb.center.z + wb.halfExtents.z);
        }
    }

    // Fallback for renderers whose GPU model hasn't reported worldBounds yet:
    // transform the mesh's local AABB corners by the node's world matrix.
    if (!found) {
        const v = new Vec3();
        for (const r of renderers) {
            const mesh = r.mesh;
            const st = mesh && mesh.struct;
            if (!st || !st.minPosition || !st.maxPosition) continue;
            const wm = r.node && r.node.worldMatrix;
            if (!wm) continue;
            const mn = st.minPosition, mx = st.maxPosition;
            const corners = [
                [mn.x, mn.y, mn.z], [mx.x, mn.y, mn.z], [mn.x, mx.y, mn.z], [mn.x, mn.y, mx.z],
                [mx.x, mx.y, mn.z], [mx.x, mn.y, mx.z], [mn.x, mx.y, mx.z], [mx.x, mx.y, mx.z],
            ];
            for (const c of corners) {
                v.set(c[0], c[1], c[2]);
                Vec3.transformMat4(v, v, wm);
                expand(v.x, v.y, v.z);
            }
        }
    }

    if (!found || !isFinite(minX) || !isFinite(maxX)) return null;
    const center = new Vec3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    const hx = (maxX - minX) / 2, hy = (maxY - minY) / 2, hz = (maxZ - minZ) / 2;
    const radius = Math.sqrt(hx * hx + hy * hy + hz * hz) || 0.5;
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
