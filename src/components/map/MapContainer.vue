<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '../../stores/appStore'
import SearchTool from '../tools/SearchTool.vue'
import ImportExport from '../tools/ImportExport.vue'
import CoordTransform from '../tools/CoordTransform.vue'
import SpatialAnalysis from '../tools/SpatialAnalysis.vue'
import VisualizationPanel from '../tools/VisualizationPanel.vue'
import BatchCoordTool from '../tools/BatchCoordTool.vue'
import LayerManager from './LayerManager.vue'

const store = useAppStore()
const mapEl = ref<HTMLDivElement>()
const mapInstance = ref<L.Map | null>(null)

const basemaps: Record<string, { url: string; attribution: string; label: string }> = {
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; CartoDB', label: '暗色底图' },
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap', label: 'OpenStreetMap' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri', label: '卫星影像' },
  terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap', label: '地形图' },
}

let currentTileLayer: L.TileLayer | null = null
let activeBasemap = 'dark'

// 绘制图层
const drawLayerGroup = L.layerGroup()
const measureLayerGroup = L.layerGroup()
const geoLayerGroup = L.layerGroup()

// 共享给子组件的地图实例
function getMap(): L.Map | null {
  return mapInstance.value
}

// 暴露给子组件
provide('getMap', getMap)

import { provide } from 'vue'

const cursorClass = computed(() => {
  const mode = store.toolMode
  if (mode.startsWith('draw') || mode.startsWith('measure')) return 'cursor-crosshair'
  return 'cursor-grab'
})

onMounted(() => {
  if (!mapEl.value) return

  const map = L.map(mapEl.value, {
    center: [39.9042, 116.4074],
    zoom: 5,
    zoomControl: false,
  })

  currentTileLayer = L.tileLayer(basemaps.dark.url, { attribution: basemaps.dark.attribution }).addTo(map)
  drawLayerGroup.addTo(map)
  measureLayerGroup.addTo(map)
  geoLayerGroup.addTo(map)

  // 地图点击事件
  map.on('click', (e: L.LeafletMouseEvent) => {
    handleMapClick(e)
  })

  map.on('keydown', (e: any) => {
    if (e.originalEvent?.key === 'Escape') {
      store.setToolMode('pan')
    }
  })

  mapInstance.value = map
})

// 底图切换
function switchBasemap(key: string) {
  if (!mapInstance.value || !basemaps[key]) return
  if (currentTileLayer) mapInstance.value.removeLayer(currentTileLayer)
  currentTileLayer = L.tileLayer(basemaps[key].url, { attribution: basemaps[key].attribution }).addTo(mapInstance.value)
  activeBasemap = key
}

// 地图控件
function zoomIn() { mapInstance.value?.zoomIn() }
function zoomOut() { mapInstance.value?.zoomOut() }
function locateUser() { mapInstance.value?.locate({ setView: true, maxZoom: 16 }) }
function fitWorld() { mapInstance.value?.fitWorld() }

// 绘制逻辑
let featureCounter = 0

