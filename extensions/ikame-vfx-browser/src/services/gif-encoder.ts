'use strict';

/**
 * Self-contained animated-GIF89a encoder. No external dependencies, no DOM and
 * no Node APIs — operates purely on typed arrays so it runs in both the editor
 * main process and a panel renderer.
 *
 * Pipeline per frame: NeuQuant neural-net colour quantisation -> 256-colour
 * palette -> LZW-compressed indexed pixels, each frame written with its own
 * local colour table and a graphic-control block carrying the frame delay.
 *
 * Input frames are RGBA (4 bytes/pixel, top-down, row-major). Alpha is ignored
 * — callers are expected to composite over an opaque background first, which the
 * particle thumbnailer does (opaque dark clear colour), so 1-bit GIF alpha is
 * never needed.
 *
 * NeuQuant is Anthony Dekker's algorithm; this is a TypeScript port of the
 * widely-used Kevin Weiner / gif.js variant, adapted to 4-byte RGBA indexing.
 */

// ---------------------------------------------------------------------------
// NeuQuant colour quantiser
// ---------------------------------------------------------------------------

const NETSIZE = 256;            // number of colours used
const PRIME1 = 499;
const PRIME2 = 491;
const PRIME3 = 487;
const PRIME4 = 503;
const MINPICTUREBYTES = 4 * PRIME4;

const MAXNETPOS = NETSIZE - 1;
const NETBIASSHIFT = 4;
const NCYCLES = 100;

const INTBIASSHIFT = 16;
const INTBIAS = 1 << INTBIASSHIFT;
const GAMMASHIFT = 10;
const BETASHIFT = 10;
const BETA = INTBIAS >> BETASHIFT;
const BETAGAMMA = INTBIAS << (GAMMASHIFT - BETASHIFT);

const INITRAD = NETSIZE >> 3;
const RADIUSBIASSHIFT = 6;
const RADIUSBIAS = 1 << RADIUSBIASSHIFT;
const INITRADIUS = INITRAD * RADIUSBIAS;
const RADIUSDEC = 30;

const ALPHABIASSHIFT = 10;
const INITALPHA = 1 << ALPHABIASSHIFT;

const RADBIASSHIFT = 8;
const RADBIAS = 1 << RADBIASSHIFT;
const ALPHARADBSHIFT = ALPHABIASSHIFT + RADBIASSHIFT;
const ALPHARADBIAS = 1 << ALPHARADBSHIFT;

class NeuQuant {
    private pixels: Uint8Array;
    private samplefac: number;
    private network: number[][] = [];
    private netindex: Int32Array = new Int32Array(256);
    private bias: Int32Array = new Int32Array(NETSIZE);
    private freq: Int32Array = new Int32Array(NETSIZE);
    private radpower: Int32Array = new Int32Array(INITRAD);

    constructor(pixels: Uint8Array, samplefac: number) {
        this.pixels = pixels;
        this.samplefac = samplefac;
        for (let i = 0; i < NETSIZE; i++) {
            const v = (i << (NETBIASSHIFT + 8)) / NETSIZE;
            this.network[i] = [v, v, v, 0];
            this.freq[i] = (INTBIAS / NETSIZE) | 0;
            this.bias[i] = 0;
        }
    }

    private unbiasnet(): void {
        for (let i = 0; i < NETSIZE; i++) {
            this.network[i][0] >>= NETBIASSHIFT;
            this.network[i][1] >>= NETBIASSHIFT;
            this.network[i][2] >>= NETBIASSHIFT;
            this.network[i][3] = i; // record colour number
        }
    }

    private altersingle(alpha: number, i: number, b: number, g: number, r: number): void {
        this.network[i][0] -= (alpha * (this.network[i][0] - b)) / INITALPHA;
        this.network[i][1] -= (alpha * (this.network[i][1] - g)) / INITALPHA;
        this.network[i][2] -= (alpha * (this.network[i][2] - r)) / INITALPHA;
    }

