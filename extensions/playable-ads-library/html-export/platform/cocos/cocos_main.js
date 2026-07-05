"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../core/config/config"));
const cache_1 = __importDefault(require("./cache"));
const build_1 = __importDefault(require("../../core/build"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class cocos_main {
    constructor(s_version, s_input_dir, cb) {
        this.s_version = s_version;
        this.s_input_dir = s_input_dir;
        this.cb = cb;
        const c = cache_1.default.get();
        config_1.default.is_obfuscator = c.enable_obfuscator;
        // override cấu hình từ settings/super-html.json (nếu có)
        if (typeof c.landscape_enable === "boolean") {
            config_1.default.landscape.enable = c.landscape_enable;
        }
        if (c.landscape_bg_color) {
            config_1.default.landscape.bg_color = c.landscape_bg_color;
        }
        if (c.html_title_prefix) {
            config_1.default.html_title_prefix = c.html_title_prefix;
        }
        // option chọn từ popup panel (settings/super-html-options.json) - ưu tiên cao nhất
        const ui = this._read_ui_options();
        if (typeof ui.landscape_enable === "boolean") {
            config_1.default.landscape.enable = ui.landscape_enable;
        }
        if (typeof ui.enable_obfuscator === "boolean") {
            config_1.default.is_obfuscator = ui.enable_obfuscator;
        }
        // nạp ảnh từ project, resize nhỏ rồi nhúng base64
        try {
            this._load_images();
        }
        catch (error) {
            console.error(error);
        }
        const path_out_dir = path_1.default.join(s_input_dir, "../", "super-html");
        new build_1.default(s_version, s_input_dir, path_out_dir, cb);
    }
    _get_project_path() {
        try {
            //@ts-ignore
            return Editor.Project.path || Editor.projectPath;
        }
        catch (error) {
            // fallback: build dir nằm tại <project>/build/web-mobile -> lùi 2 cấp
            return path_1.default.join(this.s_input_dir, "../", "../");
        }
    }
    /** Đọc option chọn từ popup panel: settings/super-html-options.json */
    _read_ui_options() {
        try {
            const p = path_1.default.join(this._get_project_path(), "settings", "super-html-options.json");
            if (fs_1.default.existsSync(p)) {
                return JSON.parse(fs_1.default.readFileSync(p, "utf8"));
            }
        }
        catch (error) {
            console.warn("[super-html] đọc super-html-options.json lỗi:", error && error.message);
        }
        return {};
    }
    /**
     * Tìm file ảnh trong project theo rel_path nhưng KHÔNG phụ thuộc phần đuôi:
     * nếu đúng file không tồn tại thì thử các đuôi ảnh phổ biến cùng tên, rồi
     * quét thư mục tìm file cùng tên (bất kỳ đuôi nào). Trả "" nếu không có.
     */
    _resolve_image_path(rel_path) {
        const full = path_1.default.join(this._get_project_path(), rel_path);
        if (fs_1.default.existsSync(full)) {
            return full;
        }
        const dir = path_1.default.dirname(full);
        const base = path_1.default.basename(full, path_1.default.extname(full));
        const exts = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"];
        for (const ext of exts) {
            const cand = path_1.default.join(dir, base + ext);
            if (fs_1.default.existsSync(cand)) {
                return cand;
            }
        }
        try {
            if (fs_1.default.existsSync(dir)) {
                const prefix = base.toLowerCase() + ".";
                const found = fs_1.default.readdirSync(dir).find((f) => {
                    const n = f.toLowerCase();
                    return n.startsWith(prefix) && /\.(png|jpe?g|webp|bmp|gif)$/.test(n);
                });
                if (found) {
                    return path_1.default.join(dir, found);
                }
            }
        }
        catch (error) { }
        return "";
    }
    /** Đọc 1 file ảnh trong project, resize theo width rồi trả về data-uri PNG */
    _load_image_data_uri(rel_path, px) {
        const full = this._resolve_image_path(rel_path);
        if (!full) {
            console.warn("[super-html] image not found, skip:", path_1.default.join(this._get_project_path(), rel_path));
            return "";
        }
        try {
            // dùng electron nativeImage để resize, tránh nhúng nguyên ảnh gốc (vài MB)
            const { nativeImage } = require("electron");
            let img = nativeImage.createFromPath(full);
            const sz = img.getSize();
            if (px && sz.width > px) {
                // chỉ set width -> nativeImage tự giữ tỉ lệ khung hình
                img = img.resize({ width: px, quality: "good" });
            }
            return "data:image/png;base64," + img.toPNG().toString("base64");
        }
        catch (error) {
            console.warn("[super-html] resize image failed, skip:", rel_path, error && error.message);
            return "";
        }
    }
    _load_images() {
        const land = config_1.default.landscape;
        if (land && land.enable) {
            land.logo_base64 = this._load_image_data_uri(land.logo_file, land.logo_px);
        }
        const fav = config_1.default.favicon;
        if (fav && fav.enable) {
            fav.base64 = this._load_image_data_uri(fav.file, fav.px);
        }
    }
}
exports.default = cocos_main;
