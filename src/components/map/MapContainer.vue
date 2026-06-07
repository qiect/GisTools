<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, watch, computed, provide } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { useAppStore, drawTempPoints, measureTempPoints, getAllDrawFeaturesGeoJson } from '../../stores/appStore'
import type { DrawFeature } from '../../types'
import { calcDistance, calcArea, calcBearing } from '../../utils/measurement'
import SearchTool from '../tools/SearchTool.vue'
import ImportExport from '../tools/ImportExport.vue'
import CoordTransform from '../tools/CoordTransform.vue'
import SpatialAnalysis from '../tools/SpatialAnalysis.vue'
import VisualizationPanel from '../tools/VisualizationPanel.vue'
import BatchCoordTool from '../tools/BatchCoordTool.vue'

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
      const featProps = { ...properties, name: properties.name || `线 ${featureCounter}` }
      L.polyline(coordinates, { color: '#10b981', weight: 3 }).addTo(drawLayerGroup)
        .on('click', (ev: L.LeafletEvent) => {
          L.DomEvent.stopPropagation(ev)
          store.setSelectedFeature({ id, type: 'polyline', coordinates, properties: featProps, style: { color: '#10b981', weight: 3 } })
        })
      store.addDrawFeature({ id, type: 'polyline', coordinates, properties: featProps, style: { color: '#10b981', weight: 3 } })
    } else if (geometry.type === 'Polygon') {
      let coordinates: [number, number][] = (geometry.coordinates[0] as [number, number][]).map((c: [number, number]) => [c[1], c[0]] as [number, number])
      // 去除 GeoJSON 闭合点（首尾重复），避免后续转换时重复闭合
      if (coordinates.length >= 2) {
        const first = coordinates[0], last = coordinates[coordinates.length - 1]
        if (Math.abs(first[0] - last[0]) < 1e-10 && Math.abs(first[1] - last[1]) < 1e-10) {
          coordinates = coordinates.slice(0, -1)
        }
      }
      // 识别圆形（sub_type 为 circle 且有 radius 属性）
      const isCircle = properties.sub_type === 'circle' && properties.radius
      if (isCircle) {
        const radius = typeof properties.radius === 'number' ? properties.radius : 1000
        const center = coordinates[0]
        const featProps = { ...properties, name: properties.name || `圆 ${featureCounter}`, radius }
        L.circle(center, { radius, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
          .on('click', (ev: L.LeafletEvent) => {
            L.DomEvent.stopPropagation(ev)
            store.setSelectedFeature({ id, type: 'circle', coordinates: [center, center], properties: featProps, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
          })
        store.addDrawFeature({ id, type: 'circle', coordinates: [center, center], properties: featProps, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
      } else {
        const featProps = { ...properties, name: properties.name || `多边形 ${featureCounter}` }
        L.polygon(coordinates, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
          .on('click', (ev: L.LeafletEvent) => {
            L.DomEvent.stopPropagation(ev)
            store.setSelectedFeature({ id, type: 'polygon', coordinates, properties: featProps, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
          })
        store.addDrawFeature({ id, type: 'polygon', coordinates, properties: featProps, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
      }
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
  if (!isPolygonMode(mode)) return false
  return getTempPoints(mode).length >= getMinPoints(mode)
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

// 文字标注输入
const textInput = ref('')
const textInputVisible = ref(false)
const pendingTextLatlng = ref<[number, number] | null>(null)

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
    handleDblClickFinish(e)
  })

  // 地图点击事件
  map.on('click', (e: L.LeafletMouseEvent) => {
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

// ---- 多边形/面积 统一绘制引擎 ----
// 用延迟点击判断替代 dblclick pop 补偿，彻底解决双击闭合问题
const DBLCLICK_THRESHOLD = 250 // ms
let clickTimer: ReturnType<typeof setTimeout> | null = null
let pendingClickLatlng: [number, number] | null = null

// 需要双击完成的模式
const POLYGON_MODES = new Set(['draw-polygon', 'draw-polyline', 'measure-distance', 'measure-area'])

function isPolygonMode(mode: string): mode is 'draw-polygon' | 'draw-polyline' | 'measure-distance' | 'measure-area' {
  return POLYGON_MODES.has(mode)
}

function getTempPoints(mode: string): [number, number][] {
  return mode.startsWith('draw-') ? drawTempPoints : measureTempPoints
}

function getMinPoints(mode: string): number {
  return (mode === 'draw-polygon' || mode === 'measure-area') ? 3 : 2
}

// 延迟处理 click：若在阈值内收到 dblclick 则取消添加点并完成，否则正常添加
function handleDelayedClick(mode: string, latlng: [number, number]) {
  pendingClickLatlng = latlng
  if (clickTimer) clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    clickTimer = null
    pendingClickLatlng = null
    addPointAndPreview(mode, latlng)
  }, DBLCLICK_THRESHOLD)
}

// 添加点并更新预览 + 提示
function addPointAndPreview(mode: string, latlng: [number, number]) {
  const points = getTempPoints(mode)
  points.push(latlng)
  updatePreview(mode)
  const count = points.length
  const min = getMinPoints(mode)

  // 测量模式下实时显示测量值
  if (mode === 'measure-area' && count >= 3) {
    const result = calcArea(points as [number, number][])
    drawHint.value = `面积: ${result.value.toFixed(2)} ${result.unit}。双击完成测量，继续点击添加点`
  } else if (mode === 'measure-distance' && count >= 2) {
    const result = calcDistance(points as [number, number][])
    drawHint.value = `距离: ${result.value.toFixed(2)} ${result.unit}。双击完成测量，继续点击添加点`
  } else {
    drawHint.value = count < min
      ? `已点击 ${count} 个点，至少需要 ${min} 个点。继续点击添加点`
      : `已点击 ${count} 个点。双击完成${mode.startsWith('measure') ? '测量' : '绘制'}，继续点击添加点`
  }
}

// 统一更新预览
function updatePreview(mode: string) {
  if (!mapInstance.value) return
  clearPreview()
  const points = [...getTempPoints(mode)]
  if (points.length < 2) return

  const isDraw = mode.startsWith('draw-')
  const color = isDraw ? '#10b981' : '#f59e0b'
  const fillOpacity = isDraw ? 0.1 : 0.08

  if (mode === 'draw-polyline' || mode === 'measure-distance') {
    previewLayer = L.polyline(points, { color, weight: 2, dashArray: '4 4', opacity: 0.6 }).addTo(mapInstance.value)
  } else {
    previewLayer = L.polygon(points, { color, fillColor: color, fillOpacity, weight: 2, dashArray: '4 4' }).addTo(mapInstance.value)
  }
}

// 双击完成：将双击位置作为最后一个点加入，然后闭合
function handleDblClickFinish(e: L.LeafletMouseEvent) {
  const mode = store.toolMode
  if (!isPolygonMode(mode)) return

  // 取消延迟的 click（双击的两次 click 不应单独添加点）
  if (clickTimer) {
    clearTimeout(clickTimer)
    clickTimer = null
    pendingClickLatlng = null
  }

  // 双击位置作为最后一个点加入
  const dblClickLatlng: [number, number] = [e.latlng.lat, e.latlng.lng]
  const points = getTempPoints(mode)
  points.push(dblClickLatlng)

  const min = getMinPoints(mode)
  if (points.length < min) {
    drawHint.value = `至少需要 ${min} 个点才能完成`
    points.pop()
    return
  }

  if (mode === 'draw-polygon') finishDrawPolygon()
  else if (mode === 'draw-polyline') finishDrawPolyline()
  else if (mode === 'measure-area') finishMeasureArea()
  else if (mode === 'measure-distance') finishMeasureDistance()
}

// ---- 完成绘制 ----
function finishDrawPolygon() {
  if (drawTempPoints.length < 3) return
  const points = [...drawTempPoints]
  const id = `draw-${++featureCounter}`
  L.polygon(points, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
    .on('click', (ev: L.LeafletEvent) => {
      L.DomEvent.stopPropagation(ev)
      store.setSelectedFeature({ id, type: 'polygon', coordinates: points, properties: { name: `多边形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
    })
  store.addDrawFeature({ id, type: 'polygon', coordinates: points, properties: { name: `多边形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
  drawTempPoints.length = 0
  clearPreview()
  drawHint.value = '多边形已绘制'
  setTimeout(() => { drawHint.value = '' }, 2000)
}

function finishDrawPolyline() {
  if (drawTempPoints.length < 2) return
  const points = [...drawTempPoints]
  const id = `draw-${++featureCounter}`
  L.polyline(points, { color: '#10b981', weight: 3 }).addTo(drawLayerGroup)
    .on('click', (ev: L.LeafletEvent) => {
      L.DomEvent.stopPropagation(ev)
      store.setSelectedFeature({ id, type: 'polyline', coordinates: points, properties: { name: `线 ${featureCounter}` }, style: { color: '#10b981', weight: 3 } })
    })
  store.addDrawFeature({ id, type: 'polyline', coordinates: points, properties: { name: `线 ${featureCounter}` }, style: { color: '#10b981', weight: 3 } })
  drawTempPoints.length = 0
  clearPreview()
  drawHint.value = '线段已绘制'
  setTimeout(() => { drawHint.value = '' }, 2000)
}

function finishMeasureArea() {
  if (measureTempPoints.length < 3) return
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
  if (measureTempPoints.length < 2) return
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

// 地图点击事件
function handleMapClick(e: L.LeafletMouseEvent) {
  const mode = store.toolMode
  if (mode === 'pan') return

  const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]

  // 需要双击完成的模式：延迟添加点，避免与 dblclick 冲突
  if (isPolygonMode(mode)) {
    handleDelayedClick(mode, latlng)
    return
  }

  // 以下模式不需要双击完成，直接处理
  processClick(mode, latlng)
}

// 不需要双击完成的模式直接处理
function processClick(mode: string, latlng: [number, number]) {

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
    pendingTextLatlng.value = latlng
    textInput.value = ''
    textInputVisible.value = true
    return
  }

  // ---- 画矩形 ----
  if (mode === 'draw-rectangle') {
    drawTempPoints.push(latlng)
    if (drawTempPoints.length >= 2) {
      const id = `draw-${++featureCounter}`
      const bounds = L.latLngBounds(drawTempPoints[0], drawTempPoints[1])
      // 展开为4个角点，确保 GeoJSON Polygon 坐标有效
      const sw = bounds.getSouthWest()
      const ne = bounds.getNorthEast()
      const nw = bounds.getNorthWest()
      const se = bounds.getSouthEast()
      const corners: [number, number][] = [[nw.lat, nw.lng], [ne.lat, ne.lng], [se.lat, se.lng], [sw.lat, sw.lng]]
      L.rectangle(bounds, { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 }).addTo(drawLayerGroup)
        .on('click', (ev: L.LeafletEvent) => {
          L.DomEvent.stopPropagation(ev)
          store.setSelectedFeature({ id, type: 'rectangle', coordinates: corners, properties: { name: `矩形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
        })
      store.addDrawFeature({ id, type: 'rectangle', coordinates: corners, properties: { name: `矩形 ${featureCounter}` }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
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
        .on('click', (ev: L.LeafletEvent) => {
          L.DomEvent.stopPropagation(ev)
          store.setSelectedFeature({ id, type: 'circle', coordinates: points, properties: { name: `圆 ${featureCounter}`, radius }, style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 } })
        })
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

// 确认文字标注输入
function confirmTextInput() {
  if (!textInput.value.trim() || !pendingTextLatlng.value) {
    textInputVisible.value = false
    return
  }
  const text = textInput.value.trim()
  const latlng = pendingTextLatlng.value
  const id = `draw-${++featureCounter}`
  const marker = L.marker(latlng).addTo(drawLayerGroup)
  marker.bindTooltip(text, { permanent: true, direction: 'top', offset: [0, -20] }).openTooltip()
  marker.on('click', (ev: L.LeafletEvent) => {
    L.DomEvent.stopPropagation(ev)
    store.setSelectedFeature({ id, type: 'text', coordinates: latlng, properties: { text, name: text }, style: {} })
  })
  store.addDrawFeature({
    id, type: 'text', coordinates: latlng,
    properties: { text, name: text }, style: {},
  })
  textInputVisible.value = false
  pendingTextLatlng.value = null
}

// 鼠标移动实时预览
function handleMouseMove(e: L.LeafletMouseEvent) {
  const mode = store.toolMode
  if (!mapInstance.value) return
  const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]

  // 多边形/折线/测距/测面：使用统一预览 + 鼠标跟随点
  if (isPolygonMode(mode)) {
    const points = getTempPoints(mode)
    if (points.length > 0) {
      clearPreview()
      const allPoints = [...points, latlng]
      const isDraw = mode.startsWith('draw-')
      const color = isDraw ? '#10b981' : '#f59e0b'
      const fillOpacity = isDraw ? 0.1 : 0.08

      if (mode === 'draw-polyline' || mode === 'measure-distance') {
        previewLayer = L.polyline(allPoints, { color, weight: 2, dashArray: '4 4', opacity: 0.6 }).addTo(mapInstance.value)
      } else {
        previewLayer = L.polygon(allPoints, { color, fillColor: color, fillOpacity, weight: 2, dashArray: '4 4' }).addTo(mapInstance.value)
      }

      // 测量模式下鼠标移动时实时更新测量值
      if (mode === 'measure-area' && allPoints.length >= 3) {
        const result = calcArea(allPoints as [number, number][])
        drawHint.value = `面积: ${result.value.toFixed(2)} ${result.unit}。双击完成测量，继续点击添加点`
      } else if (mode === 'measure-distance' && allPoints.length >= 2) {
        const result = calcDistance(allPoints as [number, number][])
        drawHint.value = `距离: ${result.value.toFixed(2)} ${result.unit}。双击完成测量，继续点击添加点`
      }
    }
    return
  }

  // 绘制预览（矩形、圆等非双击完成模式）
  if (mode.startsWith('draw-') && drawTempPoints.length > 0 && mode !== 'draw-marker' && mode !== 'draw-text') {
    clearPreview()
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

  // 测方位角预览
  if (mode === 'measure-angle' && measureTempPoints.length > 0) {
    clearPreview()
    previewLayer = L.polyline([measureTempPoints[0], latlng], { color: '#f59e0b', weight: 2, dashArray: '4 4', opacity: 0.6 }).addTo(mapInstance.value)
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
    // 切换模式时清除延迟点击定时器
    if (clickTimer) {
      clearTimeout(clickTimer)
      clickTimer = null
      pendingClickLatlng = null
    }
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
    if (!layer.visible) return
    if (layer.type === 'geojson') {
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
    } else if (layer.type === 'heatmap') {
      // 从 GeoJSON 数据中提取点坐标用于热力图
      const points: [number, number, number][] = []
      const data = layer.data as any
      if (data.type === 'FeatureCollection') {
        data.features.forEach((f: any) => {
          if (f.geometry?.type === 'Point') {
            points.push([f.geometry.coordinates[1], f.geometry.coordinates[0], 1.0])
          } else if (f.geometry?.type === 'Polygon' || f.geometry?.type === 'LineString') {
            f.geometry.coordinates[0]?.forEach((c: number[]) => {
              points.push([c[1], c[0], 0.5])
            })
          }
        })
      } else if (data.type === 'Feature') {
        if (data.geometry?.type === 'Point') {
          points.push([data.geometry.coordinates[1], data.geometry.coordinates[0], 1.0])
        }
      }
      if (points.length > 0) {
        const radius = layer.style?.radius ?? 25
        ;(L as any).heatLayer(points, { radius, blur: 15, maxZoom: 17, gradient: { 0.4: '#00f', 0.6: '#0f0', 0.8: '#ff0', 1.0: '#f00' } }).addTo(geoLayerGroup)
      }
    } else if (layer.type === 'cluster') {
      // 从 GeoJSON 数据中提取点用于聚合显示
      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount()
          let cls = 'cluster-small'
          if (count > 100) cls = 'cluster-large'
          else if (count > 10) cls = 'cluster-medium'
          return L.divIcon({ html: `<div class="${cls}"><span>${count}</span></div>`, className: 'custom-cluster-icon', iconSize: L.point(40, 40) })
        }
      })
      const data = layer.data as any
      if (data.type === 'FeatureCollection') {
        data.features.forEach((f: any) => {
          if (f.geometry?.type === 'Point') {
            clusterGroup.addLayer(L.marker([f.geometry.coordinates[1], f.geometry.coordinates[0]]))
          }
        })
      }
      if (clusterGroup.getLayers().length > 0) {
        geoLayerGroup.addLayer(clusterGroup)
      }
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

    <!-- 文字标注输入 -->
    <div v-if="textInputVisible" class="absolute top-3 left-1/2 -translate-x-1/2 z-[1001]">
      <div class="bg-gray-800/95 backdrop-blur border border-emerald-600/50 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
        <input v-model="textInput" @keydown.enter="confirmTextInput" @keydown.escape="textInputVisible = false" type="text" placeholder="输入标注文字" class="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white outline-none focus:border-emerald-500 w-48" autofocus />
        <button @click="confirmTextInput" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-xs text-white">确定</button>
        <button @click="textInputVisible = false" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">取消</button>
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
      <!-- 分隔线 -->
      <div class="w-7 mx-auto border-t border-gray-600 my-0.5"></div>
      <!-- 测量工具 -->
      <button @click="store.setToolMode(store.toolMode === 'measure-distance' ? 'pan' : 'measure-distance')" class="w-9 h-9 rounded flex items-center justify-center transition-colors text-white" :class="store.toolMode === 'measure-distance' ? 'bg-emerald-600 border border-emerald-500' : 'bg-gray-800/90 backdrop-blur border border-gray-600 hover:bg-gray-700'" title="测距">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h5"/><path d="M17 12h5"/><path d="M7 12a5 5 0 0 1 10 0"/><path d="M2 12v3"/><path d="M22 12v3"/></svg>
      </button>
      <button @click="store.setToolMode(store.toolMode === 'measure-area' ? 'pan' : 'measure-area')" class="w-9 h-9 rounded flex items-center justify-center transition-colors text-white" :class="store.toolMode === 'measure-area' ? 'bg-emerald-600 border border-emerald-500' : 'bg-gray-800/90 backdrop-blur border border-gray-600 hover:bg-gray-700'" title="测面">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7 7"/><path d="M3 3v6"/><path d="M3 3h6"/><path d="M21 21l-7-7"/><path d="M21 21v-6"/><path d="M21 21h-6"/><rect x="7" y="7" width="10" height="10" rx="1" opacity="0.3"/></svg>
      </button>
      <button @click="store.setToolMode(store.toolMode === 'measure-angle' ? 'pan' : 'measure-angle')" class="w-9 h-9 rounded flex items-center justify-center transition-colors text-white" :class="store.toolMode === 'measure-angle' ? 'bg-emerald-600 border border-emerald-500' : 'bg-gray-800/90 backdrop-blur border border-gray-600 hover:bg-gray-700'" title="测方位角">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 8v4"/><path d="M12 12l4 4"/></svg>
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