    private alterneigh(radius: number, i: number, b: number, g: number, r: number): void {
        const lo = Math.abs(i - radius);
        const hi = Math.min(i + radius, NETSIZE);
        let j = i + 1;
        let k = i - 1;
        let m = 1;
        while (j < hi || k > lo) {
            const a = this.radpower[m++];
            if (j < hi) {
                const p = this.network[j++];
                p[0] -= (a * (p[0] - b)) / ALPHARADBIAS;
                p[1] -= (a * (p[1] - g)) / ALPHARADBIAS;
                p[2] -= (a * (p[2] - r)) / ALPHARADBIAS;
            }
            if (k > lo) {
                const p = this.network[k--];
                p[0] -= (a * (p[0] - b)) / ALPHARADBIAS;
                p[1] -= (a * (p[1] - g)) / ALPHARADBIAS;
                p[2] -= (a * (p[2] - r)) / ALPHARADBIAS;
            }
        }
    }

    private contest(b: number, g: number, r: number): number {
        let bestd = ~(1 << 31);
        let bestbiasd = bestd;
        let bestpos = -1;
        let bestbiaspos = bestpos;
        for (let i = 0; i < NETSIZE; i++) {
            const n = this.network[i];
            let dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
            if (dist < bestd) { bestd = dist; bestpos = i; }
            const biasdist = dist - ((this.bias[i]) >> (INTBIASSHIFT - NETBIASSHIFT));
            if (biasdist < bestbiasd) { bestbiasd = biasdist; bestbiaspos = i; }
            const betafreq = this.freq[i] >> BETASHIFT;
            this.freq[i] -= betafreq;
            this.bias[i] += betafreq << GAMMASHIFT;
        }
        this.freq[bestpos] += BETA;
        this.bias[bestpos] -= BETAGAMMA;
        return bestbiaspos;
    }

    private inxbuild(): void {
        let previouscol = 0;
        let startpos = 0;
        for (let i = 0; i < NETSIZE; i++) {
            const p = this.network[i];
            let smallpos = i;
            let smallval = p[1];
            for (let j = i + 1; j < NETSIZE; j++) {
                const q = this.network[j];
                if (q[1] < smallval) { smallpos = j; smallval = q[1]; }
            }
            const q = this.network[smallpos];
            if (i !== smallpos) {
                let t = q[0]; q[0] = p[0]; p[0] = t;
                t = q[1]; q[1] = p[1]; p[1] = t;
                t = q[2]; q[2] = p[2]; p[2] = t;
                t = q[3]; q[3] = p[3]; p[3] = t;
            }
            if (smallval !== previouscol) {
                this.netindex[previouscol] = (startpos + i) >> 1;
                for (let j = previouscol + 1; j < smallval; j++) this.netindex[j] = i;
                previouscol = smallval;
                startpos = i;
            }
        }
        this.netindex[previouscol] = (startpos + MAXNETPOS) >> 1;
        for (let j = previouscol + 1; j < 256; j++) this.netindex[j] = MAXNETPOS;
    }

