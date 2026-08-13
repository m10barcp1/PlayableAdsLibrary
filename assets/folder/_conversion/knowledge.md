# Knowledge base: Unity → Cocos Creator 3.x

Sinh tự động lúc 2026-08-12T09:41:39.446Z.
Tổng cộng 268 quy tắc đã tích luỹ qua 19 lần chuyển đổi.

## Material

### Không suy ra được UUID của effect dựng sẵn Cocos từ dữ liệu Unity

UUID của các effect nội bộ (builtin-unlit, builtin-sprite, builtin-standard, builtin-particle...) do editor Cocos quản lý theo phiên bản, không có nguồn nào trong asset Unity để suy ra. Khi convert Material, đặt `_effectAsset: null` và ghi warning yêu cầu gán Effect trong Inspector (hoặc dùng `material.initialize({ effectName: '...', technique: n })` lúc runtime). Tuyệt đối không tự chế UUID vì UUID sai làm material im lặng không render.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect, uuid, mtl*

### Chọn effect Cocos theo ngữ nghĩa shader, không theo tên property

Ánh xạ shader Unity -> effect Cocos: shader PBR (Standard/URP Lit) -> `builtin-standard`; shader unlit/particle/additive -> `builtin-unlit`; material của SpriteRenderer/UI Image -> `builtin-sprite`. Chỉ `builtin-unlit` và `builtin-standard` mới expose `mainTexture`/`mainColor`; `builtin-sprite` KHÔNG có `mainColor` (dùng màu vertex, sampler tên `cc_spriteTexture`, property duy nhất là `alphaThreshold`) nên đừng ghi `mainColor` vào material sprite.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, effect, builtin-sprite, builtin-unlit*

### Shader dựng sẵn của Unity nhận diện qua guid 0000000000000000f000000000000000

`m_Shader` có guid toàn số 0 kết thúc bằng f000000000000000 nghĩa là shader nằm trong unity_builtin_extra; chỉ còn fileID để nhận diện và bảng fileID->tên shader không nằm trong asset. Không đoán chắc tên shader từ fileID: hãy suy luận từ tên material + tập property có mặt, rồi ghi warning yêu cầu người dùng xác nhận trong Unity.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, guid, fileid, material*

### Material Unity lưu mọi property của shader, kể cả property tồn dư

`m_SavedProperties` chứa toàn bộ property từng thuộc mọi shader mà material từng dùng, không phải property đang có hiệu lực. Không chuyển hàng loạt: chỉ chuyển property vừa (a) có uniform tương ứng trong effect Cocos đã chọn, vừa (b) khác giá trị mặc định hoặc có ý nghĩa rõ ràng. Property mâu thuẫn (ví dụ `_SrcBlend/_DstBlend` opaque trên material tên 'Add') là dấu hiệu của tồn dư — phải nêu trong warnings thay vì im lặng chọn một bên.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, properties, urp*

### Cấu trúc file .mtl của Cocos: _defines/_states/_props là mảng theo pass

File `.mtl` là một object JSON `{__type__: 'cc.Material', _name, _objFlags, _native, _effectAsset, _techIdx, _defines: [{}], _states: [{}], _props: [{}]}`. `_techIdx` chọn technique trong effect (builtin-unlit: 0 = opaque, 1 = transparent). Ba mảng `_defines`/`_states`/`_props` có mỗi phần tử ứng với MỘT pass của technique đang chọn, không phải một object phẳng. Màu trong `_props` ghi dạng `{"__type__":"cc.Color","r":0-255,...}`.

*Xác nhận 1 lần · độ tin cậy: high · tag: mtl, material, serialization*

### Blend/depth của Unity nằm trong shader, sang Cocos phải override qua _states

Unity khai báo Blend/ZWrite/Cull trong code shader (hoặc qua property `_SrcBlend/_DstBlend/_ZWrite/_Cull` khi shader có Blend [_SrcBlend][_DstBlend]). Cocos override qua `_states[pass] = {blendState:{targets:[{blend, blendSrc, blendDst, blendSrcAlpha, blendDstAlpha}]}, depthStencilState:{depthTest, depthWrite}, rasterizerState:{cullMode}}` với giá trị enum dạng SỐ: BlendFactor ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4; CullMode NONE=0, FRONT=1, BACK=2 (trùng số với Cull của Unity: 0=Off,1=Front,2=Back). Additive = blendSrc SRC_ALPHA(2) + blendDst ONE(1) + depthWrite false; alpha blend = SRC_ALPHA(2) + ONE_MINUS_SRC_ALPHA(4).

*Xác nhận 1 lần · độ tin cậy: medium · tag: blend, render-state, gfx, additive, material*

### Ánh xạ property PBR khi dùng builtin-standard

Khi material Unity là Standard/URP Lit và chọn `builtin-standard`: `_Color`/`_BaseColor`->`mainColor` (nhân 255), `_MainTex`/`_BaseMap`->`mainTexture`, `_Metallic`->`metallic`, `_Smoothness`/`_Glossiness`->`roughness` với roughness = 1 - smoothness (ĐẢO chiều, không copy thẳng), `_BumpMap`->`normalMap`, `_OcclusionMap`->`occlusionMap`, `_EmissionColor`->`emissive` + `emissiveMap`, `_Cutoff`->`alphaThreshold` kèm define `USE_ALPHA_TEST: true`. `_SpecColor`, `_Parallax`, `_DetailXxx` không có tương ứng.

*Xác nhận 1 lần · độ tin cậy: medium · tag: pbr, standard, material-mapping, material*

### Khối MonoBehaviour trong .mat là metadata editor, luôn bỏ

File .mat của URP/HDRP thường có thêm một khối `MonoBehaviour` (m_ObjectHideFlags: 11) chỉ chứa `version` — đó là dữ liệu nâng cấp material của editor Unity, không mang thông tin render. Bỏ hoàn toàn, chỉ ghi info. Tương tự với `m_LightmapFlags`, `m_CustomRenderQueue`, `m_DoubleSidedGI`, `disabledShaderPasses` (Cocos không bật/tắt pass theo tên).

*Xác nhận 1 lần · độ tin cậy: high · tag: material, metadata, urp*

### Khung file .mtl của Cocos Creator 3.8

Material của Cocos là JSON một object: `__type__: "cc.Material"`, `_name`, `_objFlags`, `_native`, `_effectAsset` ({__uuid__, __expectedType__: "cc.EffectAsset"}), `_techIdx` (chỉ số technique), và ba mảng SONG SONG THEO PASS: `_defines`, `_states`, `_props` — mỗi pass của technique một phần tử. Technique 1 pass ⇒ mỗi mảng đúng 1 phần tử `{}`.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, mtl, format*

### Ánh xạ property gốc của Unity Material

Đọc `m_SavedProperties`: `m_Colors._Color`/`_BaseColor` → `_props[0].mainColor` dạng `{__type__:"cc.Color", r,g,b,a}` với mỗi kênh = round(v*255) kẹp [0,255]; `m_TexEnvs._MainTex.m_Texture` → `_props[0].mainTexture`; `m_Scale`/`m_Offset` của texture → `tilingOffset` = Vec4(scaleX, scaleY, offsetX, offsetY). Chỉ chuyển entry trong `m_TexEnvs` có `m_Texture.fileID != 0`; slot rỗng phải bỏ hẳn, không sinh property null.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, color, texture*

### Material trỏ texture sub-asset @6c48a, không phải @f9941

Trong material, uniform kiểu sampler (mainTexture) phải trỏ tới sub-asset texture `<uuid>@6c48a` với `__expectedType__: "cc.Texture2D"`. Sub-asset `@f9941` (SpriteFrame) chỉ dùng cho `cc.Sprite._spriteFrame`. Trỏ nhầm loại thì uniform không nhận được asset.

*Xác nhận 1 lần · độ tin cậy: high · tag: uuid, sub-asset, texture, material*

### UUID của effect nội bộ không suy ra được từ GUID Unity

Quy tắc chèn gạch GUID→UUID chỉ áp dụng cho asset do người dùng import. Effect dựng sẵn (builtin-sprite, builtin-unlit, builtin-standard, builtin-particle) là asset nội bộ của engine với UUID cố định riêng — không được bịa. Khi chưa tra được, ghi placeholder có chữ TODO ngay trong `_effectAsset.__uuid__` và nêu warning kèm cách lấy (tạo material trong editor rồi copy UUID), thay vì đoán một UUID hợp lệ về hình thức nhưng sai.

*Xác nhận 1 lần · độ tin cậy: high · tag: uuid, effect, builtin, todo, material*

### builtin-sprite không có mainTexture/mainColor

Effect `builtin-sprite` của Cocos 3.x lấy texture qua binding dựng sẵn `cc_spriteTexture` (từ SpriteFrame của component) và màu qua vertex color; property phơi ra chỉ có `alphaThreshold`. Vì vậy chỉ ánh xạ `_MainTex`/`_Color` thành `mainTexture`/`mainColor` khi effect đích là loại có hai uniform đó (ví dụ `builtin-unlit`, kèm define `USE_TEXTURE: true` để bật nhánh lấy mẫu texture).

*Xác nhận 1 lần · độ tin cậy: medium · tag: effect, builtin-sprite, builtin-unlit, define, material*

### Shader dựng sẵn của Unity nhận diện qua fileID

Tham chiếu `m_Shader: {fileID: N, guid: 0000000000000000f000000000000000, type: 0}` là shader dựng sẵn của Unity (guid toàn 0), phải nhận diện theo fileID chứ không theo guid — ví dụ 10720 ≈ Particles/Additive. Ngữ nghĩa cần giữ lại của các shader này chủ yếu là chế độ blend/ZWrite/Cull, chuyển sang Cocos bằng ghi đè trong `_states` chứ không có effect tương ứng 1-1; luôn ghi warning là bản xấp xỉ.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, fileid, blend, material*

### Ghi đè trạng thái pass trong _states

Chuyển blend mode của Unity sang `_states[i]` với các khoá đúng tên gfx: `blendState.targets[0] = {blend, blendSrc, blendDst, blendSrcAlpha, blendDstAlpha}`, `depthStencilState = {depthTest, depthWrite}`, `rasterizerState = {cullMode}`. Enum BlendFactor: ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4. Enum CullMode: NONE=0, FRONT=1, BACK=2. Additive (SrcAlpha One) ⇒ blendSrc=2, blendDst=1, thường kèm depthWrite=false.

*Xác nhận 1 lần · độ tin cậy: medium · tag: blend, states, gfx-enum, material*

### m_Floats của .mat thường là rác của shader cũ

Danh sách `m_Floats`/`m_Colors` trong .mat là hợp của mọi property mà material từng dùng qua các lần đổi shader (rất hay thấy nguyên bộ URP/Lit: _WorkflowMode, _Surface, _Blend, _Metallic, _Smoothness...). Không map mù theo tên; chỉ chuyển những property mà shader đang gán thực sự dùng, phần còn lại bỏ và liệt kê trong warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, urp, noise*

### Metadata material của Unity không có tương ứng

Các trường `disabledShaderPasses`, `m_LightmapFlags`, `m_EnableInstancingVariants`, `m_DoubleSidedGI`, `m_CustomRenderQueue`, `stringTagMap`, `m_ValidKeywords`, cùng khối `MonoBehaviour` phụ trong .mat (dữ liệu editor của URP) đều bỏ, nhưng phải liệt kê trong warnings thay vì im lặng.

*Xác nhận 1 lần · độ tin cậy: high · tag: metadata, warnings, material*

### Khung JSON chuẩn của file .mtl trong Cocos Creator 3.x

Unity `.mat` chuyển thành một file `.mtl` chứa duy nhất một object `{"__type__": "cc.Material"}` với các field: `_name`, `_objFlags`, `_native`, `_effectAsset` ({__uuid__, __expectedType__: "cc.EffectAsset"}), `_techIdx` (chỉ số technique), `_defines`, `_states`, `_props`. Ba mảng cuối đánh chỉ số theo pass; phần tử `{}` nghĩa là giữ nguyên mặc định của effect. Không có mảng phụ, không có `__id__` như prefab/scene.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, mtl, format*

### Smoothness của Unity nghịch đảo với roughness của Cocos

Unity (Standard/URP Lit) dùng `_Smoothness`/`_Glossiness`; `builtin-standard` của Cocos dùng `roughness`. Luôn quy đổi `roughness = 1 - smoothness` (kẹp [0,1]). `_Metallic` → `metallic`, `_OcclusionStrength` → `occlusion`, `_BumpScale` → `normalStrength` là ánh xạ thẳng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, pbr, roughness*

### m_SavedProperties là superset rác — phải lọc theo shader thật sự đang gán

Unity giữ lại mọi property của mọi shader từng gán cho material, nên `m_SavedProperties` luôn chứa nhiều key không liên quan. Chỉ map những property thuộc shader hiện tại; số còn lại phải liệt kê trong warnings chứ không im lặng bỏ. Dấu hiệu nhận pipeline: có `_BaseMap`/`_BaseColor`/`_Surface`/`_WorkflowMode` (+ khối MonoBehaviour metadata cuối file) = URP/Lit → `builtin-standard`; chỉ có `_MainTex`/`_Color`/`_Glossiness` = Built-in RP Standard; property tối giản + shader Sprites/UI = 2D → `builtin-sprite`.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, urp, detection*

### guid 0000000000000000f000000000000000 = Unity built-in resources, không chuyển được

Mọi tham chiếu asset có guid toàn số 0 kết thúc bằng f000000000000000 (shader, texture, mesh, material mặc định của Unity) không có file nguồn trong project nên không thể ánh xạ GUID→UUID. Phải để trống / thay bằng asset tương đương của Cocos và ghi warning; đừng sinh uuid giả từ guid này.

*Xác nhận 1 lần · độ tin cậy: high · tag: guid, builtin, reference, material*

### Không bịa uuid của effect built-in Cocos

UUID của các `.effect` built-in (`builtin-standard`, `builtin-unlit`, `builtin-sprite`, `builtin-toon`...) phụ thuộc phiên bản engine và không suy ra được từ tên. Khi không biết chắc, ghi placeholder TODO vào `_effectAsset.__uuid__` (JSON vẫn hợp lệ) và bắt buộc có warning mức error yêu cầu người dùng chọn lại Effect trong Inspector để editor ghi đúng uuid.

*Xác nhận 1 lần · độ tin cậy: high · tag: uuid, effect, todo, material*

### Render state Unity → mảng _states của material Cocos

`_Cull`, `_ZWrite`, `_SrcBlend`/`_DstBlend`, `_Surface` không phải uniform mà là render state: ghi vào `_states[passIdx]` dưới dạng `{rasterizerState:{cullMode}, depthStencilState:{depthTest,depthWrite}, blendState:{targets:[{blend,...}]}}`. Giá trị cullMode trùng số giữa hai engine (0 = none/off, 1 = front, 2 = back). `m_CustomRenderQueue` không có tương ứng — thể hiện bằng việc chọn technique opaque/transparent qua `_techIdx` (kèm `priority` nếu cần), luôn kèm warning khi queue mâu thuẫn với blend state.

*Xác nhận 1 lần · độ tin cậy: medium · tag: render-state, blend, cull, queue, material*

### Kiểu dữ liệu khi serialize _props của material

Trong `_props`, số vô hướng ghi thẳng (`"metallic": 0`), màu ghi `{"__type__":"cc.Color", r,g,b,a}` với giá trị 0–255 (nhân 255 từ float của Unity, làm tròn, kẹp [0,255]), vector ghi `{"__type__":"cc.Vec2|cc.Vec3|cc.Vec4", ...}`, texture ghi `{"__uuid__": "...", "__expectedType__": "cc.Texture2D"}`. `m_Scale`/`m_Offset` của một TexEnv gộp thành một `tilingOffset` = Vec4(scaleX, scaleY, offsetX, offsetY).

*Xác nhận 1 lần · độ tin cậy: medium · tag: serialization, color, vec4, tilingoffset, material*

### Gán texture cho material Cocos phải kèm macro trong _defines

Khác Unity (tự bật keyword khi gán texture), trong Cocos chỉ ghi uniform texture vào `_props` là chưa đủ — phải bật macro tương ứng trong `_defines[passIdx]` (ví dụ `USE_ALBEDO_MAP`, `USE_NORMAL_MAP`), tên macro chính xác đọc từ file `.effect` của bản engine đang dùng. Ngoài ra Cocos gộp AO/roughness/metallic vào một `pbrMap` nên các map PBR của Unity phải được repack kênh, không copy thẳng.

*Xác nhận 1 lần · độ tin cậy: medium · tag: defines, macro, pbrmap, texture, material*

### m_InvalidKeywords là dấu hiệu shader gốc đã mất

Nếu .mat có m_InvalidKeywords khác rỗng (ví dụ _USEDEPTH_ON) hoặc m_SavedProperties chứa property lạ không thuộc shader đang trỏ tới, kết luận: shader tuỳ biến đã bị gỡ và material rơi về shader builtin. Không được coi shader builtin đó là ý đồ gốc — phải ghi warning mức error yêu cầu người dùng xác nhận trong Unity, và suy luận effect Cocos từ tên material + tập property thay vì từ m_Shader.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, warning*

### Gán mainTexture cho builtin-unlit phải kèm define USE_TEXTURE

builtin-unlit chỉ lấy mẫu uniform mainTexture khi macro USE_TEXTURE bật. Khi convert material có _MainTex sang builtin-unlit, ngoài _props[0].mainTexture phải đặt _defines[0] = {"USE_TEXTURE": true}; nếu không texture im lặng không hiển thị. Macro nằm trong _defines cùng chỉ số pass với _props.

*Xác nhận 1 lần · độ tin cậy: high · tag: mtl, builtin-unlit, defines, material*

### Ánh xạ _CullMode của Unity sang rasterizerState.cullMode

Float _CullMode trong m_Floats ánh xạ 1-1 sang _states[<pass>].rasterizerState.cullMode vì hai enum trùng chỉ số: Off/NONE = 0, Front = 1, Back = 2. Material VFX (trail, ribbon, quad hai mặt) thường có _CullMode = 0 và phải ghi đè, vì technique builtin mặc định cull BACK sẽ làm mất một nửa hình.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, states, culling*

### Chọn _techIdx theo ngữ nghĩa trong suốt, và nêu rõ blend không xác định

Với builtin-unlit: _techIdx = 0 cho opaque, 1 cho transparent. Chọn 1 khi material là VFX/trail/particle hoặc có property alpha/opacity. Nếu .mat KHÔNG có _SrcBlend/_DstBlend thì không được đoán Additive hay Alpha blend: giữ _states[0] không ghi đè blendState (kế thừa technique) và ghi warning kèm hướng dẫn sửa blendSrc/blendDst = ONE/ONE nếu bản gốc là Additive.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, technique, blend*

### Uniform VFX tuỳ biến phải liệt kê từng cái khi bỏ

Các property đặc thù shader VFX (distortion, flow, noise, mask, soft-particle depth, emission intensity, center glow) không có tương ứng trong bất kỳ effect dựng sẵn nào của Cocos. Bỏ hết khỏi _props, nhưng phải liệt kê ĐÍCH DANH kèm giá trị trong warnings và nêu rằng cách duy nhất để tái hiện là viết file .effect riêng — không được gán bừa vào uniform builtin có tên gần giống.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, vfx, warning*

### Bỏ property trùng giá trị mặc định của effect đích

