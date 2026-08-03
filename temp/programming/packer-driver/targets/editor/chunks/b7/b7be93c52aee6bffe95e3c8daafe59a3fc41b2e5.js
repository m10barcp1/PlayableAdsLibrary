System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, Node, Vec3, Color, createPrimitiveNode, Palette, _crd;

  // Builds a medieval-style 3D environment procedurally using primitives.
  // Returns the root world node. Player ground plane at y=0.
  function buildWorld() {
    const root = new Node('World'); // === GROUND ===

    const ground = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Ground', 'box', new Vec3(220, 0.5, 220), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).grass);
    ground.setPosition(0, -0.25, 0);
    root.addChild(ground); // Patches of darker grass / dirt for visual variety

    for (let i = 0; i < 40; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * 80;
      const x = Math.cos(ang) * r,
            z = Math.sin(ang) * r;
      const size = 4 + Math.random() * 8;
      const c = Math.random() < 0.5 ? (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).grassDark : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).dirt;
      const patch = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Patch', 'box', new Vec3(size, 0.06, size), c);
      patch.setPosition(x, 0.01, z);
      patch.setRotationFromEuler(0, Math.random() * 360, 0);
      root.addChild(patch);
    } // === VILLAGE (center) ===


    const village = new Node('Village');
    root.addChild(village); // Village square stone platform

    const square = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Square', 'cylinder', new Vec3(14, 0.2, 14), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    square.setPosition(0, 0.05, 6);
    village.addChild(square); // Houses around the village

    const housePositions = [{
      x: -10,
      z: 12,
      rot: 25
    }, {
      x: 10,
      z: 12,
      rot: -25
    }, {
      x: -12,
      z: 0,
      rot: 90
    }, {
      x: 12,
      z: 0,
      rot: -90
    }, {
      x: 0,
      z: 16,
      rot: 0
    }];

    for (const h of housePositions) village.addChild(buildHouse(h.x, h.z, h.rot)); // Central well


    village.addChild(buildWell(0, 6)); // Lampposts (torches)

    const lampSpots = [[-7, 6], [7, 6], [-7, 14], [7, 14], [0, 0]];

    for (const [x, z] of lampSpots) village.addChild(buildTorch(x, z)); // Village wall (low fence)


    const wallPieces = 18;

    for (let i = 0; i < wallPieces; i++) {
      const t = i / wallPieces * Math.PI * 2;
      const r = 17;
      const x = Math.cos(t) * r,
            z = 6 + Math.sin(t) * r; // Skip wall on south side to create entrance

      if (Math.abs(x) < 4 && z < 0) continue;
      const post = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Fence', 'box', new Vec3(0.4, 1.2, 0.4), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).woodDark);
      post.setPosition(x, 0.6, z);
      post.setRotationFromEuler(0, t * 180 / Math.PI, 0);
      village.addChild(post);
    } // === FOREST ZONES ===
    // North-west forest


    spawnTreeCluster(root, -55, 30, 14, 22); // North-east forest

    spawnTreeCluster(root, 55, 30, 14, 22); // South forest

    spawnTreeCluster(root, 0, -50, 18, 30); // Far west/east clumps

    spawnTreeCluster(root, -70, -20, 10, 14);
    spawnTreeCluster(root, 70, -20, 10, 14); // === ROCK FORMATIONS ===

    spawnRocks(root, -45, -45, 12);
    spawnRocks(root, 45, -45, 12);
    spawnRocks(root, -45, 45, 10);
    spawnRocks(root, 45, 45, 10);
    spawnRocks(root, 0, -85, 8); // === RUINS (where skeletons spawn) ===

    root.addChild(buildRuins(-40, 40)); // === LAKE / WATER ===

    const lake = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Lake', 'cylinder', new Vec3(18, 0.15, 18), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).water);
    lake.setPosition(-65, 0.02, 60);
    root.addChild(lake); // === ROADS (dirt paths from village to each zone) ===

    const roadDirs = [{
      ang: 225,
      len: 70
    }, {
      ang: 315,
      len: 70
    }, {
      ang: 135,
      len: 70
    }, {
      ang: 45,
      len: 70
    }, {
      ang: 270,
      len: 70
    }];

    for (const r of roadDirs) {
      const rad = r.ang * Math.PI / 180;
      const segs = 14;

      for (let i = 1; i <= segs; i++) {
        const d = i / segs * r.len;
        const x = Math.cos(rad) * d;
        const z = 6 + Math.sin(rad) * d;
        const tile = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
          error: Error()
        }), createPrimitiveNode) : createPrimitiveNode)('Road', 'box', new Vec3(2.5, 0.05, 2.5), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
          error: Error()
        }), Palette) : Palette).dirt);
        tile.setPosition(x, 0.02, z);
        root.addChild(tile);
      }
    } // === SKYBOX-LIKE BACKGROUND CYLINDER (distant mountains) ===


    for (let i = 0; i < 20; i++) {
      const ang = i / 20 * Math.PI * 2;
      const x = Math.cos(ang) * 110,
            z = 6 + Math.sin(ang) * 110;
      const h = 12 + Math.random() * 14;
      const mtn = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Mountain', 'cone', new Vec3(14, h, 14), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stoneDark);
      mtn.setPosition(x, h / 2, z);
      root.addChild(mtn);
    }

    return root;
  }

  function buildHouse(x, z, rotY = 0) {
    const house = new Node('House');
    house.setPosition(x, 0, z);
    house.setRotationFromEuler(0, rotY, 0); // Wooden walls

    const walls = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Walls', 'box', new Vec3(4, 3, 4), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).wood);
    walls.setPosition(0, 1.5, 0);
    house.addChild(walls); // Wood beams (cross pattern decoration)

    const beam1 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Beam1', 'box', new Vec3(4.1, 0.2, 0.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    beam1.setPosition(0, 2.5, 2.05);
    house.addChild(beam1);
    const beam2 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Beam2', 'box', new Vec3(0.2, 3, 0.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    beam2.setPosition(-1.5, 1.5, 2.05);
    house.addChild(beam2);
    const beam3 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Beam3', 'box', new Vec3(0.2, 3, 0.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    beam3.setPosition(1.5, 1.5, 2.05);
    house.addChild(beam3); // Roof (pyramid)

    const roof = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Roof', 'cone', new Vec3(5.5, 2.2, 5.5), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).roof);
    roof.setPosition(0, 4.1, 0);
    house.addChild(roof); // Door

    const door = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Door', 'box', new Vec3(0.8, 1.6, 0.1), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    door.setPosition(0, 0.8, 2.05);
    house.addChild(door); // Window

    const win = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Window', 'box', new Vec3(0.6, 0.6, 0.1), new Color(120, 180, 220));
    win.setPosition(1.3, 2, 2.05);
    house.addChild(win); // Chimney

    const chim = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Chimney', 'box', new Vec3(0.6, 1.8, 0.6), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    chim.setPosition(1.2, 4.5, -1.2);
    house.addChild(chim);
    return house;
  }

  function buildWell(x, z) {
    const well = new Node('Well');
    well.setPosition(x, 0, z);
    const base = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('WellBase', 'cylinder', new Vec3(1.6, 1, 1.6), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    base.setPosition(0, 0.5, 0);
    well.addChild(base);
    const water = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Water', 'cylinder', new Vec3(1.3, 0.05, 1.3), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).water);
    water.setPosition(0, 1.01, 0);
    well.addChild(water);
    const post1 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Post1', 'box', new Vec3(0.18, 2, 0.18), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).wood);
    post1.setPosition(-0.9, 2, 0);
    well.addChild(post1);
    const post2 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Post2', 'box', new Vec3(0.18, 2, 0.18), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).wood);
    post2.setPosition(0.9, 2, 0);
    well.addChild(post2);
    const top = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Top', 'box', new Vec3(2.2, 0.15, 1.4), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).roof);
    top.setPosition(0, 3.05, 0);
    well.addChild(top);
    return well;
  }

  function buildTorch(x, z) {
    const t = new Node('Torch');
    t.setPosition(x, 0, z);
    const pole = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Pole', 'cylinder', new Vec3(0.15, 2.4, 0.15), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    pole.setPosition(0, 1.2, 0);
    t.addChild(pole);
    const flame = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Flame', 'sphere', new Vec3(0.45, 0.45, 0.45), new Color(255, 160, 50));
    flame.setPosition(0, 2.6, 0);
    t.addChild(flame);
    return t;
  }

  function spawnTreeCluster(root, cx, cz, count, radius) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = cx + Math.cos(ang) * r;
      const z = cz + Math.sin(ang) * r;
      root.addChild(buildTree(x, z));
    }
  }

  function buildTree(x, z) {
    const t = new Node('Tree');
    t.setPosition(x, 0, z);
    const trunk = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Trunk', 'cylinder', new Vec3(0.6, 3, 0.6), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    trunk.setPosition(0, 1.5, 0);
    t.addChild(trunk);
    const leaves1 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Leaves1', 'sphere', new Vec3(2.8, 2.8, 2.8), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).grassDark);
    leaves1.setPosition(0, 3.6, 0);
    t.addChild(leaves1);
    const leaves2 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Leaves2', 'sphere', new Vec3(2.2, 2.2, 2.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).grass);
    leaves2.setPosition(0.4, 4.4, 0.3);
    t.addChild(leaves2);
    return t;
  }

  function spawnRocks(root, cx, cz, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 14;
      const x = cx + Math.cos(ang) * r;
      const z = cz + Math.sin(ang) * r;
      const s = 0.6 + Math.random() * 1.8;
      const color = Math.random() < 0.5 ? (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stone : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stoneDark;
      const rock = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Rock', 'sphere', new Vec3(s, s * 0.7, s), color);
      rock.setPosition(x, s * 0.3, z);
      rock.setRotationFromEuler(Math.random() * 360, Math.random() * 360, Math.random() * 360);
      root.addChild(rock);
    }
  }

  function buildRuins(x, z) {
    const r = new Node('Ruins');
    r.setPosition(x, 0, z);
    const floor = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('RuinFloor', 'box', new Vec3(10, 0.2, 10), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stoneDark);
    floor.setPosition(0, 0.1, 0);
    r.addChild(floor); // Broken pillars at corners

    const corners = [[-4, -4], [4, -4], [-4, 4], [4, 4]];

    for (const [cx, cz] of corners) {
      const h = 2 + Math.random() * 2;
      const pillar = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Pillar', 'cylinder', new Vec3(0.8, h, 0.8), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stone);
      pillar.setPosition(cx, h / 2, cz);
      r.addChild(pillar);
    } // A broken arch


    const archL = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('ArchL', 'box', new Vec3(0.7, 3, 0.7), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    archL.setPosition(-1.5, 1.5, 0);
    r.addChild(archL);
    const archR = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('ArchR', 'box', new Vec3(0.7, 3, 0.7), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    archR.setPosition(1.5, 1.5, 0);
    r.addChild(archR);
    const archTop = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('ArchTop', 'box', new Vec3(3.7, 0.6, 0.7), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    archTop.setPosition(0, 3.3, 0);
    r.addChild(archTop);
    return r;
  }

  function _reportPossibleCrUseOfcreatePrimitiveNode(extras) {
    _reporterNs.report("createPrimitiveNode", "../core/PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPalette(extras) {
    _reporterNs.report("Palette", "../core/PrimitiveFactory", _context.meta, extras);
  }

  _export("buildWorld", buildWorld);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      Node = _cc.Node;
      Vec3 = _cc.Vec3;
      Color = _cc.Color;
    }, function (_unresolved_2) {
      createPrimitiveNode = _unresolved_2.createPrimitiveNode;
      Palette = _unresolved_2.Palette;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "08100Wjwz9E4ojcPol4rmWf", "WorldBuilder", undefined);

      __checkObsolete__(['Node', 'Vec3', 'Color', 'Quat']);

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=b7be93c52aee6bffe95e3c8daafe59a3fc41b2e5.js.map