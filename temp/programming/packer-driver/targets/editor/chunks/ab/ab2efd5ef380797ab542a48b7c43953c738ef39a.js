System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, Vec3, ArcLengthTable, _crd, TangentMode, BezierMode, _v0, _v1, _v2, _v3;

  /**
   * Evaluate a cubic Bezier segment at t in [0,1].
   * p0/p3 are the segment endpoints, p1/p2 the control points.
   */
  function cubicBezier(p0, p1, p2, p3, t, out) {
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    const a = uu * u; // (1-t)^3

    const b = 3 * uu * t; // 3(1-t)^2 t

    const c = 3 * u * tt; // 3(1-t) t^2

    const d = tt * t; // t^3

    out.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x;
    out.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y;
    out.z = a * p0.z + b * p1.z + c * p2.z + d * p3.z;
    return out;
  }
  /**
   * First derivative (un-normalised tangent / velocity) of a cubic Bezier at t.
   * Direction of travel along the curve; not unit length.
   */


  function cubicBezierTangent(p0, p1, p2, p3, t, out) {
    const u = 1 - t;
    const a = 3 * u * u; // 3(1-t)^2

    const b = 6 * u * t; // 6(1-t)t

    const c = 3 * t * t; // 3t^2

    out.x = a * (p1.x - p0.x) + b * (p2.x - p1.x) + c * (p3.x - p2.x);
    out.y = a * (p1.y - p0.y) + b * (p2.y - p1.y) + c * (p3.y - p2.y);
    out.z = a * (p1.z - p0.z) + b * (p2.z - p1.z) + c * (p3.z - p2.z);
    return out;
  }
  /**
   * Auto-smooth (Catmull-Rom) out-tangent OFFSET for a knot, given its neighbours.
   * Returns the vector you add to the knot position to get Bezier control point P1.
   * The in-tangent offset is simply the negation of this.
   *
   * Standard Catmull-Rom -> Bezier conversion uses (next - prev) / 6; `tension`
   * scales the handle length (1 = classic Catmull-Rom).
   */


  function autoTangent(prev, cur, next, hasPrev, hasNext, tension, out) {
    if (hasPrev && hasNext) {
      Vec3.subtract(out, next, prev);
      Vec3.multiplyScalar(out, out, tension / 6);
    } else if (hasNext) {
      // start endpoint: aim a third of the way toward the next knot
      Vec3.subtract(out, next, cur);
      Vec3.multiplyScalar(out, out, tension / 3);
    } else if (hasPrev) {
      // end endpoint: extend the incoming direction
      Vec3.subtract(out, cur, prev);
      Vec3.multiplyScalar(out, out, tension / 3);
    } else {
      out.set(0, 0, 0);
    }

    return out;
  }
  /** A baked Bezier segment: 4 control points ready to evaluate. */

  /** Arc-length lookup entry mapping a cumulative distance to a global curve parameter u in [0,1]. */


  _export({
    cubicBezier: cubicBezier,
    cubicBezierTangent: cubicBezierTangent,
    autoTangent: autoTangent,
    ArcLengthTable: void 0
  });

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      Vec3 = _cc.Vec3;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c932bSBX2NFCJ+F+DZIGNr0", "SplineMath", undefined);

      /**
       * Tangent behaviour of a single knot — mirrors Unity's Splines package.
       *  - AutoSmooth: tangents are computed from the neighbouring knots (Catmull-Rom).
       *                Just place points and the curve passes through them smoothly. (default)
       *  - Linear:     no tangents -> straight segment in/out of the knot.
       *  - Bezier:     tangents are authored by hand via draggable handles (in/out offsets).
       */
      __checkObsolete__(['Vec3']);

      _export("TangentMode", TangentMode = /*#__PURE__*/function (TangentMode) {
        TangentMode[TangentMode["AutoSmooth"] = 0] = "AutoSmooth";
        TangentMode[TangentMode["Linear"] = 1] = "Linear";
        TangentMode[TangentMode["Bezier"] = 2] = "Bezier";
        return TangentMode;
      }({}));
      /** How the two Bezier handles of a knot relate to each other. */


      _export("BezierMode", BezierMode = /*#__PURE__*/function (BezierMode) {
        BezierMode[BezierMode["Mirrored"] = 0] = "Mirrored";
        BezierMode[BezierMode["Aligned"] = 1] = "Aligned";
        BezierMode[BezierMode["Broken"] = 2] = "Broken";
        return BezierMode;
      }({}));

      _v0 = new Vec3();
      _v1 = new Vec3();
      _v2 = new Vec3();
      _v3 = new Vec3();

      /**
       * Arc-length table built from a list of Bezier segments. Lets a follower travel
       * at a constant speed (distance) instead of a uniform parameter (which bunches up
       * on tight curves).
       */
      _export("ArcLengthTable", ArcLengthTable = class ArcLengthTable {
        constructor() {
          this._entries = [];
          this._length = 0;
        }

        get length() {
          return this._length;
        }
        /**
         * @param segments  baked Bezier segments in order
         * @param perSeg    samples per segment (higher = more accurate length)
         */


        build(segments, perSeg) {
          this._entries.length = 0;
          this._length = 0;
          const segCount = segments.length;

          if (segCount === 0) {
            this._entries.push({
              dist: 0,
              u: 0
            });

            return;
          }

          const prev = _v0;
          const cur = _v1;
          let first = true;

          for (let s = 0; s < segCount; s++) {
            const seg = segments[s];

            for (let i = 0; i <= perSeg; i++) {
              // skip the shared joint between consecutive segments
              if (s > 0 && i === 0) continue;
              const localT = i / perSeg;
              cubicBezier(seg.p0, seg.p1, seg.p2, seg.p3, localT, cur);
              const globalU = (s + localT) / segCount;

              if (first) {
                this._entries.push({
                  dist: 0,
                  u: 0
                });

                Vec3.copy(prev, cur);
                first = false;
                continue;
              }

              this._length += Vec3.distance(prev, cur);

              this._entries.push({
                dist: this._length,
                u: globalU
              });

              Vec3.copy(prev, cur);
            }
          }
        }
        /** Convert a distance along the curve into the global parameter u in [0,1]. */


        distanceToU(dist) {
          const entries = this._entries;
          const n = entries.length;
          if (n === 0) return 0;
          if (dist <= 0) return entries[0].u;
          if (dist >= this._length) return entries[n - 1].u; // binary search for the segment containing `dist`

          let lo = 0;
          let hi = n - 1;

          while (lo < hi - 1) {
            const mid = lo + hi >> 1;
            if (entries[mid].dist < dist) lo = mid;else hi = mid;
          }

          const a = entries[lo];
          const b = entries[hi];
          const span = b.dist - a.dist;
          const f = span > 1e-6 ? (dist - a.dist) / span : 0;
          return a.u + (b.u - a.u) * f;
        }

      });

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=ab2efd5ef380797ab542a48b7c43953c738ef39a.js.map