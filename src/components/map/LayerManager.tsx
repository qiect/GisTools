import { useAppStore } from '../../store/useAppStore'
import { Eye, EyeOff, Trash2, Layers } from 'lucide-react'

export function LayerManager() {
  const layers = useAppStore((s) => s.layers)
  const toggleLayerVisibility = useAppStore((s) => s.toggleLayerVisibility)
  const removeLayer = useAppStore((s) => s.removeLayer)
  const updateLayerOpacity = useAppStore((s) => s.updateLayerOpacity)

  return (
    <div className="absolute bottom-3 left-3 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl min-w-[260px]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
          <Layers size={14} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">图层管理</h3>
          <span className="text-xs text-gray-500 ml-auto">{layers.length} 个图层</span>
        </div>

        {layers.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            暂无图层，请导入数据或绘制要素
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-0"
              >
                <button
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className="text-gray-400 hover:text-white"
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span
                  className={`flex-1 text-sm truncate ${layer.visible ? 'text-gray-200' : 'text-gray-500'}`}
                >
                  {layer.name}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                  className="w-16 h-1 accent-emerald-500"
                />
                <button onClick={() => removeLayer(layer.id)} className="text-gray-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
