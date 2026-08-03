System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Vec3, Color, input, Input, KeyCode, EventBus, GameEvents, createPrimitiveNode, Palette, buildHumanoid, _dec, _class, _crd, ccclass, NPCDefs, NPC;

  function buildNpcNode(def) {
    var parts = (_crd && buildHumanoid === void 0 ? (_reportPossibleCrUseOfbuildHumanoid({
      error: Error()
    }), buildHumanoid) : buildHumanoid)(def.name, {
      skin: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).skin,
      shirt: def.color,
      pants: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).woodDark,
      hair: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).hair
    });
    parts.root.setPosition(def.pos); // Interaction marker (yellow exclamation cube)

    var marker = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Marker', 'box', new Vec3(0.25, 0.6, 0.25), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).questYellow);
    marker.setPosition(0, 2.9, 0);
    marker.active = false;
    parts.root.addChild(marker);
    return {
      root: parts.root,
      marker
    };
  }

  function _reportPossibleCrUseOfEventBus(extras) {
    _reporterNs.report("EventBus", "../core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameEvents(extras) {
    _reporterNs.report("GameEvents", "../core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfcreatePrimitiveNode(extras) {
    _reporterNs.report("createPrimitiveNode", "../core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPalette(extras) {
    _reporterNs.report("Palette", "../core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfbuildHumanoid(extras) {
    _reporterNs.report("buildHumanoid", "../core/CharacterBuilder", _context.meta, extras);
  }

  _export("buildNpcNode", buildNpcNode);

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
      Color = _cc.Color;
      input = _cc.input;
      Input = _cc.Input;
      KeyCode = _cc.KeyCode;
    }, function (_unresolved_2) {
      EventBus = _unresolved_2.EventBus;
      GameEvents = _unresolved_2.GameEvents;
    }, function (_unresolved_3) {
      createPrimitiveNode = _unresolved_3.createPrimitiveNode;
      Palette = _unresolved_3.Palette;
    }, function (_unresolved_4) {
      buildHumanoid = _unresolved_4.buildHumanoid;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "bb13dbS2wdN5KihWFPxMNVL", "NPC", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'Color', 'input', 'Input', 'EventKeyboard', 'KeyCode']);

      ({
        ccclass
      } = _decorator);

      _export("NPCDefs", NPCDefs = [{
        id: 'elder',
        name: 'Village Elder',
        role: 'Elder',
        pos: new Vec3(0, 0, 5),
        color: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
          error: Error()
        }), Palette) : Palette).cloth,
        greet: 'Brave traveler! Our village is in peril.'
      }, {
        id: 'hunter',
        name: 'Hunter Bram',
        role: 'Hunter',
        pos: new Vec3(-6, 0, 2),
        color: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
          error: Error()
        }), Palette) : Palette).leather,
        greet: 'Wolves prowl these woods, friend.'
      }, {
        id: 'priest',
        name: 'Father Ode',
        role: 'Priest',
        pos: new Vec3(6, 0, 2),
        color: new Color(230, 230, 230),
        greet: 'May the light guide your blade.'
      }, {
        id: 'blacksmith',
        name: 'Smith Roderic',
        role: 'Blacksmith',
        pos: new Vec3(-4, 0, 8),
        color: new Color(120, 90, 60),
        greet: 'Need a stronger weapon? Bring me tusks.'
      }, {
        id: 'merchant',
        name: 'Merchant Liva',
        role: 'Merchant',
        pos: new Vec3(4, 0, 8),
        color: new Color(150, 90, 140),
        greet: 'Goods for the bold! Trade me trophies.'
      }]);

      _export("NPC", NPC = (_dec = ccclass('NPC'), _dec(_class = class NPC extends Component {
        constructor() {
          super(...arguments);
          this.def = void 0;
          this.player = null;
          this.interactRadius = 3.0;
          this.marker = null;
          this.canInteract = false;
        }

        onLoad() {
          input.on(Input.EventType.KEY_DOWN, this.onKey, this);
        }

        onDestroy() {
          input.off(Input.EventType.KEY_DOWN, this.onKey, this);
        }

        init(def, player) {
          this.def = def;
          this.player = player;
        }

        onKey(e) {
          if (!this.canInteract) return;

          if (e.keyCode === KeyCode.KEY_E || e.keyCode === KeyCode.KEY_T) {
            (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
              error: Error()
            }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
              error: Error()
            }), GameEvents) : GameEvents).NPC_INTERACTED, this.def.id);
          }
        }

        update(dt) {
          if (!this.player) return;
          var a = this.node.worldPosition,
              b = this.player.worldPosition;
          var d = Math.hypot(a.x - b.x, a.z - b.z);
          var inRange = d <= this.interactRadius;

          if (inRange !== this.canInteract) {
            this.canInteract = inRange;
            if (this.marker) this.marker.active = inRange;
          } // Spin marker


          if (this.marker && this.marker.active) {
            this.marker.setRotationFromEuler(0, Date.now() / 5 % 360, 0);
          }
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=79e3639c2a43c38896b999a7e8298888207e9f1e.js.map