    private learn(): void {
        const lengthcount = this.pixels.length;
        const alphadec = 30 + ((this.samplefac - 1) / 3);
        const samplepixels = (lengthcount / (4 * this.samplefac)) | 0;
        let delta = (samplepixels / NCYCLES) | 0;
        if (delta === 0) delta = 1;
        let alpha = INITALPHA;
        let radius = INITRADIUS;

        let rad = radius >> RADIUSBIASSHIFT;
        if (rad <= 1) rad = 0;
        for (let i = 0; i < rad; i++) {
            this.radpower[i] = (alpha * (((rad * rad - i * i) * RADBIAS) / (rad * rad))) | 0;
        }

        let step: number;
        if (lengthcount < MINPICTUREBYTES) {
            this.samplefac = 1;
            step = 4;
        } else if (lengthcount % PRIME1 !== 0) {
            step = 4 * PRIME1;
        } else if (lengthcount % PRIME2 !== 0) {
            step = 4 * PRIME2;
        } else if (lengthcount % PRIME3 !== 0) {
            step = 4 * PRIME3;
        } else {
            step = 4 * PRIME4;
        }

        let pix = 0;
        let i = 0;
        while (i < samplepixels) {
            const b = (this.pixels[pix] & 0xff) << NETBIASSHIFT;
            const g = (this.pixels[pix + 1] & 0xff) << NETBIASSHIFT;
            const r = (this.pixels[pix + 2] & 0xff) << NETBIASSHIFT;
            const j = this.contest(b, g, r);
            this.altersingle(alpha, j, b, g, r);
            if (rad !== 0) this.alterneigh(rad, j, b, g, r);

            pix += step;
            if (pix >= lengthcount) pix -= lengthcount;

            i++;
            if (delta === 0) delta = 1;
            if (i % delta === 0) {
                alpha -= (alpha / alphadec) | 0;
                radius -= (radius / RADIUSDEC) | 0;
                rad = radius >> RADIUSBIASSHIFT;
                if (rad <= 1) rad = 0;
                for (let k = 0; k < rad; k++) {
                    this.radpower[k] = (alpha * (((rad * rad - k * k) * RADBIAS) / (rad * rad))) | 0;
                }
            }
        }
    }

    /** Run quantisation. Call before getColormap()/lookupRGB(). */
    buildColormap(): void {
        this.learn();
        this.unbiasnet();
        this.inxbuild();
    }

    /** Returns the palette as a flat [r,g,b,r,g,b,...] of 256 entries. */
    getColormap(): number[] {
        const map: number[] = [];
        const index: number[] = [];
        for (let i = 0; i < NETSIZE; i++) index[this.network[i][3]] = i;
        let k = 0;
        for (let l = 0; l < NETSIZE; l++) {
            const j = index[l];
            map[k++] = this.network[j][0] & 0xff;
            map[k++] = this.network[j][1] & 0xff;
            map[k++] = this.network[j][2] & 0xff;
        }
        return map;
    }

    /** Search the palette for the closest colour to (r,g,b); returns its index. */
    lookupRGB(b: number, g: number, r: number): number {
        let bestd = 1000;
        let best = -1;
        let i = this.netindex[g];
        let j = i - 1;
        while (i < NETSIZE || j >= 0) {
            if (i < NETSIZE) {
                const p = this.network[i];
                let dist = p[1] - g;
                if (dist >= bestd) {
                    i = NETSIZE;
                } else {
                    i++;
                    if (dist < 0) dist = -dist;
                    let a = p[0] - b; if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r; if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) { bestd = dist; best = p[3]; }
                    }
                }
            }
            if (j >= 0) {
                const p = this.network[j];
                let dist = g - p[1];
                if (dist >= bestd) {
                    j = -1;
                } else {
                    j--;
                    if (dist < 0) dist = -dist;
                    let a = p[0] - b; if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r; if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) { bestd = dist; best = p[3]; }
                    }
                }
            }
        }
        return best;
    }
}

// ---------------------------------------------------------------------------
// LZW (GIF variant) encoder — classic Kevin Weiner port
// ---------------------------------------------------------------------------

const EOF = -1;
const BITS = 12;
const HSIZE = 5003;

class LZWEncoder {
    private width: number;
    private height: number;
    private pixels: Uint8Array;
    private initCodeSize: number;

    private remaining = 0;
    private curPixel = 0;
    private nBits = 0;
    private maxbits = BITS;
    private maxcode = 0;
    private maxmaxcode = 1 << BITS;
    private htab = new Int32Array(HSIZE);
    private codetab = new Int32Array(HSIZE);
    private hsize = HSIZE;
    private freeEnt = 0;
    private clearFlg = false;
    private gInitBits = 0;
    private ClearCode = 0;
    private EOFCode = 0;
    private curAccum = 0;
    private curBits = 0;
    private masks = [
        0x0000, 0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff,
        0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff,
    ];
    private accum = new Uint8Array(256);
    private aCount = 0;

