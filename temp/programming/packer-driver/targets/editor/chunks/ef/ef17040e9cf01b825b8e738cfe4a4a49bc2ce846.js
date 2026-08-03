System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, QuestList, EventBus, GameEvents, _dec, _class, _crd, ccclass, QuestManager;

  function _reportPossibleCrUseOfQuest(extras) {
    _reporterNs.report("Quest", "./Quests", _context.meta, extras);
  }

  function _reportPossibleCrUseOfQuestList(extras) {
    _reporterNs.report("QuestList", "./Quests", _context.meta, extras);
  }

  function _reportPossibleCrUseOfQuestObjectiveCollect(extras) {
    _reporterNs.report("QuestObjectiveCollect", "./Quests", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEventBus(extras) {
    _reporterNs.report("EventBus", "../core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameEvents(extras) {
    _reporterNs.report("GameEvents", "../core/EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfInventory(extras) {
    _reporterNs.report("Inventory", "../inventory/Inventory", _context.meta, extras);
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
      QuestList = _unresolved_2.QuestList;
    }, function (_unresolved_3) {
      EventBus = _unresolved_3.EventBus;
      GameEvents = _unresolved_3.GameEvents;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "b1483E6tiFBarHKRYBas3aU", "QuestManager", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("QuestManager", QuestManager = (_dec = ccclass('QuestManager'), _dec(_class = class QuestManager extends Component {
        constructor(...args) {
          super(...args);
          this.quests = [];
          this.inventory = null;
          this.stats = null;
        }

        onLoad() {
          // Deep clone the static list so progress is isolated
          this.quests = (_crd && QuestList === void 0 ? (_reportPossibleCrUseOfQuestList({
            error: Error()
          }), QuestList) : QuestList).map(q => JSON.parse(JSON.stringify(q)));
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).ENEMY_DIED, this.onEnemyDied.bind(this));
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).on((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).INVENTORY_CHANGED, this.refreshCollectProgress.bind(this));
        }

        onEnemyDied(enemy) {
          var _enemy$archetype;

          const kind = enemy == null || (_enemy$archetype = enemy.archetype) == null ? void 0 : _enemy$archetype.kind;
          if (!kind) return;

          for (const q of this.quests) {
            if (q.state !== 'active') continue;

            for (const obj of q.objectives) {
              if (obj.type === 'kill' && obj.target === kind && obj.current < obj.required) {
                obj.current++;
                (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
                  error: Error()
                }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
                  error: Error()
                }), GameEvents) : GameEvents).QUEST_UPDATED, q);
              }
            }

            this.checkReady(q);
          }
        }

        refreshCollectProgress() {
          if (!this.inventory) return;

          for (const q of this.quests) {
            if (q.state !== 'active') continue;
            this.checkReady(q);
            (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
              error: Error()
            }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
              error: Error()
            }), GameEvents) : GameEvents).QUEST_UPDATED, q);
          }
        }

        isObjectiveDone(q, obj) {
          if (obj.type === 'kill') return obj.current >= obj.required;
          if (obj.type === 'collect') return !!this.inventory && this.inventory.countItem(obj.itemId) >= obj.required;
          if (obj.type === 'talk') return obj.done;
          return false;
        }

        checkReady(q) {
          const all = q.objectives.every(o => this.isObjectiveDone(q, o));
          if (all) q.state = 'ready';
        }

        canAccept(q) {
          if (q.state !== 'available') return false;

          if (q.prerequisite) {
            const pre = this.quests.find(x => x.id === q.prerequisite);
            if (!pre || pre.state !== 'completed') return false;
          }

          return true;
        }

        accept(qid) {
          const q = this.quests.find(x => x.id === qid);
          if (!q || !this.canAccept(q)) return false;
          q.state = 'active';
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).QUEST_STARTED, q);
          this.refreshCollectProgress();
          return true;
        }

        turnIn(qid) {
          const q = this.quests.find(x => x.id === qid);
          if (!q || q.state !== 'ready' || !this.inventory || !this.stats) return false; // Consume collect objectives

          for (const obj of q.objectives) {
            if (obj.type === 'collect') {
              this.inventory.removeItem(obj.itemId, obj.required);
            }
          } // Reward


          if (q.reward.exp) this.stats.gainExp(q.reward.exp);
          if (q.reward.gold) this.stats.addGold(q.reward.gold);
          if (q.reward.items) for (const r of q.reward.items) this.inventory.addItem(r.id, r.count);
          q.state = 'completed';
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).QUEST_COMPLETED, q);
          return true;
        }

        questsForNpc(npcId) {
          const available = this.quests.filter(q => q.giverNpcId === npcId && this.canAccept(q));
          const active = this.quests.filter(q => q.giverNpcId === npcId && q.state === 'active');
          const ready = this.quests.filter(q => q.giverNpcId === npcId && q.state === 'ready');
          return {
            available,
            active,
            ready
          };
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=ef17040e9cf01b825b8e738cfe4a4a49bc2ce846.js.map