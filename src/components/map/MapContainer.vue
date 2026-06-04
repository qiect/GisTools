<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore, drawTempPoints, measureTempPoints, getAllDrawFeaturesGeoJson } from '../../stores/appStore'
import type { DrawFeature } from '../../types'
import { calcDistance, calcArea, calcBearing } from '../../utils/measurement'
import SearchTool from '../tools/SearchTool.vue'
import ImportExport from '../tools/ImportExport.vue'
import CoordTransform from '../tools/CoordTransform.vue'
import SpatialAnalysis from '../tools/SpatialAnalysis.vue'
import VisualizationPanel from '../tools/VisualizationPanel.vue'
import BatchCoordTool from '../tools/BatchCoordTool.vue'
import LayerManager from './LayerManager.vue'

// 修复 Leaflet 默认 marker icon 404 问题
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const store = useAppStore()
const mapEl = ref<HTMLDivElement>()
const mapInstance = shallowRef<L.Map | null>(null)

const basemaps: Record<string, { url: string; attribution: string; label: string }> = {
  osm: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap', label: 'OpenStreetMap' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', attribution: '&copy; CartoDB', label: '暗色底图' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri', label: '卫星影像' },
  terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap', label: '地形图' },
}

let currentTileLayer: L.TileLayer | null = null
const activeBasemap = ref('osm')

// 绘制/测量图层
let drawLayerGroup: L.LayerGroup
let measureLayerGroup: L.LayerGroup
let geoLayerGroup: L.LayerGroup

// 实时预览图层
let previewLayer: L.Layer | null = null

// 右键菜单
const contextMenu = ref<{ x: number; y: number; latlng: [number, number]; visible: boolean }>({ x: 0, y: 0, latlng: [0, 0], visible: false })

// Toast 提示
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, duration = 2000) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, duration)
}