    constructor(width: number, height: number, pixels: Uint8Array, colorDepth: number) {
        this.width = width;
        this.height = height;
        this.pixels = pixels;
        this.initCodeSize = Math.max(2, colorDepth);
    }

    private charOut(c: number, out: number[]): void {
        this.accum[this.aCount++] = c;
        if (this.aCount >= 254) this.flushChar(out);
    }

    private flushChar(out: number[]): void {
        if (this.aCount > 0) {
            out.push(this.aCount);
            for (let i = 0; i < this.aCount; i++) out.push(this.accum[i]);
            this.aCount = 0;
        }
    }

    private clHash(hsize: number): void {
        for (let i = 0; i < hsize; i++) this.htab[i] = -1;
    }

    private clearBlock(out: number[]): void {
        this.clHash(this.hsize);
        this.freeEnt = this.ClearCode + 2;
        this.clearFlg = true;
        this.output(this.ClearCode, out);
    }

    private output(code: number, out: number[]): void {
        this.curAccum &= this.masks[this.curBits];
        if (this.curBits > 0) this.curAccum |= (code << this.curBits);
        else this.curAccum = code;
        this.curBits += this.nBits;
        while (this.curBits >= 8) {
            this.charOut(this.curAccum & 0xff, out);
            this.curAccum >>= 8;
            this.curBits -= 8;
        }
        if (this.freeEnt > this.maxcode || this.clearFlg) {
            if (this.clearFlg) {
                this.maxcode = this.maxcodeFor(this.nBits = this.gInitBits);
                this.clearFlg = false;
            } else {
                this.nBits++;
                this.maxcode = this.nBits === this.maxbits ? this.maxmaxcode : this.maxcodeFor(this.nBits);
            }
        }
        if (code === this.EOFCode) {
            while (this.curBits > 0) {
                this.charOut(this.curAccum & 0xff, out);
                this.curAccum >>= 8;
                this.curBits -= 8;
            }
            this.flushChar(out);
        }
    }

    private maxcodeFor(nBits: number): number {
        return (1 << nBits) - 1;
    }

    private nextPixel(): number {
        if (this.remaining === 0) return EOF;
        this.remaining--;
        return this.pixels[this.curPixel++] & 0xff;
    }

    private compress(initBits: number, out: number[]): void {
        this.gInitBits = initBits;
        this.clearFlg = false;
        this.nBits = this.gInitBits;
        this.maxcode = this.maxcodeFor(this.nBits);
        this.ClearCode = 1 << (initBits - 1);
        this.EOFCode = this.ClearCode + 1;
        this.freeEnt = this.ClearCode + 2;
        this.aCount = 0;

        let ent = this.nextPixel();
        let hshift = 0;
        for (let fcode = this.hsize; fcode < 65536; fcode *= 2) hshift++;
        hshift = 8 - hshift;
        const hsizeReg = this.hsize;
        this.clHash(hsizeReg);
        this.output(this.ClearCode, out);

        let c: number;
        outer: while ((c = this.nextPixel()) !== EOF) {
            const fcode = (c << this.maxbits) + ent;
            let i = (c << hshift) ^ ent;
            if (this.htab[i] === fcode) {
                ent = this.codetab[i];
                continue;
            } else if (this.htab[i] >= 0) {
                let disp = hsizeReg - i;
                if (i === 0) disp = 1;
                do {
                    if ((i -= disp) < 0) i += hsizeReg;
                    if (this.htab[i] === fcode) { ent = this.codetab[i]; continue outer; }
                } while (this.htab[i] >= 0);
            }
            this.output(ent, out);
            ent = c;
            if (this.freeEnt < this.maxmaxcode) {
                this.codetab[i] = this.freeEnt++;
                this.htab[i] = fcode;
            } else {
                this.clearBlock(out);
            }
        }
        this.output(ent, out);
        this.output(this.EOFCode, out);
    }

