"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cache_1 = __importDefault(require("../../platform/cocos/cache"));
const cocos_main_1 = __importDefault(require("../../platform/cocos/cocos_main"));
const electron_1 = require("electron");
//@ts-ignore
window._tool = {
    cache: cache_1.default,
    build: cocos_main_1.default,
    shell: electron_1.shell,
    fs: fs_1.default,
    path: path_1.default,
    run_preview: () => {
        const s_index_path = path_1.default.join(cache_1.default.get().path, "../", "super-html/common", "index.html");
        electron_1.shell.openExternal(s_index_path);
    }
};
exports.style = `#GameDiv, #Cocos3dGameContainer, #GameCanvas {
    width: 100%;
    height: 100%;
  }
  #super-html-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: rgba(28, 28, 30, 0.88);
    color: #e6e6e6;
    font: 13px/1.4 Helvetica, Arial, sans-serif;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  #super-html-bar input { width: 15px; height: 15px; cursor: pointer; }
  #super-html-bar label { cursor: pointer; user-select: none; }`;
exports.template = `<div id="super-html-bar">
  <input type="checkbox" id="sh-opt-landscape" />
  <label for="sh-opt-landscape">Hiển thị logo 2 bên khi build (chế độ ngang)</label>
</div>
<div id="GameDiv">
<div id="Cocos3dGameContainer">
  <canvas id="GameCanvas" oncontextmenu="event.preventDefault()" tabindex="0"></canvas>
</div>
</div>`;
exports.ready = async function () {
    //@ts-ignore
    let dom = document.getElementById("dock").shadowRoot.childNodes[7].childNodes[0].childNodes[1].childNodes[0].shadowRoot;
    var GameCanvas = dom.getElementById("GameCanvas");
    var GameDiv = dom.getElementById("GameDiv");
    var Cocos3dGameContainer = dom.getElementById("Cocos3dGameContainer");
    // Option: hiển thị logo 2 bên khi build (lưu vào settings/super-html-options.json)
    try {
        const proj = Editor.Project.path || Editor.projectPath;
        const opt_path = path_1.default.join(proj, "settings", "super-html-options.json");
        const read_opt = () => {
            try { if (fs_1.default.existsSync(opt_path)) return JSON.parse(fs_1.default.readFileSync(opt_path, "utf8")); } catch (e) { }
            return {};
        };
        const cb = dom.getElementById("sh-opt-landscape");
        if (cb) {
            const opt = read_opt();
            cb.checked = (opt.landscape_enable !== false); // mặc định bật
            cb.addEventListener("change", () => {
                const cur = read_opt();
                cur.landscape_enable = cb.checked;
                try { fs_1.default.writeFileSync(opt_path, JSON.stringify(cur, null, 2)); }
                catch (e) { console.error("[super-html] lưu option lỗi:", e); }
            });
        }
    }
    catch (e) {
        console.error("[super-html] options bar lỗi:", e);
    }
    const getElementById = document.getElementById;
    document.getElementById = function (str) {
        if (str === "GameCanvas") {
            return GameCanvas;
        }
        getElementById.call(this, str);
    };
    const querySelector = document.querySelector;
    document.querySelector = function (str) {
        if (str === "#GameCanvas") {
            return GameCanvas;
        }
        else if (str === "#GameDiv") {
            return GameDiv;
        }
        else if (str === "#Cocos3dGameContainer") {
            return Cocos3dGameContainer;
        }
        querySelector.call(this, str);
    };
    let txt = fs_1.default.readFileSync(path_1.default.join(__dirname, "../../../static", 'index.html'), "utf8");
    let str_temp = `<script type="text/javascript">`;
    var start = txt.indexOf(str_temp);
    txt = txt.substring(start + str_temp.length);
    txt = txt.replace(/<script type="text\/javascript">/g, "");
    txt = txt.replace(/<\/script>/g, "");
    txt = txt.replace(/<\/body>/g, "");
    txt = txt.replace(/<\/html>/g, "");
    eval.call(window, txt);
};
