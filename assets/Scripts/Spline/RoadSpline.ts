import { _decorator, Component, Node, Vec3, Color, Graphics, Enum, CCFloat, CCBoolean } from 'cc';
import { EDITOR } from 'cc/env';
import {
    TangentMode, BezierMode,
    cubicBezierTangent, autoTangent,
    BezierSegment, ArcLengthTable,
} from './SplineMath';

const { ccclass, property, executeInEditMode, requireComponent, menu, disallowMultiple } = _decorator;

const IN_HANDLE = '__inHandle';
const OUT_HANDLE = '__outHandle';

/**
 * Per-knot authoring data. Lives in a parallel array to the spline node's child
 * nodes: child[i].position is the knot position, _knots[i] is its tangent data.
 * (Kept as data instead of on the child node so adding/removing points stays cheap.)
 */
@ccclass('RoadSplineKnot')
export class RoadSplineKnot {
    @property({ type: Enum(TangentMode), tooltip: 'AutoSmooth: tự bo cong qua điểm | Linear: thẳng | Bezier: kéo tay cầm' })
    mode: TangentMode = TangentMode.AutoSmooth;

    @property({
        type: Enum(BezierMode),
        tooltip: 'Chỉ dùng khi mode = Bezier. Quan hệ giữa 2 tay cầm.',
        visible(this: RoadSplineKnot) { return this.mode === TangentMode.Bezier; },
    })
    bezierMode: BezierMode = BezierMode.Mirrored;

    /** Out control point OFFSET (relative to the knot position, in spline-local space). */
    @property({ visible: false })
    outTangent: Vec3 = new Vec3();

    /** In control point OFFSET (relative to the knot position, in spline-local space). */
    @property({ visible: false })
    inTangent: Vec3 = new Vec3();
}

/**
 * RoadSpline — Unity-Splines-style path you author directly in the Scene view.
 *
 * WORKFLOW (no JSON anywhere — the path is saved inside the scene/prefab):
 *  1. Add this component to an empty node (it auto-adds a Graphics for the preview).
 *     Place that node under a 2D Canvas so the preview line renders.
 *  2. Use the "Add Knot" button (or just add child nodes) to create control points,
 *     then drag those child nodes in the Scene view to shape the road.
 *  3. Each knot defaults to AutoSmooth (curve passes through it). Switch a knot to
 *     Linear for a sharp corner, or Bezier to fine-tune with draggable handles.
 *  4. Point a SplineFollower at this component to drive the bus along the path.
 *
 * Every direct child node of this node is treated as a knot, in sibling order.
 */
@ccclass('RoadSpline')
@executeInEditMode(true)
@requireComponent(Graphics)
@disallowMultiple
@menu('Spline/RoadSpline')
export class RoadSpline extends Component {

    // ---- Shape --------------------------------------------------------------

    @property({ tooltip: 'Nối điểm cuối về điểm đầu (đường vòng kín).' })
    closed = false;

    @property({ type: CCFloat, range: [0, 2, 0.05], slide: true, tooltip: 'Độ căng của tangent tự động (AutoSmooth). 1 = Catmull-Rom chuẩn.' })
    tension = 1;

    @property({ type: [RoadSplineKnot], tooltip: 'Dữ liệu tangent của từng knot (song song với các node con).' })
    knots: RoadSplineKnot[] = [];

    // ---- Preview (editor) ---------------------------------------------------

    @property({ group: { name: 'Preview' }, tooltip: 'Vẽ đường cong cả khi chạy game (mặc định chỉ vẽ trong editor).' })
    showInGame = false;

    @property({ group: { name: 'Preview' } })
    lineColor: Color = new Color(80, 200, 120, 255);

    @property({ group: { name: 'Preview' }, type: CCFloat, range: [1, 30, 1] })
    lineWidth = 6;

    @property({ group: { name: 'Preview' }, type: CCFloat, range: [4, 64, 1], tooltip: 'Số đoạn vẽ mỗi segment. Cao hơn = mượt hơn.' })
    samplesPerSegment = 24;

    @property({ group: { name: 'Preview' }, type: CCFloat, range: [0, 40, 1], tooltip: 'Bán kính chấm tròn đánh dấu knot (0 = ẩn).' })
    knotRadius = 12;

