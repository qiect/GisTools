<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '../../stores/appStore'
import {
  bufferAnalysis, convexHullAnalysis, centerOfMass, centroidCalc,
  tinAnalysis, simplify, pointDistance, area, bearingCalc,
  destinationCalc, midpointCalc, bboxCalc, squareGrid, randomPoints,
} from '../../utils/spatial'
import type { GeoLayer } from '../../types'
import { Compass, Play, X } from 'lucide-vue-next'

type AnalysisType = 'buffer' | 'convex' | 'center' | 'centroid' | 'tin' | 'simplify'
  | 'distance' | 'area' | 'bearing' | 'destination' | 'midpoint' | 'bbox' | 'grid' | 'random'

const analysisOptions: { value: AnalysisType; label: string; desc: string; group: string }[] = [
  // 几何分析
  { value: 'buffer', label: '缓冲区分析', desc: '在要素周围创建指定距离的缓冲区', group: '几何分析' },
  { value: 'convex', label: '凸包分析', desc: '计算点集的凸包多边形', group: '几何分析' },
  { value: 'simplify', label: '简化几何', desc: '简化线/多边形，减少顶点数', group: '几何分析' },
  { value: 'bbox', label: '边界框计算', desc: '计算要素的包围矩形', group: '几何分析' },
  // 位置计算
  { value: 'center', label: '质心计算', desc: '计算要素集合的质心', group: '位置计算' },
  { value: 'centroid', label: '几何中心', desc: '计算要素的几何中心点', group: '位置计算' },
  { value: 'midpoint', label: '中点计算', desc: '计算两点之间的中点', group: '位置计算' },
  { value: 'destination', label: '终点推算', desc: '根据起点、方位角和距离推算终点', group: '位置计算' },
  // 测量计算
  { value: 'distance', label: '点距计算', desc: '精确计算两点之间的距离', group: '测量计算' },
  { value: 'area', label: '面积计算', desc: '精确计算多边形的面积', group: '测量计算' },
  { value: 'bearing', label: '方位角计算', desc: '计算从起点到终点的方位角', group: '测量计算' },
  // 网格与采样
  { value: 'tin', label: 'TIN 三角网', desc: '基于点集生成不规则三角网', group: '网格与采样' },
  { value: 'grid', label: '规则网格', desc: '在范围内生成规则方格网', group: '网格与采样' },
  { value: 'random', label: '随机点生成', desc: '在范围内生成随机点', group: '网格与采样' },
]

const groups = ['几何分析', '位置计算', '测量计算', '网格与采样']

const store = useAppStore()
const analysisType = ref<AnalysisType>('buffer')
const bufferRadius = ref('5')
const bufferUnit = ref<'kilometers' | 'miles' | 'meters'>('kilometers')
const simplifyTolerance = ref('0.01')
const gridCellSize = ref('10')
const gridUnit = ref<'kilometers' | 'miles' | 'meters'>('kilometers')
const randomCount = ref('50')
const destBearing = ref('45')
const destDistance = ref('10')
const destUnit = ref<'kilometers' | 'miles' | 'meters'>('kilometers')
const status = ref('')

// 点距/方位角/中点输入
const point1Lng = ref('116.4074')
const point1Lat = ref('39.9042')
const point2Lng = ref('121.4737')
const point2Lat = ref('31.2304')

