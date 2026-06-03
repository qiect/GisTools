import { useState } from 'react'
import { Crosshair, ArrowRightLeft, Copy } from 'lucide-react'
import {
  transformCoord,
  wgs84ToGcj02,
  gcj02ToWgs84,
  gcj02ToBd09,
  bd09ToGcj02,
} from '../../utils/coordinate'

type ChinaCoordSystem = 'WGS84' | 'GCJ02' | 'BD09'

const chinaCoordSystems: { value: ChinaCoordSystem; label: string }[] = [
  { value: 'WGS84', label: 'WGS 84（GPS）' },
  { value: 'GCJ02', label: 'GCJ-02（高德/腾讯）' },
  { value: 'BD09', label: 'BD-09（百度）' },
]

const epsgSystems = [
  { value: 'EPSG:4326', label: 'WGS 84' },
  { value: 'EPSG:4490', label: 'CGCS2000' },
  { value: 'EPSG:3857', label: 'Web Mercator' },
  { value: 'EPSG:32650', label: 'UTM 50N' },
  { value: 'EPSG:32651', label: 'UTM 51N' },
]

export function CoordTransform() {
  const [tab, setTab] = useState<'china' | 'epsg'>('china')
  const [inputLng, setInputLng] = useState('116.4074')
  const [inputLat, setInputLat] = useState('39.9042')
  const [fromSystem, setFromSystem] = useState<ChinaCoordSystem>('WGS84')
  const [toSystem, setToSystem] = useState<ChinaCoordSystem>('GCJ02')
  const [fromEpsg, setFromEpsg] = useState('EPSG:4326')
  const [toEpsg, setToEpsg] = useState('EPSG:3857')
  const [result, setResult] = useState<[number, number] | null>(null)

  const convertChina = () => {
    const lng = parseFloat(inputLng)
    const lat = parseFloat(inputLat)
    if (isNaN(lng) || isNaN(lat)) return

    let res: [number, number]
    if (fromSystem === toSystem) {
      res = [lng, lat]
    } else if (fromSystem === 'WGS84' && toSystem === 'GCJ02') {
      res = wgs84ToGcj02(lng, lat)
    } else if (fromSystem === 'GCJ02' && toSystem === 'WGS84') {
      res = gcj02ToWgs84(lng, lat)
    } else if (fromSystem === 'GCJ02' && toSystem === 'BD09') {
      res = gcj02ToBd09(lng, lat)
    } else if (fromSystem === 'BD09' && toSystem === 'GCJ02') {
      res = bd09ToGcj02(lng, lat)
    } else if (fromSystem === 'WGS84' && toSystem === 'BD09') {
      res = gcj02ToBd09(...wgs84ToGcj02(lng, lat))
    } else if (fromSystem === 'BD09' && toSystem === 'WGS84') {
      res = gcj02ToWgs84(...bd09ToGcj02(lng, lat))
    } else {
      res = [lng, lat]
    }
    setResult(res)
  }

  const convertEpsg = () => {
    const lng = parseFloat(inputLng)
    const lat = parseFloat(inputLat)
    if (isNaN(lng) || isNaN(lat)) return
    const res = transformCoord([lng, lat], fromEpsg, toEpsg)
    setResult(res)
  }

  const handleConvert = () => {
    if (tab === 'china') convertChina()
    else convertEpsg()
  }

  const copyResult = () => {
    if (result) navigator.clipboard.writeText(`${result[0]}, ${result[1]}`)
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[380px]">
        <div className="flex items-center gap-2 mb-3">
          <Crosshair size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">坐标系转换</h3>
        </div>

        <div className="flex gap-1 mb-3 bg-gray-900 rounded p-0.5">
          <button
            onClick={() => setTab('china')}
            className={`flex-1 text-xs py-1.5 rounded transition-colors ${
              tab === 'china' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            国测局坐标系
          </button>
          <button
            onClick={() => setTab('epsg')}
            className={`flex-1 text-xs py-1.5 rounded transition-colors ${
              tab === 'epsg' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            EPSG 投影转换
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">经度 / X</label>
              <input
                type="text"
                value={inputLng}
                onChange={(e) => setInputLng(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">纬度 / Y</label>
              <input
                type="text"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">源坐标系</label>
              <select
                value={tab === 'china' ? fromSystem : fromEpsg}
                onChange={(e) =>
                  tab === 'china'
                    ? setFromSystem(e.target.value as ChinaCoordSystem)
                    : setFromEpsg(e.target.value)
                }
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {tab === 'china'
                  ? chinaCoordSystems.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))
                  : epsgSystems.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
              </select>
            </div>
            <ArrowRightLeft size={16} className="text-gray-500 mt-5" />
            <div className="flex-1">
              <label className="text-xs text-gray-500">目标坐标系</label>
              <select
                value={tab === 'china' ? toSystem : toEpsg}
                onChange={(e) =>
                  tab === 'china'
                    ? setToSystem(e.target.value as ChinaCoordSystem)
                    : setToEpsg(e.target.value)
                }
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {tab === 'china'
                  ? chinaCoordSystems.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))
                  : epsgSystems.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleConvert}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
          >
            转换
          </button>

          {result && (
            <div className="flex items-center gap-2 bg-gray-900 rounded px-3 py-2">
              <span className="text-sm font-mono text-emerald-400 flex-1">
                {result[0].toFixed(8)}, {result[1].toFixed(8)}
              </span>
              <button onClick={copyResult} className="text-gray-400 hover:text-white">
                <Copy size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
