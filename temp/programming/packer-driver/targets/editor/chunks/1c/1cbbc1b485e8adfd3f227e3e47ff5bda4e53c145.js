System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Vec3, Quat, Color, EventBus, GameEvents, _dec, _class, _crd, ccclass, EnemyArchetypes, Enemy;

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
      Quat = _cc.Quat;
      Color = _cc.Color;
    }, function (_unresolved_2) {
      EventBus = _unresolved_2.EventBus;
      GameEvents = _unresolved_2.GameEvents;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "defa6MtovtKgp0mqn465IF/", "Enemy", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'Quat', 'Color']);

      ({
        ccclass
      } = _decorator);

      _export("EnemyArchetypes", EnemyArchetypes = {
        goblin: {
          kind: 'goblin',
          name: 'Goblin',
          maxHP: 40,
          attack: 6,
          defense: 2,
          speed: 3.5,
          aggroRadius: 8,
          attackRange: 1.6,
          attackInterval: 1.2,
          expReward: 12,
          goldReward: 5,
          color: new Color(95, 145, 80),
          scale: 0.85,
          drops: [{
            id: 'goblin_ear',
            chance: 0.7
          }, {
            id: 'health_potion',
            chance: 0.15
          }, {
            id: 'rusty_sword',
            chance: 0.05
          }]
        },
        wolf: {
          kind: 'wolf',
          name: 'Dire Wolf',
          maxHP: 50,
          attack: 8,
          defense: 1,
          speed: 5.5,
          aggroRadius: 10,
          attackRange: 1.8,
          attackInterval: 1.0,
          expReward: 18,
          goldReward: 3,
          color: new Color(110, 95, 80),
          scale: 0.9,
          drops: [{
            id: 'wolf_pelt',
            chance: 0.85
          }]
        },
        skeleton: {
          kind: 'skeleton',
          name: 'Skeleton',
          maxHP: 60,
          attack: 10,
          defense: 4,
          speed: 3,
          aggroRadius: 9,
          attackRange: 1.8,
          attackInterval: 1.3,
          expReward: 22,
          goldReward: 8,
          color: new Color(220, 215, 200),
          scale: 1,
          drops: [{
            id: 'skeleton_bone',
            chance: 0.9,
            min: 1,
            max: 2
          }, {
            id: 'iron_sword',
            chance: 0.05
          }]
        },
        orc: {
          kind: 'orc',
          name: 'Orc Warrior',
          maxHP: 110,
          attack: 16,
          defense: 7,
          speed: 3.5,
          aggroRadius: 11,
          attackRange: 2.0,
          attackInterval: 1.5,
          expReward: 40,
          goldReward: 15,
          color: new Color(120, 145, 90),
          scale: 1.15,
          drops: [{
            id: 'orc_tusk',
            chance: 0.8
          }, {
            id: 'chainmail',
            chance: 0.08
          }, {
            id: 'iron_helm',
            chance: 0.08
          }]
        },
        boss: {
          kind: 'boss',
          name: 'Dark Knight',
          maxHP: 500,
          attack: 28,
          defense: 15,
          speed: 3.2,
          aggroRadius: 16,
          attackRange: 2.4,
          attackInterval: 1.6,
          expReward: 250,
          goldReward: 200,
          color: new Color(60, 50, 70),
          scale: 1.5,
          drops: [{
            id: 'dragon_slayer',
            chance: 1
          }, {
            id: 'royal_crown',
            chance: 0.5
          }, {
            id: 'amulet_vital',
            chance: 1
          }]
        }
      });

      _export("Enemy", Enemy = (_dec = ccclass('Enemy'), _dec(_class = class Enemy extends Component {
        constructor(...args) {
          super(...args);
          this.archetype = void 0;
          this.hp = 1;
          this.dead = false;
          this.player = null;
          this.playerStats = null;
          this.playerInventory = null;
          this.attackTimer = 0;
          this.hurtTimer = 0;
          this.knockback = new Vec3();
          this.state = 'idle';
          this.animTime = 0;
          this.bodyParts = null;
        }

        init(arch, player, playerStats, inventory) {
          this.archetype = arch;
          this.hp = arch.maxHP;
          this.player = player;
          this.playerStats = playerStats;
          this.playerInventory = inventory;
        }

        setBodyRefs(parts) {
          this.bodyParts = parts;
        }

        takeDamage(dmg, from) {
          if (this.dead) return;
          const real = Math.max(1, Math.floor(dmg - this.archetype.defense * 0.5));
          this.hp -= real;
          this.hurtTimer = 0.15;
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).ENEMY_DAMAGED, this, real);

          if (from) {
            const p = this.node.worldPosition;
            const dx = p.x - from.x,
                  dz = p.z - from.z;
            const d = Math.hypot(dx, dz) || 1;
            this.knockback.set(dx / d * 4, 0, dz / d * 4);
          }

          if (this.hp <= 0) this.die();
        }

        die() {
          this.dead = true;
          this.state = 'dead';
          (_crd && EventBus === void 0 ? (_reportPossibleCrUseOfEventBus({
            error: Error()
          }), EventBus) : EventBus).emit((_crd && GameEvents === void 0 ? (_reportPossibleCrUseOfGameEvents({
            error: Error()
          }), GameEvents) : GameEvents).ENEMY_DIED, this);

          if (this.playerStats) {
            this.playerStats.gainExp(this.archetype.expReward);
            this.playerStats.addGold(this.archetype.goldReward);
          }

          if (this.playerInventory) {
            for (const drop of this.archetype.drops) {
              if (Math.random() < drop.chance) {
                var _drop$min, _drop$max;

                const min = (_drop$min = drop.min) != null ? _drop$min : 1,
                      max = (_drop$max = drop.max) != null ? _drop$max : min;
                const n = Math.floor(min + Math.random() * (max - min + 1));
                this.playerInventory.addItem(drop.id, n);
              }
            }
          } // Sink and remove


          this.scheduleOnce(() => {
            if (this.node && this.node.isValid) this.node.destroy();
          }, 1.0);
        }

        update(dt) {
          if (this.dead) {
            const p = this.node.position;
            this.node.setPosition(p.x, p.y - 1.5 * dt, p.z);
            return;
          }

          if (!this.player || !this.playerStats) return;
          this.animTime += dt;
          if (this.hurtTimer > 0) this.hurtTimer -= dt;
          const pp = this.player.worldPosition;
          const mp = this.node.worldPosition;
          const dx = pp.x - mp.x,
                dz = pp.z - mp.z;
          const dist = Math.hypot(dx, dz); // Apply knockback

          if (this.knockback.lengthSqr() > 0.01) {
            const np = this.node.position;
            this.node.setPosition(np.x + this.knockback.x * dt, np.y, np.z + this.knockback.z * dt);
            this.knockback.multiplyScalar(0.85);
          }

          if (dist <= this.archetype.attackRange) {
            this.state = 'attack';
            this.attackTimer -= dt;

            if (this.attackTimer <= 0) {
              this.attackTimer = this.archetype.attackInterval;
              this.playerStats.takeDamage(this.archetype.attack);
            }
          } else if (dist <= this.archetype.aggroRadius) {
            this.state = 'chase';
            const nx = dx / dist,
                  nz = dz / dist;
            const np = this.node.position;
            const sp = this.archetype.speed * dt;
            this.node.setPosition(np.x + nx * sp, np.y, np.z + nz * sp); // face player

            const yaw = Math.atan2(nx, nz) * 180 / Math.PI;
            const q = new Quat();
            Quat.fromEuler(q, 0, yaw, 0);
            this.node.setRotation(q);
          } else {
            this.state = 'idle';
          }

          this.animate();
        }

        animate() {
          if (!this.bodyParts) return;
          const moving = this.state === 'chase';
          const swing = moving ? Math.sin(this.animTime * 10) * 30 : 0;
          if (this.bodyParts.l) this.bodyParts.l.setRotationFromEuler(-swing, 0, 0);
          if (this.bodyParts.r) this.bodyParts.r.setRotationFromEuler(swing, 0, 0);
          if (this.bodyParts.lLeg) this.bodyParts.lLeg.setRotationFromEuler(swing, 0, 0);
          if (this.bodyParts.rLeg) this.bodyParts.rLeg.setRotationFromEuler(-swing, 0, 0);

          if (this.state === 'attack' && this.bodyParts.r) {
            const a = Math.sin(this.animTime * 14) * 50 - 30;
            this.bodyParts.r.setRotationFromEuler(a, 0, 0);
          }
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=1cbbc1b485e8adfd3f227e3e47ff5bda4e53c145.js.map