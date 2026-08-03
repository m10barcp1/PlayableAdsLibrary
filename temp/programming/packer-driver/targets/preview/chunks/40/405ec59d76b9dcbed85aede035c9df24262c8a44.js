System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Vec3, input, Input, KeyCode, Quat, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _crd, ccclass, property, MoveState, PlayerController;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfPlayerStats(extras) {
    _reporterNs.report("PlayerStats", "./PlayerStats", _context.meta, extras);
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
      Vec3 = _cc.Vec3;
      input = _cc.input;
      Input = _cc.Input;
      KeyCode = _cc.KeyCode;
      Quat = _cc.Quat;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "817f92ngp9EIL3euRs2KWBv", "PlayerController", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'input', 'Input', 'EventKeyboard', 'KeyCode', 'Quat', 'Camera', 'geometry', 'PhysicsSystem', 'math']);

      ({
        ccclass,
        property
      } = _decorator);

      MoveState = /*#__PURE__*/function (MoveState) {
        MoveState[MoveState["Idle"] = 0] = "Idle";
        MoveState[MoveState["Run"] = 1] = "Run";
        MoveState[MoveState["Jump"] = 2] = "Jump";
        MoveState[MoveState["DoubleJump"] = 3] = "DoubleJump";
        MoveState[MoveState["Slide"] = 4] = "Slide";
        MoveState[MoveState["Attack"] = 5] = "Attack";
        return MoveState;
      }(MoveState || {});

      _export("PlayerController", PlayerController = (_dec = ccclass('PlayerController'), _dec(_class = (_class2 = class PlayerController extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "moveSpeed", _descriptor, this);

          _initializerDefineProperty(this, "runSpeed", _descriptor2, this);

          _initializerDefineProperty(this, "jumpSpeed", _descriptor3, this);

          _initializerDefineProperty(this, "gravity", _descriptor4, this);

          _initializerDefineProperty(this, "slideSpeed", _descriptor5, this);

          _initializerDefineProperty(this, "slideDuration", _descriptor6, this);

          this.stats = null;
          this.cameraNode = null;
          this.velocity = new Vec3();
          this.moveInput = new Vec3();
          this.keys = new Set();
          this.grounded = true;
          this.jumpsUsed = 0;
          this.maxJumps = 2;
          this.sliding = false;
          this.slideTimer = 0;
          this.slideDir = new Vec3();
          this.state = MoveState.Idle;
          this.facingYaw = 0;
          // animation refs (set externally)
          this.legs = void 0;
          this.arms = void 0;
          this.body = void 0;
          this.animTime = 0;
        }

        onLoad() {
          input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        }

        onDestroy() {
          input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
          input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        }

        onKeyDown(e) {
          this.keys.add(e.keyCode);
          if (e.keyCode === KeyCode.SPACE) this.tryJump();
          if (e.keyCode === KeyCode.SHIFT_LEFT || e.keyCode === KeyCode.KEY_C) this.trySlide();
        }

        onKeyUp(e) {
          this.keys.delete(e.keyCode);
        }

        tryJump() {
          if (this.sliding) return;

          if (this.jumpsUsed < this.maxJumps) {
            this.velocity.y = this.jumpSpeed;
            this.jumpsUsed++;
            this.grounded = false;
            this.state = this.jumpsUsed === 2 ? MoveState.DoubleJump : MoveState.Jump;
          }
        }

        trySlide() {
          if (this.sliding || !this.grounded) return;
          if (!this.stats || !this.stats.useStamina(20)) return;
          this.sliding = true;
          this.slideTimer = this.slideDuration; // slide in current move dir, or forward

          var dir = this.moveInput.lengthSqr() > 0.01 ? this.moveInput.clone().normalize() : this.getForward();
          this.slideDir.set(dir);
          this.state = MoveState.Slide;
        }

        getForward() {
          var yaw = this.facingYaw * Math.PI / 180;
          return new Vec3(Math.sin(yaw), 0, Math.cos(yaw));
        }

        computeMoveInput() {
          var x = 0,
              z = 0;
          if (this.keys.has(KeyCode.KEY_W)) z += 1;
          if (this.keys.has(KeyCode.KEY_S)) z -= 1;
          if (this.keys.has(KeyCode.KEY_A)) x -= 1;
          if (this.keys.has(KeyCode.KEY_D)) x += 1; // Map to camera-relative direction (camera looks down -Z generally)

          var camYaw = 0;

          if (this.cameraNode) {
            var e = new Vec3();
            Quat.toEuler(e, this.cameraNode.worldRotation);
            camYaw = e.y;
          }

          var rad = camYaw * Math.PI / 180;
          var fwdX = Math.sin(rad),
              fwdZ = Math.cos(rad);
          var rgtX = Math.cos(rad),
              rgtZ = -Math.sin(rad);
          this.moveInput.set(fwdX * z + rgtX * x, 0, fwdZ * z + rgtZ * x);
          if (this.moveInput.lengthSqr() > 1) this.moveInput.normalize();
        }

        update(dt) {
          if (!this.stats) return;
          this.stats.update(dt);
          this.computeMoveInput();
          var running = this.keys.has(KeyCode.SHIFT_RIGHT);
          var speed = running ? this.runSpeed : this.moveSpeed;

          if (this.sliding) {
            this.slideTimer -= dt;
            var t = this.slideTimer / this.slideDuration; // 1 -> 0

            var cur = this.slideSpeed * Math.max(0.2, t);
            this.velocity.x = this.slideDir.x * cur;
            this.velocity.z = this.slideDir.z * cur;

            if (this.slideTimer <= 0) {
              this.sliding = false;
              this.state = MoveState.Idle;
            }
          } else {
            this.velocity.x = this.moveInput.x * speed;
            this.velocity.z = this.moveInput.z * speed;
          } // Gravity


          this.velocity.y += this.gravity * dt; // Move

          var pos = this.node.position;
          var nx = pos.x + this.velocity.x * dt;
          var ny = pos.y + this.velocity.y * dt;
          var nz = pos.z + this.velocity.z * dt; // Simple ground at y=0

          var groundY = 0;

          if (ny <= groundY) {
            this.node.setPosition(nx, groundY, nz);
            this.velocity.y = 0;

            if (!this.grounded) {
              this.grounded = true;
              this.jumpsUsed = 0;
            }
          } else {
            this.node.setPosition(nx, ny, nz);
            this.grounded = false;
          } // Face movement direction


          if (this.moveInput.lengthSqr() > 0.01 && !this.sliding) {
            this.facingYaw = Math.atan2(this.moveInput.x, this.moveInput.z) * 180 / Math.PI;
            var q = new Quat();
            Quat.fromEuler(q, 0, this.facingYaw, 0);
            this.node.setRotation(q);
          } // Update state


          if (!this.sliding && this.grounded) {
            this.state = this.moveInput.lengthSqr() > 0.01 ? MoveState.Run : MoveState.Idle;
          } // Bound to a soft world radius


          var p = this.node.position;
          var r = 95;
          var len = Math.hypot(p.x, p.z);

          if (len > r) {
            var k = r / len;
            this.node.setPosition(p.x * k, p.y, p.z * k);
          }

          this.animate(dt);
        }

        animate(dt) {
          this.animTime += dt;

          if (this.sliding && this.body) {
            this.body.setRotationFromEuler(-60, 0, 0);
            return;
          }

          if (this.body) this.body.setRotationFromEuler(0, 0, 0);
          var moving = this.state === MoveState.Run;
          var swing = moving ? Math.sin(this.animTime * 12) * 35 : 0;

          if (this.legs) {
            this.legs.l.setRotationFromEuler(swing, 0, 0);
            this.legs.r.setRotationFromEuler(-swing, 0, 0);
          }

          if (this.arms) {
            this.arms.l.setRotationFromEuler(-swing, 0, 0);
            this.arms.r.setRotationFromEuler(swing, 0, 0);
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "moveSpeed", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 6;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "runSpeed", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 9;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "jumpSpeed", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 9;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "gravity", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return -22;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "slideSpeed", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 12;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "slideDuration", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 0.6;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=405ec59d76b9dcbed85aede035c9df24262c8a44.js.map