Chỉ ghi vào _props những uniform khác mặc định hoặc có ý nghĩa cần bảo toàn. Cụ thể: m_Scale = (1,1) và m_Offset = (0,0) thì KHÔNG sinh tilingOffset; slot texture có m_Texture.fileID = 0 thì bỏ hẳn thay vì ghi null. Ghi mainColor trắng là chấp nhận được (tường minh) nhưng nên nêu trong warnings rằng nó trùng mặc định.

*Xác nhận 1 lần · độ tin cậy: high · tag: mtl, props, defaults, material*

### Material có đủ bộ property URP Lit nhưng m_Shader trỏ builtin-extra = material đã bị đổi shader

Khi `m_SavedProperties` chứa trọn bộ property URP/Lit (_WorkflowMode, _Surface, _Blend, _ClearCoatMask, _BlendModePreserveSpecular, _AddPrecomputedVelocity...) nhưng `m_Shader` lại trỏ tới unity_builtin_extra (guid 0000000000000000f000000000000000), kết luận: material từng dùng URP/Lit rồi bị đổi sang shader dựng sẵn. Chỉ chuyển những property mà shader ĐÍCH thực sự có; coi toàn bộ phần còn lại là tồn dư và liệt kê trong warnings thay vì map bừa sang builtin-standard.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, urp, residual-property*

### Property tồn dư _SrcBlend/_DstBlend/_ZWrite/_Cull thua hành vi hardcode của shader

Các shader legacy particle/trail của Unity hardcode `Blend SrcAlpha One`, `ZWrite Off`, `Cull Off` trong code shader và KHÔNG đọc _SrcBlend/_DstBlend/_ZWrite/_Cull. Khi những float này mâu thuẫn với ngữ nghĩa của material (ví dụ ghi One/Zero + ZWrite 1 trên material tên '..._Add'), hãy ưu tiên hành vi hardcode của shader để dựng `_states`, đồng thời ghi rõ mâu thuẫn và cách sửa ngược lại trong warnings.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, blend-state, particle, additive*

### builtin-unlit: mainTexture chỉ có tác dụng khi bật define USE_TEXTURE

Với effect `builtin-unlit`, ghi `mainTexture` vào `_props` là chưa đủ — phải thêm `"USE_TEXTURE": true` vào `_defines[pass]`, nếu không material chỉ hiển thị `mainColor`. Ngược lại, KHÔNG bật `USE_VERTEX_COLOR` theo phản xạ: nếu mesh không có attribute màu thì màu đọc ra bằng 0 và vật thể biến mất — chỉ bật khi chắc renderer cấp vertex color (trail/particle) và ghi thành warning để người dùng tự bật.

*Xác nhận 1 lần · độ tin cậy: high · tag: cocos, effect, defines, builtin-unlit, material*

### Chọn _techIdx theo blend, không theo tên material

Với `builtin-unlit`, `_techIdx: 0` = technique opaque, `_techIdx: 1` = transparent. Bất kỳ material nào cần blend (alpha blend hoặc additive) đều phải dùng `_techIdx: 1` rồi mới override tiếp `_states[0].blendState`; để `_techIdx: 0` mà chỉ bật blend trong `_states` là cấu hình mâu thuẫn (render queue vẫn là opaque, thứ tự vẽ sai).

*Xác nhận 1 lần · độ tin cậy: medium · tag: cocos, material, technique, transparent*

### Texture dùng trong material trỏ sub-asset @6c48a, không phải @f9941

Khi map `_MainTex`/`_BaseMap` của Unity sang uniform texture của material Cocos (`mainTexture`, `normalMap`...), tham chiếu phải là sub-asset texture `<uuid>@6c48a` với `__expectedType__: "cc.Texture2D"`. Đuôi `@f9941` (SpriteFrame) chỉ dùng cho `cc.Sprite._spriteFrame`; trỏ nhầm làm Inspector hiện ô trống.

*Xác nhận 1 lần · độ tin cậy: high · tag: asset-reference, uuid, texture, sub-asset, material*

### disabledShaderPasses và metadata upgrade luôn bị bỏ, nhưng phải ghi warning

`disabledShaderPasses` (tắt pass theo tên), `m_LightmapFlags`, `m_CustomRenderQueue`, `m_DoubleSidedGI`, `m_EnableInstancingVariants`, `m_AllowLocking`, `stringTagMap`, `m_BuildTextureStacks` và khối `MonoBehaviour` version của editor đều không có tương ứng trong Cocos. Bỏ hết, nhưng liệt kê ở mức info/warning để người dùng biết phần nào bị mất.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, metadata, lossy*

### Đặt tên FX theo quy ước (_Add, _Blend, _Mul) là manh mối chọn blend khi không đọc được shader

Khi fileID shader dựng sẵn không tra được tên, dùng tên material + tên texture làm bằng chứng suy luận blend mode: hậu tố `_Add`/`Additive` → SRC_ALPHA(2)+ONE(1), depthWrite=false; `_Blend`/`_Alpha` → SRC_ALPHA(2)+ONE_MINUS_SRC_ALPHA(4); `_Mul`/`Multiply` → ZERO(0)+SRC_COLOR. Luôn ghi warning nói rõ đây là suy luận và yêu cầu xác nhận trong Unity — không trình bày như sự thật.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, heuristic, blend-mode, naming*

### UUID effect dựng sẵn của Cocos là hằng số đã biết — không để _effectAsset null

Material Cocos BẮT BUỘC có _effectAsset hợp lệ. Dùng đúng UUID nội bộ: builtin-standard c8f66d17-351a-48da-a12c-0212d28575c4, builtin-unlit a3cd009f-0ab0-420d-9278-b9fdab939bbc, for2d/builtin-sprite 60f7195c-ec2a-45eb-ba94-8955f60e81d0, for2d/builtin-sprite-renderer 6ef1defe-7997-477a-9b35-c18859ff8066, for2d/builtin-spine c27215d8-6835-4b68-bfbb-bdeac6100c04, internal/builtin-graphics 1c02ae6f-4492-4915-b8f8-7492a3b1e4cd, particles/builtin-particle d1346436-ac96-4271-b863-1f4fdead95b0, particles/builtin-particle-trail 17debcc3-0a6b-4b8a-b00b-dc58b885581e. Quy tắc cũ 'đặt null / ghi TODO' là SAI và làm material không mở được — chỉ dùng khi thật sự không có effect nào phù hợp trong danh sách.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect, uuid, cocos-3.8*

### Giá trị enum để ghi đè pipeline state trong _states của .mtl

_states[i] nhận object phẳng {rasterizerState, depthStencilState, blendState:{targets:[{...}]}}. gfx.BlendFactor: ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4, ONE_MINUS_DST_ALPHA=5, SRC_COLOR=6, DST_COLOR=7. gfx.CullMode: NONE=0, FRONT=1, BACK=2. Additive kiểu Unity legacy (Blend SrcAlpha One, ZWrite Off, Cull Off) ⇒ {blend:true, blendSrc:2, blendDst:1, blendSrcAlpha:2, blendDstAlpha:1} + depthWrite:false + cullMode:0. Alpha blend thường ⇒ blendSrc:2, blendDst:4.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend, gfx-enum, vfx*

### Material VFX: chọn effect theo nơi sử dụng, không theo tên file

Material blend cộng trong thư mục VFX có thể dùng cho mesh (builtin-unlit, technique 'transparent' = _techIdx 1, rồi ghi đè blendState thành additive) hoặc cho hệ hạt (builtin-particle). File .mat của Unity KHÔNG chứa thông tin nơi sử dụng, chỉ prefab/scene tham chiếu nó mới biết. Chọn một phương án mặc định (unlit nếu asset nằm trong nhánh 3D mesh), rồi bắt buộc ghi warning kèm UUID của phương án còn lại để đổi bằng một dòng.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, vfx, particle, effect-selection*

### Slot texture rỗng ⇒ không sinh mainTexture và giữ USE_TEXTURE mặc định

Chỉ chuyển entry m_TexEnvs có m_Texture.fileID != 0. Nếu mọi slot đều rỗng thì _props[0] không được có mainTexture (và _defines[0] không bật USE_TEXTURE). Sinh mainTexture null hoặc bật USE_TEXTURE mà không có texture khiến shader lấy sampler mặc định/lỗi biên dịch biến thể. Ghi warning nhắc: khi gán texture sau này phải bật USE_TEXTURE cùng lúc, và trỏ sub-asset '<uuid>@6c48a' với __expectedType__ 'cc.Texture2D'.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, texture, defines*

### Khi blend/cull trong m_Floats mâu thuẫn với tên + shader, ưu tiên ngữ nghĩa và nêu warning

m_Floats là hợp của mọi property từng dùng qua các lần đổi shader (rất hay là nguyên bộ URP/Lit: _Surface, _Blend, _SrcBlend, _DstBlend, _ZWrite, _Cull, _WorkflowMode, _Metallic...). Khi các giá trị này mô tả opaque nhưng tên material/họ shader nói additive, coi chúng là tồn dư: dựng state theo ngữ nghĩa của tên + shader, ghi rõ mâu thuẫn và cách sửa ngược lại trong warnings. Dấu hiệu nhận biết tồn dư URP: có khối MonoBehaviour m_ObjectHideFlags: 11 chỉ chứa 'version'.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, residue, urp, warning*

### Shader builtin Unity: dùng tên material + thư mục làm bằng chứng, fileID chỉ là gợi ý

Với m_Shader guid 0000000000000000f000000000000000, chỉ còn fileID (ví dụ 10720) và bảng fileID→tên shader không nằm trong asset. Không khẳng định tên shader từ fileID; kết hợp tên material ('Add', 'Glow', 'Alpha'), đường dẫn thư mục (VFX/, UI/) và tập property có mặt để suy đoán họ shader, chọn effect tương ứng, rồi ghi warning yêu cầu người dùng mở Unity xác nhận trước khi tin vào blend state.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, builtin, inference*

### Ưu tiên override blendState trong _states thay vì đoán chỉ số technique

Khi cần blend mode đặc biệt (additive, multiply) mà không kiểm chứng được danh sách technique của effect, hãy chọn technique chắc chắn tồn tại (builtin-unlit: 0 = opaque, 1 = transparent) rồi ghi đè trong `_states[0]`: `{rasterizerState:{cullMode}, depthStencilState:{depthTest, depthWrite}, blendState:{targets:[{blend, blendSrc, blendDst, blendSrcAlpha, blendDstAlpha}]}}`. Cách này đúng bất kể effect có technique 'add' hay không; đoán sai _techIdx làm material render sai hoặc không mở được.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, mtl, blend, technique*

### Giá trị enum gfx dùng trong _states của .mtl

Trong `_states` phải ghi SỐ, không ghi tên. gfx.BlendFactor: ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4, ONE_MINUS_DST_ALPHA=5, SRC_COLOR=6, DST_COLOR=7, ONE_MINUS_SRC_COLOR=8, ONE_MINUS_DST_COLOR=9. gfx.CullMode: NONE=0, FRONT=1, BACK=2. Additive kiểu Unity 'Particles/Additive' (Blend SrcAlpha One, ZWrite Off, Cull Off) = blendSrc 2 / blendDst 1 / depthWrite false / cullMode 0.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, gfx, enum, additive*

### Suy shader từ tên material + thư mục khi shader là builtin của Unity

Với `m_Shader.guid = 0000000000000000f000000000000000`, không tra được tên shader. Dùng tổ hợp tín hiệu: tên material (Add/Additive/Alpha/Blend/Multiply/Glow → trong suốt, thường additive), đường dẫn (VFX/Particle/UI/3D), và tập property CÓ TEXTURE thật để chọn effect Cocos; luôn ghi warning nêu rõ căn cứ suy luận và cách người dùng xác nhận lại trong Unity.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, builtin, heuristic*

### Tồn dư URP/Lit nhận diện qua khối MonoBehaviour version + bộ property đặc trưng

Nếu .mat có khối MonoBehaviour (m_ObjectHideFlags: 11, chỉ chứa `version`) kèm bộ _WorkflowMode/_Surface/_Blend/_SrcBlend/_DstBlend/_BaseMap/_ClearCoatMask, thì material TỪNG dùng URP/Lit. Khi shader hiện tại không phải URP, coi toàn bộ nhóm này là tồn dư: không map, liệt kê trong warnings, và đặc biệt không lấy _SrcBlend/_DstBlend/_ZWrite làm căn cứ blend mode.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, urp, residue*

### m_TexEnvs rỗng hoàn toàn: bỏ cả mainTexture lẫn tilingOffset

Nếu mọi entry trong `m_TexEnvs` đều có `m_Texture.fileID: 0`, không sinh uniform sampler nào và cũng không sinh `tilingOffset` (m_Scale (1,1)/m_Offset (0,0) trùng mặc định của effect) — `_props[0]` chỉ giữ những giá trị thực sự khác mặc định. Kèm warning vì material VFX không texture thường là dấu hiệu texture được gán ở nơi khác (Particle Renderer) hoặc đã mất.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, texture, props*

### Material của Particle System phải dùng builtin-particle.effect

Material Unity nằm trong nhánh VFX/Particle và được ParticleSystemRenderer dùng thì bên Cocos KHÔNG map sang builtin-unlit: cc.ParticleSystem yêu cầu material dựa trên builtin-particle.effect (d1346436-ac96-4271-b863-1f4fdead95b0), trail dùng builtin-particle-trail.effect (17debcc3-0a6b-4b8a-b00b-dc58b885581e). Khi chưa biết material được ai dùng, chọn effect theo giả định phổ biến nhất rồi ghi warning nêu lựa chọn thay thế.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, particle, effect*

### UUID effect dựng sẵn đã có bảng tra — không còn để null/TODO

Thay cho quy tắc cũ ('không suy ra được, đặt _effectAsset = null'), hãy dùng bảng UUID effect nội bộ đã xác nhận từ engine 3.8 (builtin-standard c8f66d17-351a-48da-a12c-0212d28575c4, builtin-unlit a3cd009f-0ab0-420d-9278-b9fdab939bbc, builtin-sprite 60f7195c-ec2a-45eb-ba94-8955f60e81d0, builtin-sprite-renderer 6ef1defe-7997-477a-9b35-c18859ff8066, builtin-particle d1346436-ac96-4271-b863-1f4fdead95b0, builtin-particle-trail 17debcc3-0a6b-4b8a-b00b-dc58b885581e, builtin-spine c27215d8-6835-4b68-bfbb-bdeac6100c04, builtin-graphics 1c02ae6f-4492-4915-b8f8-7492a3b1e4cd). Vẫn tuyệt đối không bịa UUID cho effect ngoài bảng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect, uuid*

### m_CustomRenderQueue quyết định technique khi các float blend mâu thuẫn

Khi convert Material: nếu m_CustomRenderQueue >= 3000 (dải Transparent) thì chọn technique trong suốt của effect Cocos (builtin-unlit _techIdx = 1), kể cả khi _SrcBlend=1/_DstBlend=0/_ZWrite=1/_Surface=0 nói là opaque — bộ float đó thường là tồn dư của URP/Lit. Luôn nêu mâu thuẫn này trong warnings kèm cách đảo ngược (_techIdx = 0).

*Xác nhận 1 lần · độ tin cậy: high · tag: material, render-queue, technique, urp-residue*

### Tham chiếu tới unity_builtin_extra không map được sang UUID Cocos

Quy tắc chèn gạch GUID->UUID chỉ đúng với asset do người dùng import. Mọi tham chiếu có guid 0000000000000000f000000000000000 (shader như fileID 10721, texture như fileID 10300 Default-Particle, mesh Quad/Cube...) là tài nguyên nội bộ Unity, không có file trong project: bỏ uniform tương ứng, KHÔNG sinh __uuid__ giả, và ghi warning yêu cầu import lại asset tương đương rồi gán tay.

*Xác nhận 1 lần · độ tin cậy: high · tag: guid, builtin-extra, texture, shader, material*

### Chọn effect Cocos cho material VFX shader-không-xác-định

Material nằm trong thư mục VFX/Particle dùng shader builtin không tra được tên: mặc định builtin-unlit.effect + technique transparent là lựa chọn an toàn (có mainColor/mainTexture/tilingOffset). Nhưng nếu material được gán cho ParticleSystemRenderer thì phải chuyển sang builtin-particle.effect — uniform đổi tên (tintColor thay mainColor, mainTiling_Offset thay tilingOffset), nên luôn hỏi lại người dùng material dùng cho renderer nào.

*Xác nhận 1 lần · độ tin cậy: medium · tag: effect-selection, vfx, particle, unlit, material*

### Ánh xạ _Cull của Unity sang rasterizerState.cullMode

_Cull: 0=Off -> cullMode NONE(0), 1=Front -> FRONT(1), 2=Back -> BACK(2). Cocos mặc định BACK nên _Cull:2 không cần ghi đè, để _states[i] = {} cho gọn; chỉ khi _Cull:0 mới ghi _states[i].rasterizerState.cullMode = 0. Shader particle của Unity thường tắt cull dù float _Cull còn lưu giá trị cũ — cảnh báo nếu nghi ngờ.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, states, cullmode*

### Chỉ ghi vào _props uniform khác mặc định của effect

Giữ _props tối giản: bỏ property trùng mặc định effect (tilingOffset = Vec4(1,1,0,0) khi m_Scale=(1,1) và m_Offset=(0,0)); slot texture fileID=0 bỏ hẳn thay vì sinh null. Riêng màu chính (_Color/_BaseColor) nên giữ cho tường minh. Khi cả _Color và _BaseColor cùng tồn tại: nếu bằng nhau map một lần vào mainColor; nếu khác nhau ưu tiên _BaseColor (property của shader URP hiện hành) và ghi warning.

*Xác nhận 1 lần · độ tin cậy: high · tag: props, default-value, color, tilingoffset, material*

### Bộ property PBR của URP/Lit không có chỗ trong builtin-unlit

Khi chọn builtin-unlit, mọi uniform PBR (_Metallic, _Smoothness, _BumpScale, _OcclusionStrength, _Cutoff, _ClearCoat*, _SpecColor, _EmissionColor...) phải bị bỏ và liệt kê trong warnings kèm phương án thay thế bằng builtin-standard: _Metallic->metallic, _Smoothness->roughness (roughness ≈ 1 - smoothness, quan hệ nghịch), _Cutoff->alphaThreshold, _BumpScale->normalStrength, _EmissionColor->emissive.

*Xác nhận 1 lần · độ tin cậy: high · tag: pbr, standard-effect, property-mapping, material*

### Shader builtin-extra + property URP/Lit ⇒ toàn bộ property là tồn dư

Khi m_Shader có guid 0000000000000000f000000000000000 (unity_builtin_extra) NHƯNG m_SavedProperties lại chứa nguyên bộ tên property của URP/Lit (_WorkflowMode, _Surface, _Blend, _SrcBlend/_DstBlend, _ClearCoatMask, _AddPrecomputedVelocity...), thì shader đang gán KHÔNG phải URP/Lit và mọi float/color đó là tồn dư của lần gán shader trước. Không được suy blend/opaque từ _SrcBlend/_DstBlend/_Surface trong trường hợp này; suy ý định render từ tên material + đường dẫn thư mục (VFX/Add/Glow/Blend...) và ghi warning yêu cầu xác nhận tên shader trong Unity.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, unity-builtin, urp, residue*

### Diễn đạt additive blending trong .mtl bằng override _states thay vì đoán technique