function runAnalysis() {
  const geoLayers = store.layers.filter((l) => l.type === 'geojson')

  try {
    let result: any

    // 需要图层的分析
    if (['buffer', 'convex', 'center', 'centroid', 'tin', 'simplify', 'bbox'].includes(analysisType.value)) {
      if (geoLayers.length === 0) { status.value = '没有可分析的数据，请先导入或绘制要素'; return }
      const fc = {
        type: 'FeatureCollection' as const,
        features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
      }

      if (analysisType.value === 'buffer') result = bufferAnalysis(fc, parseFloat(bufferRadius.value), bufferUnit.value)
      else if (analysisType.value === 'convex') result = convexHullAnalysis(fc)
      else if (analysisType.value === 'center') result = centerOfMass(fc)
      else if (analysisType.value === 'centroid') result = centroidCalc(fc)
      else if (analysisType.value === 'tin') result = tinAnalysis(fc as any)
      else if (analysisType.value === 'simplify') result = simplify(fc as any, parseFloat(simplifyTolerance.value))
      else if (analysisType.value === 'bbox') {
        const bbox = bboxCalc(fc)
        const [west, south, east, north] = bbox
        result = {
          type: 'Feature',
          properties: { bbox: bbox.join(', ') },
          geometry: {
            type: 'Polygon',
            coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]]
          }
        }
      }
    }

    // 不需要图层的计算
    if (analysisType.value === 'distance') {
      const dist = pointDistance(
        [parseFloat(point1Lng.value), parseFloat(point1Lat.value)],
        [parseFloat(point2Lng.value), parseFloat(point2Lat.value)],
        bufferUnit.value
      )
      status.value = `两点距离: ${dist.toFixed(4)} ${bufferUnit.value}`
      return
    }

    if (analysisType.value === 'area') {
      if (geoLayers.length === 0) { status.value = '没有可计算的数据，请先导入多边形要素'; return }
      const fc = {
        type: 'FeatureCollection' as const,
        features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
      }
      const a = area(fc as any)
      const sqKm = a / 1e6
      status.value = `面积: ${sqKm < 0.01 ? (a).toFixed(2) + ' m²' : sqKm.toFixed(4) + ' km²'}`
      return
    }

    if (analysisType.value === 'bearing') {
      const b = bearingCalc(
        [parseFloat(point1Lng.value), parseFloat(point1Lat.value)],
        [parseFloat(point2Lng.value), parseFloat(point2Lat.value)]
      )
      const angle = b < 0 ? b + 360 : b
      status.value = `方位角: ${angle.toFixed(4)}°`
      return
    }

    if (analysisType.value === 'destination') {
      result = destinationCalc(
        [parseFloat(point1Lng.value), parseFloat(point1Lat.value)],
        parseFloat(destDistance.value),
        parseFloat(destBearing.value),
        destUnit.value
      )
    }

    if (analysisType.value === 'midpoint') {
      result = midpointCalc(
        [parseFloat(point1Lng.value), parseFloat(point1Lat.value)],
        [parseFloat(point2Lng.value), parseFloat(point2Lat.value)]
      )
    }

    if (analysisType.value === 'grid') {
      if (geoLayers.length === 0) { status.value = '请先导入数据以确定范围'; return }
      const fc = {
        type: 'FeatureCollection' as const,
        features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
      }
      const bbox = bboxCalc(fc)
      result = squareGrid(bbox as [number, number, number, number], parseFloat(gridCellSize.value), gridUnit.value)
    }

    if (analysisType.value === 'random') {
      let bbox: [number, number, number, number] | undefined
      if (geoLayers.length > 0) {
        const fc = {
          type: 'FeatureCollection' as const,
          features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
        }
        bbox = bboxCalc(fc) as [number, number, number, number]
      }
      result = randomPoints(parseInt(randomCount.value), bbox)
    }

    if (result) {
      const newLayer: GeoLayer = {
        id: `layer-${Date.now()}`,
        name: `${analysisOptions.find((a) => a.value === analysisType.value)?.label}结果`,
        visible: true, opacity: 0.8, zIndex: store.layers.length,
        data: result, type: 'geojson',
        style: { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 2 },
      }
      store.addLayer(newLayer)
      status.value = '分析完成，结果已添加为新图层'
    }
  } catch (err: any) {
    status.value = `分析失败: ${err.message}`
  }
}
</script>

