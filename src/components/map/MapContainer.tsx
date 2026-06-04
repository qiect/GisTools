import { useMemo, useState, useCallback } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import type { Map as LeafletMap } from 'leaflet'
import { useAppStore } from '../../store/useAppStore'
import { MapControls } from './MapControls'
import { BasemapSwitcher } from './BasemapSwitcher'
import { LayerManager } from './LayerManager'
import { DrawLayer } from '../tools/DrawLayer'
import { MeasureLayer } from '../tools/MeasureLayer'
import { SearchTool } from '../tools/SearchTool'
import { ImportExport } from '../tools/ImportExport'
import { CoordTransform } from '../tools/CoordTransform'
import { SpatialAnalysis } from '../tools/SpatialAnalysis'
import { VisualizationPanel } from '../tools/VisualizationPanel'
import { BatchCoordTool } from '../tools/BatchCoordTool'
import { MapInstanceProvider, useMapInstance } from '../../contexts/MapContext'
import 'leaflet/dist/leaflet.css'

function MapEventHandler() {
  const setToolMode = useAppStore((s) => s.setToolMode)

  useMapEvents({
    keydown(e) {
      if (e.originalEvent.key === 'Escape') {
        setToolMode('pan')
      }
    },
  })
  return null
}

// 内部组件：捕获 map 实例并存储到 state
function MapInstanceCapture({ onMapReady }: { onMapReady: (map: LeafletMap) => void }) {
  const map = useMap()
  useMemo(() => {
    onMapReady(map)
  }, [map, onMapReady])
  return null
}

const basemaps = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
}

function ToolOverlay({ toolMode }: { toolMode: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1000]">
      <div className="pointer-events-auto">
        {toolMode === 'search' && <SearchTool />}
        {toolMode === 'import-export' && <ImportExport />}
        {toolMode === 'coord-transform' && <CoordTransform />}
        {toolMode === 'spatial-analysis' && <SpatialAnalysis />}
        {toolMode === 'visualization' && <VisualizationPanel />}
        {toolMode === 'batch-coord' && <BatchCoordTool />}
      </div>
    </div>
  )
}

export function MapContainer() {
  const toolMode = useAppStore((s) => s.toolMode)
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)

  const handleMapReady = useCallback((map: LeafletMap) => {
    setMapInstance(map)
  }, [])

  const cursorClass = useMemo(() => {
    if (toolMode.startsWith('draw') || toolMode.startsWith('measure')) return 'cursor-crosshair'
    return 'cursor-grab'
  }, [toolMode])

  return (
    <MapInstanceProvider map={mapInstance}>
      <div className={`w-full h-full relative ${cursorClass}`}>
        <LeafletMapContainer
          center={[39.9042, 116.4074]}
          zoom={5}
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer url={basemaps.dark.url} attribution={basemaps.dark.attribution} />
          <MapEventHandler />
          <MapInstanceCapture onMapReady={handleMapReady} />
          <MapControls />
          <BasemapSwitcher basemaps={basemaps} />
          <DrawLayer />
          <MeasureLayer />
          <LayerManager />
        </LeafletMapContainer>
        <ToolOverlay toolMode={toolMode} />
      </div>
    </MapInstanceProvider>
  )
}
