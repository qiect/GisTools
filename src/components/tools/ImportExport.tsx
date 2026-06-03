import { useRef, useState } from 'react'
import { Upload, Download, FileJson } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { parseGeoJSON, parseKML, parseCSV, exportGeoJSON, downloadFile } from '../../utils/dataIO'
import type { GeoLayer } from '../../types'

export function ImportExport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const addLayer = useAppStore((s) => s.addLayer)
  const layers = useAppStore((s) => s.layers)
  const [status, setStatus] = useState('')

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      let data

      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        data = parseGeoJSON(text)
      } else if (file.name.endsWith('.kml')) {
        data = parseKML(text)
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text)
      } else {
        setStatus('不支持的文件格式')
        return
      }

      const layer: GeoLayer = {
        id: `layer-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        visible: true,
        opacity: 1,
        zIndex: layers.length,
        data,
        type: 'geojson',
        style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3, weight: 2 },
      }
      addLayer(layer)
      setStatus(`已导入: ${file.name}`)
    } catch (err) {
      setStatus(`导入失败: ${(err as Error).message}`)
    }
  }

  const handleExport = () => {
    const geoLayers = layers.filter((l) => l.type === 'geojson')
    if (geoLayers.length === 0) {
      setStatus('没有可导出的图层')
      return
    }

    const fc = {
      type: 'FeatureCollection' as const,
      features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
    }
    downloadFile(exportGeoJSON(fc), 'export.geojson', 'application/geo+json')
    setStatus('导出成功')
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[320px]">
        <h3 className="text-sm font-semibold mb-3">数据导入导出</h3>

        <div className="space-y-3">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".geojson,.json,.kml,.csv"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-600 rounded-lg hover:border-emerald-500 transition-colors text-sm"
            >
              <Upload size={16} />
              导入文件（GeoJSON / KML / CSV）
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors"
            >
              <FileJson size={14} />
              导出 GeoJSON
            </button>
          </div>

          {status && <p className="text-xs text-gray-400 text-center">{status}</p>}
        </div>
      </div>
    </div>
  )
}
