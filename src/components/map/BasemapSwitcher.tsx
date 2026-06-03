import { useState } from 'react'
import { TileLayer } from 'react-leaflet'
import { Layers } from 'lucide-react'

interface BasemapConfig {
  url: string
  attribution: string
}

interface BasemapSwitcherProps {
  basemaps: Record<string, BasemapConfig>
}

const basemapLabels: Record<string, string> = {
  osm: 'OpenStreetMap',
  dark: '暗色底图',
  satellite: '卫星影像',
  terrain: '地形图',
}

export function BasemapSwitcher({ basemaps }: BasemapSwitcherProps) {
  const [active, setActive] = useState<keyof typeof basemaps>('dark')
  const [open, setOpen] = useState(false)

  const handleSwitch = (key: keyof typeof basemaps) => {
    setActive(key)
    setOpen(false)
  }

  return (
    <>
      <TileLayer key={active} url={basemaps[active].url} attribution={basemaps[active].attribution} />
      <div className="leaflet-bottom leaflet-right" style={{ bottom: 24, right: 12 }}>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
            title="切换底图"
          >
            <Layers size={16} />
          </button>
          {open && (
            <div className="absolute bottom-11 right-0 bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-2 min-w-[140px] z-[1000]">
              {(Object.keys(basemaps) as (keyof typeof basemaps)[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSwitch(key)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    active === key ? 'bg-emerald-600/30 text-emerald-400' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {basemapLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
