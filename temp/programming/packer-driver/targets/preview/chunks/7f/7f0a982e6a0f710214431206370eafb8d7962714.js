System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Canvas, UITransform, Widget, Sprite, Label, Color, SpriteFrame, ImageAsset, Texture2D, Layout, Button, view, UIOpacity, Camera, EventBus, GameEvents, ItemDB, RarityColor, NPCDefs, _dec, _class, _crd, ccclass, sfCache, UIManager;

  function solidSpriteFrame(color) {
    var key = color.r + "_" + color.g + "_" + color.b + "_" + color.a;
    if (sfCache.has(key)) return sfCache.get(key);
    var img = new ImageAsset({
      width: 2,
      height: 2,
      _data: new Uint8Array([color.r, color.g, color.b, color.a, color.r, color.g, color.b, color.a, color.r, color.g, color.b, color.a, color.r, color.g, color.b, color.a]),
      _compressed: false,
      format: Texture2D.PixelFormat.RGBA8888
    });
    var tex = new Texture2D();
    tex.image = img;
    var sf = new SpriteFrame();
    sf.texture = tex; // Prevent DynamicAtlasManager from trying to pack this programmatic frame.
    // The atlas calls texSubImage2D expecting an HTMLImageElement/ImageBitmap, but
    // Uint8Array-backed ImageAssets are not a valid overload → "Overload resolution failed".

    sf.packable = false;
    sfCache.set(key, sf);
    return sf;
  }

  function makePanel(name, w, h, color) {
    var n = new Node(name);
    var ut = n.addComponent(UITransform);
    ut.setContentSize(w, h);
    var sp = n.addComponent(Sprite);
    sp.type = Sprite.Type.SIMPLE;
    sp.spriteFrame = solidSpriteFrame(color);
    return n;
  }

  function makeLabel(text, size, color) {
    if (size === void 0) {
      size = 16;
    }

    if (color === void 0) {
      color = new Color(255, 255, 255);
    }

    var n = new Node('Label');
    n.addComponent(UITransform);
    var l = n.addComponent(Label);
    l.string = text;
    l.fontSize = size;
    l.lineHeight = Math.floor(size * 1.2);
    l.color = color;
    l.cacheMode = Label.CacheMode.NONE;
    return n;
  }

  function makeButton(label, w, h, color, onClick) {
    var root = makePanel('Button', w, h, color);
    var lbl = makeLabel(label, 14);
    lbl.parent = root;
    var btn = root.addComponent(Button);
    btn.transition = Button.Transition.SCALE;
    btn.zoomScale = 0.95;
    root.on(Node.EventType.TOUCH_END, onClick);
    return root;
  }

  function anchorTopLeft(node, l, t) {
    var w = node.addComponent(Widget);
    w.isAlignLeft = true;
    w.left = l;
    w.isAlignTop = true;
    w.top = t;
  }

  function anchorTopRight(node, r, t) {
    var w = node.addComponent(Widget);
    w.isAlignRight = true;
    w.right = r;
    w.isAlignTop = true;
    w.top = t;
  }

  function anchorBottomCenter(node, b) {
    var w = node.addComponent(Widget);
    w.isAlignBottom = true;
    w.bottom = b;
    w.isAlignHorizontalCenter = true;
    w.horizontalCenter = 0;
  }

  function anchorCenter(node) {
    var w = node.addComponent(Widget);
    w.isAlignHorizontalCenter = true;
    w.horizontalCenter = 0;
    w.isAlignVerticalCenter = true;
    w.verticalCenter = 0;
  }

  function hexToColor(hex, alpha) {
    if (alpha === void 0) {
      alpha = 255;
    }

    var h = hex.replace('#', '');
    var r = parseInt(h.substr(0, 2), 16);
    var g = parseInt(h.substr(2, 2), 16);
    var b = parseInt(h.substr(4, 2), 16);
    return new Color(r, g, b, alpha);
  }

  function _reportPossibleCrUseOfEventBus(extras) {
    _reporterNs.report("EventBus", "../core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameEvents(extras) {
    _reporterNs.report("GameEvents", "../core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPlayerStats(extras) {
    _reporterNs.report("PlayerStats", "../player/PlayerStats", _context.meta, extras);
  }

  function _reportPossibleCrUseOfInventory(extras) {
    _reporterNs.report("Inventory", "../inventory/Inventory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfItemDB(extras) {
    _reporterNs.report("ItemDB", "../inventory/Items", _context.meta, extras);
  }

  function _reportPossibleCrUseOfRarityColor(extras) {
    _reporterNs.report("RarityColor", "../inventory/Items", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEquipSlot(extras) {
    _reporterNs.report("EquipSlot", "../inventory/Items", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPlayerCombat(extras) {
    _reporterNs.report("PlayerCombat", "../player/PlayerCombat", _context.meta, extras);
  }

  function _reportPossibleCrUseOfQuestManager(extras) {
    _reporterNs.report("QuestManager", "../quest/QuestManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfNPCDefs(extras) {
    _reporterNs.report("NPCDefs", "../npc/NPC", _context.meta, extras);
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
      Canvas = _cc.Canvas;
      UITransform = _cc.UITransform;
      Widget = _cc.Widget;
      Sprite = _cc.Sprite;
      Label = _cc.Label;
      Color = _cc.Color;
      SpriteFrame = _cc.SpriteFrame;
      ImageAsset = _cc.ImageAsset;
      Texture2D = _cc.Texture2D;
      Layout = _cc.Layout;
      Button = _cc.Button;
      view = _cc.view;
      UIOpacity = _cc.UIOpacity;
      Camera = _cc.Camera;
    }, function (_unresolved_2) {
      EventBus = _unresolved_2.EventBus;
      GameEvents = _unresolved_2.GameEvents;
    }, function (_unresolved_3) {
      ItemDB = _unresolved_3.ItemDB;
      RarityColor = _unresolved_3.RarityColor;
    }, function (_unresolved_4) {
      NPCDefs = _unresolved_4.NPCDefs;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "76fdaeVS1pJ67wAac0pEpE/", "UIManager", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Canvas', 'UITransform', 'Widget', 'Sprite', 'Label', 'Color', 'SpriteFrame', 'ImageAsset', 'Texture2D', 'Layout', 'Button', 'EventTouch', 'view', 'Vec3', 'UIOpacity', 'Camera']);

      ({
        ccclass
      } = _decorator); // ---------- helpers to build a 1x1 solid-color sprite frame ----------

      sfCache = new Map();

      _export("UIManager", UIManager = (_dec = ccclass('UIManager'), _dec(_class = class UIManager extends Component {
        constructor() {
          super(...arguments);
          this.stats = null;
          this.inventory = null;
          this.combat = null;
          this.quests = null;
          this.canvasNode = void 0;
          // HUD references
          this.hpBar = void 0;
          this.mpBar = void 0;
          this.stBar = void 0;
          this.xpBar = void 0;
          this.levelLabel = void 0;
          this.goldLabel = void 0;
          this.skillButtons = [];
          this.notifContainer = void 0;
          this.interactHint = void 0;
          this.bossBar = null;
          this.damagePop = void 0;
          // Panels
          this.inventoryPanel = void 0;
          this.questPanel = void 0;
          this.dialogPanel = void 0;
        }

        onLoad() {
          this.setupCanvas();
          this.buildHUD();
          this.buildSkillBar();
          this.buildBossBar();
          this.buildInventoryPanel();
          this.buildQuestPanel();
          this.buildDialogPanel();
          this.buildHelpHint();
          this.bindEvents();
        }

        setupCanvas() {
          var _this$node$scene, _this$node$scene3;

          // Build a UI Canvas node
          var canvasNode = new Node('UICanvas');
          var ut = canvasNode.addComponent(UITransform);
          var vis = view.getVisibleSize();
          ut.setContentSize(vis.width, vis.height);
          var canvas = canvasNode.addComponent(Canvas); // Find or create 2D camera

          var camNode = (_this$node$scene = this.node.scene) == null ? void 0 : _this$node$scene.getChildByName('UICamera');

          if (!camNode) {
            var _this$node$scene2;

            camNode = new Node('UICamera');
            var cam = camNode.addComponent(Camera);
            cam.priority = 1100;
            cam.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
            cam.projection = Camera.ProjectionType.ORTHO;
            cam.visibility = 1 << 25; // UI_2D layer

            camNode.layer = 1 << 25;
            (_this$node$scene2 = this.node.scene) == null || _this$node$scene2.addChild(camNode);
          }

          canvas.cameraComponent = camNode.getComponent(Camera); // Force UI layer

          canvasNode.layer = 1 << 25; // Add a widget that fills screen

          var w = canvasNode.addComponent(Widget);
          w.isAlignTop = w.isAlignBottom = w.isAlignLeft = w.isAlignRight = true;
          w.top = w.bottom = w.left = w.right = 0;
          (_this$node$scene3 = this.node.scene) == null || _this$node$scene3.addChild(canvasNode);
          this.canvasNode = canvasNode;
        }

        addToCanvas(n) {
          // Apply UI layer recursively
          this.applyUILayer(n);
          this.canvasNode.addChild(n);
        }

        applyUILayer(n) {
          n.layer = 1 << 25;

          for (var c of n.children) this.applyUILayer(c);
        } // ------------- HUD -------------


        makeBar(label, width, height, color) {
          var root = makePanel('Bar', width + 100, height + 18, new Color(0, 0, 0, 0)); // label

          var lbl = makeLabel(label, 11);
          lbl.setPosition(-width / 2 - 50 + 30, height / 2 + 2);
          root.addChild(lbl); // bg

          var bg = makePanel('BarBg', width, height, new Color(20, 20, 20, 200));
          bg.setPosition(0, 0);
          root.addChild(bg); // border

          var border = makePanel('Border', width + 2, height + 2, new Color(80, 60, 40, 255));
          border.setPosition(0, 0);
          var inner = makePanel('Inner', width, height, new Color(20, 20, 20, 220));
          border.addChild(inner); // fill

          var fill = makePanel('Fill', width, height, color);
          fill.getComponent(UITransform).setAnchorPoint(0, 0.5);
          fill.setPosition(-width / 2, 0);
          bg.addChild(fill); // value text

          var val = makeLabel('100/100', 11);
          val.setPosition(0, 0);
          bg.addChild(val);
          return {
            root,
            refs: {
              fill,
              label: val.getComponent(Label),
              bgWidth: width
            }
          };
        }

        buildHUD() {
          // Top-left: player panel
          var panel = makePanel('PlayerPanel', 280, 130, new Color(20, 15, 10, 180));
          anchorTopLeft(panel, 16, 16);
          this.addToCanvas(panel); // border accent

          var accent = makePanel('Accent', 280, 4, new Color(180, 140, 60));
          accent.setPosition(0, 63);
          panel.addChild(accent);
          var name = makeLabel('Sir Aldric  ⚔️', 16);
          name.setPosition(-90, 50);
          panel.addChild(name);
          var lvl = makeLabel('Lv. 1', 14, new Color(255, 215, 100));
          lvl.setPosition(90, 50);
          panel.addChild(lvl);
          this.levelLabel = lvl.getComponent(Label);
          var hp = this.makeBar('HP', 220, 14, new Color(220, 60, 60));
          this.hpBar = hp.refs;
          hp.root.setPosition(20, 25);
          panel.addChild(hp.root);
          var mp = this.makeBar('MP', 220, 12, new Color(80, 140, 230));
          this.mpBar = mp.refs;
          mp.root.setPosition(20, 5);
          panel.addChild(mp.root);
          var st = this.makeBar('ST', 220, 10, new Color(220, 210, 80));
          this.stBar = st.refs;
          st.root.setPosition(20, -12);
          panel.addChild(st.root);
          var xp = this.makeBar('XP', 220, 8, new Color(140, 220, 140));
          this.xpBar = xp.refs;
          xp.root.setPosition(20, -28);
          panel.addChild(xp.root);
          var gold = makeLabel('💰 50', 14, new Color(255, 215, 100));
          gold.setPosition(-100, -50);
          panel.addChild(gold);
          this.goldLabel = gold.getComponent(Label); // Notification stack (top right)

          var notif = new Node('Notifications');
          var nut = notif.addComponent(UITransform);
          nut.setContentSize(320, 400);
          anchorTopRight(notif, 16, 16);
          var lay = notif.addComponent(Layout);
          lay.type = Layout.Type.VERTICAL;
          lay.resizeMode = Layout.ResizeMode.CONTAINER;
          lay.spacingY = 6;
          lay.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
          this.addToCanvas(notif);
          this.notifContainer = notif; // Interact hint

          var hint = makePanel('InteractHint', 280, 36, new Color(0, 0, 0, 180));
          var hintLbl = makeLabel('[E] Interact', 14, new Color(255, 220, 130));
          hintLbl.parent = hint;
          var hw = hint.addComponent(Widget);
          hw.isAlignHorizontalCenter = true;
          hw.horizontalCenter = 0;
          hw.isAlignBottom = true;
          hw.bottom = 220;
          hint.active = false;
          this.addToCanvas(hint);
          this.interactHint = hint;
        }

        buildSkillBar() {
          var _this$combat$skills, _this$combat;

          var bar = makePanel('SkillBar', 5 * 70 + 20, 80, new Color(20, 15, 10, 180));
          anchorBottomCenter(bar, 24);
          this.addToCanvas(bar);
          var skills = (_this$combat$skills = (_this$combat = this.combat) == null ? void 0 : _this$combat.skills) != null ? _this$combat$skills : [];
          var slots = ['J', 'Q', 'E', 'R', 'F'];
          var colors = ['#dddddd'].concat(skills.map(s => s.color));

          for (var i = 0; i < 5; i++) {
            var _skills$color, _skills;

            var slotColor = i === 0 ? new Color(160, 160, 160) : hexToColor((_skills$color = (_skills = skills[i - 1]) == null ? void 0 : _skills.color) != null ? _skills$color : '#888888');
            var slot = makePanel('Slot', 60, 60, new Color(40, 30, 20, 230));
            slot.setPosition(-2 * 70 + i * 70, 0);
            bar.addChild(slot);
            var icon = makePanel('Icon', 50, 50, slotColor);
            icon.setPosition(0, 5);
            slot.addChild(icon);
            var key = makeLabel(slots[i], 12, new Color(255, 230, 150));
            key.setPosition(0, -22);
            slot.addChild(key);
            var cdMask = makePanel('CDMask', 60, 0, new Color(0, 0, 0, 180));
            cdMask.getComponent(UITransform).setAnchorPoint(0.5, 0);
            cdMask.setPosition(0, -30);
            slot.addChild(cdMask);
            var cdLabel = makeLabel('', 16, new Color(255, 255, 255));
            cdLabel.setPosition(0, 5);
            slot.addChild(cdLabel);
            this.skillButtons.push({
              fill: cdMask,
              cd: cdLabel.getComponent(Label),
              root: slot
            });
          }
        }

        buildBossBar() {
          var panel = makePanel('BossBar', 500, 40, new Color(20, 10, 10, 200));
          var w = panel.addComponent(Widget);
          w.isAlignHorizontalCenter = true;
          w.horizontalCenter = 0;
          w.isAlignTop = true;
          w.top = 24;
          var lbl = makeLabel('Dark Knight', 16, new Color(255, 200, 200));
          lbl.setPosition(0, 12);
          panel.addChild(lbl);
          var bgw = 480,
              bgh = 14;
          var bg = makePanel('BBg', bgw, bgh, new Color(40, 0, 0, 220));
          bg.setPosition(0, -8);
          panel.addChild(bg);
          var fill = makePanel('BFill', bgw, bgh, new Color(200, 30, 30));
          fill.getComponent(UITransform).setAnchorPoint(0, 0.5);
          fill.setPosition(-bgw / 2, 0);
          bg.addChild(fill);
          panel.active = false;
          this.addToCanvas(panel);
          this.bossBar = {
            panel,
            fill,
            label: lbl.getComponent(Label)
          };
        } // ------------- Inventory Panel -------------


        buildInventoryPanel() {
          var _this = this;

          var panel = makePanel('InventoryPanel', 720, 480, new Color(25, 18, 12, 240));
          anchorCenter(panel);
          panel.active = false;
          this.addToCanvas(panel); // Title bar

          var titleBar = makePanel('Title', 720, 36, new Color(140, 90, 40));
          titleBar.setPosition(0, 222);
          var title = makeLabel('⚔️  Inventory & Equipment  ⚔️', 18);
          titleBar.addChild(title);
          panel.addChild(titleBar); // Close

          var close = makeButton('✕', 30, 28, new Color(160, 50, 50), () => {
            panel.active = false;
          });
          close.setPosition(335, 222);
          panel.addChild(close); // Left: Equipment slots

          var eqPanel = makePanel('Equipment', 240, 400, new Color(40, 30, 20, 220));
          eqPanel.setPosition(-220, -10);
          panel.addChild(eqPanel);
          var slots = ['helmet', 'amulet', 'armor', 'weapon', 'ring', 'boots'];
          var slotIcons = {
            helmet: '⛑️',
            amulet: '📿',
            armor: '🛡️',
            weapon: '⚔️',
            ring: '💍',
            boots: '🥾'
          };

          var _loop = function _loop() {
            var slot = slots[i];
            var cx = i % 2 === 0 ? -50 : 50;
            var cy = 140 - Math.floor(i / 2) * 110;
            var sBg = makePanel('SlotBg', 80, 80, new Color(60, 45, 30));
            sBg.setPosition(cx, cy);
            eqPanel.addChild(sBg);
            var sLabel = makeLabel(slot.toUpperCase(), 10, new Color(220, 200, 160));
            sLabel.setPosition(0, 50);
            sBg.addChild(sLabel);
            var sIcon = makeLabel(slotIcons[slot], 32);
            sIcon.setPosition(0, 0);
            sBg.addChild(sIcon); // Click to unequip

            var btn = sBg.addComponent(Button);
            btn.transition = Button.Transition.SCALE;
            sBg.on(Node.EventType.TOUCH_END, () => {
              var _this$inventory;

              if ((_this$inventory = _this.inventory) != null && _this$inventory.equipment[slot]) {
                _this.inventory.unequip(slot);

                _this.refreshInventory();
              }
            });
            sBg.__slotKind = slot;
            sBg.__iconLabel = sIcon.getComponent(Label);
            sBg.__nameLabel = sLabel.getComponent(Label);
          };

          for (var i = 0; i < slots.length; i++) {
            _loop();
          } // Right: Item grid scrollable (simple grid)


          var invPanel = makePanel('Items', 440, 400, new Color(40, 30, 20, 220));
          invPanel.setPosition(120, -10);
          panel.addChild(invPanel);
          var gridContainer = new Node('Grid');
          gridContainer.addComponent(UITransform).setContentSize(420, 380);
          var lay = gridContainer.addComponent(Layout);
          lay.type = Layout.Type.GRID;
          lay.resizeMode = Layout.ResizeMode.CONTAINER;
          lay.startAxis = Layout.AxisDirection.HORIZONTAL;
          lay.cellSize = {
            width: 64,
            height: 64
          };
          lay.spacingX = 6;
          lay.spacingY = 6;
          lay.paddingTop = 10;
          lay.paddingLeft = 10;
          gridContainer.setPosition(0, 0);
          invPanel.addChild(gridContainer);
          panel.__equip = eqPanel;
          panel.__grid = gridContainer;
          this.inventoryPanel = panel;
        }

        refreshInventory() {
          var _this2 = this;

          if (!this.inventoryPanel || !this.inventory) return;
          var grid = this.inventoryPanel.__grid;
          grid.removeAllChildren();

          var _loop2 = function _loop2() {
            var _def$icon2;

            var def = (_crd && ItemDB === void 0 ? (_reportPossibleCrUseOfItemDB({
              error: Error()
            }), ItemDB) : ItemDB)[slot.itemId];
            if (!def) return 1; // continue

            var cell = makePanel('Cell', 60, 60, hexToColor((_crd && RarityColor === void 0 ? (_reportPossibleCrUseOfRarityColor({
              error: Error()
            }), RarityColor) : RarityColor)[def.rarity], 60));
            var icon = makeLabel((_def$icon2 = def.icon) != null ? _def$icon2 : '?', 26);
            icon.setPosition(0, 6);
            cell.addChild(icon);
            var count = makeLabel(slot.count > 1 ? "x" + slot.count : '', 11);
            count.setPosition(20, -22);
            cell.addChild(count);
            var name = makeLabel(def.name, 9, hexToColor((_crd && RarityColor === void 0 ? (_reportPossibleCrUseOfRarityColor({
              error: Error()
            }), RarityColor) : RarityColor)[def.rarity]));
            name.setPosition(0, -18);
            cell.addChild(name);
            cell.addComponent(Button).transition = Button.Transition.SCALE;
            cell.on(Node.EventType.TOUCH_END, () => {
              if (def.kind === 'equipment') _this2.inventory.equip(def.id);else if (def.kind === 'consumable') _this2.inventory.useConsumable(def.id);

              _this2.refreshInventory();
            });
            grid.addChild(cell);

            _this2.applyUILayer(cell);
          };

          for (var slot of this.inventory.slots) {
            if (_loop2()) continue;
          } // Update equipment slots


          var eqPanel = this.inventoryPanel.__equip;

          for (var c of eqPanel.children) {
            var slotKind = c.__slotKind;
            if (!slotKind) continue;
            var id = this.inventory.equipment[slotKind];
            var iconLbl = c.__iconLabel;
            if (!iconLbl) continue;

            if (id) {
              var _def$icon;

              var def = (_crd && ItemDB === void 0 ? (_reportPossibleCrUseOfItemDB({
                error: Error()
              }), ItemDB) : ItemDB)[id];
              iconLbl.string = (_def$icon = def.icon) != null ? _def$icon : '?';
              iconLbl.color = hexToColor((_crd && RarityColor === void 0 ? (_reportPossibleCrUseOfRarityColor({
                error: Error()
              }), RarityColor) : RarityColor)[def.rarity]);
            } else {
              var defIcons = {
                helmet: '⛑️',
                amulet: '📿',
                armor: '🛡️',
                weapon: '⚔️',
                ring: '💍',
                boots: '🥾'
              };
              iconLbl.string = defIcons[slotKind];
              iconLbl.color = new Color(120, 110, 90);
            }
          }
        } // ------------- Quest panel -------------


        buildQuestPanel() {
          var panel = makePanel('QuestPanel', 520, 460, new Color(25, 18, 12, 240));
          anchorCenter(panel);
          panel.active = false;
          this.addToCanvas(panel);
          var titleBar = makePanel('Title', 520, 36, new Color(140, 90, 40));
          titleBar.setPosition(0, 212);
          titleBar.addChild(makeLabel('📜  Quest Log  📜', 18));
          panel.addChild(titleBar);
          var close = makeButton('✕', 30, 28, new Color(160, 50, 50), () => {
            panel.active = false;
          });
          close.setPosition(235, 212);
          panel.addChild(close);
          var list = new Node('List');
          list.addComponent(UITransform).setContentSize(490, 400);
          var lay = list.addComponent(Layout);
          lay.type = Layout.Type.VERTICAL;
          lay.resizeMode = Layout.ResizeMode.NONE;
          lay.spacingY = 6;
          lay.paddingTop = 10;
          list.setPosition(0, -20);
          panel.addChild(list);
          panel.__list = list;
          this.questPanel = panel;
        }

        refreshQuests() {
          if (!this.quests || !this.questPanel) return;
          var list = this.questPanel.__list;
          list.removeAllChildren();

          for (var q of this.quests.quests) {
            if (q.state === 'available' || q.state === 'completed') {
              if (q.state === 'completed') {
                var _row = makePanel('Row', 490, 26, new Color(20, 50, 20, 180));

                _row.addChild(makeLabel("\u2713  " + q.title, 12, new Color(150, 220, 150)));

                list.addChild(_row);
                this.applyUILayer(_row);
              }

              continue;
            }

            var row = makePanel('Row', 490, 60, new Color(40, 30, 20, 180));
            var titleColor = q.isMain ? new Color(255, 200, 120) : new Color(180, 220, 255);
            var t = makeLabel("" + (q.state === 'ready' ? '★ ' : '') + q.title, 13, titleColor);
            t.setPosition(-220, 18);
            t.getComponent(UITransform).anchorX = 0;
            t.getComponent(Label).horizontalAlign = Label.HorizontalAlign.LEFT;
            row.addChild(t); // objectives

            var lines = [];

            for (var obj of q.objectives) {
              if (obj.type === 'kill') lines.push("Kill " + obj.target + ": " + obj.current + "/" + obj.required);else if (obj.type === 'collect') {
                var _def$name;

                var cnt = this.inventory ? this.inventory.countItem(obj.itemId) : 0;
                var def = (_crd && ItemDB === void 0 ? (_reportPossibleCrUseOfItemDB({
                  error: Error()
                }), ItemDB) : ItemDB)[obj.itemId];
                lines.push("Collect " + ((_def$name = def == null ? void 0 : def.name) != null ? _def$name : obj.itemId) + ": " + Math.min(cnt, obj.required) + "/" + obj.required);
              }
            }

            var ot = makeLabel(lines.join('   |   '), 11, new Color(220, 210, 180));
            ot.setPosition(-220, -8);
            ot.getComponent(UITransform).anchorX = 0;
            ot.getComponent(Label).horizontalAlign = Label.HorizontalAlign.LEFT;
            row.addChild(ot);
            list.addChild(row);
            this.applyUILayer(row);
          }
        } // ------------- Dialog -------------


        buildDialogPanel() {
          var panel = makePanel('Dialog', 720, 240, new Color(20, 15, 10, 240));
          var w = panel.addComponent(Widget);
          w.isAlignHorizontalCenter = true;
          w.horizontalCenter = 0;
          w.isAlignBottom = true;
          w.bottom = 130;
          panel.active = false;
          this.addToCanvas(panel);
          var accent = makePanel('Accent', 720, 4, new Color(180, 140, 60));
          accent.setPosition(0, 116);
          panel.addChild(accent);
          var name = makeLabel('NPC', 16, new Color(255, 220, 130));
          name.setPosition(-330, 90);
          name.getComponent(UITransform).anchorX = 0;
          name.getComponent(Label).horizontalAlign = Label.HorizontalAlign.LEFT;
          panel.addChild(name);
          var text = makeLabel('...', 14);
          text.setPosition(-330, 50);
          text.getComponent(UITransform).setContentSize(660, 80);
          text.getComponent(UITransform).anchorX = 0;
          text.getComponent(Label).horizontalAlign = Label.HorizontalAlign.LEFT;
          text.getComponent(Label).overflow = Label.Overflow.RESIZE_HEIGHT;
          panel.addChild(text);
          var choices = new Node('Choices');
          choices.addComponent(UITransform).setContentSize(700, 90);
          var lay = choices.addComponent(Layout);
          lay.type = Layout.Type.VERTICAL;
          lay.resizeMode = Layout.ResizeMode.NONE;
          lay.spacingY = 4;
          choices.setPosition(0, -50);
          panel.addChild(choices);
          panel.__name = name.getComponent(Label);
          panel.__text = text.getComponent(Label);
          panel.__choices = choices;
          this.dialogPanel = panel;
        }

        openNpcDialog(npcId) {
          var _this3 = this;

          var def = (_crd && NPCDefs === void 0 ? (_reportPossibleCrUseOfNPCDefs({
            error: Error()
          }), NPCDefs) : NPCDefs).find(n => n.id === npcId);
          if (!def || !this.quests) return;
          var nameLbl = this.dialogPanel.__name;
          var textLbl = this.dialogPanel.__text;
          var choices = this.dialogPanel.__choices;
          nameLbl.string = def.name + "  (" + def.role + ")";
          textLbl.string = def.greet;
          choices.removeAllChildren();
          var sets = this.quests.questsForNpc(npcId); // Ready -> turn in

          var _loop3 = function _loop3(q) {
            var b = makeButton("\u2605 Turn in: " + q.title, 660, 26, new Color(100, 140, 60), () => {
              _this3.quests.turnIn(q.id);

              _this3.openNpcDialog(npcId);

              _this3.refreshQuests();
            });
            choices.addChild(b);

            _this3.applyUILayer(b);
          };

          for (var q of sets.ready) {
            _loop3(q);
          } // Available -> accept


          var _loop4 = function _loop4(_q) {
            var b = makeButton("+ Accept: " + _q.title, 660, 26, new Color(80, 100, 160), () => {
              _this3.quests.accept(_q.id);

              _this3.openNpcDialog(npcId);

              _this3.refreshQuests();
            });
            choices.addChild(b);

            _this3.applyUILayer(b);
          };

          for (var _q of sets.available) {
            _loop4(_q);
          } // Active -> show status


          for (var _q2 of sets.active) {
            var b = makePanel('Active', 660, 22, new Color(60, 50, 30));
            b.addChild(makeLabel("\u2026 " + _q2.title + "  (in progress)", 12, new Color(220, 210, 160)));
            choices.addChild(b);
            this.applyUILayer(b);
          }

          if (sets.ready.length + sets.available.length + sets.active.length === 0) {
            var _b = makePanel('None', 660, 22, new Color(50, 40, 30));

            _b.addChild(makeLabel('— No tasks for you right now —', 12, new Color(180, 170, 140)));

            choices.addChild(_b);
            this.applyUILayer(_b);
          } // Close


          var close = makeButton('Close [ESC]', 660, 24, new Color(100, 60, 60), () => {
            this.dialogPanel.active = false;
            (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
              error: Error()
            }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
              error: Error()
            }), GameEvents) : GameEvents).DIALOG_CLOSE);
          });
          choices.addChild(close);
          this.applyUILayer(close);
          this.dialogPanel.active = true;
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).DIALOG_OPEN, npcId);
        } // ------------- Help / hint -------------


        buildHelpHint() {
          var hint = makePanel('Help', 220, 200, new Color(20, 15, 10, 180));
          var w = hint.addComponent(Widget);
          w.isAlignRight = true;
          w.right = 16;
          w.isAlignBottom = true;
          w.bottom = 24;
          this.addToCanvas(hint);
          var lines = ['— Controls —', 'WASD : Move', 'SPACE : Jump / Double Jump', 'C / L-Shift : Slide', 'J : Attack', 'Q E R F : Skills', 'E / T : Talk to NPC', 'I : Inventory', 'L : Quest Log', 'ESC : Close panels'];
          var t = makeLabel(lines.join('\n'), 11, new Color(220, 200, 160));
          t.setPosition(0, 0);
          t.getComponent(Label).horizontalAlign = Label.HorizontalAlign.LEFT;
          t.getComponent(UITransform).setContentSize(200, 180);
          hint.addChild(t);
        } // ------------- Notifications & popups -------------


        showNotification(text, color) {
          if (color === void 0) {
            color = new Color(255, 230, 160);
          }

          var n = makePanel('Notif', 300, 28, new Color(30, 20, 10, 220));
          n.addChild(makeLabel(text, 12, color));
          this.notifContainer.addChild(n);
          this.applyUILayer(n);
          var op = n.addComponent(UIOpacity);
          op.opacity = 255;
          this.scheduleOnce(() => {
            // fade out
            var start = Date.now();
            var dur = 600;

            var tick = () => {
              var t = Math.min(1, (Date.now() - start) / dur);
              op.opacity = (1 - t) * 255;
              if (t < 1) requestAnimationFrame(tick);else if (n.isValid) n.destroy();
            };

            tick();
          }, 2.4);
        } // ------------- Event bindings -------------


        bindEvents() {
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, () => this.refreshStats());
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).SKILL_COOLDOWN_CHANGED, (i, remaining, total) => {
            if (i < 0 || i >= 4) return;
            var sb = this.skillButtons[i + 1];
            if (!sb) return;
            var h = remaining / total * 60;
            sb.fill.getComponent(UITransform).setContentSize(60, h);
            sb.cd.string = remaining > 0.1 ? remaining.toFixed(1) : '';
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).SKILL_USED, (i, name) => {
            this.showNotification("\u2726 " + name, new Color(255, 220, 160));
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_LEVEL_UP, lvl => {
            this.showNotification("\uD83C\uDF89 Level Up!  Lv. " + lvl, new Color(255, 220, 100));
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_EXP_GAINED, amt => {
            this.showNotification("+" + amt + " EXP", new Color(160, 230, 160));
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).ITEM_PICKED_UP, (def, count) => {
            var _def$icon3;

            this.showNotification("+" + count + " " + ((_def$icon3 = def.icon) != null ? _def$icon3 : '') + " " + def.name, hexToColor((_crd && RarityColor === void 0 ? (_reportPossibleCrUseOfRarityColor({
              error: Error()
            }), RarityColor) : RarityColor)[def.rarity]));
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).QUEST_STARTED, q => {
            this.showNotification("\uD83D\uDCDC New Quest: " + q.title, new Color(255, 220, 130));
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).QUEST_COMPLETED, q => {
            this.showNotification("\u2705 Completed: " + q.title, new Color(150, 230, 150));
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).QUEST_UPDATED, () => this.refreshQuests());
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).ENEMY_DAMAGED, (en, dmg) => {
            var _en$archetype;

            // Boss bar
            if ((en == null || (_en$archetype = en.archetype) == null ? void 0 : _en$archetype.kind) === 'boss' && this.bossBar) {
              this.bossBar.panel.active = !en.dead;
              var ratio = Math.max(0, en.hp / en.archetype.maxHP);
              this.bossBar.fill.getComponent(UITransform).setContentSize(480 * ratio, 14);
            }
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).ENEMY_DIED, en => {
            var _en$archetype2;

            if ((en == null || (_en$archetype2 = en.archetype) == null ? void 0 : _en$archetype2.kind) === 'boss' && this.bossBar) this.bossBar.panel.active = false;
            this.showNotification("\uD83D\uDC80 Defeated " + en.archetype.name, new Color(255, 180, 180));
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_DAMAGED, (dmg, hp) => {// simple screen flash via notification color
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_DIED, () => {
            this.showNotification('☠️  You have fallen...', new Color(255, 80, 80));
            this.scheduleOnce(() => {
              // Respawn at village
              if (this.stats) {
                this.stats.hp = this.stats.maxHP + this.stats.bonusHP;
                this.stats.mp = this.stats.maxMP + this.stats.bonusMP;
              }

              (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
                error: Error()
              }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
                error: Error()
              }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this.stats);
            }, 2);
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).UI_TOGGLE_INVENTORY, () => {
            this.inventoryPanel.active = !this.inventoryPanel.active;
            if (this.inventoryPanel.active) this.refreshInventory();
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).UI_TOGGLE_QUEST, () => {
            this.questPanel.active = !this.questPanel.active;
            if (this.questPanel.active) this.refreshQuests();
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).NPC_INTERACTED, id => {
            this.openNpcDialog(id);
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).DIALOG_CLOSE, () => {
            this.dialogPanel.active = false;
          });
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on('npc_in_range', inRange => {
            this.interactHint.active = inRange;
          });
        }

        refreshStats() {
          if (!this.stats) return;
          var s = this.stats;
          var hpMax = s.maxHP + s.bonusHP;
          var mpMax = s.maxMP + s.bonusMP;
          this.setBar(this.hpBar, s.hp, hpMax);
          this.setBar(this.mpBar, s.mp, mpMax);
          this.setBar(this.stBar, s.stamina, s.maxStamina, false);
          this.setBar(this.xpBar, s.exp, s.expToNext, false);
          this.levelLabel.string = "Lv. " + s.level;
          this.goldLabel.string = "\uD83D\uDCB0 " + s.gold + "    \u2694 ATK " + s.attack + "   \uD83D\uDEE1 DEF " + s.defense;
        }

        setBar(b, cur, max, showRatio) {
          if (showRatio === void 0) {
            showRatio = true;
          }

          var r = max > 0 ? cur / max : 0;
          b.fill.getComponent(UITransform).setContentSize(b.bgWidth * r, b.fill.getComponent(UITransform).contentSize.height);
          b.label.string = Math.floor(cur) + "/" + Math.floor(max);
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=7f0a982e6a0f710214431206370eafb8d7962714.js.map