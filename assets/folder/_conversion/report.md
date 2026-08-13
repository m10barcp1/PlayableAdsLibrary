# Báo cáo chuyển đổi Unity → Cocos Creator 3.x

- Thời điểm: 2026-08-12T09:41:39.441Z
- Nguồn: `C:\Unity Project\water-sort\Assets`
- Đích: `C:\Cocos Project\PlayableAdsLibrary\assets\folder`
- Thời gian chạy: 113.3s

## Tổng quan

| Chỉ số | Giá trị |
|---|---|
| Tổng asset | 8 |
| Thành công | 8 |
| Thất bại | 0 |
| Bỏ qua | 0 |
| Cảnh báo | 38 |
| Lượt gọi Claude | 3 |
| Chi phí ước tính | $1.0670 |

## Kiểm tra tham chiếu chéo

Đạt — 13 tham chiếu trong 43 asset đều phân giải được.

3 tham chiếu trỏ tới asset dựng sẵn của Cocos (db://internal/) — đã hỏi engine và xác nhận hợp lệ.

## Asset được tự thêm theo tham chiếu

Có 7 asset không nằm trong lựa chọn ban đầu nhưng được các asset khác tham chiếu tới, nên đã được kéo vào để tránh tham chiếu hỏng.

| Asset | Loại | Được dùng bởi |
|---|---|---|
| `WaterSortAssets/MainAssets/Textures/Stock_Bottles.png` | texture | `0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab` |
| `WaterSortAssets/MainAssets/Materials/FX/Add.mat` | material | `0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab` |
| `WaterSortAssets/MainAssets/Textures/glow1.png` | texture | `0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab` |
| `WaterSortAssets/MainAssets/Bottles.fbx` | model | `0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab` |
| `WaterSortAssets/MainAssets/Materials/Bottle.mat` | material | `0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab` |
| `WaterSortAssets/Shaders/Bottle_Generated.shader` | shader | `WaterSortAssets/MainAssets/Materials/Bottle.mat` |
| `WaterSortAssets/MainAssets/Textures/Bottle.png` | texture | `WaterSortAssets/MainAssets/Materials/Bottle.mat` |

### Tham chiếu trỏ ra ngoài thư mục nguồn (2)

Những GUID này không tìm thấy trong thư mục đã quét — có thể là asset dựng sẵn của Unity, hoặc nằm ngoài thư mục nguồn bạn chọn.

| GUID | Được dùng bởi |
|---|---|
| `d0353a89b1f911e48b9e16bdc9f2e058` | `WaterSortAssets/MainAssets/Materials/FX/Add.mat` |
| `32987e3c34e4ee940be51e0b4ca9a898` | `WaterSortAssets/MainAssets/Materials/Bottle.mat` |

## Component giữ chỗ

Những component dưới đây không có tương ứng bên Cocos. Thay vì vứt đi, tool đã sinh class TypeScript giữ nguyên giá trị gốc của Unity — mở node trong Cocos là thấy đủ số liệu để dựng lại hành vi.

| File sinh ra | Component gốc | Số field giữ lại |
|---|---|---|
| `_UnityPlaceholders/UnityCanvasRenderer.ts` | CanvasRenderer | 1 |

## Thống kê component

| Nhóm | Số lượng | Xử lý |
|---|---|---|
| Chuyển được | NaN | map sang component Cocos |
| Cocos lo ngầm | NaN | bỏ, không mất gì |
| Không có tương ứng | NaN | giữ lại bằng component giữ chỗ |

## Xác thực bằng Cocos Creator (qua MCP)

- Project đang mở: `C:\Cocos Project\water-sort`
- Số tool phát hiện: 16
- Phạm vi chạy: 3/3 bước chạy được

> Cocos đang mở một project khác với thư mục đích, nên các bước kiểm tra ở dưới nói về project đang mở chứ không phải kết quả vừa ghi. Mở đúng project rồi chạy lại nếu muốn kiểm tra thật.

| Bước | Tool | Kết quả | Chi tiết |
|---|---|---|---|
| Làm mới asset database | `cocos_asset(refresh)` | đạt | Đã yêu cầu Cocos import lại |
| Cocos rà tham chiếu hỏng | `cocos_validate(references)` | đạt | Không có tham chiếu hỏng |
| Đọc console Editor | `cocos_editor(console_logs)` | đạt | Không có lỗi liên quan |

### Vấn đề Cocos báo về

- **info**: Cocos đang mở project "C:\Cocos Project\water-sort" nhưng kết quả được ghi vào "C:\Cocos Project\PlayableAdsLibrary\assets\folder". Các bước kiểm tra ở dưới nói về project đang mở, không phải thư mục đích — hãy mở đúng project rồi chạy lại nếu muốn kiểm tra thật.

## Cảnh báo cần xem lại

### `WaterSortAssets/MainAssets/Materials/FX/Add.mat`

- **warning**: Shader Unity là Particles/Additive (fileID 10720, guid builtin). Đã ánh xạ sang builtin-particle.effect (d1346436-ac96-4271-b863-1f4fdead95b0), technique 2 (additive). Cocos dùng blend SrcAlpha+One, khác với Unity dùng One+One — kiểm tra visual và điều chỉnh nếu cần.
- **warning**: Material này không có texture nào (_MainTex và tất cả slot đều fileID=0). Chỉ dùng màu trắng mặc định (_Color = 1,1,1,1). _props để trống — dùng hết default của effect.
- **warning**: Các property tồn dư từ shader URP/Lit bị bỏ: _Surface, _WorkflowMode, _Blend, _Smoothness, _Metallic, _SpecColor, _GlossMapScale, _BaseColor, _BaseMap, _BumpScale, _OcclusionStrength, _Parallax, _Cutoff, _AlphaClip, _QueueOffset, _Cull, _SrcBlend/_DstBlend (giá trị 1/0 mâu thuẫn với tên Add — chắc chắn là rác từ shader cũ), cùng toàn bộ m_TexEnvs trống. Chỉ giữ lại hành vi additive blending.
- **info**: Đã bỏ metadata editor: MonoBehaviour block (version:10), disabledShaderPasses [MOTIONVECTORS], m_LightmapFlags, m_EnableInstancingVariants, m_DoubleSidedGI, m_CustomRenderQueue, stringTagMap, m_BuildTextureStacks, m_AllowLocking. Cocos không có tương ứng.
- **warning**: Số lượng pass chính xác của technique 2 (additive) trong builtin-particle.effect chưa được xác minh. _defines/_states/_props hiện có 1 phần tử — nếu technique có >1 pass, các pass bổ sung sẽ dùng default. Người dùng nên mở material trong Inspector để xác nhận.

### `0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab`

- **warning**: Node "Bottle/Glow/GlowBottles": component CanvasRenderer không chuyển được — đã giữ lại bằng component giữ chỗ kèm giá trị gốc (Không có trong bảng ánh xạ: CanvasRenderer)
- **warning**: Node "GlowBottles": Texture Sheet chế độ Sprites: không có tên sprite — dùng lưới 1x1
- **info**: Hệ hạt dùng curve dạng spline. Nên mở bằng Cocos Creator kiểm tra lại hình dạng đường cong.
- **warning**: Node "Spark": Shape "Rectangle" -> Rectangle -> Box
- **warning**: Node "Spark": Texture Sheet chế độ Sprites: không có tên sprite — dùng lưới 1x1
- **info**: Hệ hạt dùng curve dạng spline. Nên mở bằng Cocos Creator kiểm tra lại hình dạng đường cong.
- **warning**: Node "Glow": Renderer bị tắt — đã bỏ emission để không sinh hạt vô hình
- **warning**: Không đọc được texture từ vật liệu của hệ hạt (WaterSortAssets/MainAssets/Materials/FX/Add.mat) — renderer sẽ không có texture, cần gán tay.

### `WaterSortAssets/Shaders/Bottle_Generated.shader`

- **warning**: Bỏ tag RenderPipeline=UniversalPipeline — Cocos Creator không có hệ thống pipeline variant. Shader này sẽ là effect chung cho mọi pipeline của Cocos.
- **warning**: Bỏ tag RenderType=Transparent và Queue=Transparent — Cocos không có hàng đợi render tương ứng. Thứ tự vẽ trong suốt do blend = true suy ra, nhưng có thể lệch so với bản gốc Unity.
- **warning**: Bỏ #include Core.hlsl của URP — tất cả hàm TransformObjectToHClip, TransformObjectToWorldNormal, TransformObjectToWorld, IsPerspectiveProjection, _WorldSpaceCameraPos đã được thay bằng API tương đương của Cocos. Kiểm tra bằng mắt để xác nhận kết quả đúng.
- **warning**: IsPerspectiveProjection() + UNITY_MATRIX_V[2].xyz được gộp thành một dòng cc_cameraPos.xyz - worldPos.xyz (đúng cho cả perspective lẫn orthographic). Xác nhận không có sai lệch khi dùng camera orthographic.
- **warning**: UNITY_MATRIX_V[2].xyz (hàng 2 của view matrix HLSL) tương đương vec3(cc_matView[0][2], cc_matView[1][2], cc_matView[2][2]) trong GLSL. Do Cocos hệ tọa độ phải còn Unity hệ tọa độ trái, dấu Z của viewDir có thể ngược — nếu ánh sáng/phản xạ bị sai hướng, thử đảo dấu viewDir.
- **info**: CBUFFER UnityPerMaterial rỗng — shader không có float property nào, chỉ có texture. Không cần uniform block tuỳ chỉnh trong Cocos.
- **info**: worldNormal và viewDir trong fragment shader là code dư (Shader Graph Unity tự sinh). Chúng được tính nhưng không ảnh hưởng màu đầu ra. Có thể xoá nếu không mở rộng shader sau này.
- **info**: Tên property _Texture2D được giữ nguyên để tránh đứt liên kết dữ liệu từ file .mat gốc. Trong Cocos Inspector, property hiển thị đúng tên này; nếu muốn đổi sang quy ước Cocos (mainTexture), cần gán lại texture trong Material.

### `WaterSortAssets/MainAssets/Materials/Bottle.mat`

- **warning**: Shader gốc là custom Shader Graph (Bottle_Generated.shader, GUID 42abfe6938911164da1cfade81cd7d9f), không có tương ứng trong Cocos. Đã fallback sang builtin-unlit (transparent). Tất cả hiệu ứng shader tuỳ biến bên dưới bị mất.
- **warning**: Mất hiệu ứng Matcap (_Matcap, GUID 32987e3c34e4ee940be51e0b4ca9a898): Cocos không hỗ trợ matcap shading trong built-in effect.
- **warning**: Mất hiệu ứng Dissolve (_Dissolve: 0.588): không có tương ứng trong builtin-unlit.
- **warning**: Mất hiệu ứng Outline (_OutlineThickness: 0.06, _OutlineColor): không có tương ứng trong builtin-unlit.
- **warning**: Mất hiệu ứng Ripple/Wobble (_RippleAmount: 2.46, _Wobble: 0.29, _RippleSpeed, _VoronoiSpeed: 2, _NoiseScale: 29.35): các hiệu ứng động chất lỏng không chuyển được, phải viết shader custom hoặc dùng texture sprite sheet.
- **warning**: Mất hiệu ứng Edge glow (_EdgeWidth: 0.1, _EdgeColor, _Fill: 1): không có tương ứng.
- **warning**: Mất màu phụ _Color2 (r:0.431, g:0.891, b:0.962, a:1) — builtin-unlit chỉ có một mainColor. Màu này có thể là màu viền/boong bóng; nếu quan trọng cần shader custom.
- **warning**: Mất các màu tuỳ biến alpha=0 (không dùng đến): _Color01, _Color02, _Color03, _Color04, _ColorEdge, _Lighting, _RippleSpeed.
- **warning**: Mất thuộc tính _Alpha: 0.583 (độ trong suốt tổng thể) — đây là float riêng, không phải alpha của _Color (vốn là 1.0). Material được đặt techIdx=1 (transparent), nhưng độ trong suốt chính xác cần chỉnh tay trên node chứa material hoặc qua opacity của Sprite/MeshRenderer.
- **warning**: Mất hiệu ứng Emission (_EmissionColor: black, tắt) và Specular (_SpecColor: ~0.2 gray, _Glossiness: 0, _GlossMapScale: 0).
- **warning**: Các property float rác từ shader URP cũ (_Surface, _Blend, _WorkflowMode, _Metallic, _Smoothness, _BumpScale, _Parallax, _OcclusionStrength, _QueueControl, _QueueOffset, _ReceiveShadows, _SpecularHighlights, _EnvironmentReflections, _GlossyReflections, _SmoothnessTextureChannel, _AlphaClip, _AlphaToMask, _Cutoff, _AddPrecomputedVelocity, _BlendModePreserveSpecular, _ClearCoatMask, _ClearCoatSmoothness, _DetailAlbedoMapScale, _DetailNormalMapScale) đã bị bỏ qua.
- **warning**: Mất _Matcap texture (GUID 32987e3c34e4ee940be51e0b4ca9a898) — không có trong bảng ánh xạ GUID của project, không thể xác định file nguồn. Nếu cần, import lại texture này vào Cocos và gán vào custom shader.
- **info**: Shader có Cull=Back (chuẩn), SrcBlend=One, DstBlend=Zero, ZWrite=1 — nhưng đây có thể là property tồn dư từ URP. Render queue gốc là 3000 (Transparent).
- **info**: Đã bỏ qua khối MonoBehaviour metadata (version: 10) — chỉ dùng trong editor Unity.
- **info**: Đã bỏ qua: disabledShaderPasses: [MOTIONVECTORS], m_LightmapFlags: 4, m_EnableInstancingVariants: 0, m_DoubleSidedGI: 0, m_CustomRenderQueue: 3000, stringTagMap: {}, m_BuildTextureStacks: [] — không có tương ứng trong Cocos.
- **info**: Nếu material này thực chất dùng cho Sprite 2D (không phải mesh 3D), nên đổi effect sang builtin-sprite (60f7195c-ec2a-45eb-ba94-8955f60e81d0) và _techIdx=0.
- **info**: _effectAsset (a3cd009f-0ab0-420d-9278-b9fdab939bbc) không khớp shader gốc — đã thay bằng file .effect chuyển từ WaterSortAssets/Shaders/Bottle_Generated.shader.

## Danh sách đầy đủ

| Asset | Loại | Trạng thái | Đích |
|---|---|---|---|
| `WaterSortAssets/MainAssets/Bottles.fbx` | Model 3D | OK | WaterSortAssets/MainAssets/Bottles.fbx |
| `WaterSortAssets/MainAssets/Textures/glow1.png` | Texture / Sprite | OK | WaterSortAssets/MainAssets/Textures/glow1.png |
| `WaterSortAssets/MainAssets/Textures/Bottle.png` | Texture / Sprite | OK | WaterSortAssets/MainAssets/Textures/Bottle.png |
| `WaterSortAssets/MainAssets/Textures/Stock_Bottles.png` | Texture / Sprite | OK | WaterSortAssets/MainAssets/Textures/Stock_Bottles.png |
| `WaterSortAssets/MainAssets/Materials/FX/Add.mat` | Material | OK | WaterSortAssets/MainAssets/Materials/FX/Add.mtl |
| `0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab` | Prefab | OK | 0_WaterSort/Prefabs/Bottle/Bottle/New Folder/Bottle.prefab |
| `WaterSortAssets/Shaders/Bottle_Generated.shader` | Shader | OK | WaterSortAssets/Shaders/Bottle_Generated.effect |
| `WaterSortAssets/MainAssets/Materials/Bottle.mat` | Material | OK | WaterSortAssets/MainAssets/Materials/Bottle.mtl |