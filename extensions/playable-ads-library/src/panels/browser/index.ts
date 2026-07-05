'use strict';

import { browserStyle } from './style';
import {
    ASSET_TYPES, LIBRARY_ROOT, DEFAULT_VFX_IMPORT_FOLDER, LEGACY_VFX_SCAN_ROOTS,
    AssetTypeDef, libraryTypeDir, mimeForExt,
} from '../../library/asset-types';

interface CatalogItem {
    id: string;
    name: string;
    category: string;
    fileSize: number;
    particleCount: number;
    uploadedAt: string;
    thumbnailPath?: string;
}

interface CategoryNode {
    name: string;
    fullPath: string;
    count: number;
    children: CategoryNode[];
    expanded: boolean;
}

// Library albums — one per supported asset format, each backed by a subfolder
// of assets/library-extension (see library/asset-types.ts).
const ALBUMS: Array<{ key: string; label: string; def: AssetTypeDef }> =
    ASSET_TYPES.map((t) => ({ key: t.key, label: t.label, def: t }));

// Thumbnail capture/encode quality profile — shared by every render-previewed
// asset (VFX particles, Prefabs, Spine). Higher fidelity than the original
// 160x100 / 12.5fps / sample-10 defaults:
//   - 2x linear resolution (16:10, matches the card aspect) => 4x the pixels.
//   - 50 fps for smooth motion (delayMs 20 -> delayCs 2, the GIF-safe floor).
//   - NeuQuant sampling factor 2 (near-best) vs 10 => finer per-frame palettes.
// Playback runs at exactly 1x (real-time): the capture advances the animation by
// `delayMs` per frame and the GIF shows each frame for the same `delayMs`, so
// `delayMs` MUST stay a multiple of 10 and >= 20 (so delayCs*10 == delayMs).
// frameCount * delayMs = clip length (~1s here) — raise frameCount for a longer
// clip; lowering delayMs below 20 would break the 1x invariant.
const THUMB_CAPTURE = {
    width: 320,
    height: 200,
    frameCount: 50,
    delayMs: 20,
    sample: 2,
};

