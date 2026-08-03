System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, Node, Vec3, Color, createPrimitiveNode, Palette, _crd;

  // Builds a medieval-style 3D environment procedurally using primitives.
  // Returns the root world node. Player ground plane at y=0.
  function buildWorld() {
    var root = new Node('World'); // === GROUND ===

    var ground = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Ground', 'box', new Vec3(220, 0.5, 220), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).grass);
    ground.setPosition(0, -0.25, 0);
    root.addChild(ground); // Patches of darker grass / dirt for visual variety

    for (var i = 0; i < 40; i++) {
      var ang = Math.random() * Math.PI * 2;
      var r = 20 + Math.random() * 80;
      var x = Math.cos(ang) * r,
          z = Math.sin(ang) * r;
      var size = 4 + Math.random() * 8;
      var c = Math.random() < 0.5 ? (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).grassDark : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).dirt;
      var patch = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Patch', 'box', new Vec3(size, 0.06, size), c);
      patch.setPosition(x, 0.01, z);
      patch.setRotationFromEuler(0, Math.random() * 360, 0);
      root.addChild(patch);
    } // === VILLAGE (center) ===


    var village = new Node('Village');
    root.addChild(village); // Village square stone platform

    var square = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Square', 'cylinder', new Vec3(14, 0.2, 14), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    square.setPosition(0, 0.05, 6);
    village.addChild(square); // Houses around the village

    var housePositions = [{
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

    for (var h of housePositions) village.addChild(buildHouse(h.x, h.z, h.rot)); // Central well


    village.addChild(buildWell(0, 6)); // Lampposts (torches)

    var lampSpots = [[-7, 6], [7, 6], [-7, 14], [7, 14], [0, 0]];

    for (var [_x, _z] of lampSpots) village.addChild(buildTorch(_x, _z)); // Village wall (low fence)


    var wallPieces = 18;

    for (var _i = 0; _i < wallPieces; _i++) {
      var t = _i / wallPieces * Math.PI * 2;
      var _r = 17;

      var _x2 = Math.cos(t) * _r,
          _z2 = 6 + Math.sin(t) * _r; // Skip wall on south side to create entrance


      if (Math.abs(_x2) < 4 && _z2 < 0) continue;
      var post = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Fence', 'box', new Vec3(0.4, 1.2, 0.4), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).woodDark);
      post.setPosition(_x2, 0.6, _z2);
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

    var lake = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Lake', 'cylinder', new Vec3(18, 0.15, 18), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).water);
    lake.setPosition(-65, 0.02, 60);
    root.addChild(lake); // === ROADS (dirt paths from village to each zone) ===

    var roadDirs = [{
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

    for (var _r2 of roadDirs) {
      var rad = _r2.ang * Math.PI / 180;
      var segs = 14;

      for (var _i2 = 1; _i2 <= segs; _i2++) {
        var d = _i2 / segs * _r2.len;

        var _x3 = Math.cos(rad) * d;

        var _z3 = 6 + Math.sin(rad) * d;

        var tile = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
          error: Error()
        }), createPrimitiveNode) : createPrimitiveNode)('Road', 'box', new Vec3(2.5, 0.05, 2.5), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
          error: Error()
        }), Palette) : Palette).dirt);
        tile.setPosition(_x3, 0.02, _z3);
        root.addChild(tile);
      }
    } // === SKYBOX-LIKE BACKGROUND CYLINDER (distant mountains) ===


    for (var _i3 = 0; _i3 < 20; _i3++) {
      var _ang = _i3 / 20 * Math.PI * 2;

      var _x4 = Math.cos(_ang) * 110,
          _z4 = 6 + Math.sin(_ang) * 110;

      var _h = 12 + Math.random() * 14;

      var mtn = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Mountain', 'cone', new Vec3(14, _h, 14), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stoneDark);
      mtn.setPosition(_x4, _h / 2, _z4);
      root.addChild(mtn);
    }

    return root;
  }

  function buildHouse(x, z, rotY) {
    if (rotY === void 0) {
      rotY = 0;
    }

    var house = new Node('House');
    house.setPosition(x, 0, z);
    house.setRotationFromEuler(0, rotY, 0); // Wooden walls

    var walls = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Walls', 'box', new Vec3(4, 3, 4), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).wood);
    walls.setPosition(0, 1.5, 0);
    house.addChild(walls); // Wood beams (cross pattern decoration)

    var beam1 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Beam1', 'box', new Vec3(4.1, 0.2, 0.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    beam1.setPosition(0, 2.5, 2.05);
    house.addChild(beam1);
    var beam2 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Beam2', 'box', new Vec3(0.2, 3, 0.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    beam2.setPosition(-1.5, 1.5, 2.05);
    house.addChild(beam2);
    var beam3 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Beam3', 'box', new Vec3(0.2, 3, 0.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    beam3.setPosition(1.5, 1.5, 2.05);
    house.addChild(beam3); // Roof (pyramid)

    var roof = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Roof', 'cone', new Vec3(5.5, 2.2, 5.5), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).roof);
    roof.setPosition(0, 4.1, 0);
    house.addChild(roof); // Door

    var door = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Door', 'box', new Vec3(0.8, 1.6, 0.1), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    door.setPosition(0, 0.8, 2.05);
    house.addChild(door); // Window

    var win = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Window', 'box', new Vec3(0.6, 0.6, 0.1), new Color(120, 180, 220));
    win.setPosition(1.3, 2, 2.05);
    house.addChild(win); // Chimney

    var chim = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Chimney', 'box', new Vec3(0.6, 1.8, 0.6), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    chim.setPosition(1.2, 4.5, -1.2);
    house.addChild(chim);
    return house;
  }

  function buildWell(x, z) {
    var well = new Node('Well');
    well.setPosition(x, 0, z);
    var base = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('WellBase', 'cylinder', new Vec3(1.6, 1, 1.6), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    base.setPosition(0, 0.5, 0);
    well.addChild(base);
    var water = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Water', 'cylinder', new Vec3(1.3, 0.05, 1.3), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).water);
    water.setPosition(0, 1.01, 0);
    well.addChild(water);
    var post1 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Post1', 'box', new Vec3(0.18, 2, 0.18), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).wood);
    post1.setPosition(-0.9, 2, 0);
    well.addChild(post1);
    var post2 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Post2', 'box', new Vec3(0.18, 2, 0.18), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).wood);
    post2.setPosition(0.9, 2, 0);
    well.addChild(post2);
    var top = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Top', 'box', new Vec3(2.2, 0.15, 1.4), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).roof);
    top.setPosition(0, 3.05, 0);
    well.addChild(top);
    return well;
  }

  function buildTorch(x, z) {
    var t = new Node('Torch');
    t.setPosition(x, 0, z);
    var pole = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Pole', 'cylinder', new Vec3(0.15, 2.4, 0.15), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    pole.setPosition(0, 1.2, 0);
    t.addChild(pole);
    var flame = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Flame', 'sphere', new Vec3(0.45, 0.45, 0.45), new Color(255, 160, 50));
    flame.setPosition(0, 2.6, 0);
    t.addChild(flame);
    return t;
  }

  function spawnTreeCluster(root, cx, cz, count, radius) {
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var r = Math.random() * radius;
      var x = cx + Math.cos(ang) * r;
      var z = cz + Math.sin(ang) * r;
      root.addChild(buildTree(x, z));
    }
  }

  function buildTree(x, z) {
    var t = new Node('Tree');
    t.setPosition(x, 0, z);
    var trunk = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Trunk', 'cylinder', new Vec3(0.6, 3, 0.6), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).woodDark);
    trunk.setPosition(0, 1.5, 0);
    t.addChild(trunk);
    var leaves1 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Leaves1', 'sphere', new Vec3(2.8, 2.8, 2.8), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).grassDark);
    leaves1.setPosition(0, 3.6, 0);
    t.addChild(leaves1);
    var leaves2 = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Leaves2', 'sphere', new Vec3(2.2, 2.2, 2.2), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).grass);
    leaves2.setPosition(0.4, 4.4, 0.3);
    t.addChild(leaves2);
    return t;
  }

  function spawnRocks(root, cx, cz, count) {
    for (var i = 0; i < count; i++) {
      var ang = Math.random() * Math.PI * 2;
      var r = Math.random() * 14;
      var x = cx + Math.cos(ang) * r;
      var z = cz + Math.sin(ang) * r;
      var s = 0.6 + Math.random() * 1.8;
      var color = Math.random() < 0.5 ? (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stone : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stoneDark;
      var rock = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Rock', 'sphere', new Vec3(s, s * 0.7, s), color);
      rock.setPosition(x, s * 0.3, z);
      rock.setRotationFromEuler(Math.random() * 360, Math.random() * 360, Math.random() * 360);
      root.addChild(rock);
    }
  }

  function buildRuins(x, z) {
    var r = new Node('Ruins');
    r.setPosition(x, 0, z);
    var floor = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('RuinFloor', 'box', new Vec3(10, 0.2, 10), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stoneDark);
    floor.setPosition(0, 0.1, 0);
    r.addChild(floor); // Broken pillars at corners

    var corners = [[-4, -4], [4, -4], [-4, 4], [4, 4]];

    for (var [cx, cz] of corners) {
      var h = 2 + Math.random() * 2;
      var pillar = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
        error: Error()
      }), createPrimitiveNode) : createPrimitiveNode)('Pillar', 'cylinder', new Vec3(0.8, h, 0.8), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
        error: Error()
      }), Palette) : Palette).stone);
      pillar.setPosition(cx, h / 2, cz);
      r.addChild(pillar);
    } // A broken arch


    var archL = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('ArchL', 'box', new Vec3(0.7, 3, 0.7), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    archL.setPosition(-1.5, 1.5, 0);
    r.addChild(archL);
    var archR = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('ArchR', 'box', new Vec3(0.7, 3, 0.7), (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).stone);
    archR.setPosition(1.5, 1.5, 0);
    r.addChild(archR);
    var archTop = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
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