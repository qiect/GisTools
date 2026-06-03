import { useState } from 'react'
import { BarChart3, Play } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { GeoLayer } from '../../types'

type VizType = 'heatmap' | 'cluster' | 'choropleth'

const vizOptions: { value: VizType; label: string; desc: string }[] = [
  { value: 'heatmap', label: '热力图', desc: '基于点密度生成热力分布图' },
  { value: 'cluster', label: '聚合显示', desc: '将密集点聚合展示' },
  { value: 'choropleth', label: '分级着色', desc: '按属性值分级着色' },
]

export function VisualizationPanel() {
  const [vizType, setVizType] = useState<VizType>('heatmap')
  const [radius, setRadius] = useState(25)
  const [status, setStatus] = useState('')
  const layers = useAppStore((s) => s.layers)
  const addLayer = useAppStore((s) => s.addLayer)

  const runViz = () => {
    const geoLayers = layers.filter((l) => l.type === 'geojson')
    if (geoLayers.length === 0) {
      setStatus('没有可用的点数据')
      return
    }

    const newLayer: GeoLayer = {
      id: `layer-viz-${Date.now()}`,
      name: `${vizOptions.find((v) => v.value === vizType)?.label}`,
      visible: true,
      opacity: 1,
      zIndex: layers.length,
      data: geoLayers[0].data,
      type: vizType === 'heatmap' ? 'heatmap' : vizType === 'cluster' ? 'cluster' : 'geojson',
      style: { radius },
    }
    addLayer(newLayer)
    setStatus('可视化图层已添加')
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[340px]">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">数据可视化</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1">
            {vizOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setVizType(opt.value)}
                className={`px-2 py-2 rounded text-xs transition-colors ${
                  vizType === opt.value
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/50'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {vizType === 'heatmap' && (
            <div>
              <label className="text-xs text-gray-500">热力半径: {radius}</label>
              <input
                type="range"
                min="5"
                max="60"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full mt-1 accent-emerald-500"
              />
            </div>
          )}

          <button
            onClick={runViz}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
          >
            <Play size={14} />
            生成可视化
          </button>

          {status && <p className="text-xs text-gray-400 text-center">{status}</p>}
        </div>
      </div>
    </div>
  )
}
