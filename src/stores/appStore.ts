import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ToolMode, GeoLayer, DrawFeature, MeasureResult } from '../types'

// 将绘制要素转为 GeoJSON Feature
export function drawFeatureToGeoJson(feature: DrawFeature): any {
  const { type, coordinates, properties } = feature
  if (type === 'marker' || type === 'text') {
    const coords = coordinates as [number, number]
    return { type: 'Feature', properties, geometry: { type: 'Point', coordinates: [coords[1], coords[0]] } }
  }
  if (type === 'polyline') {
    const coords = coordinates as [number, number][]
    return { type: 'Feature', properties, geometry: { type: 'LineString', coordinates: coords.map(([lat, lng]) => [lng, lat]) } }
  }
  if (type === 'polygon' || type === 'rectangle') {
    const coords = coordinates as [number, number][]
    const ring = coords.map(([lat, lng]) => [lng, lat])
    ring.push(ring[0]) // 闭合 LinearRing
    return { type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: [ring] } }
  }
  if (type === 'circle') {
    const coords = coordinates as [number, number][]
    const center = coords[0] // [lat, lng]
    const radius = properties?.radius ?? 1000
    // 将圆近似为64边多边形（GeoJSON标准Polygon）
    const segments = 64
    const ring: [number, number][] = []
    for (let i = 0; i < segments; i++) {
      const angle = (2 * Math.PI * i) / segments
      // 使用 Haversine 近似计算圆周上的点
      const dLat = (radius * Math.cos(angle)) / 111320
      const dLng = (radius * Math.sin(angle)) / (111320 * Math.cos(center[0] * Math.PI / 180))
      ring.push([center[1] + dLng, center[0] + dLat]) // [lng, lat]
    }
    ring.push(ring[0]) // 闭合 LinearRing
    return { type: 'Feature', properties: { ...properties, sub_type: 'circle' }, geometry: { type: 'Polygon', coordinates: [ring] } }
  }
  return null
}

// 获取所有绘制要素的 GeoJSON FeatureCollection
export function getAllDrawFeaturesGeoJson(features: DrawFeature[]): any {
  return {
    type: 'FeatureCollection',
    features: features.map(drawFeatureToGeoJson).filter(Boolean),
  }
}

export const useAppStore = defineStore('app', () => {
  const toolMode = ref<ToolMode>('pan')
  const layers = ref<GeoLayer[]>([])
  const activeLayerId = ref<string | null>(null)
  const drawFeatures = ref<DrawFeature[]>([])
  const measureResults = ref<MeasureResult[]>([])
  const sidebarOpen = ref(true)
  const propertyPanelOpen = ref(false)
  const geoEditorOpen = ref(false)
  const selectedFeature = ref<DrawFeature | null>(null)

  // GeoJSON 编辑器写入待应用的 GeoJSON，MapContainer 监听并执行
  const pendingGeoJsonToApply = ref<any>(null)

  function setToolMode(mode: ToolMode) {
    toolMode.value = mode
  }
  function addLayer(layer: GeoLayer) {
    layers.value.push(layer)
  }
  function removeLayer(id: string) {
    layers.value = layers.value.filter((l) => l.id !== id)
  }
  function toggleLayerVisibility(id: string) {
    const layer = layers.value.find((l) => l.id === id)
    if (layer) layer.visible = !layer.visible
  }
  function updateLayerOpacity(id: string, opacity: number) {
    const layer = layers.value.find((l) => l.id === id)
    if (layer) layer.opacity = opacity
  }
  function setActiveLayerId(id: string | null) {
    activeLayerId.value = id
  }
  function addDrawFeature(feature: DrawFeature) {
    drawFeatures.value.push(feature)
    geoEditorOpen.value = true
  }
  function removeDrawFeature(id: string) {
    drawFeatures.value = drawFeatures.value.filter((f) => f.id !== id)
  }
  function addMeasureResult(result: MeasureResult) {
    measureResults.value.push(result)
  }
  function clearMeasureResults() {
    measureResults.value = []
  }
  function setSidebarOpen(open: boolean) {
    sidebarOpen.value = open
  }
  function setPropertyPanelOpen(open: boolean) {
    propertyPanelOpen.value = open
  }
  function setGeoEditorOpen(open: boolean) {
    geoEditorOpen.value = open
  }
  function setSelectedFeature(feature: DrawFeature | null) {
    selectedFeature.value = feature
    if (feature) propertyPanelOpen.value = true
  }
  function requestApplyGeoJson(geojson: any) {
    pendingGeoJsonToApply.value = geojson
  }

  return {
    toolMode, layers, activeLayerId, drawFeatures, measureResults,
    sidebarOpen, propertyPanelOpen, geoEditorOpen, selectedFeature,
    pendingGeoJsonToApply,
    setToolMode, addLayer, removeLayer, toggleLayerVisibility, updateLayerOpacity,
    setActiveLayerId, addDrawFeature, removeDrawFeature, addMeasureResult,
    clearMeasureResults, setSidebarOpen, setPropertyPanelOpen, setGeoEditorOpen,
    setSelectedFeature, requestApplyGeoJson,
  }
})

// 临时绘制/测量点（非响应式）
export let drawTempPoints: [number, number][] = []
export let measureTempPoints: [number, number][] = []
