System.register(["__unresolved_0", "cc", "cc/env"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, EDITOR, Asset, js, _decorator, Script, _crd, serializable, property, ccclass, menuPathReg, bh;

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

  function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _reportPossibleCrUseOfICreateAssetMenuItemInfo(extras) {
    _reporterNs.report("ICreateAssetMenuItemInfo", "../../../src/interface", _context.meta, extras);
  }

  _export("bh", void 0);

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      Asset = _cc.Asset;
      js = _cc.js;
      _decorator = _cc._decorator;
      Script = _cc.Script;
    }, function (_ccEnv) {
      EDITOR = _ccEnv.EDITOR;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "92ec6nW85hK3pRCxzJ+nj+u", "index", undefined);

      __checkObsolete__(['Asset', 'Constructor', 'js', '_decorator', 'Script', '__private']);

      ({
        serializable,
        property,
        ccclass
      } = _decorator);

      if (EDITOR) {
        window.tilEditor = window.tilEditor || {};
      }

      menuPathReg = /^((?:[!-\.0-~\x80-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+\/)*(?:[!-~\x80-\x9F\xA1-\u167F\u1681-\u1FFF\u200B-\u2027\u202A-\u202E\u2030-\u205E\u2060-\u2FFF\u3001-\uD7FF\uE000-\uFEFE\uFF00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])+$/;

      (function (_bh, _dec, _dec2, _class, _class2, _descriptor) {
        /**
         * 标记类为scriptable
         * @param name 
         * @returns 
         */
        function scriptable(name) {
          var cccdec = ccclass(name);
          return function (target) {
            var decedClas = cccdec(target);

            if (js.isChildClassOf(decedClas, bh.ScriptableAsset)) {
              // @ts-ignore
              var frame = cc._RF.peek();

              if (frame.uuid) {
                js._setClassId(frame.uuid, decedClas); // end.prototype["__scriptUuid"] = EditorExtends.UuidUtils.decompressUuid(frame.uuid);

              }
            }

            return decedClas;
          };
        }

        _bh.scriptable = scriptable;

        /**
         * 用于ScriptableAsset字段的属性装饰器
         */
        function scriptableAsset(target, propertyKey, descriptorOrInitializer, opt) {
          opt = Object.assign(opt ? opt : {}, {
            type: bh.ScriptableAsset
          });

          if (target && propertyKey) {
            // @scriptableAsset
            property(opt)(target, propertyKey, descriptorOrInitializer);
            return undefined;
          } else if (target === undefined) {
            // @scriptableAsset()
            return property(opt);
          } else if (typeof target === "boolean") {
            //  @scriptableAsset(true|false)
            if (target) {
              opt = Object.assign(opt ? opt : {}, {
                type: [bh.ScriptableAsset]
              });
              return property(opt);
            }

            return property(opt);
          } else {
            //  @scriptableAsset(any)
            return property(opt);
          }
        }

        _bh.scriptableAsset = scriptableAsset;

        function createAssetMenu(fileName, menuPath, desc, order) {
          return function (ctor) {
            // 
            if (!EDITOR) return; // console.log(`注册创建资源菜单项,${fileName},${menuPath}`);

            if (ctor.__$createAssetMenuItemInfo) return; // 判断继承自ScriptableAsset

            if (!(ctor.prototype instanceof ScriptableAsset)) {
              console.error(ctor.name + " \u4E0D\u662FScriptableAsset\u7684\u5B50\u7C7B");
              return;
            } // 判断是否符合路径规则 a/b/c,允许中文


            if (!menuPath || !menuPathReg.test(menuPath)) {
              throw new Error("path is not valid");
              return;
            }

            var className = js.getClassName(ctor);
            var classId = js.getClassId(ctor);

            if (!classId || classId.trim() === "") {
              console.warn("class " + className + " has no classId,please use @bh.scriptable first ,\n                 like @bh.scriptable(\"<ClassName>\")\nclass TestClass");
            }

            ctor.__$createAssetMenuItemInfo = {
              fileName,
              menuPath,
              className,
              classId,
              desc,
              order,
              fileExt: ".sasset"
            }; // 记录一下类名

            var createAssetMenuClassIds = tilEditor.createAssetMenuClassIds;

            if (!createAssetMenuClassIds) {
              tilEditor.createAssetMenuClassIds = createAssetMenuClassIds = [];
            }

            if (!createAssetMenuClassIds.includes(classId)) {
              createAssetMenuClassIds.push(classId);
              EditorExtends.emit("create-asset-menu-added", classId);
            } // console.log(`注册创建资源菜单项完成,${className}`, TI.saEditor);

          };
        }

        _bh.createAssetMenu = createAssetMenu;
        var ScriptableAsset = (_dec = ccclass("ScriptableAsset"), _dec2 = property({
          displayName: "Script",
          type: Script,
          tooltip: "scriptable_asset_script",
          animatable: false
        }), _dec(_class = (_class2 = class ScriptableAsset extends Asset {
          constructor() {
            super(...arguments);

            _initializerDefineProperty(this, "__scriptUuid", _descriptor, this);
          }

          get __scriptAsset() {
            return null;
          }

          static createInstance(clas) {
            return clas ? new clas() : new this();
          }
          /**
           * 运行时保存asset，需要有uuid
           * @param asset 
           */


          static saveAsset(asset) {
            if (EDITOR) {
              if (!asset) console.error("asset is null");
              if (!asset.uuid) console.error("asset uuid is null,please use");
              Editor.Message.request("asset-db", "save-asset", asset.uuid, EditorExtends.serialize(asset));
            } else {
              console.warn("env is not in Editor,please use api in Editor");
            }
          }
          /**
           * 创建指定类型的ScriptableAsset
           * @param assetType 
           * @param filePath 无需后缀
           */


          static createAsset(assetType, filePath) {
            return _asyncToGenerator(function* () {
              if (EDITOR) {
                if (!filePath) {
                  console.error("createAsset path is null");
                  return;
                }

                var pkgJson = require("../../../package.json");

                var pkgName = pkgJson.name || "scriptable-asset";
                var scriptable_asset_ext = pkgJson.__scriptable_asset_ext || ".asset";
                var url = "db://assets/" + filePath + scriptable_asset_ext;
                var uuid = yield Editor.Message.request('scene', 'execute-scene-script', {
                  name: pkgName,
                  method: "createScriptableAsset",
                  args: [url, js.getClassName(assetType)]
                });
                return;
              } else {
                console.warn("env is not in Editor,please use api in Editor");
              }
            })();
          }
          /**
           * 将资源保存到磁盘
           */


          saveAsset() {
            ScriptableAsset.saveAsset(this);
          }

        }, (_applyDecoratedDescriptor(_class2.prototype, "__scriptAsset", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "__scriptAsset"), _class2.prototype), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__scriptUuid", [serializable], {
          configurable: true,
          enumerable: true,
          writable: true,
          initializer: null
        })), _class2)) || _class);
        _bh.ScriptableAsset = ScriptableAsset;
      })(bh || _export("bh", bh = {}));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=07380203ae2d5427ff899a548f0fd1f0f02e3513.js.map