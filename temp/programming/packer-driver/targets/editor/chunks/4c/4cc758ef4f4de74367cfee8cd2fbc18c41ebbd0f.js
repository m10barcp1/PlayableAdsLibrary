System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, EventBusImpl, _crd, EventBus, GameEvents;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "09b6ffwx+FO9YcRp2EYZWWi", "EventBus", undefined); // Simple global event bus for decoupled communication between systems.


      EventBusImpl = class EventBusImpl {
        constructor() {
          this.handlers = new Map();
        }

        on(event, handler) {
          if (!this.handlers.has(event)) this.handlers.set(event, []);
          this.handlers.get(event).push(handler);
        }

        off(event, handler) {
          const arr = this.handlers.get(event);
          if (!arr) return;
          const i = arr.indexOf(handler);
          if (i >= 0) arr.splice(i, 1);
        }

        emit(event, ...args) {
          const arr = this.handlers.get(event);
          if (!arr) return;

          for (const h of arr.slice()) {
            try {
              h(...args);
            } catch (e) {
              console.error(e);
            }
          }
        }

        clear() {
          this.handlers.clear();
        }

      };

      _export("EventBus", EventBus = new EventBusImpl()); // Centralized event name constants


      _export("GameEvents", GameEvents = {
        PLAYER_DAMAGED: 'player_damaged',
        PLAYER_HEALED: 'player_healed',
        PLAYER_DIED: 'player_died',
        PLAYER_LEVEL_UP: 'player_level_up',
        PLAYER_EXP_GAINED: 'player_exp_gained',
        PLAYER_STATS_CHANGED: 'player_stats_changed',
        ENEMY_DAMAGED: 'enemy_damaged',
        ENEMY_DIED: 'enemy_died',
        SKILL_USED: 'skill_used',
        SKILL_COOLDOWN_CHANGED: 'skill_cooldown_changed',
        ITEM_PICKED_UP: 'item_picked_up',
        INVENTORY_CHANGED: 'inventory_changed',
        EQUIPMENT_CHANGED: 'equipment_changed',
        QUEST_STARTED: 'quest_started',
        QUEST_UPDATED: 'quest_updated',
        QUEST_COMPLETED: 'quest_completed',
        NPC_INTERACTED: 'npc_interacted',
        DIALOG_OPEN: 'dialog_open',
        DIALOG_CLOSE: 'dialog_close',
        UI_TOGGLE_INVENTORY: 'ui_toggle_inventory',
        UI_TOGGLE_QUEST: 'ui_toggle_quest',
        NOTIFICATION: 'notification'
      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=4cc758ef4f4de74367cfee8cd2fbc18c41ebbd0f.js.map