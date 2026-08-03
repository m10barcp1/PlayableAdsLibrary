System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Vec3, Color, Enemy, EnemyArchetypes, buildHumanoid, createPrimitiveNode, Palette, _dec, _class, _crd, ccclass, EnemySpawner;

  function _reportPossibleCrUseOfEnemy(extras) {
    _reporterNs.report("Enemy", "./Enemy", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEnemyArchetype(extras) {
    _reporterNs.report("EnemyArchetype", "./Enemy", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEnemyArchetypes(extras) {
    _reporterNs.report("EnemyArchetypes", "./Enemy", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEnemyKind(extras) {
    _reporterNs.report("EnemyKind", "./Enemy", _context.meta, extras);
  }

  function _reportPossibleCrUseOfbuildHumanoid(extras) {
    _reporterNs.report("buildHumanoid", "../core/CharacterBuilder", _context.meta, extras);
  }

  function _reportPossibleCrUseOfcreatePrimitiveNode(extras) {
    _reporterNs.report("createPrimitiveNode", "../core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPalette(extras) {
    _reporterNs.report("Palette", "../core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPlayerStats(extras) {
    _reporterNs.report("PlayerStats", "../player/PlayerStats", _context.meta, extras);
  }

  function _reportPossibleCrUseOfInventory(extras) {
    _reporterNs.report("Inventory", "../inventory/Inventory", _context.meta, extras);
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
      Color = _cc.Color;
    }, function (_unresolved_2) {
      Enemy = _unresolved_2.Enemy;
      EnemyArchetypes = _unresolved_2.EnemyArchetypes;
    }, function (_unresolved_3) {
      buildHumanoid = _unresolved_3.buildHumanoid;
    }, function (_unresolved_4) {
      createPrimitiveNode = _unresolved_4.createPrimitiveNode;
      Palette = _unresolved_4.Palette;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "02676gV8KVJ3of18423Xh9O", "EnemySpawner", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'Color']);

      ({
        ccclass
      } = _decorator); // Spawns enemies evenly distributed in zones around the map

      _export("EnemySpawner", EnemySpawner = (_dec = ccclass('EnemySpawner'), _dec(_class = class EnemySpawner extends Component {
        constructor(...args) {
          super(...args);
          this.worldRoot = null;
          this.player = null;
          this.playerStats = null;
          this.inventory = null;
          this.enemies = [];
          // Zone definitions: position center, radius, allowed kinds, count
          this.zones = [{
            center: new Vec3(-40, 0, -40),
            radius: 18,
            kinds: ['goblin'],
            count: 6
          }, {
            center: new Vec3(40, 0, -40),
            radius: 18,
            kinds: ['wolf'],
            count: 5
          }, {
            center: new Vec3(-40, 0, 40),
            radius: 18,
            kinds: ['skeleton'],
            count: 6
          }, {
            center: new Vec3(40, 0, 40),
            radius: 18,
            kinds: ['orc'],
            count: 4
          }, {
            center: new Vec3(0, 0, -65),
            radius: 12,
            kinds: ['goblin', 'wolf'],
            count: 5
          }, {
            center: new Vec3(0, 0, 65),
            radius: 12,
            kinds: ['skeleton', 'orc'],
            count: 5
          }, {
            center: new Vec3(-65, 0, 0),
            radius: 12,
            kinds: ['wolf', 'goblin'],
            count: 5
          }, {
            center: new Vec3(65, 0, 0),
            radius: 12,
            kinds: ['orc', 'skeleton'],
            count: 4
          }, // Boss spawn (single)
          {
            center: new Vec3(0, 0, -85),
            radius: 4,
            kinds: ['boss'],
            count: 1
          }];
        }

        spawnAll() {
          if (!this.worldRoot || !this.player || !this.playerStats || !this.inventory) return;

          for (const zone of this.zones) {
            for (let i = 0; i < zone.count; i++) {
              const kind = zone.kinds[Math.floor(Math.random() * zone.kinds.length)];
              const ang = Math.random() * Math.PI * 2;
              const r = Math.random() * zone.radius;
              const x = zone.center.x + Math.cos(ang) * r;
              const z = zone.center.z + Math.sin(ang) * r;
              this.spawn(kind, new Vec3(x, 0, z));
            }
          }
        }

        spawn(kind, pos) {
          var _node$getChildByName, _node$getChildByName2, _node$getChildByName3, _node$getChildByName4, _node$getChildByName5;

          const arch = (_crd && EnemyArchetypes === void 0 ? (_reportPossibleCrUseOfEnemyArchetypes({
            error: Error()
          }), EnemyArchetypes) : EnemyArchetypes)[kind];
          if (!arch) return null;
          const node = this.buildVisual(kind, arch);
          node.setPosition(pos);
          this.worldRoot.addChild(node);
          const en = node.addComponent(_crd && Enemy === void 0 ? (_reportPossibleCrUseOfEnemy({
            error: Error()
          }), Enemy) : Enemy);
          en.init(arch, this.player, this.playerStats, this.inventory); // Find body parts for animation

          const lArm = (_node$getChildByName = node.getChildByName('LeftArm')) != null ? _node$getChildByName : undefined;
          const rArm = (_node$getChildByName2 = node.getChildByName('RightArm')) != null ? _node$getChildByName2 : undefined;
          const lLeg = (_node$getChildByName3 = node.getChildByName('LeftLeg')) != null ? _node$getChildByName3 : undefined;
          const rLeg = (_node$getChildByName4 = node.getChildByName('RightLeg')) != null ? _node$getChildByName4 : undefined;
          const body = (_node$getChildByName5 = node.getChildByName('Body')) != null ? _node$getChildByName5 : undefined;
          if (lArm && rArm) en.setBodyRefs({
            l: lArm,
            r: rArm,
            lLeg,
            rLeg,
            body
          });
          this.enemies.push(en);
          return en;
        }

        buildVisual(kind, arch) {
          if (kind === 'wolf') {
            // Quadruped: low body + 4 legs + head
            const root = new Node('Wolf');
            const body = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('Body', 'box', new Vec3(1.4, 0.5, 0.6), arch.color);
            body.setPosition(0, 0.7, 0);
            root.addChild(body);
            const head = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('Head', 'box', new Vec3(0.5, 0.5, 0.5), arch.color);
            head.setPosition(0.7, 0.9, 0);
            root.addChild(head);
            const tail = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('Tail', 'box', new Vec3(0.5, 0.15, 0.15), arch.color);
            tail.setPosition(-0.8, 0.8, 0);
            root.addChild(tail); // legs

            const lA = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('LeftArm', 'box', new Vec3(0.18, 0.5, 0.18), arch.color);
            lA.setPosition(0.5, 0.25, 0.25);
            root.addChild(lA);
            const rA = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('RightArm', 'box', new Vec3(0.18, 0.5, 0.18), arch.color);
            rA.setPosition(0.5, 0.25, -0.25);
            root.addChild(rA);
            const lL = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('LeftLeg', 'box', new Vec3(0.18, 0.5, 0.18), arch.color);
            lL.setPosition(-0.5, 0.25, 0.25);
            root.addChild(lL);
            const rL = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('RightLeg', 'box', new Vec3(0.18, 0.5, 0.18), arch.color);
            rL.setPosition(-0.5, 0.25, -0.25);
            root.addChild(rL);
            return root;
          } // Humanoid variants


          let colors = {};
          let scale = arch.scale;
          if (kind === 'goblin') colors = {
            skin: arch.color,
            shirt: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
              error: Error()
            }), Palette) : Palette).leather,
            pants: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
              error: Error()
            }), Palette) : Palette).woodDark,
            hair: new Color(40, 30, 20)
          };else if (kind === 'skeleton') colors = {
            skin: arch.color,
            shirt: new Color(80, 80, 90),
            pants: new Color(80, 80, 90),
            hair: new Color(200, 200, 200)
          };else if (kind === 'orc') colors = {
            skin: arch.color,
            shirt: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
              error: Error()
            }), Palette) : Palette).leather,
            pants: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
              error: Error()
            }), Palette) : Palette).woodDark,
            hair: new Color(30, 25, 15)
          };else if (kind === 'boss') colors = {
            skin: arch.color,
            shirt: new Color(40, 35, 50),
            pants: new Color(30, 25, 40),
            hair: new Color(160, 30, 30)
          };
          const parts = (_crd && buildHumanoid === void 0 ? (_reportPossibleCrUseOfbuildHumanoid({
            error: Error()
          }), buildHumanoid) : buildHumanoid)(arch.name, colors, scale); // Weapon visual

          if (kind === 'orc' || kind === 'skeleton' || kind === 'boss') {
            const sword = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('Weapon', 'box', new Vec3(0.12, 1.2, 0.12), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
              error: Error()
            }), Palette) : Palette).iron);
            sword.setPosition(0, -0.6, 0);
            parts.weaponSlot.addChild(sword);
          }

          if (kind === 'boss') {
            // crown
            const crown = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
              error: Error()
            }), createPrimitiveNode) : createPrimitiveNode)('Crown', 'cylinder', new Vec3(0.7, 0.2, 0.7), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
              error: Error()
            }), Palette) : Palette).gold);
            crown.setPosition(0, 2.45 * scale, 0);
            parts.root.addChild(crown);
          }

          return parts.root;
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=3792aa8dd810f31ad3a2656c083352c39dd433af.js.map