# Spline đường đi (kiểu Unity Splines)

Bộ công cụ tạo & chỉnh **đường đi cho xe** ngay trong Scene view của Cocos Creator —
**không dùng JSON**. Đường đi được lưu thẳng trong file `.scene` / `.prefab` (chính là
vị trí các node con + dữ liệu tangent), nên không còn phải maintain file JSON theo
cấu trúc cũ nữa.

Gồm 3 file:

| File | Vai trò |
|------|---------|
| `SplineMath.ts` | Toán thuần: cubic-Bezier, tangent tự động (Catmull-Rom), bảng arc-length. Không cần dùng trực tiếp. |
| `RoadSpline.ts` | Component **editor + dữ liệu đường**. Gắn vào node, chỉnh đường bằng cách kéo các điểm trong Scene. |
| `SplineFollower.ts` | Component **runtime**: cho xe/bus chạy bám theo `RoadSpline`. |

---

## 1. Tạo đường đi

1. Tạo 1 node rỗng (ví dụ đặt tên `RoadPath`), **đặt nó dưới Canvas 2D** (để đường
   preview hiện ra — preview vẽ bằng `Graphics`).
2. Add component **RoadSpline** vào node đó. Nó tự thêm `Graphics` đi kèm.
3. Bấm nút **Add Knot** trong Inspector vài lần (hoặc tự tạo node con) để tạo các
   điểm điều khiển. Mỗi node con = 1 điểm trên đường, theo đúng thứ tự con.
4. **Kéo các node con** trong Scene view để uốn đường. Đường cong cập nhật real-time.

> Mọi node con trực tiếp của node `RoadPath` đều được coi là 1 knot (theo thứ tự).
> Đừng để node con bị xoay/scale — knot nên giữ rotation 0, scale 1.

### Kiểu tangent của từng knot (giống Unity)

Chọn từng knot trong mảng `knots` của Inspector, đổi `mode`:

- **AutoSmooth** (mặc định): đường tự bo cong mượt **đi xuyên qua** điểm. Chỉ cần đặt điểm là xong.
- **Linear**: vào/ra điểm theo đường **thẳng** (góc nhọn).
- **Bezier**: hiện 2 **tay cầm** (node con `__inHandle` / `__outHandle`) để kéo chỉnh độ cong.
  - `bezierMode`: `Mirrored` (2 tay đối xứng), `Aligned` (cùng phương khác độ dài), `Broken` (độc lập).
  - *Tay cầm out là tay chính* khi ở Mirrored/Aligned.

### Tham số khác

- **closed**: nối điểm cuối → điểm đầu thành vòng kín.
- **tension**: độ căng của AutoSmooth (1 = Catmull-Rom chuẩn).
- **Preview**: màu/độ dày đường, số mẫu mỗi đoạn, bán kính chấm knot, ẩn/hiện tay cầm, có vẽ khi chạy game không.
- **Tools**: `Add Knot`, `Remove Last Knot`, `Reset To Smooth` (các checkbox bấm là chạy).

Knot đầu tô **xanh lá**, knot cuối tô **đỏ** để dễ nhận hướng.

---

## 2. Cho xe chạy theo đường

1. Add component **SplineFollower** vào node điều khiển (hoặc thẳng vào node xe).
2. Gán:
   - **spline** → component `RoadSpline` vừa tạo.
   - **target** → node xe cần di chuyển (bỏ trống = di chuyển chính node gắn follower).
3. Cấu hình:
   - **speedMode**: `Speed` (đơn vị/giây) hoặc `Duration` (giây để chạy hết đường).
   - **loopMode**: `Once` (dừng ở cuối) / `Loop` (lặp) / `PingPong` (đi-về).
   - **faceTangent**: tự xoay xe theo hướng đường (2D, xoay trục Z).
   - **faceOffset**: bù góc nếu sprite không hướng sang phải. Sprite hướng **lên** → đặt `-90`.
   - **startDistance**, **playOnStart**.

### Điều khiển bằng code

```ts
import { SplineFollower } from './Spline/SplineFollower';

const bus = this.getComponent(SplineFollower)!;
bus.play();              // chạy / tiếp tục
bus.pause();             // dừng tại chỗ
bus.stop();              // về đầu đường
bus.setProgress(0.5);    // nhảy tới giữa đường (0..1)
console.log(bus.progress, bus.distance);

// Khi xe tới đích (loopMode = Once):
bus.onArrived = () => console.log('Bus đã tới bến!');
// hoặc nghe event:
bus.node.on('spline-arrived', () => { /* ... */ });
```

### Lấy điểm trên đường từ code (tự build gameplay)

```ts
const road = this.getComponent(RoadSpline)!;
road.length;                          // tổng chiều dài đường
road.getPointAtDistance(d, out);      // vị trí (local) cách đầu đường d đơn vị — tốc độ đều
road.getTangentAtDistance(d, out);    // hướng đi (đã chuẩn hoá) tại d
road.getPoint(u, out);                // theo tham số u in [0,1] (không đều theo độ dài)
road.getTangent(u, out);
```

> `getPoint*` trả về toạ độ **local** của node spline. Nếu node xe ở chỗ khác, nhớ đổi
> sang world: `Vec3.transformMat4(world, local, road.node.worldMatrix)` —
> `SplineFollower` đã làm sẵn việc này.

---

## Ghi chú

- **Không cần JSON**: toàn bộ đường lưu trong scene/prefab. Sửa đường = kéo điểm rồi `Ctrl+S`.
- **2D**: hệ thống làm việc trong mặt phẳng **XY** (đúng với camera ortho top-down hiện tại).
- Component dùng `@executeInEditMode` nên đường cong vẽ live trong editor; khi chạy game
  preview mặc định **tắt** (bật lại bằng `showInGame`).
