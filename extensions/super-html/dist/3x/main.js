"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
//@ts-ignore
const package_json_1 = __importDefault(require("../../package.json"));
// trạng thái pause của preview Game View (để Ctrl+W toggle pause/resume)
let _scene_paused = false;
/**
 * @en
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    open_panel() {
        Editor.Panel.open(package_json_1.default.name);
    },
    async turn_off(){
        console.log('NVTHAN');
        //Editor.Panel.open("nvthan.main_panel");

        const type = Editor.Selection.getLastSelectedType();
	    if(type !== 'node') {
		    return;
	    }
	    const uuid = Editor.Selection.getLastSelected(type);
        const node = await Editor.Message.request('scene', 'query-node', uuid);
        const active = node.active;
        Editor.Message.send('scene', 'set-property', {
            "uuid" : uuid,
            "path" : `active`,
            "dump": {
                "type": 'Boolean',
                "value" : false
            }
        });
    },
    async turn_on() {
        console.log('NVTHAN');
        //Editor.Panel.open("nvthan.main_panel");

        const type = Editor.Selection.getLastSelectedType();
	    if(type !== 'node') {
		    return;
	    }
	    const uuid = Editor.Selection.getLastSelected(type);
        const node = await Editor.Message.request('scene', 'query-node', uuid);
        const active = node.active;
        Editor.Message.send('scene', 'set-property', {
            "uuid" : uuid,
            "path" : `active`,
            "dump": {
                "type": 'Boolean',
                "value" : true
            }
        });
    },
    async delete_node() {
        const type = Editor.Selection.getLastSelectedType();
	    if(type !== 'node') {
		    return;
	    }
	    const uuid = Editor.Selection.getLastSelected(type);
        const node = await Editor.Message.request('scene', 'query-node', uuid);
        const active = node.active;
        Editor.Message.send('scene', 'remove-node', {
            "uuid" : uuid,
        });
    },
    // Ctrl+M: mở Scene chính (launch scene)
    // Tự dò scene chính theo từng project (không hardcode đường dẫn):
    //   1) start scene đã cấu hình trong Build Settings (builder.json)
    //   2) fallback: quét toàn bộ .scene của project, ưu tiên scene tên 'main'
    async open_main_scene() {
        const candidates = [];
        // 1) start scene từ Build Settings (đúng "scene chính" của mọi project)
        try {
            const fs = require("fs");
            const path = require("path");
            const proj = Editor.Project.path || Editor.projectPath;
            const cfg_path = path.join(proj, "profiles", "v2", "packages", "builder.json");
            if (fs.existsSync(cfg_path)) {
                const data = JSON.parse(fs.readFileSync(cfg_path, "utf8"));
                const task_map = (data.BuildTaskManager && data.BuildTaskManager.taskMap) || {};
                Object.values(task_map)
                    .filter((t) => t && t.options && t.options.startScene)
                    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
                    .forEach((t) => candidates.push(t.options.startScene));
            }
        }
        catch (error) {
            console.warn("[super-html] đọc start scene từ builder.json lỗi:", error && error.message);
        }
        // 2) fallback: quét toàn bộ scene trong project (ưu tiên scene tên 'main')
        try {
            const scenes = await Editor.Message.request("asset-db", "query-assets", { pattern: "db://assets/**/*.scene" });
            if (Array.isArray(scenes) && scenes.length) {
                const url_of = (s) => s.url || s.source || s.path || "";
                scenes
                    .filter((s) => /(^|\/)main\.scene$/i.test(url_of(s)))
                    .forEach((s) => s.uuid && candidates.push(s.uuid));
                scenes.forEach((s) => s.uuid && candidates.push(s.uuid));
            }
        }
        catch (error) {
            console.warn("[super-html] query scene lỗi:", error && error.message);
        }
        // mở scene đầu tiên hợp lệ
        const seen = new Set();
        for (const uuid of candidates) {
            if (!uuid || seen.has(uuid)) {
                continue;
            }
            seen.add(uuid);
            try {
                await Editor.Message.request("scene", "open-scene", uuid);
                return;
            }
            catch (error) {
                console.warn("[super-html] mở scene lỗi (" + uuid + "):", error && error.message);
            }
        }
        console.error("[super-html] không tìm thấy scene hợp lệ nào để mở trong project này");
    },
    // Ctrl+Q: Play - chạy game trong editor (Game View preview)
    async play_scene() {
        try {
            await Editor.Message.request("scene", "editor-preview-set-play", true);
            _scene_paused = false;
        }
        catch (error) {
            console.error("[super-html] play scene lỗi:", error && error.message);
        }
    },
    // Ctrl+W: Pause - tạm dừng/tiếp tục preview đang chạy (toggle)
    async pause_scene() {
        try {
            _scene_paused = !_scene_paused;
            await Editor.Message.request("scene", "editor-preview-call-method", "pause", _scene_paused);
        }
        catch (error) {
            console.error("[super-html] pause scene lỗi:", error && error.message);
        }
    },
    // Ctrl+E: Stop - dừng preview Game View
    async stop_scene() {
        try {
            await Editor.Message.request("scene", "editor-preview-set-play", false);
            _scene_paused = false;
        }
        catch (error) {
            console.error("[super-html] stop scene lỗi:", error && error.message);
        }
    },
    // Ctrl+B: build web-mobile. Cocos 3.8 không có message 'builder:build';
    // thử lần lượt command-build (kiểu CLI) -> add-task (kiểu panel) -> mở bảng Build.
    async build_project() {
        // đọc options build đã lưu (task build gần nhất đã chạy thành công)
        let options = null;
        try {
            const fs = require("fs");
            const path = require("path");
            const cfg_path = path.join(Editor.Project.path, "profiles", "v2", "packages", "builder.json");
            if (fs.existsSync(cfg_path)) {
                const data = JSON.parse(fs.readFileSync(cfg_path, "utf8"));
                const task_map = data.BuildTaskManager && data.BuildTaskManager.taskMap;
                if (task_map) {
                    const tasks = Object.values(task_map).filter((t) => t && t.type === "build" && t.options);
                    tasks.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
                    if (tasks.length) {
                        options = Object.assign({}, tasks[0].options);
                        delete options.logDest; // để builder tự tạo log mới
                    }
                }
            }
        }
        catch (error) {
            console.warn("[super-html] đọc config build lỗi:", error && error.message);
        }
        const platform = (options && options.platform) || "web-mobile";
        // Dọn các task build cũ cùng platform để bảng Build không bị chồng nhiều card "web-mobile".
        // (add-task luôn tạo task mới; nên xoá task cũ trước rồi mới add 1 cái -> luôn còn đúng 1 card)
        try {
            const info = await Editor.Message.request("builder", "query-tasks-info");
            let list = [];
            if (Array.isArray(info)) {
                list = info;
            }
            else if (info && Array.isArray(info.tasks)) {
                list = info.tasks;
            }
            else if (info && info.taskMap) {
                list = Object.values(info.taskMap);
            }
            else if (info && typeof info === "object") {
                list = Object.values(info);
            }
            const ids = list
                .filter((t) => t && (t.type === "build" || t.options))
                .filter((t) => { const p = (t.options && t.options.platform) || t.platform; return p === platform; })
                .map((t) => t.id || t.taskId)
                .filter(Boolean);
            for (const id of ids) {
                try {
                    await Editor.Message.request("builder", "remove-task", id);
                }
                catch (e) {
                    try { await Editor.Message.request("builder", "remove-task", { "id": id }); } catch (e2) { }
                }
            }
            if (ids.length) {
                console.log("[super-html] đã dọn " + ids.length + " task build cũ (" + platform + ")");
            }
        }
        catch (error) {
            console.warn("[super-html] không dọn được task cũ:", error && error.message);
        }
        // các cách build thử lần lượt: [message, arg]
        // add-task = cơ chế nút Build của panel (dùng đúng options lần build trước)
        // command-build = build kiểu dòng lệnh (fallback)
        const attempts = [];
        if (options) {
            attempts.push(["add-task", options]);
        }
        attempts.push(["command-build", "platform=" + platform]);
        for (const [msg, arg] of attempts) {
            try {
                console.log("[super-html] thử build qua builder:" + msg);
                await Editor.Message.request("builder", msg, arg);
                console.log("[super-html] ĐÃ kích hoạt build (" + msg + ")");
                return;
            }
            catch (error) {
                console.warn("[super-html] builder:" + msg + " lỗi:", error && error.message);
            }
        }
        // fallback: mở bảng Build -> bấm Ctrl+Enter để build
        console.warn("[super-html] không build tự động được, mở bảng Build (bấm Ctrl+Enter để build)");
        try { Editor.Panel.open("builder"); } catch (e) { }
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
const load = function () { };
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
const unload = function () { };
exports.unload = unload;
