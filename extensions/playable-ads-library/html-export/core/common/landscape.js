"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @zh
 * Xử lý layout khi playable hiển thị ở chế độ NGANG (landscape).
 * - Game (thiết kế dọc) được letterbox thành khung dọc ở giữa thông qua
 *   ResolutionPolicy.SHOW_ALL của engine (engine tự canh giữa canvas).
 * - 2 khoảng trống trái/phải được tô màu nền + gắn logo của project.
 * - Khi quay về DỌC (portrait) thì khôi phục policy gốc -> game full màn hình,
 *   ẩn logo. Không sửa bất kỳ resource nào của game, chỉ chạy lúc runtime.
 *
 * Hàm RUNTIME bên dưới được serialize bằng toString() và nhúng thẳng vào HTML,
 * nó chỉ đọc cấu hình từ window.__SUPER_LANDSCAPE_OPT__ nên hoàn toàn tự chứa.
 */
const RUNTIME = function () {
    var OPT = window.__SUPER_LANDSCAPE_OPT__ || {};
    if (!OPT.enable) {
        return;
    }
    var logoL = null, logoR = null, origPolicy = null;
    function applyBg() {
        try {
            if (OPT.bg) {
                document.documentElement.style.background = OPT.bg;
                document.body.style.background = OPT.bg;
            }
        }
        catch (e) { }
    }
    function ensureLogos() {
        if (!OPT.logo || logoL || !document.body) {
            return;
        }
        var make = function () {
            var im = document.createElement("img");
            im.src = OPT.logo;
            im.setAttribute("alt", "");
            var st = im.style;
            st.position = "fixed";
            st.pointerEvents = "none";
            st.transform = "translate(-50%, -50%)";
            st.display = "none";
            st.objectFit = "contain";
            st.userSelect = "none";
            st.zIndex = "10";
            document.body.appendChild(im);
            return im;
        };
        logoL = make();
        logoR = make();
    }
    function getCC() {
        return (typeof window.cc !== "undefined") ? window.cc : null;
    }
    function clearBg() {
        try {
            document.documentElement.style.background = "";
            document.body.style.background = "";
        }
        catch (e) { }
    }
    function layout() {
        ensureLogos();
        var cc = getCC();
        if (!cc || !cc.view || typeof cc.view.setDesignResolutionSize !== "function") {
            return;
        }
        if (origPolicy === null) {
            try {
                origPolicy = cc.view.getResolutionPolicy();
            }
            catch (e) { }
        }
        var dr = cc.view.getDesignResolutionSize();
        var dw = (dr && dr.width) || 1080;
        var dh = (dr && dr.height) || 1920;
        var w = window.innerWidth, h = window.innerHeight;
        var landscape = w > h;
        if (landscape) {
            // chỉ tô nền (xanh) khi đã ở chế độ ngang VÀ engine đã sẵn sàng
            // -> không còn "nháy xanh" trước khi game load.
            applyBg();
            var showAll = (cc.ResolutionPolicy && cc.ResolutionPolicy.SHOW_ALL != null) ? cc.ResolutionPolicy.SHOW_ALL : 2;
            try {
                cc.view.setDesignResolutionSize(dw, dh, showAll);
            }
            catch (e) { }
            // khung game dọc nằm giữa: chiều cao = màn hình, chiều rộng theo tỉ lệ thiết kế
            var boxW = h * dw / dh;
            if (boxW > w) {
                boxW = w;
            }
            var margin = (w - boxW) / 2;
            var size = Math.min(margin * (OPT.sizeRatio || 0.6), h * 0.32);
            var show = !!(OPT.logo && margin > 24 && size > 8);
            if (logoL) {
                var place = function (im, cx) {
                    var s = im.style;
                    if (!show) {
                        s.display = "none";
                        return;
                    }
                    s.width = size + "px";
                    s.height = size + "px";
                    s.left = cx + "px";
                    s.top = (h / 2) + "px";
                    s.display = "block";
                };
                place(logoL, margin / 2);
                place(logoR, w - margin / 2);
            }
        }
        else {
            // dọc: KHÔNG tô nền xanh (game phủ kín màn hình) -> xóa nền nếu trước đó đã set
            clearBg();
            if (origPolicy) {
                try {
                    cc.view.setDesignResolutionSize(dw, dh, origPolicy);
                }
                catch (e) { }
            }
            if (logoL) {
                logoL.style.display = "none";
                logoR.style.display = "none";
            }
        }
    }
    // KHÔNG tô nền ngay lúc khởi tạo (sẽ gây nháy xanh trước khi load). Nền chỉ
    // được tô trong layout() khi thực sự ở chế độ ngang và engine đã sẵn sàng.
    if (document.body) {
        ensureLogos();
    }
    else {
        window.addEventListener("DOMContentLoaded", ensureLogos);
    }
    // chờ engine khởi tạo xong (cc.view sẵn sàng) rồi mới canh layout
    var waiter = setInterval(function () {
        var cc = getCC();
        if (cc && cc.view && cc.director && typeof cc.view.setDesignResolutionSize === "function") {
            clearInterval(waiter);
            layout();
            window.addEventListener("resize", layout);
            window.addEventListener("orientationchange", function () { setTimeout(layout, 60); });
        }
    }, 80);
    setTimeout(function () { clearInterval(waiter); }, 30000);
};
class landscape {
    /** Tạo đoạn <script> nội dung để nhúng vào body của playable */
    get_inject_script(land) {
        if (!land || !land.enable) {
            return "";
        }
        const opt = {
            enable: true,
            bg: land.bg_color || "#5E8C3A",
            logo: land.logo_base64 || "",
            sizeRatio: land.size_ratio || 0.6
        };
        return "window.__SUPER_LANDSCAPE_OPT__=" + JSON.stringify(opt) + ";(" + RUNTIME.toString() + ")();";
    }
    /**
     * Trả về JS THUẦN gán favicon (data:image plaintext) vào <link rel="icon"> tại
     * runtime. Dùng để nhúng vào GIỮA file (trong body script) nên KHÔNG bọc thẻ
     * <script>. Không mã hóa - ảnh để nguyên như ban đầu, chỉ khác vị trí ghi.
     */
    get_favicon_inject_code(fav) {
        if (!fav || !fav.enable || !fav.base64) {
            return "";
        }
        const FAV_RT = function (HREF, MIME) {
            try {
                var set = function () {
                    var l = document.querySelector('link[rel="icon"]');
                    if (!l) {
                        l = document.createElement("link");
                        l.setAttribute("rel", "icon");
                        (document.head || document.documentElement).appendChild(l);
                    }
                    l.setAttribute("type", MIME || "image/png");
                    l.setAttribute("href", HREF);
                };
                if (document.head || document.body) {
                    set();
                }
                else {
                    document.addEventListener("DOMContentLoaded", set);
                }
            }
            catch (e) { }
        };
        const m = /^data:([^;]+);/i.exec(fav.base64);
        const mime = (m && m[1]) || "image/png";
        return "(" + FAV_RT.toString() + ")(" + JSON.stringify(fav.base64) + "," + JSON.stringify(mime) + ");";
    }
    /** Bản bọc sẵn thẻ <script> (nếu cần nhúng độc lập vào <head>/<body>). */
    get_favicon_inject_script(fav) {
        const code = this.get_favicon_inject_code(fav);
        return code ? ("<script>" + code + "</script>") : "";
    }
}
exports.default = new landscape();
