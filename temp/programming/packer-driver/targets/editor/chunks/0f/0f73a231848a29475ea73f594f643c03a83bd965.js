System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, EventBus, GameEvents, _dec, _class, _crd, ccclass, PlayerStats;

  function _reportPossibleCrUseOfEventBus(extras) {
    _reporterNs.report("EventBus", "../core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameEvents(extras) {
    _reporterNs.report("GameEvents", "../core/EventBus", _context.meta, extras);
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
    }, function (_unresolved_2) {
      EventBus = _unresolved_2.EventBus;
      GameEvents = _unresolved_2.GameEvents;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "326c3ucSihCdI8Re/U75D5i", "PlayerStats", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("PlayerStats", PlayerStats = (_dec = ccclass('PlayerStats'), _dec(_class = class PlayerStats extends Component {
        constructor(...args) {
          super(...args);
          this.level = 1;
          this.exp = 0;
          this.expToNext = 100;
          this.maxHP = 100;
          this.hp = 100;
          this.maxMP = 50;
          this.mp = 50;
          this.maxStamina = 100;
          this.stamina = 100;
          // Base attributes (modified by equipment)
          this.baseAttack = 10;
          this.baseDefense = 5;
          this.baseMoveSpeed = 6;
          // Bonuses from equipment
          this.bonusAttack = 0;
          this.bonusDefense = 0;
          this.bonusHP = 0;
          this.bonusMP = 0;
          this.gold = 50;
        }

        get attack() {
          return this.baseAttack + this.bonusAttack + (this.level - 1) * 2;
        }

        get defense() {
          return this.baseDefense + this.bonusDefense + (this.level - 1);
        }

        update(dt) {
          // Regen stamina
          if (this.stamina < this.maxStamina) {
            this.stamina = Math.min(this.maxStamina, this.stamina + 18 * dt);
          } // Slight MP regen


          if (this.mp < this.maxMP) {
            this.mp = Math.min(this.maxMP, this.mp + 3 * dt);
          }

          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this);
        }

        takeDamage(amount) {
          const real = Math.max(1, amount - this.defense);
          this.hp = Math.max(0, this.hp - real);
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_DAMAGED, real, this.hp);
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this);
          if (this.hp <= 0) (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_DIED);
        }

        heal(amount) {
          this.hp = Math.min(this.maxHP + this.bonusHP, this.hp + amount);
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_HEALED, amount, this.hp);
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this);
        }

        useMP(amount) {
          if (this.mp < amount) return false;
          this.mp -= amount;
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this);
          return true;
        }

        useStamina(amount) {
          if (this.stamina < amount) return false;
          this.stamina -= amount;
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this);
          return true;
        }

        gainExp(amount) {
          this.exp += amount;
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_EXP_GAINED, amount);

          while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            this.expToNext = Math.floor(this.expToNext * 1.5);
            this.maxHP += 20;
            this.hp = this.maxHP + this.bonusHP;
            this.maxMP += 10;
            this.mp = this.maxMP + this.bonusMP;
            (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
              error: Error()
            }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
              error: Error()
            }), GameEvents) : GameEvents).PLAYER_LEVEL_UP, this.level);
          }

          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this);
        }

        addGold(amount) {
          this.gold += amount;
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this);
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=0f73a231848a29475ea73f594f643c03a83bd965.js.map