System.register(["__unresolved_0", "cc", "cc/env", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, EDITOR, buildWorld, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _class3, _crd, ccclass, property, executeInEditMode, menu, WorldBuilderBaker;

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _reportPossibleCrUseOfbuildWorld(extras) {
    _reporterNs.report("buildWorld", "./WorldBuilder", _context.meta, extras);
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
    }, function (_ccEnv) {
      EDITOR = _ccEnv.EDITOR;
    }, function (_unresolved_2) {
      buildWorld = _unresolved_2.buildWorld;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "13593p2qCZJKp3uinxAloC+", "WorldBuilderBaker", undefined);

      __checkObsolete__(['_decorator', 'CCBoolean', 'Component', 'Node']);

      ({
        ccclass,
        property,
        executeInEditMode,
        menu
      } = _decorator);
      /**
       * Editor-only utility component.
       *
       * Attach this component to ANY node in the scene (e.g. the scene root or a dedicated
       * "WorldBaker" node), then use the inspector toggles to:
       *   - "Bake Now"    → Generates the procedural world and parents it under this node.
       *                     Save the scene afterwards to persist all generated nodes.
       *   - "Clear Now"   → Removes the previously baked World subtree.
       *
       * After baking and saving, the world lives inside the .scene file as plain nodes,
       * so it no longer needs to be generated at runtime in GameBootstrap.
       */

      _export("WorldBuilderBaker", WorldBuilderBaker = (_dec = ccclass('WorldBuilderBaker'), _dec2 = executeInEditMode(true), _dec3 = menu('RPG/World Builder Baker'), _dec4 = property({
        tooltip: 'Toggle ON to bake the world into the scene. It will auto-reset to OFF.'
      }), _dec5 = property({
        tooltip: 'Toggle ON to remove the baked world. It will auto-reset to OFF.'
      }), _dec(_class = _dec2(_class = _dec3(_class = (_class2 = (_class3 = class WorldBuilderBaker extends Component {
        get bakeNow() {
          return false;
        }

        set bakeNow(v) {
          if (v && EDITOR) this.bake();
        }

        get clearNow() {
          return false;
        }

        set clearNow(v) {
          if (v && EDITOR) this.clearBaked();
        }
        /** Name of the baked root node. Must match what GameBootstrap looks up. */


        bake() {
          this.clearBaked();
          const world = (_crd && buildWorld === void 0 ? (_reportPossibleCrUseOfbuildWorld({
            error: Error()
          }), buildWorld) : buildWorld)(); // Ensure it has the expected name so GameBootstrap can find it.

          world.name = WorldBuilderBaker.BAKED_ROOT_NAME;
          this.node.addChild(world);
          console.log('[WorldBuilderBaker] World baked. Save the scene to persist.');
        }

        clearBaked() {
          const existing = this.node.getChildByName(WorldBuilderBaker.BAKED_ROOT_NAME);

          if (existing) {
            existing.removeFromParent();
            existing.destroy();
            console.log('[WorldBuilderBaker] Cleared baked World.');
          }
        }

      }, _class3.BAKED_ROOT_NAME = 'World', _class3), (_applyDecoratedDescriptor(_class2.prototype, "bakeNow", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "bakeNow"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearNow", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "clearNow"), _class2.prototype)), _class2)) || _class) || _class) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=b4867e227cce3007ae2dc026eeadabbb3586571e.js.map