import { useState } from 'react'
import { Compass, Play } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { bufferAnalysis, convexHullAnalysis, centerOfMass } from '../../utils/spatial'
import type { GeoLayer } from '../../types'

type AnalysisType = 'buffer' | 'convex' | 'center' | 'voronoi' | 'tin'

const analysisOptions: { value: AnalysisType; label: string; desc: string }[] = [
  { value: 'buffer', label: '缓冲区分析', desc: '在要素周围创建指定距离的缓冲区' },
  { value: 'convex', label: '凸包分析', desc: '计算点集的凸包多边形' },
  { value: 'center', label: '质心计算', desc: '计算要素集合的质心' },
  { value: 'voronoi', label: '泰森多边形', desc: '基于点集生成 Voronoi 图' },
  { value: 'tin', label: 'TIN 三角网', desc: '基于点集生成不规则三角网' },
]

export function SpatialAnalysis() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('buffer')
  const [bufferRadius, setBufferRadius] = useState('5')
  const [bufferUnit, setBufferUnit] = useState<'kilometers' | 'miles' | 'meters'>('kilometers')
  const [status, setStatus] = useState('')
  const layers = useAppStore((s) => s.layers)
  const addLayer = useAppStore((s) => s.addLayer)

  const runAnalysis = () => {
    const geoLayers = layers.filter((l) => l.type === 'geojson')
    if (geoLayers.length === 0) {
      setStatus('没有可分析的数据，请先导入或绘制要素')
      return
    }

    try {
      let result: any

      const fc = {
        type: 'FeatureCollection' as const,
        features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
      }

      if (analysisType === 'buffer') {
        result = bufferAnalysis(fc, parseFloat(bufferRadius), bufferUnit)
      } else if (analysisType === 'convex') {
        result = convexHullAnalysis(fc)
      } else if (analysisType === 'center') {
        result = centerOfMass(fc)
      }

      if (result) {
        const newLayer: GeoLayer = {
          id: `layer-${Date.now()}`,
          name: `${analysisOptions.find((a) => a.value === analysisType)?.label}结果`,
          visible: true,
          opacity: 0.8,
          zIndex: layers.length,
          data: result,
          type: 'geojson',
          style: { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 2 },
        }
        addLayer(newLayer)
        setStatus('分析完成，结果已添加为新图层')
      }
    } catch (err) {
      setStatus(`分析失败: ${(err as Error).message}`)
    }
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[380px]">
        <div className="flex items-center gap-2 mb-3">
          <Compass size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">空间分析</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">分析类型</label>
            <div className="mt-1 space-y-1">
              {analysisOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnalysisType(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    analysisType === opt.value
                      ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/50'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {analysisType === 'buffer' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500">缓冲距离</label>
                <input
                  type="number"
                  value={bufferRadius}
                  onChange={(e) => setBufferRadius(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono"
                />
              </div>
              <div className="w-28">
                <label className="text-xs text-gray-500">单位</label>
                <select
                  value={bufferUnit}
                  onChange={(e) => setBufferUnit(e.target.value as any)}
                  className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
                >
                  <option value="kilometers">公里</option>
                  <option value="meters">米</option>
                  <option value="miles">英里</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={runAnalysis}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
          >
            <Play size={14} />
            执行分析
          </button>

          {status && <p className="text-xs text-gray-400 text-center">{status}</p>}
        </div>
      </div>
    </div>
  )
}
