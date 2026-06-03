import { useState } from 'react'
import { useMap } from 'react-leaflet'
import { useGeocoding } from '../../hooks/useGeocoding'
import { Search, MapPin, Loader2 } from 'lucide-react'

export function SearchTool() {
  const [query, setQuery] = useState('')
  const { results, loading, search } = useGeocoding()
  const map = useMap()

  const handleSearch = () => {
    if (query.trim()) search(query.trim())
  }

  const handleSelect = (lat: string, lon: string) => {
    map.setView([parseFloat(lat), parseFloat(lon)], 14)
  }

  const handleCoordSearch = () => {
    const match = query.match(/^(-?\d+\.?\d*)\s*[,，\s]\s*(-?\d+\.?\d*)$/)
    if (match) {
      const [, lat, lng] = match
      map.setView([parseFloat(lat), parseFloat(lng)], 14)
    }
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-96">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 p-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索地址或输入坐标（纬度, 经度）"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
          <button
            onClick={handleCoordSearch}
            className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0"
          >
            坐标定位
          </button>
          <button
            onClick={handleSearch}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : '搜索'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="border-t border-gray-700 max-h-60 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r.lat, r.lon)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-300 flex items-start gap-2"
              >
                <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
