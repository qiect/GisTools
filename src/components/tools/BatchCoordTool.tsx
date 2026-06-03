import { useState } from 'react'
import { Navigation, Download, Copy } from 'lucide-react'
import { wgs84ToGcj02, gcj02ToWgs84, gcj02ToBd09, bd09ToGcj02 } from '../../utils/coordinate'
import { downloadFile } from '../../utils/dataIO'

type ChinaCoordSystem = 'WGS84' | 'GCJ02' | 'BD09'

const systems: { value: ChinaCoordSystem; label: string }[] = [
  { value: 'WGS84', label: 'WGS 84' },
  { value: 'GCJ02', label: 'GCJ-02' },
  { value: 'BD09', label: 'BD-09' },
]

function convertPoint(
  lng: number,
  lat: number,
  from: ChinaCoordSystem,
  to: ChinaCoordSystem,
): [number, number] {
  if (from === to) return [lng, lat]
  if (from === 'WGS84' && to === 'GCJ02') return wgs84ToGcj02(lng, lat)
  if (from === 'GCJ02' && to === 'WGS84') return gcj02ToWgs84(lng, lat)
  if (from === 'GCJ02' && to === 'BD09') return gcj02ToBd09(lng, lat)
  if (from === 'BD09' && to === 'GCJ02') return bd09ToGcj02(lng, lat)
  if (from === 'WGS84' && to === 'BD09') return gcj02ToBd09(...wgs84ToGcj02(lng, lat))
  if (from === 'BD09' && to === 'WGS84') return gcj02ToWgs84(...bd09ToGcj02(lng, lat))
  return [lng, lat]
}

export function BatchCoordTool() {
  const [input, setInput] = useState('116.4074,39.9042\n121.4737,31.2304\n113.2644,23.1291')
  const [fromSystem, setFromSystem] = useState<ChinaCoordSystem>('WGS84')
  const [toSystem, setToSystem] = useState<ChinaCoordSystem>('GCJ02')
  const [results, setResults] = useState<string[]>([])

  const handleConvert = () => {
    const lines = input.trim().split('\n').filter(Boolean)
    const converted = lines.map((line) => {
      const parts = line.trim().split(/[,，\s]+/)
      const lng = parseFloat(parts[0])
      const lat = parseFloat(parts[1])
      if (isNaN(lng) || isNaN(lat)) return `无效: ${line}`
      const [rLng, rLat] = convertPoint(lng, lat, fromSystem, toSystem)
      return `${rLng.toFixed(8)}, ${rLat.toFixed(8)}`
    })
    setResults(converted)
  }

  const handleExport = () => {
    const content = results.join('\n')
    downloadFile(content, 'batch_convert_result.csv', 'text/csv')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(results.join('\n'))
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[440px]">
        <div className="flex items-center gap-2 mb-3">
          <Navigation size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">批量坐标转换</h3>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">源坐标系</label>
              <select
                value={fromSystem}
                onChange={(e) => setFromSystem(e.target.value as ChinaCoordSystem)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {systems.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">目标坐标系</label>
              <select
                value={toSystem}
                onChange={(e) => setToSystem(e.target.value as ChinaCoordSystem)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {systems.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">输入坐标（每行一个，格式: 经度,纬度）</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
                className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">转换结果</label>
              <textarea
                value={results.join('\n')}
                readOnly
                rows={8}
                className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono text-emerald-400 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConvert}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
            >
              批量转换
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