    @property({ group: { name: 'Preview' }, tooltip: 'Hiện tay cầm Bezier (đường + ô vuông).' })
    showHandles = true;

    // ---- Editor buttons (boolean checkbox = action trigger) -----------------

    @property({ group: { name: 'Tools' }, type: CCBoolean, tooltip: 'Thêm 1 knot mới ở cuối đường.' })
    get addKnot(): boolean { return false; }
    set addKnot(_v: boolean) { if (EDITOR) this._addKnotAtEnd(); }

    @property({ group: { name: 'Tools' }, type: CCBoolean, tooltip: 'Xoá knot cuối cùng.' })
    get removeLastKnot(): boolean { return false; }
    set removeLastKnot(_v: boolean) { if (EDITOR) this._removeLastKnot(); }

    @property({ group: { name: 'Tools' }, type: CCBoolean, tooltip: 'Đặt tất cả knot về AutoSmooth (xoá tay cầm thủ công).' })
    get resetToSmooth(): boolean { return false; }
    set resetToSmooth(_v: boolean) { if (EDITOR) this._resetAllToSmooth(); }

    // ---- Runtime / internal -------------------------------------------------

    private _segments: BezierSegment[] = [];
    private _lut: ArcLengthTable = new ArcLengthTable();
    private _gfx: Graphics | null = null;

    /** Total arc length of the path (world units). */
    get length(): number { return this._lut.length; }

    /** Number of knots currently on the spline. */
    get knotCount(): number { return this.node.children.length; }

    /** Number of Bezier segments (n-1, or n if closed). */
    get segmentCount(): number { return this._segments.length; }

    // ---- Lifecycle ----------------------------------------------------------

    onLoad() {
        this._gfx = this.getComponent(Graphics);
        this.rebuild();
        if (!EDITOR && !this.showInGame) {
            this._gfx?.clear();
        }
    }

    onEnable() {
        this.rebuild();
    }

    update() {
        // Editor: live-rebuild so dragging knots/handles updates the curve instantly.
        // Runtime: only if the preview is explicitly requested.
        if (EDITOR || this.showInGame) {
            this.rebuild();
        }
    }

    // ---- Public evaluation API ---------------------------------------------

    /**
     * Position on the curve at the global parameter u in [0,1] (uniform over
     * segments, NOT arc length). Use getPointAtDistance for constant speed.
     */
    getPoint(u: number, out?: Vec3): Vec3 {
        out = out || new Vec3();
        const segs = this._segments;
        const n = segs.length;
        if (n === 0) {
            const first = this.node.children[0];
            return first ? out.set(first.position) : out.set(0, 0, 0);
        }
        u = u < 0 ? 0 : (u > 1 ? 1 : u);
        const g = u * n;
        let i = Math.floor(g);
        if (i >= n) i = n - 1;
        const t = g - i;
        const s = segs[i];
        // inline cubic bezier (position)
        const v = 1 - t, vv = v * v, tt = t * t;
        const a = vv * v, b = 3 * vv * t, c = 3 * v * tt, d = tt * t;
        out.x = a * s.p0.x + b * s.p1.x + c * s.p2.x + d * s.p3.x;
        out.y = a * s.p0.y + b * s.p1.y + c * s.p2.y + d * s.p3.y;
        out.z = a * s.p0.z + b * s.p1.z + c * s.p2.z + d * s.p3.z;
        return out;
    }

    /** Normalised tangent (unit direction of travel) at global parameter u in [0,1]. */
    getTangent(u: number, out?: Vec3): Vec3 {
        out = out || new Vec3();
        const segs = this._segments;
        const n = segs.length;
        if (n === 0) return out.set(1, 0, 0);
        u = u < 0 ? 0 : (u > 1 ? 1 : u);
        const g = u * n;
        let i = Math.floor(g);
        if (i >= n) i = n - 1;
        const t = g - i;
        const s = segs[i];
        cubicBezierTangent(s.p0, s.p1, s.p2, s.p3, t, out);
        const len = out.length();
        return len > 1e-6 ? out.multiplyScalar(1 / len) : out.set(1, 0, 0);
    }

    /** Position at an arc-length distance from the start (0..length). Constant speed. */
    getPointAtDistance(dist: number, out?: Vec3): Vec3 {
        return this.getPoint(this._lut.distanceToU(dist), out);
    }

