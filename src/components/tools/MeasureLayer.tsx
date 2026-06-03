import { useCallback, useEffect } from 'react'
import { useMapEvents, Polyline, Polygon, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore, measureTempPoints } from '../../store/useAppStore'
import { calcDistance, calcArea, calcBearing } from '../../utils/measurement'

export function MeasureLayer() {
  const toolMode = useAppStore((s) => s.toolMode)
  const measureResults = useAppStore((s) => s.measureResults)
  const addMeasureResult = useAppStore((s) => s.addMeasureResult)
  const clearMeasureResults = useAppStore((s) => s.clearMeasureResults)
  const setPropertyPanelOpen = useAppStore((s) => s.setPropertyPanelOpen)

  useEffect(() => {
    if (toolMode.startsWith('measure')) {
      clearMeasureResults()
      measureTempPoints.length = 0
      setPropertyPanelOpen(true)
    }
  }, [toolMode, clearMeasureResults, setPropertyPanelOpen])

  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!toolMode.startsWith('measure')) return

      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]
      measureTempPoints.push(latlng)
      const points = [...measureTempPoints]

      if (toolMode === 'measure-distance' && points.length >= 2) {
        const result = calcDistance(points)
        addMeasureResult({
          type: 'distance',
          value: result.value,
          unit: result.unit,
          coordinates: [...points],
        })
      }

      if (toolMode === 'measure-area' && points.length >= 3) {
        const result = calcArea(points)
        addMeasureResult({
          type: 'area',
          value: result.value,
          unit: result.unit,
          coordinates: [...points],
        })
      }

      if (toolMode === 'measure-angle' && points.length === 2) {
        const bearing = calcBearing(points[0], points[1])
        addMeasureResult({
          type: 'angle',
          value: bearing < 0 ? bearing + 360 : bearing,
          unit: '°',
          coordinates: [...points],
        })
        measureTempPoints.length = 0
      }
    },
    [toolMode, addMeasureResult],
  )

  useMapEvents({ click: handleClick })

  return (
    <>
      {measureResults.map((r, i) => {
        if (r.type === 'distance' && r.coordinates.length >= 2) {
          return (
            <Polyline
              key={`m-${i}`}
              positions={r.coordinates}
              pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '8 4' }}
            >
              <Tooltip permanent>
                {r.value.toFixed(2)} {r.unit}
              </Tooltip>
            </Polyline>
          )
        }
        if (r.type === 'area' && r.coordinates.length >= 3) {
          return (
            <Polygon
              key={`m-${i}`}
              positions={r.coordinates}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '8 4',
              }}
            >
              <Tooltip permanent>
                {r.value.toFixed(2)} {r.unit}
              </Tooltip>
            </Polygon>
          )
        }
        return null
      })}
    </>
  )
}
