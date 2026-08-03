System.register(["__unresolved_0", "cc", "cc/env", "__unresolved_1"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, Node, Vec3, Color, Graphics, Enum, CCFloat, CCBoolean, EDITOR, TangentMode, BezierMode, cubicBezierTangent, autoTangent, ArcLengthTable, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _class4, _class5, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _crd, ccclass, property, executeInEditMode, requireComponent, menu, disallowMultiple, IN_HANDLE, OUT_HANDLE, RoadSplineKnot, RoadSpline;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfTangentMode(extras) {
    _reporterNs.report("TangentMode", "./SplineMath", _context.meta, extras);
  }

  function _reportPossibleCrUseOfBezierMode(extras) {
    _reporterNs.report("BezierMode", "./SplineMath", _context.meta, extras);
  }

  function _reportPossibleCrUseOfcubicBezierTangent(extras) {
    _reporterNs.report("cubicBezierTangent", "./SplineMath", _context.meta, extras);
  }

  function _reportPossibleCrUseOfautoTangent(extras) {
    _reporterNs.report("autoTangent", "./SplineMath", _context.meta, extras);
  }

  function _reportPossibleCrUseOfBezierSegment(extras) {
    _reporterNs.report("BezierSegment", "./SplineMath", _context.meta, extras);
  }

  function _reportPossibleCrUseOfArcLengthTable(extras) {
    _reporterNs.report("ArcLengthTable", "./SplineMath", _context.meta, extras);
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
      Node = _cc.Node;
      Vec3 = _cc.Vec3;
      Color = _cc.Color;
      Graphics = _cc.Graphics;
      Enum = _cc.Enum;
      CCFloat = _cc.CCFloat;
      CCBoolean = _cc.CCBoolean;
    }, function (_ccEnv) {
      EDITOR = _ccEnv.EDITOR;
    }, function (_unresolved_2) {
      TangentMode = _unresolved_2.TangentMode;
      BezierMode = _unresolved_2.BezierMode;
      cubicBezierTangent = _unresolved_2.cubicBezierTangent;
      autoTangent = _unresolved_2.autoTangent;
      ArcLengthTable = _unresolved_2.ArcLengthTable;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "58c2e7QHOlJL4c2OuQQ0/pj", "RoadSpline", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node', 'Vec3', 'Color', 'Graphics', 'Enum', 'CCFloat', 'CCBoolean']);

      ({
        ccclass,
        property,
        executeInEditMode,
        requireComponent,
        menu,
        disallowMultiple
      } = _decorator);
      IN_HANDLE = '__inHandle';
      OUT_HANDLE = '__outHandle';
      /**
       * Per-knot authoring data. Lives in a parallel array to the spline node's child
       * nodes: child[i].position is the knot position, _knots[i] is its tangent data.
       * (Kept as data instead of on the child node so adding/removing points stays cheap.)
       */

      _export("RoadSplineKnot", RoadSplineKnot = (_dec = ccclass('RoadSplineKnot'), _dec2 = property({
        type: Enum(_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
          error: Error()
        }), TangentMode) : TangentMode),
        tooltip: 'AutoSmooth: tự bo cong qua điểm | Linear: thẳng | Bezier: kéo tay cầm'
      }), _dec3 = property({
        type: Enum(_crd && BezierMode === void 0 ? (_reportPossibleCrUseOfBezierMode({
          error: Error()
        }), BezierMode) : BezierMode),
        tooltip: 'Chỉ dùng khi mode = Bezier. Quan hệ giữa 2 tay cầm.',

        visible() {
          return this.mode === (_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
            error: Error()
          }), TangentMode) : TangentMode).Bezier;
        }

      }), _dec4 = property({
        visible: false
      }), _dec5 = property({
        visible: false
      }), _dec(_class = (_class2 = class RoadSplineKnot {
        constructor() {
          _initializerDefineProperty(this, "mode", _descriptor, this);

          _initializerDefineProperty(this, "bezierMode", _descriptor2, this);

          /** Out control point OFFSET (relative to the knot position, in spline-local space). */
          _initializerDefineProperty(this, "outTangent", _descriptor3, this);

          /** In control point OFFSET (relative to the knot position, in spline-local space). */
          _initializerDefineProperty(this, "inTangent", _descriptor4, this);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "mode", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return (_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
            error: Error()
          }), TangentMode) : TangentMode).AutoSmooth;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "bezierMode", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return (_crd && BezierMode === void 0 ? (_reportPossibleCrUseOfBezierMode({
            error: Error()
          }), BezierMode) : BezierMode).Mirrored;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "outTangent", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return new Vec3();
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "inTangent", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return new Vec3();
        }
      })), _class2)) || _class));
      /**
       * RoadSpline — Unity-Splines-style path you author directly in the Scene view.
       *
       * WORKFLOW (no JSON anywhere — the path is saved inside the scene/prefab):
       *  1. Add this component to an empty node (it auto-adds a Graphics for the preview).
       *     Place that node under a 2D Canvas so the preview line renders.
       *  2. Use the "Add Knot" button (or just add child nodes) to create control points,
       *     then drag those child nodes in the Scene view to shape the road.
       *  3. Each knot defaults to AutoSmooth (curve passes through it). Switch a knot to
       *     Linear for a sharp corner, or Bezier to fine-tune with draggable handles.
       *  4. Point a SplineFollower at this component to drive the bus along the path.
       *
       * Every direct child node of this node is treated as a knot, in sibling order.
       */


      _export("RoadSpline", RoadSpline = (_dec6 = ccclass('RoadSpline'), _dec7 = executeInEditMode(true), _dec8 = requireComponent(Graphics), _dec9 = menu('Spline/RoadSpline'), _dec10 = property({
        tooltip: 'Nối điểm cuối về điểm đầu (đường vòng kín).'
      }), _dec11 = property({
        type: CCFloat,
        range: [0, 2, 0.05],
        slide: true,
        tooltip: 'Độ căng của tangent tự động (AutoSmooth). 1 = Catmull-Rom chuẩn.'
      }), _dec12 = property({
        type: [RoadSplineKnot],
        tooltip: 'Dữ liệu tangent của từng knot (song song với các node con).'
      }), _dec13 = property({
        group: {
          name: 'Preview'
        },
        tooltip: 'Vẽ đường cong cả khi chạy game (mặc định chỉ vẽ trong editor).'
      }), _dec14 = property({
        group: {
          name: 'Preview'
        }
      }), _dec15 = property({
        group: {
          name: 'Preview'
        },
        type: CCFloat,
        range: [1, 30, 1]
      }), _dec16 = property({
        group: {
          name: 'Preview'
        },
        type: CCFloat,
        range: [4, 64, 1],
        tooltip: 'Số đoạn vẽ mỗi segment. Cao hơn = mượt hơn.'
      }), _dec17 = property({
        group: {
          name: 'Preview'
        },
        type: CCFloat,
        range: [0, 40, 1],
        tooltip: 'Bán kính chấm tròn đánh dấu knot (0 = ẩn).'
      }), _dec18 = property({
        group: {
          name: 'Preview'
        },
        tooltip: 'Hiện tay cầm Bezier (đường + ô vuông).'
      }), _dec19 = property({
        group: {
          name: 'Tools'
        },
        type: CCBoolean,
        tooltip: 'Thêm 1 knot mới ở cuối đường.'
      }), _dec20 = property({
        group: {
          name: 'Tools'
        },
        type: CCBoolean,
        tooltip: 'Xoá knot cuối cùng.'
      }), _dec21 = property({
        group: {
          name: 'Tools'
        },
        type: CCBoolean,
        tooltip: 'Đặt tất cả knot về AutoSmooth (xoá tay cầm thủ công).'
      }), _dec6(_class4 = _dec7(_class4 = _dec8(_class4 = disallowMultiple(_class4 = _dec9(_class4 = (_class5 = class RoadSpline extends Component {
        constructor() {
          super(...arguments);

          // ---- Shape --------------------------------------------------------------
          _initializerDefineProperty(this, "closed", _descriptor5, this);

          _initializerDefineProperty(this, "tension", _descriptor6, this);

          _initializerDefineProperty(this, "knots", _descriptor7, this);

          // ---- Preview (editor) ---------------------------------------------------
          _initializerDefineProperty(this, "showInGame", _descriptor8, this);

          _initializerDefineProperty(this, "lineColor", _descriptor9, this);

          _initializerDefineProperty(this, "lineWidth", _descriptor10, this);

          _initializerDefineProperty(this, "samplesPerSegment", _descriptor11, this);

          _initializerDefineProperty(this, "knotRadius", _descriptor12, this);

          _initializerDefineProperty(this, "showHandles", _descriptor13, this);

          // ---- Runtime / internal -------------------------------------------------
          this._segments = [];
          this._lut = new (_crd && ArcLengthTable === void 0 ? (_reportPossibleCrUseOfArcLengthTable({
            error: Error()
          }), ArcLengthTable) : ArcLengthTable)();
          this._gfx = null;
        }

        // ---- Editor buttons (boolean checkbox = action trigger) -----------------
        get addKnot() {
          return false;
        }

        set addKnot(_v) {
          if (EDITOR) this._addKnotAtEnd();
        }

        get removeLastKnot() {
          return false;
        }

        set removeLastKnot(_v) {
          if (EDITOR) this._removeLastKnot();
        }

        get resetToSmooth() {
          return false;
        }

        set resetToSmooth(_v) {
          if (EDITOR) this._resetAllToSmooth();
        }

        /** Total arc length of the path (world units). */
        get length() {
          return this._lut.length;
        }
        /** Number of knots currently on the spline. */


        get knotCount() {
          return this.node.children.length;
        }
        /** Number of Bezier segments (n-1, or n if closed). */


        get segmentCount() {
          return this._segments.length;
        } // ---- Lifecycle ----------------------------------------------------------


        onLoad() {
          this._gfx = this.getComponent(Graphics);
          this.rebuild();

          if (!EDITOR && !this.showInGame) {
            var _this$_gfx;

            (_this$_gfx = this._gfx) == null || _this$_gfx.clear();
          }
        }

        onEnable() {
          this.rebuild();
        }

        update() {
          // Editor: live-rebuild so dragging knots/handles updates the curve instantly.
          // Runtime: only if the preview is explicitly requested.
          if (EDITOR || this.showInGame) {
            this.rebuild();
          }
        } // ---- Public evaluation API ---------------------------------------------

        /**
         * Position on the curve at the global parameter u in [0,1] (uniform over
         * segments, NOT arc length). Use getPointAtDistance for constant speed.
         */


        getPoint(u, out) {
          out = out || new Vec3();
          var segs = this._segments;
          var n = segs.length;

          if (n === 0) {
            var first = this.node.children[0];
            return first ? out.set(first.position) : out.set(0, 0, 0);
          }

          u = u < 0 ? 0 : u > 1 ? 1 : u;
          var g = u * n;
          var i = Math.floor(g);
          if (i >= n) i = n - 1;
          var t = g - i;
          var s = segs[i]; // inline cubic bezier (position)

          var v = 1 - t,
              vv = v * v,
              tt = t * t;
          var a = vv * v,
              b = 3 * vv * t,
              c = 3 * v * tt,
              d = tt * t;
          out.x = a * s.p0.x + b * s.p1.x + c * s.p2.x + d * s.p3.x;
          out.y = a * s.p0.y + b * s.p1.y + c * s.p2.y + d * s.p3.y;
          out.z = a * s.p0.z + b * s.p1.z + c * s.p2.z + d * s.p3.z;
          return out;
        }
        /** Normalised tangent (unit direction of travel) at global parameter u in [0,1]. */


        getTangent(u, out) {
          out = out || new Vec3();
          var segs = this._segments;
          var n = segs.length;
          if (n === 0) return out.set(1, 0, 0);
          u = u < 0 ? 0 : u > 1 ? 1 : u;
          var g = u * n;
          var i = Math.floor(g);
          if (i >= n) i = n - 1;
          var t = g - i;
          var s = segs[i];
          (_crd && cubicBezierTangent === void 0 ? (_reportPossibleCrUseOfcubicBezierTangent({
            error: Error()
          }), cubicBezierTangent) : cubicBezierTangent)(s.p0, s.p1, s.p2, s.p3, t, out);
          var len = out.length();
          return len > 1e-6 ? out.multiplyScalar(1 / len) : out.set(1, 0, 0);
        }
        /** Position at an arc-length distance from the start (0..length). Constant speed. */


        getPointAtDistance(dist, out) {
          return this.getPoint(this._lut.distanceToU(dist), out);
        }
        /** Normalised tangent at an arc-length distance from the start. */


        getTangentAtDistance(dist, out) {
          return this.getTangent(this._lut.distanceToU(dist), out);
        } // ---- Build --------------------------------------------------------------

        /** Re-sync knot data with child nodes, recompute Bezier segments + arc-length table, redraw. */


        rebuild() {
          this._syncKnotData();

          this._computeTangents();

          this._buildSegments();

          this._lut.build(this._segments, Math.max(2, Math.floor(this.samplesPerSegment)));

          if (EDITOR || this.showInGame) {
            this._draw();
          }
        }
        /** Keep the knots[] data array the same length as the child-node list. */


        _syncKnotData() {
          var count = this.node.children.length;
          var k = this.knots;
          if (k.length > count) k.length = count;

          while (k.length < count) k.push(new RoadSplineKnot());
        }

        _computeTangents() {
          var children = this.node.children;
          var n = children.length;
          var k = this.knots;

          for (var i = 0; i < n; i++) {
            var knot = k[i];
            var cur = children[i].position;
            var node = children[i];

            switch (knot.mode) {
              case (_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
                error: Error()
              }), TangentMode) : TangentMode).Linear:
                this._removeHandles(node);

                knot.outTangent.set(0, 0, 0);
                knot.inTangent.set(0, 0, 0);
                break;

              case (_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
                error: Error()
              }), TangentMode) : TangentMode).Bezier:
                this._readBezierHandles(node, knot);

                break;

              case (_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
                error: Error()
              }), TangentMode) : TangentMode).AutoSmooth:
              default:
                {
                  this._removeHandles(node);

                  var hasPrev = this.closed || i > 0;
                  var hasNext = this.closed || i < n - 1;
                  var prev = children[(i - 1 + n) % n].position;
                  var next = children[(i + 1) % n].position;
                  (_crd && autoTangent === void 0 ? (_reportPossibleCrUseOfautoTangent({
                    error: Error()
                  }), autoTangent) : autoTangent)(prev, cur, next, hasPrev, hasNext, this.tension, knot.outTangent);
                  Vec3.negate(knot.inTangent, knot.outTangent);
                  break;
                }
            }
          }
        }

        _buildSegments() {
          var children = this.node.children;
          var n = children.length;
          var k = this.knots;
          var segCount = n < 2 ? 0 : this.closed ? n : n - 1;
          var segs = this._segments;
          segs.length = 0;

          for (var i = 0; i < segCount; i++) {
            var a = children[i].position;
            var b = children[(i + 1) % n].position;
            var ka = k[i];
            var kb = k[(i + 1) % n];
            segs.push({
              p0: a.clone(),
              p1: new Vec3(a.x + ka.outTangent.x, a.y + ka.outTangent.y, a.z + ka.outTangent.z),
              p2: new Vec3(b.x + kb.inTangent.x, b.y + kb.inTangent.y, b.z + kb.inTangent.z),
              p3: b.clone()
            });
          }
        } // ---- Bezier handle child-node management --------------------------------


        _findChild(node, name) {
          var c = node.children;

          for (var i = 0; i < c.length; i++) if (c[i].name === name) return c[i];

          return null;
        }

        _removeHandles(node) {
          var _this$_findChild, _this$_findChild2;

          if (!EDITOR) return;
          (_this$_findChild = this._findChild(node, IN_HANDLE)) == null || _this$_findChild.destroy();
          (_this$_findChild2 = this._findChild(node, OUT_HANDLE)) == null || _this$_findChild2.destroy();
        }
        /** Read (or create) the draggable handle nodes and fold them into the knot data. */


        _readBezierHandles(node, knot) {
          var out = this._findChild(node, OUT_HANDLE);

          var inn = this._findChild(node, IN_HANDLE);

          if (EDITOR && (!out || !inn)) {
            // First time this knot becomes Bezier: seed handles from current tangents
            // (or a sensible default so they aren't sitting on top of the knot).
            if (knot.outTangent.lengthSqr() < 1e-4 && knot.inTangent.lengthSqr() < 1e-4) {
              knot.outTangent.set(120, 0, 0);
              knot.inTangent.set(-120, 0, 0);
            }

            if (!out) {
              out = new Node(OUT_HANDLE);
              node.addChild(out);
              out.setPosition(knot.outTangent);
            }

            if (!inn) {
              inn = new Node(IN_HANDLE);
              node.addChild(inn);
              inn.setPosition(knot.inTangent);
            }
          }

          if (out) Vec3.copy(knot.outTangent, out.position);
          if (inn) Vec3.copy(knot.inTangent, inn.position); // Couple the handles per BezierMode (out-handle is the master).

          if (out) {
            if (knot.bezierMode === (_crd && BezierMode === void 0 ? (_reportPossibleCrUseOfBezierMode({
              error: Error()
            }), BezierMode) : BezierMode).Mirrored) {
              var _inn;

              Vec3.negate(knot.inTangent, knot.outTangent);
              (_inn = inn) == null || _inn.setPosition(knot.inTangent);
            } else if (knot.bezierMode === (_crd && BezierMode === void 0 ? (_reportPossibleCrUseOfBezierMode({
              error: Error()
            }), BezierMode) : BezierMode).Aligned) {
              var inLen = knot.inTangent.length();
              var outLen = knot.outTangent.length();

              if (outLen > 1e-4) {
                var _inn2;

                Vec3.multiplyScalar(knot.inTangent, knot.outTangent, -inLen / outLen);
                (_inn2 = inn) == null || _inn2.setPosition(knot.inTangent);
              }
            } // Broken: leave in/out independent.

          }
        } // ---- Editor button actions ---------------------------------------------


        _addKnotAtEnd() {
          var children = this.node.children;
          var n = children.length;
          var node = new Node('Knot_' + n);
          this.node.addChild(node); // Place the new knot a step beyond the current end, continuing its direction.

          var pos = new Vec3();

          if (n >= 2) {
            var last = children[n - 1].position;
            var prev = children[n - 2].position;
            Vec3.subtract(pos, last, prev);
            if (pos.lengthSqr() < 1e-4) pos.set(150, 0, 0);
            Vec3.add(pos, last, pos);
          } else if (n === 1) {
            Vec3.add(pos, children[0].position, new Vec3(150, 0, 0));
          }

          node.setPosition(pos);
          this.knots.push(new RoadSplineKnot());
          this.rebuild();
        }

        _removeLastKnot() {
          var children = this.node.children;
          if (children.length === 0) return;
          children[children.length - 1].destroy();
          this.knots.pop(); // child list updates next frame after destroy; rebuild then via update()
        }

        _resetAllToSmooth() {
          for (var knot of this.knots) knot.mode = (_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
            error: Error()
          }), TangentMode) : TangentMode).AutoSmooth;

          for (var child of this.node.children) this._removeHandles(child);

          this.rebuild();
        } // ---- Drawing ------------------------------------------------------------


        _draw() {
          var g = this._gfx || (this._gfx = this.getComponent(Graphics));
          if (!g) return;
          g.clear();
          var children = this.node.children;
          var n = children.length;
          if (n === 0) return; // 1) the curve itself

          if (this._segments.length > 0) {
            g.lineWidth = this.lineWidth;
            g.strokeColor = this.lineColor;
            var total = this._segments.length;
            var stepsPerSeg = Math.max(2, Math.floor(this.samplesPerSegment));
            var p = new Vec3();
            this.getPoint(0, p);
            g.moveTo(p.x, p.y);
            var totalSteps = total * stepsPerSeg;

            for (var s = 1; s <= totalSteps; s++) {
              this.getPoint(s / totalSteps, p);
              g.lineTo(p.x, p.y);
            }

            g.stroke();
          } // 2) Bezier handles (lines + square caps)


          if (this.showHandles) {
            g.lineWidth = Math.max(1, this.lineWidth * 0.4);
            g.strokeColor = new Color(120, 120, 255, 200);

            for (var i = 0; i < n; i++) {
              var knot = this.knots[i];
              if (!knot || knot.mode !== (_crd && TangentMode === void 0 ? (_reportPossibleCrUseOfTangentMode({
                error: Error()
              }), TangentMode) : TangentMode).Bezier) continue;
              var c = children[i].position;
              var o = knot.outTangent,
                  inn = knot.inTangent;
              g.moveTo(c.x, c.y);
              g.lineTo(c.x + o.x, c.y + o.y);
              g.moveTo(c.x, c.y);
              g.lineTo(c.x + inn.x, c.y + inn.y);
              g.stroke();
              var hs = Math.max(4, this.knotRadius * 0.6);
              g.fillColor = new Color(120, 120, 255, 255);
              g.rect(c.x + o.x - hs / 2, c.y + o.y - hs / 2, hs, hs);
              g.fill();
              g.rect(c.x + inn.x - hs / 2, c.y + inn.y - hs / 2, hs, hs);
              g.fill();
            }
          } // 3) knot markers


          if (this.knotRadius > 0) {
            for (var _i = 0; _i < n; _i++) {
              var _c = children[_i].position; // first knot green, last knot red, others white

              if (_i === 0) g.fillColor = new Color(60, 220, 90, 255);else if (_i === n - 1 && !this.closed) g.fillColor = new Color(230, 70, 70, 255);else g.fillColor = new Color(255, 255, 255, 255);
              g.circle(_c.x, _c.y, this.knotRadius);
              g.fill();
            }
          }
        }

      }, (_descriptor5 = _applyDecoratedDescriptor(_class5.prototype, "closed", [_dec10], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return false;
        }
      }), _descriptor6 = _applyDecoratedDescriptor(_class5.prototype, "tension", [_dec11], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 1;
        }
      }), _descriptor7 = _applyDecoratedDescriptor(_class5.prototype, "knots", [_dec12], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return [];
        }
      }), _descriptor8 = _applyDecoratedDescriptor(_class5.prototype, "showInGame", [_dec13], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return false;
        }
      }), _descriptor9 = _applyDecoratedDescriptor(_class5.prototype, "lineColor", [_dec14], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return new Color(80, 200, 120, 255);
        }
      }), _descriptor10 = _applyDecoratedDescriptor(_class5.prototype, "lineWidth", [_dec15], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 6;
        }
      }), _descriptor11 = _applyDecoratedDescriptor(_class5.prototype, "samplesPerSegment", [_dec16], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 24;
        }
      }), _descriptor12 = _applyDecoratedDescriptor(_class5.prototype, "knotRadius", [_dec17], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return 12;
        }
      }), _descriptor13 = _applyDecoratedDescriptor(_class5.prototype, "showHandles", [_dec18], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return true;
        }
      }), _applyDecoratedDescriptor(_class5.prototype, "addKnot", [_dec19], Object.getOwnPropertyDescriptor(_class5.prototype, "addKnot"), _class5.prototype), _applyDecoratedDescriptor(_class5.prototype, "removeLastKnot", [_dec20], Object.getOwnPropertyDescriptor(_class5.prototype, "removeLastKnot"), _class5.prototype), _applyDecoratedDescriptor(_class5.prototype, "resetToSmooth", [_dec21], Object.getOwnPropertyDescriptor(_class5.prototype, "resetToSmooth"), _class5.prototype)), _class5)) || _class4) || _class4) || _class4) || _class4) || _class4));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=b8dcb3cd38a277b676292ff5ccc5f79f00647f56.js.map