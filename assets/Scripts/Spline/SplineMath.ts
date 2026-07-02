import { Vec3 } from 'cc';

/**
 * Tangent behaviour of a single knot — mirrors Unity's Splines package.
 *  - AutoSmooth: tangents are computed from the neighbouring knots (Catmull-Rom).
 *                Just place points and the curve passes through them smoothly. (default)
 *  - Linear:     no tangents -> straight segment in/out of the knot.
 *  - Bezier:     tangents are authored by hand via draggable handles (in/out offsets).
 */
export enum TangentMode {
    AutoSmooth = 0,
    Linear = 1,
    Bezier = 2,
}

/** How the two Bezier handles of a knot relate to each other. */
export enum BezierMode {
    /** in = -out (same length, opposite direction). */
    Mirrored = 0,
    /** in and out share a direction but may differ in length. */
    Aligned = 1,
    /** in and out are fully independent. */
    Broken = 2,
}

const _v0 = new Vec3();
const _v1 = new Vec3();
const _v2 = new Vec3();
const _v3 = new Vec3();

/**
 * Evaluate a cubic Bezier segment at t in [0,1].
 * p0/p3 are the segment endpoints, p1/p2 the control points.
 */
export function cubicBezier(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number, out: Vec3): Vec3 {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    const a = uu * u;          // (1-t)^3
    const b = 3 * uu * t;      // 3(1-t)^2 t
    const c = 3 * u * tt;      // 3(1-t) t^2
    const d = tt * t;          // t^3
    out.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x;
    out.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y;
    out.z = a * p0.z + b * p1.z + c * p2.z + d * p3.z;
    return out;
}

/**
 * First derivative (un-normalised tangent / velocity) of a cubic Bezier at t.
 * Direction of travel along the curve; not unit length.
 */
export function cubicBezierTangent(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number, out: Vec3): Vec3 {
    const u = 1 - t;
    const a = 3 * u * u;       // 3(1-t)^2
    const b = 6 * u * t;       // 6(1-t)t
    const c = 3 * t * t;       // 3t^2
    out.x = a * (p1.x - p0.x) + b * (p2.x - p1.x) + c * (p3.x - p2.x);
    out.y = a * (p1.y - p0.y) + b * (p2.y - p1.y) + c * (p3.y - p2.y);
    out.z = a * (p1.z - p0.z) + b * (p2.z - p1.z) + c * (p3.z - p2.z);
    return out;
}

/**
 * Auto-smooth (Catmull-Rom) out-tangent OFFSET for a knot, given its neighbours.
 * Returns the vector you add to the knot position to get Bezier control point P1.
 * The in-tangent offset is simply the negation of this.
 *
 * Standard Catmull-Rom -> Bezier conversion uses (next - prev) / 6; `tension`
 * scales the handle length (1 = classic Catmull-Rom).
 */
export function autoTangent(prev: Vec3, cur: Vec3, next: Vec3, hasPrev: boolean, hasNext: boolean, tension: number, out: Vec3): Vec3 {
    if (hasPrev && hasNext) {
        Vec3.subtract(out, next, prev);
        Vec3.multiplyScalar(out, out, tension / 6);
    } else if (hasNext) {
        // start endpoint: aim a third of the way toward the next knot
        Vec3.subtract(out, next, cur);
        Vec3.multiplyScalar(out, out, tension / 3);
    } else if (hasPrev) {
        // end endpoint: extend the incoming direction
        Vec3.subtract(out, cur, prev);
        Vec3.multiplyScalar(out, out, tension / 3);
    } else {
        out.set(0, 0, 0);
    }
    return out;
}

/** A baked Bezier segment: 4 control points ready to evaluate. */
export interface BezierSegment {
    p0: Vec3;
    p1: Vec3;
    p2: Vec3;
    p3: Vec3;
}

/** Arc-length lookup entry mapping a cumulative distance to a global curve parameter u in [0,1]. */
interface LutEntry {
    dist: number;
    u: number;
}

/**
 * Arc-length table built from a list of Bezier segments. Lets a follower travel
 * at a constant speed (distance) instead of a uniform parameter (which bunches up
 * on tight curves).
 */
export class ArcLengthTable {
    private _entries: LutEntry[] = [];
    private _length = 0;

    get length(): number { return this._length; }

    /**
     * @param segments  baked Bezier segments in order
     * @param perSeg    samples per segment (higher = more accurate length)
     */
    build(segments: BezierSegment[], perSeg: number): void {
        this._entries.length = 0;
        this._length = 0;
        const segCount = segments.length;
        if (segCount === 0) {
            this._entries.push({ dist: 0, u: 0 });
            return;
        }
        const prev = _v0;
        const cur = _v1;
        let first = true;
        for (let s = 0; s < segCount; s++) {
            const seg = segments[s];
            for (let i = 0; i <= perSeg; i++) {
                // skip the shared joint between consecutive segments
                if (s > 0 && i === 0) continue;
                const localT = i / perSeg;
                cubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, localT, cur);
                const globalU = (s + localT) / segCount;
                if (first) {
                    this._entries.push({ dist: 0, u: 0 });
                    Vec3.copy(prev, cur);
                    first = false;
                    continue;
                }
                this._length += Vec3.distance(prev, cur);
                this._entries.push({ dist: this._length, u: globalU });
                Vec3.copy(prev, cur);
            }
        }
    }

    /** Convert a distance along the curve into the global parameter u in [0,1]. */
    distanceToU(dist: number): number {
        const entries = this._entries;
        const n = entries.length;
        if (n === 0) return 0;
        if (dist <= 0) return entries[0].u;
        if (dist >= this._length) return entries[n - 1].u;
        // binary search for the segment containing `dist`
        let lo = 0;
        let hi = n - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (entries[mid].dist < dist) lo = mid; else hi = mid;
        }
        const a = entries[lo];
        const b = entries[hi];
        const span = b.dist - a.dist;
        const f = span > 1e-6 ? (dist - a.dist) / span : 0;
        return a.u + (b.u - a.u) * f;
    }
}
