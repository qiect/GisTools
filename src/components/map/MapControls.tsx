import { useMap } from 'react-leaflet'
import { ZoomIn, ZoomOut, Locate, Maximize } from 'lucide-react'

export function MapControls() {
  const map = useMap()

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 16 })
  }

  const handleFitWorld = () => {
    map.fitWorld()
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ top: 12, right: 12 }}>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => map.zoomIn()}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
          title="放大"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
          title="缩小"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleLocate}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
          title="定位"
        >
          <Locate size={16} />
        </button>
        <button
          onClick={handleFitWorld}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
          title="全局视图"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  )
}
