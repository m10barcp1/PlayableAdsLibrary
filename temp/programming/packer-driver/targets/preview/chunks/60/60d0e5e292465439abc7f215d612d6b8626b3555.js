System.register(["__unresolved_0", "cc"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, _crd, QuestList;

  function _reportPossibleCrUseOfEnemyKind(extras) {
    _reporterNs.report("EnemyKind", "../enemies/Enemy", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "3a928uRY6hMLZE0hEr9AJeu", "Quests", undefined);

      _export("QuestList", QuestList = [// Main quest line
      {
        id: 'm1_goblin_threat',
        title: '[Main] The Goblin Threat',
        description: 'Goblins are raiding the outskirts. Slay 5 goblins to protect the village.',
        isMain: true,
        giverNpcId: 'elder',
        objectives: [{
          type: 'kill',
          target: 'goblin',
          required: 5,
          current: 0
        }],
        reward: {
          exp: 80,
          gold: 50,
          items: [{
            id: 'iron_sword',
            count: 1
          }]
        },
        state: 'available'
      }, {
        id: 'm2_lost_amulet',
        title: '[Main] The Lost Amulet',
        description: 'A skeleton stole the village\'s sacred amulet. Recover it from the ruins.',
        isMain: true,
        giverNpcId: 'elder',
        objectives: [{
          type: 'collect',
          itemId: 'lost_amulet',
          required: 1
        }],
        reward: {
          exp: 150,
          gold: 100,
          items: [{
            id: 'amulet_vital',
            count: 1
          }]
        },
        state: 'available',
        prerequisite: 'm1_goblin_threat'
      }, {
        id: 'm3_dark_knight',
        title: '[Main] The Dark Knight',
        description: 'A Dark Knight haunts the southern field. Defeat him to end the curse.',
        isMain: true,
        giverNpcId: 'elder',
        objectives: [{
          type: 'kill',
          target: 'boss',
          required: 1,
          current: 0
        }],
        reward: {
          exp: 500,
          gold: 500,
          items: [{
            id: 'plate_armor',
            count: 1
          }]
        },
        state: 'available',
        prerequisite: 'm2_lost_amulet'
      }, // Side quests
      {
        id: 's1_wolf_pelts',
        title: '[Side] Wolves at the Door',
        description: 'The hunter needs 3 wolf pelts.',
        isMain: false,
        giverNpcId: 'hunter',
        objectives: [{
          type: 'collect',
          itemId: 'wolf_pelt',
          required: 3
        }],
        reward: {
          exp: 60,
          gold: 40,
          items: [{
            id: 'leather_vest',
            count: 1
          }, {
            id: 'leather_boots',
            count: 1
          }]
        },
        state: 'available'
      }, {
        id: 's2_bone_shards',
        title: '[Side] Boneyard Cleanup',
        description: 'Collect 5 bone shards for the priest.',
        isMain: false,
        giverNpcId: 'priest',
        objectives: [{
          type: 'collect',
          itemId: 'skeleton_bone',
          required: 5
        }],
        reward: {
          exp: 80,
          gold: 60,
          items: [{
            id: 'health_potion',
            count: 3
          }, {
            id: 'mana_potion',
            count: 2
          }]
        },
        state: 'available'
      }, {
        id: 's3_orc_tusks',
        title: '[Side] Orcish Trophies',
        description: 'The blacksmith wants 2 orc tusks to forge a weapon.',
        isMain: false,
        giverNpcId: 'blacksmith',
        objectives: [{
          type: 'collect',
          itemId: 'orc_tusk',
          required: 2
        }],
        reward: {
          exp: 120,
          gold: 80,
          items: [{
            id: 'knight_blade',
            count: 1
          }]
        },
        state: 'available'
      }, {
        id: 's4_merchant_supply',
        title: '[Side] Merchant\'s Supply',
        description: 'Bring 5 goblin ears to the merchant.',
        isMain: false,
        giverNpcId: 'merchant',
        objectives: [{
          type: 'collect',
          itemId: 'goblin_ear',
          required: 5
        }],
        reward: {
          exp: 60,
          gold: 100,
          items: [{
            id: 'ring_might',
            count: 1
          }]
        },
        state: 'available'
      }]);

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=60d0e5e292465439abc7f215d612d6b8626b3555.js.map