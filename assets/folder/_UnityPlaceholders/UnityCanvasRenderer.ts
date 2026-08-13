import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Component giữ chỗ, sinh tự động khi chuyển từ Unity.
 *
 * Component gốc: CanvasRenderer
 * Lý do không chuyển được: Không có trong bảng ánh xạ: CanvasRenderer
 *
 * Class này KHÔNG có logic — nó chỉ giữ lại nguyên giá trị đã đặt trong Unity
 * để bạn dựng lại hành vi. Sinh sẵn logic đoán mò sẽ nguy hiểm hơn là để trống.
 *
 * TODO: cài đặt lại hành vi tương đương rồi xoá component này.
 */
@ccclass('UnityCanvasRenderer')
export class UnityCanvasRenderer extends Component {
    /** Unity: m_CullTransparentMesh */
    @property({ tooltip: 'Giá trị gốc từ Unity: m_CullTransparentMesh' })
    public cullTransparentMesh: number = 1;

    /**
     * Toàn bộ dữ liệu gốc của component trong Unity, dạng JSON.
     * Giữ lại để không mất những field không biểu diễn được bằng @property
     * (tham chiếu asset, struct lồng nhau, UnityEvent...).
     */
    @property({ multiline: true, readonly: true })
    public unityRaw: string = "{\n  \"m_CullTransparentMesh\": 1\n}";
}