// 从 GeoJSON 更新绘制要素
function applyGeoJsonToDrawFeatures(geojson: any) {
  if (!mapInstance.value) return
  drawLayerGroup.clearLayers()
  store.drawFeatures.splice(0, store.drawFeatures.length)

  const fc = geojson.type === 'FeatureCollection' ? geojson : { type: 'FeatureCollection', features: [geojson] }
  for (const feature of fc.features) {
    if (!feature.geometry) continue
    const id = `draw-${++featureCounter}`
    const { geometry, properties = {} } = feature

    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates
      const latlng: [number, number] = [lat, lng]
      const isCircle = properties.sub_type === 'circle' || properties.radius
      if (isCircle && properties.radius) {
        const radius = typeof properties.radius === 'number' ? properties.radius : 1000
        L.circle(latlng, { radius, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
        store.addDrawFeature({ id, type: 'circle', coordinates: [latlng, latlng], properties: { ...properties, name: properties.name || `圆 ${featureCounter}`, radius }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
      } else {
        const marker = L.marker(latlng).addTo(drawLayerGroup)
        marker.bindTooltip(properties.name || `标注点 ${featureCounter}`, { permanent: false }).openTooltip()
        marker.on('click', (ev: L.LeafletEvent) => {
          L.DomEvent.stopPropagation(ev)
          store.setSelectedFeature({ id, type: 'marker', coordinates: latlng, properties: { ...properties, name: properties.name || `标注点 ${featureCounter}` }, style: {} })
          store.setPropertyPanelOpen(true)
        })
        store.addDrawFeature({ id, type: 'marker', coordinates: latlng, properties: { ...properties, name: properties.name || `标注点 ${featureCounter}` }, style: {} })
      }
    } else if (geometry.type === 'LineString') {
      const coordinates: [number, number][] = (geometry.coordinates as [number, number][]).map((c: [number, number]) => [c[1], c[0]] as [number, number])
      L.polyline(coordinates, { color: '#10b981', weight: 3 }).addTo(drawLayerGroup)
      store.addDrawFeature({ id, type: 'polyline', coordinates, properties: { ...properties, name: properties.name || `线 ${featureCounter}` }, style: { color: '#10b981', weight: 3 } })
    } else if (geometry.type === 'Polygon') {
      const coordinates: [number, number][] = (geometry.coordinates[0] as [number, number][]).map((c: [number, number]) => [c[1], c[0]] as [number, number])
      L.polygon(coordinates, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
      store.addDrawFeature({ id, type: 'polygon', coordinates, properties: { ...properties, name: properties.name || `多边形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
    }
  }
}

// 共享地图实例给子组件
function getMap(): L.Map | null {
  return mapInstance.value
}
provide('getMap', getMap)
provide('showToast', showToast)

// 监听编辑器请求应用 GeoJSON
watch(() => store.pendingGeoJsonToApply, (geojson) => {
  if (geojson) {
    applyGeoJsonToDrawFeatures(geojson)
    store.pendingGeoJsonToApply = null
  }
})

const cursorClass = computed(() => {
  const mode = store.toolMode
  if (mode.startsWith('draw') || mode.startsWith('measure')) return 'cursor-crosshair'
  return 'cursor-grab'
})

const canFinish = computed(() => {
  const mode = store.toolMode
  if (mode === 'draw-polygon' && drawTempPoints.length >= 3) return true
  if (mode === 'draw-polyline' && drawTempPoints.length >= 2) return true
  if (mode === 'measure-area' && measureTempPoints.length >= 3) return true
  if (mode === 'measure-distance' && measureTempPoints.length >= 2) return true
  return false
})

function finishCurrent() {
  const mode = store.toolMode
  if (mode === 'draw-polygon') finishDrawPolygon()
  else if (mode === 'draw-polyline') finishDrawPolyline()
  else if (mode === 'measure-area') finishMeasureArea()
  else if (mode === 'measure-distance') finishMeasureDistance()
}

// 绘制提示信息
const drawHint = ref('')

onMounted(() => {
  if (!mapEl.value) return

  drawLayerGroup = L.layerGroup()
  measureLayerGroup = L.layerGroup()
  geoLayerGroup = L.layerGroup()

  const map = L.map(mapEl.value, {
    center: [39.9042, 116.4074],
    zoom: 5,
    zoomControl: false,
  })

  currentTileLayer = L.tileLayer(basemaps.osm.url, { attribution: basemaps.osm.attribution }).addTo(map)
  drawLayerGroup.addTo(map)
  measureLayerGroup.addTo(map)
  geoLayerGroup.addTo(map)

  // 禁用默认双击缩放，以便双击用于完成绘制
  map.doubleClickZoom.disable()

  // 双击完成绘制/测量
  map.on('dblclick', (e: L.LeafletMouseEvent) => {
    e.originalEvent.preventDefault()
    handleDblClick(e)
  })

  // 地图点击事件
  map.on('click', (e: L.LeafletMouseEvent) => {
    // 关闭右键菜单
    contextMenu.value.visible = false
    handleMapClick(e)
  })

  // 鼠标移动 - 实时预览
  map.on('mousemove', (e: L.LeafletMouseEvent) => {
    handleMouseMove(e)
  })

  // 右键菜单
  map.on('contextmenu', (e: L.LeafletMouseEvent) => {
    e.originalEvent.preventDefault()
    contextMenu.value = {
      x: e.containerPoint.x,
      y: e.containerPoint.y,
      latlng: [e.latlng.lat, e.latlng.lng],
      visible: true,
    }
  })

  // 点击其他区域关闭右键菜单
  map.on('zoomstart movestart', () => {
    contextMenu.value.visible = false
  })

  // ESC 退出工具模式
  map.getContainer().addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      store.setToolMode('pan')
      contextMenu.value.visible = false
    }
  })

  // 定位错误处理
  map.on('locationerror', (e) => {
    showToast(`定位失败: ${e.message}`)
  })

  map.on('locationfound', (e) => {
    showToast(`已定位到当前位置，精度: ${e.accuracy.toFixed(0)}m`)
  })

  mapInstance.value = map
})

// 点击外部关闭右键菜单
function handleMapWrapperClick(e: MouseEvent) {
  if (contextMenu.value.visible) {
    contextMenu.value.visible = false
  }
}

// 底图切换
function switchBasemap(key: string) {
  if (!mapInstance.value || !basemaps[key]) return
  if (currentTileLayer) mapInstance.value.removeLayer(currentTileLayer)
  currentTileLayer = L.tileLayer(basemaps[key].url, { attribution: basemaps[key].attribution }).addTo(mapInstance.value)
  activeBasemap.value = key
}

// 地图控件
function zoomIn() { mapInstance.value?.zoomIn() }
function zoomOut() { mapInstance.value?.zoomOut() }
function locateUser() {
  if (!mapInstance.value) return
  mapInstance.value.locate({ setView: true, maxZoom: 16, timeout: 10000 })
}
function fitWorld() { mapInstance.value?.fitWorld() }

// 绘制逻辑
let featureCounter = 0

// 完成绘制（双击或按 Enter 闭合）
function finishDrawPolygon() {
  if (drawTempPoints.length < 3) {
    drawHint.value = '至少需要 3 个点才能完成多边形'
    return
  }
  const points = [...drawTempPoints]
  const id = `draw-${++featureCounter}`
  L.polygon(points, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
  store.addDrawFeature({ id, type: 'polygon', coordinates: points, properties: { name: `多边形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
  drawTempPoints.length = 0
  clearPreview()
  drawHint.value = '多边形已绘制'
  setTimeout(() => { drawHint.value = '' }, 2000)
}

function finishDrawPolyline() {
  if (drawTempPoints.length < 2) {
    drawHint.value = '至少需要 2 个点才能完成线段'
    return
  }
  const points = [...drawTempPoints]
  const id = `draw-${++featureCounter}`
  L.polyline(points, { color: '#10b981', weight: 3 }).addTo(drawLayerGroup)
  store.addDrawFeature({ id, type: 'polyline', coordinates: points, properties: { name: `线 ${featureCounter}` }, style: { color: '#10b981', weight: 3 } })
  drawTempPoints.length = 0
  clearPreview()
  drawHint.value = '线段已绘制'
  setTimeout(() => { drawHint.value = '' }, 2000)
}

function finishMeasureArea() {
  if (measureTempPoints.length < 3) {
    drawHint.value = '至少需要 3 个点才能完成面积测量'
    return
  }
  const points = [...measureTempPoints]
  measureLayerGroup.clearLayers()
  const result = calcArea(points)
  L.polygon(points, { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2, dashArray: '8 4' })
    .bindTooltip(`${result.value.toFixed(2)} ${result.unit}`, { permanent: true })
    .addTo(measureLayerGroup)
  store.clearMeasureResults()
  store.addMeasureResult({ type: 'area', value: result.value, unit: result.unit, coordinates: [...points] })
  measureTempPoints.length = 0
  clearPreview()
  drawHint.value = `面积: ${result.value.toFixed(2)} ${result.unit}`
  setTimeout(() => { drawHint.value = '' }, 3000)
}

function finishMeasureDistance() {
  if (measureTempPoints.length < 2) {
    drawHint.value = '至少需要 2 个点才能完成距离测量'
    return
  }
  const points = [...measureTempPoints]
  measureLayerGroup.clearLayers()
  const result = calcDistance(points)
  L.polyline(points, { color: '#f59e0b', weight: 3, dashArray: '8 4' })
    .bindTooltip(`${result.value.toFixed(2)} ${result.unit}`, { permanent: true })
    .addTo(measureLayerGroup)
  store.clearMeasureResults()
  store.addMeasureResult({ type: 'distance', value: result.value, unit: result.unit, coordinates: [...points] })
  measureTempPoints.length = 0
  clearPreview()
  drawHint.value = `距离: ${result.value.toFixed(2)} ${result.unit}`
  setTimeout(() => { drawHint.value = '' }, 3000)
}

function handleDblClick(_e: L.LeafletMouseEvent) {
  const mode = store.toolMode
  const points = mode.startsWith('draw-') ? drawTempPoints : measureTempPoints

  // Remove the point added by the second click of the double-click
  if (points.length > 0) points.pop()
  // Also remove the point added by the first click if it's a duplicate of the previous point
  if (points.length >= 2) {
    const last = points[points.length - 1]
    const prev = points[points.length - 2]
    if (Math.abs(last[0] - prev[0]) < 0.0001 && Math.abs(last[1] - prev[1]) < 0.0001) {
      points.pop()
    }
  }

  if (mode === 'measure-area' && measureTempPoints.length >= 3) finishMeasureArea()
  else if (mode === 'draw-polygon' && drawTempPoints.length >= 3) finishDrawPolygon()
  else if (mode === 'draw-polyline' && drawTempPoints.length >= 2) finishDrawPolyline()
  else if (mode === 'measure-distance' && measureTempPoints.length >= 2) finishMeasureDistance()
}

function handleMapClick(e: L.LeafletMouseEvent) {
  const mode = store.toolMode
  if (mode === 'pan') return

  const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]

  // ---- 标注点 ----
  if (mode === 'draw-marker') {
    const id = `draw-${++featureCounter}`
    const marker = L.marker(latlng).addTo(drawLayerGroup)
    marker.bindTooltip(`标注点 ${featureCounter}`, { permanent: false }).openTooltip()
    marker.on('click', (ev: L.LeafletEvent) => {
      L.DomEvent.stopPropagation(ev)
      store.setSelectedFeature({
        id, type: 'marker', coordinates: latlng,
        properties: { name: `标注点 ${featureCounter}` }, style: {},
      })
      store.setPropertyPanelOpen(true)
    })
    store.addDrawFeature({
      id, type: 'marker', coordinates: latlng,
      properties: { name: `标注点 ${featureCounter}` }, style: {},
    })
    drawHint.value = '标注点已添加'
    setTimeout(() => { drawHint.value = '' }, 2000)
    return
  }

  // ---- 文字标注 ----
  if (mode === 'draw-text') {
    const text = prompt('请输入标注文字：')
    if (!text) return
    const id = `draw-${++featureCounter}`
    const marker = L.marker(latlng).addTo(drawLayerGroup)
    marker.bindTooltip(text, { permanent: true, direction: 'top', offset: [0, -20] }).openTooltip()
    store.addDrawFeature({
      id, type: 'text', coordinates: latlng,
      properties: { text, name: text }, style: {},
    })
    return
  }

  // ---- 画线（双击完成）----
  if (mode === 'draw-polyline') {
    drawTempPoints.push(latlng)
    drawHint.value = `已点击 ${drawTempPoints.length} 个点。双击完成绘制，继续点击添加点`
    return
  }

  // ---- 画多边形（双击完成）----
  if (mode === 'draw-polygon') {
    drawTempPoints.push(latlng)
    const count = drawTempPoints.length
    if (count < 3) {
      drawHint.value = `已点击 ${count} 个点，至少需要 3 个点。继续点击添加点`
    } else {
      drawHint.value = `已点击 ${count} 个点。双击完成绘制，继续点击添加点`
    }
    return
  }

  // ---- 画矩形 ----
  if (mode === 'draw-rectangle') {
    drawTempPoints.push(latlng)
    if (drawTempPoints.length >= 2) {
      const points = [...drawTempPoints]
      const id = `draw-${++featureCounter}`
      const bounds = L.latLngBounds(points[0], points[1])
      L.rectangle(bounds, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
      store.addDrawFeature({ id, type: 'rectangle', coordinates: points, properties: { name: `矩形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
      drawTempPoints.length = 0
      clearPreview()
      drawHint.value = '矩形已绘制'
      setTimeout(() => { drawHint.value = '' }, 2000)
    } else {
      drawHint.value = '已点击 1 个点，再点击确定对角点'
    }
    return
  }

  // ---- 画圆 ----
  if (mode === 'draw-circle') {
    drawTempPoints.push(latlng)
    if (drawTempPoints.length >= 2) {
      const points = [...drawTempPoints]
      const id = `draw-${++featureCounter}`
      const center = L.latLng(points[0])
      const edge = L.latLng(points[1])
      const radius = center.distanceTo(edge)
      L.circle(points[0], { radius, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
      store.addDrawFeature({ id, type: 'circle', coordinates: points, properties: { name: `圆 ${featureCounter}`, radius }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
      drawTempPoints.length = 0
      clearPreview()
      drawHint.value = '圆已绘制'
      setTimeout(() => { drawHint.value = '' }, 2000)
    } else {
      drawHint.value = '已点击圆心，再点击确定半径'
    }
    return
  }

  // ---- 测距（双击完成）----
  if (mode === 'measure-distance') {
    measureTempPoints.push(latlng)
    const points = [...measureTempPoints]
    if (points.length >= 2) {
      measureLayerGroup.clearLayers()
      const result = calcDistance(points)
      L.polyline(points, { color: '#f59e0b', weight: 3, dashArray: '8 4' })
        .bindTooltip(`${result.value.toFixed(2)} ${result.unit}`, { permanent: true })
        .addTo(measureLayerGroup)
      store.clearMeasureResults()
      store.addMeasureResult({ type: 'distance', value: result.value, unit: result.unit, coordinates: [...points] })
    }
    drawHint.value = `已点击 ${measureTempPoints.length} 个点。双击完成测量，继续点击添加点`
    return
  }

  // ---- 测面（双击完成）----
  if (mode === 'measure-area') {
    measureTempPoints.push(latlng)
    const points = [...measureTempPoints]
    if (points.length >= 3) {
      measureLayerGroup.clearLayers()
      const result = calcArea(points)
      L.polygon(points, { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2, dashArray: '8 4' })
        .bindTooltip(`${result.value.toFixed(2)} ${result.unit}`, { permanent: true })
        .addTo(measureLayerGroup)
      store.clearMeasureResults()
      store.addMeasureResult({ type: 'area', value: result.value, unit: result.unit, coordinates: [...points] })
    }
    const count = measureTempPoints.length
    if (count < 3) {
      drawHint.value = `已点击 ${count} 个点，至少需要 3 个点。继续点击添加点`
    } else {
      drawHint.value = `已点击 ${count} 个点。双击完成测量，继续点击添加点`
    }
    return
  }

  // ---- 测方位角（两点，实时预览）----
  if (mode === 'measure-angle') {
    measureTempPoints.push(latlng)
    const points = [...measureTempPoints]

    if (points.length === 1) {
      drawHint.value = '已选择起点，请点击终点'
      // 添加起点标记
      measureLayerGroup.clearLayers()
      L.circleMarker(points[0], { radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }).addTo(measureLayerGroup)
    }

    if (points.length >= 2) {
      measureLayerGroup.clearLayers()
      const bearing = calcBearing(points[0], points[1])
      const angle = bearing < 0 ? bearing + 360 : bearing
      // 绘制起点、终点和连线
      L.circleMarker(points[0], { radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }).addTo(measureLayerGroup)
      L.circleMarker(points[1], { radius: 5, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }).addTo(measureLayerGroup)
      L.polyline(points, { color: '#f59e0b', weight: 3, dashArray: '8 4' })
        .bindTooltip(`方位角: ${angle.toFixed(2)}°`, { permanent: true })
        .addTo(measureLayerGroup)
      store.clearMeasureResults()
      store.addMeasureResult({ type: 'angle', value: angle, unit: '°', coordinates: [points[0], points[1]] })
      measureTempPoints.length = 0
      clearPreview()
      drawHint.value = `方位角: ${angle.toFixed(2)}°`
      setTimeout(() => { drawHint.value = '' }, 3000)
    }
    return
  }
}

// 鼠标移动实时预览
function handleMouseMove(e: L.LeafletMouseEvent) {
  const mode = store.toolMode
  if (!mapInstance.value) return
  const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]

  // 绘制预览
  if (mode.startsWith('draw-') && drawTempPoints.length > 0 && mode !== 'draw-marker' && mode !== 'draw-text') {
    clearPreview()
    const points = [...drawTempPoints, latlng]

    if (mode === 'draw-polyline' && points.length >= 2) {
      previewLayer = L.polyline(points, { color: '#10b981', weight: 2, dashArray: '4 4', opacity: 0.6 }).addTo(mapInstance.value)
    }
    if (mode === 'draw-polygon' && points.length >= 2) {
      previewLayer = L.polygon(points, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 2, dashArray: '4 4' }).addTo(mapInstance.value)
    }
    if (mode === 'draw-rectangle' && drawTempPoints.length >= 1) {
      const bounds = L.latLngBounds(drawTempPoints[0], latlng)
      previewLayer = L.rectangle(bounds, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 2, dashArray: '4 4' }).addTo(mapInstance.value)
    }
    if (mode === 'draw-circle' && drawTempPoints.length >= 1) {
      const center = L.latLng(drawTempPoints[0])
      const radius = center.distanceTo(e.latlng)
      previewLayer = L.circle(drawTempPoints[0], { radius, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 2, dashArray: '4 4' }).addTo(mapInstance.value)
    }
  }

  // 测量预览
  if (mode.startsWith('measure-') && measureTempPoints.length > 0) {
    clearPreview()
    const points = [...measureTempPoints, latlng]

    if (mode === 'measure-distance' && points.length >= 2) {
      previewLayer = L.polyline(points, { color: '#f59e0b', weight: 2, dashArray: '4 4', opacity: 0.6 }).addTo(mapInstance.value)
    }
    if (mode === 'measure-area' && points.length >= 2) {
      previewLayer = L.polygon(points, { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.08, weight: 2, dashArray: '4 4' }).addTo(mapInstance.value)
    }
    if (mode === 'measure-angle' && points.length >= 2) {
      previewLayer = L.polyline([measureTempPoints[0], latlng], { color: '#f59e0b', weight: 2, dashArray: '4 4', opacity: 0.6 }).addTo(mapInstance.value)
    }
  }
}

function clearPreview() {
  if (previewLayer && mapInstance.value) {
    mapInstance.value.removeLayer(previewLayer)
    previewLayer = null
  }
}

// 监听 toolMode 变化
watch(() => store.toolMode, (newMode, oldMode) => {
  if (newMode !== oldMode) {
    drawTempPoints.length = 0
    measureTempPoints.length = 0
    clearPreview()
  }
  if (newMode.startsWith('measure')) {
    store.clearMeasureResults()
    measureLayerGroup?.clearLayers()
    store.setPropertyPanelOpen(true)
    if (newMode === 'measure-angle') {
      drawHint.value = '点击地图选择起点'
    } else if (newMode === 'measure-area') {
      drawHint.value = '点击地图添加测量点，双击完成'
    } else {
      drawHint.value = '点击地图添加测量点，双击完成'
    }
  } else if (newMode.startsWith('draw-')) {
    if (newMode === 'draw-polygon') {
      drawHint.value = '点击地图开始绘制，双击完成'
    } else if (newMode === 'draw-polyline') {
      drawHint.value = '点击地图开始绘制，双击完成'
    } else {
      drawHint.value = '点击地图开始绘制'
    }
  } else {
    drawHint.value = ''
  }
})

// 监听图层变化 - 重新渲染 GeoJSON 图层
watch(() => [...store.layers], (newLayers) => {
  if (!geoLayerGroup) return
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
        pointToLayer: (_feature, latlng) => {
          return L.marker(latlng)
        },
      }).addTo(geoLayerGroup)
    }
  })
}, { deep: true })

// 右键菜单操作
function contextAddMarker() {
  const latlng = contextMenu.value.latlng
  contextMenu.value.visible = false
  const id = `draw-${++featureCounter}`
  const marker = L.marker(latlng).addTo(drawLayerGroup)
  marker.bindTooltip(`标注点 ${featureCounter}`, { permanent: false }).openTooltip()
  marker.on('click', (ev: L.LeafletEvent) => {
    L.DomEvent.stopPropagation(ev)
    store.setSelectedFeature({
      id, type: 'marker', coordinates: latlng,
      properties: { name: `标注点 ${featureCounter}` }, style: {},
    })
    store.setPropertyPanelOpen(true)
  })
  store.addDrawFeature({
    id, type: 'marker', coordinates: latlng,
    properties: { name: `标注点 ${featureCounter}` }, style: {},
  })
  showToast('标注点已添加')
}

function contextCopyCoords() {
  const [lat, lng] = contextMenu.value.latlng
  contextMenu.value.visible = false
  const text = `${lng.toFixed(8)}, ${lat.toFixed(8)}`
  navigator.clipboard.writeText(text).then(() => {
    showToast(`坐标已复制: ${text}`)
  })
}

function contextStartMeasure() {
  const latlng = contextMenu.value.latlng
  contextMenu.value.visible = false
  store.setToolMode('measure-distance')
  // 需要等 mode 切换后再添加点
  setTimeout(() => {
    measureTempPoints.push(latlng)
    drawHint.value = '已选择起点，继续点击添加测量点，双击完成'
  }, 50)
}

function contextZoomIn() {
  contextMenu.value.visible = false
  mapInstance.value?.zoomIn()
}

function contextZoomOut() {
  contextMenu.value.visible = false
  mapInstance.value?.zoomOut()
}

function contextCenterHere() {
  const latlng = contextMenu.value.latlng
  contextMenu.value.visible = false
  mapInstance.value?.setView(latlng, mapInstance.value.getZoom())
}

const showBasemapSwitcher = ref(false)
</script>

<template>
  <div :class="['w-full h-full relative', cursorClass]" @click="handleMapWrapperClick">
    <div ref="mapEl" class="w-full h-full"></div>

    <!-- Toast 提示 -->
    <div v-if="toastMsg" class="absolute top-14 left-1/2 -translate-x-1/2 z-[1002]">
      <div class="bg-emerald-600/95 backdrop-blur border border-emerald-400/50 rounded-lg px-4 py-2 text-sm text-white shadow-lg animate-fade-in">
        {{ toastMsg }}
      </div>
    </div>

    <!-- 绘制/测量提示 -->
    <div v-if="drawHint" class="absolute top-3 left-1/2 -translate-x-1/2 z-[1001]">
      <div class="bg-gray-800/95 backdrop-blur border border-emerald-600/50 rounded-lg px-4 py-2 text-sm text-emerald-400 shadow-lg flex items-center gap-2">
        <span>{{ drawHint }}</span>
        <button v-if="canFinish" @click="finishCurrent" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs text-white transition-colors">完成</button>
        <span class="text-gray-500">按 ESC 退出</span>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="absolute z-[1002] bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl py-1 min-w-[160px]"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <button @click="contextAddMarker" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        添加标注点
      </button>
      <button @click="contextCopyCoords" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        复制坐标
      </button>
      <button @click="contextStartMeasure" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h5"/><path d="M17 12h5"/><path d="M12 2v5"/><path d="M12 17v5"/></svg>
        从此点测距
      </button>
      <div class="border-t border-gray-700 my-1"></div>
      <button @click="contextCenterHere" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/></svg>
        居中到此位置
      </button>
      <button @click="contextZoomIn" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        放大
      </button>
      <button @click="contextZoomOut" class="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        缩小
      </button>
    </div>

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

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-in;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
