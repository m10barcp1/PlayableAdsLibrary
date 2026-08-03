System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, _crd, ItemDB, RarityColor;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "4c7e883jllH+6o56ZR/CgvH", "Items", undefined);

      _export("ItemDB", ItemDB = {
        // Weapons
        rusty_sword: {
          id: 'rusty_sword',
          name: 'Rusty Sword',
          kind: 'equipment',
          slot: 'weapon',
          rarity: 'common',
          stats: {
            attack: 3
          },
          desc: 'A worn old blade.',
          icon: '🗡️',
          value: 10
        },
        iron_sword: {
          id: 'iron_sword',
          name: 'Iron Sword',
          kind: 'equipment',
          slot: 'weapon',
          rarity: 'uncommon',
          stats: {
            attack: 8
          },
          desc: 'Standard knightly sword.',
          icon: '⚔️',
          value: 60
        },
        knight_blade: {
          id: 'knight_blade',
          name: 'Knight Blade',
          kind: 'equipment',
          slot: 'weapon',
          rarity: 'rare',
          stats: {
            attack: 15,
            hp: 10
          },
          desc: 'Forged for elite knights.',
          icon: '⚔️',
          value: 220
        },
        dragon_slayer: {
          id: 'dragon_slayer',
          name: 'Dragon Slayer',
          kind: 'equipment',
          slot: 'weapon',
          rarity: 'legendary',
          stats: {
            attack: 32,
            hp: 30
          },
          desc: 'Said to fell dragons.',
          icon: '🔱',
          value: 1500
        },
        // Helmets
        cloth_hood: {
          id: 'cloth_hood',
          name: 'Cloth Hood',
          kind: 'equipment',
          slot: 'helmet',
          rarity: 'common',
          stats: {
            defense: 2
          },
          desc: 'Light cloth hood.',
          icon: '🎩',
          value: 8
        },
        iron_helm: {
          id: 'iron_helm',
          name: 'Iron Helm',
          kind: 'equipment',
          slot: 'helmet',
          rarity: 'uncommon',
          stats: {
            defense: 6,
            hp: 10
          },
          desc: 'Sturdy iron helm.',
          icon: '⛑️',
          value: 80
        },
        royal_crown: {
          id: 'royal_crown',
          name: 'Royal Crown',
          kind: 'equipment',
          slot: 'helmet',
          rarity: 'epic',
          stats: {
            defense: 10,
            mp: 20
          },
          desc: 'A king\'s crown.',
          icon: '👑',
          value: 600
        },
        // Armor
        leather_vest: {
          id: 'leather_vest',
          name: 'Leather Vest',
          kind: 'equipment',
          slot: 'armor',
          rarity: 'common',
          stats: {
            defense: 5,
            hp: 10
          },
          desc: 'Basic leather.',
          icon: '🦺',
          value: 20
        },
        chainmail: {
          id: 'chainmail',
          name: 'Chainmail',
          kind: 'equipment',
          slot: 'armor',
          rarity: 'uncommon',
          stats: {
            defense: 12,
            hp: 30
          },
          desc: 'Iron rings.',
          icon: '🥋',
          value: 150
        },
        plate_armor: {
          id: 'plate_armor',
          name: 'Plate Armor',
          kind: 'equipment',
          slot: 'armor',
          rarity: 'rare',
          stats: {
            defense: 22,
            hp: 60
          },
          desc: 'Heavy plate.',
          icon: '🛡️',
          value: 450
        },
        // Boots
        leather_boots: {
          id: 'leather_boots',
          name: 'Leather Boots',
          kind: 'equipment',
          slot: 'boots',
          rarity: 'common',
          stats: {
            defense: 2
          },
          desc: 'Soft leather.',
          icon: '🥾',
          value: 12
        },
        iron_boots: {
          id: 'iron_boots',
          name: 'Iron Boots',
          kind: 'equipment',
          slot: 'boots',
          rarity: 'uncommon',
          stats: {
            defense: 5,
            hp: 10
          },
          desc: 'Heavy iron.',
          icon: '🥾',
          value: 70
        },
        // Rings / Amulets
        ring_might: {
          id: 'ring_might',
          name: 'Ring of Might',
          kind: 'equipment',
          slot: 'ring',
          rarity: 'rare',
          stats: {
            attack: 5
          },
          desc: '+5 attack.',
          icon: '💍',
          value: 200
        },
        amulet_vital: {
          id: 'amulet_vital',
          name: 'Amulet of Vital',
          kind: 'equipment',
          slot: 'amulet',
          rarity: 'rare',
          stats: {
            hp: 40,
            mp: 20
          },
          desc: 'Boost HP/MP.',
          icon: '📿',
          value: 250
        },
        // Consumables
        health_potion: {
          id: 'health_potion',
          name: 'Health Potion',
          kind: 'consumable',
          rarity: 'common',
          heal: 50,
          desc: 'Restore 50 HP.',
          icon: '🧪',
          value: 20,
          stackable: true
        },
        mana_potion: {
          id: 'mana_potion',
          name: 'Mana Potion',
          kind: 'consumable',
          rarity: 'common',
          restoreMp: 30,
          desc: 'Restore 30 MP.',
          icon: '💧',
          value: 25,
          stackable: true
        },
        // Materials
        wolf_pelt: {
          id: 'wolf_pelt',
          name: 'Wolf Pelt',
          kind: 'material',
          rarity: 'common',
          desc: 'Soft wolf fur.',
          icon: '🐺',
          value: 8,
          stackable: true
        },
        goblin_ear: {
          id: 'goblin_ear',
          name: 'Goblin Ear',
          kind: 'material',
          rarity: 'common',
          desc: 'Trophy from goblin.',
          icon: '👂',
          value: 5,
          stackable: true
        },
        orc_tusk: {
          id: 'orc_tusk',
          name: 'Orc Tusk',
          kind: 'material',
          rarity: 'uncommon',
          desc: 'Tough orc tusk.',
          icon: '🦷',
          value: 18,
          stackable: true
        },
        skeleton_bone: {
          id: 'skeleton_bone',
          name: 'Bone Shard',
          kind: 'material',
          rarity: 'common',
          desc: 'Brittle bone.',
          icon: '🦴',
          value: 6,
          stackable: true
        },
        // Quest items
        lost_amulet: {
          id: 'lost_amulet',
          name: 'Lost Amulet',
          kind: 'quest',
          rarity: 'rare',
          desc: 'Belongs to the elder.',
          icon: '🔱',
          value: 0
        }
      });

      _export("RarityColor", RarityColor = {
        common: '#cccccc',
        uncommon: '#5fd35f',
        rare: '#5fa9ff',
        epic: '#cc6bff',
        legendary: '#ffb73a'
      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=7673517bf41a71287c013e942e7d982916207484.js.map