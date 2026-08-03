System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, ItemDB, EventBus, GameEvents, _dec, _class, _crd, ccclass, Inventory;

  function _reportPossibleCrUseOfItemDB(extras) {
    _reporterNs.report("ItemDB", "./Items", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEquipSlot(extras) {
    _reporterNs.report("EquipSlot", "./Items", _context.meta, extras);
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
      ItemDB = _unresolved_2.ItemDB;
    }, function (_unresolved_3) {
      EventBus = _unresolved_3.EventBus;
      GameEvents = _unresolved_3.GameEvents;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "7d70fRhi8BFNqR/ZzqM81Rl", "Inventory", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("Inventory", Inventory = (_dec = ccclass('Inventory'), _dec(_class = class Inventory extends Component {
        constructor(...args) {
          super(...args);
          this.capacity = 30;
          this.slots = [];
          this.equipment = {};
          this.stats = null;
        }

        addItem(itemId, count = 1) {
          const def = (_crd && ItemDB === void 0 ? (_reportPossibleCrUseOfItemDB({
            error: Error()
          }), ItemDB) : ItemDB)[itemId];
          if (!def) return false;

          if (def.stackable) {
            const existing = this.slots.find(s => s.itemId === itemId);

            if (existing) {
              existing.count += count;
              this.emit();
              return true;
            }
          }

          if (this.slots.length >= this.capacity) return false;
          this.slots.push({
            itemId,
            count
          });
          this.emit();
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).ITEM_PICKED_UP, def, count);
          return true;
        }

        removeItem(itemId, count = 1) {
          const idx = this.slots.findIndex(s => s.itemId === itemId);
          if (idx < 0) return false;
          this.slots[idx].count -= count;
          if (this.slots[idx].count <= 0) this.slots.splice(idx, 1);
          this.emit();
          return true;
        }

        hasItem(itemId, count = 1) {
          const s = this.slots.find(s => s.itemId === itemId);
          return !!s && s.count >= count;
        }

        countItem(itemId) {
          const s = this.slots.find(s => s.itemId === itemId);
          return s ? s.count : 0;
        }

        useConsumable(itemId) {
          const def = (_crd && ItemDB === void 0 ? (_reportPossibleCrUseOfItemDB({
            error: Error()
          }), ItemDB) : ItemDB)[itemId];
          if (!def || def.kind !== 'consumable' || !this.stats) return false;
          if (!this.hasItem(itemId)) return false;
          if (def.heal) this.stats.heal(def.heal);

          if (def.restoreMp) {
            this.stats.mp = Math.min(this.stats.maxMP + this.stats.bonusMP, this.stats.mp + def.restoreMp);
          }

          this.removeItem(itemId, 1);
          return true;
        }

        equip(itemId) {
          const def = (_crd && ItemDB === void 0 ? (_reportPossibleCrUseOfItemDB({
            error: Error()
          }), ItemDB) : ItemDB)[itemId];
          if (!def || def.kind !== 'equipment' || !def.slot) return false;
          if (!this.hasItem(itemId)) return false;
          const slot = def.slot; // swap

          const prev = this.equipment[slot];
          this.equipment[slot] = itemId;
          this.removeItem(itemId, 1);
          if (prev) this.addItem(prev, 1);
          this.recalcBonuses();
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).EQUIPMENT_CHANGED, this.equipment);
          return true;
        }

        unequip(slot) {
          const itemId = this.equipment[slot];
          if (!itemId) return false;
          delete this.equipment[slot];
          this.addItem(itemId, 1);
          this.recalcBonuses();
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).EQUIPMENT_CHANGED, this.equipment);
          return true;
        }

        recalcBonuses() {
          if (!this.stats) return;
          let atk = 0,
              def = 0,
              hp = 0,
              mp = 0;

          for (const slot of Object.keys(this.equipment)) {
            var _s$attack, _s$defense, _s$hp, _s$mp;

            const id = this.equipment[slot];
            if (!id) continue;
            const it = (_crd && ItemDB === void 0 ? (_reportPossibleCrUseOfItemDB({
              error: Error()
            }), ItemDB) : ItemDB)[id];
            const s = it.stats;
            if (!s) continue;
            atk += (_s$attack = s.attack) != null ? _s$attack : 0;
            def += (_s$defense = s.defense) != null ? _s$defense : 0;
            hp += (_s$hp = s.hp) != null ? _s$hp : 0;
            mp += (_s$mp = s.mp) != null ? _s$mp : 0;
          }

          this.stats.bonusAttack = atk;
          this.stats.bonusDefense = def;
          const oldBHP = this.stats.bonusHP,
                oldBMP = this.stats.bonusMP;
          this.stats.bonusHP = hp;
          this.stats.bonusMP = mp; // Re-clamp current HP/MP

          this.stats.hp = Math.min(this.stats.maxHP + this.stats.bonusHP, this.stats.hp + (hp - oldBHP));
          this.stats.mp = Math.min(this.stats.maxMP + this.stats.bonusMP, this.stats.mp + (mp - oldBMP));
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).PLAYER_STATS_CHANGED, this.stats);
        }

        emit() {
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).INVENTORY_CHANGED, this);
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=064ffc0e349ea02c1c1c694dfb7cde99e82d07fc.js.map