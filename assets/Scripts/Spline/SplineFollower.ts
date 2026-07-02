import { _decorator, Component, Node, Vec3, Mat4, Quat, Enum, CCFloat, CCBoolean } from 'cc';
import { RoadSpline } from './RoadSpline';

const { ccclass, property, menu } = _decorator;

/** How travel speed is specified. */
export enum FollowSpeedMode {
    /** Constant world units per second. */
    Speed = 0,
    /** Cover the whole path in a fixed number of seconds. */
    Duration = 1,
}

/** What happens when the follower reaches the end. */
export enum FollowLoopMode {
    /** Stop at the end and fire onArrived. */
    Once = 0,
    /** Jump back to the start and keep going. */
    Loop = 1,
    /** Reverse direction at each end. */
    PingPong = 2,
}

const _world = new Vec3();
const _localPos = new Vec3();
const _localTan = new Vec3();
const _worldTan = new Vec3();
const _mat = new Mat4();
const _rot = new Quat();

/**
 * SplineFollower — moves a node along a RoadSpline at constant speed, optionally
 * rotating it to face the direction of travel. This is the runtime gameplay
 * consumer of the path (e.g. the bus driving along the road).
 */
@ccclass('SplineFollower')
@menu('Spline/SplineFollower')
export class SplineFollower extends Component {

    @property({ type: RoadSpline, tooltip: 'Đường spline cần bám theo.' })
    spline: RoadSpline = null!;

    @property({ type: Node, tooltip: 'Node sẽ di chuyển. Bỏ trống = di chuyển chính node gắn component này.' })
    target: Node = null!;

    @property({ type: Enum(FollowSpeedMode) })
    speedMode: FollowSpeedMode = FollowSpeedMode.Speed;

    @property({ type: CCFloat, visible(this: SplineFollower) { return this.speedMode === FollowSpeedMode.Speed; }, tooltip: 'Tốc độ (đơn vị/giây).' })
    speed = 400;

    @property({ type: CCFloat, visible(this: SplineFollower) { return this.speedMode === FollowSpeedMode.Duration; }, tooltip: 'Số giây để chạy hết đường.' })
    duration = 5;

    @property({ type: Enum(FollowLoopMode) })
    loopMode: FollowLoopMode = FollowLoopMode.Once;

    @property({ type: CCBoolean, tooltip: 'Tự xoay node theo hướng đường đi (2D: xoay quanh trục Z).' })
    faceTangent = true;

    @property({ type: CCFloat, visible(this: SplineFollower) { return this.faceTangent; }, tooltip: 'Bù góc (độ) nếu sprite không hướng sang phải mặc định. Ví dụ sprite hướng lên = -90.' })
    faceOffset = 0;

    @property({ type: CCFloat, tooltip: 'Khoảng cách bắt đầu dọc theo đường (đơn vị).' })
    startDistance = 0;

    @property({ type: CCBoolean, tooltip: 'Tự chạy khi scene bắt đầu.' })
    playOnStart = true;

    /** Optional callback invoked once when reaching the end in Once mode. */
    onArrived: (() => void) | null = null;

    private _dist = 0;
    private _dir = 1;
    private _playing = false;

    /** Distance travelled along the path (world units). */
    get distance(): number { return this._dist; }

    /** Normalised progress 0..1 along the path. */
    get progress(): number {
        const len = this.spline ? this.spline.length : 0;
        return len > 0 ? this._dist / len : 0;
    }

    get isPlaying(): boolean { return this._playing; }

    start() {
        if (!this.target) this.target = this.node;
        if (!this.spline) {
            console.warn('[SplineFollower] chưa gán RoadSpline.');
            return;
        }
        this._dist = this.startDistance;
        this._apply();
        if (this.playOnStart) this.play();
    }

    // ---- Controls -----------------------------------------------------------

    /** Start / resume movement. */
    play(): void { this._playing = true; }

    /** Pause in place. */
    pause(): void { this._playing = false; }

    /** Stop and reset to the start of the path. */
    stop(): void {
        this._playing = false;
        this._dist = 0;
        this._dir = 1;
        this._apply();
    }

    /** Jump to a normalised position (0..1) along the path. */
    setProgress(p: number): void {
        const len = this.spline ? this.spline.length : 0;
        this._dist = Math.max(0, Math.min(1, p)) * len;
        this._apply();
    }

    // ---- Loop ---------------------------------------------------------------

    update(dt: number) {
        if (!this._playing || !this.spline) return;
        const len = this.spline.length;
        if (len <= 0) return;

        const v = this.speedMode === FollowSpeedMode.Speed
            ? this.speed
            : (this.duration > 1e-4 ? len / this.duration : 0);

        this._dist += v * dt * this._dir;

        switch (this.loopMode) {
            case FollowLoopMode.Once:
                if (this._dist >= len) {
                    this._dist = len;
                    this._playing = false;
                    this._apply();
                    this.onArrived?.();
                    this.node.emit('spline-arrived', this);
                    return;
                }
                if (this._dist < 0) this._dist = 0;
                break;

            case FollowLoopMode.Loop:
                if (this._dist >= len) this._dist -= len;
                else if (this._dist < 0) this._dist += len;
                break;

            case FollowLoopMode.PingPong:
                if (this._dist > len) { this._dist = len - (this._dist - len); this._dir = -1; }
                else if (this._dist < 0) { this._dist = -this._dist; this._dir = 1; }
                break;
        }

        this._apply();
    }

    /** Sample the spline at the current distance and write position + facing to the target. */
    private _apply(): void {
        const spline = this.spline;
        const target = this.target;
        if (!spline || !target) return;

        // RoadSpline evaluates in its own local space -> convert to world.
        spline.getPointAtDistance(this._dist, _localPos);
        Mat4.copy(_mat, spline.node.worldMatrix);
        Vec3.transformMat4(_world, _localPos, _mat);
        target.setWorldPosition(_world);

        if (this.faceTangent) {
            spline.getTangentAtDistance(this._dist, _localTan);
            // rotate the local tangent into world space (ignore scale, assume top-down 2D)
            Quat.copy(_rot, spline.node.worldRotation);
            Vec3.transformQuat(_worldTan, _localTan, _rot);
            if (this._dir < 0) Vec3.negate(_worldTan, _worldTan);
            const angle = Math.atan2(_worldTan.y, _worldTan.x) * 180 / Math.PI + this.faceOffset;
            target.setRotationFromEuler(0, 0, angle);
        }
    }
}