function handleMapClick(e: L.LeafletMouseEvent) {
  const mode = store.toolMode
  const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]

  if (mode === 'draw-marker') {
    const id = `draw-${++featureCounter}`
    const marker = L.marker(latlng).addTo(drawLayerGroup)
    marker.bindTooltip(`标注点 ${featureCounter}`).openTooltip()
    marker.on('click', () => {
      store.setSelectedFeature({
        id, type: 'marker', coordinates: latlng,
        properties: { name: `标注点 ${featureCounter}` }, style: {},
      })
    })
    store.addDrawFeature({
      id, type: 'marker', coordinates: latlng,
      properties: { name: `标注点 ${featureCounter}` }, style: {},
    })
    return
  }

  if (mode === 'draw-text') {
    const text = prompt('请输入标注文字：')
    if (!text) return
    const id = `draw-${++featureCounter}`
    const marker = L.marker(latlng).addTo(drawLayerGroup)
    marker.bindTooltip(text, { permanent: true }).openTooltip()
    store.addDrawFeature({
      id, type: 'text', coordinates: latlng,
      properties: { text, name: text }, style: {},
    })
    return
  }

  if (mode.startsWith('draw-')) {
    const { drawTempPoints } = await_import()
    drawTempPoints.push(latlng)
    const points = [...drawTempPoints]

    if (mode === 'draw-polyline' && points.length >= 2) {
      const id = `draw-${++featureCounter}`
      L.polyline(points, { color: '#10b981', weight: 3 }).addTo(drawLayerGroup)
      store.addDrawFeature({ id, type: 'polyline', coordinates: points, properties: { name: `线 ${featureCounter}` }, style: { color: '#10b981', weight: 3 } })
      drawTempPoints.length = 0
    }

    if (mode === 'draw-polygon' && points.length >= 3) {
      const id = `draw-${++featureCounter}`
      L.polygon(points, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
      store.addDrawFeature({ id, type: 'polygon', coordinates: points, properties: { name: `多边形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
      drawTempPoints.length = 0
    }

    if (mode === 'draw-rectangle' && points.length >= 2) {
      const id = `draw-${++featureCounter}`
      L.rectangle(points as L.LatLngBoundsExpression, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
      store.addDrawFeature({ id, type: 'rectangle', coordinates: points, properties: { name: `矩形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
      drawTempPoints.length = 0
    }
  }

  // 测量逻辑
  if (mode.startsWith('measure-')) {
    const { measureTempPoints } = await_import()
    measureTempPoints.push(latlng)
    const points = [...measureTempPoints]

    if (mode === 'measure-distance' && points.length >= 2) {
      const { calcDistance } = await_import_measurement()
      const result = calcDistance(points)
      L.polyline(points, { color: '#f59e0b', weight: 3, dashArray: '8 4' })
        .bindTooltip(`${result.value.toFixed(2)} ${result.unit}`, { permanent: true })
        .addTo(measureLayerGroup)
      store.addMeasureResult({ type: 'distance', value: result.value, unit: result.unit, coordinates: [...points] })
    }

    if (mode === 'measure-area' && points.length >= 3) {
      const { calcArea } = await_import_measurement()
      const result = calcArea(points)
      L.polygon(points, { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2, dashArray: '8 4' })
        .bindTooltip(`${result.value.toFixed(2)} ${result.unit}`, { permanent: true })
        .addTo(measureLayerGroup)
      store.addMeasureResult({ type: 'area', value: result.value, unit: result.unit, coordinates: [...points] })
    }

    if (mode === 'measure-angle' && points.length === 2) {
      const { calcBearing } = await_import_measurement()
      const bearing = calcBearing(points[0], points[1])
      const angle = bearing < 0 ? bearing + 360 : bearing
      store.addMeasureResult({ type: 'angle', value: angle, unit: '°', coordinates: [...points] })
      measureTempPoints.length = 0
    }
  }
}

function await_import() {
  // 动态引用模块级变量
  return { drawTempPoints, measureTempPoints }
}

function await_import_measurement() {
  return { calcDistance, calcArea, calcBearing }
}

import { calcDistance, calcArea, calcBearing } from '../../utils/measurement'
import { drawTempPoints, measureTempPoints } from '../../stores/appStore'

// 监听 toolMode 变化清空临时点
watch(() => store.toolMode, (newMode, oldMode) => {
  if (newMode !== oldMode) {
    drawTempPoints.length = 0
    measureTempPoints.length = 0
  }
  if (newMode.startsWith('measure')) {
    store.clearMeasureResults()
    measureLayerGroup.clearLayers()
    store.setPropertyPanelOpen(true)
  }
})

// 监听图层变化
watch(() => store.layers, (newLayers) => {
  geoLayerGroup.clearLayers()
  newLayers.forEach((layer) => {
    if (layer.visible && layer.type === 'geojson') {
      L.geoJSON(layer.data, {
        style: () => ({
          color: layer.style?.color || '#10b981',
          fillColor: layer.style?.fillColor || '#10b981',
          fillOpacity: layer.style?.fillOpacity ?? 0.3,
          weight: layer.style?.weight ?? 2,
          opacity: layer.opacity,
        }),
      }).addTo(geoLayerGroup)
    }
  })
}, { deep: true })

const showBasemapSwitcher = ref(false)
</script>

<template>
  <div :class="['w-full h-full relative', cursorClass]">
    <div ref="mapEl" class="w-full h-full"></div>

    <!-- 地图控件 -->
    <div class="absolute top-3 right-3 z-[1000] flex flex-col gap-1">
      <button @click="zoomIn" class="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white" title="放大">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button @click="zoomOut" class="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white" title="缩小">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button @click="locateUser" class="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white" title="定位">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
      </button>
      <button @click="fitWorld" class="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white" title="全局视图">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
      </button>
    </div>

    <!-- 底图切换 -->
    <div class="absolute bottom-6 right-3 z-[1000]">
      <div class="relative">
        <button @click="showBasemapSwitcher = !showBasemapSwitcher" class="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors text-white" title="切换底图">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 7-7 7 7"/><path d="m3 18 7-7 7 7"/></svg>
        </button>
        <div v-if="showBasemapSwitcher" class="absolute bottom-11 right-0 bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-2 min-w-[140px]">
          <button
            v-for="(bm, key) in basemaps" :key="key"
            @click="switchBasemap(key); showBasemapSwitcher = false"
            :class="['w-full text-left px-3 py-1.5 rounded text-sm transition-colors', activeBasemap === key ? 'bg-emerald-600/30 text-emerald-400' : 'text-gray-300 hover:bg-gray-700']"
          >
            {{ bm.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 图层管理 -->
    <LayerManager />

    <!-- 工具面板 -->
    <div class="absolute inset-0 pointer-events-none z-[1000]">
      <div class="pointer-events-auto">
        <SearchTool v-if="store.toolMode === 'search'" />
        <ImportExport v-if="store.toolMode === 'import-export'" />
        <CoordTransform v-if="store.toolMode === 'coord-transform'" />
        <SpatialAnalysis v-if="store.toolMode === 'spatial-analysis'" />
        <VisualizationPanel v-if="store.toolMode === 'visualization'" />
        <BatchCoordTool v-if="store.toolMode === 'batch-coord'" />
      </div>
    </div>
  </div>
</template>
