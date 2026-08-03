System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, input, Input, instantiate, KeyCode, Prefab, _dec, _dec2, _class, _class2, _descriptor, _crd, ccclass, property, ChangeFx;

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
      input = _cc.input;
      Input = _cc.Input;
      instantiate = _cc.instantiate;
      KeyCode = _cc.KeyCode;
      Prefab = _cc.Prefab;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "b25f48YGM9BgpWSs4gFCxRo", "ChangeFx.ts", undefined);

      __checkObsolete__(['_decorator', 'Component', 'EventKeyboard', 'input', 'Input', 'instantiate', 'KeyCode', 'Node', 'ParticleSystem', 'Prefab']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("ChangeFx", ChangeFx = (_dec = ccclass('ChangeFx'), _dec2 = property({
        type: Prefab
      }), _dec(_class = (_class2 = class ChangeFx extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "effects", _descriptor, this);

          this._index = 0;
          this._currentEffect = null;
        }

        onLoad() {
          this._currentEffect = instantiate(this.effects[this._index]);
          this.node.addChild(this._currentEffect);
          input.on(Input.EventType.KEY_DOWN, this.onKeyUp, this);
        }

        onDestroy() {
          input.off(Input.EventType.KEY_DOWN, this.onKeyUp, this);
        }

        start() {}

        onPlayClick() {
          if (this._currentEffect) {
            this._currentEffect.removeFromParent();
          }

          this._currentEffect = instantiate(this.effects[this._index]);
          this.node.addChild(this._currentEffect);
        }

        onPrevClick() {
          this._index--;

          if (this._index <= 0) {
            this._index = this.effects.length - 1;
          }

          if (this._currentEffect) {
            this._currentEffect.removeFromParent();
          }

          this._currentEffect = instantiate(this.effects[this._index]);
          this.node.addChild(this._currentEffect);
        }

        onNextClick() {
          this._index++;

          if (this._index >= this.effects.length) {
            this._index = 0;
          }

          if (this._currentEffect) {
            this._currentEffect.removeFromParent();
          }

          this._currentEffect = instantiate(this.effects[this._index]);
          this.node.addChild(this._currentEffect);
        }

        onKeyUp(event) {
          switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
              this.onPrevClick();
              break;

            case KeyCode.ARROW_RIGHT:
              this.onNextClick();
              break;

            case KeyCode.SPACE:
              this.onPlayClick();
              break;

            case KeyCode.ARROW_UP:
              this.onPrevClick();
              break;

            case KeyCode.ARROW_DOWN:
              this.onNextClick();
              break;

            default:
              break;
          }
        }

        update(deltaTime) {}

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "effects", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return [];
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=a55d0a1dfcb3cf94fd2e865abc2c0927089801e2.js.map