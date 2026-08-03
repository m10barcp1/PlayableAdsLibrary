System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, director, EventBus, GameEvents, _dec, _class, _class2, _crd, ccclass, property, GameState, GameManager;

  function _reportPossibleCrUseOfEventBus(extras) {
    _reporterNs.report("EventBus", "./EventBus", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameEvents(extras) {
    _reporterNs.report("GameEvents", "./EventBus", _context.meta, extras);
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
      director = _cc.director;
    }, function (_unresolved_2) {
      EventBus = _unresolved_2.EventBus;
      GameEvents = _unresolved_2.GameEvents;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c3f228m+Y1Gwr4hThqUmQTB", "GameManager", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'director']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("GameState", GameState = /*#__PURE__*/function (GameState) {
        GameState[GameState["Loading"] = 0] = "Loading";
        GameState[GameState["Playing"] = 1] = "Playing";
        GameState[GameState["Paused"] = 2] = "Paused";
        GameState[GameState["Dialog"] = 3] = "Dialog";
        GameState[GameState["GameOver"] = 4] = "GameOver";
        return GameState;
      }({}));

      _export("GameManager", GameManager = (_dec = ccclass('GameManager'), _dec(_class = (_class2 = class GameManager extends Component {
        constructor(...args) {
          super(...args);
          this.state = GameState.Loading;
          this.playerNode = null;
        }

        static get instance() {
          return GameManager._instance;
        }

        onLoad() {
          if (GameManager._instance && GameManager._instance !== this) {
            this.node.destroy();
            return;
          }

          GameManager._instance = this;
          director.addPersistRootNode(this.node);
        }

        setState(s) {
          this.state = s;
          if (s === GameState.Paused) director.getScheduler().setTimeScale(0);else if (s === GameState.Playing) director.getScheduler().setTimeScale(1);
        }

        notify(msg) {
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).NOTIFICATION, msg);
          console.log('[Notify]', msg);
        }

        onDestroy() {
          if (GameManager._instance === this) GameManager._instance = null;
        }

      }, _class2._instance = null, _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=87292bbf356bc20639eca5d0fd95fe7dfbaca57e.js.map