Để ra chế độ cộng sáng trong Cocos 3.8, chọn _techIdx là chỉ số CHẮC CHẮN tồn tại (builtin-unlit: 0=opaque, 1=transparent) rồi ghi đè _states[0] = {depthStencilState:{depthTest:true,depthWrite:false}, blendState:{targets:[{blend:true, blendSrc:2, blendDst:1, blendSrcAlpha:2, blendDstAlpha:1}]}}. Giá trị là enum gfx.BlendFactor: ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4, ONE_MINUS_DST_ALPHA=5, SRC_COLOR=6, DST_COLOR=7, ONE_MINUS_SRC_COLOR=8, ONE_MINUS_DST_COLOR=9, SRC_ALPHA_SATURATE=10. Cách này an toàn hơn việc trỏ _techIdx tới một technique tên 'add' mà chưa xác minh được là có tồn tại.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend, additive, techidx, gfx-enum*

### Chọn EffectAsset theo nơi tiêu thụ material, không theo shader Unity

Effect của Cocos phải chọn theo component sẽ dùng material ở bản chuyển đổi: cc.Sprite/UI 2D -> builtin-sprite (60f7195c-ec2a-45eb-ba94-8955f60e81d0); SpriteRenderer trong 3D -> builtin-sprite-renderer (6ef1defe-7997-477a-9b35-c18859ff8066); mesh VFX không chiếu sáng -> builtin-unlit (a3cd009f-0ab0-420d-9278-b9fdab939bbc); mesh có PBR -> builtin-standard (c8f66d17-351a-48da-a12c-0212d28575c4); ParticleSystemRenderer -> builtin-particle (d1346436-ac96-4271-b863-1f4fdead95b0). Luôn ghi warning nêu phương án thay thế kèm UUID sẵn để người dùng đổi một dòng, vì loại consumer thường không suy ra được từ chính file .mat.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect-asset, uuid, mapping*

### UUID effect dựng sẵn đã có bảng cố định — dùng thẳng, không để TODO

Thay thế quy tắc cũ 'đặt _effectAsset null hoặc TODO': đã có bảng UUID thật của các EffectAsset nội bộ Cocos 3.8, nên _effectAsset phải luôn là một UUID hợp lệ trong bảng đó. Chỉ ghi warning khi không chắc CHỌN effect nào, chứ không để _effectAsset rỗng/TODO vì material sẽ không mở được trong editor.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect-asset, uuid*

### Bỏ hẳn m_TexEnvs rỗng và giữ define texture ở mặc định

Mọi entry trong m_TexEnvs có m_Texture.fileID = 0 phải bị loại hoàn toàn khỏi _props (không sinh key null, không sinh tilingOffset kèm theo). Khi không có texture nào được chuyển thì cũng để _defines[0] = {} (USE_TEXTURE mặc định tắt) và nêu warning rằng material sẽ render bằng texture mặc định của effect; chỉ bật USE_TEXTURE khi thực sự gán mainTexture (<uuid>@6c48a, __expectedType__ = cc.Texture2D).

*Xác nhận 1 lần · độ tin cậy: high · tag: material, texture, defines, props*

### Với material VFX, cull và depthWrite phải nêu rõ chứ không im lặng theo dữ liệu

Material hiệu ứng (additive/alpha-blend) hầu như luôn cần depthWrite = false và thường là cullMode = NONE(0), trong khi giá trị _Cull/_ZWrite trong .mat lại hay là tồn dư. Quy tắc: luôn đặt depthWrite=false khi chọn blend trong suốt, giữ cull ở mặc định của effect, và ghi warning chỉ đúng field cần sửa (_states[0].rasterizerState.cullMode) để người dùng chỉnh một chỗ.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, vfx, depth, cull*

### Material cộng sáng (Additive) của Unity → builtin-unlit + ghi đè blendState

Cocos không có technique 'additive' dựng sẵn. Với material VFX cộng sáng, dùng builtin-unlit (a3cd009f-0ab0-420d-9278-b9fdab939bbc), đặt _techIdx = 1 (technique 'transparent'), rồi ghi đè trong _states[0]: blendState.targets[0] = {blend: true, blendSrc: 2 (SRC_ALPHA), blendDst: 1 (ONE), blendSrcAlpha: 2, blendDstAlpha: 1}, kèm depthStencilState.depthWrite = false. Nếu material dùng cho hạt/trail của ParticleSystem thì đổi sang builtin-particle / builtin-particle-trail.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, vfx, blend, builtin-unlit*

### Số enum blend của Unity KHÁC số enum gfx.BlendFactor của Cocos

UnityEngine.Rendering.BlendMode: Zero=0, One=1, DstColor=2, SrcColor=3, OneMinusDstColor=4, SrcAlpha=5, OneMinusSrcColor=6, DstAlpha=7, OneMinusDstAlpha=8, SrcAlphaSaturate=9, OneMinusSrcAlpha=10. gfx.BlendFactor của Cocos: ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4, ONE_MINUS_DST_ALPHA=5, SRC_COLOR=6, DST_COLOR=7, ONE_MINUS_SRC_COLOR=8, ONE_MINUS_DST_COLOR=9, SRC_ALPHA_SATURATE=10. Tuyệt đối không copy thẳng số _SrcBlend/_DstBlend sang blendSrc/blendDst — phải dịch qua TÊN factor.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend, enum*

### Gán mainTexture trong builtin-unlit phải bật define USE_TEXTURE

Trong builtin-unlit, sampler mainTexture nằm trong nhánh #if USE_TEXTURE. Nếu chỉ điền _props[0].mainTexture mà không đặt _defines[0].USE_TEXTURE = true thì shader biên dịch bỏ sampler và texture bị bỏ qua âm thầm (ra màu thuần). Quy tắc chung: mỗi uniform nằm sau macro của effect phải kèm macro tương ứng trong _defines cùng chỉ số pass.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, defines, builtin-unlit*

### Cấu trúc _states của .mtl: PassOverrides dạng JSON thuần, không có __type__

Mỗi phần tử _states[i] là object JSON thuần theo pass, các khoá hợp lệ gồm rasterizerState (cullMode: 0=NONE,1=FRONT,2=BACK), depthStencilState (depthTest, depthWrite, depthFunc...), blendState ({targets: [{blend, blendSrc, blendDst, blendSrcAlpha, blendDstAlpha, blendEq}]}), priority, primitive. Giá trị enum ghi bằng SỐ của gfx, không ghi chuỗi như trong file .effect và không thêm __type__.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, mtl, states*

### Khi shader là unity_builtin_extra, suy luận từ tên material nhưng phải cảnh báo

Với m_Shader guid 0000000000000000f000000000000000, chỉ còn fileID nên không tra được tên shader từ asset. Dùng tín hiệu phụ: hậu tố tên material (_Add/_Additive → blend cộng sáng, _Alpha/_Blend → alpha blend, _Cutout → alpha test), tên texture, và tập property THỰC SỰ được gán (m_TexEnvs có fileID != 0). Mọi state suy luận theo cách này (blend, ZWrite, Cull) phải nêu rõ trong warnings là 'suy luận, cần xác nhận'.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, heuristic*

### Property tồn dư mâu thuẫn: ưu tiên ngữ nghĩa shader đang dùng, không ưu tiên số liệu m_Floats

Khi material từng đổi shader (dấu hiệu: có đủ bộ URP/Lit _WorkflowMode/_Surface/_Blend/_Metallic... nhưng shader hiện tại là builtin), các giá trị _SrcBlend/_DstBlend/_ZWrite/_Cull trong m_Floats là rác của shader cũ và thường mô tả opaque. Không dùng chúng làm nguồn sự thật cho render state; chọn state theo ngữ nghĩa shader hiện hành và liệt kê mâu thuẫn trong warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, legacy-props, warnings*

### Wrap/filter mode của texture không nằm trong .mat

Material Unity chỉ mang m_Scale/m_Offset của texture; wrap mode, filter mode, mipmap nằm trong file .meta của ảnh. Sau khi convert material, luôn nhắc người dùng đặt lại các tham số này trong Inspector texture của Cocos (VFX trail/beam thường cần clamp để tránh viền lặp).

*Xác nhận 1 lần · độ tin cậy: high · tag: material, texture, import-settings*

### Trường editor mới của Unity 2022+ trong .mat đều bỏ

Ngoài các trường đã biết, bỏ thêm m_LockedProperties, m_AllowLocking, m_ModifiedSerializedProperties, m_InvalidKeywords, m_BuildTextureStacks — đều là dữ liệu editor/nâng cấp, không mang thông tin render; chỉ ghi info trong warnings.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, metadata*

### builtin-unlit phải bật define USE_TEXTURE thì mainTexture mới có tác dụng

Khi convert Material sang effect builtin-unlit (hoặc builtin-standard) của Cocos, nếu có gán uniform sampler (mainTexture) thì BẮT BUỘC đặt _defines[0].USE_TEXTURE = true. Gán texture trong _props mà không bật macro tương ứng thì shader không lấy nhánh sampling — material im lặng render ra màu trơn, không báo lỗi. Quy tắc chung: mọi uniform nằm trong nhánh #if MACRO của effect đều cần define đi kèm trong _defines cùng chỉ số pass.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect, defines, builtin-unlit*

### _CullMode của Unity trùng số với gfx.CullMode của Cocos

Property float _CullMode trong .mat (0=Off, 1=Front, 2=Back) trùng đúng giá trị số với cc.gfx.CullMode (NONE=0, FRONT=1, BACK=2), nên chép thẳng vào _states[<pass>].rasterizerState.cullMode. Chỉ ghi khi khác mặc định của effect (builtin-* mặc định cull BACK=2); VFX/trail/quad hai mặt thường là 0.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, states, cullmode, rasterizer*

### m_InvalidKeywords là bằng chứng shader đã bị mất/đổi

Nếu .mat có m_InvalidKeywords khác rỗng (keyword không thuộc shader đang gán) hoặc tập property trong m_SavedProperties không khớp shader được tham chiếu, kết luận tham chiếu shader là tồn dư/hỏng. Không được chọn effect Cocos dựa trên m_Shader trong trường hợp này: hãy suy từ tên material + đường dẫn + tập property, và ghi warning severity error yêu cầu người dùng xác nhận lại trong Unity.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, keywords, residual*

### Nhận diện shader VFX tuỳ biến qua tập property đặc trưng

Tập property kiểu _Flow / _Noise / _Mask / _Distortion* / _Speed*UV* / _Usedepth + _Depthpower / _Usecenterglow / _Emission là dấu hiệu shader VFX tuỳ biến (Amplify Shader Editor hoặc gói asset-store). Không effect dựng sẵn nào của Cocos tái tạo được. Cách xử lý chuẩn: chuyển phần lõi (mainTexture, mainColor, cull, blend) sang builtin-unlit technique transparent, rồi liệt kê TỪNG hiệu ứng bị mất trong warnings và đề xuất viết .effect riêng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, vfx, custom-shader, fallback*

### Giá trị HDR/emission > 1 không biểu diễn được bằng cc.Color

Mọi property Unity mang ý nghĩa cường độ HDR (_Emission, _EmissionColor với hệ số >1, intensity) không thể ghi vào _props dưới dạng cc.Color vì kênh bị kẹp trong [0,255]. Chỉ có ba lối thoát: (a) blend cộng trong _states, (b) effect tuỳ biến có uniform intensity, (c) nướng độ sáng vào texture. Luôn nêu warning thay vì kẹp âm thầm.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, color, hdr, emission*

### Chọn _techIdx theo tính trong suốt, VFX luôn dùng technique transparent

Với builtin-unlit và builtin-standard, _techIdx = 0 là opaque, 1 là transparent (đã có alpha blend + depthWrite off). Material VFX (trail, glow, particle, flare) luôn chọn 1. Nếu .mat không có _SrcBlend/_DstBlend để suy ra blend thật, giữ alpha blend mặc định của technique và ghi warning kèm sẵn đoạn _states blendDst=1 (ONE) để người dùng đổi sang additive khi cần.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, techidx, blend, transparent*

### Ưu tiên bảng UUID effect dựng sẵn được cung cấp hơn placeholder TODO

Khi ngữ cảnh có sẵn bảng UUID EffectAsset nội bộ lấy từ engine thật, phải dùng đúng UUID đó cho _effectAsset và tuyệt đối không để null/TODO (material sẽ không mở được trong editor). Quy tắc 'không bịa UUID' chỉ áp dụng khi KHÔNG có bảng tra — lúc đó mới ghi warning yêu cầu gán Effect bằng tay.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect-asset, uuid*

### Dùng bảng UUID effect nội bộ đã xác nhận thay vì để null/TODO

Khi có bảng UUID EffectAsset dựng sẵn lấy từ engine đang chạy (builtin-unlit a3cd009f-0ab0-420d-9278-b9fdab939bbc, builtin-sprite 60f7195c-ec2a-45eb-ba94-8955f60e81d0, builtin-standard c8f66d17-351a-48da-a12c-0212d28575c4, builtin-particle d1346436-ac96-4271-b863-1f4fdead95b0, builtin-particle-trail 17debcc3-0a6b-4b8a-b00b-dc58b885581e, builtin-sprite-renderer 6ef1defe-7997-477a-9b35-c18859ff8066, builtin-spine c27215d8-6835-4b68-bfbb-bdeac6100c04, builtin-graphics 1c02ae6f-4492-4915-b8f8-7492a3b1e4cd), hãy điền thẳng UUID đó vào _effectAsset. Quy tắc cũ 'đặt null hoặc chuỗi TODO' chỉ áp dụng khi KHÔNG có bảng tra; cả _effectAsset null lẫn UUID chứa chữ TODO đều làm material không mở được trong editor. Vẫn tuyệt đối không tự chế UUID mới.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect, uuid*

### Material additive/blend của Unity: chọn technique transparent rồi ghi đè blendState bằng số enum

builtin-unlit chỉ có 2 technique (0 = opaque, 1 = transparent với src_alpha/one_minus_src_alpha). Với material additive (tên chứa Add/Additive, hoặc shader Particles/Additive), đặt _techIdx = 1 rồi ghi đè _states[0].blendState.targets[0] = {blend: true, blendSrc: 2, blendDst: 1, blendSrcAlpha: 2, blendDstAlpha: 1} và depthStencilState = {depthTest: true, depthWrite: false}. Giá trị trong .mtl phải là SỐ theo enum gfx (BlendFactor: ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4; CullMode: NONE=0, FRONT=1, BACK=2), không dùng chuỗi tên như trong file .effect YAML.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend, states, additive*

### Gán mainTexture phải kèm define USE_TEXTURE

Trong builtin-unlit (và builtin-standard), việc đặt _props[0].mainTexture là chưa đủ: shader chỉ lấy mẫu texture khi macro USE_TEXTURE bật. Luôn thêm _defines[0] = {"USE_TEXTURE": true} khi _MainTex/_BaseMap của Unity có m_Texture.fileID != 0. Thiếu define thì material vẫn hợp lệ nhưng ra màu trơn — lỗi im lặng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, defines, texture*

### Không tự ý bật USE_VERTEX_COLOR

Material VFX của Unity thường dựa vào màu đỉnh, nhưng bật USE_VERTEX_COLOR trong effect Cocos khi mesh/renderer không cung cấp thuộc tính a_color sẽ cho kết quả sai (thường ra đen hoặc mất hình). Mặc định để tắt và ghi warning hướng dẫn bật thủ công nếu renderer thực sự có màu đỉnh.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, defines, vertex-color*

### Có khối MonoBehaviour URP + bộ property Lit nhưng m_Shader trỏ builtin ⇒ material đã đổi shader, m_Floats là rác

Khi .mat vừa chứa khối MonoBehaviour version của URP material upgrader vừa chứa nguyên bộ _WorkflowMode/_Surface/_Blend/_Metallic/_Smoothness nhưng m_Shader lại là shader dựng sẵn (guid 0000000000000000f000000000000000), nghĩa là material từng dùng URP/Lit rồi bị đổi shader. Trạng thái render (blend, ZWrite, Cull) phải suy từ shader ĐANG gán, không được đọc từ _SrcBlend/_DstBlend/_ZWrite/_Cull trong m_Floats; mọi mâu thuẫn phải nêu trong warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, legacy-props*

### Bỏ property trùng mặc định của effect Cocos

Không ghi vào _props những uniform có giá trị đúng bằng mặc định của effect: tilingOffset khi m_Scale = (1,1) và m_Offset = (0,0), alphaThreshold khi không bật alpha clip. _props càng ít override thì material càng dễ bảo trì và tránh khoá cứng giá trị khi effect nâng cấp. Với màu trắng mặc định vẫn nên ghi mainColor vì đó là ngữ nghĩa tường minh của material Unity.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, props, defaults*

### Khi trùng _Color và _BaseColor, chỉ map một lần sang mainColor

Material Unity đã đi qua URP thường có cả _Color (builtin) lẫn _BaseColor (URP) trong m_Colors. Chọn đúng một giá trị theo shader đang gán (builtin → _Color, URP → _BaseColor) map sang mainColor dạng {__type__: 'cc.Color', r/g/b/a = round(v*255) kẹp [0,255]); nếu hai giá trị khác nhau thì phải ghi warning thay vì tự chọn im lặng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, color, urp*

### Shader tuỳ biến/Shader Graph của Unity: chọn builtin gần nhất theo mô hình chiếu sáng, không theo tên property

Khi `m_Shader` trỏ tới file .shader do người dùng viết (guid thật, không phải guid builtin toàn số 0), không có cách chuyển tự động. Chọn effect builtin theo MÔ HÌNH CHIẾU SÁNG mà shader mô phỏng: matcap/stylized/toon (ánh sáng đã nướng vào texture) → builtin-unlit; PBR thật (metallic/roughness được dùng) → builtin-standard; sprite 2D → builtin-sprite. Chỉ giữ albedo texture + màu, rồi liệt kê TỪNG uniform bị mất trong warnings ở mức error, kèm gợi ý viết file .effect tuỳ biến.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, shadergraph, builtin-unlit*

### builtin-unlit phải bật macro USE_TEXTURE thì mainTexture mới có tác dụng

Với effect `builtin-unlit`, uniform `mainTexture` nằm trong nhánh macro `USE_TEXTURE`. Nếu `_props[0].mainTexture` được gán mà `_defines[0]` không có `{"USE_TEXTURE": true}` thì material vẫn render nhưng chỉ ra màu `mainColor` — lỗi im lặng rất khó nhận ra. Luôn bật define tương ứng khi gán một uniform sampler của effect builtin.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, defines, builtin-unlit, texture*

### Property tên `_SampleTexture2D_<hash>_Texture_1_Texture2D` là rác nội bộ của Shader Graph

Shader Graph serialize texture mặc định của các node Sample Texture 2D vào .mat dưới dạng `_SampleTexture2D_<guid32>_Texture_1_Texture2D` (và các biến thể `_<NodeName>_<hash>_...`). Đây không phải property do người dùng phơi ra, không mang ý nghĩa ổn định — luôn bỏ và chỉ ghi warning, không cố map sang uniform nào.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shadergraph, property-rc*

### Ưu tiên _BaseMap/_BaseColor (URP) hơn _MainTex/_Color khi cả hai cùng tồn tại

Trong .mat của project URP, cả cặp legacy (`_MainTex`, `_Color`) lẫn cặp URP (`_BaseMap`, `_BaseColor`) thường cùng có mặt, nhưng chỉ một cặp còn giá trị thật — cặp kia hay có `m_Texture.fileID: 0`. Quy tắc chọn: lấy slot có `fileID != 0`; nếu cả hai đều có texture thì ưu tiên `_BaseMap`/`_BaseColor` và ghi warning về slot còn lại.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, urp, maintexture, maincolor*