<template>
  <div class="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[420px] max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Compass :size="16" class="text-emerald-400" />
          <h3 class="text-sm font-semibold">空间分析</h3>
        </div>
        <button @click="store.setToolMode('pan')" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"><X :size="16" /></button>
      </div>

      <div class="space-y-3">
        <!-- 分析类型分组 -->
        <div v-for="group in groups" :key="group">
          <div class="text-xs text-gray-500 uppercase tracking-wider mb-1 mt-2">{{ group }}</div>
          <div class="grid grid-cols-2 gap-1">
            <button
              v-for="opt in analysisOptions.filter(o => o.group === group)" :key="opt.value"
              @click="analysisType = opt.value"
              :class="['text-left px-2 py-1.5 rounded text-xs transition-colors', analysisType === opt.value ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/50' : 'bg-gray-900 text-gray-400 hover:bg-gray-700 border border-transparent']"
            >
              <div class="font-medium">{{ opt.label }}</div>
              <div class="text-[10px] text-gray-500 truncate">{{ opt.desc }}</div>
            </button>
          </div>
        </div>

        <!-- 缓冲区参数 -->
        <div v-if="analysisType === 'buffer'" class="flex gap-2">
          <div class="flex-1">
            <label class="text-xs text-gray-500">缓冲距离</label>
            <input v-model="bufferRadius" type="number" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono" />
          </div>
          <div class="w-28">
            <label class="text-xs text-gray-500">单位</label>
            <select v-model="bufferUnit" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option value="kilometers">公里</option>
              <option value="meters">米</option>
              <option value="miles">英里</option>
            </select>
          </div>
        </div>

        <!-- 简化参数 -->
        <div v-if="analysisType === 'simplify'">
          <label class="text-xs text-gray-500">容差（越大越简化）</label>
          <input v-model="simplifyTolerance" type="number" step="0.001" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono" />
        </div>

        <!-- 网格参数 -->
        <div v-if="analysisType === 'grid'" class="flex gap-2">
          <div class="flex-1">
            <label class="text-xs text-gray-500">格子大小</label>
            <input v-model="gridCellSize" type="number" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono" />
          </div>
          <div class="w-28">
            <label class="text-xs text-gray-500">单位</label>
            <select v-model="gridUnit" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option value="kilometers">公里</option>
              <option value="meters">米</option>
              <option value="miles">英里</option>
            </select>
          </div>
        </div>

        <!-- 随机点参数 -->
        <div v-if="analysisType === 'random'">
          <label class="text-xs text-gray-500">点数量</label>
          <input v-model="randomCount" type="number" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono" />
        </div>

        <!-- 两点输入（距离/方位角/中点） -->
        <div v-if="['distance', 'bearing', 'midpoint'].includes(analysisType)" class="space-y-2">
          <div class="text-xs text-gray-500">起点</div>
          <div class="flex gap-2">
            <input v-model="point1Lng" type="text" placeholder="经度" class="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
            <input v-model="point1Lat" type="text" placeholder="纬度" class="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
          </div>
          <div class="text-xs text-gray-500">终点</div>
          <div class="flex gap-2">
            <input v-model="point2Lng" type="text" placeholder="经度" class="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
            <input v-model="point2Lat" type="text" placeholder="纬度" class="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
          </div>
        </div>

        <!-- 终点推算参数 -->
        <div v-if="analysisType === 'destination'" class="space-y-2">
          <div class="text-xs text-gray-500">起点</div>
          <div class="flex gap-2">
            <input v-model="point1Lng" type="text" placeholder="经度" class="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
            <input v-model="point1Lat" type="text" placeholder="纬度" class="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
          </div>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-gray-500">方位角 (°)</label>
              <input v-model="destBearing" type="number" class="w-full mt-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
            </div>
            <div class="flex-1">
              <label class="text-xs text-gray-500">距离</label>
              <input v-model="destDistance" type="number" class="w-full mt-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs font-mono" />
            </div>
            <div class="w-20">
              <label class="text-xs text-gray-500">单位</label>
              <select v-model="destUnit" class="w-full mt-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs">
                <option value="kilometers">km</option>
                <option value="meters">m</option>
                <option value="miles">mi</option>
              </select>
            </div>
          </div>
        </div>

        <button @click="runAnalysis" class="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors">
          <Play :size="14" /> 执行分析
        </button>
        <p v-if="status" class="text-xs text-emerald-400 text-center">{{ status }}</p>
      </div>
    </div>
  </div>
</template>
