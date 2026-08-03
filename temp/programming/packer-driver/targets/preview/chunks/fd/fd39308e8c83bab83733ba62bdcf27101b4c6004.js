System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Vec3, Quat, input, Input, KeyCode, _dec, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _crd, ccclass, property, CameraFollow;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Vec3 = _cc.Vec3;
      Quat = _cc.Quat;
      input = _cc.input;
      Input = _cc.Input;
      KeyCode = _cc.KeyCode;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "018ab4AVytH7bUl6vyf7SpR", "CameraFollow", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'Quat', 'input', 'Input', 'EventMouse', 'EventKeyboard', 'KeyCode']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("CameraFollow", CameraFollow = (_dec = ccclass('CameraFollow'), _dec(_class = (_class2 = class CameraFollow extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "target", _descriptor, this);

          _initializerDefineProperty(this, "distance", _descriptor2, this);

          _initializerDefineProperty(this, "height", _descriptor3, this);

          _initializerDefineProperty(this, "yaw", _descriptor4, this);

          // degrees
          _initializerDefineProperty(this, "pitch", _descriptor5, this);

          // degrees
          _initializerDefineProperty(this, "mouseSensitivity", _descriptor6, this);

          _initializerDefineProperty(this, "smoothness", _descriptor7, this);

          this.dragging = false;
          this.lastX = 0;
          this.lastY = 0;
        }

        onLoad() {
          input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
          input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
          input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
          input.on(Input.EventType.MOUSE_WHEEL, this.onWheel, this);
          input.on(Input.EventType.KEY_DOWN, this.onKey, this);
        }

        onDestroy() {
          input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
          input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
          input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
          input.off(Input.EventType.MOUSE_WHEEL, this.onWheel, this);
          input.off(Input.EventType.KEY_DOWN, this.onKey, this);
        }

        onMouseDown(e) {
          this.dragging = true;
          this.lastX = e.getLocationX();
          this.lastY = e.getLocationY();
        }

        onMouseUp() {
          this.dragging = false;
        }

        onMouseMove(e) {
          var x = e.getLocationX(),
              y = e.getLocationY();

          if (this.dragging) {
            var dx = x - this.lastX,
                dy = y - this.lastY;
            this.yaw -= dx * this.mouseSensitivity;
            this.pitch = Math.max(5, Math.min(70, this.pitch - dy * this.mouseSensitivity));
          }

          this.lastX = x;
          this.lastY = y;
        }

        onWheel(e) {
          var sy = e.getScrollY ? e.getScrollY() : 0;
          this.distance = Math.max(4, Math.min(20, this.distance - sy * 0.01));
        }

        onKey(e) {
          if (e.keyCode === KeyCode.ARROW_LEFT) this.yaw += 5;
          if (e.keyCode === KeyCode.ARROW_RIGHT) this.yaw -= 5;
          if (e.keyCode === KeyCode.ARROW_UP) this.pitch = Math.min(70, this.pitch + 3);
          if (e.keyCode === KeyCode.ARROW_DOWN) this.pitch = Math.max(5, this.pitch - 3);
        }

        lateUpdate(dt) {
          if (!this.target) return;
          var tp = this.target.worldPosition;
          var yawRad = this.yaw * Math.PI / 180;
          var pitchRad = this.pitch * Math.PI / 180;
          var d = this.distance;
          var offsetX = -Math.sin(yawRad) * Math.cos(pitchRad) * d;
          var offsetZ = -Math.cos(yawRad) * Math.cos(pitchRad) * d;
          var offsetY = Math.sin(pitchRad) * d + this.height * 0.3;
          var desired = new Vec3(tp.x + offsetX, tp.y + offsetY, tp.z + offsetZ);
          var cur = this.node.worldPosition;
          var t = Math.min(1, dt * this.smoothness);
          var np = new Vec3(cur.x + (desired.x - cur.x) * t, cur.y + (desired.y - cur.y) * t, cur.z + (desired.z - cur.z) * t);
          this.node.setWorldPosition(np); // Look at target

          var q = new Quat();
          Quat.fromEuler(q, -this.pitch, this.yaw, 0);
          this.node.setWorldRotation(q);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "target", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "distance", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 10;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "height", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 6;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "yaw", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 0;
        }
      }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "pitch", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 25;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "mouseSensitivity", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 0.3;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "smoothness", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 8;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=fd39308e8c83bab83733ba62bdcf27101b4c6004.js.map