### Chỉ ánh xạ GUID→UUID cho asset có trong bảng ánh xạ project

Luật chèn dấu gạch GUID→UUID là tất định, nhưng chỉ nên áp dụng cho GUID xuất hiện trong bảng ánh xạ asset của project (asset đã/sẽ được import sang Cocos). GUID lạ (texture ngoài phạm vi convert, package, asset store) tạo ra tham chiếu chết: Inspector hiện ô trống mà không báo lỗi. Với GUID lạ: bỏ hẳn tham chiếu và ghi warning nêu rõ guid + property, thay vì sinh __uuid__ suy đoán.

*Xác nhận 1 lần · độ tin cậy: high · tag: guid, uuid, tham-chiu, warnings, material*

### m_CustomRenderQueue lệch chuẩn là dấu hiệu mâu thuẫn opaque/transparent, phải nêu warning

So chiếu `m_CustomRenderQueue` với blend state (`_Surface`, `_SrcBlend`/`_DstBlend`, `_ZWrite`): queue gần 3000 nhưng blend state opaque (SrcBlend=1/DstBlend=0/ZWrite=1) là mâu thuẫn. Chọn `_techIdx` theo BLEND STATE (nguồn đáng tin hơn) — builtin-unlit: 0 = opaque, 1 = transparent — rồi ghi warning nêu cả hai tín hiệu và cách đổi. Cocos không có renderQueue dạng số trong .mtl; thứ tự vẽ chỉ điều chỉnh được qua technique hoặc `priority` khai báo trong .effect.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, render-queue, technique, blend-state*

### Ánh xạ _Cull của Unity và quy tắc để _states rỗng

`_Cull`: 0 = Off (none), 1 = Front, 2 = Back. Cocos mặc định cull back, nên `_Cull: 2` thì để `_states[0] = {}` (giữ mặc định effect) thay vì ghi đè thừa. Chỉ ghi rasterizerState/blendState/depthStencilState vào `_states` khi giá trị KHÁC mặc định của effect — mỗi override thừa là một chỗ dễ sai khi đổi effect về sau.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, states, cull*

### Ưu tiên UUID effect dựng sẵn có thật thay vì để null/TODO

Khi bộ quy tắc đã cung cấp bảng UUID effect nội bộ có thật (builtin-unlit a3cd009f-0ab0-420d-9278-b9fdab939bbc, builtin-sprite 60f7195c-ec2a-45eb-ba94-8955f60e81d0, builtin-standard c8f66d17-351a-48da-a12c-0212d28575c4, builtin-particle d1346436-ac96-4271-b863-1f4fdead95b0, builtin-sprite-renderer 6ef1defe-7997-477a-9b35-c18859ff8066, builtin-spine c27215d8-6835-4b68-bfbb-bdeac6100c04, builtin-graphics 1c02ae6f-4492-4915-b8f8-7492a3b1e4cd, builtin-particle-trail 17debcc3-0a6b-4b8a-b00b-dc58b885581e), phải dùng đúng UUID đó cho _effectAsset. Quy tắc cũ 'để _effectAsset null hoặc chuỗi TODO' chỉ áp dụng khi KHÔNG có bảng UUID; cả null lẫn chuỗi TODO đều khiến material không mở được trong editor.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect, uuid*

### Bảng quy đổi BlendMode của Unity sang BlendFactor của Cocos

Unity UnityEngine.Rendering.BlendMode: 0=Zero, 1=One, 2=DstColor, 3=SrcColor, 4=OneMinusDstColor, 5=SrcAlpha, 6=OneMinusSrcColor, 7=DstAlpha, 8=OneMinusDstAlpha, 9=SrcAlphaSaturate, 10=OneMinusSrcAlpha. Cocos gfx.BlendFactor: ZERO=0, ONE=1, SRC_ALPHA=2, DST_ALPHA=3, ONE_MINUS_SRC_ALPHA=4, ONE_MINUS_DST_ALPHA=5, SRC_COLOR=6, DST_COLOR=7, ONE_MINUS_SRC_COLOR=8, ONE_MINUS_DST_COLOR=9, SRC_ALPHA_SATURATE=10. Hai enum KHÔNG trùng chỉ số — bắt buộc tra bảng, không copy số nguyên trực tiếp từ _SrcBlend/_DstBlend.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend, enum*

### Ba chế độ blend VFX phổ biến của Unity và cách ghi vào _states của Cocos

Additive (Blend SrcAlpha One): blendSrc=2, blendDst=1, blendSrcAlpha=2, blendDstAlpha=1, depthWrite=false. Alpha blend (Blend SrcAlpha OneMinusSrcAlpha): blendSrc=2, blendDst=4, blendSrcAlpha=2, blendDstAlpha=4, depthWrite=false. Premultiplied (Blend One OneMinusSrcAlpha): blendSrc=1, blendDst=4. Luôn kèm blend=true trong targets[0], và với builtin-unlit phải đặt _techIdx=1 (technique transparent) thì override mới có hiệu lực đúng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, vfx, blend, states*

### Cấu trúc phần tử của _states trong .mtl

Mỗi phần tử của _states là một object PassOverrides dạng phẳng, không có __type__: {"rasterizerState":{"cullMode":n}, "depthStencilState":{"depthTest":bool,"depthWrite":bool}, "blendState":{"targets":[{"blend":bool,"blendSrc":n,"blendDst":n,"blendSrcAlpha":n,"blendDstAlpha":n}]}}. cc.gfx.CullMode: NONE=0, FRONT=1, BACK=2 (khác Unity _Cull: 0=Off, 1=Front, 2=Back — trùng ý nghĩa nhưng phải kiểm tra từng giá trị). Chỉ ghi field cần override, phần còn lại kế thừa effect.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, states, format*

### Tên material và thư mục là bằng chứng mạnh hơn m_Floats khi shader là builtin

Khi m_Shader trỏ tới unity_builtin_extra (guid 0000000000000000f000000000000000) mà m_Floats lại chứa nguyên bộ property URP/Lit đúng giá trị mặc định (_WorkflowMode, _Surface, _Blend, _SrcBlend=1, _DstBlend=0, _ZWrite=1, _Smoothness=0.5, _Cutoff=0.5...), thì khối m_Floats là tồn dư của lần gán shader URP trước đó, KHÔNG mô tả trạng thái render hiện tại. Trong trường hợp này ưu tiên suy luận từ tên material + thư mục (Add/Additive/Glow trong VFX ⇒ additive; Alpha/Fade ⇒ alpha blend), viết cấu hình theo suy luận đó, và nêu rõ mâu thuẫn cùng cách khôi phục phương án ngược lại trong warnings.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, shader, heuristic, residue*

### Material Unity không có texture vẫn phải sinh .mtl hợp lệ

Nếu mọi entry m_TexEnvs đều có m_Texture.fileID = 0 thì bỏ hẳn mainTexture và tilingOffset khỏi _props, đồng thời không bật define USE_TEXTURE — không được sinh property giá trị null. Vẫn giữ mainColor (kể cả khi là trắng mặc định) để người dùng đối chiếu được với _Color/_BaseColor của bản gốc, và ghi info rằng material chỉ còn màu phẳng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, texture, props*

### Chọn effect Cocos theo loại renderer sử dụng material, không theo nội dung .mat

File .mat không cho biết material được gán cho MeshRenderer, ParticleSystemRenderer hay SpriteRenderer, trong khi bên Cocos mỗi loại cần effect khác nhau (builtin-unlit/standard cho mesh, builtin-particle cho cc.ParticleSystem, builtin-sprite cho UI 2D). Chọn effect an toàn theo ngữ cảnh thư mục, rồi bắt buộc ghi warning liệt kê UUID thay thế cho các loại renderer còn lại kèm nhắc rà lại _techIdx và tên uniform sau khi đổi.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, effect, renderer*

### Custom shader with matcap → not convertible, use builtin-unlit placeholder

Khi Unity Material dùng custom shader (guid có trong bảng project, không phải 0000000000000000f000000000000000), đặc biệt nếu shader dùng matcap (_Matcap), dissolve, ripple, voronoi, wobble — toàn bộ logic render tuỳ biến không thể chuyển sang Cocos bằng built-in effect. Tạo .mtl với builtin-unlit làm placeholder, map texture chính (từ _MainTex hoặc uniform texture tuỳ biến như _Texture2D) và _Color → mainColor. Ghi error cho shader, cảnh báo tất cả property tuỳ biến bị mất. Người dùng phải viết lại effect Cocos bằng GLSL.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, custom-shader, matcap, placeholder*

### Custom uniform name _Texture2D as main texture fallback

Khi _MainTex rỗng (fileID: 0) nhưng shader tuỳ biến có uniform texture khác (ví dụ _Texture2D, _BaseColorMap...), map texture đó sang mainTexture của Cocos nhưng ghi warning rằng đây là tên uniform tuỳ biến — người dùng cần xác nhận texture này mới là texture chính.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, custom-uniform, texture-mapping*

### SrcBlend=1/DstBlend=0/ZWrite=1 = opaque replace → builtin-unlit techIdx 0

Blend mode Unity SrcBlend=1 (One), DstBlend=0 (Zero) với ZWrite=1 là chế độ 'replace' — ghi đè hoàn toàn framebuffer, hành xử như opaque. Map sang techIdx=0 của builtin-unlit (opaque). Nhưng nếu shader tuỳ biến dùng alpha trong pixel shader cho hiệu ứng (dissolve, cutout), thông tin alpha đó bị mất ở chế độ opaque — ghi warning để người dùng kiểm tra visual và cân nhắc techIdx=1 (transparent).

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend-mode, technique-index*

### Cocos builtin-unlit texture uniform phải dùng sub-asset @6c48a (Texture2D)

Trong material Cocos, uniform sampler2D (như mainTexture) phải trỏ tới sub-asset texture có suffix @6c48a với __expectedType__: 'cc.Texture2D'. Không dùng UUID gốc hay @f9941 (SpriteFrame). GUID Unity → UUID = chèn dấu gạch 8-4-4-4-12.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, texture, sub-asset, uuid*

### Custom shader có guid khác 0000000000000000f000000000000000 là shader tự viết, không có ánh xạ tự động sang Cocos

Khi m_Shader có guid KHÔNG phải toàn-số-0-kết-thúc-bằng-f000000000000000, đó là custom shader của người dùng. Toàn bộ property như _Dissolve, _Matcap, _RippleAmount, _VoronoiSpeed… là uniform của shader đó và không có tương ứng trong builtin effect của Cocos. Phải chọn effect gần nhất (thường là builtin-sprite cho 2D, builtin-unlit cho 3D), chỉ map property trùng tên với uniform của effect đó, còn lại liệt kê đầy đủ trong warnings kèm yêu cầu viết custom .effect.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, custom-shader, matcap*

### Ánh xạ texture chính khi _MainTex rỗng: tìm texture có tên gợi ý nhất trong m_TexEnvs

Nhiều material Unity dùng custom shader không dùng tên _MainTex cho texture chính mà dùng tên khác (_Texture2D, _Diffuse…). Khi _MainTex rỗng (fileID: 0), duyệt m_TexEnvs tìm slot có fileID != 0 và tên gần nghĩa nhất với 'main texture' (ưu tiên _Texture2D, _Diffuse, _Albedo…), map slot đó vào mainTexture của Cocos, ghi info về quyết định này.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, texture, maintexture, mapping*

### Custom shader matcap của Unity không có tương ứng Cocos — bắt buộc viết lại effect

Unity shader dùng kỹ thuật matcap (texture lookup dựa trên view-space normal, thường có uniform _Matcap) không thể map sang bất kỳ builtin effect nào của Cocos Creator 3.8. Texture matcap phải được liệt kê trong warnings, không được im lặng bỏ qua. Người dùng cần viết Cocos Effect với vertex shader tính toán view-space normal và fragment shader sample matcap texture.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, matcap, custom-effect*

### Hiệu ứng chất lỏng (dissolve, ripple, voronoi, wobble, fill) trong custom shader Unity tuyệt đối không chuyển được tự động

Các property như _Dissolve, _RippleAmount, _VoronoiSpeed, _Wobble, _Fill, _NoiseScale, _EdgeWidth, _EdgeColor, _OutlineThickness, _OutlineColor là tham số của hệ thống hiệu ứng đồ hoạ phức tạp được viết trong custom shader. Cocos Creator không có built-in effect nào hỗ trợ các hiệu ứng này. Phải liệt kê từng property trong warnings và ghi rõ cần rewrite toàn bộ shader sang Cocos Effect system.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, liquid-effect, dissolve, custom-effect*

### Khi không có _MainTex nhưng có texture khác, phải chọn texture phù hợp nhất làm mainTexture

Trong material Unity, _MainTex là slot mặc định cho SpriteRenderer. Khi slot này rỗng nhưng material vẫn có texture khác (_Texture2D với guid hợp lệ), slot đó nhiều khả năng là texture chính trong custom shader. Map texture đó vào mainTexture của builtin-sprite và ghi info giải thích lý do chọn.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, texture, maintexture, fallback*

### Custom Unity shader với hiệu ứng thủ tục → bắt buộc custom effect Cocos

Khi material Unity dùng shader tuỳ biến (guid không phải 000000...f000...) chứa các uniform thủ tục như _Matcap, _Dissolve, _NoiseScale, _RippleAmount, _VoronoiSpeed, _Wobble, _OutlineThickness, _EdgeWidth, _Fill — đây là dấu hiệu của shader có logic render riêng (water/liquid effect, matcap shading). Fallback sang builtin-unlit chỉ giữ được _Color và _MainTex; mọi uniform thủ tục cần custom Cocos Effect viết bằng GLSL. Không thể map vào builtin-standard hay builtin-unlit.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, custom-shader, procedural-effects, matcap*

### Texture _Matcap là dấu hiệu của custom effect không thể fallback

Uniform _Matcap trong Unity material là texture dùng cho kỹ thuật matcap shading (sphere-mapped environment lighting mô phỏng). Cocos không có built-in effect hỗ trợ matcap. Nếu material có _Matcap, luôn cần custom effect Cocos — không map _Matcap vào bất kỳ slot nào của builtin-unlit hay builtin-standard.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, matcap, custom-effect*

### Phân biệt _MainTex (slot chuẩn) và texture tuỳ biến (_Texture2D, _Matcap) trong shader custom

Shader custom Unity có thể không dùng tên _MainTex cho texture chính. Trong file .mat này, _MainTex có fileID=0 (rỗng), trong khi _Texture2D trỏ tới Bottle.png và _Matcap trỏ tới Bottle_Matcap.png. Khi _MainTex rỗng, ưu tiên map texture có tên gợi ý 'chính' (_Texture2D) vào mainTexture, nhưng phải ghi warning vì đây là suy đoán.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, texture-slot, custom-shader*

### Custom generated shader → bắt buộc viết Cocos Effect thủ công

Khi Unity .mat trỏ tới shader có guid nằm trong project (không phải guid 0000000000000000f000000000000000 của built-in), đó là shader custom. Mọi property của shader này (đặc biệt các property không có tên chuẩn như _Wobble, _Fill, _Color01..04, _Multiply) là shader-specific — không tồn tại uniform tương ứng trong bất kỳ Cocos built-in effect nào. Cách xử lý duy nhất: tạo .mtl placeholder với builtin-unlit, copy mainColor/mainTexture nếu có, ghi warning yêu cầu viết .effect thủ công cho toàn bộ property custom.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, custom, unity-to-cocos*

### disabledShaderPasses của URP không có tương ứng bên Cocos

Unity URP cho phép tắt từng pass theo tên (ví dụ MOTIONVECTORS, ShadowCaster) qua mảng disabledShaderPasses trong .mat. Cocos không có khái niệm pass riêng theo tên — technique định nghĩa sẵn tập pass. Mảng này luôn phải bỏ và ghi info vào warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, urp, pass, unity-to-cocos*

### Material procedural hoàn toàn (không texture) vẫn cần .mtl hợp lệ

Khi tất cả m_TexEnvs đều trỏ fileID:0, material là procedural (chỉ dùng màu + shader toán học). File .mtl vẫn phải có _effectAsset và _props hợp lệ; không sinh mainTexture nếu không có texture gốc. Ghi info vào warnings để người dùng biết đây là material không texture.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, procedural, texture, unity-to-cocos*

### Phân biệt property thật của shader hiện tại với property tồn dư từ shader cũ

File .mat chứa toàn bộ property từng được khai báo trong mọi shader mà material từng gán qua (tồn dư). Khi thấy tập Float/Color chứa cả property URP/Lit (_WorkflowMode, _Metallic, _Smoothness, _Glossiness...) lẫn property shader hiện tại (_Wobble, _Fill), phải liệt kê rõ ràng: property nào chắc chắn thuộc shader hiện tại, property nào có thể là tồn dư. Không map mù property tồn dư vào Cocos; ghi warning để người dùng xác nhận trong Unity.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, property, stale, unity-to-cocos*

### Custom shader trong Unity .mat — toàn bộ property đặc thù của shader đó cần warning riêng

Khi Unity .mat dùng custom shader (GUID không phải built-in 0000000000000000f…), không cố map từng property tuỳ biến vào built-in Cocos effect. Thay vào đó: (1) chọn built-in effect gần nhất (builtin-unlit cho sprite UI/2D không chiếu sáng), (2) map texture chính + màu chính nếu có, (3) liệt kê TẤT CẢ property bị mất trong warnings kèm giá trị gốc để người dùng có đủ dữ liệu viết custom Cocos effect.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, custom-effect*

### GUID texture không có trong bảng ánh xạ project → error, không im lặng bỏ

Nếu material Unity tham chiếu texture với GUID không xuất hiện trong bảng GUID→asset của project, phải ghi error (không warning) vì không thể sinh UUID hợp lệ. Ghi rõ GUID gốc và tên property để người dùng tự tra asset trong Unity.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, texture, guid-resolve*

### Mâu thuẫn blend state vs alpha trong .mat là dấu hiệu của property tồn dư

Khi _SrcBlend/_DstBlend nói opaque nhưng _Alpha < 1.0 hoặc render queue nằm trong vùng AlphaTest/Transparent, đó là dấu hiệu material từng đổi shader — property blend là rác của shader cũ không được dọn. Phải nêu warning yêu cầu người dùng kiểm tra trong Unity thay vì im lặng chọn một bên.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend-state, remnant-property*

### Material additive Unity thường dùng shader built-in Particles/Additive

Material trong thư mục 'FX' với tên 'Add' và shader built-in (guid 0...f0, fileID 107xx) gần như chắc chắn là Particles/Additive. Tương ứng Cocos là builtin-particle, không phải builtin-sprite. Blend state trong m_Floats (_SrcBlend/_DstBlend) có thể là tồn dư URP Lit, không phải blend state thực của shader.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, additive, shader-identification, unity-builtin*

### URP Lit tồn dư trong material dùng shader built-in là dấu hiệu material từng bị đổi shader

Khi .mat có shader built-in (guid 0...f0) nhưng m_SavedProperties chứa nguyên bộ URP Lit (_Surface, _Blend, _WorkflowMode, _Metallic, _Smoothness...), đó là tồn dư từ lần gán shader URP Lit trước đó. Không map các property này; chỉ chuyển property chung (_Color, _MainTex) mà shader hiện tại thực sự dùng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, urp-lit, remnant-properties, unity*

### Material FX/Additive không texture là bình thường

