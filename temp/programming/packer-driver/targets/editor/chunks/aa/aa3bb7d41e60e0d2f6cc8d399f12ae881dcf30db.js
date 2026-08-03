System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3", "__unresolved_4", "__unresolved_5", "__unresolved_6", "__unresolved_7", "__unresolved_8", "__unresolved_9", "__unresolved_10", "__unresolved_11", "__unresolved_12", "__unresolved_13"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Vec3, Color, Camera, input, Input, KeyCode, buildWorld, buildHumanoid, createPrimitiveNode, Palette, clearMaterialCache, PlayerStats, PlayerController, PlayerCombat, Inventory, EnemySpawner, NPC, NPCDefs, buildNpcNode, QuestManager, UIManager, CameraFollow, EventBus, GameEvents, _dec, _class, _crd, ccclass, GameBootstrap;

  function _reportPossibleCrUseOfbuildWorld(extras) {
    _reporterNs.report("buildWorld", "./world/WorldBuilder", _context.meta, extras);
  }

  function _reportPossibleCrUseOfbuildHumanoid(extras) {
    _reporterNs.report("buildHumanoid", "./core/CharacterBuilder", _context.meta, extras);
  }

  function _reportPossibleCrUseOfcreatePrimitiveNode(extras) {
    _reporterNs.report("createPrimitiveNode", "./core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPalette(extras) {
    _reporterNs.report("Palette", "./core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfclearMaterialCache(extras) {
    _reporterNs.report("clearMaterialCache", "./core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPlayerStats(extras) {
    _reporterNs.report("PlayerStats", "./player/PlayerStats", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPlayerController(extras) {
    _reporterNs.report("PlayerController", "./player/PlayerController", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPlayerCombat(extras) {
    _reporterNs.report("PlayerCombat", "./player/PlayerCombat", _context.meta, extras);
  }

  function _reportPossibleCrUseOfInventory(extras) {
    _reporterNs.report("Inventory", "./inventory/Inventory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEnemySpawner(extras) {
    _reporterNs.report("EnemySpawner", "./enemies/EnemySpawner", _context.meta, extras);
  }

  function _reportPossibleCrUseOfNPC(extras) {
    _reporterNs.report("NPC", "./npc/NPC", _context.meta, extras);
  }

  function _reportPossibleCrUseOfNPCDefs(extras) {
    _reporterNs.report("NPCDefs", "./npc/NPC", _context.meta, extras);
  }

  function _reportPossibleCrUseOfbuildNpcNode(extras) {
    _reporterNs.report("buildNpcNode", "./npc/NPC", _context.meta, extras);
  }

  function _reportPossibleCrUseOfQuestManager(extras) {
    _reporterNs.report("QuestManager", "./quest/QuestManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfUIManager(extras) {
    _reporterNs.report("UIManager", "./ui/UIManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfCameraFollow(extras) {
    _reporterNs.report("CameraFollow", "./world/CameraFollow", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEventBus(extras) {
    _reporterNs.report("EventBus", "./core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameEvents(extras) {
    _reporterNs.report("GameEvents", "./core/EventBus", _context.meta, extras);
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
      Camera = _cc.Camera;
      input = _cc.input;
      Input = _cc.Input;
      KeyCode = _cc.KeyCode;
    }, function (_unresolved_2) {
      buildWorld = _unresolved_2.buildWorld;
    }, function (_unresolved_3) {
      buildHumanoid = _unresolved_3.buildHumanoid;
    }, function (_unresolved_4) {
      createPrimitiveNode = _unresolved_4.createPrimitiveNode;
      Palette = _unresolved_4.Palette;
      clearMaterialCache = _unresolved_4.clearMaterialCache;
    }, function (_unresolved_5) {
      PlayerStats = _unresolved_5.PlayerStats;
    }, function (_unresolved_6) {
      PlayerController = _unresolved_6.PlayerController;
    }, function (_unresolved_7) {
      PlayerCombat = _unresolved_7.PlayerCombat;
    }, function (_unresolved_8) {
      Inventory = _unresolved_8.Inventory;
    }, function (_unresolved_9) {
      EnemySpawner = _unresolved_9.EnemySpawner;
    }, function (_unresolved_10) {
      NPC = _unresolved_10.NPC;
      NPCDefs = _unresolved_10.NPCDefs;
      buildNpcNode = _unresolved_10.buildNpcNode;
    }, function (_unresolved_11) {
      QuestManager = _unresolved_11.QuestManager;
    }, function (_unresolved_12) {
      UIManager = _unresolved_12.UIManager;
    }, function (_unresolved_13) {
      CameraFollow = _unresolved_13.CameraFollow;
    }, function (_unresolved_14) {
      EventBus = _unresolved_14.EventBus;
      GameEvents = _unresolved_14.GameEvents;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "1175cDMfj9AqJvcjGT6iVNw", "GameBootstrap", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'Color', 'Camera', 'find', 'director', 'input', 'Input', 'EventKeyboard', 'KeyCode']);

      ({
        ccclass
      } = _decorator);

      _export("GameBootstrap", GameBootstrap = (_dec = ccclass('GameBootstrap'), _dec(_class = class GameBootstrap extends Component {
        start() {
          var _camNode$getComponent;

          // Clear stale material cache from any previous editor Play session.
          // Module-level Maps survive editor stop/play cycles; destroyed Materials
          // inside them cause "Cannot read properties of undefined (reading 'localSetLayout')".
          (_crd && clearMaterialCache === void 0 ? (_reportPossibleCrUseOfclearMaterialCache({
            error: Error()
          }), clearMaterialCache) : clearMaterialCache)();
          const scene = this.node.scene; // 1) Use the pre-baked world that lives inside the scene file.
          //    (See WorldBuilderBaker for how to bake it in the editor.)
          //    Fallback: if no baked world is found, generate one procedurally so
          //    the project still runs out-of-the-box.

          let world = this.findInScene(scene, 'World');

          if (!world) {
            console.warn('[GameBootstrap] No baked "World" node found in scene. ' + 'Falling back to runtime generation. ' + 'Add a WorldBuilderBaker component in the editor and click "Bake Now" to pre-build the environment.');
            world = (_crd && buildWorld === void 0 ? (_reportPossibleCrUseOfbuildWorld({
              error: Error()
            }), buildWorld) : buildWorld)();
            scene.addChild(world);
          } else {
            console.log('[GameBootstrap] Using pre-baked World from scene.');
          } // 2) Build the player


          const playerParts = (_crd && buildHumanoid === void 0 ? (_reportPossibleCrUseOfbuildHumanoid({
            error: Error()
          }), buildHumanoid) : buildHumanoid)('Player', {
            skin: (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
              error: Error()
            }), Palette) : Palette).skin,
            shirt: new Color(70, 100, 160),
            // blue tunic
            pants: new Color(60, 50, 40),
            hair: new Color(80, 55, 35)
          }, 1);
          playerParts.root.setPosition(0, 0, -2);
          scene.addChild(playerParts.root); // Default weapon on player

          const sword = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
            error: Error()
          }), createPrimitiveNode) : createPrimitiveNode)('Weapon', 'box', new Vec3(0.14, 1.1, 0.14), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
            error: Error()
          }), Palette) : Palette).iron);
          sword.setPosition(0, -0.55, 0);
          playerParts.weaponSlot.addChild(sword); // Player components

          const stats = playerParts.root.addComponent(_crd && PlayerStats === void 0 ? (_reportPossibleCrUseOfPlayerStats({
            error: Error()
          }), PlayerStats) : PlayerStats);
          const inventory = playerParts.root.addComponent(_crd && Inventory === void 0 ? (_reportPossibleCrUseOfInventory({
            error: Error()
          }), Inventory) : Inventory);
          inventory.stats = stats;
          const controller = playerParts.root.addComponent(_crd && PlayerController === void 0 ? (_reportPossibleCrUseOfPlayerController({
            error: Error()
          }), PlayerController) : PlayerController);
          controller.stats = stats;
          controller.legs = {
            l: playerParts.leftLeg,
            r: playerParts.rightLeg
          };
          controller.arms = {
            l: playerParts.leftArm,
            r: playerParts.rightArm
          };
          controller.body = playerParts.body;
          const combat = playerParts.root.addComponent(_crd && PlayerCombat === void 0 ? (_reportPossibleCrUseOfPlayerCombat({
            error: Error()
          }), PlayerCombat) : PlayerCombat);
          combat.stats = stats; // Starting inventory

          inventory.addItem('rusty_sword', 1);
          inventory.addItem('cloth_hood', 1);
          inventory.addItem('leather_vest', 1);
          inventory.addItem('leather_boots', 1);
          inventory.addItem('health_potion', 5);
          inventory.addItem('mana_potion', 3);
          inventory.equip('rusty_sword');
          inventory.equip('leather_vest');
          inventory.equip('cloth_hood');
          inventory.equip('leather_boots'); // 3) Camera follow

          let camNode = scene.getChildByName('Main Camera');

          if (!camNode) {
            camNode = new Node('Main Camera');
            camNode.addComponent(Camera);
            scene.addChild(camNode);
          }

          const cam = (_camNode$getComponent = camNode.getComponent(Camera)) != null ? _camNode$getComponent : camNode.addComponent(Camera);
          cam.clearColor = {
            x: 0.45,
            y: 0.55,
            z: 0.75,
            w: 1
          };
          cam.fov = 55;
          cam.far = 500;
          let camFollow = camNode.getComponent(_crd && CameraFollow === void 0 ? (_reportPossibleCrUseOfCameraFollow({
            error: Error()
          }), CameraFollow) : CameraFollow);
          if (!camFollow) camFollow = camNode.addComponent(_crd && CameraFollow === void 0 ? (_reportPossibleCrUseOfCameraFollow({
            error: Error()
          }), CameraFollow) : CameraFollow);
          camFollow.target = playerParts.root;
          camFollow.distance = 11;
          camFollow.height = 5;
          camFollow.pitch = 28;
          controller.cameraNode = camNode; // 4) Spawn NPCs

          const npcsParent = new Node('NPCs');
          world.addChild(npcsParent);

          for (const def of _crd && NPCDefs === void 0 ? (_reportPossibleCrUseOfNPCDefs({
            error: Error()
          }), NPCDefs) : NPCDefs) {
            const built = (_crd && buildNpcNode === void 0 ? (_reportPossibleCrUseOfbuildNpcNode({
              error: Error()
            }), buildNpcNode) : buildNpcNode)(def);
            npcsParent.addChild(built.root);
            const comp = built.root.addComponent(_crd && NPC === void 0 ? (_reportPossibleCrUseOfNPC({
              error: Error()
            }), NPC) : NPC);
            comp.init(def, playerParts.root);
            comp.marker = built.marker;
          } // Emit NPC range hint to UI


          this.schedule(() => {
            let anyClose = false;
            const pp = playerParts.root.worldPosition;

            for (const c of npcsParent.children) {
              const a = c.worldPosition;
              const d = Math.hypot(a.x - pp.x, a.z - pp.z);

              if (d <= 3) {
                anyClose = true;
                break;
              }
            }

            (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
              error: Error()
            }), EventBus) : EventBus).emit('npc_in_range', anyClose);
          }, 0.2); // 5) Quest manager

          const questNode = new Node('QuestManager');
          scene.addChild(questNode);
          const questMgr = questNode.addComponent(_crd && QuestManager === void 0 ? (_reportPossibleCrUseOfQuestManager({
            error: Error()
          }), QuestManager) : QuestManager);
          questMgr.inventory = inventory;
          questMgr.stats = stats; // 6) Enemy spawner

          const enemiesParent = new Node('Enemies');
          world.addChild(enemiesParent);
          const spawnerNode = new Node('EnemySpawner');
          scene.addChild(spawnerNode);
          const spawner = spawnerNode.addComponent(_crd && EnemySpawner === void 0 ? (_reportPossibleCrUseOfEnemySpawner({
            error: Error()
          }), EnemySpawner) : EnemySpawner);
          spawner.worldRoot = enemiesParent;
          spawner.player = playerParts.root;
          spawner.playerStats = stats;
          spawner.inventory = inventory;
          spawner.spawnAll();
          combat.enemies = spawner.enemies; // 7) UI Manager

          const uiNode = new Node('UI');
          scene.addChild(uiNode);
          const ui = uiNode.addComponent(_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
            error: Error()
          }), UIManager) : UIManager);
          ui.stats = stats;
          ui.inventory = inventory;
          ui.combat = combat;
          ui.quests = questMgr; // 8) Global key shortcuts (I = inventory, L = quest log, ESC closes panels)

          input.on(Input.EventType.KEY_DOWN, e => {
            if (e.keyCode === KeyCode.KEY_I) (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
              error: Error()
            }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
              error: Error()
            }), GameEvents) : GameEvents).UI_TOGGLE_INVENTORY);else if (e.keyCode === KeyCode.KEY_L) (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
              error: Error()
            }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
              error: Error()
            }), GameEvents) : GameEvents).UI_TOGGLE_QUEST);else if (e.keyCode === KeyCode.ESCAPE) {
              (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
                error: Error()
              }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
                error: Error()
              }), GameEvents) : GameEvents).DIALOG_CLOSE);
            }
          }); // 9) Initial state push

          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, stats);
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).INVENTORY_CHANGED, inventory);
          console.log('[GameBootstrap] Medieval RPG initialized!');
          console.log('  Player at:', playerParts.root.position);
          console.log('  NPCs:', (_crd && NPCDefs === void 0 ? (_reportPossibleCrUseOfNPCDefs({
            error: Error()
          }), NPCDefs) : NPCDefs).length, '  Enemies spawned:', spawner.enemies.length);
        }
        /** Recursively search the scene graph for a node by name. */


        findInScene(root, name) {
          if (root.name === name) return root;

          for (const child of root.children) {
            const hit = this.findInScene(child, name);
            if (hit) return hit;
          }

          return null;
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=aa3bb7d41e60e0d2f6cc8d399f12ae881dcf30db.js.map