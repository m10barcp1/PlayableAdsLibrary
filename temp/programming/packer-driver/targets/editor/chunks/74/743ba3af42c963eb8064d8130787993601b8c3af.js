System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, UITransform, Graphics, Label, Color, Vec2, Vec3, Layers, view, tween, Tween, sys, _dec, _class, _crd, ccclass, property, Suit, SUIT_GLYPH, RANK_GLYPH, isRed, CARD_W, CARD_H, PILE_GAP_X, TABLEAU_FAN_Y, TABLEAU_FAN_Y_DOWN, TOP_Y, TABLEAU_Y, COLOR_TABLE_BG, COLOR_TABLE_BG_2, COLOR_CARD_BG, COLOR_CARD_BACK_A, COLOR_CARD_BACK_B, COLOR_PILE_SLOT, COLOR_HIGHLIGHT, COLOR_RED, COLOR_BLACK, SolitaireGame;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      Node = _cc.Node;
      UITransform = _cc.UITransform;
      Graphics = _cc.Graphics;
      Label = _cc.Label;
      Color = _cc.Color;
      Vec2 = _cc.Vec2;
      Vec3 = _cc.Vec3;
      Layers = _cc.Layers;
      view = _cc.view;
      tween = _cc.tween;
      Tween = _cc.Tween;
      sys = _cc.sys;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "b1c2dPk9aZHiZq83vASNFZ4", "SolitaireGame", undefined);
      /**
       * SolitaireGame.ts
       * Klondike Solitaire - Complete implementation (logic + UI/UX procedurally generated).
       *
       * Author: Cline
       * Engine: Cocos Creator 3.8.x
       *
       * Features:
       *   - 52-card standard deck, shuffle, deal Klondike layout
       *   - Stock / Waste with 1-card draw, recycle on empty
       *   - 7 tableau piles (face-down + face-up cards), valid move = alternating color, descending
       *   - 4 foundations (A → K, same suit), win when all 52 on foundations
       *   - Drag & drop (with multi-card sequences from tableau)
       *   - Click-to-flip face-down top card, double-click to auto-send to foundation
       *   - Undo (full move history stack)
       *   - New Game / Restart / Hint (highlights a valid move) / Auto-complete when safe
       *   - Score & Move counter & Timer
       *   - Animated card movement (tween), particle-like flourish on win
       *   - In-game Tutorial overlay (first launch + button)
       *   - Win overlay with stats
       *   - All visuals procedural via Graphics / Labels — no external assets required.
       */


      __checkObsolete__(['_decorator', 'Component', 'Node', 'UITransform', 'Graphics', 'Label', 'Color', 'Vec2', 'Vec3', 'EventTouch', 'Layers', 'view', 'tween', 'Tween', 'Sprite', 'Canvas', 'Camera', 'find', 'director', 'Input', 'input', 'sys']);

      ({
        ccclass,
        property
      } = _decorator); // ----------------------------- Card Model -----------------------------

      Suit = /*#__PURE__*/function (Suit) {
        Suit[Suit["Spades"] = 0] = "Spades";
        Suit[Suit["Hearts"] = 1] = "Hearts";
        Suit[Suit["Diamonds"] = 2] = "Diamonds";
        Suit[Suit["Clubs"] = 3] = "Clubs";
        return Suit;
      }(Suit || {});

      SUIT_GLYPH = ['♠', '♥', '♦', '♣'];
      RANK_GLYPH = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

      isRed = s => s === Suit.Hearts || s === Suit.Diamonds;

      // ----------------------------- Layout Constants -----------------------------
      CARD_W = 90;
      CARD_H = 130;
      PILE_GAP_X = 14;
      TABLEAU_FAN_Y = 28; // vertical fan offset for face-up cards

      TABLEAU_FAN_Y_DOWN = 14; // smaller offset for face-down

      TOP_Y = 230; // top piles row (stock/waste/foundations) y

      TABLEAU_Y = 60; // top of tableau piles

      COLOR_TABLE_BG = new Color(15, 100, 60, 255);
      COLOR_TABLE_BG_2 = new Color(8, 70, 45, 255);
      COLOR_CARD_BG = new Color(255, 255, 255, 255);
      COLOR_CARD_BACK_A = new Color(35, 75, 160, 255);
      COLOR_CARD_BACK_B = new Color(20, 45, 110, 255);
      COLOR_PILE_SLOT = new Color(0, 0, 0, 90);
      COLOR_HIGHLIGHT = new Color(255, 230, 90, 220);
      COLOR_RED = new Color(200, 30, 40, 255);
      COLOR_BLACK = new Color(25, 25, 30, 255); // ----------------------------- Component -----------------------------

      _export("SolitaireGame", SolitaireGame = (_dec = ccclass('SolitaireGame'), _dec(_class = class SolitaireGame extends Component {
        constructor(...args) {
          super(...args);
          // Piles (each holds CardData in bottom→top order)
          this.stock = [];
          this.waste = [];
          this.foundations = [[], [], [], []];
          this.tableau = [[], [], [], [], [], [], []];
          this.allCards = [];
          // Pile slot nodes (visual placeholders & anchors)
          this.stockSlot = void 0;
          this.wasteSlot = void 0;
          this.foundationSlots = [];
          this.tableauSlots = [];
          // Root containers
          this.root = void 0;
          // game playfield root (centered)
          this.cardLayer = void 0;
          // all cards parent
          this.uiLayer = void 0;
          // HUD/buttons
          // HUD labels
          this.scoreLabel = void 0;
          this.movesLabel = void 0;
          this.timeLabel = void 0;
          // State
          this.score = 0;
          this.moves = 0;
          this.elapsed = 0;
          this.running = false;
          this.history = [];
          this.nextCardId = 0;
          // Drag state
          this.dragging = [];
          this.dragOriginPositions = [];
          this.dragOffset = new Vec2();
          this.dragFromType = 'tableau';
          this.dragFromIndex = 0;
          // Double-click detection
          this.lastClickId = -1;
          this.lastClickTime = 0;
          // Overlay nodes
          this.tutorialOverlay = void 0;
          this.winOverlay = void 0;
          // Playfield dimensions (computed)
          this.playfieldW = 0;
          this.playfieldH = 0;
        }

        // ----------------------------- Lifecycle -----------------------------
        onLoad() {
          var _this$node$parent;

          // Determine playfield size from canvas
          const canvasTr = (_this$node$parent = this.node.parent) == null ? void 0 : _this$node$parent.getComponent(UITransform);
          const w = canvasTr ? canvasTr.width : view.getVisibleSize().width;
          const h = canvasTr ? canvasTr.height : view.getVisibleSize().height;
          this.playfieldW = w;
          this.playfieldH = h; // Ensure this node has a UITransform sized to playfield

          let tr = this.node.getComponent(UITransform);
          if (!tr) tr = this.node.addComponent(UITransform);
          tr.setContentSize(w, h);
          this.buildBackground();
          this.buildPlayfield();
          this.buildHUD();
          this.buildButtons();
          this.buildTutorialOverlay();
          this.buildWinOverlay();
          this.newGame(); // Show tutorial on first launch (per browser/local storage)

          if (sys.localStorage.getItem('solitaire_seen_tutorial') !== '1') {
            this.showTutorial(true);
          }
        }

        update(dt) {
          if (this.running) {
            this.elapsed += dt;
            this.refreshTimeLabel();
          }
        } // ----------------------------- Build: Background -----------------------------


        buildBackground() {
          const bg = new Node('Background');
          bg.layer = Layers.Enum.UI_2D;
          this.node.addChild(bg);
          const tr = bg.addComponent(UITransform);
          tr.setContentSize(this.playfieldW, this.playfieldH);
          const g = bg.addComponent(Graphics); // Radial-ish gradient simulated with two filled rects

          g.fillColor = COLOR_TABLE_BG_2;
          g.rect(-this.playfieldW / 2, -this.playfieldH / 2, this.playfieldW, this.playfieldH);
          g.fill();
          g.fillColor = COLOR_TABLE_BG;
          const innerW = this.playfieldW * 0.96;
          const innerH = this.playfieldH * 0.94;
          g.roundRect(-innerW / 2, -innerH / 2, innerW, innerH, 24);
          g.fill(); // Subtle table felt decoration

          g.strokeColor = new Color(0, 0, 0, 60);
          g.lineWidth = 4;
          g.roundRect(-innerW / 2, -innerH / 2, innerW, innerH, 24);
          g.stroke();
        } // ----------------------------- Build: Playfield (slots) -----------------------------


        buildPlayfield() {
          this.root = new Node('PlayRoot');
          this.root.layer = Layers.Enum.UI_2D;
          this.node.addChild(this.root);
          this.root.addComponent(UITransform);
          this.cardLayer = new Node('CardLayer');
          this.cardLayer.layer = Layers.Enum.UI_2D;
          this.cardLayer.addComponent(UITransform);
          this.root.addChild(this.cardLayer); // Compute pile x positions (7 columns centered)

          const totalW = 7 * CARD_W + 6 * PILE_GAP_X;
          const startX = -totalW / 2 + CARD_W / 2; // Use top of playfield area for stock/waste/foundations.

          const topY = this.playfieldH / 2 - CARD_H / 2 - 90;
          const tabY = topY - CARD_H - 30; // Stock (column 0), Waste (column 1), Foundations (columns 3..6)

          this.stockSlot = this.makeSlot('StockSlot', '♻', startX + 0 * (CARD_W + PILE_GAP_X), topY);
          this.wasteSlot = this.makeSlot('WasteSlot', '', startX + 1 * (CARD_W + PILE_GAP_X), topY);

          for (let i = 0; i < 4; i++) {
            const slot = this.makeSlot(`Foundation${i}`, SUIT_GLYPH[i], startX + (3 + i) * (CARD_W + PILE_GAP_X), topY);
            this.foundationSlots.push(slot);
          } // Tableau slots


          for (let i = 0; i < 7; i++) {
            const slot = this.makeSlot(`Tableau${i}`, '', startX + i * (CARD_W + PILE_GAP_X), tabY);
            this.tableauSlots.push(slot);
          } // Touch handler on stock slot → draw


          this.stockSlot.on(Node.EventType.TOUCH_END, () => this.onStockClicked(), this);
        }

        makeSlot(name, glyph, x, y) {
          const n = new Node(name);
          n.layer = Layers.Enum.UI_2D;
          const tr = n.addComponent(UITransform);
          tr.setContentSize(CARD_W, CARD_H);
          n.setPosition(x, y, 0);
          const g = n.addComponent(Graphics);
          g.lineWidth = 2;
          g.strokeColor = COLOR_PILE_SLOT;
          g.fillColor = new Color(0, 0, 0, 40);
          g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10);
          g.fill();
          g.stroke();

          if (glyph) {
            const lbl = new Node('glyph');
            lbl.layer = Layers.Enum.UI_2D;
            lbl.addComponent(UITransform);
            const l = lbl.addComponent(Label);
            l.string = glyph;
            l.fontSize = 44;
            l.color = new Color(255, 255, 255, 60);
            n.addChild(lbl);
          }

          this.root.addChild(n);
          return n;
        } // ----------------------------- Build: HUD -----------------------------


        buildHUD() {
          this.uiLayer = new Node('UILayer');
          this.uiLayer.layer = Layers.Enum.UI_2D;
          this.uiLayer.addComponent(UITransform);
          this.node.addChild(this.uiLayer);
          const headerY = this.playfieldH / 2 - 40;
          this.scoreLabel = this.makeLabel('Score: 0', -this.playfieldW / 2 + 120, headerY, 26);
          this.movesLabel = this.makeLabel('Moves: 0', 0, headerY, 26);
          this.timeLabel = this.makeLabel('Time: 0:00', this.playfieldW / 2 - 130, headerY, 26);
        }

        makeLabel(text, x, y, size = 24, parent, color) {
          const n = new Node('Label');
          n.layer = Layers.Enum.UI_2D;
          n.addComponent(UITransform);
          const l = n.addComponent(Label);
          l.string = text;
          l.fontSize = size;
          l.lineHeight = size + 4;
          l.color = color || new Color(245, 245, 245, 255);
          l.isBold = true;
          n.setPosition(x, y, 0);
          (parent || this.uiLayer).addChild(n);
          return l;
        } // ----------------------------- Build: Buttons -----------------------------


        buildButtons() {
          const bottomY = -this.playfieldH / 2 + 50;
          const total = 5;
          const spacing = 150;
          const startX = -(total - 1) * spacing / 2;
          const defs = [{
            text: 'New Game',
            color: new Color(60, 140, 220, 255),
            cb: () => this.newGame()
          }, {
            text: 'Restart',
            color: new Color(150, 110, 200, 255),
            cb: () => this.restart()
          }, {
            text: 'Undo',
            color: new Color(200, 130, 60, 255),
            cb: () => this.undo()
          }, {
            text: 'Hint',
            color: new Color(220, 190, 60, 255),
            cb: () => this.hint()
          }, {
            text: 'Tutorial',
            color: new Color(80, 180, 130, 255),
            cb: () => this.showTutorial(false)
          }];
          defs.forEach((d, i) => {
            this.makeButton(d.text, startX + i * spacing, bottomY, 130, 50, d.color, d.cb);
          });
        }

        makeButton(text, x, y, w, h, color, cb, parent) {
          const n = new Node('Btn_' + text);
          n.layer = Layers.Enum.UI_2D;
          const tr = n.addComponent(UITransform);
          tr.setContentSize(w, h);
          n.setPosition(x, y, 0);
          const g = n.addComponent(Graphics);

          const draw = fill => {
            g.clear();
            g.fillColor = fill;
            g.roundRect(-w / 2, -h / 2, w, h, 10);
            g.fill();
            g.strokeColor = new Color(0, 0, 0, 120);
            g.lineWidth = 2;
            g.roundRect(-w / 2, -h / 2, w, h, 10);
            g.stroke();
          };

          draw(color);
          const lbl = this.makeLabel(text, 0, 0, 22, n, new Color(255, 255, 255, 255));
          lbl.node.setPosition(0, 0, 0);
          n.on(Node.EventType.TOUCH_START, () => {
            draw(new Color(Math.max(0, color.r - 30), Math.max(0, color.g - 30), Math.max(0, color.b - 30), 255));
            n.setScale(0.96, 0.96, 1);
          });

          const reset = () => {
            draw(color);
            n.setScale(1, 1, 1);
          };

          n.on(Node.EventType.TOUCH_END, () => {
            reset();
            cb();
          });
          n.on(Node.EventType.TOUCH_CANCEL, reset);
          (parent || this.uiLayer).addChild(n);
          return n;
        } // ----------------------------- Build: Overlays -----------------------------


        buildTutorialOverlay() {
          this.tutorialOverlay = new Node('TutorialOverlay');
          this.tutorialOverlay.layer = Layers.Enum.UI_2D;
          const tr = this.tutorialOverlay.addComponent(UITransform);
          tr.setContentSize(this.playfieldW, this.playfieldH);
          const dim = this.tutorialOverlay.addComponent(Graphics);
          dim.fillColor = new Color(0, 0, 0, 200);
          dim.rect(-this.playfieldW / 2, -this.playfieldH / 2, this.playfieldW, this.playfieldH);
          dim.fill();
          const panelW = Math.min(720, this.playfieldW - 80);
          const panelH = Math.min(560, this.playfieldH - 120);
          const panel = new Node('Panel');
          panel.layer = Layers.Enum.UI_2D;
          panel.addComponent(UITransform).setContentSize(panelW, panelH);
          const pg = panel.addComponent(Graphics);
          pg.fillColor = new Color(40, 50, 70, 250);
          pg.roundRect(-panelW / 2, -panelH / 2, panelW, panelH, 18);
          pg.fill();
          pg.strokeColor = new Color(255, 255, 255, 80);
          pg.lineWidth = 2;
          pg.roundRect(-panelW / 2, -panelH / 2, panelW, panelH, 18);
          pg.stroke();
          this.tutorialOverlay.addChild(panel);
          this.makeLabel('HOW TO PLAY — KLONDIKE SOLITAIRE', 0, panelH / 2 - 40, 28, panel, new Color(255, 220, 100, 255));
          const lines = ['GOAL: Move all 52 cards to the 4 foundations (top-right).', 'Foundations build UP by suit from Ace (A) to King (K).', '', 'TABLEAU (7 columns): Build DOWN by alternating colors', '   (e.g. black 7 on red 8). Only Kings may fill empty columns.', '', 'STOCK & WASTE (top-left): Tap the ♻ pile to draw a card.', '   When stock is empty, tap again to recycle the waste.', '', 'CONTROLS:', '   • Drag a card (or a face-up sequence) to move it.', '   • Double-tap a card to auto-send it to a foundation.', '   • Tap a face-down top card to flip it.', '   • Use Undo, Hint, and New Game anytime!', '', 'Tip: Free the Aces and 2s as early as you can. Good luck!'];
          let y = panelH / 2 - 90;

          for (const line of lines) {
            this.makeLabel(line, 0, y, 18, panel, new Color(235, 235, 245, 255));
            y -= 24;
          }

          this.makeButton('Got it!', 0, -panelH / 2 + 50, 180, 54, new Color(80, 180, 130, 255), () => this.hideTutorial(), panel);
          this.tutorialOverlay.active = false;
          this.node.addChild(this.tutorialOverlay);
        }

        buildWinOverlay() {
          this.winOverlay = new Node('WinOverlay');
          this.winOverlay.layer = Layers.Enum.UI_2D;
          const tr = this.winOverlay.addComponent(UITransform);
          tr.setContentSize(this.playfieldW, this.playfieldH);
          const dim = this.winOverlay.addComponent(Graphics);
          dim.fillColor = new Color(0, 0, 0, 200);
          dim.rect(-this.playfieldW / 2, -this.playfieldH / 2, this.playfieldW, this.playfieldH);
          dim.fill();
          const panelW = 520,
                panelH = 360;
          const panel = new Node('Panel');
          panel.layer = Layers.Enum.UI_2D;
          panel.addComponent(UITransform).setContentSize(panelW, panelH);
          const pg = panel.addComponent(Graphics);
          pg.fillColor = new Color(30, 60, 100, 250);
          pg.roundRect(-panelW / 2, -panelH / 2, panelW, panelH, 18);
          pg.fill();
          this.winOverlay.addChild(panel);
          this.makeLabel('🏆  YOU WIN!  🏆', 0, panelH / 2 - 50, 40, panel, new Color(255, 220, 80, 255));
          const winScore = this.makeLabel('Score: 0', 0, 50, 26, panel);
          const winMoves = this.makeLabel('Moves: 0', 0, 10, 26, panel);
          const winTime = this.makeLabel('Time: 0:00', 0, -30, 26, panel);
          this.winOverlay._winScore = winScore;
          this.winOverlay._winMoves = winMoves;
          this.winOverlay._winTime = winTime;
          this.makeButton('Play Again', 0, -panelH / 2 + 55, 220, 58, new Color(80, 180, 130, 255), () => {
            this.winOverlay.active = false;
            this.newGame();
          }, panel);
          this.winOverlay.active = false;
          this.node.addChild(this.winOverlay);
        }

        showTutorial(firstTime) {
          this.tutorialOverlay.active = true;
          if (firstTime) sys.localStorage.setItem('solitaire_seen_tutorial', '1');
        }

        hideTutorial() {
          this.tutorialOverlay.active = false;
        } // ----------------------------- Game Setup -----------------------------


        newGame() {
          // Clear previous
          for (const c of this.allCards) if (c.node && c.node.isValid) c.node.destroy();

          this.allCards = [];
          this.stock = [];
          this.waste = [];
          this.foundations = [[], [], [], []];
          this.tableau = [[], [], [], [], [], [], []];
          this.history = [];
          this.score = 0;
          this.moves = 0;
          this.elapsed = 0;
          this.running = true;
          this.nextCardId = 0;
          this.winOverlay.active = false; // Create deck

          const deck = [];

          for (let s = 0; s < 4; s++) {
            for (let r = 1; r <= 13; r++) {
              deck.push(this.createCard(s, r));
            }
          } // Shuffle


          for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
          } // Deal Klondike: pile i gets i+1 cards, top one face up


          let idx = 0;

          for (let i = 0; i < 7; i++) {
            for (let k = 0; k <= i; k++) {
              const card = deck[idx++];
              card.faceUp = k === i;
              card.pileType = 'tableau';
              card.pileIndex = i;
              card.posInPile = k;
              this.tableau[i].push(card);
            }
          } // Remaining → stock, all face down


          while (idx < deck.length) {
            const card = deck[idx++];
            card.faceUp = false;
            card.pileType = 'stock';
            card.pileIndex = 0;
            card.posInPile = this.stock.length;
            this.stock.push(card);
          } // Position everything


          this.layoutAll(true);
          this.refreshHUD();
        }

        restart() {
          // Lightweight: just call newGame for now (true 'restart same deal' would require storing the seed)
          this.newGame();
        }

        createCard(suit, rank) {
          const node = new Node(`Card_${RANK_GLYPH[rank]}${SUIT_GLYPH[suit]}`);
          node.layer = Layers.Enum.UI_2D;
          const tr = node.addComponent(UITransform);
          tr.setContentSize(CARD_W, CARD_H);
          this.cardLayer.addChild(node); // Faces: we'll draw whenever face state changes.

          node.addComponent(Graphics); // Center rank+suit big label

          const center = new Node('center');
          center.layer = Layers.Enum.UI_2D;
          center.addComponent(UITransform);
          const cl = center.addComponent(Label);
          cl.fontSize = 36;
          cl.isBold = true;
          node.addChild(center); // Top-left small

          const tl = new Node('tl');
          tl.layer = Layers.Enum.UI_2D;
          tl.addComponent(UITransform);
          const tll = tl.addComponent(Label);
          tll.fontSize = 18;
          tll.isBold = true;
          tl.setPosition(-CARD_W / 2 + 14, CARD_H / 2 - 16, 0);
          node.addChild(tl); // Bottom-right small (rotated visually by simple label flip)

          const br = new Node('br');
          br.layer = Layers.Enum.UI_2D;
          br.addComponent(UITransform);
          const brl = br.addComponent(Label);
          brl.fontSize = 18;
          brl.isBold = true;
          br.setPosition(CARD_W / 2 - 14, -CARD_H / 2 + 16, 0);
          br.setRotationFromEuler(0, 0, 180);
          node.addChild(br);
          const card = {
            id: this.nextCardId++,
            suit,
            rank,
            faceUp: false,
            node,
            pileType: 'stock',
            pileIndex: 0,
            posInPile: 0
          };
          this.attachCardInput(card);
          this.drawCard(card);
          this.allCards.push(card);
          return card;
        }

        drawCard(card) {
          const g = card.node.getComponent(Graphics);
          g.clear();

          if (card.faceUp) {
            // White rounded card
            g.fillColor = COLOR_CARD_BG;
            g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10);
            g.fill();
            g.strokeColor = new Color(0, 0, 0, 180);
            g.lineWidth = 2;
            g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10);
            g.stroke();
          } else {
            // Back: layered blue with diamond pattern
            g.fillColor = COLOR_CARD_BACK_A;
            g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 10);
            g.fill();
            g.fillColor = COLOR_CARD_BACK_B;
            const inset = 8;
            g.roundRect(-CARD_W / 2 + inset, -CARD_H / 2 + inset, CARD_W - inset * 2, CARD_H - inset * 2, 8);
            g.fill();
            g.strokeColor = new Color(255, 255, 255, 90);
            g.lineWidth = 1.5; // diamond grid

            for (let yy = -CARD_H / 2 + 16; yy < CARD_H / 2 - 8; yy += 16) {
              for (let xx = -CARD_W / 2 + 16; xx < CARD_W / 2 - 8; xx += 16) {
                g.moveTo(xx, yy);
                g.lineTo(xx + 6, yy + 6);
                g.lineTo(xx + 12, yy);
                g.lineTo(xx + 6, yy - 6);
                g.close();
              }
            }

            g.stroke();
          }

          const tl = card.node.getChildByName('tl').getComponent(Label);
          const br = card.node.getChildByName('br').getComponent(Label);
          const center = card.node.getChildByName('center').getComponent(Label);
          const col = isRed(card.suit) ? COLOR_RED : COLOR_BLACK;
          const txt = card.faceUp ? `${RANK_GLYPH[card.rank]}\n${SUIT_GLYPH[card.suit]}` : '';
          tl.string = card.faceUp ? `${RANK_GLYPH[card.rank]}\n${SUIT_GLYPH[card.suit]}` : '';
          br.string = card.faceUp ? `${RANK_GLYPH[card.rank]}\n${SUIT_GLYPH[card.suit]}` : '';
          center.string = card.faceUp ? `${SUIT_GLYPH[card.suit]}` : '';
          tl.color = col;
          br.color = col;
          center.color = col;
        } // ----------------------------- Layout -----------------------------


        slotPos(type, index) {
          let n;
          if (type === 'stock') n = this.stockSlot;else if (type === 'waste') n = this.wasteSlot;else if (type === 'foundation') n = this.foundationSlots[index];else n = this.tableauSlots[index];
          return n.getPosition();
        }

        cardPosInPile(type, index, pos) {
          const base = this.slotPos(type, index).clone();
          if (type !== 'tableau') return base; // tableau fan: compute by walking pile to know face-up/down offsets

          const pile = this.tableau[index];
          let y = base.y;

          for (let i = 1; i <= pos; i++) {
            const prev = pile[i - 1];
            y -= prev && prev.faceUp ? TABLEAU_FAN_Y : TABLEAU_FAN_Y_DOWN;
          }

          return new Vec3(base.x, y, 0);
        }

        layoutAll(instant = false) {
          const pilesToLay = [{
            type: 'stock',
            index: 0,
            arr: this.stock
          }, {
            type: 'waste',
            index: 0,
            arr: this.waste
          }];

          for (let i = 0; i < 4; i++) pilesToLay.push({
            type: 'foundation',
            index: i,
            arr: this.foundations[i]
          });

          for (let i = 0; i < 7; i++) pilesToLay.push({
            type: 'tableau',
            index: i,
            arr: this.tableau[i]
          });

          let siblingOrder = 0;

          for (const p of pilesToLay) {
            for (let i = 0; i < p.arr.length; i++) {
              const c = p.arr[i];
              c.pileType = p.type;
              c.pileIndex = p.index;
              c.posInPile = i;
              const target = this.cardPosInPile(p.type, p.index, i);
              if (instant) c.node.setPosition(target);else {
                Tween.stopAllByTarget(c.node);
                tween(c.node).to(0.18, {
                  position: target
                }, {
                  easing: 'quadOut'
                }).start();
              }
              c.node.setSiblingIndex(siblingOrder++);
              this.drawCard(c);
            }
          }
        } // ----------------------------- Input on Cards -----------------------------


        attachCardInput(card) {
          const n = card.node;
          n.on(Node.EventType.TOUCH_START, e => this.onCardTouchStart(card, e), this);
          n.on(Node.EventType.TOUCH_MOVE, e => this.onCardTouchMove(card, e), this);
          n.on(Node.EventType.TOUCH_END, e => this.onCardTouchEnd(card, e), this);
          n.on(Node.EventType.TOUCH_CANCEL, e => this.onCardTouchEnd(card, e), this);
        }

        onCardTouchStart(card, e) {
          // Stock cards: clicking handled separately via stock slot, but a touched stock card draws too
          if (card.pileType === 'stock') {
            this.onStockClicked();
            return;
          } // Determine selection


          const pile = this.getPile(card.pileType, card.pileIndex);
          const idx = pile.indexOf(card);
          if (idx < 0) return; // Only top waste/foundation is movable as single card
          // Tableau: must be face-up; the entire sequence from card down to top is grabbed

          if (!card.faceUp) {
            // If it's the topmost face-down tableau card, do nothing here (TOUCH_END will flip)
            return;
          }

          if (card.pileType === 'waste' && idx !== pile.length - 1) return;
          if (card.pileType === 'foundation' && idx !== pile.length - 1) return;

          if (card.pileType === 'tableau') {
            this.dragging = pile.slice(idx);
          } else {
            this.dragging = [card];
          }

          this.dragFromType = card.pileType;
          this.dragFromIndex = card.pileIndex;
          this.dragOriginPositions = this.dragging.map(c => c.node.getPosition().clone());
          const worldPos = e.getUILocation();
          const local = this.cardLayer.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
          this.dragOffset.set(card.node.position.x - local.x, card.node.position.y - local.y); // Bring dragged group to front

          for (const c of this.dragging) c.node.setSiblingIndex(99999);
        }

        onCardTouchMove(card, e) {
          if (!this.dragging.length || this.dragging[0] !== card) return;
          const worldPos = e.getUILocation();
          const local = this.cardLayer.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y, 0));
          const head = this.dragging[0];
          const newX = local.x + this.dragOffset.x;
          const newY = local.y + this.dragOffset.y;
          const dx = newX - head.node.position.x;
          const dy = newY - head.node.position.y;

          for (const c of this.dragging) {
            const p = c.node.position;
            c.node.setPosition(p.x + dx, p.y + dy, 0);
          }
        }

        onCardTouchEnd(card, e) {
          // Handle double-click / face-down flip case
          if (!this.dragging.length) {
            // Face-down top tableau card → flip
            if (!card.faceUp && card.pileType === 'tableau') {
              const pile = this.tableau[card.pileIndex];

              if (pile[pile.length - 1] === card) {
                const wasFace = [card.faceUp];
                card.faceUp = true;
                this.history.push({
                  cards: [card],
                  fromType: 'tableau',
                  fromIndex: card.pileIndex,
                  fromFaceUpBefore: wasFace,
                  toType: 'tableau',
                  toIndex: card.pileIndex,
                  flippedCardId: card.id,
                  scoreDelta: 5
                });
                this.score += 5;
                this.moves++;
                this.layoutAll();
                this.refreshHUD();
              }

              return;
            } // Double-click detection


            const now = Date.now();

            if (this.lastClickId === card.id && now - this.lastClickTime < 320) {
              this.tryAutoToFoundation(card);
              this.lastClickId = -1;
              return;
            }

            this.lastClickId = card.id;
            this.lastClickTime = now;
            return;
          }

          if (this.dragging[0] !== card) return; // Attempt to drop

          const dropTarget = this.findDropTarget();

          if (dropTarget && this.canPlace(this.dragging, dropTarget.type, dropTarget.index)) {
            this.executeMove(this.dragging, this.dragFromType, this.dragFromIndex, dropTarget.type, dropTarget.index);
          } else {
            // Snap back
            for (let i = 0; i < this.dragging.length; i++) {
              const c = this.dragging[i];
              tween(c.node).to(0.15, {
                position: this.dragOriginPositions[i]
              }, {
                easing: 'quadOut'
              }).start();
            } // Restore sibling order


            this.layoutAll();
          }

          this.dragging = [];
        }

        findDropTarget() {
          const head = this.dragging[0];
          const center = head.node.position;
          const candidates = [];

          for (let i = 0; i < 4; i++) candidates.push({
            type: 'foundation',
            index: i,
            node: this.foundationSlots[i]
          });

          for (let i = 0; i < 7; i++) candidates.push({
            type: 'tableau',
            index: i,
            node: this.tableauSlots[i]
          });

          let best = null;
          let bestDist = Infinity;

          for (const c of candidates) {
            // Determine top card position for that pile (or slot if empty)
            const pile = this.getPile(c.type, c.index);
            let pos;
            if (pile.length === 0) pos = c.node.getPosition();else pos = pile[pile.length - 1].node.getPosition();
            const dx = pos.x - center.x;
            const dy = pos.y - center.y;
            const d = Math.sqrt(dx * dx + dy * dy); // Must overlap reasonably with card area

            if (Math.abs(dx) < CARD_W * 0.8 && Math.abs(dy) < CARD_H * 0.9 && d < bestDist) {
              bestDist = d;
              best = {
                type: c.type,
                index: c.index
              };
            }
          }

          return best;
        } // ----------------------------- Rules -----------------------------


        getPile(type, index) {
          if (type === 'stock') return this.stock;
          if (type === 'waste') return this.waste;
          if (type === 'foundation') return this.foundations[index];
          return this.tableau[index];
        }

        canPlace(cards, toType, toIndex) {
          if (!cards.length) return false;
          const head = cards[0];

          if (toType === 'foundation') {
            if (cards.length !== 1) return false;
            const pile = this.foundations[toIndex];
            if (pile.length === 0) return head.rank === 1;
            const top = pile[pile.length - 1];
            return top.suit === head.suit && head.rank === top.rank + 1;
          }

          if (toType === 'tableau') {
            const pile = this.tableau[toIndex];
            if (pile.length === 0) return head.rank === 13;
            const top = pile[pile.length - 1];
            if (!top.faceUp) return false;
            return isRed(top.suit) !== isRed(head.suit) && head.rank === top.rank - 1;
          }

          return false;
        }

        executeMove(cards, fromType, fromIndex, toType, toIndex, recordHistory = true) {
          const fromPile = this.getPile(fromType, fromIndex);
          const toPile = this.getPile(toType, toIndex); // Remove from source

          const startIdx = fromPile.indexOf(cards[0]);
          fromPile.splice(startIdx, cards.length); // Add to destination

          for (const c of cards) toPile.push(c); // Determine flip of newly-exposed card


          let flippedId;
          let scoreDelta = 0;

          if (fromType === 'tableau' && fromPile.length > 0) {
            const top = fromPile[fromPile.length - 1];

            if (!top.faceUp) {
              top.faceUp = true;
              flippedId = top.id;
              scoreDelta += 5;
            }
          } // Scoring (classic Klondike-ish)


          if (toType === 'foundation') scoreDelta += 10;
          if (fromType === 'waste' && toType === 'tableau') scoreDelta += 5;
          if (fromType === 'foundation' && toType === 'tableau') scoreDelta -= 15;

          if (recordHistory) {
            this.history.push({
              cards: cards.slice(),
              fromType,
              fromIndex,
              fromFaceUpBefore: cards.map(c => c.faceUp),
              toType,
              toIndex,
              flippedCardId: flippedId,
              scoreDelta
            });
          }

          this.score = Math.max(0, this.score + scoreDelta);
          this.moves++;
          this.layoutAll();
          this.refreshHUD();
          this.checkWin();
        }

        tryAutoToFoundation(card) {
          if (!card.faceUp) return;
          const pile = this.getPile(card.pileType, card.pileIndex);
          if (pile[pile.length - 1] !== card) return;

          for (let i = 0; i < 4; i++) {
            if (this.canPlace([card], 'foundation', i)) {
              this.executeMove([card], card.pileType, card.pileIndex, 'foundation', i);
              return;
            }
          }
        } // ----------------------------- Stock -----------------------------


        onStockClicked() {
          if (this.stock.length === 0) {
            // Recycle waste → stock (reverse order, face-down)
            if (this.waste.length === 0) return;
            const recycled = [];

            while (this.waste.length) {
              const c = this.waste.pop();
              c.faceUp = false;
              c.pileType = 'stock';
              c.pileIndex = 0;
              this.stock.push(c);
              recycled.push(c);
            }

            this.history.push({
              cards: recycled,
              fromType: 'waste',
              fromIndex: 0,
              fromFaceUpBefore: recycled.map(() => true),
              toType: 'stock',
              toIndex: 0,
              stockRecycled: true,
              scoreDelta: -10
            });
            this.score = Math.max(0, this.score - 10);
            this.moves++;
          } else {
            const c = this.stock.pop();
            c.faceUp = true;
            c.pileType = 'waste';
            c.pileIndex = 0;
            this.waste.push(c);
            this.history.push({
              cards: [c],
              fromType: 'stock',
              fromIndex: 0,
              fromFaceUpBefore: [false],
              toType: 'waste',
              toIndex: 0,
              scoreDelta: 0
            });
            this.moves++;
          }

          this.layoutAll();
          this.refreshHUD();
        } // ----------------------------- Undo -----------------------------


        undo() {
          const m = this.history.pop();
          if (!m) return;

          if (m.flippedCardId !== undefined && (m.fromType !== m.toType || m.fromIndex !== m.toIndex || m.cards.length !== 1 || m.cards[0].id !== m.flippedCardId)) {
            // Un-flip the newly-revealed card
            const fl = this.allCards.find(c => c.id === m.flippedCardId);
            if (fl) fl.faceUp = false;
          }

          if (m.stockRecycled) {
            // Move all stock back to waste face-up
            const back = [];

            while (this.stock.length) {
              const c = this.stock.pop();
              c.faceUp = true;
              c.pileType = 'waste';
              c.pileIndex = 0;
              this.waste.push(c);
              back.push(c);
            }
          } else if (m.flippedCardId !== undefined && m.cards.length === 1 && m.cards[0].id === m.flippedCardId && m.fromType === m.toType) {
            // pure flip undo
            m.cards[0].faceUp = false;
          } else {
            // Move cards back
            const toPile = this.getPile(m.toType, m.toIndex); // Remove the last m.cards.length cards from destination

            const moved = toPile.splice(toPile.length - m.cards.length, m.cards.length);
            const fromPile = this.getPile(m.fromType, m.fromIndex);

            for (let i = 0; i < moved.length; i++) {
              moved[i].faceUp = m.fromFaceUpBefore[i];
              fromPile.push(moved[i]);
            } // For stock-from move (waste→stock single card draw is fromType=stock,toType=waste), this also handles undoing draws because card was originally face-down in stock.

          }

          this.score = Math.max(0, this.score - m.scoreDelta);
          this.moves = Math.max(0, this.moves - 1);
          this.layoutAll();
          this.refreshHUD();
        } // ----------------------------- Hint -----------------------------


        hint() {
          // Search for any valid move: prioritize foundation moves
          const sources = [];
          if (this.waste.length) sources.push(this.waste[this.waste.length - 1]);

          for (const pile of this.tableau) {
            for (const c of pile) if (c.faceUp) sources.push(c);
          } // To foundation first


          for (const c of sources) {
            const pile = this.getPile(c.pileType, c.pileIndex);
            if (pile[pile.length - 1] !== c) continue;

            for (let i = 0; i < 4; i++) if (this.canPlace([c], 'foundation', i)) {
              return this.flashHint(c.node, this.foundationSlots[i]);
            }
          } // To tableau


          for (const c of sources) {
            const pile = this.getPile(c.pileType, c.pileIndex);
            const idx = pile.indexOf(c);
            const seq = c.pileType === 'tableau' ? pile.slice(idx) : [c];

            for (let i = 0; i < 7; i++) {
              if (c.pileType === 'tableau' && c.pileIndex === i) continue;

              if (this.canPlace(seq, 'tableau', i)) {
                const tgtPile = this.tableau[i];
                const target = tgtPile.length ? tgtPile[tgtPile.length - 1].node : this.tableauSlots[i];
                return this.flashHint(c.node, target);
              }
            }
          } // Stock has cards → suggest draw


          if (this.stock.length || this.waste.length) return this.flashHint(this.stockSlot, this.stockSlot);
        }

        flashHint(a, b) {
          const pulse = n => {
            const original = n.scale.clone();
            tween(n).to(0.18, {
              scale: new Vec3(original.x * 1.12, original.y * 1.12, 1)
            }).to(0.18, {
              scale: original
            }).to(0.18, {
              scale: new Vec3(original.x * 1.12, original.y * 1.12, 1)
            }).to(0.18, {
              scale: original
            }).start();
          };

          pulse(a);
          if (b !== a) pulse(b);
        } // ----------------------------- Win Detection -----------------------------


        checkWin() {
          const total = this.foundations.reduce((s, p) => s + p.length, 0);

          if (total === 52) {
            this.running = false; // Bonus from time

            const timeBonus = Math.max(0, 700000 / Math.max(30, this.elapsed) | 0);
            this.score += timeBonus;
            this.refreshHUD();
            const w = this.winOverlay;
            w._winScore.string = `Score: ${this.score}  (+${timeBonus} time bonus)`;
            w._winMoves.string = `Moves: ${this.moves}`;
            w._winTime.string = `Time: ${this.formatTime(this.elapsed)}`;
            this.winOverlay.active = true;
            this.celebrate();
          } else {
            this.tryAutoFinish();
          }
        }

        tryAutoFinish() {
          // Auto-complete: if no face-down cards remain in tableau and stock+waste empty
          const anyDown = this.tableau.some(p => p.some(c => !c.faceUp));
          if (anyDown || this.stock.length || this.waste.length) return; // Repeatedly push any movable top to foundation

          this.scheduleOnce(() => this.autoFinishStep(), 0.15);
        }

        autoFinishStep() {
          let moved = false;

          for (let i = 0; i < 7 && !moved; i++) {
            const pile = this.tableau[i];
            if (!pile.length) continue;
            const top = pile[pile.length - 1];

            for (let f = 0; f < 4; f++) {
              if (this.canPlace([top], 'foundation', f)) {
                this.executeMove([top], 'tableau', i, 'foundation', f);
                moved = true;
                break;
              }
            }
          }

          if (moved) this.scheduleOnce(() => this.autoFinishStep(), 0.12);
        }

        celebrate() {
          // Confetti-like card scatter for foundation cards
          for (const pile of this.foundations) {
            for (const c of pile) {
              const dx = (Math.random() - 0.5) * 600;
              const dy = (Math.random() - 0.5) * 400;
              tween(c.node).by(0.8 + Math.random() * 0.6, {
                position: new Vec3(dx, dy, 0),
                eulerAngles: new Vec3(0, 0, (Math.random() - 0.5) * 720)
              }).start();
            }
          }
        } // ----------------------------- HUD -----------------------------


        refreshHUD() {
          this.scoreLabel.string = `Score: ${this.score}`;
          this.movesLabel.string = `Moves: ${this.moves}`;
          this.refreshTimeLabel();
        }

        refreshTimeLabel() {
          this.timeLabel.string = `Time: ${this.formatTime(this.elapsed)}`;
        }

        formatTime(t) {
          const s = Math.floor(t);
          const m = Math.floor(s / 60);
          const secs = s % 60;
          const ss = secs < 10 ? '0' + secs : '' + secs;
          return `${m}:${ss}`;
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=743ba3af42c963eb8064d8130787993601b8c3af.js.map