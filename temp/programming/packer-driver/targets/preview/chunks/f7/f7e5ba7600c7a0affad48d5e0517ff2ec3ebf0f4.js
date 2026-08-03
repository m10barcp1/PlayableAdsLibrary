System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Vec3, input, Input, KeyCode, Quat, EventBus, GameEvents, _dec, _class, _crd, ccclass, DefaultSkills, PlayerCombat;

  function _reportPossibleCrUseOfPlayerStats(extras) {
    _reporterNs.report("PlayerStats", "./PlayerStats", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEnemy(extras) {
    _reporterNs.report("Enemy", "../enemies/Enemy", _context.meta, extras);
  }

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
      Vec3 = _cc.Vec3;
      input = _cc.input;
      Input = _cc.Input;
      KeyCode = _cc.KeyCode;
      Quat = _cc.Quat;
    }, function (_unresolved_2) {
      EventBus = _unresolved_2.EventBus;
      GameEvents = _unresolved_2.GameEvents;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "5b3c9pCYVlMMIFECGRDqu1U", "PlayerCombat", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'input', 'Input', 'EventKeyboard', 'KeyCode', 'Quat']);

      ({
        ccclass
      } = _decorator);

      _export("DefaultSkills", DefaultSkills = [{
        id: 'slash',
        name: 'Heavy Slash',
        desc: 'Powerful frontal slash.',
        cooldown: 1.5,
        mpCost: 0,
        range: 2.5,
        damageMul: 1.8,
        color: '#ffc24a',
        key: KeyCode.KEY_Q
      }, {
        id: 'whirl',
        name: 'Whirlwind',
        desc: 'AOE spin attack around you.',
        cooldown: 6,
        mpCost: 15,
        range: 0,
        damageMul: 1.3,
        aoeRadius: 3.5,
        color: '#9be36b',
        key: KeyCode.KEY_E
      }, {
        id: 'fire',
        name: 'Fire Burst',
        desc: 'Ranged fire burst with AOE.',
        cooldown: 8,
        mpCost: 25,
        range: 9,
        damageMul: 2.4,
        aoeRadius: 2.5,
        color: '#ff7a3a',
        key: KeyCode.KEY_R
      }, {
        id: 'heal',
        name: 'Battle Heal',
        desc: 'Heal yourself for 40 HP.',
        cooldown: 12,
        mpCost: 30,
        range: 0,
        damageMul: 0,
        color: '#7ad4ff',
        key: KeyCode.KEY_F
      }]);

      _export("PlayerCombat", PlayerCombat = (_dec = ccclass('PlayerCombat'), _dec(_class = class PlayerCombat extends Component {
        constructor() {
          super(...arguments);
          this.stats = null;
          this.enemies = [];
          this.skills = DefaultSkills.slice();
          this.cooldowns = [0, 0, 0, 0];
          this.attackCooldown = 0;
        }

        onLoad() {
          input.on(Input.EventType.KEY_DOWN, this.onKey, this);
        }

        onDestroy() {
          input.off(Input.EventType.KEY_DOWN, this.onKey, this);
        }

        onKey(e) {
          if (e.keyCode === KeyCode.KEY_J) {
            this.basicAttack();
          }

          for (var i = 0; i < this.skills.length; i++) {
            if (e.keyCode === this.skills[i].key) this.useSkill(i);
          }
        }

        update(dt) {
          if (this.attackCooldown > 0) this.attackCooldown -= dt;

          for (var i = 0; i < this.cooldowns.length; i++) {
            if (this.cooldowns[i] > 0) {
              this.cooldowns[i] -= dt;
              if (this.cooldowns[i] < 0) this.cooldowns[i] = 0;
              (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
                error: Error()
              }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
                error: Error()
              }), GameEvents) : GameEvents).SKILL_COOLDOWN_CHANGED, i, this.cooldowns[i], this.skills[i].cooldown);
            }
          }
        }

        getForward() {
          var e = new Vec3();
          Quat.toEuler(e, this.node.worldRotation);
          var r = e.y * Math.PI / 180;
          return new Vec3(Math.sin(r), 0, Math.cos(r));
        }

        findEnemiesInArc(origin, fwd, range, halfAngleDeg) {
          if (halfAngleDeg === void 0) {
            halfAngleDeg = 60;
          }

          var res = [];
          var cosA = Math.cos(halfAngleDeg * Math.PI / 180);

          for (var en of this.enemies) {
            if (!en || !en.isValid || en.dead) continue;
            var p = en.node.worldPosition;
            var dx = p.x - origin.x,
                dz = p.z - origin.z;
            var d = Math.hypot(dx, dz);
            if (d > range) continue;
            var dot = (dx * fwd.x + dz * fwd.z) / Math.max(0.0001, d);
            if (dot >= cosA) res.push(en);
          }

          return res;
        }

        findEnemiesInRadius(center, radius) {
          var res = [];

          for (var en of this.enemies) {
            if (!en || !en.isValid || en.dead) continue;
            var p = en.node.worldPosition;
            var d = Math.hypot(p.x - center.x, p.z - center.z);
            if (d <= radius) res.push(en);
          }

          return res;
        }

        basicAttack() {
          if (!this.stats || this.attackCooldown > 0) return;
          this.attackCooldown = 0.35;
          var fwd = this.getForward();
          var targets = this.findEnemiesInArc(this.node.worldPosition, fwd, 2.2, 55);
          var dmg = this.stats.attack;

          for (var t of targets) t.takeDamage(dmg, this.node.worldPosition);

          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).SKILL_USED, -1, 'Attack');
        }

        useSkill(i) {
          if (!this.stats) return;
          var skill = this.skills[i];
          if (!skill) return;
          if (this.cooldowns[i] > 0) return;
          if (skill.mpCost > 0 && !this.stats.useMP(skill.mpCost)) return;
          this.cooldowns[i] = skill.cooldown;
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).SKILL_USED, i, skill.name);
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).SKILL_COOLDOWN_CHANGED, i, this.cooldowns[i], skill.cooldown);
          var baseDmg = this.stats.attack * skill.damageMul;
          var fwd = this.getForward();
          var origin = this.node.worldPosition;

          switch (skill.id) {
            case 'slash':
              {
                var targets = this.findEnemiesInArc(origin, fwd, skill.range, 50);

                for (var t of targets) t.takeDamage(baseDmg, origin);

                break;
              }

            case 'whirl':
              {
                var _targets = this.findEnemiesInRadius(origin, skill.aoeRadius);

                for (var _t of _targets) _t.takeDamage(baseDmg, origin);

                break;
              }

            case 'fire':
              {
                // pick best forward target
                var arc = this.findEnemiesInArc(origin, fwd, skill.range, 35);
                var center = arc.length ? arc.reduce((a, b) => {
                  var da = Vec3.squaredDistance(origin, a.node.worldPosition);
                  var db = Vec3.squaredDistance(origin, b.node.worldPosition);
                  return da < db ? a : b;
                }).node.worldPosition.clone() : new Vec3(origin.x + fwd.x * skill.range, origin.y, origin.z + fwd.z * skill.range);

                var _targets2 = this.findEnemiesInRadius(center, skill.aoeRadius);

                for (var _t2 of _targets2) _t2.takeDamage(baseDmg, origin);

                break;
              }

            case 'heal':
              {
                this.stats.heal(40);
                break;
              }
          }
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=f7e5ba7600c7a0affad48d5e0517ff2ec3ebf0f4.js.map