<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { bufferAnalysis, convexHullAnalysis, centerOfMass } from '../../utils/spatial'
import type { GeoLayer } from '../../types'
import { Compass, Play } from 'lucide-vue-next'

type AnalysisType = 'buffer' | 'convex' | 'center' | 'voronoi' | 'tin'

const analysisOptions: { value: AnalysisType; label: string; desc: string }[] = [
  { value: 'buffer', label: '缓冲区分析', desc: '在要素周围创建指定距离的缓冲区' },
  { value: 'convex', label: '凸包分析', desc: '计算点集的凸包多边形' },
  { value: 'center', label: '质心计算', desc: '计算要素集合的质心' },
  { value: 'voronoi', label: '泰森多边形', desc: '基于点集生成 Voronoi 图' },
  { value: 'tin', label: 'TIN 三角网', desc: '基于点集生成不规则三角网' },
]

const store = useAppStore()
const analysisType = ref<AnalysisType>('buffer')
const bufferRadius = ref('5')
const bufferUnit = ref<'kilometers' | 'miles' | 'meters'>('kilometers')
const status = ref('')

function runAnalysis() {
  const geoLayers = store.layers.filter((l) => l.type === 'geojson')
  if (geoLayers.length === 0) { status.value = '没有可分析的数据，请先导入或绘制要素'; return }

  try {
    const fc = {
      type: 'FeatureCollection' as const,
      features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
    }

    let result: any
    if (analysisType.value === 'buffer') result = bufferAnalysis(fc, parseFloat(bufferRadius.value), bufferUnit.value)
    else if (analysisType.value === 'convex') result = convexHullAnalysis(fc)
    else if (analysisType.value === 'center') result = centerOfMass(fc)

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
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[380px]">
      <div class="flex items-center gap-2 mb-3">
        <Compass :size="16" class="text-emerald-400" />
        <h3 class="text-sm font-semibold">空间分析</h3>
      </div>
      <div class="space-y-3">
        <div>
          <label class="text-xs text-gray-500">分析类型</label>
          <div class="mt-1 space-y-1">
            <button
              v-for="opt in analysisOptions" :key="opt.value"
              @click="analysisType = opt.value"
              :class="['w-full text-left px-3 py-2 rounded text-sm transition-colors', analysisType === opt.value ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/50' : 'bg-gray-900 text-gray-300 hover:bg-gray-700 border border-transparent']"
            >
              <div class="font-medium">{{ opt.label }}</div>
              <div class="text-xs text-gray-500">{{ opt.desc }}</div>
            </button>
          </div>
        </div>

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

        <button @click="runAnalysis" class="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors">
          <Play :size="14" /> 执行分析
        </button>
        <p v-if="status" class="text-xs text-gray-400 text-center">{{ status }}</p>
      </div>
    </div>
  </div>
</template>
