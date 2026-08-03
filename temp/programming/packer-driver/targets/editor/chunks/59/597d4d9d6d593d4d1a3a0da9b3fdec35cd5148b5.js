System.register(["__unresolved_0", "cc", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, Node, Vec3, createPrimitiveNode, Palette, _crd;

  // Build a simple humanoid from primitive boxes/spheres. Root pivot at feet.
  // Returns the root node plus references to body parts for animation.
  function buildHumanoid(name, colors = {}, scale = 1) {
    var _colors$skin, _colors$shirt, _colors$pants, _colors$hair;

    const skin = (_colors$skin = colors.skin) != null ? _colors$skin : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).skin;
    const shirt = (_colors$shirt = colors.shirt) != null ? _colors$shirt : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).cloth;
    const pants = (_colors$pants = colors.pants) != null ? _colors$pants : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).leather;
    const hair = (_colors$hair = colors.hair) != null ? _colors$hair : (_crd && Palette === void 0 ? (_reportPossibleCrUseOfPalette({
      error: Error()
    }), Palette) : Palette).hair;
    const root = new Node(name); // Legs: vertical center near 0.5

    const leftLeg = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('LeftLeg', 'box', new Vec3(0.25, 0.9, 0.25).multiplyScalar(scale), pants);
    leftLeg.setPosition(-0.18 * scale, 0.45 * scale, 0);
    root.addChild(leftLeg);
    const rightLeg = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('RightLeg', 'box', new Vec3(0.25, 0.9, 0.25).multiplyScalar(scale), pants);
    rightLeg.setPosition(0.18 * scale, 0.45 * scale, 0);
    root.addChild(rightLeg); // Torso

    const body = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Body', 'box', new Vec3(0.7, 0.9, 0.4).multiplyScalar(scale), shirt);
    body.setPosition(0, 1.35 * scale, 0);
    root.addChild(body); // Arms

    const leftArm = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('LeftArm', 'box', new Vec3(0.22, 0.8, 0.22).multiplyScalar(scale), shirt);
    leftArm.setPosition(-0.46 * scale, 1.35 * scale, 0);
    root.addChild(leftArm);
    const rightArm = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('RightArm', 'box', new Vec3(0.22, 0.8, 0.22).multiplyScalar(scale), shirt);
    rightArm.setPosition(0.46 * scale, 1.35 * scale, 0);
    root.addChild(rightArm); // Head

    const head = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Head', 'sphere', new Vec3(0.55, 0.55, 0.55).multiplyScalar(scale), skin);
    head.setPosition(0, 2.05 * scale, 0);
    root.addChild(head); // Hair cap on top of head

    const hairCap = (_crd && createPrimitiveNode === void 0 ? (_reportPossibleCrUseOfcreatePrimitiveNode({
      error: Error()
    }), createPrimitiveNode) : createPrimitiveNode)('Hair', 'sphere', new Vec3(0.58, 0.45, 0.58).multiplyScalar(scale), hair);
    hairCap.setPosition(0, 2.18 * scale, -0.02 * scale);
    root.addChild(hairCap); // Weapon slot: empty node attached on right hand

    const weaponSlot = new Node('WeaponSlot');
    weaponSlot.setPosition(0, -0.5 * scale, 0.1 * scale);
    rightArm.addChild(weaponSlot);
    return {
      root,
      body,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      weaponSlot
    };
  }

  function _reportPossibleCrUseOfcreatePrimitiveNode(extras) {
    _reporterNs.report("createPrimitiveNode", "./PrimitiveFactory", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPalette(extras) {
    _reporterNs.report("Palette", "./PrimitiveFactory", _context.meta, extras);
  }

  _export("buildHumanoid", buildHumanoid);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      Node = _cc.Node;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      createPrimitiveNode = _unresolved_2.createPrimitiveNode;
      Palette = _unresolved_2.Palette;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "96548Kc7NRO9qfZ/xzevn8k", "CharacterBuilder", undefined);

      __checkObsolete__(['Node', 'Vec3', 'Color']);

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=597d4d9d6d593d4d1a3a0da9b3fdec35cd5148b5.js.map