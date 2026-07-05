# library-sync-server

Server tự host để **đồng bộ thư mục `assets/library-extension`** của các project Cocos
(iKame Library). Một máy **Sync Up** đẩy library lên, mọi máy khác **Sync Down** kéo về —
kèm cả `.meta` nên UUID và mọi tham chiếu giữ nguyên.

- **CSDL:** SQLite `data/library.db` — catalog/index (đường dẫn, hash, size, kind), tombstone
  xoá, và bộ đếm `version`.
- **File thật:** `data/library/**` — mirror đúng cây `library-extension`.
- **Đồng bộ tăng dần:** so khớp bằng `rel_path` + SHA-256, chỉ file mới/đổi mới truyền.

Server chạy JS thuần, **không cần build**.

## Chạy

```bash
cd library-sync-server
npm install        # cài express + better-sqlite3 (có prebuilt binary)
npm start          # mặc định http://0.0.0.0:4650
```

Kiểm tra: `curl http://127.0.0.1:4650/health` → `{"ok":true,...}`.

## Biến môi trường

| Biến         | Mặc định      | Ý nghĩa |
|--------------|---------------|---------|
| `PORT`       | `4650`        | Cổng lắng nghe |
| `DATA_DIR`   | `./data`      | Nơi chứa `library.db` + `library/` |
| `SYNC_TOKEN` | (trống)       | Nếu đặt, mọi request phải gửi header `x-sync-token` khớp; để trống = mở (dùng trong LAN) |

Ví dụ chạy với token và data dir riêng (Windows PowerShell):

```powershell
$env:SYNC_TOKEN="mysecret"; $env:DATA_DIR="D:\ikame-library-data"; npm start
```

Muốn dùng chung cho nhiều máy/nhiều project: chạy server này trên 1 máy trong LAN, rồi trong
extension (panel iKame Library → Settings → Library Sync) trỏ **Server URL** tới
`http://<ip-máy-server>:4650` và nhập token (nếu có).

## API

| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/health` | Trạng thái + version (luôn mở, không cần token) |
| GET | `/api/library/manifest` | `{ version, updatedAt, count, files[], deletedPaths[] }` |
| GET | `/api/library/file?path=<rel>` | Tải bytes 1 file |
| PUT | `/api/library/file?path=<rel>&hash=<sha256>` | Upload bytes (verify hash), upsert catalog |
| DELETE | `/api/library/file?path=<rel>` | Đánh dấu xoá (tombstone) + xoá file |

`rel` là đường dẫn tương đối trong `library-extension` (dùng `/`), ví dụ
`Texture/foo/bar.png` hoặc `Texture/foo/bar.png.meta`.

## Sao lưu / di chuyển

Toàn bộ trạng thái nằm trong `data/`. Copy cả folder `data/` sang máy khác là mang theo cả
CSDL lẫn file. Đang bật WAL nên khi copy hãy dừng server trước (hoặc copy kèm `library.db-wal`).