    /** Normalised tangent at an arc-length distance from the start. */
    getTangentAtDistance(dist: number, out?: Vec3): Vec3 {
        return this.getTangent(this._lut.distanceToU(dist), out);
    }

    // ---- Build --------------------------------------------------------------

    /** Re-sync knot data with child nodes, recompute Bezier segments + arc-length table, redraw. */
    rebuild(): void {
        this._syncKnotData();
        this._computeTangents();
        this._buildSegments();
        this._lut.build(this._segments, Math.max(2, Math.floor(this.samplesPerSegment)));
        if (EDITOR || this.showInGame) {
            this._draw();
        }
    }

    /** Keep the knots[] data array the same length as the child-node list. */
    private _syncKnotData(): void {
        const count = this.node.children.length;
        const k = this.knots;
        if (k.length > count) k.length = count;
        while (k.length < count) k.push(new RoadSplineKnot());
    }

    private _computeTangents(): void {
        const children = this.node.children;
        const n = children.length;
        const k = this.knots;
        for (let i = 0; i < n; i++) {
            const knot = k[i];
            const cur = children[i].position;
            const node = children[i];
            switch (knot.mode) {
                case TangentMode.Linear:
                    this._removeHandles(node);
                    knot.outTangent.set(0, 0, 0);
                    knot.inTangent.set(0, 0, 0);
                    break;

                case TangentMode.Bezier:
                    this._readBezierHandles(node, knot);
                    break;

                case TangentMode.AutoSmooth:
                default: {
                    this._removeHandles(node);
                    const hasPrev = this.closed || i > 0;
                    const hasNext = this.closed || i < n - 1;
                    const prev = children[(i - 1 + n) % n].position;
                    const next = children[(i + 1) % n].position;
                    autoTangent(prev, cur, next, hasPrev, hasNext, this.tension, knot.outTangent);
                    Vec3.negate(knot.inTangent, knot.outTangent);
                    break;
                }
            }
        }
    }

    private _buildSegments(): void {
        const children = this.node.children;
        const n = children.length;
        const k = this.knots;
        const segCount = n < 2 ? 0 : (this.closed ? n : n - 1);
        const segs = this._segments;
        segs.length = 0;
        for (let i = 0; i < segCount; i++) {
            const a = children[i].position;
            const b = children[(i + 1) % n].position;
            const ka = k[i];
            const kb = k[(i + 1) % n];
            segs.push({
                p0: a.clone(),
                p1: new Vec3(a.x + ka.outTangent.x, a.y + ka.outTangent.y, a.z + ka.outTangent.z),
                p2: new Vec3(b.x + kb.inTangent.x, b.y + kb.inTangent.y, b.z + kb.inTangent.z),
                p3: b.clone(),
            });
        }
    }

    // ---- Bezier handle child-node management --------------------------------

    private _findChild(node: Node, name: string): Node | null {
        const c = node.children;
        for (let i = 0; i < c.length; i++) if (c[i].name === name) return c[i];
        return null;
    }

    private _removeHandles(node: Node): void {
        if (!EDITOR) return;
        this._findChild(node, IN_HANDLE)?.destroy();
        this._findChild(node, OUT_HANDLE)?.destroy();
    }

    /** Read (or create) the draggable handle nodes and fold them into the knot data. */
    private _readBezierHandles(node: Node, knot: RoadSplineKnot): void {
        let out = this._findChild(node, OUT_HANDLE);
        let inn = this._findChild(node, IN_HANDLE);

        if (EDITOR && (!out || !inn)) {
            // First time this knot becomes Bezier: seed handles from current tangents
            // (or a sensible default so they aren't sitting on top of the knot).
            if (knot.outTangent.lengthSqr() < 1e-4 && knot.inTangent.lengthSqr() < 1e-4) {
                knot.outTangent.set(120, 0, 0);
                knot.inTangent.set(-120, 0, 0);
            }
            if (!out) { out = new Node(OUT_HANDLE); node.addChild(out); out.setPosition(knot.outTangent); }
            if (!inn) { inn = new Node(IN_HANDLE); node.addChild(inn); inn.setPosition(knot.inTangent); }
        }

        if (out) Vec3.copy(knot.outTangent, out.position);
        if (inn) Vec3.copy(knot.inTangent, inn.position);

        // Couple the handles per BezierMode (out-handle is the master).
        if (out) {
            if (knot.bezierMode === BezierMode.Mirrored) {
                Vec3.negate(knot.inTangent, knot.outTangent);
                inn?.setPosition(knot.inTangent);
            } else if (knot.bezierMode === BezierMode.Aligned) {
                const inLen = knot.inTangent.length();
                const outLen = knot.outTangent.length();
                if (outLen > 1e-4) {
                    Vec3.multiplyScalar(knot.inTangent, knot.outTangent, -inLen / outLen);
                    inn?.setPosition(knot.inTangent);
                }
            }
            // Broken: leave in/out independent.
        }
    }