Material additive dùng cho hiệu ứng glow/highlight/FX thường chỉ cần màu (tint), không cần texture. Toàn bộ m_TexEnvs fileID=0 là đúng với ý đồ thiết kế, không phải thiếu asset. Chỉ sinh _props với mainColor, không cần mainTexture.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, additive, texture, fx*

### Custom Unity shader → builtin-sprite fallback pattern

When material uses a custom .shader (non-builtin GUID), map only the core color+texture pair to builtin-sprite: _Color → mainColor (multiply by 255), first non-empty texture sampler → mainTexture (@6c48a). Categorize all custom properties in warnings by purpose (liquid effects, edge/outline, matcap, color layers, URP residual) rather than a flat list. Always flag _effectAsset UUID as TODO — do not fabricate builtin effect UUIDs.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, custom-shader, fallback, builtin-sprite*

### Matcap material detection pattern

A material with a _Matcap texture uniform plus a separate albedo/color texture (here _Texture2D) uses matcap rendering — a reflection-mapping technique with no Cocos builtin equivalent. Flag the matcap texture as dropped and note that the material appearance will change significantly (no reflections, no rim lighting).

*Xác nhận 1 lần · độ tin cậy: high · tag: material, matcap, custom-shader*

### Conflicting blend state + render queue = residual shader data

When _SrcBlend/DstBlend, m_CustomRenderQueue, and _Alpha disagree (e.g., additive blend + transparent queue + fractional alpha), the blend properties are almost certainly residual from a previous shader assignment. Flag the conflict in warnings but do not attempt to resolve it — use the render queue (or material name semantics) to decide technique, and note that the user should verify the intended blend mode in Unity.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend-state, residual, urp*

### Non-standard texture sampler name mapping

Custom shaders may use non-standard sampler names (e.g., _Texture2D instead of _MainTex). The _MainTex slot is often empty in such materials. Map the first non-empty, non-lightmap, non-matcap texture to mainTexture in Cocos, and explicitly note the remapping in warnings so the user can verify.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, texture, sampler, custom-shader*

### URP property bloat in m_SavedProperties

Custom shaders built on URP templates inherit URP boilerplate properties (_Surface, _WorkflowMode, _Blend, _QueueControl, _Metallic, _Smoothness, _BaseColor, _EmissionColor, etc.) even when the shader doesn't use them. Group these as 'Residual URP properties discarded' in warnings — do not enumerate them individually in the main warnings array unless there are fewer than 10.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, urp, saved-properties, residual*

### Non-material metadata in .mat always dropped

Every .mat file may contain MonoBehaviour blocks, disabledShaderPasses, m_LightmapFlags, m_EnableInstancingVariants, m_DoubleSidedGI, m_CustomRenderQueue, and stringTagMap. All are editor-only or renderer metadata with no Cocos equivalent — always drop and list in a single 'info' warning.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, metadata, editor*

### Material dùng custom shader Unity cần custom effect Cocos

Khi Unity .mat tham chiếu shader project (guid không phải 0000000000000000f000000000000000), không thể map sang effect dựng sẵn của Cocos (builtin-sprite, builtin-unlit). Phải xuất ra file .mtl với _effectAsset trỏ đến builtin-sprite làm placeholder, ghi error vào warnings yêu cầu viết custom .effect file, và liệt kê toàn bộ property của shader gốc (tên + giá trị) để người viết shader có đủ dữ liệu tái tạo.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, custom-effect*

### Phân biệt property có hiệu lực và property tồn dư trong m_SavedProperties

m_SavedProperties của Unity .mat chứa hợp của mọi property từ mọi shader mà material từng dùng. Để phân biệt: (a) property của URP/Lit template (_BaseColor, _BaseMap, _WorkflowMode, _Surface, _Metallic, _Smoothness, _BumpMap, _EmissionColor, _OcclusionMap, _SpecColor, _Cutoff, _Cull, _ZWrite, _SrcBlend, _DstBlend...) nếu đi kèm với các property mang tên đặc thù game (_Fill, _Wobble, _Dissolve, _RippleAmount, _VoronoiSpeed, _NoiseScale...) thì các property URP/Lit là tồn dư — shader thực tế là custom và không dùng chúng; (b) property có tên trùng lặp/cận lặp (_EdgeWidth và _Edgewidth) là artifact của quá trình phát triển shader, chỉ một bản có hiệu lực.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, saved-properties, artifact*

### Blend state mâu thuẫn là dấu hiệu property tồn dư

Khi _SrcBlend/_DstBlend là opaque (1,0) nhưng _Alpha ≠ 1, m_CustomRenderQueue là Transparent (3000), hoặc tên material gợi ý transparency: đó là tồn dư từ shader cũ. Không im lặng chọn một bên — ghi warning nêu mâu thuẫn và giải thích lựa chọn technique (opaque/transparent) trong output.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend-state, artifact*

### Texture matcap là texture lighting giả, cần xử lý riêng

Texture tên _Matcap trong material Unity là texture ánh sáng giả (matcap/sphere mapping) — Cocos không có cơ chế tương đương tích hợp sẵn trong builtin-sprite/builtin-unlit. Không thể map sang uniform mặc định; phải ghi warning và liệt kê GUID texture đó để người dùng import riêng, đồng thời ghi chú rằng hiệu ứng matcap phải được tái tạo trong custom effect.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, matcap, texture*

### Unity Particles/Additive → Cocos builtin-particle technique 2

Material Unity dùng built-in shader Particles/Additive (tên chứa 'Add', thư mục FX/VFX) chuyển thành file .mtl trỏ builtin-particle với _techIdx=2 (additive). _Color → mainColor (nhân 255). _MainTex → mainTexture (dùng sub-asset @6c48a nếu có texture).

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, particle, additive, fx*

### Tên material + đường dẫn là tín hiệu mạnh khi fileID không tra được

Khi fileID của built-in shader Unity không có bảng tra chính xác, dùng tên material (ví dụ 'Add' = additive, 'Multiply' = multiply) + đường dẫn thư mục (FX, VFX, Particles) để suy luận loại shader/blend mode, thay vì chỉ dựa vào m_SavedProperties (vốn chứa rác từ shader cũ). Ghi warning yêu cầu người dùng xác nhận trong Unity.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, shader-identification, heuristic*

### Blend state trong m_SavedProperties của .mat built-in có thể là tồn dư

_SrcBlend/_DstBlend trong m_SavedProperties của material dùng built-in shader có thể là di sản từ shader trước (thường URP Lit), không phản ánh blend mode hiện tại. Khi giá trị mâu thuẫn với tên material (ví dụ DstBlend=Zero trên material tên 'Add'), ưu tiên tên material để chọn technique Cocos, và ghi warning về mâu thuẫn này.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend-state, leftover-properties*

### Custom generated shaders in water-sort-style games are non-convertible

Shaders with properties like _Dissolve, _Wobble, _RippleAmount, _NoiseScale, _VoronoiSpeed, _OutlineThickness, _Fill, and _Matcap are custom liquid/particle shader graphs (typically Shader Graph or Amplify Shader Editor output). Cocos builtin effects (builtin-unlit, builtin-sprite, builtin-standard) cannot replicate these — a custom Cocos .effect file with equivalent GLSL must be authored. Map only the base color + main texture to a builtin effect as a degraded visual placeholder.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, liquid-effects, custom-shader*

### Non-_MainTex texture can serve as mainTexture when _MainTex is empty

If a Unity material's _MainTex slot is empty (fileID: 0) but another texture property (_Texture2D, _BaseMap, _Albedo) has a non-empty reference, map that alternative texture to mainTexture in Cocos. This commonly occurs with custom generated shaders that use non-standard property names for the primary texture.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, texture, maintexture, _maintex*

### Blend-mode signals in custom-shader materials are unreliable

When a material uses a custom shader (not a built-in), its _SrcBlend/_DstBlend may be stale residuals from a previous shader (e.g., URP/Lit). Cross-check against other signals: the material name, alpha values in _Color, the shader fileID+guid, and the set of property names. If signals conflict (e.g., opaque blend but dissolve shader), prefer the shader's semantic intent and set _techIdx accordingly, then warn the user to verify.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, blend-mode, custom-shader, _srcblend, _dstblend*

### Material metadata in URP/Lit leftovers covers more float/color entries than active properties

Custom generated shaders often carry residual URP floats (_Surface, _WorkflowMode, _Blend, _Cull, _Metallic, _Smoothness, _QueueControl, _QueueOffset, _BumpScale, _Parallax, _OcclusionStrength, _Cutoff) plus N colors with alpha=0 (unused gradient stops or effect parameters stored in color channels). These are always stale after the last shader change and must be listed in warnings rather than mapped to Cocos uniforms.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, urp, residual-properties, m_savedproperties*

### Material Unity Particles/Additive → Cocos builtin-particle.effect technique additive

Material Unity dùng built-in shader Particles/Additive (fileID 10720, guid 0000000000000000f000000000000000) thì bên Cocos dùng builtin-particle.effect với technique additive. Tên material chứa từ khoá 'Add' và vị trí trong thư mục 'FX' là hai tín hiệu mạnh xác nhận blend mode additive, mạnh hơn giá trị _SrcBlend/_DstBlend trong m_Floats (thường là property tồn dư từ shader URP trước đó).

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, shader, blend, particle*

### Property thừa từ shader cũ trong m_Floats/m_Colors của .mat

Khi material Unity có shader built-in (guid 0000000000000000f000000000000000) nhưng m_SavedProperties chứa cả bộ property của URP/Lit (_Surface, _WorkflowMode, _Blend, _Metallic, _Smoothness...) thì đó là rác — material đã từng được gán shader URP rồi đổi sang Legacy. Chỉ giữ property có ý nghĩa với shader hiện tại (_Color, _MainTex với Particles/Additive), phần còn lại bỏ và ghi warning.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, property, urp, legacy*

### Tên material và thư mục cha là tín hiệu mạnh hơn giá trị property blend

Khi có mâu thuẫn giữa tên material + đường dẫn thư mục (Add.mat trong FX/) với giá trị _SrcBlend/_DstBlend trong m_Floats, hãy ưu tiên tên + đường dẫn. _SrcBlend/_DstBlend trong m_SavedProperties là snapshot tích luỹ qua nhiều lần đổi shader, không nhất thiết phản ánh blend đang dùng.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, blend, heuristic*

### Material Unity tên 'Add' trong thư mục FX → builtin-particle.effect technique 2

Material Unity có tên chứa 'Add' hoặc nằm trong thư mục FX/Materials, dùng shader Particles/Additive (fileID 10720 trong unity_builtin_extra), nên map sang Cocos builtin-particle.effect (UUID d1346436-ac96-4271-b863-1f4fdead95b0) với _techIdx = 2 (kỹ thuật additive: Blend SrcAlpha One). Nếu cần One+One thực sự, phải tự viết effect riêng.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, shader, additive, particle, blending*

### FileID 10720 trong unity_builtin_extra = Particles/Additive

Trong built-in shader của Unity (guid 0000000000000000f000000000000000), fileID 10720 tương ứng với shader Particles/Additive. Nhận diện qua tên material (Add), thư mục (FX), và tập property có _Color + _MainTex + _BumpMap + _EmissionMap nhưng không có các property PBR nặng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader, fileid, builtin*

### _SrcBlend/_DstBlend trong SavedProperties của material đổi shader là rác

Khi material Unity từng được gán shader khác (URP Lit), _SrcBlend/_DstBlend trong m_Floats có thể giữ giá trị cũ (vd: 1/0 = One/Zero của chế độ Opaque URP), mâu thuẫn với tên material (Add → lẽ ra One/One). Đây là bằng chứng điển hình của property tồn dư — phải ưu tiên tên material + shader hiện tại (fileID) để suy luận blending, không dùng giá trị _SrcBlend/_DstBlend thô.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, stale-properties, blending, urp*

### Custom Shader Graph material → builtin-unlit fallback

Khi Unity material dùng custom Shader Graph (GUID project thật, không phải 0000000000000000f000000000000000), không thể chuyển sang Cocos built-in effect một cách trung thực. Dùng builtin-unlit làm fallback: techIdx=0 cho opaque (render queue < 2500), techIdx=1 cho transparent (render queue ≥ 2500). Map _Color→mainColor, texture không rỗng đầu tiên trong m_TexEnvs→mainTexture. Tất cả hiệu ứng shader custom (dissolve, ripple, outline, matcap, wobble, voronoi) phải liệt kê đầy đủ trong warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, shader-graph, custom-shader, fallback*

### Phát hiện main texture trong Shader Graph qua tên property không chuẩn

Custom Shader Graph có thể dùng tên property không chuẩn cho main texture (vd _Texture2D thay vì _MainTex). Khi _MainTex trống (fileID:0) nhưng có texture khác không rỗng trong m_TexEnvs, map texture đó vào mainTexture của builtin-unlit. Ưu tiên texture có tên gần nghĩa 'main' nhất; nếu không rõ, chọn texture đầu tiên có fileID != 0 rồi ghi warning.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, texture, shader-graph, property-naming*

### Màu alpha=0 trong m_Colors là màu không dùng đến, phải nhận diện và bỏ qua

Shader Graph thường khai báo nhiều color property với giá trị alpha=0 để làm placeholder hoặc toggle off. Khi convert, chỉ map màu có alpha > 0 (thực sự dùng). Màu alpha=0 liệt kê trong warnings nhưng không map — tránh làm bẩn _props của Cocos material.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, color, shader-graph, dead-property*

### _Alpha float tách biệt với _Color.a trong Shader Graph

Trong Shader Graph, _Alpha (float) có thể là property riêng điều khiển độ trong suốt toàn cục, độc lập với alpha của _Color. Không được nhập _Alpha vào mainColor.a vì khác semantics. Khi gặp _Alpha khác 1, ghi warning yêu cầu người dùng chỉnh opacity của node trong Cocos (Sprite._color.a hoặc MeshRenderer material mainColor.a) thay vì cố gán sai.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, alpha, shader-graph*

## Prefab

### Prefab Unity chỉ gồm PrefabInstance thì không có cây node để convert

Nếu file .prefab của Unity chỉ chứa document !u!1001 (PrefabInstance) + các document 'stripped', thì file đó KHÔNG chứa GameObject/Transform thật. Chỉ tái tạo được những gì nằm trong m_AddedGameObjects / m_AddedComponents; phần còn lại bắt buộc phải convert từ prefab nguồn (m_SourcePrefab.guid) rồi ghép vào. Phải báo rõ điều này ở mức error thay vì xuất một prefab trông 'đủ'.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, nested-prefab, yaml*

### Document 'stripped' không phải node

Document Unity có hậu tố 'stripped' kèm m_CorrespondingSourceObject + m_PrefabInstance chỉ là con trỏ vào object bên trong prefab nguồn. Không sinh cc.Node cho chúng, trừ khi chúng là m_GameObject của một component được thêm mới ở cấp instance — khi đó tạo node placeholder mang đúng tên/transform lấy từ m_Modifications.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, stripped, node-mapping*

### m_Modifications chỉ giải được khi có prefab nguồn

Mỗi entry trong m_Modifications trỏ tới fileID của prefab NGUỒN, không phải fileID trong file hiện tại. Không có file nguồn thì override (vị trí, m_IsActive, m_Name, tham chiếu object) không ánh xạ được sang __id__ nào — hãy liệt kê nguyên văn (fileID + propertyPath + value) vào warnings để người dùng áp lại tay, đừng đoán node.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, overrides*

### Không bịa __type__ cho MonoBehaviour chưa biết class

Khi script guid của MonoBehaviour không giải được ra tên class, TUYỆT ĐỐI không sinh component với __type__ tự đặt: Cocos sẽ báo lỗi import hoặc âm thầm bỏ. Bỏ component đó khỏi mảng, và ghi vào warnings toàn bộ tên field + giá trị đã serialize để người dùng gắn lại tay.

*Xác nhận 1 lần · độ tin cậy: high · tag: monobehaviour, script, import-safety, prefab*

### UnityEngine.Animation → cc.Animation nhưng clip thì không

Component map được 1-1 (m_PlayAutomatically → playOnLoad, m_Animations → _clips), nhưng AnimationClip của Unity không có đường chuyển sang .anim của Cocos. Xuất cc.Animation với _clips: [] và _defaultClip: null (không bao giờ dùng {"__uuid__": ""}), rồi cảnh báo rằng playOnLoad = true với _clips rỗng nghĩa là không có gì chạy.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, clip, prefab*

### Collider 3D của Unity map sang collider 3D cùng tên của Cocos

UnityEngine.SphereCollider → cc.SphereCollider (_radius, _center: cc.Vec3 đảo dấu z, m_IsTrigger → _isTrigger, m_Material → _material). Giữ nguyên số đo (cả hai engine đều nhân scale của node). Luôn kèm cảnh báo rằng module Physics 3D phải được bật, vì nhiều project chỉ dùng raycast/AABB tự cài.

*Xác nhận 1 lần · độ tin cậy: medium · tag: physics, collider, prefab*

### Bố cục mảng tối thiểu vẫn phải đủ PrefabInfo cho mọi node

Kể cả prefab khung chỉ có 2 node, mỗi cc.Node vẫn cần một cc.PrefabInfo riêng (root luôn trỏ về node gốc __id__ 1, asset trỏ về __id__ 0) và mỗi component cần một cc.CompPrefabInfo với fileId 22 ký tự. Thiếu chúng thì prefab mở được nhưng override trên instance không lưu được.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, prefabinfo*

### Prefab Unity chỉ gồm PrefabInstance thì không flatten được nếu thiếu prefab nguồn

Khi file .prefab của Unity chỉ chứa các document `!u!1001 PrefabInstance` (variant / prefab lồng) và YAML của prefab nguồn không được cung cấp, KHÔNG thể inline nội dung. Chỉ dựng được: node root của instance (áp m_Modifications lên transform của nó), các node/component trong `m_AddedGameObjects` và `m_AddedComponents`. Mọi override trỏ vào fileID thuộc prefab nguồn phải được liệt kê nguyên văn trong warnings để người dùng áp lại bằng tay.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, nested-prefab, variant, flatten*

### Document `stripped` chỉ là con trỏ, không phải node thật

Các document Unity có hậu tố `stripped` (GameObject/Transform/MeshRenderer với m_CorrespondingSourceObject + m_PrefabInstance) KHÔNG phải node độc lập — chúng chỉ là handle để các document khác trỏ tới object nằm trong prefab nguồn. Parser cây hay hiểu nhầm chúng là root node rỗng. Bỏ chúng khi dựng cây Cocos; chỉ dùng chúng để giải nghĩa `objectReference` trong m_Modifications (fileID stripped → fileID nguồn → node nào trong prefab con).

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, stripped, yaml, parsing*

### Không bịa __type__ cho MonoBehaviour chưa ánh xạ được

MonoBehaviour có script GUID không nằm trong bảng GUID→asset thì BỎ hẳn component, không sinh `__type__` đoán mò (uuid script sai làm Cocos báo lỗi import và hỏng cả prefab). Ghi vào warnings: guid script, node chứa nó, và toàn bộ cặp field/value đã serialize để người dùng gắn lại qua Inspector.

*Xác nhận 1 lần · độ tin cậy: high · tag: monobehaviour, script, warnings, prefab*

### Tham chiếu asset chưa xác thực thì để null, không suy uuid từ guid

