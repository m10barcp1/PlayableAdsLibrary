System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Vec3, Mat4, Quat, Enum, CCFloat, CCBoolean, RoadSpline, _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _crd, ccclass, property, menu, FollowSpeedMode, FollowLoopMode, _world, _localPos, _localTan, _worldTan, _mat, _rot, SplineFollower;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfRoadSpline(extras) {
    _reporterNs.report("RoadSpline", "./RoadSpline", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Node = _cc.Node;
      Vec3 = _cc.Vec3;
      Mat4 = _cc.Mat4;
      Quat = _cc.Quat;
      Enum = _cc.Enum;
      CCFloat = _cc.CCFloat;
      CCBoolean = _cc.CCBoolean;
    }, function (_unresolved_2) {
      RoadSpline = _unresolved_2.RoadSpline;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "1a645xYjUhIDphEWBdzKpZk", "SplineFollower", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'Mat4', 'Quat', 'Enum', 'CCFloat', 'CCBoolean']);

      ({
        ccclass,
        property,
        menu
      } = _decorator);
      /** How travel speed is specified. */

      _export("FollowSpeedMode", FollowSpeedMode = /*#__PURE__*/function (FollowSpeedMode) {
        FollowSpeedMode[FollowSpeedMode["Speed"] = 0] = "Speed";
        FollowSpeedMode[FollowSpeedMode["Duration"] = 1] = "Duration";
        return FollowSpeedMode;
      }({}));
      /** What happens when the follower reaches the end. */


      _export("FollowLoopMode", FollowLoopMode = /*#__PURE__*/function (FollowLoopMode) {
        FollowLoopMode[FollowLoopMode["Once"] = 0] = "Once";
        FollowLoopMode[FollowLoopMode["Loop"] = 1] = "Loop";
        FollowLoopMode[FollowLoopMode["PingPong"] = 2] = "PingPong";
        return FollowLoopMode;
      }({}));

      _world = new Vec3();
      _localPos = new Vec3();
      _localTan = new Vec3();
      _worldTan = new Vec3();
      _mat = new Mat4();
      _rot = new Quat();
      /**
       * SplineFollower — moves a node along a RoadSpline at constant speed, optionally
       * rotating it to face the direction of travel. This is the runtime gameplay
       * consumer of the path (e.g. the bus driving along the road).
       */

      _export("SplineFollower", SplineFollower = (_dec = ccclass('SplineFollower'), _dec2 = menu('Spline/SplineFollower'), _dec3 = property({
        type: _crd && RoadSpline === void 0 ? (_reportPossibleCrUseOfRoadSpline({
          error: Error()
        }), RoadSpline) : RoadSpline,
        tooltip: 'Đường spline cần bám theo.'
      }), _dec4 = property({
        type: Node,
        tooltip: 'Node sẽ di chuyển. Bỏ trống = di chuyển chính node gắn component này.'
      }), _dec5 = property({
        type: Enum(FollowSpeedMode)
      }), _dec6 = property({
        type: CCFloat,

        visible() {
          return this.speedMode === FollowSpeedMode.Speed;
        },

        tooltip: 'Tốc độ (đơn vị/giây).'
      }), _dec7 = property({
        type: CCFloat,

        visible() {
          return this.speedMode === FollowSpeedMode.Duration;
        },

        tooltip: 'Số giây để chạy hết đường.'
      }), _dec8 = property({
        type: Enum(FollowLoopMode)
      }), _dec9 = property({
        type: CCBoolean,
        tooltip: 'Tự xoay node theo hướng đường đi (2D: xoay quanh trục Z).'
      }), _dec10 = property({
        type: CCFloat,

        visible() {
          return this.faceTangent;
        },

        tooltip: 'Bù góc (độ) nếu sprite không hướng sang phải mặc định. Ví dụ sprite hướng lên = -90.'
      }), _dec11 = property({
        type: CCFloat,
        tooltip: 'Khoảng cách bắt đầu dọc theo đường (đơn vị).'
      }), _dec12 = property({
        type: CCBoolean,
        tooltip: 'Tự chạy khi scene bắt đầu.'
      }), _dec(_class = _dec2(_class = (_class2 = class SplineFollower extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "spline", _descriptor, this);

          _initializerDefineProperty(this, "target", _descriptor2, this);

          _initializerDefineProperty(this, "speedMode", _descriptor3, this);

          _initializerDefineProperty(this, "speed", _descriptor4, this);

          _initializerDefineProperty(this, "duration", _descriptor5, this);

          _initializerDefineProperty(this, "loopMode", _descriptor6, this);

          _initializerDefineProperty(this, "faceTangent", _descriptor7, this);

          _initializerDefineProperty(this, "faceOffset", _descriptor8, this);

          _initializerDefineProperty(this, "startDistance", _descriptor9, this);

          _initializerDefineProperty(this, "playOnStart", _descriptor10, this);

          /** Optional callback invoked once when reaching the end in Once mode. */
          this.onArrived = null;
          this._dist = 0;
          this._dir = 1;
          this._playing = false;
        }

        /** Distance travelled along the path (world units). */
        get distance() {
          return this._dist;
        }
        /** Normalised progress 0..1 along the path. */


        get progress() {
          var len = this.spline ? this.spline.length : 0;
          return len > 0 ? this._dist / len : 0;
        }

        get isPlaying() {
          return this._playing;
        }

        start() {
          if (!this.target) this.target = this.node;

          if (!this.spline) {
            console.warn('[SplineFollower] chưa gán RoadSpline.');
            return;
          }

          this._dist = this.startDistance;

          this._apply();

          if (this.playOnStart) this.play();
        } // ---- Controls -----------------------------------------------------------

        /** Start / resume movement. */


        play() {
          this._playing = true;
        }
        /** Pause in place. */


        pause() {
          this._playing = false;
        }
        /** Stop and reset to the start of the path. */


        stop() {
          this._playing = false;
          this._dist = 0;
          this._dir = 1;

          this._apply();
        }
        /** Jump to a normalised position (0..1) along the path. */


        setProgress(p) {
          var len = this.spline ? this.spline.length : 0;
          this._dist = Math.max(0, Math.min(1, p)) * len;

          this._apply();
        } // ---- Loop ---------------------------------------------------------------


        update(dt) {
          if (!this._playing || !this.spline) return;
          var len = this.spline.length;
          if (len <= 0) return;
          var v = this.speedMode === FollowSpeedMode.Speed ? this.speed : this.duration > 1e-4 ? len / this.duration : 0;
          this._dist += v * dt * this._dir;

          switch (this.loopMode) {
            case FollowLoopMode.Once:
              if (this._dist >= len) {
                var _this$onArrived;

                this._dist = len;
                this._playing = false;

                this._apply();

                (_this$onArrived = this.onArrived) == null || _this$onArrived.call(this);
                this.node.emit('spline-arrived', this);
                return;
              }

              if (this._dist < 0) this._dist = 0;
              break;

            case FollowLoopMode.Loop:
              if (this._dist >= len) this._dist -= len;else if (this._dist < 0) this._dist += len;
              break;

            case FollowLoopMode.PingPong:
              if (this._dist > len) {
                this._dist = len - (this._dist - len);
                this._dir = -1;
              } else if (this._dist < 0) {
                this._dist = -this._dist;
                this._dir = 1;
              }

              break;
          }

          this._apply();
        }
        /** Sample the spline at the current distance and write position + facing to the target. */


        _apply() {
          var spline = this.spline;
          var target = this.target;
          if (!spline || !target) return; // RoadSpline evaluates in its own local space -> convert to world.

          spline.getPointAtDistance(this._dist, _localPos);
          Mat4.copy(_mat, spline.node.worldMatrix);
          Vec3.transformMat4(_world, _localPos, _mat);
          target.setWorldPosition(_world);

          if (this.faceTangent) {
            spline.getTangentAtDistance(this._dist, _localTan); // rotate the local tangent into world space (ignore scale, assume top-down 2D)

            Quat.copy(_rot, spline.node.worldRotation);
            Vec3.transformQuat(_worldTan, _localTan, _rot);
            if (this._dir < 0) Vec3.negate(_worldTan, _worldTan);
            var angle = Math.atan2(_worldTan.y, _worldTan.x) * 180 / Math.PI + this.faceOffset;
            target.setRotationFromEuler(0, 0, angle);
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "spline", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "target", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "speedMode", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return FollowSpeedMode.Speed;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "speed", [_dec6], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 400;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "duration", [_dec7], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 5;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "loopMode", [_dec8], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return FollowLoopMode.Once;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "faceTangent", [_dec9], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return true;
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "faceOffset", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 0;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "startDistance", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 0;
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "playOnStart", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return true;
        }
      })), _class2)) || _class) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=99626526efd70d883443b3cc8f368d736cad3aef.js.map