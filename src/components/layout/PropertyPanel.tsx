import { useAppStore } from '../../store/useAppStore'
import { X } from 'lucide-react'

export function PropertyPanel() {
  const selectedFeature = useAppStore((s) => s.selectedFeature)
  const measureResults = useAppStore((s) => s.measureResults)
  const setPropertyPanelOpen = useAppStore((s) => s.setPropertyPanelOpen)

  return (
    <aside className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold">属性面板</h2>
        <button
          onClick={() => setPropertyPanelOpen(false)}
          className="p-1 rounded hover:bg-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {measureResults.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">测量结果</h3>
            <div className="space-y-1">
              {measureResults.map((r, i) => (
                <div key={i} className="text-sm bg-gray-700/50 rounded px-3 py-2">
                  <span className="text-gray-400">
                    {r.type === 'distance' ? '距离' : r.type === 'area' ? '面积' : '方位角'}：
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {r.value.toFixed(2)} {r.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFeature && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">要素属性</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-400">类型：</span>
                <span>{selectedFeature.type}</span>
              </div>
              {Object.entries(selectedFeature.properties).map(([k, v]) => (
                <div key={k} className="text-sm">
                  <span className="text-gray-400">{k}：</span>
                  <span>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedFeature && measureResults.length === 0 && (
          <p className="text-sm text-gray-500">选择要素或使用测量工具查看属性</p>
        )}
      </div>
    </aside>
  )
}