module.exports = Editor.Panel.define({
    template: `
        <div class="toolbar">
            <div class="brand"><span class="brand-mark" aria-hidden="true">✦</span><span class="brand-name">Playable Ads Library</span><span class="brand-author" title="Author">by ThânNV</span></div>
            <div class="tabs">
                <div class="tab active" id="tabLocal">Library</div>
                <div class="tab" id="tabAll">VFX Hub</div>
                <div class="tab" id="tabMcp">Cocos MCP</div>
                <div class="tab" id="tabSettings">Settings</div>
            </div>
            <button id="importAll" style="display:none">Import All</button>
            <span class="bundle-info" id="bundleInfo" title=""></span>
            <button id="bundleBtn" class="lib-btn" type="button" title="Gom toàn bộ assets/library-extension (mọi định dạng) vào extension (portable, không cần server)">⬇ Bundle</button>
            <button id="reimportBtn" class="lib-btn" type="button" title="Tạo lại toàn bộ library trong project hiện tại từ data đã bundle trong extension">⬆ reImport</button>
            <button id="syncUpTop" class="lib-btn" type="button" title="Sync Up — đẩy assets/library-extension lên server sync riêng (cấu hình ở Settings)">⇧ Sync</button>
            <button id="syncDownTop" class="lib-btn" type="button" title="Sync Down — kéo assets/library-extension từ server sync riêng về (cấu hình ở Settings)">⇩ Sync</button>
        </div>
        <div class="body">
            <div class="type-nav" id="albumBar"></div>
            <div class="sidebar" id="sidebar"></div>
            <div class="content">
                <div class="search-bar">
                    <div class="search-field">
                        <span class="search-icon" aria-hidden="true">⌕</span>
                        <input type="text" id="searchInput" placeholder="Search..." />
                        <button class="search-clear" id="searchClear" type="button" title="Clear" aria-label="Clear search">×</button>
                    </div>
                </div>
                <div class="vfx-list" id="vfxList"></div>
            </div>
        </div>
        <div class="settings-page" id="settingsPage" style="display:none">
            <div class="settings-inner">
                <h2 class="settings-title">Settings</h2>
                <section class="settings-group">
                    <div class="settings-group-title">VFX Hub</div>
                    <div class="settings-row">
                        <label class="settings-label" for="serverUrl">Server URL</label>
                        <input type="text" id="serverUrl" class="settings-input" value="http://10.10.0.204:4649" placeholder="http://host:port" />
                    </div>
                    <div class="settings-hint">Địa chỉ VFX Hub server dùng để duyệt và import VFX.</div>
                </section>
                <section class="settings-group">
                    <div class="settings-group-title">Library Sync (server riêng)</div>
                    <div class="settings-row">
                        <label class="settings-label" for="syncUrl">Server URL</label>
                        <input type="text" id="syncUrl" class="settings-input" value="http://127.0.0.1:4650" placeholder="http://host:4650" />
                    </div>
                    <div class="settings-row">
                        <label class="settings-label" for="syncToken">Token</label>
                        <input type="text" id="syncToken" class="settings-input" placeholder="(để trống nếu server mở)" />
                    </div>
                    <label class="settings-toggle"><input type="checkbox" id="syncMirror" /> Mirror — xoá cả file thừa để khớp đúng (mặc định tắt, chỉ cộng dồn)</label>
                    <div class="settings-actions">
                        <button id="syncUpBtn">⇧ Đẩy lên (Sync Up)</button>
                        <button id="syncDownBtn">⇩ Kéo về (Sync Down)</button>
                        <button id="syncRefresh">Kiểm tra</button>
                    </div>
                    <div class="settings-row"><span class="settings-label">Trạng thái</span><span id="syncStatus" class="settings-status is-off">—</span></div>
                    <div class="settings-hint">Đồng bộ thư mục assets/library-extension với server riêng. Chỉ file mới/đổi mới truyền (so bằng hash SHA-256); giữ nguyên .meta nên UUID không đổi. Chạy server: thư mục library-sync-server (npm install &amp;&amp; npm start).</div>
                </section>
                <section class="settings-group">
                    <div class="settings-group-title">HTML Export (Playable)</div>
                    <label class="settings-toggle"><input type="checkbox" id="shObfuscate" /> Obfuscate code</label>
                    <label class="settings-toggle"><input type="checkbox" id="shLandscape" /> Hiển thị logo ở layout ngang</label>
                    <div class="settings-hint">Áp dụng khi build web-mobile → xuất playable HTML (build/super-html/). Lưu vào settings/super-html-options.json.</div>
                </section>
            </div>
        </div>
        <div class="mcp-page" id="mcpPage" style="display:none">
            <div class="mcp-inner">
                <div class="mcp-header">
                    <div class="mcp-header-title">
                        <span class="mcp-header-name">Cocos MCP Server</span>
                        <span class="mcp-header-sub">Streamable HTTP · MCP 2025-03-26</span>
                    </div>
                    <div class="mcp-header-right">
                        <span id="mcpLicChip" class="mcp-lic-chip off">—</span>
                        <button id="mcpCheckUpdate" class="mcp-mini-btn">Kiểm tra cập nhật</button>
                    </div>
                </div>

                <div class="mcp-subtabs">
                    <button class="mcp-subtab active" id="mcpSubServer">Máy chủ</button>
                    <button class="mcp-subtab" id="mcpSubTools">Công cụ</button>
                    <button class="mcp-subtab" id="mcpSubConfig">Cấu hình nhanh</button>
                    <button class="mcp-subtab" id="mcpSubLicense">Bản quyền</button>
                </div>

                <!-- ===== Máy chủ ===== -->
                <div class="mcp-sub" id="mcpPanelServer">
                    <section class="settings-group">
                        <div class="settings-group-title">Trạng thái máy chủ</div>
                        <div class="settings-row"><span class="settings-label">Trạng thái</span><span id="mcpStatus" class="settings-status is-off">—</span></div>
                        <div class="settings-row" id="mcpConnRow" style="display:none"><span class="settings-label">Kết nối</span><span id="mcpConn" class="settings-value">0</span></div>
                        <div class="settings-actions">
                            <button id="mcpToggle" class="mcp-primary">Khởi động</button>
                            <button id="mcpRefresh">Làm mới</button>
                        </div>
                    </section>
                    <section class="settings-group">
                        <div class="settings-group-title">Cài đặt máy chủ</div>
                        <div class="settings-row"><span class="settings-label">Giao thức</span><span class="settings-value" style="color:var(--accent-text)">Streamable HTTP (MCP 2025-03-26)</span></div>
                        <div class="settings-row"><label class="settings-label" for="mcpPort">Port</label><input type="number" id="mcpPort" class="settings-input" min="1024" max="65535" step="1" /></div>
                        <label class="settings-toggle"><input type="checkbox" id="mcpAutoStart" /> Tự động khởi động cùng editor</label>
                        <label class="settings-toggle"><input type="checkbox" id="mcpDebugLog" /> Bật ghi log gỡ lỗi</label>
                        <div class="settings-row"><label class="settings-label" for="mcpMaxConn">Kết nối tối đa</label><input type="number" id="mcpMaxConn" class="settings-input" min="1" max="100" step="1" /></div>
                        <div class="settings-actions"><button id="mcpSaveSettings" class="mcp-primary">Lưu cài đặt</button></div>
                        <div class="settings-hint">Cài đặt lưu vào settings/mcp-server.json. Đổi Port khi server đang dừng.</div>
                    </section>
                    <section class="settings-group" id="mcpUrlGroup" style="display:none">
                        <div class="settings-group-title">Thông tin kết nối</div>
                        <div class="settings-row"><span class="settings-label">MCP URL</span><input type="text" id="mcpUrl" class="settings-input" readonly /><button id="mcpCopyUrl" class="mcp-mini-btn">Copy</button></div>
                    </section>
                </div>

                <!-- ===== Công cụ ===== -->
                <div class="mcp-sub" id="mcpPanelTools" style="display:none">
                    <section class="settings-group">
                        <div class="settings-group-title">Cấu hình công cụ</div>
                        <div class="settings-row">
                            <label class="settings-label" for="mcpConfigSel">Cấu hình</label>
                            <select id="mcpConfigSel" class="settings-input"></select>
                            <button id="mcpConfigApply" class="mcp-mini-btn">Áp dụng</button>
                        </div>
                        <div class="settings-actions">
                            <button id="mcpConfigNew">Tạo mới</button>
                            <button id="mcpConfigEdit">Sửa</button>
                            <button id="mcpConfigDelete" class="mcp-danger">Xoá</button>
                            <button id="mcpConfigImport">Nhập</button>
                            <button id="mcpConfigExport">Xuất</button>
                        </div>
                    </section>
                    <section class="settings-group">
                        <div class="mcp-tools-bar">
                            <div class="settings-group-title">Quản lý công cụ</div>
                            <div class="mcp-tools-stats" id="mcpToolStats">—</div>
                            <div class="settings-actions">
                                <button id="mcpToolSelectAll">Chọn tất cả</button>
                                <button id="mcpToolDeselectAll">Bỏ chọn</button>
                                <button id="mcpToolSave" class="mcp-primary">Lưu thay đổi</button>
                            </div>
                        </div>
                        <div class="mcp-tool-grid" id="mcpToolGrid"><div class="mcp-empty">Đang tải…</div></div>
                    </section>
                </div>

                <!-- ===== Cấu hình nhanh ===== -->
                <div class="mcp-sub" id="mcpPanelConfig" style="display:none">
                    <section class="settings-group">
                        <div class="settings-group-title">Thông tin máy chủ</div>
                        <div class="settings-row"><label class="settings-label" for="mcpCfgName">Tên máy chủ</label><input type="text" id="mcpCfgName" class="settings-input" value="cocos-creator" /></div>
                        <div class="settings-row"><span class="settings-label">Địa chỉ</span><input type="text" id="mcpCfgUrl" class="settings-input" readonly /></div>
                    </section>
                    <section class="settings-group">
                        <div class="mcp-tools-bar">
                            <div class="settings-group-title">Tự động cấu hình (IDE + Codex CLI)</div>
                            <div class="settings-actions">
                                <button id="mcpCfgAddAll" class="mcp-primary">Thêm tất cả</button>
                                <button id="mcpCfgRemoveAll" class="mcp-danger">Gỡ tất cả</button>
                                <button id="mcpCfgRefresh">Làm mới</button>
                            </div>
                        </div>
                        <div class="settings-hint">Bấm nút để tự sửa file cấu hình (Cursor, Windsurf, Trae, Codex CLI). Cần server đang chạy.</div>
                        <div class="mcp-client-list" id="mcpClientList"><div class="mcp-empty">Đang tải…</div></div>
                    </section>
                    <section class="settings-group">
                        <div class="mcp-tools-bar">
                            <div class="settings-group-title">Cấu hình thủ công (Claude CLI + Gemini CLI)</div>
                            <div class="settings-actions">
                                <button id="mcpCliUser" class="mcp-primary">Cấp User</button>
                                <button id="mcpCliProject">Cấp Project</button>
                            </div>
                        </div>
                        <div class="mcp-cli-box"><div class="mcp-cli-name">Claude CLI</div><pre id="mcpCliClaude">—</pre><button id="mcpCliCopyClaude" class="mcp-mini-btn">Copy</button></div>
                        <div class="mcp-cli-box"><div class="mcp-cli-name">Gemini CLI</div><pre id="mcpCliGemini">—</pre><button id="mcpCliCopyGemini" class="mcp-mini-btn">Copy</button></div>
                    </section>
                    <section class="settings-group">
                        <div class="settings-group-title">Nhật ký thao tác</div>
                        <div class="mcp-log" id="mcpLog"><div class="mcp-log-empty">Chưa có thao tác</div></div>
                    </section>
                </div>

                <!-- ===== Bản quyền ===== -->
                <div class="mcp-sub" id="mcpPanelLicense" style="display:none">
                    <section class="settings-group" id="mcpLicActivated" style="display:none">
                        <div class="settings-group-title">Bản quyền</div>
                        <div class="settings-row"><span class="settings-label">Email</span><span id="mcpLicEmail" class="settings-value">—</span></div>
                        <div class="settings-row"><span class="settings-label">Loại</span><span id="mcpLicType" class="settings-value">—</span></div>
                        <div class="settings-row"><span class="settings-label">Còn lại</span><span id="mcpLicDays" class="settings-value">—</span></div>
                        <div class="settings-actions">
                            <button id="mcpLicChange">Đổi mã</button>
                            <button id="mcpLicLogout" class="mcp-danger">Đăng xuất</button>
                        </div>
                    </section>
                    <section class="settings-group" id="mcpLicForm">
                        <div class="settings-group-title">Kích hoạt bản quyền</div>
                        <div class="settings-row"><label class="settings-label" for="mcpLicInEmail">Email</label><input type="email" id="mcpLicInEmail" class="settings-input" placeholder="Nhập email" /></div>
                        <div class="settings-row"><label class="settings-label" for="mcpLicInCode">Mã kích hoạt</label><input type="text" id="mcpLicInCode" class="settings-input" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" /></div>
                        <div class="mcp-lic-msg" id="mcpLicMsg"></div>
                        <div class="settings-actions"><button id="mcpLicActivate" class="mcp-primary">Kích hoạt</button></div>
                        <div class="settings-hint">Mua/gia hạn tại www.vberai.com/game-engines/cocos · Hỗ trợ: a549623165@gmail.com</div>
                    </section>
                    <section class="settings-group">
                        <div class="settings-row"><span class="settings-label">Machine ID</span><span id="mcpMachineId" class="settings-value mcp-mono">—</span></div>
                    </section>
                </div>
            </div>

            <div class="mcp-modal" id="mcpModal" style="display:none">
                <div class="mcp-modal-box">
                    <div class="mcp-modal-head"><span id="mcpModalTitle">Cấu hình</span><button id="mcpModalClose" class="mcp-modal-close">×</button></div>
                    <div class="mcp-modal-body">
                        <div class="settings-row" id="mcpModalNameRow"><label class="settings-label" for="mcpModalName">Tên</label><input type="text" id="mcpModalName" class="settings-input" /></div>
                        <div class="settings-row" id="mcpModalDescRow"><label class="settings-label" for="mcpModalDesc">Mô tả</label><input type="text" id="mcpModalDesc" class="settings-input" /></div>
                        <div class="mcp-modal-jsonrow" id="mcpModalJsonRow" style="display:none"><label class="settings-label" for="mcpModalJson">JSON</label><textarea id="mcpModalJson" class="mcp-textarea" placeholder="Dán nội dung JSON cấu hình"></textarea></div>
                    </div>
                    <div class="mcp-modal-actions"><button id="mcpModalCancel">Huỷ</button><button id="mcpModalOk" class="mcp-primary">Lưu</button></div>
                </div>
            </div>
        </div>
        <div class="status-bar" id="statusBar">Library</div>
    `,

    style: browserStyle,

    $: {
        serverUrl: '#serverUrl',
        tabLocal: '#tabLocal',
        tabAll: '#tabAll',
        tabSettings: '#tabSettings',
        tabMcp: '#tabMcp',
        mainBody: '.body',
        settingsPage: '#settingsPage',
        mcpPage: '#mcpPage',
        shObfuscate: '#shObfuscate',
        shLandscape: '#shLandscape',
        // Cocos MCP — sub-tabs
        mcpSubServer: '#mcpSubServer',
        mcpSubTools: '#mcpSubTools',
        mcpSubConfig: '#mcpSubConfig',
        mcpSubLicense: '#mcpSubLicense',
        mcpPanelServer: '#mcpPanelServer',
        mcpPanelTools: '#mcpPanelTools',
        mcpPanelConfig: '#mcpPanelConfig',
        mcpPanelLicense: '#mcpPanelLicense',
        mcpLicChip: '#mcpLicChip',
        mcpCheckUpdate: '#mcpCheckUpdate',
        // Cocos MCP — server tab
        mcpStatus: '#mcpStatus',
        mcpConnRow: '#mcpConnRow',
        mcpConn: '#mcpConn',
        mcpToggle: '#mcpToggle',
        mcpRefresh: '#mcpRefresh',
        mcpPort: '#mcpPort',
        mcpAutoStart: '#mcpAutoStart',
        mcpDebugLog: '#mcpDebugLog',
        mcpMaxConn: '#mcpMaxConn',
        mcpSaveSettings: '#mcpSaveSettings',
        mcpUrlGroup: '#mcpUrlGroup',
        mcpUrl: '#mcpUrl',
        mcpCopyUrl: '#mcpCopyUrl',
        // Cocos MCP — tools tab
        mcpConfigSel: '#mcpConfigSel',
        mcpConfigApply: '#mcpConfigApply',
        mcpConfigNew: '#mcpConfigNew',
        mcpConfigEdit: '#mcpConfigEdit',
        mcpConfigDelete: '#mcpConfigDelete',
        mcpConfigImport: '#mcpConfigImport',
        mcpConfigExport: '#mcpConfigExport',
        mcpToolStats: '#mcpToolStats',
        mcpToolSelectAll: '#mcpToolSelectAll',
        mcpToolDeselectAll: '#mcpToolDeselectAll',
        mcpToolSave: '#mcpToolSave',
        mcpToolGrid: '#mcpToolGrid',
        // Cocos MCP — quick config tab
        mcpCfgName: '#mcpCfgName',
        mcpCfgUrl: '#mcpCfgUrl',
        mcpCfgAddAll: '#mcpCfgAddAll',
        mcpCfgRemoveAll: '#mcpCfgRemoveAll',
        mcpCfgRefresh: '#mcpCfgRefresh',
        mcpClientList: '#mcpClientList',
        mcpCliUser: '#mcpCliUser',
        mcpCliProject: '#mcpCliProject',
        mcpCliClaude: '#mcpCliClaude',
        mcpCliGemini: '#mcpCliGemini',
        mcpCliCopyClaude: '#mcpCliCopyClaude',
        mcpCliCopyGemini: '#mcpCliCopyGemini',
        mcpLog: '#mcpLog',
        // Cocos MCP — license tab
        mcpLicActivated: '#mcpLicActivated',
        mcpLicEmail: '#mcpLicEmail',
        mcpLicType: '#mcpLicType',
        mcpLicDays: '#mcpLicDays',
        mcpLicChange: '#mcpLicChange',
        mcpLicLogout: '#mcpLicLogout',
        mcpLicForm: '#mcpLicForm',
        mcpLicInEmail: '#mcpLicInEmail',
        mcpLicInCode: '#mcpLicInCode',
        mcpLicMsg: '#mcpLicMsg',
        mcpLicActivate: '#mcpLicActivate',
        mcpMachineId: '#mcpMachineId',
        // Cocos MCP — modal
        mcpModal: '#mcpModal',
        mcpModalTitle: '#mcpModalTitle',
        mcpModalClose: '#mcpModalClose',
        mcpModalNameRow: '#mcpModalNameRow',
        mcpModalDescRow: '#mcpModalDescRow',
        mcpModalName: '#mcpModalName',
        mcpModalDesc: '#mcpModalDesc',
        mcpModalJsonRow: '#mcpModalJsonRow',
        mcpModalJson: '#mcpModalJson',
        mcpModalCancel: '#mcpModalCancel',
        mcpModalOk: '#mcpModalOk',
        syncUrl: '#syncUrl',
        syncToken: '#syncToken',
        syncMirror: '#syncMirror',
        syncUpBtn: '#syncUpBtn',
        syncDownBtn: '#syncDownBtn',
        syncRefresh: '#syncRefresh',
        syncStatus: '#syncStatus',
        syncUpTop: '#syncUpTop',
        syncDownTop: '#syncDownTop',
        albumBar: '#albumBar',
        sidebar: '#sidebar',
        searchInput: '#searchInput',
        searchClear: '#searchClear',
        vfxList: '#vfxList',
        statusBar: '#statusBar',
        importAll: '#importAll',
        bundleInfo: '#bundleInfo',
        bundleBtn: '#bundleBtn',
        reimportBtn: '#reimportBtn',
    },

    _items: [] as CatalogItem[],
    _categoryTree: [] as CategoryNode[],
    _selectedCategory: 'All',
    _searchQuery: '',
    _page: 'local',
    _album: 'vfx',
    _localItems: [] as any[],
    _importing: null as any,
    _imported: null as any,
    _thumbObserver: null as any,
    _thumbGenToken: 0,
    _thumbGenRunning: false,
    _thumbGenPending: null as any,
    _packThumbDir: '' as string,
    _importingAll: false,
    _importAllToken: 0,
    _audioEl: null as any,
    _audioUrl: '' as string,
    _audioSrc: '' as string,
    _audioBtn: null as any,
    _syncing: false,

    ready() {
        const self = this as any;
        self._items = [];
        self._categoryTree = [];
        self._selectedCategory = 'All';
        self._searchQuery = '';
        self._page = 'local';
        self._album = 'vfx';
        self._localItems = [];
        self._importing = new Set<string>();
        self._imported = new Map<string, { path: string; uuid: string }>();
        self._thumbGenToken = 0;
        self._thumbGenRunning = false;
        self._thumbGenPending = null;
        self._packThumbDir = '';
        self._importingAll = false;
        self._importAllToken = 0;
        self._audioEl = null;
        self._audioUrl = '';
        self._audioSrc = '';
        self._audioBtn = null;

        Editor.Profile.getProject('vfx-browser', 'serverUrl').then((url: string) => {
            if (url) self.$.serverUrl.value = url;
        });
        self.$.serverUrl.addEventListener('change', () => {
            Editor.Profile.setProject('vfx-browser', 'serverUrl', self.$.serverUrl.value.replace(/\/+$/, ''));
        });
        self.$.tabLocal.addEventListener('click', () => { self._switchPage('local'); });
        self.$.tabAll.addEventListener('click', () => { self._switchPage('all'); });
        self.$.tabMcp.addEventListener('click', () => { self._switchPage('mcp'); });
        self.$.tabSettings.addEventListener('click', () => { self._switchPage('settings'); });
        self.$.importAll.addEventListener('click', () => { self._importAll(); });
        self.$.bundleBtn.addEventListener('click', () => { self._bundleLibrary(); });
        self.$.reimportBtn.addEventListener('click', () => { self._reimportLibrary(); });

        // Library Sync (server riêng): load saved URL/token, persist on edit, wire buttons.
        Editor.Profile.getProject('vfx-browser', 'syncUrl').then((u: string) => { if (u) self.$.syncUrl.value = u; });
        Editor.Profile.getProject('vfx-browser', 'syncToken').then((t: string) => { if (t) self.$.syncToken.value = t; });
        self.$.syncUrl.addEventListener('change', () => {
            Editor.Profile.setProject('vfx-browser', 'syncUrl', self.$.syncUrl.value.replace(/\/+$/, ''));
        });
        self.$.syncToken.addEventListener('change', () => {
            Editor.Profile.setProject('vfx-browser', 'syncToken', self.$.syncToken.value);
        });
        self.$.syncUpBtn.addEventListener('click', () => { self._syncUp(); });
        self.$.syncDownBtn.addEventListener('click', () => { self._syncDown(); });
        self.$.syncRefresh.addEventListener('click', () => { self._refreshSyncStatus(); });
        self.$.syncUpTop.addEventListener('click', () => { self._syncUp(); });
        self.$.syncDownTop.addEventListener('click', () => { self._syncDown(); });
        self.$.searchInput.addEventListener('input', (e: Event) => {
            self._searchQuery = (e.target as HTMLInputElement).value;
            self._renderCurrent();
        });

        // Toggle the inline clear (×) button with the field's contents. Defined on `self`
        // so the programmatic resets in _switchPage / _selectAlbum can keep it in sync too.
        self._syncSearchClear = () => {
            if (self.$.searchClear) {
                self.$.searchClear.style.visibility = self.$.searchInput.value ? 'visible' : 'hidden';
            }
        };
        self.$.searchInput.addEventListener('input', () => self._syncSearchClear());
        self.$.searchClear.addEventListener('click', () => {
            self.$.searchInput.value = '';
            self._searchQuery = '';
            self._syncSearchClear();
            self.$.searchInput.focus();
            self._renderCurrent();
        });
        self._syncSearchClear();

        // Settings: super-html build options.
        self._loadSuperHtmlOptions();
        self.$.shObfuscate.addEventListener('change', () => self._saveSuperHtmlOptions());
        self.$.shLandscape.addEventListener('change', () => self._saveSuperHtmlOptions());

        // ---- Cocos MCP page wiring (backend = cocos-mcp-server ext via IPC) ----
        // Sub-tab nav
        self.$.mcpSubServer.addEventListener('click', () => self._mcpSwitchSubTab('server'));
        self.$.mcpSubTools.addEventListener('click', () => self._mcpSwitchSubTab('tools'));
        self.$.mcpSubConfig.addEventListener('click', () => self._mcpSwitchSubTab('config'));
        self.$.mcpSubLicense.addEventListener('click', () => self._mcpSwitchSubTab('license'));
        self.$.mcpCheckUpdate.addEventListener('click', () => self._mcpCheckUpdate());
        // Server tab
        self.$.mcpToggle.addEventListener('click', () => self._mcpToggleServer());
        self.$.mcpRefresh.addEventListener('click', () => self._mcpRefreshStatus());
        self.$.mcpSaveSettings.addEventListener('click', () => self._mcpSaveSettings());
        self.$.mcpCopyUrl.addEventListener('click', () => {
            if (self._mcpCopy(self.$.mcpUrl.value)) self.$.statusBar.textContent = 'Đã copy MCP URL';
        });
        // Tools tab
        self.$.mcpConfigSel.addEventListener('change', () => { self._mcpRenderTools(); });
        self.$.mcpConfigApply.addEventListener('click', () => self._mcpApplyConfig());
        self.$.mcpConfigNew.addEventListener('click', () => self._mcpOpenModal('new'));
        self.$.mcpConfigEdit.addEventListener('click', () => self._mcpOpenModal('edit'));
        self.$.mcpConfigDelete.addEventListener('click', () => self._mcpDeleteConfig());
        self.$.mcpConfigImport.addEventListener('click', () => self._mcpOpenModal('import'));
        self.$.mcpConfigExport.addEventListener('click', () => self._mcpExportConfig());
        self.$.mcpToolSelectAll.addEventListener('click', () => self._mcpSelectAllTools(true));
        self.$.mcpToolDeselectAll.addEventListener('click', () => self._mcpSelectAllTools(false));
        self.$.mcpToolSave.addEventListener('click', () => self._mcpSaveTools());
        // Modal
        self.$.mcpModalClose.addEventListener('click', () => self._mcpCloseModal());
        self.$.mcpModalCancel.addEventListener('click', () => self._mcpCloseModal());
        self.$.mcpModalOk.addEventListener('click', () => self._mcpModalOk());
        // Quick config tab
        self.$.mcpCfgAddAll.addEventListener('click', () => self._mcpAddAll());
        self.$.mcpCfgRemoveAll.addEventListener('click', () => self._mcpRemoveAll());
        self.$.mcpCfgRefresh.addEventListener('click', () => self._mcpLoadClients());
        self.$.mcpCfgName.addEventListener('change', () => { self._mcpRefreshCli(); });
        self.$.mcpCliUser.addEventListener('click', () => self._mcpSetCliScope('user'));
        self.$.mcpCliProject.addEventListener('click', () => self._mcpSetCliScope('project'));
        self.$.mcpCliCopyClaude.addEventListener('click', () => {
            if (self._mcpCopy(self.$.mcpCliClaude.textContent)) self.$.statusBar.textContent = 'Đã copy lệnh Claude CLI';
        });
        self.$.mcpCliCopyGemini.addEventListener('click', () => {
            if (self._mcpCopy(self.$.mcpCliGemini.textContent)) self.$.statusBar.textContent = 'Đã copy lệnh Gemini CLI';
        });
        // License tab
        self.$.mcpLicActivate.addEventListener('click', () => self._mcpActivate());
        self.$.mcpLicChange.addEventListener('click', () => self._mcpChangeCode());
        self.$.mcpLicLogout.addEventListener('click', () => self._mcpDeactivate());

        // Show the current bundle status (date + size) in the toolbar chip.
        self._refreshBundleInfo();

        // Open on the Local page — shows already-imported assets from disk, no server load.
        self._switchPage('local');
    },

    close() {
        const self = this as any;
        self._thumbGenToken++; // cancel any in-flight thumbnail generation
        self._thumbGenPending = null; // and drop any queued run
        self._importAllToken++; // cancel any in-flight batch import
        if (self._thumbObserver) { self._thumbObserver.disconnect(); self._thumbObserver = null; }
        if (self._stopAudio) { self._stopAudio(); }
        Editor.Profile.setProject('vfx-browser', 'serverUrl', self.$.serverUrl.value);
    },

    messages: {
        // Broadcast from main.ts startImport() when an import finishes (success or failure).
        'vfx-browser:import-complete'(result: any) {
            (this as any).importComplete(result);
        },
        // Broadcast from the import-review panel when closed without importing (Cancel).
        'vfx-browser:import-cancelled'(vfxId: string) {
            const self = this as any;
            if (vfxId) { self._importing.delete(vfxId); }
            self._renderCurrent();
        },
        // Per-file progress streamed from main.ts during Sync Up / Sync Down.
        'vfx-browser:sync-progress'(info: any) {
            (this as any)._onSyncProgress(info);
        },
    },

    methods: {
        async importComplete(result: any) {
            const self = this as any;
            // Clear the per-row "Importing..." lock. Fall back to clearing all if the
            // completion event somehow lacks a vfxId, so a button can never stay stuck.
            if (result?.vfxId) { self._importing.delete(result.vfxId); }
            else { self._importing.clear(); }
            if (result?.success && result?.prefabName) {
                self._imported.set(result.prefabName, {
                    path: result.prefabPath || '',
                    uuid: result.prefabUuid || '',
                });
                // The importer already cached the thumbnail; refresh the Library view
                // including the sidebar (a new category may have just appeared).
                if (self._page === 'local') {
                    await self._loadLocal();
                    self._setupLocalSidebar();
                }
            }
            self._renderCurrent();
            // During a batch import the loop owns the status bar (progress counter).
            if (self._importingAll) { return; }
            if (result?.success) {
                const where = result.prefabPath ? ` -> ${result.prefabPath}` : '';
                self.$.statusBar.textContent = `Imported "${result.prefabName}" (${result.nodesCreated} nodes)${where}`;
            } else {
                self.$.statusBar.textContent = `Import failed: ${result?.error || 'unknown error'}`;
            }
        },

        // Surface the prefab's db:// address and select it in the Assets panel (best-effort)
        // so the user can locate the generated particle.
        _reveal(path: string, uuid: string) {
            const self = this as any;
            const p = path || '(prefab path unknown)';
            self.$.statusBar.textContent = `Prefab: ${p}`;
            console.log(`[VFX] Prefab: ${p}  uuid: ${uuid || '?'}`);
            try {
                const Sel = (Editor as any).Selection;
                if (uuid && Sel && typeof Sel.select === 'function') {
                    Sel.select('asset', uuid);
                }
            } catch { /* selection API unavailable — path is still shown in the status bar */ }
        },

        _renderCurrent() {
            const self = this as any;
            if (self._page === 'local') { self._renderLocal(); }
            else { self._renderList(); }
        },

        // Fill the grid with shimmer placeholder cards while the All catalog loads.
        // Self-clearing: both _renderList (success) and the _fetchCatalog catch wipe
        // the list via innerHTML='' so the skeletons vanish without explicit teardown.
        _renderSkeletons(n = 8) {
            const self = this as any;
            const list = self.$.vfxList;
            list.innerHTML = '';
            for (let i = 0; i < n; i++) {
                const card = document.createElement('div');
                card.className = 'vfx-card skeleton';
                const wrap = document.createElement('div');
                wrap.className = 'card-thumb-wrap skel-box';
                const body = document.createElement('div');
                body.className = 'card-body';
                const btn = document.createElement('div');
                btn.className = 'skel-line skel-btn';
                const name = document.createElement('div');
                name.className = 'skel-line skel-name';
                body.appendChild(btn);
                body.appendChild(name);
                card.appendChild(wrap);
                card.appendChild(body);
                list.appendChild(card);
            }
        },

        // Switch between the Library page (local assets, instant) and the VFX Hub catalog (server).
        async _switchPage(page: string) {
            const self = this as any;
            self._thumbGenToken++; // cancel generation tied to the previous view
            self._importAllToken++; // cancel batch import tied to the previous view
            self._importingAll = false;
            self._stopAudio();
            self._page = page;
            self.$.tabLocal.classList.toggle('active', page === 'local');
            self.$.tabAll.classList.toggle('active', page === 'all');
            self.$.tabMcp.classList.toggle('active', page === 'mcp');
            self.$.tabSettings.classList.toggle('active', page === 'settings');

            // Settings and Cocos MCP are full-page views: swap the library/hub body for
            // the page and hide the library-only toolbar actions.
            const isSettings = page === 'settings';
            const isMcp = page === 'mcp';
            const isLibrary = !isSettings && !isMcp;
            self.$.mainBody.style.display = isLibrary ? '' : 'none';
            self.$.settingsPage.style.display = isSettings ? '' : 'none';
            self.$.mcpPage.style.display = isMcp ? '' : 'none';
            self.$.bundleBtn.style.display = isLibrary ? '' : 'none';
            self.$.reimportBtn.style.display = isLibrary ? '' : 'none';
            self.$.bundleInfo.style.display = isLibrary ? '' : 'none';
            self.$.syncUpTop.style.display = isLibrary ? '' : 'none';
            self.$.syncDownTop.style.display = isLibrary ? '' : 'none';
            if (isSettings) {
                self.$.importAll.style.display = 'none';
                self._loadSuperHtmlOptions();
                self._refreshSyncStatus();
                self.$.statusBar.textContent = 'Settings';
                return;
            }
            if (isMcp) {
                self.$.importAll.style.display = 'none';
                self.$.statusBar.textContent = 'Cocos MCP';
                self._mcpInit();
                return;
            }

            self.$.importAll.style.display = (page === 'all') ? '' : 'none';
            self.$.searchInput.value = '';
            self._searchQuery = '';
            if (self._syncSearchClear) self._syncSearchClear();
            self._selectedCategory = 'All'; // reset folder filter when changing view
            if (page === 'all') {
                self.$.albumBar.style.display = 'none';
                self.$.sidebar.style.display = '';
                // Entering All auto-refreshes the catalog (replaces the old Refresh button).
                await self._fetchCatalog();
            } else {
                self.$.albumBar.style.display = '';
                self._renderAlbumBar();
                await self._loadLocal();
                self._setupLocalSidebar();
                const album = ALBUMS.find((a) => a.key === self._album);
                self.$.statusBar.textContent = `${album ? album.label : 'Library'} — ${self._localItems.length} items`;
                self._renderLocal();
                self._maybeGenerateThumbs();
            }
        },

        // Vertical format nav (left rail): one icon+label row per asset type.
        _renderAlbumBar() {
            const self = this as any;
            const bar = self.$.albumBar;
            bar.innerHTML = '';
            for (const a of ALBUMS) {
                const item = document.createElement('div');
                item.className = 'type-item' + (self._album === a.key ? ' active' : '');
                const glyph = document.createElement('span');
                glyph.className = 'type-glyph';
                glyph.setAttribute('aria-hidden', 'true');
                glyph.textContent = a.def.icon;
                const label = document.createElement('span');
                label.className = 'type-label';
                label.textContent = a.label;
                item.appendChild(glyph);
                item.appendChild(label);
                item.addEventListener('click', () => { self._selectAlbum(a.key); });
                bar.appendChild(item);
            }
            // Render-previewed albums (VFX / Prefab) get a regenerate control: re-scan
            // the cache and (re)generate any thumbnail still missing or previously failed.
            const album = ALBUMS.find((a) => a.key === self._album);
            if (album && album.def.preview === 'render') {
                const btn = document.createElement('button');
                btn.className = 'album-regen' + (self._thumbGenRunning ? ' running' : '');
                btn.textContent = self._thumbGenRunning ? '■ Stop' : '↻ Regenerate';
                btn.title = self._thumbGenRunning
                    ? 'Stop thumbnail generation'
                    : 'Re-scan cache and regenerate missing / failed thumbnails';
                btn.addEventListener('click', () => { self._regenerateThumbs(); });
                bar.appendChild(btn);
            }
        },

        async _selectAlbum(key: string) {
            const self = this as any;
            self._thumbGenToken++; // cancel generation tied to the previous album
            self._stopAudio();
            self._album = key;
            self._renderAlbumBar();
            self.$.searchInput.value = '';
            self._searchQuery = '';
            if (self._syncSearchClear) self._syncSearchClear();
            self._selectedCategory = 'All'; // reset folder filter when changing album
            await self._loadLocal();
            self._setupLocalSidebar();
            const album = ALBUMS.find((a) => a.key === key);
            self.$.statusBar.textContent = `${album ? album.label : 'Library'} — ${self._localItems.length} items`;
            self._renderLocal();
            self._maybeGenerateThumbs();
        },

        // Project root resolved via asset-db (reliable in the panel renderer, unlike
        // Editor.Project.path which may be absent here).
        async _projectRoot(): Promise<string> {
            try {
                const p: any = await Editor.Message.request('asset-db', 'query-path', 'db://assets');
                const fsPath = typeof p === 'string' ? p : (p && (p.path || p.file));
                if (fsPath) { return require('path').dirname(fsPath); }
            } catch { /* fall through */ }
            return (Editor as any).Project?.path || (Editor as any).projectPath || process.cwd();
        },

        // ---- Settings: HTML export (playable) options (settings/super-html-options.json) ----
        // Our bundled builder hook (html-export/) reads this file at build time as the
        // highest-priority override: `enable_obfuscator` -> config.is_obfuscator,
        // `landscape_enable` -> landscape logo. The filename stays super-html-options.json
        // for compatibility with the vendored engine that reads it.
        async _superHtmlOptionsPath(): Promise<string> {
            const path = require('path');
            return path.join(await (this as any)._projectRoot(), 'settings', 'super-html-options.json');
        },
        async _loadSuperHtmlOptions() {
            const self = this as any;
            try {
                const fs = require('fs');
                const p = await self._superHtmlOptionsPath();
                let opts: any = {};
                try { if (fs.existsSync(p)) opts = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { /* defaults */ }
                // Both default ON (super-html config defaults: obfuscate + landscape enabled).
                self.$.shObfuscate.checked = opts.enable_obfuscator !== false;
                self.$.shLandscape.checked = opts.landscape_enable !== false;
            } catch { /* ignore */ }
        },
        async _saveSuperHtmlOptions() {
            const self = this as any;
            try {
                const fs = require('fs');
                const path = require('path');
                const p = await self._superHtmlOptionsPath();
                fs.mkdirSync(path.dirname(p), { recursive: true });
                let opts: any = {};
                try { if (fs.existsSync(p)) opts = JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { /* overwrite */ }
                opts.enable_obfuscator = self.$.shObfuscate.checked;
                opts.landscape_enable = self.$.shLandscape.checked;
                fs.writeFileSync(p, JSON.stringify(opts, null, 2), 'utf-8');
                self.$.statusBar.textContent = 'Đã lưu tùy chọn HTML Export';
            } catch (e: any) {
                self.$.statusBar.textContent = 'Lưu super-html-options lỗi: ' + (e && e.message);
            }
        },

        // ================= Cocos MCP page =================
        // The MCP server engine lives in the separate (obfuscated) `cocos-mcp-server`
        // extension. This page reimplements its UI in the Playable Ads style and drives
        // the engine over cross-extension IPC + reads/writes the settings JSON directly
        // (settings/mcp-server.json, settings/tool-manager.json) as the source of truth.

        _mcpSettingsPath(): Promise<string> {
            return (this as any)._projectRoot().then((root: string) => require('path').join(root, 'settings', 'mcp-server.json'));
        },
        _mcpToolPath(): Promise<string> {
            return (this as any)._projectRoot().then((root: string) => require('path').join(root, 'settings', 'tool-manager.json'));
        },
        // Small clipboard helper (navigator.clipboard, falling back to execCommand).
        _mcpCopy(text: string): boolean {
            if (!text) { return false; }
            try {
                if ((navigator as any).clipboard && (navigator as any).clipboard.writeText) {
                    (navigator as any).clipboard.writeText(text);
                    return true;
                }
            } catch { /* fall through */ }
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                return true;
            } catch { return false; }
        },
        _mcpUuid(): string {
            try { return require('crypto').randomUUID(); }
            catch { return 'cfg-' + Date.now() + '-' + Math.floor(Math.random() * 1e6); }
        },

        // First open of the page: paint the current sub-tab + load server/license state.
        async _mcpInit() {
            const self = this as any;
            if (!self._mcpSub) { self._mcpSub = 'server'; }
            self._mcpSwitchSubTab(self._mcpSub);
            await self._mcpRefreshStatus();
            await self._mcpLoadSettings();
            await self._mcpLoadLicense();
        },

        _mcpSwitchSubTab(sub: string) {
            const self = this as any;
            self._mcpSub = sub;
            self.$.mcpSubServer.classList.toggle('active', sub === 'server');
            self.$.mcpSubTools.classList.toggle('active', sub === 'tools');
            self.$.mcpSubConfig.classList.toggle('active', sub === 'config');
            self.$.mcpSubLicense.classList.toggle('active', sub === 'license');
            self.$.mcpPanelServer.style.display = sub === 'server' ? '' : 'none';
            self.$.mcpPanelTools.style.display = sub === 'tools' ? '' : 'none';
            self.$.mcpPanelConfig.style.display = sub === 'config' ? '' : 'none';
            self.$.mcpPanelLicense.style.display = sub === 'license' ? '' : 'none';
            if (sub === 'tools' && !self._mcpToolsLoaded) { self._mcpLoadTools(); }
            if (sub === 'config' && !self._mcpCfgLoaded) {
                self._mcpCfgLoaded = true;
                self._mcpUpdateCfgUrl();
                self._mcpLoadClients();
                self._mcpRefreshCli();
            }
            if (sub === 'license') { self._mcpLoadLicense(); }
        },

        // ---- Server sub-tab ----
        async _mcpRefreshStatus() {
            const self = this as any;
            let running = false, port: any = null, conns: any = null, available = true;
            try {
                const st: any = await Editor.Message.request('cocos-mcp-server', 'get-server-status');
                running = st === true || !!(st && (st.running || st.isRunning || st.started || st.active));
                if (st && typeof st === 'object') {
                    if (st.port != null) { port = st.port; }
                    conns = st.connections != null ? st.connections
                        : (st.connectedClients != null ? st.connectedClients
                            : (st.clients != null ? st.clients : null));
                }
            } catch { available = false; }
            self._mcpServerRunning = running;
            if (!available) {
                self.$.mcpStatus.textContent = 'không khả dụng (cocos-mcp chưa bật?)';
                self.$.mcpStatus.className = 'settings-status is-off';
            } else {
                self.$.mcpStatus.textContent = running ? '● Đang chạy' : '○ Đã dừng';
                self.$.mcpStatus.className = 'settings-status ' + (running ? 'is-on' : 'is-off');
            }
            self.$.mcpToggle.textContent = running ? 'Dừng máy chủ' : 'Khởi động';
            self.$.mcpToggle.classList.toggle('mcp-danger', running);
            self.$.mcpToggle.classList.toggle('mcp-primary', !running);
            self.$.mcpConnRow.style.display = (running && conns != null) ? '' : 'none';
            if (conns != null) { self.$.mcpConn.textContent = String(conns); }
            if (port == null) {
                try {
                    const fs = require('fs');
                    const f = await self._mcpSettingsPath();
                    if (fs.existsSync(f)) { port = JSON.parse(fs.readFileSync(f, 'utf-8')).port; }
                } catch { /* ignore */ }
            }
            const showUrl = running && port != null;
            self.$.mcpUrlGroup.style.display = showUrl ? '' : 'none';
            if (port != null) { self.$.mcpUrl.value = `http://127.0.0.1:${port}/mcp`; }
            self.$.mcpPort.disabled = running;
            self._mcpUpdateCfgUrl();
        },

        async _mcpToggleServer() {
            const self = this as any;
            const running = self._mcpServerRunning;
            self.$.mcpToggle.disabled = true;
            try {
                await Editor.Message.request('cocos-mcp-server', running ? 'stop-server' : 'start-server');
                self.$.statusBar.textContent = running ? 'MCP: đã gửi lệnh dừng' : 'MCP: đã gửi lệnh khởi động';
            } catch (e: any) {
                self.$.statusBar.textContent = 'MCP lỗi: ' + (e && e.message) + ' (kiểm tra Bản quyền?)';
            }
            setTimeout(async () => { await self._mcpRefreshStatus(); self.$.mcpToggle.disabled = false; }, 700);
        },

        async _mcpLoadSettings() {
            const self = this as any;
            let s: any = {};
            try {
                const r: any = await Editor.Message.request('cocos-mcp-server', 'get-server-settings');
                if (r && typeof r === 'object') { s = r; }
            } catch { /* fall back to file */ }
            try {
                const fs = require('fs');
                const f = await self._mcpSettingsPath();
                if (fs.existsSync(f)) { s = Object.assign({}, JSON.parse(fs.readFileSync(f, 'utf-8')), s); }
            } catch { /* ignore */ }
            const port = s.port != null ? s.port : 3000;
            const autoStart = s.autoStart != null ? s.autoStart : false;
            const debug = s.debugLog != null ? s.debugLog : (s.enableDebugLog != null ? s.enableDebugLog : false);
            const maxConn = s.maxConnections != null ? s.maxConnections : 10;
            // Always show the current port (the field is disabled while running, but the
            // value should still reflect the active port). _mcpLoadSettings only runs at
            // page init, so this never clobbers a value the user is typing.
            self.$.mcpPort.value = String(port);
            self.$.mcpAutoStart.checked = !!autoStart;
            self.$.mcpDebugLog.checked = !!debug;
            self.$.mcpMaxConn.value = String(maxConn);
        },

        async _mcpSaveSettings() {
            const self = this as any;
            const fs = require('fs');
            const path = require('path');
            const f = await self._mcpSettingsPath();
            let s: any = {};
            try { if (fs.existsSync(f)) { s = JSON.parse(fs.readFileSync(f, 'utf-8')); } } catch { /* overwrite */ }
            const port = parseInt(self.$.mcpPort.value, 10);
            if (!isNaN(port)) { s.port = port; }
            s.autoStart = self.$.mcpAutoStart.checked;
            s.enableDebugLog = self.$.mcpDebugLog.checked;
            const mc = parseInt(self.$.mcpMaxConn.value, 10);
            if (!isNaN(mc)) { s.maxConnections = mc; }
            if (!s.allowedOrigins) { s.allowedOrigins = ['*']; }
            try {
                fs.mkdirSync(path.dirname(f), { recursive: true });
                fs.writeFileSync(f, JSON.stringify(s, null, 2), 'utf-8');
                self.$.statusBar.textContent = 'Đã lưu cài đặt MCP';
            } catch (e: any) {
                self.$.statusBar.textContent = 'Lưu cài đặt MCP lỗi: ' + (e && e.message);
                return;
            }
            // Best-effort: let a running server pick the change up live.
            try {
                await Editor.Message.request('cocos-mcp-server', 'update-settings', {
                    port: s.port, autoStart: s.autoStart,
                    debugLog: s.enableDebugLog, enableDebugLog: s.enableDebugLog,
                    maxConnections: s.maxConnections, allowedOrigins: s.allowedOrigins,
                });
            } catch { /* engine will read the file on next start */ }
            self._mcpUpdateCfgUrl();
        },

        // ---- Tools sub-tab ----
        async _mcpLoadTools() {
            const self = this as any;
            self._mcpToolsLoaded = true;
            let cfg: any = null;
            try {
                const fs = require('fs');
                const f = await self._mcpToolPath();
                if (fs.existsSync(f)) { cfg = JSON.parse(fs.readFileSync(f, 'utf-8')); }
            } catch { /* ignore */ }
            if (!cfg || !Array.isArray(cfg.configurations)) {
                cfg = { configurations: [], currentConfigId: '', maxConfigSlots: 5 };
            }
            self._mcpToolCfg = cfg;
            self._mcpRenderConfigSel();
            self._mcpRenderTools();
        },
        async _mcpWriteToolCfg() {
            const self = this as any;
            const fs = require('fs');
            const path = require('path');
            const f = await self._mcpToolPath();
            fs.mkdirSync(path.dirname(f), { recursive: true });
            fs.writeFileSync(f, JSON.stringify(self._mcpToolCfg, null, 2), 'utf-8');
        },
        _mcpSelectedConfig(): any {
            const self = this as any;
            const cfg = self._mcpToolCfg;
            if (!cfg || !Array.isArray(cfg.configurations)) { return null; }
            const id = self.$.mcpConfigSel.value;
            return cfg.configurations.find((c: any) => c.id === id)
                || cfg.configurations.find((c: any) => c.id === cfg.currentConfigId)
                || cfg.configurations[0] || null;
        },
        _mcpCatName(cat: string): string {
            if (cat === 'cocos') { return 'Cocos Creator'; }
            return cat || 'Khác';
        },
        _mcpRenderConfigSel() {
            const self = this as any;
            const cfg = self._mcpToolCfg;
            const sel = self.$.mcpConfigSel;
            sel.innerHTML = '';
            for (const c of cfg.configurations) {
                const o = document.createElement('option');
                o.value = c.id;
                o.textContent = c.name || c.id;
                if (c.id === cfg.currentConfigId) { o.selected = true; }
                sel.appendChild(o);
            }
            if (!cfg.configurations.length) {
                const o = document.createElement('option');
                o.value = '';
                o.textContent = '(chưa có cấu hình)';
                sel.appendChild(o);
            }
        },
        _mcpRenderTools() {
            const self = this as any;
            const grid = self.$.mcpToolGrid;
            grid.innerHTML = '';
            const conf = self._mcpSelectedConfig();
            const tools = (conf && Array.isArray(conf.tools)) ? conf.tools : [];
            if (!tools.length) {
                grid.innerHTML = '<div class="mcp-empty">Không có công cụ trong cấu hình này.</div>';
                self.$.mcpToolStats.textContent = '—';
                return;
            }
            const groups: Record<string, any[]> = {};
            for (const t of tools) {
                const cat = t.category || 'khác';
                (groups[cat] = groups[cat] || []).push(t);
            }
            for (const cat of Object.keys(groups)) {
                const card = document.createElement('div');
                card.className = 'mcp-tool-card';
                const head = document.createElement('div');
                head.className = 'mcp-tool-cat';
                const title = document.createElement('span');
                title.textContent = self._mcpCatName(cat);
                const ctrls = document.createElement('div');
                ctrls.className = 'mcp-tool-cat-ctrls';
                const bAll = document.createElement('button');
                bAll.className = 'mcp-mini-btn';
                bAll.textContent = 'Tất cả';
                bAll.addEventListener('click', () => self._mcpSetCategory(cat, true));
                const bNone = document.createElement('button');
                bNone.className = 'mcp-mini-btn';
                bNone.textContent = 'Bỏ';
                bNone.addEventListener('click', () => self._mcpSetCategory(cat, false));
                ctrls.appendChild(bAll);
                ctrls.appendChild(bNone);
                head.appendChild(title);
                head.appendChild(ctrls);
                card.appendChild(head);
                for (const t of groups[cat]) {
                    const item = document.createElement('label');
                    item.className = 'mcp-tool-item';
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.checked = !!t.enabled;
                    cb.addEventListener('change', () => { t.enabled = cb.checked; self._mcpUpdateStats(); });
                    const info = document.createElement('div');
                    info.className = 'mcp-tool-info';
                    const nm = document.createElement('div');
                    nm.className = 'mcp-tool-name';
                    nm.textContent = t.name;
                    const ds = document.createElement('div');
                    ds.className = 'mcp-tool-desc';
                    ds.textContent = (t.description || '').split('\n')[0];
                    ds.title = t.description || '';
                    info.appendChild(nm);
                    info.appendChild(ds);
                    item.appendChild(cb);
                    item.appendChild(info);
                    card.appendChild(item);
                }
                grid.appendChild(card);
            }
            self._mcpUpdateStats();
        },
        _mcpUpdateStats() {
            const self = this as any;
            const conf = self._mcpSelectedConfig();
            const tools = (conf && conf.tools) || [];
            const total = tools.length;
            const en = tools.filter((t: any) => t.enabled).length;
            self.$.mcpToolStats.textContent = `${total} công cụ · ${en} bật · ${total - en} tắt`;
        },
        _mcpSetCategory(cat: string, val: boolean) {
            const self = this as any;
            const conf = self._mcpSelectedConfig();
            if (!conf) { return; }
            for (const t of conf.tools) { if ((t.category || 'khác') === cat) { t.enabled = val; } }
            self._mcpRenderTools();
        },
        _mcpSelectAllTools(val: boolean) {
            const self = this as any;
            const conf = self._mcpSelectedConfig();
            if (!conf) { return; }
            for (const t of conf.tools) { t.enabled = val; }
            self._mcpRenderTools();
        },
        async _mcpSaveTools() {
            const self = this as any;
            const conf = self._mcpSelectedConfig();
            if (!self._mcpToolCfg || !conf) { self.$.statusBar.textContent = 'Chưa có cấu hình để lưu'; return; }
            conf.updatedAt = new Date().toISOString();
            try {
                await self._mcpWriteToolCfg();
                self.$.statusBar.textContent = 'Đã lưu cấu hình công cụ';
            } catch (e: any) {
                self.$.statusBar.textContent = 'Lưu công cụ lỗi: ' + (e && e.message);
                return;
            }
            try {
                const batch = conf.tools.map((t: any) => ({ category: t.category, name: t.name, enabled: t.enabled }));
                await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', batch);
            } catch { /* engine reloads config on next start */ }
        },
        async _mcpApplyConfig() {
            const self = this as any;
            const cfg = self._mcpToolCfg;
            const id = self.$.mcpConfigSel.value;
            if (!cfg || !id) { return; }
            cfg.currentConfigId = id;
            try { await self._mcpWriteToolCfg(); } catch { /* ignore */ }
            try { await Editor.Message.request('cocos-mcp-server', 'setCurrentToolConfiguration', id); } catch { /* ignore */ }
            self._mcpRenderTools();
            self.$.statusBar.textContent = 'Đã áp dụng cấu hình';
        },
        async _mcpDeleteConfig() {
            const self = this as any;
            const cfg = self._mcpToolCfg;
            const id = self.$.mcpConfigSel.value;
            if (!cfg || !id) { return; }
            const idx = cfg.configurations.findIndex((c: any) => c.id === id);
            if (idx < 0) { return; }
            cfg.configurations.splice(idx, 1);
            if (cfg.currentConfigId === id) { cfg.currentConfigId = (cfg.configurations[0] && cfg.configurations[0].id) || ''; }
            try { await Editor.Message.request('cocos-mcp-server', 'deleteToolConfiguration', id); } catch { /* ignore */ }
            try { await self._mcpWriteToolCfg(); } catch { /* ignore */ }
            self._mcpRenderConfigSel();
            self._mcpRenderTools();
            self.$.statusBar.textContent = 'Đã xoá cấu hình';
        },
        _mcpExportConfig() {
            const self = this as any;
            const c = self._mcpSelectedConfig();
            if (!c) { return; }
            const ok = self._mcpCopy(JSON.stringify(c, null, 2));
            self.$.statusBar.textContent = ok ? 'Đã copy JSON cấu hình vào clipboard' : 'Copy thất bại';
        },
        _mcpOpenModal(mode: string) {
            const self = this as any;
            self._mcpModalMode = mode;
            const isImport = mode === 'import';
            self.$.mcpModalTitle.textContent = mode === 'new' ? 'Tạo cấu hình mới'
                : (mode === 'edit' ? 'Sửa cấu hình' : 'Nhập cấu hình');
            self.$.mcpModalNameRow.style.display = isImport ? 'none' : '';
            self.$.mcpModalDescRow.style.display = isImport ? 'none' : '';
            self.$.mcpModalJsonRow.style.display = isImport ? '' : 'none';
            self.$.mcpModalName.value = '';
            self.$.mcpModalDesc.value = '';
            self.$.mcpModalJson.value = '';
            if (mode === 'edit') {
                const c = self._mcpSelectedConfig();
                if (c) { self.$.mcpModalName.value = c.name || ''; self.$.mcpModalDesc.value = c.description || ''; }
            }
            self.$.mcpModal.style.display = '';
        },
        _mcpCloseModal() {
            (this as any).$.mcpModal.style.display = 'none';
        },
        async _mcpModalOk() {
            const self = this as any;
            const cfg = self._mcpToolCfg;
            const mode = self._mcpModalMode;
            if (!cfg) { self._mcpCloseModal(); return; }
            if (mode === 'new') {
                if (cfg.configurations.length >= (cfg.maxConfigSlots || 5)) {
                    self.$.statusBar.textContent = 'Đã đạt số slot cấu hình tối đa (' + (cfg.maxConfigSlots || 5) + ')';
                    return;
                }
                const name = self.$.mcpModalName.value.trim();
                if (!name) { self.$.statusBar.textContent = 'Vui lòng nhập tên cấu hình'; return; }
                const id = self._mcpUuid();
                const base = self._mcpSelectedConfig();
                const tools = base ? JSON.parse(JSON.stringify(base.tools)) : [];
                const now = new Date().toISOString();
                cfg.configurations.push({ id, name, description: self.$.mcpModalDesc.value, tools, createdAt: now, updatedAt: now });
                cfg.currentConfigId = id;
                try { await Editor.Message.request('cocos-mcp-server', 'createToolConfiguration', { id, name, description: self.$.mcpModalDesc.value }); } catch { /* ignore */ }
            } else if (mode === 'edit') {
                const c = self._mcpSelectedConfig();
                if (c) {
                    c.name = self.$.mcpModalName.value.trim() || c.name;
                    c.description = self.$.mcpModalDesc.value;
                    c.updatedAt = new Date().toISOString();
                    try { await Editor.Message.request('cocos-mcp-server', 'updateToolConfiguration', { id: c.id, name: c.name, description: c.description }); } catch { /* ignore */ }
                }
            } else if (mode === 'import') {
                let obj: any;
                try { obj = JSON.parse(self.$.mcpModalJson.value); }
                catch { self.$.statusBar.textContent = 'JSON không hợp lệ'; return; }
                const incoming = Array.isArray(obj.configurations) ? obj.configurations : [obj];
                let added = 0;
                for (const c of incoming) {
                    if (!c || !Array.isArray(c.tools)) { continue; }
                    if (!c.id) { c.id = self._mcpUuid(); }
                    cfg.configurations.push(c);
                    cfg.currentConfigId = c.id;
                    added++;
                }
                if (!added) { self.$.statusBar.textContent = 'Không có cấu hình hợp lệ trong JSON'; return; }
                try { await Editor.Message.request('cocos-mcp-server', 'importToolConfiguration', self.$.mcpModalJson.value); } catch { /* ignore */ }
            }
            try { await self._mcpWriteToolCfg(); } catch { /* ignore */ }
            self._mcpCloseModal();
            self._mcpRenderConfigSel();
            self._mcpRenderTools();
            self.$.statusBar.textContent = 'Đã cập nhật cấu hình công cụ';
        },

        // ---- Quick config sub-tab ----
        async _mcpUpdateCfgUrl() {
            const self = this as any;
            let port: any = null;
            try {
                const fs = require('fs');
                const f = await self._mcpSettingsPath();
                if (fs.existsSync(f)) { port = JSON.parse(fs.readFileSync(f, 'utf-8')).port; }
            } catch { /* ignore */ }
            if (port == null && self.$.mcpPort.value) { port = parseInt(self.$.mcpPort.value, 10); }
            if (port == null || isNaN(port)) { port = 3000; }
            self.$.mcpCfgUrl.value = `http://127.0.0.1:${port}/mcp`;
        },
        _mcpNormClients(res: any): any[] {
            let arr: any[] = [];
            if (Array.isArray(res)) { arr = res; }
            else if (res && Array.isArray(res.clients)) { arr = res.clients; }
            else if (res && Array.isArray(res.data)) { arr = res.data; }
            else if (res && typeof res === 'object') { arr = Object.keys(res).map((k) => Object.assign({ clientType: k }, res[k])); }
            return arr.map((c: any) => ({
                type: c.clientType || c.type || c.id || c.key || c.name,
                name: c.clientName || c.name || c.clientType || c.type || 'Client',
                path: c.configPath || c.path || c.file || '',
                exists: !!(c.exists || c.configured || c.installed),
            })).filter((c: any) => c.type);
        },
        async _mcpLoadClients() {
            const self = this as any;
            const list = self.$.mcpClientList;
            list.innerHTML = '<div class="mcp-empty">Đang tải…</div>';
            let res: any = null;
            try { res = await Editor.Message.request('cocos-mcp-server', 'get-config-status'); } catch { /* ignore */ }
            const clients = self._mcpNormClients(res);
            list.innerHTML = '';
            if (!clients.length) {
                list.innerHTML = '<div class="mcp-empty">Không lấy được danh sách client (cocos-mcp chưa bật?).</div>';
                return;
            }
            for (const c of clients) {
                const row = document.createElement('div');
                row.className = 'mcp-client-item';
                const info = document.createElement('div');
                info.className = 'mcp-client-info';
                const nm = document.createElement('div');
                nm.className = 'mcp-client-name';
                nm.textContent = c.name;
                const pth = document.createElement('div');
                pth.className = 'mcp-client-path';
                pth.textContent = c.path || '';
                const stt = document.createElement('div');
                stt.className = 'mcp-client-status ' + (c.exists ? 'exists' : 'missing');
                stt.textContent = c.exists ? '✓ Đã cấu hình' : '✗ Chưa cấu hình';
                info.appendChild(nm);
                info.appendChild(pth);
                info.appendChild(stt);
                const acts = document.createElement('div');
                acts.className = 'mcp-client-actions';
                const bAdd = document.createElement('button');
                bAdd.className = 'mcp-mini-btn';
                bAdd.textContent = 'Cấu hình';
                bAdd.disabled = !!c.exists;
                bAdd.addEventListener('click', () => self._mcpAddClient(c.type));
                const bDel = document.createElement('button');
                bDel.className = 'mcp-mini-btn mcp-danger';
                bDel.textContent = 'Xoá';
                bDel.disabled = !c.exists;
                bDel.addEventListener('click', () => self._mcpRemoveClient(c.type));
                const bCopy = document.createElement('button');
                bCopy.className = 'mcp-mini-btn';
                bCopy.textContent = 'Copy';
                bCopy.addEventListener('click', () => self._mcpCopyClientConfig(c.type));
                const bOpen = document.createElement('button');
                bOpen.className = 'mcp-mini-btn';
                bOpen.textContent = 'Mở';
                bOpen.addEventListener('click', () => self._mcpOpenConfigFile(c.path));
                acts.appendChild(bAdd);
                acts.appendChild(bDel);
                acts.appendChild(bCopy);
                acts.appendChild(bOpen);
                row.appendChild(info);
                row.appendChild(acts);
                list.appendChild(row);
            }
        },
        async _mcpAddClient(type: string) {
            const self = this as any;
            try {
                await Editor.Message.request('cocos-mcp-server', 'add-to-client', type, self.$.mcpCfgName.value || 'cocos-creator');
                self._mcpLog('ok', 'Đã thêm cấu hình vào ' + type);
            } catch (e: any) { self._mcpLog('err', 'Thêm ' + type + ' lỗi: ' + (e && e.message)); }
            await self._mcpLoadClients();
        },
        async _mcpRemoveClient(type: string) {
            const self = this as any;
            try {
                await Editor.Message.request('cocos-mcp-server', 'remove-from-client', type);
                self._mcpLog('ok', 'Đã gỡ cấu hình khỏi ' + type);
            } catch (e: any) { self._mcpLog('err', 'Gỡ ' + type + ' lỗi: ' + (e && e.message)); }
            await self._mcpLoadClients();
        },
        async _mcpAddAll() {
            const self = this as any;
            try {
                await Editor.Message.request('cocos-mcp-server', 'add-to-all-clients', self.$.mcpCfgName.value || 'cocos-creator');
                self._mcpLog('ok', 'Đã thêm vào tất cả client');
            } catch (e: any) { self._mcpLog('err', 'Thêm tất cả lỗi: ' + (e && e.message)); }
            await self._mcpLoadClients();
        },
        async _mcpRemoveAll() {
            const self = this as any;
            try {
                await Editor.Message.request('cocos-mcp-server', 'remove-from-all-clients');
                self._mcpLog('ok', 'Đã gỡ khỏi tất cả client');
            } catch (e: any) { self._mcpLog('err', 'Gỡ tất cả lỗi: ' + (e && e.message)); }
            await self._mcpLoadClients();
        },
        async _mcpCopyClientConfig(type: string) {
            const self = this as any;
            try {
                const r: any = await Editor.Message.request('cocos-mcp-server', 'generate-client-config', type, self.$.mcpCfgName.value || 'cocos-creator');
                const text = typeof r === 'string' ? r : JSON.stringify(r, null, 2);
                self._mcpCopy(text);
                self._mcpLog('ok', 'Đã copy config ' + type + ' vào clipboard');
            } catch (e: any) { self._mcpLog('err', 'Copy config lỗi: ' + (e && e.message)); }
        },
        async _mcpOpenConfigFile(p: string) {
            const self = this as any;
            try {
                await Editor.Message.request('cocos-mcp-server', 'open-config-file', p);
                self._mcpLog('ok', 'Đã mở file: ' + p);
            } catch (e: any) { self._mcpLog('err', 'Mở file lỗi: ' + (e && e.message)); }
        },
        _mcpSetCliScope(scope: string) {
            const self = this as any;
            self._mcpCliScope = scope;
            self.$.mcpCliUser.classList.toggle('mcp-primary', scope === 'user');
            self.$.mcpCliProject.classList.toggle('mcp-primary', scope === 'project');
            self._mcpRefreshCli();
        },
        _mcpPick(r: any, keys: string[]): string {
            if (!r) { return ''; }
            if (typeof r === 'string') { return r; }
            for (const k of keys) { if (r[k]) { return r[k]; } }
            if (r.commands) { for (const k of keys) { if (r.commands[k]) { return r.commands[k]; } } }
            return '';
        },
        async _mcpRefreshCli() {
            const self = this as any;
            const scope = self._mcpCliScope || 'user';
            let r: any = null;
            try { r = await Editor.Message.request('cocos-mcp-server', 'generate-cli-commands', scope, self.$.mcpCfgName.value || 'cocos-creator'); } catch { /* ignore */ }
            const claude = self._mcpPick(r, ['claude', 'claudeCli', 'claude_cli']);
            const gemini = self._mcpPick(r, ['gemini', 'geminiCli', 'gemini_cli']);
            self.$.mcpCliClaude.textContent = claude || '(không lấy được — cocos-mcp chưa bật?)';
            self.$.mcpCliGemini.textContent = gemini || '(không lấy được)';
        },
        _mcpLog(type: string, msg: string) {
            const self = this as any;
            const box = self.$.mcpLog;
            const empty = box.querySelector('.mcp-log-empty');
            if (empty) { empty.remove(); }
            const row = document.createElement('div');
            row.className = 'mcp-log-item ' + (type || '');
            const t = document.createElement('span');
            t.className = 'mcp-log-time';
            t.textContent = new Date().toLocaleTimeString();
            const m = document.createElement('span');
            m.className = 'mcp-log-msg';
            m.textContent = msg;
            row.appendChild(t);
            row.appendChild(m);
            box.insertBefore(row, box.firstChild);
        },

        // ---- License sub-tab ----
        _mcpMaskEmail(e: string): string {
            if (!e || typeof e !== 'string' || !e.includes('@')) { return e || '—'; }
            const parts = e.split('@');
            const a = parts[0];
            return (a.length <= 2 ? a : a.slice(0, 2) + '***') + '@' + parts[1];
        },
        async _mcpLoadLicense() {
            const self = this as any;
            let info: any = null;
            let machine: any = '';
            try { info = await Editor.Message.request('cocos-mcp-server', 'get-license-info'); } catch { /* ignore */ }
            if (!info) { try { info = await Editor.Message.request('cocos-mcp-server', 'check-license'); } catch { /* ignore */ } }
            try { machine = await Editor.Message.request('cocos-mcp-server', 'get-machine-id'); } catch { /* ignore */ }
            if (machine && typeof machine === 'object') { machine = machine.machineId || machine.id || ''; }
            self.$.mcpMachineId.textContent = machine || '—';
            const licensed = !!(info && (info.licensed || info.valid || info.isValid || info.active || info.activated));
            const email = (info && (info.email || info.userEmail)) || '';
            const type = (info && (info.licenseType || info.type || info.plan)) || '';
            const days = info && (info.daysRemaining != null ? info.daysRemaining : info.remainingDays);
            if (licensed) {
                self.$.mcpLicActivated.style.display = '';
                self.$.mcpLicForm.style.display = 'none';
                self.$.mcpLicEmail.textContent = self._mcpMaskEmail(email);
                self.$.mcpLicType.textContent = type || '—';
                self.$.mcpLicDays.textContent = (days === 9999 || days == null) ? 'Vĩnh viễn' : (days + ' ngày');
                self.$.mcpLicChip.textContent = '● Đã kích hoạt';
                self.$.mcpLicChip.className = 'mcp-lic-chip on';
            } else {
                self.$.mcpLicActivated.style.display = 'none';
                self.$.mcpLicForm.style.display = '';
                self.$.mcpLicChip.textContent = info ? '○ Chưa kích hoạt' : '○ Không rõ';
                self.$.mcpLicChip.className = 'mcp-lic-chip off';
            }
        },
        async _mcpActivate() {
            const self = this as any;
            const email = self.$.mcpLicInEmail.value.trim();
            const code = self.$.mcpLicInCode.value.trim();
            if (!email || !code) {
                self.$.mcpLicMsg.textContent = 'Vui lòng nhập email và mã kích hoạt';
                self.$.mcpLicMsg.className = 'mcp-lic-msg err';
                return;
            }
            self.$.mcpLicMsg.textContent = 'Đang kích hoạt…';
            self.$.mcpLicMsg.className = 'mcp-lic-msg';
            try {
                const r: any = await Editor.Message.request('cocos-mcp-server', 'activate-license', { email, code });
                const ok = r === true || (r && (r.success || r.ok || r.valid || r.licensed || r.activated));
                if (ok || r == null) {
                    self.$.mcpLicMsg.textContent = 'Kích hoạt thành công!';
                    self.$.mcpLicMsg.className = 'mcp-lic-msg ok';
                } else {
                    self.$.mcpLicMsg.textContent = 'Kích hoạt thất bại: ' + ((r && (r.message || r.error)) || 'mã không hợp lệ');
                    self.$.mcpLicMsg.className = 'mcp-lic-msg err';
                }
            } catch (e: any) {
                self.$.mcpLicMsg.textContent = 'Kích hoạt lỗi: ' + (e && e.message);
                self.$.mcpLicMsg.className = 'mcp-lic-msg err';
            }
            await self._mcpLoadLicense();
        },
        async _mcpDeactivate() {
            const self = this as any;
            try { await Editor.Message.request('cocos-mcp-server', 'deactivate-license'); } catch { /* ignore */ }
            self.$.statusBar.textContent = 'Đã đăng xuất bản quyền';
            await self._mcpLoadLicense();
        },
        _mcpChangeCode() {
            const self = this as any;
            self.$.mcpLicForm.style.display = '';
            self.$.mcpLicMsg.textContent = 'Nhập mã mới rồi bấm Kích hoạt để đổi.';
            self.$.mcpLicMsg.className = 'mcp-lic-msg';
            self.$.mcpLicInCode.focus();
        },
        async _mcpCheckUpdate() {
            const self = this as any;
            const btn = self.$.mcpCheckUpdate;
            const old = btn.textContent;
            btn.disabled = true;
            btn.textContent = 'Đang kiểm tra…';
            try {
                const r: any = await Editor.Message.request('cocos-mcp-server', 'check-update');
                const has = r && (r.hasUpdate || r.updateAvailable || r.available
                    || (r.latestVersion && r.currentVersion && r.latestVersion !== r.currentVersion));
                self.$.statusBar.textContent = has
                    ? ('Có bản cập nhật mới: v' + (r.latestVersion || ''))
                    : 'Đang dùng phiên bản mới nhất';
            } catch (e: any) {
                self.$.statusBar.textContent = 'Kiểm tra cập nhật lỗi: ' + (e && e.message);
            }
            btn.textContent = old;
            btn.disabled = false;
        },

        // Load the items for the currently-selected album (one album per asset format).
        async _loadLocal() {
            const self = this as any;
            const album = ALBUMS.find((a) => a.key === self._album) || ALBUMS[0];
            await self._loadLibrary(album);
        },

        // Scan assets/library-extension/<Format> for the album's file extensions and
        // build the item list. Preview sources depend on the format:
        //   render (VFX/Prefab/FBX): per-asset GIF cached under local/vfx-thumbs/packs/<uuid>.gif
        //   image  (Texture/Spine): the image file itself / a sibling skeleton texture
        //   audio  (Audio): play/pause via a Blob URL
        //   icon   (Animation): static glyph placeholder
        // The VFX album additionally merges the importer's webm thumbnail cache and,
        // for legacy projects, the profile's importFolder when it differs.
        async _loadLibrary(album: any) {
            const self = this as any;
            const path = require('path');
            const fs = require('fs');
            const def: AssetTypeDef = album.def;
            const proj = await self._projectRoot();
            const typeDir = libraryTypeDir(def);
            const thumbDir = path.join(proj, 'local', 'vfx-thumbs', 'packs');
            self._packThumbDir = thumbDir;
            self._spineThumbDir = path.join(proj, 'local', 'vfx-thumbs', 'spine');

            // Folder roots to scan. The VFX album also covers the pre-conversion
            // locations (old importFolder default + pack folders) and any custom
            // importFolder saved in the profile, so legacy libraries keep showing.
            const roots: Array<{ folder: string; excludeGpu?: boolean }> = [{ folder: typeDir }];
            if (def.key === 'vfx') {
                try {
                    const profileFolder = (await Editor.Profile.getProject('vfx-browser', 'importFolder'))
                        || DEFAULT_VFX_IMPORT_FOLDER;
                    // Skip folders the typeDir scan already covers (inside _VFX) and
                    // ancestors of the library root (e.g. 'assets'), which would
                    // subsume every other album's folder.
                    const redundant = !profileFolder
                        || LIBRARY_ROOT === profileFolder
                        || LIBRARY_ROOT.startsWith(profileFolder + '/')
                        || profileFolder === typeDir
                        || profileFolder.startsWith(typeDir + '/');
                    if (!redundant) { roots.push({ folder: profileFolder }); }
                } catch { /* profile unavailable */ }
                for (const legacy of LEGACY_VFX_SCAN_ROOTS) {
                    if (!roots.some((r) => r.folder === legacy.folder)) { roots.push(legacy); }
                }
            }

            const items: any[] = [];
            const seenUuid = new Set<string>();
            const seenStem = new Set<string>();
            for (const root of roots) {
                let assets: any[] = [];
                try {
                    assets = (await Editor.Message.request('asset-db', 'query-assets', {
                        pattern: `db://${root.folder}/**/*`,
                    })) || [];
                } catch { /* asset-db not ready */ }

                for (const a of assets) {
                    const url: string = a.url || a.path || a.source || '';
                    const dot = url.lastIndexOf('.');
                    const ext = dot >= 0 ? url.slice(dot).toLowerCase() : '';
                    if (!def.extensions.includes(ext)) continue;
                    const uuid: string = a.uuid || '';
                    // '@' marks virtual sub-assets (e.g. the prefab embedded in an
                    // imported .glb: .../meshes/Quad.glb/Quad.prefab) — not library items.
                    if (uuid.includes('@')) continue;
                    if (uuid && seenUuid.has(uuid)) continue;
                    if (uuid) seenUuid.add(uuid);
                    // Wrong importer for the declared extensions (e.g. a plain config
                    // .json in the Spine folder imports as cc.JsonAsset, not spine-data).
                    if (def.importers && a.importer && !def.importers.includes(a.importer)) continue;
                    if (root.excludeGpu && /\/GPU\//i.test(url)) continue;
                    // A skeleton shipped as both .json and .skel is one item, not two.
                    if (def.key === 'spine') {
                        const stemKey = url.slice(0, url.length - ext.length).toLowerCase();
                        if (seenStem.has(stemKey)) continue;
                        seenStem.add(stemKey);
                    }

                    const rel = url.startsWith(`db://${root.folder}/`) ? url.slice(`db://${root.folder}/`.length) : url;
                    const base = rel.split('/').pop() || '';
                    let name = base.slice(0, base.length - ext.length);
                    // Importer-created VFX live at <name>/prefab/<name>.prefab — surface
                    // the effect name and skip the folder shape in the category path.
                    const importerShape = def.key === 'vfx' ? url.match(/\/([^/]+)\/prefab\/[^/]+\.prefab$/) : null;
                    if (importerShape) { name = importerShape[1]; }
                    // Old server data baked an _IKAME brand suffix into effect names;
                    // normalize so display, cache merge and imported-state all agree.
                    if (def.key === 'vfx') { name = self._stripBrand(name); }

                    let category = '';
                    if (importerShape) {
                        const relDir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
                        category = relDir.split('/').slice(0, -2).join('/'); // drop <name>/prefab
                    } else if (rel.includes('/')) {
                        category = rel.slice(0, rel.lastIndexOf('/'));
                    }
                    category = self._displayCategory(def, category);

                    const absPath = path.join(proj, url.replace('db://', ''));
                    const item: any = {
                        name, ext, kind: def.key, category,
                        assetPath: url, assetUuid: uuid,
                        // Real cc type (e.g. cc.Prefab / cc.ImageAsset) as reported by
                        // asset-db — used as the drag type when dropping into the scene.
                        _ccType: (a as any).type || '',
                        _absPath: absPath,
                        _thumbAbs: '', _thumbMime: '', _webmAbs: '', _audioAbs: '',
                        _renderable: false, _needsThumb: false,
                    };

                    if (def.key === 'spine') {
                        // Animated capture per (skin, animation). Lists/defaults come
                        // from the sidecar of an earlier capture, else the .json
                        // skeleton itself; the first capture reports them otherwise.
                        item._renderable = true;
                        let info: any = null;
                        let fromSidecar = false;
                        try {
                            const sc = path.join(self._spineThumbDir, `${uuid}.json`);
                            if (uuid && fs.existsSync(sc)) {
                                info = JSON.parse(fs.readFileSync(sc, 'utf-8'));
                                fromSidecar = true;
                            }
                        } catch { /* sidecar unreadable */ }
                        if (!info && ext === '.json') {
                            try {
                                const j = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
                                // Prefer a skin that actually has attachments — the
                                // implicit "default" skin is empty in skin-based exports.
                                let skinNames: string[] = [];
                                let best = '';
                                if (Array.isArray(j.skins)) {
                                    skinNames = j.skins.map((s: any) => s.name);
                                    const w = j.skins.find((s: any) => s.attachments && Object.keys(s.attachments).length > 0);
                                    best = w ? w.name : '';
                                } else {
                                    const entries = Object.entries(j.skins || {});
                                    skinNames = entries.map(([n]) => n);
                                    const w = entries.find(([, v]: any) => v && Object.keys(v as any).length > 0);
                                    best = w ? (w[0] as string) : '';
                                }
                                info = { skins: skinNames, animations: Object.keys(j.animations || {}), defaultSkin: best };
                            } catch { /* not a parsable skeleton json */ }
                        }
                        item._spineSkins = (info && info.skins) || [];
                        item._spineAnims = (info && info.animations) || [];
                        item._spineSkin = (info && info.defaultSkin)
                            || (item._spineSkins.indexOf('default') >= 0 ? 'default' : (item._spineSkins[0] || ''));
                        item._spineAnim = (info && info.defaultAnim) || item._spineAnims[0] || '';
                        // Only a sidecar combo is capture-verified; a parsed guess must
                        // not be sent as an explicit skin (it would disable the scene's
                        // empty-skin fallback).
                        item._spineComboExplicit = fromSidecar;
                        const gif = self._spineGifPath(item);
                        let hasGif = false;
                        try { hasGif = !!gif && fs.existsSync(gif); } catch { /* ignore */ }
                        if (hasGif) {
                            item._thumbAbs = gif;
                            item._thumbMime = 'image/gif';
                        } else {
                            item._needsThumb = true;
                            // Static skeleton texture stands in until the capture lands.
                            const sib = self._findSiblingImage(absPath);
                            if (sib) {
                                item._thumbAbs = sib;
                                const idot = sib.lastIndexOf('.');
                                item._thumbMime = mimeForExt(idot >= 0 ? sib.slice(idot) : '');
                            }
                        }
                    } else if (def.preview === 'render') {
                        item._renderable = true;
                        const gif = uuid ? path.join(thumbDir, `${uuid}.gif`) : '';
                        try {
                            if (gif && fs.existsSync(gif)) { item._thumbAbs = gif; item._thumbMime = 'image/gif'; }
                            else { item._needsThumb = true; }
                        } catch { item._needsThumb = true; }
                    } else if (def.preview === 'image') {
                        if (absPath) {
                            item._thumbAbs = absPath;
                            item._thumbMime = mimeForExt(ext);
                        }
                    } else if (def.preview === 'audio') {
                        item._audioAbs = absPath;
                    }

                    items.push(item);
                }
            }

            if (def.key === 'vfx') {
                self._mergeVfxCache(items);
                items.sort((a, b) => (b.importedAt || 0) - (a.importedAt || 0) || a.name.localeCompare(b.name));
            } else {
                items.sort((a, b) => a.name.localeCompare(b.name));
            }
            self._localItems = items;
        },

        // Fold the importer's local cache (local/vfx-thumbs/*.json + .webm) into the
        // VFX item list: animated webm previews + server metadata for imported
        // effects, plus cache-only records whose prefab isn't in the scan roots.
        _mergeVfxCache(items: any[]) {
            const self = this as any;
            const path = require('path');
            const fs = require('fs');
            const byName = new Map<string, any>();
            for (const it of items) { byName.set(it.name, it); }
            const cacheDir = path.dirname(self._packThumbDir); // local/vfx-thumbs
            try {
                if (!fs.existsSync(cacheDir)) return;
                for (const f of fs.readdirSync(cacheDir)) {
                    if (!f.endsWith('.json')) continue;
                    try {
                        const rec = JSON.parse(fs.readFileSync(path.join(cacheDir, f), 'utf-8'));
                        if (!rec.name) continue;
                        // Records written before brand-stripping carry an _IKAME
                        // suffix; normalize so they match today's clean item names
                        // instead of surfacing as duplicate "X_IKAME" ghost cards.
                        const recName = self._stripBrand(rec.name);
                        const webm = path.join(cacheDir, rec.thumb || f.replace(/\.json$/, '.webm'));
                        const webmAbs = fs.existsSync(webm) ? webm : '';
                        let item = byName.get(recName);
                        const cacheOnly = !item;
                        if (!item) {
                            // Imported record whose prefab isn't on disk here (or lives
                            // outside the scan roots) — still show it from the cache.
                            item = {
                                name: recName, ext: '.prefab', kind: 'vfx', category: '',
                                assetPath: rec.prefabPath || '', assetUuid: rec.prefabUuid || '',
                                _absPath: '', _thumbAbs: '', _thumbMime: '', _webmAbs: '', _audioAbs: '',
                                _renderable: false, _needsThumb: false,
                            };
                            items.push(item);
                            byName.set(recName, item);
                        }
                        item.id = rec.id || '';
                        // Scan-backed items keep their folder-derived category (the
                        // on-disk tree is the display truth). Only cache-only ghosts
                        // fall back to the server category, filed under Custom_VFX.
                        if (cacheOnly) {
                            const vfxDef = (ALBUMS.find((a) => a.key === 'vfx') as any).def;
                            item.category = self._displayCategory(vfxDef, `Custom_VFX/${rec.category || ''}`);
                        }
                        item.particleCount = rec.particleCount || 0;
                        item.fileSize = rec.fileSize || 0;
                        item.importedAt = rec.importedAt || 0;
                        if (webmAbs) {
                            item._webmAbs = webmAbs;
                            item._needsThumb = false; // webm preview wins over GIF rendering
                        }
                        // Only scan-backed items count as imported. A cache-only record
                        // means the prefab is gone from the project — marking it imported
                        // would make the Hub tab refuse to ever re-import it.
                        if (!cacheOnly && self._imported instanceof Map) {
                            self._imported.set(recName, { path: item.assetPath || '', uuid: item.assetUuid || '' });
                        }
                    } catch { /* skip malformed record */ }
                }
            } catch { /* cache dir unreadable */ }
        },

        // Collapse a raw folder path into the category node an item files under:
        // flattened pack folders become one node, and the tree is capped at the
        // type's categoryDepth (e.g. Custom_VFX → EpicToonFX, nothing deeper).
        _displayCategory(def: AssetTypeDef, category: string): string {
            if (!category) return '';
            if (def.flattenTopFolders) {
                const top = category.split('/')[0];
                if (def.flattenTopFolders.includes(top)) { return top; }
            }
            if (def.categoryDepth) {
                return category.split('/').slice(0, def.categoryDepth).join('/');
            }
            return category;
        },

        // Best-effort preview texture for a Spine skeleton: an image next to the
        // skeleton file — exact basename match first, then any image in the folder.
        _findSiblingImage(skelAbs: string): string {
            const path = require('path');
            const fs = require('fs');
            try {
                const dir = path.dirname(skelAbs);
                const stem = path.basename(skelAbs).replace(/\.[^.]+$/, '');
                const IMG = ['.png', '.jpg', '.jpeg', '.webp'];
                const files: string[] = fs.readdirSync(dir);
                for (const e of IMG) {
                    if (files.includes(stem + e)) { return path.join(dir, stem + e); }
                }
                const any = files.find((f: string) => IMG.includes(path.extname(f).toLowerCase()));
                return any ? path.join(dir, any) : '';
            } catch { return ''; }
        },

        // Cache path of the animated capture for an arbitrary (skin, animation).
        _spineGifKey(uuid: string, skin: string, anim: string): string {
            const self = this as any;
            if (!uuid || !self._spineThumbDir) return '';
            const path = require('path');
            const slug = (s: string) => (s || '_').replace(/[^a-zA-Z0-9_.-]/g, '_');
            return path.join(self._spineThumbDir, `${uuid}.${slug(skin)}.${slug(anim)}.gif`);
        },

        // Cache path of the animated capture for the item's CURRENT (skin, animation).
        _spineGifPath(rec: any): string {
            const self = this as any;
            if (!rec) return '';
            return self._spineGifKey(rec.assetUuid, rec._spineSkin, rec._spineAnim);
        },

        // Serialize on-demand captures with the batch generator: takes the shared
        // _thumbGenRunning lock for the duration of fn, then hands off to any batch
        // run that was queued while the lock was held. Returns false (without
        // running fn) when a capture is already in flight.
        async _withThumbLock(fn: () => Promise<void>): Promise<boolean> {
            const self = this as any;
            if (self._thumbGenRunning) return false;
            self._thumbGenRunning = true;
            try {
                await fn();
            } finally {
                self._thumbGenRunning = false;
                const queued = self._thumbGenPending;
                self._thumbGenPending = null;
                if (queued && self._page === 'local' && self._album === queued.albumKey) {
                    const next = ALBUMS.find((a: any) => a.key === queued.albumKey);
                    if (next) { self._startThumbGeneration(next, queued.force); }
                }
            }
            return true;
        },

        // Persist a spine item's lists + last-previewed combination, so the next
        // session restores the same selection (and gets a cache hit for .skel
        // skeletons, whose lists can't be read without the scene process).
        _writeSpineSidecar(rec: any) {
            const self = this as any;
            if (!rec.assetUuid || !self._spineThumbDir) return;
            try {
                const path = require('path');
                const fs = require('fs');
                fs.mkdirSync(self._spineThumbDir, { recursive: true });
                fs.writeFileSync(
                    path.join(self._spineThumbDir, `${rec.assetUuid}.json`),
                    JSON.stringify({
                        skins: rec._spineSkins || [],
                        animations: rec._spineAnims || [],
                        defaultSkin: rec._spineSkin || '',
                        defaultAnim: rec._spineAnim || '',
                    }, null, 2), 'utf-8');
            } catch { /* cache write is best-effort */ }
        },

        // Switch the previewed (skin, animation) of a spine card: reuse the cached
        // capture when one exists, otherwise render it now. The record is only
        // mutated once the switch is actually happening (cache hit or lock taken),
        // so a busy generator can't leave selects desynced from the shown thumb.
        async _setSpineCombo(uuid: string, skin: string, anim: string) {
            const self = this as any;
            const rec = self._localItems.find((r: any) => r.kind === 'spine' && r.assetUuid === uuid);
            if (!rec) return;
            const fs = require('fs');
            const gif = self._spineGifKey(uuid, skin, anim);
            let hasGif = false;
            try { hasGif = !!gif && fs.existsSync(gif); } catch { /* ignore */ }
            if (hasGif) {
                rec._spineSkin = skin;
                rec._spineAnim = anim;
                rec._spineComboExplicit = true; // user picked it
                rec._thumbAbs = gif;
                rec._thumbMime = 'image/gif';
                rec._needsThumb = false;
                self._setCardThumb(uuid, gif);
                self._writeSpineSidecar(rec);
                return;
            }
            const started = await self._withThumbLock(async () => {
                rec._spineSkin = skin;
                rec._spineAnim = anim;
                rec._spineComboExplicit = true; // user picked it — render exactly this
                self.$.statusBar.textContent = `Rendering "${rec.name}" (${skin || 'default skin'} / ${anim || 'first state'})...`;
                try {
                    await self._generateOneThumb(rec);
                    self.$.statusBar.textContent = (rec._thumbAbs && rec._thumbAbs === self._spineGifPath(rec))
                        ? `"${rec.name}" — ${rec._spineSkin} / ${rec._spineAnim}`
                        : `"${rec.name}" produced no frames`;
                } catch {
                    self.$.statusBar.textContent = `Failed to render "${rec.name}"`;
                }
            });
            if (!started) {
                // Busy — nothing was mutated; snap the selects back to the record.
                self._updateSpineControls(rec);
                self.$.statusBar.textContent = 'A capture is already running — try again when it finishes.';
            }
        },

        // Refresh a spine card's selects in place after a capture reported the
        // asset's real skin/animation lists.
        _updateSpineControls(rec: any) {
            const self = this as any;
            const card = self.$.vfxList.querySelector(`.vfx-card[data-thumb-uuid="${rec.assetUuid}"]`);
            if (!card) return;
            const fill = (sel: HTMLSelectElement | null, values: string[], selected: string) => {
                if (!sel) return;
                sel.innerHTML = '';
                sel.disabled = !values.length;
                if (!values.length) {
                    const o = document.createElement('option');
                    o.value = '';
                    o.textContent = '—';
                    sel.appendChild(o);
                    return;
                }
                for (const v of values) {
                    const o = document.createElement('option');
                    o.value = v;
                    o.textContent = v;
                    if (v === selected) { o.selected = true; }
                    sel.appendChild(o);
                }
            };
            fill(card.querySelector('.spine-skin'), rec._spineSkins || [], rec._spineSkin || '');
            fill(card.querySelector('.spine-anim'), rec._spineAnims || [], rec._spineAnim || '');
        },

        // Skin + animation-state selectors shown on spine cards.
        _makeSpineControls(spec: any): HTMLElement {
            const self = this as any;
            const wrap = document.createElement('div');
            wrap.className = 'spine-controls';
            const mk = (cls: string, title: string, values: string[], selected: string) => {
                const sel = document.createElement('select');
                sel.className = cls;
                sel.title = title;
                if (!values.length) {
                    const o = document.createElement('option');
                    o.value = '';
                    o.textContent = '—';
                    sel.appendChild(o);
                    sel.disabled = true;
                } else {
                    for (const v of values) {
                        const o = document.createElement('option');
                        o.value = v;
                        o.textContent = v;
                        if (v === selected) { o.selected = true; }
                        sel.appendChild(o);
                    }
                }
                return sel;
            };
            const skinSel = mk('spine-skin', 'Skin', spec.skins || [], spec.skin || '');
            const animSel = mk('spine-anim', 'Animation state', spec.anims || [], spec.anim || '');
            const onChange = () => { self._setSpineCombo(spec.uuid, skinSel.value, animSel.value); };
            skinSel.addEventListener('change', onChange);
            animSel.addEventListener('change', onChange);
            wrap.appendChild(skinSel);
            wrap.appendChild(animSel);
            return wrap;
        },

        // Lazily set a thumbnail <video> source: local cached webm (blob) first, server fallback.
        _ensureThumbSrc(video: HTMLVideoElement) {
            if (video.src) return;
            const local = video.dataset.local;
            if (local) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(local)) {
                        const buf = fs.readFileSync(local);
                        video.src = URL.createObjectURL(new Blob([buf as any], { type: 'video/webm' }));
                        return;
                    }
                } catch { /* fall through to server */ }
            }
            if (video.dataset.src) { video.src = video.dataset.src; }
        },

        // Lazily set an <img> source from a local file (GIF/PNG/JPG/..., blob URL).
        _ensureImgSrc(img: HTMLImageElement) {
            if (img.src) return;
            const local = img.dataset.local;
            if (!local) return;
            try {
                const fs = require('fs');
                if (fs.existsSync(local)) {
                    const buf = fs.readFileSync(local);
                    const mime = img.dataset.mime || 'image/gif';
                    img.src = URL.createObjectURL(new Blob([buf as any], { type: mime }));
                }
            } catch { /* file vanished — placeholder stays */ }
        },

        // (Re)create the lazy-load observer scoped to the list scroll container.
        // Handles both animated <video> (Hub webm) and <img> (pack GIF) thumbs.
        _resetThumbObserver() {
            const self = this as any;
            const list = self.$.vfxList;
            if (self._thumbObserver) self._thumbObserver.disconnect();
            self._thumbObserver = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
                for (const entry of entries) {
                    const el = entry.target as HTMLElement;
                    if (el.tagName === 'IMG') {
                        if (entry.isIntersecting) { self._ensureImgSrc(el as HTMLImageElement); }
                        continue;
                    }
                    const video = el as HTMLVideoElement;
                    if (entry.isIntersecting) {
                        self._ensureThumbSrc(video);
                        video.play().catch(() => { /* autoplay deferred until data loads */ });
                    } else if (!video.paused) {
                        video.pause();
                    }
                }
            }, { root: list, rootMargin: '120px' });
        },

        // Build a lazily-loaded <img> for a local image file (cached GIF, texture, ...).
        _makeThumbImg(localPath: string, mime?: string): HTMLImageElement {
            const self = this as any;
            const img = document.createElement('img');
            img.className = 'card-thumb';
            img.dataset.local = localPath;
            if (mime) { img.dataset.mime = mime; }
            img.addEventListener('error', () => { img.classList.add('thumb-error'); });
            if (self._thumbObserver) { self._thumbObserver.observe(img); }
            return img;
        },

        // Swap a pack card's placeholder for its freshly-generated GIF in place,
        // so generation progress doesn't disturb scroll position.
        _setCardThumb(uuid: string, localPath: string) {
            const self = this as any;
            const list = self.$.vfxList;
            const card = list.querySelector(`.vfx-card[data-thumb-uuid="${uuid}"]`);
            if (!card) return;
            const wrap = card.querySelector('.card-thumb-wrap');
            if (!wrap) return;
            const old = wrap.querySelector('.card-thumb') as HTMLElement | null;
            const img = self._makeThumbImg(localPath);
            if (old) { wrap.replaceChild(img, old); } else { wrap.insertBefore(img, wrap.firstChild); }
            // Release the previous blob and load the new file right away, so a
            // regenerated thumbnail updates on screen without waiting on scroll.
            try {
                const prev = (old as HTMLImageElement) && (old as HTMLImageElement).src;
                if (prev && prev.startsWith('blob:')) { URL.revokeObjectURL(prev); }
            } catch { /* ignore */ }
            self._ensureImgSrc(img);
        },

        // Kick off background thumbnail generation for render-previewed albums
        // (only the prefabs still missing a thumbnail).
        _maybeGenerateThumbs() {
            const self = this as any;
            if (self._page !== 'local') return;
            const album = ALBUMS.find((a: any) => a.key === self._album);
            if (!album || album.def.preview !== 'render') return;
            self._startThumbGeneration(album, false);
        },

        // Serially render + cache a GIF thumbnail for prefab-backed items. force=false
        // only does the ones still missing; force=true re-renders every prefab
        // (overwrite), used by the Regenerate button to apply new framing to existing
        // thumbnails. Cancels cleanly when the album/page changes or the panel closes.
        // If a previous run is still unwinding (its in-flight capture takes seconds),
        // the request is queued and started from that run's finally block.
        async _startThumbGeneration(album: any, force: boolean) {
            const self = this as any;
            if (self._thumbGenRunning) {
                self._thumbGenPending = { albumKey: album.key, force };
                return;
            }
            const token = self._thumbGenToken;
            // _needsThumb alone decides (spine cards may hold a static stand-in
            // image in _thumbAbs while still needing their animated capture).
            const pending = self._localItems.filter(
                (r: any) => r._renderable && r.assetUuid && !r._webmAbs && (force || r._needsThumb)
            );
            if (!pending.length) {
                self.$.statusBar.textContent = `${album.label} — nothing to generate`;
                return;
            }
            self._thumbGenRunning = true;
            self._lastDiag = null; // don't let a previous run/album trip the empty-render banner
            self.$.statusBar.classList.add('busy');
            self._renderAlbumBar(); // reflect the running state on the Regenerate button
            try {
                for (let i = 0; i < pending.length; i++) {
                    if (self._thumbGenToken !== token) return; // view changed — stop
                    const rec = pending[i];
                    self.$.statusBar.textContent = `${album.label} — generating thumbnails ${i + 1}/${pending.length}...`;
                    try { await self._generateOneThumb(rec); } catch { /* keep placeholder */ }
                }
                if (self._thumbGenToken === token) {
                    const d = self._lastDiag;
                    if (d && d.nonClearFrac === 0) {
                        // Rendered, but nothing but clear-colour landed — surface why,
                        // with the fields the capture kind actually reports.
                        const detail = d.kind === 'model'
                            ? `mesh=${d.meshCount} mode=${d.mode} tick=${d.ticked} nz=${d.nonZeroFrac} nc=${d.nonClearFrac} r=${d.radius}`
                            : d.kind === 'material'
                                ? `material tick=${d.ticked} nz=${d.nonZeroFrac} nc=${d.nonClearFrac} r=${d.radius}`
                                : d.psCount !== undefined
                                    ? `ps=${d.psCount} tick=${d.ticked} nz=${d.nonZeroFrac} nc=${d.nonClearFrac} r=${d.radius}`
                                    : `skins=${d.skins} anims=${d.animations} tick=${d.ticked} nc=${d.nonClearFrac} oh=${d.orthoHeight}`;
                        self.$.statusBar.textContent = `${album.label} — ⚠ empty render (${detail})`;
                    } else {
                        self.$.statusBar.textContent = `${album.label} — ${self._localItems.length} items`;
                    }
                }
            } finally {
                self._thumbGenRunning = false;
                self.$.statusBar.classList.remove('busy');
                if (self._page === 'local') { self._renderAlbumBar(); }
                // Start the run queued while this one was still unwinding (album
                // switch mid-generation) — but only if that album is still in view.
                const queued = self._thumbGenPending;
                self._thumbGenPending = null;
                if (queued && self._page === 'local' && self._album === queued.albumKey) {
                    const next = ALBUMS.find((a: any) => a.key === queued.albumKey);
                    if (next) { self._startThumbGeneration(next, queued.force); }
                } else if (self._thumbGenToken !== token && self._page === 'local' && self._album === album.key) {
                    // Manual Stop: replace the 'stopping generation...' notice once
                    // the loop has actually unwound. (Album/page switches set their
                    // own status and are excluded by the view checks above.)
                    self.$.statusBar.textContent = `${album.label} — generation stopped`;
                }
            }
        },

        // Re-scan the on-disk cache and (re)generate thumbnails that are still
        // missing or failed earlier this session. While running, acts as Stop.
        async _regenerateThumbs() {
            const self = this as any;
            const album = ALBUMS.find((a) => a.key === self._album);
            if (!album || album.def.preview !== 'render') return;
            if (self._thumbGenRunning) {
                // Signal the running loop to stop; its finally block clears the flag
                // and restores the button. Resetting the flag here would let a second
                // loop start while the old one is still awaiting a capture.
                self._thumbGenToken++;
                self._thumbGenPending = null; // a manual Stop also cancels any queued run
                self.$.statusBar.textContent = `${album.label} — stopping generation...`;
                return;
            }
            // Force-rebuild every thumbnail in the album (overwrite existing) so the
            // current framing/render settings are applied to all of them.
            await self._loadLocal();
            self._renderLocal();
            self._startThumbGeneration(album, true);
        },

        // Force a fresh capture for a single renderable item (used to redo a
        // bad/empty cached thumbnail). Takes the shared capture lock.
        async _regenerateOneByUuid(uuid: string) {
            const self = this as any;
            const rec = self._localItems.find((r: any) => r._renderable && r.assetUuid === uuid);
            if (!rec) return;
            const started = await self._withThumbLock(async () => {
                self.$.statusBar.textContent = `Regenerating "${rec.name}"...`;
                try {
                    await self._generateOneThumb(rec); // overwrites the cache + refreshes the card
                    // Spine cards keep a static stand-in / older gif in _thumbAbs, so
                    // success means "the CURRENT combo's gif exists now".
                    const ok = rec.kind === 'spine'
                        ? (!!rec._thumbAbs && rec._thumbAbs === self._spineGifPath(rec))
                        : !!rec._thumbAbs;
                    self.$.statusBar.textContent = ok
                        ? `Regenerated "${rec.name}"`
                        : `"${rec.name}" produced no frames`;
                } catch {
                    self.$.statusBar.textContent = `Failed to regenerate "${rec.name}"`;
                }
            });
            if (!started) {
                self.$.statusBar.textContent = 'Generation in progress — press Stop first.';
            }
        },

        // An FBX/glTF file imports as a hierarchy of sub-assets; the instantiable
        // one is its "gltf-scene" prefab. Resolve that (and a mesh fallback for
        // mesh-only glbs) from the on-disk .meta — assetFinder.scenes/.meshes hold
        // the sub-asset uuids directly, so no async asset-db round-trip is needed.
        // Cached on the record: {prefabUuid, meshUuid} (either may be '').
        _resolveModelRefs(rec: any): { prefabUuid: string; meshUuid: string } {
            if (rec._modelRefs) { return rec._modelRefs; }
            const fs = require('fs');
            let prefabUuid = '';
            let meshUuid = '';
            try {
                const metaPath = (rec._absPath || '') + '.meta';
                if (rec._absPath && fs.existsSync(metaPath)) {
                    const m = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
                    const af = m && m.userData && m.userData.assetFinder;
                    if (af && Array.isArray(af.scenes) && af.scenes.length) { prefabUuid = af.scenes[0]; }
                    if (af && Array.isArray(af.meshes) && af.meshes.length) { meshUuid = af.meshes[0]; }
                    // Fallback: scan subMetas for the prefab (gltf-scene) importer.
                    if (!prefabUuid && m && m.subMetas) {
                        for (const k of Object.keys(m.subMetas)) {
                            const sm = m.subMetas[k];
                            if (sm && sm.importer === 'gltf-scene') { prefabUuid = sm.uuid; break; }
                        }
                    }
                }
            } catch { /* meta unreadable — leave both empty */ }
            rec._modelRefs = { prefabUuid, meshUuid };
            return rec._modelRefs;
        },

        // Render one prefab (particles), spine skeleton, or 3D model (FBX/glTF) to
        // frames in the scene process, encode an animated GIF, cache it to disk, and
        // swap the card's placeholder for it.
        async _generateOneThumb(rec: any) {
            const self = this as any;
            const isSpine = rec.kind === 'spine';
            const isModel = rec.kind === 'fbx';
            const isMaterial = rec.kind === 'material';
            const captureOpts: any = {
                width: THUMB_CAPTURE.width, height: THUMB_CAPTURE.height,
                frameCount: THUMB_CAPTURE.frameCount, delayMs: THUMB_CAPTURE.delayMs,
            };
            if (isSpine) {
                // A guessed skin must stay non-explicit so the scene process can fall
                // back to a skin that actually renders (empty "default" skin case).
                if (rec._spineComboExplicit) { captureOpts.skin = rec._spineSkin || ''; }
                captureOpts.animation = rec._spineAnim || '';
            }
            // The scene process can't reach the asset-db, so the prefab sub-asset (or
            // mesh) is resolved here and passed by uuid.
            let modelPrefabUuid = '';
            if (isModel) {
                const refs = self._resolveModelRefs(rec);
                modelPrefabUuid = refs.prefabUuid;
                captureOpts.meshUuid = refs.meshUuid;
                if (!refs.prefabUuid && !refs.meshUuid) {
                    console.warn(`[VFX] model "${rec.name}" has no prefab/mesh sub-asset — skipping`);
                    rec._needsThumb = false; // nothing renderable this session
                    return;
                }
            }
            const method = isSpine ? 'captureSpinePreview'
                : isModel ? 'captureModelPreview'
                    : isMaterial ? 'captureMaterialPreview'
                        : 'captureParticlePreview';
            const captureUuid = isModel ? modelPrefabUuid : rec.assetUuid;
            const res: any = await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'vfx-browser',
                method,
                args: [captureUuid, captureOpts],
            });
            if (res && (res.diag || res.warnings)) {
                console.log(`[VFX] thumb "${rec.name}"`, res.diag || {}, res.warnings || []);
                if (res.diag) { self._lastDiag = res.diag; }
            }
            if (isSpine && res) {
                // The capture reports the asset's real skin/animation lists and
                // which combination it actually used — sync the card's selectors.
                if (Array.isArray(res.skins) && res.skins.length) { rec._spineSkins = res.skins; }
                if (Array.isArray(res.animations) && res.animations.length) { rec._spineAnims = res.animations; }
                if (res.usedSkin) { rec._spineSkin = res.usedSkin; }
                if (res.usedAnimation) { rec._spineAnim = res.usedAnimation; }
                if (res.ok) { rec._spineComboExplicit = true; } // capture-verified combo
                self._updateSpineControls(rec);
            }
            // The new scene script reports `fitFrac`. If it's missing, the editor is
            // still running an old scene.js — regenerating would re-use stale framing.
            if (res && res.ok && res.diag && res.diag.fitFrac === undefined && !self._staleSceneWarned) {
                self._staleSceneWarned = true;
                self.$.statusBar.textContent = '⚠ Scene script is stale — restart the editor to load the new thumbnail code.';
                console.warn('[VFX] scene.js appears stale (no fitFrac in diag). Restart the editor / reopen the scene.');
            }
            if (!res || !res.ok || !Array.isArray(res.frames) || res.frames.length === 0) {
                console.warn(`[VFX] thumb "${rec.name}" failed:`, res && res.error, res && res.diag);
                rec._needsThumb = false; // don't re-attempt a prefab that won't render this session
                return;
            }
            const path = require('path');
            const fs = require('fs');
            const { encodeAnimatedGif } = require('../../services/gif-encoder');
            const frames = res.frames.map((b64: string) => new Uint8Array(Buffer.from(b64, 'base64')));
            const gifBytes = encodeAnimatedGif(frames, res.width, res.height, {
                delayCs: Math.max(2, Math.round((res.delayMs || THUMB_CAPTURE.delayMs) / 10)),
                sample: THUMB_CAPTURE.sample,
            });
            const dir = isSpine ? self._spineThumbDir : self._packThumbDir;
            const file = isSpine ? self._spineGifPath(rec) : path.join(dir, `${rec.assetUuid}.gif`);
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(file, Buffer.from(gifBytes));
            rec._thumbAbs = file;
            rec._thumbMime = 'image/gif';
            rec._needsThumb = false;
            self._setCardThumb(rec.assetUuid, file);
            if (isSpine) { self._writeSpineSidecar(rec); }
        },

        // Resolve the { type, value } an item drags into the scene as. The Scene
        // panel's drop handler (AnyHandler) instantiates a node from an asset uuid,
        // keyed on its cc type — exactly the payload the Assets panel produces when
        // you drag an asset onto the viewport. Returns null for items with nothing
        // instantiable (no uuid, or an .fbx with no gltf-scene/mesh sub-asset).
        _dragInfoForItem(rec: any): { type: string; value: string; name: string } | null {
            const self = this as any;
            if (!rec) return null;
            const name = rec.name || '';
            // An .fbx main asset isn't instantiable — drop its gltf-scene prefab
            // sub-asset (or a mesh fallback), the same ref the thumbnail path uses.
            if (rec.kind === 'fbx') {
                const refs = self._resolveModelRefs(rec);
                if (refs.prefabUuid) return { type: 'cc.Prefab', value: refs.prefabUuid, name };
                if (refs.meshUuid) return { type: 'cc.Mesh', value: refs.meshUuid, name };
                return null;
            }
            if (!rec.assetUuid) return null;
            if (rec.kind === 'spine') return { type: 'sp.SkeletonData', value: rec.assetUuid, name };
            // Prefer the asset-db reported type; fall back to a per-album guess.
            const byKind: { [k: string]: string } = {
                vfx: 'cc.Prefab', prefab: 'cc.Prefab',
                texture: 'cc.ImageAsset', audio: 'cc.AudioClip', animation: 'cc.AnimationClip',
            };
            const type = rec._ccType || byKind[rec.kind] || 'cc.Asset';
            return { type, value: rec.assetUuid, name };
        },

        // Wire an element as a drag source that the Scene/Hierarchy panels accept.
        // Preferred path: the element is a <ui-drag-item> (core ui-kit) whose own
        // dragstart publishes { type, extends, additional, value } into
        // Editor.UI.DragArea for the receiving panel — we only set the `value`
        // dataTransfer key it reads on drop. When that element isn't registered we
        // fall back to a plain draggable node and publish the drag info ourselves.
        _attachDrag(el: HTMLElement, drag: { type: string; value: string; name: string }, useDragItem: boolean) {
            const self = this as any;
            el.setAttribute('draggable', 'true');
            el.classList.add('vfx-draggable');
            el.title = 'Kéo thả vào scene hiện tại để tạo node';
            el.addEventListener('dragstart', (e: DragEvent) => {
                try {
                    if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('value', drag.value);
                        e.dataTransfer.setData('text/plain', drag.value);
                    }
                } catch { /* dataTransfer unavailable */ }
                if (!useDragItem) {
                    // No ui-drag-item to publish for us — mirror its contract directly.
                    try {
                        const UI = (Editor as any).UI;
                        if (UI && UI.DragArea) {
                            UI.DragArea.currentDragInfo = {
                                type: drag.type, extends: [], additional: [], value: drag.value,
                            };
                        }
                    } catch { /* DragArea unavailable — best effort */ }
                }
                self.$.statusBar.textContent = `Kéo "${drag.name}" thả vào scene để tạo node…`;
            });
            el.addEventListener('dragend', () => {
                if (useDragItem) return;
                try {
                    const UI = (Editor as any).UI;
                    if (UI && UI.DragArea) { UI.DragArea.currentDragInfo = null; }
                } catch { /* ignore */ }
            });
        },

        // Build one grid card. opts.imported set => reveal button; else Import/Importing.
        // With no thumbnail source, a lettered placeholder is shown instead of the video.
        // opts.drag (Library page only) makes the card a drag-into-scene source.
        _makeCard(opts: any): HTMLElement {
            const self = this as any;
            const drag = opts.drag || null;
            // Use the real <ui-drag-item> when the ui-kit element is registered (its
            // internal dragstart handles the cross-panel publish); otherwise a plain
            // draggable <div> with our own publish fallback.
            const useDragItem = !!drag && typeof customElements !== 'undefined'
                && !!customElements.get('ui-drag-item');
            const card = document.createElement(useDragItem ? 'ui-drag-item' : 'div');
            card.className = 'vfx-card';
            if (drag) {
                if (useDragItem) {
                    // `type`/`types`: the droppable cc type; `value`: the asset uuid.
                    card.setAttribute('type', drag.type);
                    card.setAttribute('types', drag.type);
                    card.setAttribute('value', drag.value);
                }
                self._attachDrag(card, drag, useDragItem);
            }
            if (opts.thumbUuid) { card.dataset.thumbUuid = opts.thumbUuid; }

            const thumbWrap = document.createElement('div');
            thumbWrap.className = 'card-thumb-wrap';
            if (opts.thumbKind === 'image' && opts.localThumbPath) {
                thumbWrap.appendChild(self._makeThumbImg(opts.localThumbPath, opts.thumbMime));
            } else if (opts.serverThumbUrl || opts.localThumbPath) {
                const thumb = document.createElement('video');
                thumb.className = 'card-thumb';
                thumb.muted = true;
                thumb.loop = true;
                thumb.playsInline = true;
                thumb.preload = 'none';
                if (opts.serverThumbUrl) { thumb.dataset.src = opts.serverThumbUrl; }
                if (opts.localThumbPath) { thumb.dataset.local = opts.localThumbPath; }
                thumb.addEventListener('loadeddata', () => { thumb.play().catch(() => {}); });
                thumb.addEventListener('mouseenter', () => {
                    self._ensureThumbSrc(thumb);
                    try { thumb.currentTime = 0; } catch { /* not seekable yet */ }
                    thumb.play().catch(() => {});
                });
                thumb.addEventListener('error', () => { thumb.classList.add('thumb-error'); });
                self._thumbObserver.observe(thumb);
                thumbWrap.appendChild(thumb);
            } else {
                const ph = document.createElement('div');
                ph.className = 'card-thumb card-thumb-placeholder';
                if (opts.iconGlyph) {
                    ph.classList.add('type-icon');
                    ph.textContent = opts.iconGlyph;
                } else {
                    ph.textContent = (opts.name || '?').replace(/^P_/i, '').slice(0, 2).toUpperCase();
                }
                thumbWrap.appendChild(ph);
            }

            // Audio items get a play/pause control on top of the placeholder.
            if (opts.audioPath) {
                const play = document.createElement('button');
                play.className = 'audio-play';
                play.type = 'button';
                play.textContent = '▶';
                play.title = 'Play / pause';
                // A re-render replaces the buttons; restore the playing state on the
                // fresh button so _stopAudio keeps resetting the visible control.
                if (self._audioEl && self._audioSrc === opts.audioPath && !self._audioEl.paused) {
                    play.classList.add('playing');
                    play.textContent = '❚❚';
                    self._audioBtn = play;
                }
                play.addEventListener('click', (e: Event) => {
                    e.stopPropagation();
                    self._toggleAudio(opts.audioPath, opts.audioMime || '', play);
                });
                thumbWrap.appendChild(play);
            }

            // Regenerable GIF thumbnails can be re-rendered on demand (bad capture).
            if (opts.thumbUuid && !opts.audioPath) {
                thumbWrap.classList.add('thumb-regenable');
                thumbWrap.title = 'Click to regenerate thumbnail';
                thumbWrap.addEventListener('click', () => { self._regenerateOneByUuid(opts.thumbUuid); });
            }

            if (opts.extBadge) {
                const extEl = document.createElement('span');
                extEl.className = 'card-ext';
                extEl.textContent = opts.extBadge;
                thumbWrap.appendChild(extEl);
            }

            if (opts.category) {
                const badge = document.createElement('span');
                badge.className = 'card-badge';
                badge.textContent = opts.category;
                badge.title = opts.category;
                thumbWrap.appendChild(badge);
            }

            const body = document.createElement('div');
            body.className = 'card-body';
            const btn = document.createElement('button');
            btn.className = 'card-import';
            if (opts.imported) {
                btn.classList.add(opts.actionClass || 'card-imported');
                btn.textContent = opts.actionLabel || '✓ Imported';
                btn.title = opts.imported.path || '';
                btn.addEventListener('click', () => { self._reveal(opts.imported.path, opts.imported.uuid); });
            } else {
                btn.textContent = opts.importing ? 'Importing...' : 'Import';
                btn.disabled = !!opts.importing;
                btn.addEventListener('click', () => { self._startImport(opts.item); });
            }
            const nameEl = document.createElement('div');
            nameEl.className = 'card-name';
            nameEl.textContent = opts.name;
            nameEl.title = opts.name;
            body.appendChild(btn);
            body.appendChild(nameEl);
            if (opts.spine) { body.appendChild(self._makeSpineControls(opts.spine)); }
            if (!opts.hideMeta) {
                const meta = document.createElement('div');
                meta.className = 'card-meta';
                const pc = document.createElement('span');
                pc.textContent = `✦ ${opts.particleCount ?? 0}`;
                const sz = document.createElement('span');
                sz.textContent = self._formatSize(opts.fileSize);
                meta.appendChild(pc);
                meta.appendChild(sz);
                body.appendChild(meta);
            }

            card.appendChild(thumbWrap);
            card.appendChild(body);
            return card;
        },

        // Render the Library page for the current album (local assets, local previews).
        _renderLocal() {
            const self = this as any;
            const list = self.$.vfxList;
            list.innerHTML = '';
            self._resetThumbObserver();

            const album = ALBUMS.find((a: any) => a.key === self._album) || ALBUMS[0];
            const def: AssetTypeDef = album.def;
            const serverUrl = self.$.serverUrl.value.replace(/\/+$/, '');
            const { VFXApiClient } = require('../../services/api');
            const api = new VFXApiClient(serverUrl);
            const q = (self._searchQuery || '').toLowerCase();
            const cat = self._selectedCategory;

            const filtered = self._localItems.filter((rec: any) => {
                if (cat && cat !== 'All') {
                    const c = rec.category || 'Uncategorized';
                    if (c !== cat && !c.startsWith(cat + '/')) return false;
                }
                return !q || (rec.name || '').toLowerCase().includes(q);
            });
            if (filtered.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-hint';
                empty.textContent = self._localItems.length === 0
                    ? `${libraryTypeDir(def)} is empty. ${def.emptyHint}`
                    : 'No assets match your search.';
                list.appendChild(empty);
                return;
            }
            for (const rec of filtered) {
                // webm (hub import) plays as video; GIF/texture/spine images as <img>;
                // everything else falls back to the format glyph.
                const isVideo = !!rec._webmAbs || (def.key === 'vfx' && !!rec.id && !rec._thumbAbs);
                const hasMeta = def.key === 'vfx' && (rec.particleCount || rec.fileSize);
                list.appendChild(self._makeCard({
                    drag: self._dragInfoForItem(rec),
                    name: rec.name,
                    category: rec.category || '',
                    particleCount: rec.particleCount,
                    fileSize: rec.fileSize,
                    localThumbPath: isVideo ? (rec._webmAbs || '') : (rec._thumbAbs || ''),
                    serverThumbUrl: (isVideo && rec.id) ? api.thumbnailUrl(rec.id) : '',
                    thumbKind: isVideo ? undefined : (rec._thumbAbs ? 'image' : undefined),
                    thumbMime: rec._thumbMime || '',
                    thumbUuid: (rec._renderable && !rec._webmAbs) ? rec.assetUuid : undefined,
                    audioPath: rec._audioAbs || '',
                    audioMime: rec._audioAbs ? mimeForExt(rec.ext || '') : '',
                    iconGlyph: def.icon,
                    // Always ".prefab" on render albums — and the regen affordance
                    // occupies the same corner — so only varying formats get the chip.
                    extBadge: (def.preview !== 'render' && rec.ext) ? rec.ext.replace(/^\./, '').toUpperCase() : '',
                    imported: { path: rec.assetPath || '', uuid: rec.assetUuid || '' },
                    actionLabel: 'Locate',
                    actionClass: 'card-locate',
                    hideMeta: !hasMeta,
                    spine: def.key === 'spine' ? {
                        uuid: rec.assetUuid,
                        skins: rec._spineSkins || [],
                        anims: rec._spineAnims || [],
                        skin: rec._spineSkin || '',
                        anim: rec._spineAnim || '',
                    } : null,
                }));
            }
        },

        // Rebuild the imported set from asset-db so the state survives panel reloads:
        // an item counts as imported iff its prefab (<folder>/<name>/prefab/<name>.prefab)
        // exists under the current importFolder OR a legacy VFX location. The mesh
        // sub-prefabs (meshes/*.glb/*.prefab) are excluded by the path shape.
        async _loadImportedState() {
            const self = this as any;
            const map = new Map<string, { path: string; uuid: string }>();
            const folders = new Set<string>([DEFAULT_VFX_IMPORT_FOLDER]);
            try {
                const importFolder = (await Editor.Profile.getProject('vfx-browser', 'importFolder'))
                    || DEFAULT_VFX_IMPORT_FOLDER;
                // Ancestors of the library root (e.g. 'assets') would mark unrelated
                // project prefabs as imported hub effects — skip them.
                const isAncestor = !importFolder
                    || LIBRARY_ROOT === importFolder
                    || LIBRARY_ROOT.startsWith(importFolder + '/');
                if (!isAncestor) { folders.add(importFolder); }
            } catch { /* profile unavailable */ }
            for (const legacy of LEGACY_VFX_SCAN_ROOTS) { folders.add(legacy.folder); }
            for (const folder of folders) {
                try {
                    const assets: any[] = await Editor.Message.request('asset-db', 'query-assets', {
                        pattern: `db://${folder}/**/*.prefab`,
                        ccType: 'cc.Prefab',
                    });
                    for (const a of assets || []) {
                        const url: string = a.url || a.path || a.source || '';
                        const m = url.match(/\/([^/]+)\/prefab\/[^/]+\.prefab$/);
                        if (!m) continue;
                        const name = self._stripBrand(m[1]); // catalog names are brand-stripped
                        if (!map.has(name)) { map.set(name, { path: url, uuid: a.uuid || '' }); }
                    }
                } catch { /* asset-db not ready / pattern unsupported — keep scanning */ }
            }
            // Keep any items imported this session that aren't in the asset-db result yet.
            if (self._imported instanceof Map) {
                for (const [k, v] of self._imported) { if (!map.has(k)) map.set(k, v); }
            }
            self._imported = map;
        },

        async _fetchCatalog() {
            const self = this as any;
            const serverUrl = self.$.serverUrl.value.replace(/\/+$/, '');
            self.$.statusBar.textContent = 'Loading...';
            self.$.statusBar.classList.add('busy');
            self._renderSkeletons();
            Editor.Profile.setProject('vfx-browser', 'serverUrl', serverUrl);

            try {
                const http = require('http');
                const url = require('url');
                const parsed = new (url.URL)(serverUrl + '/api/vfx/catalog');

                const data: string = await new Promise((resolve, reject) => {
                    const req = http.get(parsed, (res: any) => {
                        if (res.statusCode >= 400) {
                            reject(new Error(`HTTP ${res.statusCode}`));
                            res.resume();
                            return;
                        }
                        const chunks: Buffer[] = [];
                        res.on('data', (c: Buffer) => chunks.push(c));
                        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
                    });
                    req.on('error', reject);
                });

                const catalog = JSON.parse(data);
                self._items = catalog.items || [];
                // Strip the brand suffix the server bakes into every effect name, so
                // the prefab/folder/node names produced on import come out clean. This is
                // the single entry point for server data, so display, import payloads and
                // the imported-state match (all keyed off item.name) stay consistent.
                for (const it of self._items) { it.name = self._stripBrand(it.name); }
                self._buildCategoryTree(self._items);
                self._renderSidebar();
                await self._loadImportedState();
                self._renderList();
                self.$.statusBar.textContent = `${self._items.length} effects loaded`;
            } catch (err: any) {
                self.$.statusBar.textContent = `Error: ${err.message}`;
                self._items = [];
                self._categoryTree = []; // drop the previous Library album's tree
                self._renderSidebar();
                self._renderList();
            } finally {
                self.$.statusBar.classList.remove('busy');
            }
        },

        // Build the folder/category tree from any item list (server catalog or the
        // local Hub library — both carry a `category` path).
        _buildCategoryTree(items: any[]) {
            const self = this as any;
            const catMap = new Map<string, number>();
            for (const item of items) {
                const cat = item.category || 'Uncategorized';
                catMap.set(cat, (catMap.get(cat) || 0) + 1);
                const parts = cat.split('/');
                for (let i = 1; i < parts.length; i++) {
                    const parent = parts.slice(0, i).join('/');
                    if (!catMap.has(parent)) catMap.set(parent, 0);
                }
            }
            const roots: CategoryNode[] = [];
            const nodeMap = new Map<string, CategoryNode>();
            const sortedKeys = Array.from(catMap.keys()).sort();
            for (const fullPath of sortedKeys) {
                const parts = fullPath.split('/');
                const name = parts[parts.length - 1];
                const node: CategoryNode = { name, fullPath, count: catMap.get(fullPath) || 0, children: [], expanded: true };
                nodeMap.set(fullPath, node);
                if (parts.length === 1) {
                    roots.push(node);
                } else {
                    const parentPath = parts.slice(0, -1).join('/');
                    const parent = nodeMap.get(parentPath);
                    if (parent) {
                        parent.children.push(node);
                        parent.count = items.filter(
                            (i: any) => (i.category || 'Uncategorized') === parentPath ||
                                (i.category || '').startsWith(parentPath + '/')
                        ).length;
                    } else {
                        roots.push(node);
                    }
                }
            }
            self._categoryTree = roots;
        },

        _renderSidebar() {
            const self = this as any;
            const sb = self.$.sidebar;
            sb.innerHTML = '';
            // Count + click target follow the active page (server list vs local library).
            const total = self._page === 'local' ? self._localItems.length : self._items.length;
            const allDiv = document.createElement('div');
            allDiv.className = 'cat-item' + (self._selectedCategory === 'All' ? ' active' : '');
            allDiv.textContent = `All (${total})`;
            allDiv.addEventListener('click', () => {
                self._selectedCategory = 'All';
                self._renderSidebar();
                self._renderCurrent();
            });
            sb.appendChild(allDiv);

            function renderNode(node: CategoryNode, depth: number) {
                const div = document.createElement('div');
                div.className = 'cat-item' + (depth > 0 ? ' child' : ' parent');
                if (self._selectedCategory === node.fullPath) div.className += ' active';
                div.style.paddingLeft = (10 + depth * 14) + 'px';
                const arrow = node.children.length > 0 ? (node.expanded ? '▾ ' : '▸ ') : '  ';
                div.textContent = `${arrow}${node.name} (${node.count})`;
                div.addEventListener('click', () => {
                    if (node.children.length > 0 && self._selectedCategory === node.fullPath) {
                        node.expanded = !node.expanded;
                    }
                    self._selectedCategory = node.fullPath;
                    self._renderSidebar();
                    self._renderCurrent();
                });
                sb.appendChild(div);
                if (node.expanded) {
                    for (const child of node.children) { renderNode(child, depth + 1); }
                }
            }
            for (const root of self._categoryTree) { renderNode(root, 0); }
        },

        // Show/build the category tree on the Library page. Categories come from the
        // item's subfolder path inside the format folder (and, for hub-imported VFX,
        // the server category) — albums whose items are all at the root stay flat.
        _setupLocalSidebar() {
            const self = this as any;
            const categorized = self._localItems.filter((i: any) => i.category);
            const showTree = self._page === 'local' && categorized.length > 0;
            self.$.sidebar.style.display = showTree ? '' : 'none';
            if (showTree) {
                self._buildCategoryTree(categorized);
                self._renderSidebar();
            }
        },

        // Play/pause a library audio clip. One shared player — starting a clip stops
        // the previous one; clicking the playing clip's button pauses it.
        _toggleAudio(absPath: string, mime: string, btn: HTMLElement) {
            const self = this as any;
            if (self._audioEl && self._audioSrc === absPath) {
                self._stopAudio();
                return;
            }
            self._stopAudio();
            try {
                const fs = require('fs');
                if (!fs.existsSync(absPath)) { return; }
                const buf = fs.readFileSync(absPath);
                const url = URL.createObjectURL(new Blob([buf as any], { type: mime || 'audio/mpeg' }));
                const audio = new Audio(url);
                self._audioEl = audio;
                self._audioUrl = url;
                self._audioSrc = absPath;
                self._audioBtn = btn;
                btn.classList.add('playing');
                btn.textContent = '❚❚';
                // Guard both async callbacks: pausing this clip (to start another)
                // rejects its pending play() promise AFTER the next clip is already
                // current — an unguarded _stopAudio here would kill that new clip.
                audio.addEventListener('ended', () => {
                    if (self._audioEl === audio) { self._stopAudio(); }
                });
                audio.play().catch(() => {
                    if (self._audioEl === audio) { self._stopAudio(); }
                });
            } catch { self._stopAudio(); }
        },

        _stopAudio() {
            const self = this as any;
            if (self._audioEl) { try { self._audioEl.pause(); } catch { /* ignore */ } }
            if (self._audioUrl) { try { URL.revokeObjectURL(self._audioUrl); } catch { /* ignore */ } }
            if (self._audioBtn) {
                self._audioBtn.classList.remove('playing');
                self._audioBtn.textContent = '▶';
            }
            self._audioEl = null;
            self._audioUrl = '';
            self._audioSrc = '';
            self._audioBtn = null;
        },

        // The catalog items currently visible (after category + search filtering).
        _getFilteredItems(): CatalogItem[] {
            const self = this as any;
            return self._items.filter((item: CatalogItem) => {
                if (self._selectedCategory !== 'All') {
                    if (item.category !== self._selectedCategory &&
                        !item.category.startsWith(self._selectedCategory + '/')) {
                        return false;
                    }
                }
                if (self._searchQuery) {
                    return item.name.toLowerCase().includes(self._searchQuery.toLowerCase());
                }
                return true;
            });
        },

        _renderList() {
            const self = this as any;
            const list = self.$.vfxList;
            list.innerHTML = '';
            self._resetThumbObserver();

            const serverUrl = self.$.serverUrl.value.replace(/\/+$/, '');
            const { VFXApiClient } = require('../../services/api');
            const api = new VFXApiClient(serverUrl);

            const filtered = self._getFilteredItems();
            for (const item of filtered) {
                list.appendChild(self._makeCard({
                    name: item.name,
                    category: item.category,
                    particleCount: item.particleCount,
                    fileSize: item.fileSize,
                    serverThumbUrl: api.thumbnailUrl(item.id),
                    imported: self._imported.get(item.name) || null,
                    importing: self._importing.has(item.id),
                    item,
                }));
            }
            self._updateImportAllBtn();
        },

        // Keep the toolbar's "Import All" button label/state in sync with the
        // current filter: shows the not-yet-imported count, flips to Cancel while running.
        _updateImportAllBtn() {
            const self = this as any;
            const btn = self.$.importAll;
            if (!btn) return;
            if (self._page !== 'all') { btn.style.display = 'none'; return; }
            btn.style.display = '';
            if (self._importingAll) {
                btn.textContent = 'Cancel Import';
                btn.disabled = false;
                btn.classList.add('btn-importing');
                return;
            }
            btn.classList.remove('btn-importing');
            const remaining = self._getFilteredItems().filter(
                (it: CatalogItem) => !self._imported.has(it.name)
            ).length;
            btn.textContent = `Import All (${remaining})`;
            btn.disabled = remaining === 0;
        },

        // Sequentially import every visible, not-yet-imported catalog item, bypassing
        // the per-item review (all sub-assets selected by default). Click again to cancel.
        async _importAll() {
            const self = this as any;
            if (self._importingAll) {
                self._importAllToken++; // signal the running loop to stop
                self._importingAll = false;
                self._updateImportAllBtn();
                self.$.statusBar.textContent = 'Import all: cancelling...';
                return;
            }

            const targets = self._getFilteredItems().filter(
                (it: CatalogItem) => !self._imported.has(it.name) && !self._importing.has(it.id)
            );
            if (!targets.length) {
                self.$.statusBar.textContent = 'All effects already imported.';
                return;
            }

            const serverUrl = self.$.serverUrl.value.replace(/\/+$/, '');
            const { VFXApiClient } = require('../../services/api');
            const api = new VFXApiClient(serverUrl);
            // Imports always land in the library (importer nests by hub category
            // below this) — the profile value is only a legacy SCAN location.
            const importFolder = DEFAULT_VFX_IMPORT_FOLDER;

            const token = ++self._importAllToken;
            self._importingAll = true;
            self.$.statusBar.classList.add('busy');
            self._updateImportAllBtn();

            let ok = 0, fail = 0;
            for (let i = 0; i < targets.length; i++) {
                if (token !== self._importAllToken) break; // cancelled / view changed
                const item = targets[i];
                if (self._imported.has(item.name)) continue; // imported meanwhile
                self.$.statusBar.textContent = `Import all ${i + 1}/${targets.length}: ${item.name}...`;
                self._importing.add(item.id);
                self._renderList();
                try {
                    const particleJson = await api.downloadParticleJson(item.id);
                    const entries = self._collectAssetEntries(particleJson);
                    // Same payload the review panel posts — main.ts runs the importer
                    // and broadcasts 'import-complete' itself.
                    const result: any = await Editor.Message.request('vfx-browser', 'start-import', {
                        prefabName: item.name,
                        vfxId: item.id,
                        importFolder,
                        particleJson,
                        entries,
                        serverUrl,
                        category: item.category,
                        particleCount: item.particleCount,
                        fileSize: item.fileSize,
                    });
                    if (result && result.success) {
                        ok++;
                        self._imported.set(item.name, { path: result.prefabPath || '', uuid: result.prefabUuid || '' });
                    } else {
                        fail++;
                    }
                } catch {
                    fail++;
                } finally {
                    self._importing.delete(item.id);
                }
                self._renderList();
            }

            const cancelled = token !== self._importAllToken;
            self._importingAll = false;
            self.$.statusBar.classList.remove('busy');
            self._updateImportAllBtn();
            self.$.statusBar.textContent =
                `${cancelled ? 'Import all stopped' : 'Import all done'} — ${ok} imported, ${fail} failed`;
        },

        async _startImport(item: CatalogItem) {
            const self = this as any;
            const serverUrl = self.$.serverUrl.value.replace(/\/+$/, '');
            self._importing.add(item.id);
            self._renderList();
            self.$.statusBar.textContent = `Downloading "${item.name}"...`;
            try {
                const { VFXApiClient } = require('../../services/api');
                const api = new VFXApiClient(serverUrl);
                const particleJson = await api.downloadParticleJson(item.id);
                const entries = self._collectAssetEntries(particleJson);
                // Same pinned destination as Import All — see the note there.
                const importFolder = DEFAULT_VFX_IMPORT_FOLDER;
                Editor.Message.send('vfx-browser', 'open-import-review', {
                    prefabName: item.name,
                    vfxId: item.id,
                    importFolder,
                    particleJson,
                    entries,
                    serverUrl,
                    category: item.category,
                    particleCount: item.particleCount,
                    fileSize: item.fileSize,
                });
            } catch (err: any) {
                self.$.statusBar.textContent = `Error: ${err.message}`;
                self._importing.delete(item.id);
                self._renderList();
            }
        },

        // Remove a trailing brand marker (e.g. "_IKAME") the server appends to effect
        // names. Falls back to the original if stripping would leave nothing.
        _stripBrand(name: string): string {
            const cleaned = (name || '').replace(/[_\-\s]*ikame\s*$/i, '').trim();
            return cleaned || (name || '');
        },

        _formatSize(bytes: number): string {
            if (!bytes || bytes < 0) return '0 KB';
            if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        },

        // Bundle the current project's VFX assets into the extension's library/ folder,
        // making the extension portable. Heavy file copying runs in the main process.
        async _bundleLibrary() {
            const self = this as any;
            self.$.bundleBtn.disabled = true;
            self.$.statusBar.classList.add('busy');
            self.$.statusBar.textContent = 'Bundling library-extension into extension...';
            try {
                const r: any = await Editor.Message.request('vfx-browser', 'bundle-library');
                if (r && r.success) {
                    const folders = (r.roots || []).length + ((r.files || []).length ? 1 : 0);
                    self.$.statusBar.textContent =
                        `Bundled ${r.totalFiles} files (${self._formatSize(r.totalBytes)}) from ${folders} location(s) → extension/library`;
                    await self._refreshBundleInfo();
                } else {
                    self.$.statusBar.textContent = `Bundle failed: ${r?.error || 'unknown error'}`;
                }
            } catch (err: any) {
                self.$.statusBar.textContent = `Bundle error: ${err.message}`;
            } finally {
                self.$.bundleBtn.disabled = false;
                self.$.statusBar.classList.remove('busy');
            }
        },

        // Read the bundle manifest and reflect its date + size in the toolbar chip.
        async _refreshBundleInfo() {
            const self = this as any;
            const el = self.$.bundleInfo;
            if (!el) return;
            try {
                const info: any = await Editor.Message.request('vfx-browser', 'get-bundle-info');
                if (info && info.exists) {
                    const size = self._formatSize(info.totalBytes);
                    const when = self._formatDate(info.createdAt);
                    el.textContent = `Bundled ${size} · ${when.slice(0, 10)}`;
                    el.classList.remove('empty');
                    const parts: string[] = [];
                    if ((info.roots || []).length) { parts.push(`${info.roots.length} folder(s)`); }
                    if (info.thumbs) { parts.push('thumbnails'); }
                    el.title = `Bundle: ${info.totalFiles} files, ${size}\nCreated: ${when}\nContains: ${parts.join(', ') || '—'}`;
                } else {
                    el.textContent = 'No bundle yet';
                    el.classList.add('empty');
                    el.title = 'Chưa có bundle — bấm Bundle để gom data VFX vào extension.';
                }
            } catch {
                el.textContent = '';
                el.title = '';
            }
        },

        // Compact local timestamp "YYYY-MM-DD HH:mm" from an epoch-ms value.
        _formatDate(ts: number): string {
            if (!ts) return '';
            const d = new Date(ts);
            const p = (n: number) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
        },

        // Recreate the bundled assets inside the currently-open project, then refresh
        // the asset DB. Meant for a NEW project the extension was copied into.
        async _reimportLibrary() {
            const self = this as any;
            // Writing assets into the project is consequential — confirm first.
            try {
                const Dialog = (Editor as any).Dialog;
                if (Dialog && typeof Dialog.info === 'function') {
                    const res: any = await Dialog.info('reImport library', {
                        detail: 'This recreates the bundled library (assets/library-extension — every format: VFX, Animation, Spine, FBX, Audio, Prefab, Texture — plus the effect and thumbnails) inside the CURRENT project. Files at the same paths are overwritten. Continue?',
                        buttons: ['Cancel', 'reImport'],
                        default: 1,
                        cancel: 0,
                    });
                    if (!res || res.response !== 1) { return; }
                }
            } catch { /* dialog unavailable — proceed without confirmation */ }

            self.$.reimportBtn.disabled = true;
            self.$.statusBar.classList.add('busy');
            self.$.statusBar.textContent = 'reImporting bundled library into project...';
            try {
                const r: any = await Editor.Message.request('vfx-browser', 'reimport-library');
                if (r && r.success) {
                    self.$.statusBar.textContent =
                        `reImported ${r.files} files into ${(r.roots || []).length} folder(s). Asset DB refreshed.`;
                    // Refresh the Local views so the freshly-created assets show up.
                    if (self._page === 'local') { await self._switchPage('local'); }
                } else {
                    self.$.statusBar.textContent = `reImport failed: ${r?.error || 'unknown error'}`;
                }
            } catch (err: any) {
                self.$.statusBar.textContent = `reImport error: ${err.message}`;
            } finally {
                self.$.reimportBtn.disabled = false;
                self.$.statusBar.classList.remove('busy');
            }
        },

        // ---- Library Sync (server riêng) ----------------------------------
        _syncArgs() {
            const self = this as any;
            return {
                serverUrl: (self.$.syncUrl.value || '').replace(/\/+$/, ''),
                token: self.$.syncToken.value || '',
                mirror: !!(self.$.syncMirror && self.$.syncMirror.checked),
            };
        },

        _setSyncBusy(busy: boolean) {
            const self = this as any;
            self.$.statusBar.classList.toggle('busy', busy);
            for (const b of [self.$.syncUpBtn, self.$.syncDownBtn, self.$.syncUpTop, self.$.syncDownTop, self.$.syncRefresh]) {
                if (b) { b.disabled = busy; }
            }
        },

        // Mirror mode deletes files — confirm before a destructive sync.
        async _confirmMirror(title: string, detail: string): Promise<boolean> {
            try {
                const Dialog = (Editor as any).Dialog;
                if (Dialog && typeof Dialog.info === 'function') {
                    const res: any = await Dialog.info(`${title} (Mirror)`, {
                        detail, buttons: ['Cancel', 'Tiếp tục'], default: 1, cancel: 0,
                    });
                    return !!res && res.response === 1;
                }
            } catch { /* dialog unavailable — proceed */ }
            return true;
        },

        async _syncUp() {
            const self = this as any;
            if (self._syncing) { self.$.statusBar.textContent = 'Đang đồng bộ — đợi hoàn tất.'; return; }
            const args = self._syncArgs();
            if (args.mirror && !(await self._confirmMirror('Sync Up',
                'Mirror bật: các file có trên SERVER nhưng KHÔNG có ở máy này sẽ bị XOÁ trên server. Tiếp tục?'))) { return; }
            self._syncing = true;
            self._setSyncBusy(true);
            self.$.statusBar.textContent = 'Sync Up: bắt đầu…';
            try {
                const res: any = await Editor.Message.request('vfx-browser', 'sync-up', args);
                self.$.statusBar.textContent = (res && res.success)
                    ? `Sync Up xong — ${res.uploaded} tải lên, ${res.deleted} xoá trên server, ${res.unchanged} không đổi (tổng ${res.total}).`
                    : `Sync Up lỗi: ${(res && res.error) || 'unknown'}`;
            } catch (e: any) {
                self.$.statusBar.textContent = 'Sync Up lỗi: ' + (e && e.message);
            } finally {
                self._syncing = false;
                self._setSyncBusy(false);
                self._refreshSyncStatus();
            }
        },

        async _syncDown() {
            const self = this as any;
            if (self._syncing) { self.$.statusBar.textContent = 'Đang đồng bộ — đợi hoàn tất.'; return; }
            const args = self._syncArgs();
            if (args.mirror && !(await self._confirmMirror('Sync Down',
                'Mirror bật: các file server đã đánh dấu xoá sẽ bị XOÁ ở máy này. Tiếp tục?'))) { return; }
            self._syncing = true;
            self._setSyncBusy(true);
            self.$.statusBar.textContent = 'Sync Down: bắt đầu…';
            try {
                const res: any = await Editor.Message.request('vfx-browser', 'sync-down', args);
                if (res && res.success) {
                    self.$.statusBar.textContent =
                        `Sync Down xong — ${res.downloaded} tải về, ${res.removed} xoá, ${res.unchanged} không đổi (tổng ${res.total}).`;
                    // Reveal freshly-pulled assets right away.
                    if (self._page === 'local') {
                        await self._loadLocal();
                        self._setupLocalSidebar();
                        self._renderLocal();
                        self._maybeGenerateThumbs();
                    }
                } else {
                    self.$.statusBar.textContent = `Sync Down lỗi: ${(res && res.error) || 'unknown'}`;
                }
            } catch (e: any) {
                self.$.statusBar.textContent = 'Sync Down lỗi: ' + (e && e.message);
            } finally {
                self._syncing = false;
                self._setSyncBusy(false);
                self._refreshSyncStatus();
            }
        },

        async _refreshSyncStatus() {
            const self = this as any;
            if (!self.$.syncStatus) { return; }
            self.$.syncStatus.textContent = 'Đang kiểm tra…';
            self.$.syncStatus.className = 'settings-status is-off';
            try {
                const st: any = await Editor.Message.request('vfx-browser', 'get-sync-status', self._syncArgs());
                if (st && st.online) {
                    self.$.syncStatus.textContent = `● Online — server ${st.serverCount} file (v${st.version}) · local ${st.localCount} file`;
                    self.$.syncStatus.className = 'settings-status is-on';
                } else {
                    self.$.syncStatus.textContent = `○ Offline — ${(st && st.error) || 'không kết nối'} · local ${st ? st.localCount : '?'} file`;
                    self.$.syncStatus.className = 'settings-status is-off';
                }
            } catch (e: any) {
                self.$.syncStatus.textContent = 'Lỗi: ' + (e && e.message);
                self.$.syncStatus.className = 'settings-status is-off';
            }
        },

        // Per-file progress pushed from main.ts during a running sync.
        _onSyncProgress(info: any) {
            const self = this as any;
            if (!info || info.done) { return; }
            const phase = info.phase === 'down' ? 'Sync Down' : 'Sync Up';
            const prog = (info.cur != null && info.total != null) ? ` [${info.cur}/${info.total}]` : '';
            self.$.statusBar.textContent = `${phase}: ${info.msg || ''}${prog}`;
        },

        _collectAssetEntries(particleJson: Record<string, any>): any[] {
            const entries: any[] = [];
            const seenGuids = new Set<string>();
            const textures = particleJson['textures'] || {};
            for (const [guid, texInfo] of Object.entries(textures)) {
                if (seenGuids.has(guid)) continue;
                seenGuids.add(guid);
                const info = texInfo as any;
                entries.push({ guid, name: info.name || info.fileName || guid, type: 'texture', status: 'new', selected: true });
            }
            const walkNode = (node: any) => {
                const ps = node?.particleSystem;
                if (ps) {
                    const materialId = ps.materialId;
                    if (materialId && ps.materialType === 'custom' && !seenGuids.has(materialId)) {
                        seenGuids.add(materialId);
                        entries.push({ guid: materialId, name: `Material_${materialId.substring(0, 8)}`, type: 'material', status: 'new', selected: true });
                    }
                    const renderer = ps.rendererModule;
                    if (renderer?.meshId && !seenGuids.has(renderer.meshId)) {
                        seenGuids.add(renderer.meshId);
                        entries.push({ guid: renderer.meshId, name: renderer.meshName || `Mesh_${renderer.meshId.substring(0, 8)}`, type: 'mesh', status: 'new', selected: true });
                    }
                }
                const children = node?.children || [];
                for (const child of children) { walkNode(child); }
            };
            walkNode(particleJson.root);
            return entries;
        },
    },
});
