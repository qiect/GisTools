import type { GeoJsonObject } from 'geojson'

export type CoordSystem = 'WGS84' | 'GCJ02' | 'BD09' | 'UTM' | 'CGCS2000'

export interface LayerStyle {
  color?: string
  weight?: number
  fillColor?: string
  fillOpacity?: number
  radius?: number
}

export interface GeoLayer {
  id: string
  name: string
  visible: boolean
  opacity: number
  zIndex: number
  data: GeoJsonObject
  style?: LayerStyle
  type: 'marker' | 'geojson' | 'heatmap' | 'cluster'
}

export interface DrawFeature {
  id: string
  type: 'marker' | 'polyline' | 'polygon' | 'rectangle' | 'circle' | 'text'
  coordinates: [number, number][] | [number, number]
  properties: Record<string, unknown>
  style: LayerStyle
}

export interface MeasureResult {
  type: 'distance' | 'area' | 'angle'
  value: number
  unit: string
  coordinates: [number, number][]
}

export type ToolMode =
  | 'pan'
  | 'draw-marker'
  | 'draw-polyline'
  | 'draw-polygon'
  | 'draw-rectangle'
  | 'draw-circle'
  | 'draw-text'
  | 'measure-angle'
  | 'search'
  | 'import-export'
  | 'coord-transform'
  | 'spatial-analysis'
  | 'visualization'
  | '3d-terrain'
  | 'batch-coord'
  | 'gpx-viewer'
  | 'layers'