Quy tắc GUID→UUID (chèn gạch 8-4-4-4-12) là tất định nhưng chỉ an toàn khi asset đích chắc chắn tồn tại trong project Cocos. Với guid không có trong bảng ánh xạ, để `null` / mảng rỗng và ghi uuid suy ra vào warnings; uuid treo gây lỗi import chứ không chỉ là ô trống trong Inspector.

*Xác nhận 1 lần · độ tin cậy: high · tag: uuid, guid, asset-reference, prefab*

### Mỗi node trong .prefab Cocos cần cc.PrefabInfo riêng, mỗi component cần cc.CompPrefabInfo

Không chỉ node gốc: MỌI node trong file .prefab đều phải có `_prefab` trỏ tới một `cc.PrefabInfo` riêng (root:{__id__ của node gốc}, asset:{__id__:0}, fileId 22 ký tự base64 duy nhất trong file, instance:null, targetOverrides:null). Chỉ PrefabInfo của node gốc mới có thêm `nestedPrefabInstanceRoots`. Mỗi component có `__prefab` trỏ tới một `cc.CompPrefabInfo` riêng. Thiếu chúng thì prefab mở được nhưng chỉnh sửa trên instance không lưu được.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, prefabinfo, compprefabinfo, fileid*

### Collider 3D Unity → Cocos giữ nguyên đơn vị, không nhân pixelsPerUnit

Quy tắc nhân `pixelsPerUnit` chỉ áp dụng cho nội dung 2D/SpriteRenderer. Với collider 3D (SphereCollider/BoxCollider/CapsuleCollider) và node 3D world, giữ nguyên giá trị: UnityEngine.SphereCollider → cc.SphereCollider {_center, _radius, _isTrigger→_sensor không tồn tại — dùng `_isTrigger`, _material:null}. Ghi warning rằng collider chỉ hoạt động khi module Physics được bật và không có RigidBody nghĩa là static body.

*Xác nhận 1 lần · độ tin cậy: medium · tag: physics, collider, 3d, units, prefab*

### Unity Animation (legacy) → cc.Animation: chỉ map được clip list và playOnLoad

UnityEngine.Animation → cc.Animation với `_clips` = m_Animations, `playOnLoad` = m_PlayAutomatically, `_defaultClip` = m_Animation. Các field m_WrapMode / m_CullingType / m_UpdateMode / m_AnimatePhysics KHÔNG có tương ứng ở cấp component trong Cocos (wrapMode thuộc về AnimationClip/AnimationState) — luôn ghi vào warnings thay vì im lặng bỏ.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, component-mapping, prefab*

### Chọn _layer theo ngữ cảnh 3D/UI, không mặc định UI_2D

Chỉ node nằm trong nhánh Canvas mới dùng `_layer: 33554432` + bắt buộc cc.UITransform. Prefab 3D (mesh, collider 3D, world position tính bằng unit) dùng `_layer: 1073741824` (DEFAULT) và KHÔNG được thêm cc.UITransform — thêm UITransform vào node 3D là sai ngữ nghĩa. Nhận diện bằng sự có mặt của RectTransform: có RectTransform → UI, chỉ có Transform → world.

*Xác nhận 1 lần · độ tin cậy: high · tag: layer, ui, 3d, prefab*

### Prefab Unity chi gom PrefabInstance thi khong the convert day du

Neu file .prefab Unity chi chua document PrefabInstance (!u!1001) va cac document 'stripped' (GameObject/Transform co m_CorrespondingSourceObject), thi noi dung that nam o prefab nguon theo GUID. Khong co file nguon thi khong the lam phang: chi dung duoc node goc + phan m_AddedGameObjects/m_AddedComponents, con lai phai bao error trong warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, nested-prefab, flatten*

### m_Modifications tro vao node cua prefab nguon phai bao la override chua ap dung

Moi entry trong m_Modifications co target.guid khac guid cua chinh file dang convert deu tro toi mot fileID ben trong prefab nguon. Khi prefab nguon chua duoc inline, tuyet doi khong tao node gia de 'chua' override do; hay liet ke nguyen van (fileID, propertyPath, value, da doi dau Z hay chua) vao warnings de nguoi dung gan lai.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, override, warnings*

### objectReference tro vao prefab long khong the thanh __id__

Override kieu tham chieu (objectReference khac fileID 0) chi map duoc sang {"__id__": n} khi doi tuong dich thuc su nam trong mang JSON dang sinh. Neu dich la doi tuong stripped cua prefab long chua inline, phai de null va ghi ro ten field + dich bi mat trong warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: references, prefab, warnings*

### GameObject 'stripped' khong phai node goc

Cac document GameObject/Transform co hau to 'stripped' chi la handle tro vao prefab nguon. Bo phan tich cay co the liet ke chung nhu 'roots' vi chung khong co cha trong file; dung tao node Cocos rieng cho chung — kiem tra m_CorrespondingSourceObject/m_PrefabInstance truoc khi dung cay da phan tich.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab, parsing, stripped*

### MonoBehaviour khong anh xa duoc thi bo, khong bia class

Khi script GUID khong co trong bang anh xa asset, tuyet doi khong sinh component voi __type__ la ten class hay uuid tu bia (prefab se hong hoac mat tham chieu am tham). Bo component, va chep nguyen cac field da serialize (ten + gia tri) vao warnings de gan lai tay.

*Xác nhận 1 lần · độ tin cậy: high · tag: monobehaviour, script, warnings, prefab*

### Unity legacy Animation -> cc.Animation, clip khong chuyen duoc

m_Animations -> _clips, m_PlayAutomatically -> playOnLoad, va _defaultClip = null. File .anim cua Unity khong co bo chuyen sang cc.AnimationClip, nen de _clips: [] thay vi tro toi mot uuid suy dien khong ton tai (tham chieu gay se hong khi import). m_WrapMode/m_CullingType/m_UpdateMode khong co tuong ung.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, assets, prefab*

### Prefab 3D: layer DEFAULT, khong UITransform

Khi prefab chua BoxCollider/MeshRenderer/toa do world (khong nam duoi Canvas), dung _layer = 1073741824 (DEFAULT), khong sinh cc.UITransform va khong nhan pixelsPerUnit. Quy tac 'moi node UI phai co UITransform va layer 33554432' chi ap dung cho nhanh Canvas.

*Xác nhận 1 lần · độ tin cậy: high · tag: layer, 3d, uitransform, prefab*

### Unity BoxCollider -> cc.BoxCollider giu nguyen kich thuoc

m_Size cua Unity la kich thuoc day du va _size cua cc.BoxCollider cung la kich thuoc day du -> copy 1-1 (khong chia doi); m_Center -> _center (doi dau Z); m_IsTrigger -> _isTrigger. Nho canh bao rang collider khong kem RigidBody la static va Cocos phai bat module Physics.

*Xác nhận 1 lần · độ tin cậy: medium · tag: physics, collider, 3d, prefab*

### So luong phan tu mang toi thieu cho prefab hop le

Moi prefab Cocos can: [0] cc.Prefab tro data -> node goc, node goc co _parent = null va _prefab -> mot cc.PrefabInfo (root tro chinh node goc, asset tro __id__ 0), moi node con cung co cc.PrefabInfo rieng (root van tro node goc), va moi component co dung mot cc.CompPrefabInfo voi fileId 22 ky tu base64 duy nhat. Thieu CompPrefabInfo thi prefab mo duoc nhung khong luu duoc chinh sua tren instance.

*Xác nhận 1 lần · độ tin cậy: high · tag: prefab-info, serialization, prefab*

### cc.Animation clip list must stay empty for unconvertible Unity clips

Unity .anim (legacy Animation clip) và Cocos .anim là định dạng khác biệt hoàn toàn dù trùng đuôi file. Khi gặp UnityEngine.Animation với m_Animations chứa clip Unity, luôn xuất _clips: [] và _defaultClip: null, không bao giờ cố suy UUID rồi tham chiếu chéo — tham chiếu treo gây lỗi import. Ghi rõ tên + guid từng clip bị bỏ vào warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, clip, incompatible-format, prefab*

### cc.MeshRenderer API surface is narrower than Unity MeshRenderer

cc.MeshRenderer chỉ expose: mesh, receiveShadow/receiveShadowForInspector, shadowCastingMode/shadowCastingModeForInspector, shadowBias, shadowNormalBias, enableMorph, isGlobalStandardSkinObject. KHÔNG có thuộc tính materials ở cấp component — material gán qua mesh sub-asset hoặc chỉnh trong Inspector. m_CastShadows (boolean Unity) → shadowCastingMode (float Cocos, 0=OFF 1=ON). m_ReceiveShadows → receiveShadow + receiveShadowForInspector. Mọi field lighting probe, lightmap, sorting layer, batch info của Unity MeshRenderer đều vô nghĩa với Cocos và bị drop.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, 3d, shadows, api-surface, prefab*

### Unity material (.mat) không thể chuyển sang Cocos material tự động

Unity .mat chứa shader reference + property block dành riêng cho Unity render pipeline. Không có đường convert tự động sang Cocos Material asset. Khi MeshRenderer trỏ tới .mat, ghi guid + tên file vào warnings, để mesh=null, và người dùng phải gán material Cocos + mesh từ FBX sub-asset bằng tay qua Inspector.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, 3d, fbx, incompatible-format, prefab*

### MeshRenderer trong Cocos không tuần tự hoá materials

cc.MeshRenderer trong Cocos Creator 3.8 không có thuộc tính `_materials` trong schema serialization của prefab. Material của model 3D được quản lý qua pipeline import (FBX/GLB) hoặc set programmatically tại runtime. Khi chuyển từ Unity, luôn cảnh báo rằng material cần gán tay sau khi import model.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, material, 3d, fbx, prefab*

### Unity AnimationClip .anim không chuyển được sang Cocos

File .anim của Unity (legacy Animation clip) và Cocos AnimationClip (.anim/.animation) là hai định dạng hoàn toàn khác nhau, không có bridge chuyển đổi. Luôn xuất cc.Animation với clips=[] rỗng và cảnh báo người dùng phải tạo lại animation trong Cocos Creator. Không được thử nhồi UUID của file .anim Unity vào mảng clips vì Cocos sẽ báo lỗi import.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animationclip, anim, prefab*

### Mesh từ FBX cần sub-asset reference chính xác

Khi Unity MeshRenderer ánh xạ sang cc.MeshRenderer, mesh không thể suy từ GUID của file FBX gốc một cách đơn giản. Cocos import FBX sẽ sinh nhiều Mesh sub-asset (mỗi sub-mesh một asset riêng, UUID dạng <uuid-gốc>@XXXXX). Không biết chính xác sub-asset nào thì để mesh=null và cảnh báo — gán UUID sai sub-asset gây lỗi import tệ hơn là để trống.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, mesh, fbx, sub-asset, prefab*

### MeshRenderer Unity → Cocos: chỉ giữ được shadow và mesh

Trong số toàn bộ property của Unity MeshRenderer, chỉ `mesh`, `receiveShadow` (= m_ReceiveShadows), và `shadowCastingMode` (= m_CastShadows) có tương ứng trực tiếp trong cc.MeshRenderer. Tất cả các thiết lập GI, light probe, reflection probe, lightmap, rendering layer mask, motion vectors, ray tracing đều không có Cocos equivalent — luôn ghi gộp 1 warning thay vì liệt kê từng field.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, shadow, gi, lighting, prefab*

### Unity Animation (legacy) clip list: để trống, không suy UUID

m_Animations của UnityEngine.Animation là danh sách AnimationClip Unity, không có ánh xạ tự động sang cc.AnimationClip của Cocos. Luôn xuất _clips: [] và _defaultClip: null, kèm theo error-level warning liệt kê guid + path của từng clip bị bỏ. Giải thích rằng người dùng phải tạo lại clip bằng Cocos Animation Editor và gán tay vào _clips.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animation-clip, lossy, prefab*

### Unity Animation non-mappable fields luôn vào warnings

m_WrapMode, m_AnimatePhysics, m_UpdateMode, m_CullingType của UnityEngine.Animation không có property tương ứng ở cấp cc.Animation component. WrapMode trong Cocos thuộc về AnimationClip/AnimationState chứ không phải component. Luôn liệt kê nguyên văn giá trị vào warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, wrapmode, culling, prefab*

### MeshRenderer materials có thể không xuất hiện trong MCP API listing

MCP API listing cho cc.MeshRenderer chỉ hiện các property khai báo trực tiếp trên class đó, không liệt kê property kế thừa từ ModelRenderer (như materials, shadowCastingMode). Vẫn có thể map m_CastShadows → _shadowCastingModeForInspector và m_ReceiveShadows → _receiveShadowForInspector qua API, nhưng tham chiếu material từ m_Materials cần cảnh báo rằng có thể phải gán tay qua Inspector.

*Xác nhận 1 lần · độ tin cậy: medium · tag: mesh-renderer, materials, mcp-api, prefab*

### MeshRenderer lightmapping/raytracing → bỏ toàn bộ, ghi info

Các field m_LightProbeUsage, m_ReflectionProbeUsage, m_RayTracingMode, m_StaticBatchInfo, m_ScaleInLightmap, m_ReceiveGI, m_PreserveUVs, m_LightmapParameters, m_SortingLayerID, m_SortingLayer, m_AdditionalVertexStreams của Unity MeshRenderer không có tương ứng trong Cocos. Luôn ghi một warning mức info gộp chung cho tất cả MeshRenderer có các field này thay vì lặp lại từng field.

*Xác nhận 1 lần · độ tin cậy: high · tag: mesh-renderer, lightmapping, raytracing, info-only, prefab*

### cc.Animation với m_Animation = {fileID: 0} thì _defaultClip = null

Khi Unity Animation có m_Animation trỏ về {fileID: 0} (tức không có default clip), gán _defaultClip: null (JSON null, KHÔNG phải {"__uuid__":""}). Mảng _clips luôn là [] vì AnimationClip Unity không chuyển được sang .anim Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, default-clip, null-handling, prefab*

### MeshRenderer material từ FBX: không set trực tiếp qua API component

Khi MeshRenderer thuộc về node con của một model FBX, material của Unity (m_Materials) được gán qua pipeline import FBX của Cocos chứ không qua thuộc tính component riêng lẻ. Chỉ map các thuộc tính shadow (shadowCastingModeForInspector, receiveShadowForInspector) từ API đã xác nhận. Các field lighting/lightmap của Unity (m_LightProbeUsage, m_ReflectionProbeUsage, m_ScaleInLightmap...) không có tương ứng — bỏ và ghi warnings.

*Xác nhận 1 lần · độ tin cậy: medium · tag: meshrenderer, fbx, material, shadow, prefab*

### UnityEngine.Animation clip list luôn để rỗng khi convert

UnityEngine.Animation → cc.Animation: _clips luôn để [], _defaultClip luôn để null, vì AnimationClip của Unity (.anim) không có đường chuyển đổi sang định dạng AnimationClip của Cocos. Tham chiếu clip gốc được ghi vào warnings kèm GUID để người dùng tạo lại bằng tay. Không dùng {"__uuid__": ""} cho defaultClip.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animationclip, serialization, prefab*

### MeshRenderer từ Unity: shadow flags → Cocos inspector booleans

Unity m_CastShadows (int: 0/1/2) → Cocos shadowCastingModeForInspector (boolean: false/true khi 1) + shadowCastingMode (Float: 0=OFF, 1=ON). Unity m_ReceiveShadows (0/1) → Cocos receiveShadowForInspector (boolean) + receiveShadow (Float). Hai cặp boolean+Float này phải đồng bộ — boolean điều khiển checkbox Inspector, Float là giá trị thực.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, shadow, 3d, prefab*

### MeshRenderer.mesh từ FBX không tự động phân giải được

Khi MeshRenderer nằm trong nhánh node sinh ra từ FBX import, mesh thật nằm ở sub-asset của file FBX và không thể tự động xác định mesh nào ứng với MeshRenderer nào chỉ từ dữ liệu prefab Unity. Luôn để mesh=null và ghi cảnh báo yêu cầu người dùng gán mesh bằng tay trong Inspector Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, fbx, mesh, 3d, prefab*

### Material reference trong MeshRenderer dùng UUID từ GUID với __expectedType__ cc.Material

m_Materials của Unity MeshRenderer chứa {fileID, guid, type}. Khi GUID có trong bảng ánh xạ, chuyển GUID→UUID (chèn gạch 8-4-4-4-12) và đặt __expectedType__ là "cc.Material". Kết quả: mảng _materials chứa {"__uuid__":"<uuid>","__expectedType__":"cc.Material"}.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, material, uuid, reference, prefab*

### Unity MeshRenderer không mang tham chiếu mesh — cần gán thủ công sau FBX import

Ở Unity, mesh do MeshFilter giữ chứ không phải MeshRenderer. Khi convert, cc.MeshRenderer luôn có _mesh = null vì không biết sub-mesh nào trong FBX tương ứng. Sau khi import FBX vào Cocos, người dùng phải kéo sub-mesh vào Inspector cho từng MeshRenderer. Chỉ map được _materials (qua guid→uuid) và shadow properties.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, meshfilter, fbx, mesh, prefab*

### Unity m_CastShadows / m_ReceiveShadows → Cocos _shadowCastingMode / _receiveShadow

m_CastShadows (0=Off, 1=On) → _shadowCastingMode (cùng giá trị enum). m_ReceiveShadows (0/1) → _receiveShadow (float, 0.0 hoặc 1.0). Các field shadow khác của Unity (m_StaticShadowCaster, m_RayTracingMode, m_LightProbeUsage, v.v.) không có tương ứng và bỏ qua.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, shadow, lighting, prefab*

### Unity Animation (legacy) → cc.Animation: clip không chuyển được, luôn để _clips rỗng

UnityEngine.Animation map sang cc.Animation với playOnLoad = m_PlayAutomatically, nhưng AnimationClip (.anim) của Unity không có đường chuyển đổi tự động sang .anim của Cocos. Luôn xuất _clips: [] và _defaultClip: null, ghi rõ tên từng clip bị bỏ vào warnings để người dùng gán lại tay. Các field m_WrapMode / m_CullingType / m_UpdateMode / m_AnimatePhysics không có Cocos equivalent — luôn cảnh báo.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, unity-legacy-animation, prefab*

### MeshRenderer: mesh từ MeshFilter, material từ m_Materials

Unity MeshRenderer → cc.MeshRenderer: mesh đến từ MeshFilter (component riêng ở Unity, gộp vào MeshRenderer._mesh ở Cocos). Nếu không có dữ liệu MeshFilter trong input, để mesh = null và cảnh báo. m_Materials ánh xạ sang _materials của Cocos, dùng UUID suy từ guid (8-4-4-4-12) với __expectedType__: cc.Material. m_CastShadows → shadowCastingModeForInspector, m_ReceiveShadows → receiveShadowForInspector + receiveShadow. Toàn bộ field lightmapping/raytracing của Unity bị bỏ.

*Xác nhận 1 lần · độ tin cậy: high · tag: mesh-renderer, 3d, material-reference, prefab*

### MeshRenderer._materials dùng __expectedType__: cc.Material

Khi tham chiếu material trong _materials của cc.MeshRenderer (kế thừa từ ModelRenderer), dùng định dạng {"__uuid__": "<uuid>", "__expectedType__": "cc.Material"}. UUID suy từ Unity guid bằng cách chèn dấu gạch 8-4-4-4-12.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, mesh-renderer, reference-format, prefab*

### MeshRenderer ánh xạ shadow đơn giản, bỏ hàng loạt thuộc tính lighting