    // ---- Editor button actions ---------------------------------------------

    private _addKnotAtEnd(): void {
        const children = this.node.children;
        const n = children.length;
        const node = new Node('Knot_' + n);
        this.node.addChild(node);
        // Place the new knot a step beyond the current end, continuing its direction.
        const pos = new Vec3();
        if (n >= 2) {
            const last = children[n - 1].position;
            const prev = children[n - 2].position;
            Vec3.subtract(pos, last, prev);
            if (pos.lengthSqr() < 1e-4) pos.set(150, 0, 0);
            Vec3.add(pos, last, pos);
        } else if (n === 1) {
            Vec3.add(pos, children[0].position, new Vec3(150, 0, 0));
        }
        node.setPosition(pos);
        this.knots.push(new RoadSplineKnot());
        this.rebuild();
    }

    private _removeLastKnot(): void {
        const children = this.node.children;
        if (children.length === 0) return;
        children[children.length - 1].destroy();
        this.knots.pop();
        // child list updates next frame after destroy; rebuild then via update()
    }

    private _resetAllToSmooth(): void {
        for (const knot of this.knots) knot.mode = TangentMode.AutoSmooth;
        for (const child of this.node.children) this._removeHandles(child);
        this.rebuild();
    }

    // ---- Drawing ------------------------------------------------------------

    private _draw(): void {
        const g = this._gfx || (this._gfx = this.getComponent(Graphics));
        if (!g) return;
        g.clear();

        const children = this.node.children;
        const n = children.length;
        if (n === 0) return;

        // 1) the curve itself
        if (this._segments.length > 0) {
            g.lineWidth = this.lineWidth;
            g.strokeColor = this.lineColor;
            const total = this._segments.length;
            const stepsPerSeg = Math.max(2, Math.floor(this.samplesPerSegment));
            const p = new Vec3();
            this.getPoint(0, p);
            g.moveTo(p.x, p.y);
            const totalSteps = total * stepsPerSeg;
            for (let s = 1; s <= totalSteps; s++) {
                this.getPoint(s / totalSteps, p);
                g.lineTo(p.x, p.y);
            }
            g.stroke();
        }

        // 2) Bezier handles (lines + square caps)
        if (this.showHandles) {
            g.lineWidth = Math.max(1, this.lineWidth * 0.4);
            g.strokeColor = new Color(120, 120, 255, 200);
            for (let i = 0; i < n; i++) {
                const knot = this.knots[i];
                if (!knot || knot.mode !== TangentMode.Bezier) continue;
                const c = children[i].position;
                const o = knot.outTangent, inn = knot.inTangent;
                g.moveTo(c.x, c.y); g.lineTo(c.x + o.x, c.y + o.y);
                g.moveTo(c.x, c.y); g.lineTo(c.x + inn.x, c.y + inn.y);
                g.stroke();
                const hs = Math.max(4, this.knotRadius * 0.6);
                g.fillColor = new Color(120, 120, 255, 255);
                g.rect(c.x + o.x - hs / 2, c.y + o.y - hs / 2, hs, hs); g.fill();
                g.rect(c.x + inn.x - hs / 2, c.y + inn.y - hs / 2, hs, hs); g.fill();
            }
        }

        // 3) knot markers
        if (this.knotRadius > 0) {
            for (let i = 0; i < n; i++) {
                const c = children[i].position;
                // first knot green, last knot red, others white
                if (i === 0) g.fillColor = new Color(60, 220, 90, 255);
                else if (i === n - 1 && !this.closed) g.fillColor = new Color(230, 70, 70, 255);
                else g.fillColor = new Color(255, 255, 255, 255);
                g.circle(c.x, c.y, this.knotRadius);
                g.fill();
            }
        }
    }
}
