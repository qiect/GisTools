import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToolMode, GeoLayer, DrawFeature, MeasureResult } from '../types'

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
  }

  return {
    toolMode, layers, activeLayerId, drawFeatures, measureResults,
    sidebarOpen, propertyPanelOpen, geoEditorOpen, selectedFeature,
    setToolMode, addLayer, removeLayer, toggleLayerVisibility, updateLayerOpacity,
    setActiveLayerId, addDrawFeature, removeDrawFeature, addMeasureResult,
    clearMeasureResults, setSidebarOpen, setPropertyPanelOpen, setGeoEditorOpen, setSelectedFeature,
  }
})

// 临时绘制/测量点（非响应式）
export let drawTempPoints: [number, number][] = []
export let measureTempPoints: [number, number][] = []