Unity MeshRenderer → cc.MeshRenderer: chỉ ánh xạ được m_CastShadows → shadowCastingModeForInspector+shadowCastingMode, m_ReceiveShadows → receiveShadowForInspector+receiveShadow, và m_Materials → _materials. Mesh phải lấy từ MeshFilter (không có trong dữ liệu thì để null). Hàng loạt thuộc tính lighting/lightmap/raytracing/sorting của Unity không có tương ứng — luôn liệt kê vào warnings thay vì im lặng bỏ.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, 3d, mapping, prefab*

### Unity .anim clip không chuyển đổi được sang Cocos .anim

UnityEngine.Animation → cc.Animation ánh xạ được component (m_PlayAutomatically → playOnLoad, m_Animations → _clips, m_Animation → _defaultClip), nhưng AnimationClip (.anim) của Unity có cấu trúc keyframe/curve khác hoàn toàn Cocos Creator. Dù GUID→UUID xác định được, clip tham chiếu trong _clips vẫn không có animation data hợp lệ — luôn cảnh báo rằng cần dựng lại clip bằng tay. Các field m_WrapMode, m_AnimatePhysics, m_UpdateMode, m_CullingType không có tương ứng ở cấp component Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animationclip, format-incompatibility, prefab*

### Unity Animation (legacy) chỉ map được component, không map được clip

UnityEngine.Animation → cc.Animation: _clips = [], _defaultClip = null, playOnLoad = m_PlayAutomatically. AnimationClip của Unity (.anim) KHÔNG có đường chuyển sang .anim của Cocos Creator — luôn để mảng rỗng và null, rồi cảnh báo người dùng tạo lại clip bằng tay. Các field m_WrapMode, m_UpdateMode, m_AnimatePhysics, m_CullingType không có tương ứng ở cấp component Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, component-mapping, prefab*

### MeshRenderer: mesh từ FBX không thể gán tự động

Khi MeshRenderer nằm trong prefab được tạo từ FBX, mesh tham chiếu tới sub-asset bên trong file FBX đã import. Không biết được chỉ số sub-asset (dạng <uuid>@xxxxx) nếu không parse file .meta của Cocos. Để mesh = null và cảnh báo người dùng gán lại bằng tay sau khi import FBX vào Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: mesh, fbx, sub-asset, prefab*

### MeshRenderer material reference từ GUID table

Material của Unity MeshRenderer tham chiếu qua {fileID, guid, type}. GUID có trong bảng ánh xạ → chuyển thành UUID (chèn gạch 8-4-4-4-12). Nhưng cc.MeshRenderer không hiển thị _materials trong API MCP (có thể là thuộc tính kế thừa từ ModelRenderer). Cảnh báo để người dùng gán material thủ công kèm UUID đã suy ra.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, meshrenderer, reference, prefab*

### Shadow properties của MeshRenderer map hạn chế

Unity MeshRenderer có ~25 thuộc tính shadow/lighting/baking. Cocos cc.MeshRenderer chỉ có: receiveShadow (float), shadowCastingMode (float), shadowBias, shadowNormalBias, và các cờ ForInspector. Chỉ map được receiveShadow và shadowCastingMode; phần còn lại bỏ và ghi vào warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: shadow, lighting, meshrenderer, prefab*

### MeshRenderer từ FBX: mesh luôn do importer gán, không tự điền trong prefab

Khi convert MeshRenderer của node đến từ FBX model, cc.MeshRenderer.mesh nên để null vì Cocos FBX importer sẽ tự liên kết mesh sub-asset từ model import. Không thể suy ra UUID sub-asset của mesh từ GUID FBX gốc.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, fbx, model, mesh, prefab*

### MeshRenderer.m_SortingOrder không có tương đương 3D trong Cocos

Unity MeshRenderer có m_SortingLayerID/m_SortingLayer/m_SortingOrder để điều khiển thứ tự render 3D. Cocos Creator 3.x không có cơ chế tương đương cho MeshRenderer — thứ tự render 3D phụ thuộc vào camera depth và khoảng cách z. Ghi vào warnings, không bịa thuộc tính.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, sortingorder, 3d, prefab*

### MeshRenderer có nhiều material: ánh xạ trực tiếp sang mảng _materials

Unity MeshRenderer.m_Materials (mảng fileID+guid) ánh xạ sang cc.MeshRenderer._materials (mảng UUID cc.Material). Mỗi phần tử giữ nguyên thứ tự. Nếu FBX có nhiều sub-mesh, mỗi sub-mesh nhận material tương ứng.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, materials, multi-material, prefab*

### Unity GI/lightmap/raytracing properties của MeshRenderer không có tương đương Cocos

Hàng loạt field của Unity MeshRenderer liên quan đến Global Illumination, lightmap, ray tracing, light probes, reflection probes, static batching không có khái niệm tương đương trong Cocos Creator. Luôn ghi gộp vào warnings thay vì liệt kê từng field riêng (quá dài và không có giá trị hành động).

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, gi, lightmap, raytracing, inapplicable, prefab*

### cc.MeshRenderer API không lộ _materials để serialize

API Cocos Creator 3.8 của cc.MeshRenderer (lấy qua MCP) không bao gồm _materials hay bất kỳ trường material nào. Với MeshRenderer, chỉ serialize được shadowCastingModeForInspector, receiveShadowForInspector, receiveShadow, mesh, shadowBias, shadowNormalBias. Mọi material từ Unity phải ghi vào warnings để người dùng gán lại qua Inspector.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, material, serialization, apigap, prefab*

### Unity Animation clip luôn không chuyển được

UnityEngine.Animation component map được sang cc.Animation (m_PlayAutomatically → playOnLoad) nhưng m_Animations (danh sách AnimationClip .anim) không bao giờ chuyển được sang Cocos AnimationClip — hai định dạng khác nhau hoàn toàn. Luôn xuất clips: [] và cảnh báo tên + GUID của từng clip bị mất.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animationclip, format-incompatible, prefab*

### MeshRenderer không có sorting layer trong Cocos 3D

Unity MeshRenderer có m_SortingLayerID/m_SortingLayer/m_SortingOrder để điều khiển thứ tự render 2D/UI, nhưng Cocos Creator không có khái niệm sorting layer cho renderer 3D. Thứ tự vẽ 3D trong Cocos được quyết định bởi camera depth và RenderQueue của material, không phải thuộc tính của renderer.

*Xác nhận 1 lần · độ tin cậy: medium · tag: meshrenderer, sorting-layer, 3drendering, prefab*

### MeshRenderer m_Materials → _materials với UUID từ GUID

Unity MeshRenderer.m_Materials (mảng Material guid) ánh xạ sang Cocos cc.MeshRenderer._materials (mảng UUID tham chiếu cc.Material). UUID suy từ GUID theo quy tắc chèn dấu gạch 8-4-4-4-12, miễn là guid có trong bảng ánh xạ và đích là loại material.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, material, guiduuid, prefab*

### Mesh từ FBX phải gán tay vào _mesh

Unity MeshRenderer tự động nhận mesh từ MeshFilter trên cùng GameObject. Cocos không có MeshFilter riêng — mesh phải gán trực tiếp vào cc.MeshRenderer._mesh. Khi mesh đến từ FBX (model), không thể tự động xác định sub-asset nào tương ứng → luôn để _mesh: null và cảnh báo.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, fbx, mesh, prefab*

### Các flag rendering Unity không có tương ứng Cocos

Unity MeshRenderer có nhiều flag rendering (CastShadows, ReceiveShadows, LightProbeUsage, ReflectionProbeUsage, MotionVectors, SortingLayer, StaticBatchInfo, Lightmap/GI, RayTracing) không có tương ứng trực tiếp trong cc.MeshRenderer. Cocos chỉ có shadowCastingMode + receiveShadow + shadowBias + shadowNormalBias. Các flag còn lại luôn bị mất khi convert.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, rendering, shadow, prefab*

### Unity Animation (legacy) clip luôn mất khi convert

Mỗi lần gặp UnityEngine.Animation với m_Animations khác rỗng, luôn xuất _clips: [] + _defaultClip: null và ghi error vào warnings, kèm tên clip + guid để người dùng tạo lại. Tuyệt đối không dùng {"__uuid__": ""} vì gây lỗi import. Các field m_WrapMode/m_UpdateMode/m_CullingType/m_AnimatePhysics không có tương ứng cấp component → luôn cảnh báo.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animationclip, convert, prefab*

### MeshRenderer: chỉ shadow map được, mesh + material do pipeline FBX quyết định

UnityEngine.MeshRenderer → cc.MeshRenderer. Chỉ 2 field map được: m_CastShadows (0/1/2) → shadowCastingModeForInspector (true khi ≠ 0), m_ReceiveShadows → receiveShadowForInspector. Mesh không serialize trực tiếp — Cocos tự gán từ asset FBX/glTF khi import model. Material cũng do pipeline model gán; nếu cần override material riêng, gán lại tay trong Inspector. Hàng chục field renderer khác (LightProbe, ReflectionProbe, RayTracing, MotionVectors, SortingLayer, Lightmap...) không có tương ứng và phải liệt kê vào warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, 3d, fbx, prefab*

### Animation clip Unity → Cocos: luôn _clips rỗng, cảnh báo từng clip mất

UnityEngine.Animation (legacy) → cc.Animation: playOnLoad = m_PlayAutomatically, _defaultClip = m_Animation (thường là null/fileID 0), _clips luôn là []. Mặc dù có thể ánh xạ GUID → UUID cho file .anim, nhưng định dạng AnimationClip của Unity và Cocos không tương thích — không có đường chuyển đổi tự động. Mỗi clip bị mất phải được ghi rõ vào warnings kèm path nguồn và GUID để người dùng tạo lại trong Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animationclip, prefab*

### Các field không map được của Animation legacy phải ghi warnings

UnityEngine.Animation có các field: m_WrapMode (wrap mode), m_CullingType (culling mode), m_UpdateMode (Normal/AnimatePhysics/UnscaledTime), m_AnimatePhysics. Không field nào có tương ứng ở cấp component cc.Animation của Cocos (wrapMode trong Cocos thuộc về AnimationState/AnimationClip, không phải component). Luôn liệt kê từng field + giá trị vào warnings, không im lặng bỏ.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, wrapmode, cullingtype, prefab*

### Unity Animation (legacy) → cc.Animation: clip không chuyển đổi được

UnityEngine.Animation map sang cc.Animation với playOnLoad = m_PlayAutomatically, nhưng AnimationClip (.anim) của Unity không tương thích với Cocos. Luôn xuất _clips: [] và _defaultClip: null, kèm warning liệt kê clip gốc (guid + UUID suy ra). Các field m_WrapMode, m_CullingType, m_UpdateMode, m_AnimatePhysics bị bỏ — wrapMode trong Cocos thuộc về AnimationState/AnimationClip, không phải component.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, unity-animation-legacy, prefab*

### MeshRenderer: mesh từ FBX cần gán thủ công

Unity tách mesh trong MeshFilter (component riêng), Cocos gộp vào MeshRenderer.mesh. Khi MeshRenderer nằm trong nhánh node import từ FBX, sub-mesh cụ thể (tên mesh bên trong FBX) không thể tự phân giải chỉ từ .prefab — phải gán thủ công bằng cách kéo mesh từ sub-asset của FBX đã import vào Inspector.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, fbx, mesh, prefab*

### MeshRenderer shadow → inspector booleans

Unity m_CastShadows (int 0/1) → Cocos shadowCastingModeForInspector (boolean); m_ReceiveShadows (int 0/1) → receiveShadowForInspector (boolean). Đây là cách đơn giản nhất để map shadow toggle từ Unity sang Cocos MeshRenderer.

*Xác nhận 1 lần · độ tin cậy: medium · tag: meshrenderer, shadow, prefab*

### Material GUID → UUID qua quy tắc 8-4-4-4-12

Material trong m_Materials của MeshRenderer Unity dùng GUID 32 hex. Chuyển sang Cocos bằng cách chèn dấu gạch 8-4-4-4-12 thành UUID, tham chiếu kiểu {"__uuid__":"...","__expectedType__":"cc.Material"}. Cần xác minh asset .mat đã được import vào Cocos dưới UUID tương ứng.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, guid-to-uuid, prefab*

### MeshRenderer: only shadow properties map cleanly

UnityEngine.MeshRenderer → cc.MeshRenderer: các thuộc tính ánh xạ được là shadowCastingModeForInspector (← m_CastShadows: 0/1), receiveShadowForInspector + receiveShadow (← m_ReceiveShadows: 0/1). Mesh lấy từ FBX import (sub-asset), cần gán tay. Material (.mat → .mtl) không tự chuyển được vì khác format — gán lại trong Inspector. Toàn bộ thuộc tính lighting/probe/raytracing/batching của Unity bỏ hết.

*Xác nhận 1 lần · độ tin cậy: high · tag: component, meshrenderer, 3d, shadow, prefab*

### Animation clip references map but content doesn't convert

UnityEngine.Animation → cc.Animation: _clips nhận danh sách clip từ m_Animations (guid → uuid), playOnLoad ← m_PlayAutomatically, _defaultClip ← m_Animation. Nhưng AnimationClip của Unity (.anim) và Cocos (.anim) khác định dạng hoàn toàn — clip xuất hiện trong Inspector nhưng không có dữ liệu curve. Luôn kèm warning yêu cầu recreate animation. Các field m_WrapMode / m_CullingType / m_UpdateMode / m_AnimatePhysics không có tương ứng ở cấp component.

*Xác nhận 1 lần · độ tin cậy: high · tag: component, animation, clip, format-incompatible, prefab*

### Material .mat → Cocos: format incompatible, always manual

Unity .mat files không thể dùng trực tiếp trong Cocos. Dù guid của material có trong bảng ánh xạ, Cocos dùng định dạng .mtl riêng. MeshRenderer trong Cocos không expose mảng materials qua thuộc tính serialize đơn giản như Unity — phải gán bằng setMaterial() trong code hoặc kéo thả trong Inspector. Luôn ghi warning cho từng material reference.

*Xác nhận 1 lần · độ tin cậy: high · tag: asset, material, meshrenderer, format-incompatible, prefab*

### cc.Animation serialized property names in prefab JSON

cc.Animation ở Cocos Creator 3.8 serialize public properties là clips (mảng), defaultClip (null được), playOnLoad (boolean) — lấy từ MCP API. _clips với underscore prefix có thể cũng đúng trong serialization thực tế nhưng MCP trả về tên không underscore.

*Xác nhận 1 lần · độ tin cậy: medium · tag: animation, serialization, cc.animation, prefab*

### MeshRenderer materials not in MCP-scanned API surface

cc.MeshRenderer trong Cocos 3.8 inherit _materials từ ModelRenderer nhưng MCP API scan chỉ trả về mesh, shadowCastingModeForInspector, receiveShadowForInspector, enableMorph… Materials không xuất hiện trong danh sách thuộc tính được scan. Với prefab JSON serialization, materials có thể cần property name khác hoặc nằm ở class cha — cần kiểm tra thủ công prefab mẫu để xác nhận.

*Xác nhận 1 lần · độ tin cậy: low · tag: meshrenderer, materials, mcp-api, prefab*

### Unity .mat → Cocos .mtl luôn cần làm tay

Material của Unity (.mat, định dạng YAML asset) và Cocos (.mtl, định dạng JSON) khác nhau về cấu trúc và pipeline render. Không có ánh xạ tự động; luôn cần tạo lại material bằng tay trong Cocos và gán lại vào MeshRenderer.

*Xác nhận 1 lần · độ tin cậy: high · tag: material, conversion, prefab*

### Unity MeshRenderer thiếu mesh khi không có MeshFilter

Unity MeshRenderer không tự chứa tham chiếu mesh — mesh nằm ở MeshFilter (component riêng). Khi chỉ có dữ liệu MeshRenderer mà không có MeshFilter, không thể ánh xạ mesh sang cc.MeshRenderer.mesh. Phải để mesh=null và cảnh báo người dùng gán lại từ FBX nguồn.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, meshfilter, 3d, mesh, prefab*

### Unity AnimationClip (.anim) luôn không chuyển được sang Cocos

Unity .anim và Cocos .anim là hai định dạng hoàn toàn khác nhau, không có đường chuyển đổi. Với UnityEngine.Animation, chỉ map được danh sách clip (m_Animations → _clips) và playOnLoad (m_PlayAutomatically → playOnLoad), nhưng _clips luôn để rỗng [] vì clip Unity không dùng được. Cảnh báo người dùng tạo lại AnimationClip trong Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, animationclip, .anim, prefab*

### MeshRenderer shadow mapping: m_CastShadows/m_ReceiveShadows → shadowCastingMode/receiveShadow

Unity m_CastShadows (0=Off, 1=On) → cc.MeshRenderer.shadowCastingMode (Float enum: 0=OFF, 1=ON) + shadowCastingModeForInspector (Boolean). Unity m_ReceiveShadows (0/1) → cc.MeshRenderer.receiveShadow (Float 0/1) + receiveShadowForInspector (Boolean).

*Xác nhận 1 lần · độ tin cậy: medium · tag: meshrenderer, shadow, lighting, prefab*

### MeshRenderer → cc.MeshRenderer: shadow & material mapping

Unity m_CastShadows (enum: 0=Off,1=On,2=TwoSided,3=ShadowsOnly) → cc.MeshRenderer.shadowCastingMode (0=OFF,1=ON). m_ReceiveShadows (bool) → receiveShadow (float, 0 or 1). m_Materials array → sharedMaterials array, mỗi entry dùng GUID→UUID tất định với __expectedType__: cc.Material. Mesh (từ MeshFilter trong FBX) không giải được sub-asset UUID — phải để null và cảnh báo người dùng gán tay.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, material, 3d, shadow, prefab*

### MeshRenderer 3D trong prefab: mesh từ FBX không tự ánh xạ được

Khi MeshRenderer thuộc node tạo từ FBX import, mesh nằm ở MeshFilter (fileID nội bộ 2100000 trong Unity). Bên Cocos, mesh là sub-asset của FBX với UUID con không xác định được từ GUID cha. cc.MeshRenderer.mesh phải để null/unset, rồi ghi rõ FBX nguồn + cảnh báo để người dùng kéo mesh vào Inspector.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, mesh, fbx, sub-asset, prefab*

### MeshRenderer: không tự suy mesh từ FBX

Khi Unity MeshRenderer trỏ tới FBX (guid model) chứ không có m_Mesh/MeshFilter riêng, Cocos cc.MeshRenderer.mesh phải để null vì không biết sub-mesh nào trong FBX tương ứng. Phải cảnh báo rõ và yêu cầu gán tay sub-mesh qua Inspector sau khi import FBX vào Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, fbx, mesh, sub-mesh, prefab*

### m_CastShadows bool → shadowCastingMode float

Unity MeshRenderer.m_CastShadows là bool (0/1), Cocos dùng shadowCastingMode = Float. Với m_CastShadows=1 (On) → shadowCastingMode=1 (giá trị mặc định ON). Với =0 (Off) → shadowCastingMode=0. Lưu ý Cocos dùng float chứ không phải bool.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, shadow, m_castshadows, shadowcastingmode, prefab*

### MeshRenderer: các field lighting/optimization Unity bị bỏ

Các field liên quan đến LightProbe, ReflectionProbe, RayTracing, MotionVectors, Occludee, SortingLayer, AdditionalVertexStreams của Unity MeshRenderer không có tương ứng trong Cocos Creator 3.x. Luôn liệt kê chúng vào warnings để minh bạch.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, lighting, unsupportedfields, prefab*