    encode(out: number[]): void {
        out.push(this.initCodeSize);
        this.remaining = this.width * this.height;
        this.curPixel = 0;
        this.compress(this.initCodeSize + 1, out);
        out.push(0); // block terminator
    }
}

// ---------------------------------------------------------------------------
// GIF89a assembly
// ---------------------------------------------------------------------------

export interface GifOptions {
    /** Per-frame delay in centiseconds (1/100 s). Default 8 (~12.5 fps). */
    delayCs?: number;
    /** 0 = loop forever (default), >0 = loop count. */
    loop?: number;
    /** NeuQuant sampling factor 1 (best) .. 30 (fast). Default 10. */
    sample?: number;
}

function writeShort(out: number[], v: number): void {
    out.push(v & 0xff, (v >> 8) & 0xff);
}

function writeString(out: number[], s: string): void {
    for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i));
}

/**
 * Encode RGBA frames into an animated GIF89a. Every frame is given its own
 * 256-colour local palette (independent NeuQuant pass) for best fidelity.
 *
 * @param frames  array of RGBA byte buffers, each width*height*4 long, top-down.
 * @returns the GIF file bytes.
 */
export function encodeAnimatedGif(
    frames: Uint8Array[],
    width: number,
    height: number,
    opts: GifOptions = {},
): Uint8Array {
    const delayCs = opts.delayCs ?? 8;
    const loop = opts.loop ?? 0;
    const sample = opts.sample ?? 10;

    const out: number[] = [];

    // Header + logical screen descriptor (no global colour table).
    writeString(out, 'GIF89a');
    writeShort(out, width);
    writeShort(out, height);
    out.push(0x70);  // packed: no GCT, colour resolution 8
    out.push(0);     // background colour index
    out.push(0);     // pixel aspect ratio

    // NETSCAPE2.0 looping application extension.
    out.push(0x21, 0xff, 0x0b);
    writeString(out, 'NETSCAPE2.0');
    out.push(0x03, 0x01);
    writeShort(out, loop);
    out.push(0x00);

    for (const frame of frames) {
        // Quantise this frame.
        const nq = new NeuQuant(frame, sample);
        nq.buildColormap();
        const colorTab = nq.getColormap();

        // Map every pixel to a palette index.
        const npix = width * height;
        const indexed = new Uint8Array(npix);
        for (let i = 0, p = 0; i < npix; i++, p += 4) {
            indexed[i] = nq.lookupRGB(frame[p] & 0xff, frame[p + 1] & 0xff, frame[p + 2] & 0xff);
        }

        // Graphic control extension (delay, no transparency).
        out.push(0x21, 0xf9, 0x04);
        out.push(0x00);          // packed: disposal none, no transparency
        writeShort(out, delayCs);
        out.push(0x00);          // transparent colour index (unused)
        out.push(0x00);          // block terminator

        // Image descriptor with a local colour table (8-bit, 256 entries).
        out.push(0x2c);
        writeShort(out, 0);      // left
        writeShort(out, 0);      // top
        writeShort(out, width);
        writeShort(out, height);
        out.push(0x87);          // packed: local colour table, 256 entries (2^(7+1))

        // Local colour table (256 * 3 bytes, padded).
        for (let i = 0; i < 256; i++) {
            out.push(colorTab[i * 3] & 0xff, colorTab[i * 3 + 1] & 0xff, colorTab[i * 3 + 2] & 0xff);
        }

        // LZW image data.
        new LZWEncoder(width, height, indexed, 8).encode(out);
    }

    out.push(0x3b); // trailer
    return Uint8Array.from(out);
}
