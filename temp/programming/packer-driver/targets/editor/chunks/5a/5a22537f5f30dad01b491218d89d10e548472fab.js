System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, Node, MeshRenderer, Material, primitives, utils, Color, EffectAsset, builtinResMgr, _crd, matCache, Palette;

  /** Call this once at game-start (e.g. from GameBootstrap.start) before any
   *  primitives are created so stale cross-session entries are removed. */
  function clearMaterialCache() {
    matCache.clear();
  }
  /**
   * Try to create a Material using a single effect source and set the color
   * on the named property.  Returns null when the effect cannot be resolved
   * (i.e. produces 0 passes), so callers can fall through to the next strategy.
   */


  function tryBuildMat(effectSource, colorProp, color) {
    const mat = new Material();

    if (typeof effectSource === 'string') {
      mat.initialize({
        effectName: effectSource
      });
    } else {
      mat.initialize({
        effectAsset: effectSource
      });
    }

    if (mat.passes.length === 0) return null;
    const c = new Color(color.r, color.g, color.b, color.a);

    for (let i = 0; i < mat.passes.length; i++) {
      mat.setProperty(colorProp, c, i);
    }

    return mat;
  }

  function buildMaterial(color) {
    // Strategy 1 – standard PBR via registered EffectAsset (fastest, most reliable)
    const stdAsset = EffectAsset.get('builtin-standard');

    if (stdAsset) {
      const m = tryBuildMat(stdAsset, 'albedo', color);
      if (m) return m;
    } // Strategy 2 – extract effect from the engine's own default-material


    const baseMat = builtinResMgr.get('default-material');

    if (baseMat != null && baseMat.effectAsset) {
      const m = tryBuildMat(baseMat.effectAsset, 'albedo', color);
      if (m) return m;
    } // Strategy 3 – standard by effectName string (less reliable in editor preview
    // because effect asset may not yet be registered by name)


    {
      const m = tryBuildMat('builtin-standard', 'albedo', color);
      if (m) return m;
    } // Strategy 4 – unlit via registered EffectAsset (simpler, fewer texture deps,
    // avoids the texSubImage2D errors caused by un-loaded PBR textures in preview)

    const unlitAsset = EffectAsset.get('builtin-unlit');

    if (unlitAsset) {
      const m = tryBuildMat(unlitAsset, 'mainColor', color);
      if (m) return m;
    } // Strategy 5 – unlit by effectName string


    {
      const m = tryBuildMat('builtin-unlit', 'mainColor', color);
      if (m) return m;
    } // All strategies failed.  Return the engine's own default-material so nodes
    // render without crashing.  Color will be absent in this last-resort path.

    console.error('[PrimitiveFactory] All effect strategies failed – ' + 'returning default-material (no custom color). ' + 'Check that builtin effects are registered before creating primitives.');
    return baseMat != null ? baseMat : new Material();
  }

  function makeColorMaterial(color) {
    const key = `${color.r}_${color.g}_${color.b}_${color.a}`; // isValid catches destroyed materials; passes.length > 0 catches materials whose
    // effect failed to resolve (isValid stays true but passes are empty – those crash
    // with "Cannot read properties of undefined (reading 'localSetLayout')").

    const cached = matCache.get(key);
    if (cached && cached.isValid && cached.passes.length > 0) return cached;
    const mat = buildMaterial(color); // Cache only custom materials that have valid passes.
    // Do NOT cache the shared default-material fallback: keeping it uncached lets
    // subsequent calls retry buildMaterial once effects become available, and
    // avoids hundreds of MeshRenderer nodes simultaneously sharing one material
    // instance (which causes texSubImage2D errors in the editor preview renderer).

    const defaultMat = builtinResMgr.get('default-material');

    if (mat.passes.length > 0 && mat !== defaultMat) {
      matCache.set(key, mat);
    }

    return mat;
  }

  function createPrimitiveNode(name, kind, size, color) {
    const node = new Node(name);
    const mr = node.addComponent(MeshRenderer);
    let geom;

    switch (kind) {
      case 'box':
        geom = primitives.box({
          width: size.x,
          height: size.y,
          length: size.z
        });
        break;

      case 'sphere':
        geom = primitives.sphere(size.x * 0.5);
        break;

      case 'cylinder':
        geom = primitives.cylinder(size.x * 0.5, size.x * 0.5, size.y);
        break;

      case 'cone':
        geom = primitives.cone(size.x * 0.5, size.y);
        break;

      case 'plane':
        geom = primitives.plane({
          width: size.x,
          length: size.z,
          widthSegments: 1,
          lengthSegments: 1
        });
        break;

      case 'capsule':
        geom = primitives.capsule(size.x * 0.5, size.x * 0.5, size.y);
        break;
    }

    const mesh = utils.MeshUtils.createMesh(geom); // IMPORTANT: assign material BEFORE mesh.
    // Setting mesh first causes MeshRenderer to build SubModels with no/undefined
    // material passes, leading to: "Cannot read properties of undefined (reading 'localSetLayout')"

    mr.material = makeColorMaterial(color);
    mr.mesh = mesh;
    return node;
  } // Medieval color palette


  _export({
    clearMaterialCache: clearMaterialCache,
    makeColorMaterial: makeColorMaterial,
    createPrimitiveNode: createPrimitiveNode
  });

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      Node = _cc.Node;
      MeshRenderer = _cc.MeshRenderer;
      Material = _cc.Material;
      primitives = _cc.primitives;
      utils = _cc.utils;
      Color = _cc.Color;
      EffectAsset = _cc.EffectAsset;
      builtinResMgr = _cc.builtinResMgr;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "e206fOXYONMbpRCYuq1HF0v", "PrimitiveFactory", undefined);

      // Module-level cache of Materials keyed by RGBA string.
      // IMPORTANT: this cache must be cleared between editor Play sessions because
      // Cocos destroys runtime-created assets when Play stops. Returning a destroyed
      // Material produces passes === undefined → "localSetLayout" crash.
      __checkObsolete__(['Node', 'MeshRenderer', 'Material', 'primitives', 'utils', 'Color', 'Vec3', 'EffectAsset', 'builtinResMgr']);

      matCache = new Map();

      _export("Palette", Palette = {
        grass: new Color(82, 120, 60),
        grassDark: new Color(60, 95, 45),
        dirt: new Color(110, 78, 50),
        stone: new Color(140, 138, 130),
        stoneDark: new Color(95, 92, 88),
        wood: new Color(120, 80, 45),
        woodDark: new Color(85, 55, 30),
        roof: new Color(140, 50, 45),
        roofDark: new Color(95, 35, 30),
        water: new Color(60, 110, 165),
        gold: new Color(220, 180, 60),
        iron: new Color(180, 180, 195),
        leather: new Color(120, 80, 55),
        cloth: new Color(180, 170, 140),
        skin: new Color(220, 185, 150),
        hair: new Color(80, 55, 35),
        enemyRed: new Color(170, 60, 60),
        enemyGreen: new Color(95, 145, 80),
        enemyDark: new Color(60, 50, 70),
        npcBlue: new Color(70, 110, 170),
        questYellow: new Color(255, 215, 0)
      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=5a22537f5f30dad01b491218d89d10e548472fab.js.map