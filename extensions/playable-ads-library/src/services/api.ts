'use strict';

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { CatalogResponse } from '../mappers/types';

/**
 * Idle-socket timeout for every Hub request. This is an *inactivity* timeout,
 * not a total-duration one, so a slow-but-progressing download of a large mesh
 * or thumbnail is never cut off — only a server that has gone silent is. Without
 * it an unreachable-but-routable host (the LAN Hub while off) leaves the promise
 * pending forever and the caller's busy state never clears.
 */
const REQUEST_TIMEOUT_MS = 30000;

/** Fail a stalled request instead of hanging on it forever. */
function attachTimeout(req: http.ClientRequest, urlStr: string, reject: (e: Error) => void): void {
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        reject(new Error(`Timeout after ${REQUEST_TIMEOUT_MS / 1000}s: ${urlStr}`));
        req.destroy();
    });
}

export class VFXApiClient {
    private serverUrl: string;

    constructor(serverUrl: string) {
        // Remove trailing slash
        this.serverUrl = serverUrl.replace(/\/+$/, '');
    }

    /** Fetch the full VFX catalog */
    async fetchCatalog(): Promise<CatalogResponse> {
        const data = await this.getJson(`${this.serverUrl}/api/vfx/catalog`);
        return data as CatalogResponse;
    }

    /** Download particle.json for a VFX item */
    async downloadParticleJson(vfxId: string): Promise<Record<string, any>> {
        const data = await this.getJson(`${this.serverUrl}/api/vfx/${encodeURIComponent(vfxId)}/particle-json`);
        return data as Record<string, any>;
    }

    /** Download asset binary (texture or mesh) */
    async downloadAssetBinary(guid: string): Promise<Buffer> {
        return this.getBuffer(`${this.serverUrl}/api/assets/${encodeURIComponent(guid)}`);
    }

    /** Download asset metadata JSON (for materials) */
    async downloadAssetMeta(guid: string): Promise<Record<string, any>> {
        const data = await this.getJson(`${this.serverUrl}/api/assets/${encodeURIComponent(guid)}/meta`);
        return data as Record<string, any>;
    }

    /** URL of the animated webm thumbnail for a VFX item (GET /api/vfx/{id}/thumbnail) */
    thumbnailUrl(vfxId: string): string {
        return `${this.serverUrl}/api/vfx/${encodeURIComponent(vfxId)}/thumbnail`;
    }

    /** Download the animated webm thumbnail bytes for a VFX item */
    async downloadThumbnail(vfxId: string): Promise<Buffer> {
        return this.getBuffer(`${this.serverUrl}/api/vfx/${encodeURIComponent(vfxId)}/thumbnail`);
    }

    /** Check if an asset exists on the server */
    async assetExists(guid: string): Promise<boolean> {
        return new Promise((resolve) => {
            const url = new URL(`${this.serverUrl}/api/assets/${encodeURIComponent(guid)}`);
            const mod = url.protocol === 'https:' ? https : http;
            const req = mod.request(url, { method: 'HEAD' }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.setTimeout(REQUEST_TIMEOUT_MS, () => { resolve(false); req.destroy(); });
            req.on('error', () => resolve(false));
            req.end();
        });
    }

    /** GET request returning parsed JSON */
    private getJson(urlStr: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const url = new URL(urlStr);
            const mod = url.protocol === 'https:' ? https : http;
            const req = mod.get(url, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode} from ${urlStr}`));
                    res.resume();
                    return;
                }
                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () => {
                    try {
                        const body = Buffer.concat(chunks).toString('utf-8');
                        resolve(JSON.parse(body));
                    } catch (err: any) {
                        reject(new Error(`JSON parse error from ${urlStr}: ${err.message}`));
                    }
                });
            });
            attachTimeout(req, urlStr, reject);
            req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)));
        });
    }

    /** GET request returning raw Buffer */
    private getBuffer(urlStr: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const url = new URL(urlStr);
            const mod = url.protocol === 'https:' ? https : http;
            const req = mod.get(url, (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode} from ${urlStr}`));
                    res.resume();
                    return;
                }
                const chunks: Buffer[] = [];
                res.on('data', (chunk: Buffer) => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            });
            attachTimeout(req, urlStr, reject);
            req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)));
        });
    }
}