### Unity MeshRenderer → cc.MeshRenderer: ánh xạ bóng và material

Unity MeshRenderer ánh xạ sang cc.MeshRenderer với: m_CastShadows (0=Off/1=On) → shadowCastingMode (0=OFF/1=ON) + shadowCastingModeForInspector; m_ReceiveShadows → receiveShadow (Float: 0 hoặc 1); m_Materials[] → _materials[] với tham chiếu UUID của cc.Material. Mesh gốc từ MeshFilter phải được xử lý riêng (gán vào _mesh). Toàn bộ field GI/lightmap/probe bị bỏ vì không có tương ứng.

*Xác nhận 1 lần · độ tin cậy: high · tag: meshrenderer, 3d, shadow, material, prefab*

### Material GUID → Cocos UUID: dùng bảng ánh xạ có sẵn, không đoán suffix

Khi GUID của material có trong bảng GUID→asset (được cung cấp kèm input), UUID suy ra bằng cách chèn dấu gạch 8-4-4-4-12 là hợp lệ. Không cần suffix phụ cho material (khác với texture cần @f9941/@6c48a). Nếu GUID không có trong bảng, để mảng rỗng và ghi cảnh báo.

*Xác nhận 1 lần · độ tin cậy: medium · tag: material, uuid, guid, reference, prefab*

### Unity MeshRenderer → cc.MeshRenderer: ánh xạ shadow và material

Unity MeshRenderer m_CastShadows (0/1/2/3) → cc.MeshRenderer.shadowCastingMode (0=OFF, 1=ON). m_ReceiveShadows (bool) → receiveShadow (float 0.0 hoặc 1.0) + receiveShadowForInspector (bool). Mảng m_Materials → _materials với tham chiếu cc.Material dùng UUID từ GUID (chèn dấu gạch 8-4-4-4-12). Mesh (từ MeshFilter riêng) → cc.MeshRenderer.mesh — nếu thiếu MeshFilter thì phải gán tay. Toàn bộ lightmapping/light-probe/ray-tracing của Unity không có tương ứng, bỏ và ghi warning.

*Xác nhận 1 lần · độ tin cậy: high · tag: component, meshrenderer, 3d, prefab*

## Script C# → TypeScript

### Thành viên uniform block trong Cocos phải căn theo vec4; scalar phải qua target

Cocos Creator 3.x yêu cầu mọi thành viên của khối `uniform XxxData { ... };` căn theo vec4 (không khai báo lẻ float/vec2/vec3). Property float của Unity (_Power, _Speed...) nên gộp vào một vec4 rồi phơi ra Inspector bằng `propName: { value: 3.0, target: fresnelParams.x }` trong khối properties của CCEffect.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, effect, uniform, ubo*

### UNITY_MATRIX_V[k] là HÀNG, còn mat[k] trong GLSL là CỘT

HLSL đánh chỉ số ma trận theo hàng, GLSL theo cột. `UNITY_MATRIX_V[2].xyz` tương đương `vec3(cc_matView[0][2], cc_matView[1][2], cc_matView[2][2])`, không phải `cc_matView[2].xyz`. Thêm nữa Unity hệ tay trái, Cocos hệ tay phải nên dấu có thể ngược — luôn ghi warning yêu cầu kiểm tra bằng mắt và gợi ý đổi dấu.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, matrix, handedness, viewdir*

### Render state trong ShaderLab Pass ánh xạ thẳng sang các khối state của pass Cocos

`Blend A B` → blendState.targets[0] {blend: true, blendSrc, blendDst, blendSrcAlpha, blendDstAlpha}; `ZWrite Off` → depthStencilState.depthWrite: false (giữ depthTest: true vì ZTest mặc định Unity là LEqual); `Cull Back/Front/Off` → rasterizerState.cullMode: back/front/none. Tags Queue/RenderType không có tương ứng — hàng đợi trong suốt suy ra từ blend = true, phải ghi warning về khả năng lệch thứ tự vẽ.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, blend, render-state*

### Hàm biến đổi không gian của URP thay bằng CCGetWorldMatrixFull + cc_matViewProj

`TransformObjectToHClip(v)` → `cc_matViewProj * matWorld * vec4(v, 1.0)`; `TransformObjectToWorldNormal(n)` → `normalize((matWorldIT * vec4(n, 0.0)).xyz)`; lấy ma trận bằng `CCGetWorldMatrixFull(matWorld, matWorldIT)` sau `#include <builtin/uniforms/cc-local-batch>`. Mọi include ShaderLibrary của URP đều không có tương ứng và phải nêu trong warnings.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, urp, transform*

### Đổi tên property theo quy ước Cocos làm đứt liên kết dữ liệu từ .mat

Khi đổi `_MainTex`/`_Texture` sang tên Cocos (`mainTexture`), dữ liệu trong .mat của Unity không còn tự bind. Luôn ghi warning nêu bảng đổi tên và nhắc gán lại trong Material, hoặc gợi ý giữ nguyên tên gốc ở cả properties lẫn CCProgram nếu ưu tiên tự động hoá.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, material, naming*

### Giữ nguyên hành vi 'sai' của shader gốc, biến bản sửa thành macro tuỳ chọn

Khi shader Unity dùng công thức không chuẩn (fresnel theo trục camera thay vì tia nhìn từng điểm), bản chuyển mặc định phải tái hiện đúng hành vi gốc; cách làm 'đúng' hơn chỉ đưa vào sau `#pragma define-meta TÊN_MACRO`, mặc định tắt, kèm warning nói rõ bật lên sẽ khác bản Unity.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, fidelity, macro*

### ColorMask 0 → blendColorMask: 0 trong Cocos

ColorMask 0 của Unity (không ghi kênh màu nào) ánh xạ sang blendColorMask: 0 trên blendState target của Cocos Creator 3.8. blendColorMask nhận giá trị bitmask: 0 = không kênh nào, 0xF = tất cả RGBA. Cần kiểm tra bằng mắt vì một số phiên bản Cocos có thể không tôn trọng mask khi blend=false.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, render-state, colormask*

### Unity SubShader state kế thừa xuống Pass → Cocos khai báo trực tiếp trên pass

Trong Unity ShaderLab, render state (ZWrite, ColorMask, Cull) khai báo ở SubShader được mọi Pass kế thừa. Ở Cocos, mỗi pass khai báo riêng depthStencilState, blendState, rasterizerState. Khi convert, chuyển state từ SubShader vào từng pass mà không nhân đôi nếu state đã có sẵn ở pass gốc.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, render-state, pass-inheritance*

### Unity tag RenderPipeline bị bỏ hoàn toàn khi convert

Tag RenderPipeline=UniversalPipeline trong Unity ShaderLab chỉ định shader chỉ dành cho URP. Cocos Creator không có hệ thống pipeline variant tương đương, vì vậy tag này bị bỏ qua hoàn toàn. Shader convert ra là effect chung cho mọi pipeline của Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, tags, pipeline*

### Depth-only shader conversion pattern

Unity shader với Pass{} rỗng + ZWrite On + ColorMask 0 là depth-only pass (ghi depth buffer, không ghi màu). Convert sang Cocos bằng: vertex shader chỉ biến đổi vị trí (cc_matViewProj * matWorld * vec4(a_position, 1.0)), fragment shader trả về vec4(1.0) (giá trị không quan trọng vì bị mask), blendState targets[0] { blend: false, blendColorMask: 0 }, depthStencilState { depthWrite: true, depthTest: true, depthFunc: lessEqual }. Không cần properties nếu shader gốc không có.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, depth-only, colormask, stencil-mask*

### Empty shader properties block is valid for utility shaders

Shader Unity dùng cho mục đích utility (depth mask, stencil buffer, render-to-texture helper) thường không có khối Properties. Trong Cocos, khối properties của technique pass có thể bỏ qua hoàn toàn — không bắt buộc phải có mainTexture hay mainColor như các shader thông thường.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, properties, utility*

### MatCap shader pattern: view-space normal.xy → UV

Shader MatCap kinh điển: TransformObjectToWorldNormal → TransformWorldToViewDir → normalize → .xy * 0.5 + 0.5 → sample MatCap texture. Trong Cocos: cc_matWorldIT để chuyển normal lên world, cc_matView để chuyển world normal sang view space. Vì MatCap chỉ dùng viewNormal.xy, khác biệt hệ tọa độ trái/phải (dấu Z) không ảnh hưởng kết quả.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, matcap, coordinate-system*

### Shader chỉ có uniform texture, không có float property → bỏ qua UBO lo cho vec4 alignment

Khi shader Unity chỉ có TEXTURE2D + SAMPLER (không float/int property nào trong CBUFFER), Cocos không cần uniform block custom. Texture được khai báo là `uniform sampler2D tênTexture;` trong CCProgram và `tênTexture: { value: white }` trong properties của pass. Không cần áp dụng quy tắc căn vec4 cho uniform block vì không có block nào.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, uniform, texture-only*

### Shader không dùng TRANSFORM_TEX → không cần tiling/offset manual

Khi shader Unity sample texture trực tiếp bằng SAMPLE_TEXTURE2D mà không qua TRANSFORM_TEX macro (tức không dùng _ST), Cocos cũng sample trực tiếp bằng texture() không cần uniform tiling/offset bổ sung. Texture được bind tự động qua hệ thống properties của Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, texture, tiling-offset*

### ZWrite Off bị comment trong Unity → mặc định ZWrite On

Khi gặp dòng ZWrite bị comment (//ZWrite Off) trong pass Unity, ZWrite mặc định là On. Phải chuyển sang Cocos là depthWrite: true (mặc định cũng là true). Luôn ghi warning vì Queue=Transparent + ZWrite On là tổ hợp bất thường, có thể là lỗi lúc dev.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, render-state, zwrite*

### Macro IsPerspectiveProjection của URP ánh xạ sang kiểm tra phần tử ma trận chiếu

Trong Unity URP, IsPerspectiveProjection() kiểm tra xem phép chiếu có phải perspective hay không. Trong Cocos, không có macro tương đương — dùng abs(cc_matProj[2][3]) > 0.5 để phân biệt: perspective thì phần tử [2][3] ≈ -1.0 (hệ tay phải của Cocos), orthographic thì ≈ 0.0. Luôn ghi warning vì vị trí phần tử perspective divide có thể khác giữa các phiên bản engine.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, projection, perspective, orthographic, macro*

### View direction trong orthographic từ UNITY_MATRIX_V cần chú ý kép: row→column mapping + handedness

HLSL UNITY_MATRIX_V[2].xyz (row 2, tức forward của camera trong Unity tay trái) chuyển sang GLSL Cocos thành vec3(cc_matView[0][2], cc_matView[1][2], cc_matView[2][2]) do GLSL truy cập ma trận theo cột. Hệ quả: dấu Z có thể ngược vì Unity tay trái (camera looking +Z) còn Cocos tay phải (camera looking -Z). Luôn thêm warning yêu cầu kiểm tra bằng mắt và gợi ý đổi dấu nếu cần.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, view-matrix, orthographic, handedness, hlsl-to-glsl*

### Shader chỉ có uniform texture (không float property) → toàn bộ CBUFFER empty → bỏ qua UBO

Khi shader Unity có CBUFFER_START(UnityPerMaterial)/CBUFFER_END rỗng (không float/int/vector property nào), Cocos không cần uniform block custom. Texture được khai báo trực tiếp là uniform sampler2D trong CCProgram và ánh xạ qua properties của pass. Không cần áp dụng quy tắc căn vec4 vì không có block uniform nào.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, uniform, cbuffer, ubo, texture-only*

### Shader không TRANSFORM_TEX → không cần tiling/offset trong uniform

Khi fragment shader sample texture bằng SAMPLE_TEXTURE2D trực tiếp (không qua TRANSFORM_TEX macro), Cocos cũng sample bằng texture() mà không cần uniform bổ sung cho tiling/offset. Tiling/offset do engine Cocos quản lý thông qua hệ thống material riêng.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, texture, tiling, sampling*

### Pass Tag RenderPipeline của Unity luôn bị bỏ — Cocos không có pipeline variant

Tag RenderPipeline=UniversalPipeline trong ShaderLab chỉ định shader dành riêng cho URP. Cocos Creator không có hệ thống pipeline variant — shader effect là chung cho mọi backend. Tag này bị bỏ qua hoàn toàn, cùng với RenderType và Queue (Cocos tự suy thứ tự vẽ từ blend state).

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, tag, render-pipeline, queue*

### URP IsPerspectiveProjection() → cc_matProj[3][3] kiểm tra

URP IsPerspectiveProjection() kiểm tra xem ma trận chiếu hiện tại có phải perspective không. Trong Cocos Creator, có thể thay bằng kiểm tra cc_matProj[3][3]: orthographic thì phần tử này = 1.0, perspective thì = 0.0. Dùng ngưỡng 0.5 để phân biệt. Đây là heuristic và cần xác nhận bằng mắt.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, urp, projection, cocoscreator*

### Shader auto-generated Shader Graph có dead code — giữ lại để trung thực nhưng ghi chú

Shader sinh từ Unity Shader Graph thường có nhiều biến được tính trong vertex/fragment shader nhưng không thực sự tham gia vào đầu ra (ví dụ worldNormal, viewDir chỉ để dành cho node graph nhưng node đó không nối đến output). Khi convert, giữ nguyên cấu trúc để trung thực với nguồn nhưng ghi chú rõ trong warnings rằng đó là dead code và có thể xoá.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, shadergraph, dead-code, cocoscreator*

### UNITY_MATRIX_V ortho view direction: luôn cần cảnh báo về dấu Z do khác hệ tọa độ

Khi convert UNITY_MATRIX_V[k].xyz (HLSL hàng) sang Cocos GLSL (cột), ánh xạ là vec3(cc_matView[0][k], cc_matView[1][k], cc_matView[2][k]). Ngoài khác biệt row/column, còn khác hệ tay (Unity trái, Cocos phải) khiến dấu thành phần Z có thể ngược. Luôn ghi warning yêu cầu kiểm tra bằng mắt và gợi ý đảo dấu nếu cần.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, view-matrix, handedness, cocoscreator*

### Shader chỉ có texture + CBUFFER rỗng → không cần UBO tuỳ chỉnh

Khi Unity Shader chỉ có TEXTURE2D + SAMPLER trong HLSL và CBUFFER_START(UnityPerMaterial) rỗng (không float property nào), trong Cocos chỉ cần khai báo uniform sampler2D trực tiếp trong CCProgram và bind bằng properties: { value: white }. Không cần uniform block tuỳ chỉnh, không cần lo vec4 alignment.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, texture-only, uniform, ubo*

### Unity Blend single statement → Cocos blendSrc + blendSrcAlpha giống nhau

Trong Unity ShaderLab, lệnh Blend A B áp dụng cùng hệ số cho cả kênh RGB và Alpha. Khi chuyển sang Cocos, cả blendSrc/blendSrcAlpha đều dùng A và blendDst/blendDstAlpha đều dùng B. Ví dụ: Blend SrcAlpha OneMinusSrcAlpha → blendSrc: src_alpha, blendDst: one_minus_src_alpha, blendSrcAlpha: src_alpha, blendDstAlpha: one_minus_src_alpha.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, blend, render-state*

### IsPerspectiveProjection → kiểm tra cc_matProj[3][3]

Unity IsPerspectiveProjection() kiểm tra xem ma trận chiếu hiện tại là perspective hay orthographic. Trong Cocos, chưa có hàm tương đương dựng sẵn, nhưng có thể mô phỏng bằng cách kiểm tra cc_matProj[3][3]: giá trị ~0 là perspective, ~1 là orthographic. Cần ghi warning vì cách này phụ thuộc vào layout ma trận chiếu của Cocos.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, projection, perspective, orthographic*

### ViewDir orthographic: UNITY_MATRIX_V[2] hàng → cột GLSL + cảnh báo dấu

Khi Unity shader dùng UNITY_MATRIX_V[2].xyz (hàng 2 của view matrix, HLSL row-major indexing) làm hướng nhìn cho camera orthographic, trong GLSL Cocos cần chuyển thành vec3(cc_matView[0][2], cc_matView[1][2], cc_matView[2][2]) (cột 2, GLSL column-major indexing). Luôn kèm warning về khả năng đảo dấu do khác biệt hệ tọa độ trái/phải giữa Unity và Cocos.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, matrix, view, orthographic, coordinate-system*

### Bỏ branch IsPerspectiveProjection khi dùng cc_cameraPos

Shader URP có nhánh IsPerspectiveProjection() để chọn viewDir (perspective: cameraPos − worldPos; orthographic: UNITY_MATRIX_V[2].xyz) có thể đơn giản hoá thành một dòng `normalize(cc_cameraPos.xyz − worldPos.xyz)` trong Cocos. Công thức này đúng cho cả perspective lẫn orthographic, tránh phải mô phỏng IsPerspectiveProjection() và xử lý phép đổi chỉ số hàng/cột của UNITY_MATRIX_V.

*Xác nhận 1 lần · độ tin cậy: high · tag: shader, urp, viewdir, isperspectiveprojection, perspective, orthographic*

### Dead code từ Shader Graph Unity trong fragment shader

Shader Graph Unity thường tự sinh biến worldNormal và viewDir trong vertex→fragment ngay cả khi fragment không dùng. Khi convert sang Cocos, giữ nguyên các biến này (đã được chuẩn hoá) để tương lai dễ mở rộng (lighting, rim), nhưng ghi chú rõ đây là code dư để người dùng biết có thể xoá.

*Xác nhận 1 lần · độ tin cậy: medium · tag: shader, shadergraph, deadcode, worldnormal, viewdir*

## Animation

### Unity AnimationClip EditorCurves to Cocos PropertyTrack mapping

Unity m_EditorCurves (attribute m_LocalPosition.x/y/z, classID=4) chuyển thành Cocos PropertyTrack với property='position', channel.curve='x'/'y'/'z'. m_LocalScale.x/y/z -> property='scale'. m_IsActive (classID=1) -> property='active' với curve='' (scalar). Mỗi vector component Unity sinh một track riêng biệt trong Cocos (không gộp 3 thành phần vào chung một track).

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, curve, property-track*

### Unity AnimationClip events sang Cocos AnimationClip events

Unity m_Events[] (time, functionName) chuyển thành Cocos events[] (frame, func, params). Params của Unity (data, floatParameter, intParameter, objectReferenceParameter) gộp vào params[] của Cocos nhưng Cocos chỉ hỗ trợ string params. messageOptions không có tương ứng — luôn cảnh báo người dùng tự xác minh receiver.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, events*

### Unity legacy AnimationClip WrapMode mapping

Unity m_WrapMode=0 (Default) + m_LoopTime=0 → Cocos wrapMode=1 (Normal, play once). Unity m_LoopTime=1 → Cocos wrapMode=2 (Loop). m_AnimationClipSettings (KeepOriginalPositionY, LoopBlend, v.v.) không có tương ứng bên Cocos và luôn cần cảnh báo.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, wrapmode*

### Animation world-unit vs pixel-unit: cảnh báo nhưng không nhân tự động

Khi convert Unity AnimationClip sang Cocos, không nhân pixelsPerUnit vào curve values một cách tự động vì clip có thể áp dụng cho node UI (Canvas, đơn vị pixel) hoặc node world (SpriteRenderer, đơn vị world). Chỉ cảnh báo để người dùng tự xác định context node đích.

*Xác nhận 1 lần · độ tin cậy: high · tag: animation, coordinate-system, pixelsperunit*
