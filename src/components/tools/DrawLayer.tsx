import { useEffect, useCallback, useRef } from 'react'
import { useMapEvents, Marker, Polyline, Polygon, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore, drawTempPoints } from '../../store/useAppStore'
import type { DrawFeature } from '../../types'

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

let featureCounter = 0

export function DrawLayer() {
  const toolMode = useAppStore((s) => s.toolMode)
  const drawFeatures = useAppStore((s) => s.drawFeatures)
  const addDrawFeature = useAppStore((s) => s.addDrawFeature)
  const setSelectedFeature = useAppStore((s) => s.setSelectedFeature)
  const prevModeRef = useRef(toolMode)

  // 切换工具模式时清空临时点
  useEffect(() => {
    if (prevModeRef.current !== toolMode) {
      drawTempPoints.length = 0
      prevModeRef.current = toolMode
    }
  }, [toolMode])

  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!toolMode.startsWith('draw')) return

      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]

      if (toolMode === 'draw-marker') {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'marker',
          coordinates: latlng,
          properties: { name: `标注点 ${featureCounter}` },
          style: {},
        }
        addDrawFeature(feature)
        return
      }

      if (toolMode === 'draw-text') {
        const text = prompt('请输入标注文字：')
        if (!text) return
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'text',
          coordinates: latlng,
          properties: { text, name: text },
          style: {},
        }
        addDrawFeature(feature)
        return
      }

      drawTempPoints.push(latlng)
      const points = [...drawTempPoints]

      if (toolMode === 'draw-polyline' && points.length >= 2) {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'polyline',
          coordinates: points,
          properties: { name: `线 ${featureCounter}` },
          style: { color: '#10b981', weight: 3 },
        }
        addDrawFeature(feature)
        drawTempPoints.length = 0
      }

      if (toolMode === 'draw-polygon' && points.length >= 3) {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'polygon',
          coordinates: points,
          properties: { name: `多边形 ${featureCounter}` },
          style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 },
        }
        addDrawFeature(feature)
        drawTempPoints.length = 0
      }

      if (toolMode === 'draw-rectangle' && points.length >= 2) {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'rectangle',
          coordinates: points,
          properties: { name: `矩形 ${featureCounter}` },
          style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 },
        }
        addDrawFeature(feature)
        drawTempPoints.length = 0
      }

      if (toolMode === 'draw-circle' && points.length >= 2) {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'circle',
          coordinates: points,
          properties: { name: `圆 ${featureCounter}` },
          style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 },
        }
        addDrawFeature(feature)
        drawTempPoints.length = 0
      }
    },
    [toolMode, addDrawFeature],
  )

  useMapEvents({ click: handleClick })

  return (
    <>
      {drawFeatures.map((f) => {
        if (f.type === 'marker' || f.type === 'text') {
          const pos = f.coordinates as [number, number]
          return (
            <Marker
              key={f.id}
              position={pos}
              icon={defaultIcon}
              eventHandlers={{ click: () => setSelectedFeature(f) }}
            >
              <Tooltip permanent={!!f.properties.text}>
                {(f.properties.text as string) || (f.properties.name as string) || ''}
              </Tooltip>
            </Marker>
          )
        }
        if (f.type === 'polyline') {
          return (
            <Polyline
              key={f.id}
              positions={f.coordinates as [number, number][]}
              pathOptions={{ color: f.style.color || '#10b981', weight: f.style.weight || 3 }}
              eventHandlers={{ click: () => setSelectedFeature(f) }}
            />
          )
        }
        if (f.type === 'polygon' || f.type === 'rectangle') {
          return (
            <Polygon
              key={f.id}
              positions={f.coordinates as [number, number][]}
              pathOptions={{
                color: f.style.color || '#10b981',
                fillColor: f.style.fillColor || '#10b981',
                fillOpacity: f.style.fillOpacity || 0.2,
                weight: f.style.weight || 2,
              }}
              eventHandlers={{ click: () => setSelectedFeature(f) }}
            />
          )
        }
        return null
      })}
    </>
  )
}
