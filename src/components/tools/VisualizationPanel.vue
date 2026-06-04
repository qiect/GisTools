<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/appStore'
import type { GeoLayer } from '../../types'
import { BarChart3, Play, X } from 'lucide-vue-next'

type VizType = 'heatmap' | 'cluster' | 'choropleth'

const vizOptions: { value: VizType; label: string }[] = [
  { value: 'heatmap', label: '热力图' },
  { value: 'cluster', label: '聚合显示' },
  { value: 'choropleth', label: '分级着色' },
]

const store = useAppStore()
const vizType = ref<VizType>('heatmap')
const radius = ref(25)
const status = ref('')

function runViz() {
  const geoLayers = store.layers.filter((l) => l.type === 'geojson')
  if (geoLayers.length === 0) { status.value = '没有可用的数据'; return }
  const newLayer: GeoLayer = {
    id: `layer-viz-${Date.now()}`,
    name: vizOptions.find((v) => v.value === vizType.value)?.label || '',
    visible: true, opacity: 1, zIndex: store.layers.length,
    data: geoLayers[0].data,
    type: vizType.value === 'heatmap' ? 'heatmap' : vizType.value === 'cluster' ? 'cluster' : 'geojson',
    style: { radius: radius.value },
  }
  store.addLayer(newLayer)
  status.value = '可视化图层已添加'
}
</script>

<template>
  <div class="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[340px]">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <BarChart3 :size="16" class="text-emerald-400" />
          <h3 class="text-sm font-semibold">数据可视化</h3>
        </div>
        <button @click="store.setToolMode('pan')" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"><X :size="16" /></button>
      </div>
      <div class="space-y-3">
        <div class="grid grid-cols-3 gap-1">
          <button v-for="opt in vizOptions" :key="opt.value" @click="vizType = opt.value"
            :class="['px-2 py-2 rounded text-xs transition-colors', vizType === opt.value ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/50' : 'bg-gray-900 text-gray-400 hover:text-white border border-transparent']">
            {{ opt.label }}
          </button>
        </div>
        <div v-if="vizType === 'heatmap'">
          <label class="text-xs text-gray-500">热力半径: {{ radius }}</label>
          <input v-model.number="radius" type="range" min="5" max="60" class="w-full mt-1 accent-emerald-500" />
        </div>
        <button @click="runViz" class="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors">
          <Play :size="14" /> 生成可视化
        </button>
        <p v-if="status" class="text-xs text-gray-400 text-center">{{ status }}</p>
      </div>
    </div>
  </div>
</template>
