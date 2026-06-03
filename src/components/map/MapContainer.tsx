import { useMemo } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents } from 'react-leaflet'
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
  switch (toolMode) {
    case 'search':
      return <SearchTool />
    case 'import-export':
      return <ImportExport />
    case 'coord-transform':
      return <CoordTransform />
    case 'spatial-analysis':
      return <SpatialAnalysis />
    case 'visualization':
      return <VisualizationPanel />
    case 'batch-coord':
      return <BatchCoordTool />
    default:
      return null
  }
}

export function MapContainer() {
  const toolMode = useAppStore((s) => s.toolMode)

  const cursorClass = useMemo(() => {
    if (toolMode.startsWith('draw') || toolMode.startsWith('measure')) return 'cursor-crosshair'
    return 'cursor-grab'
  }, [toolMode])

  return (
    <div className={`w-full h-full relative ${cursorClass}`}>
      <LeafletMapContainer
        center={[39.9042, 116.4074]}
        zoom={5}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={basemaps.dark.url} attribution={basemaps.dark.attribution} />
        <MapEventHandler />
        <MapControls />
        <BasemapSwitcher basemaps={basemaps} />
        <DrawLayer />
        <MeasureLayer />
        <LayerManager />
      </LeafletMapContainer>
      <ToolOverlay toolMode={toolMode} />
    </div>
  )
}
