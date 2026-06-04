<script setup lang="ts">
import { ref } from 'vue'
import { wgs84ToGcj02, gcj02ToWgs84, gcj02ToBd09, bd09ToGcj02 } from '../../utils/coordinate'
import { downloadFile } from '../../utils/dataIO'
import { Navigation, Download, Copy } from 'lucide-vue-next'

type ChinaCoordSystem = 'WGS84' | 'GCJ02' | 'BD09'

const systems: { value: ChinaCoordSystem; label: string }[] = [
  { value: 'WGS84', label: 'WGS 84' },
  { value: 'GCJ02', label: 'GCJ-02' },
  { value: 'BD09', label: 'BD-09' },
]

const input = ref('116.4074,39.9042\n121.4737,31.2304\n113.2644,23.1291')
const fromSystem = ref<ChinaCoordSystem>('WGS84')
const toSystem = ref<ChinaCoordSystem>('GCJ02')
const results = ref<string[]>([])

function convertPoint(lng: number, lat: number, from: ChinaCoordSystem, to: ChinaCoordSystem): [number, number] {
  if (from === to) return [lng, lat]
  if (from === 'WGS84' && to === 'GCJ02') return wgs84ToGcj02(lng, lat)
  if (from === 'GCJ02' && to === 'WGS84') return gcj02ToWgs84(lng, lat)
  if (from === 'GCJ02' && to === 'BD09') return gcj02ToBd09(lng, lat)
  if (from === 'BD09' && to === 'GCJ02') return bd09ToGcj02(lng, lat)
  if (from === 'WGS84' && to === 'BD09') return gcj02ToBd09(...wgs84ToGcj02(lng, lat))
  if (from === 'BD09' && to === 'WGS84') return gcj02ToWgs84(...bd09ToGcj02(lng, lat))
  return [lng, lat]
}

function handleConvert() {
  const lines = input.value.trim().split('\n').filter(Boolean)
  results.value = lines.map((line) => {
    const parts = line.trim().split(/[,，\s]+/)
    const lng = parseFloat(parts[0])
    const lat = parseFloat(parts[1])
    if (isNaN(lng) || isNaN(lat)) return `无效: ${line}`
    const [rLng, rLat] = convertPoint(lng, lat, fromSystem.value, toSystem.value)
    return `${rLng.toFixed(8)}, ${rLat.toFixed(8)}`
  })
}

function handleExport() {
  downloadFile(results.value.join('\n'), 'batch_convert_result.csv', 'text/csv')
}

function handleCopy() {
  navigator.clipboard.writeText(results.value.join('\n'))
}
</script>

<template>
  <div class="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[440px]">
      <div class="flex items-center gap-2 mb-3">
        <Navigation :size="16" class="text-emerald-400" />
        <h3 class="text-sm font-semibold">批量坐标转换</h3>
      </div>
      <div class="space-y-3">
        <div class="flex gap-2">
          <div class="flex-1">
            <label class="text-xs text-gray-500">源坐标系</label>
            <select v-model="fromSystem" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option v-for="s in systems" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="text-xs text-gray-500">目标坐标系</label>
            <select v-model="toSystem" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option v-for="s in systems" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-gray-500">输入坐标（每行一个，格式: 经度,纬度）</label>
            <textarea v-model="input" rows="8" class="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono resize-none" />
          </div>
          <div>
            <label class="text-xs text-gray-500">转换结果</label>
            <textarea :value="results.join('\n')" readonly rows="8" class="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono text-emerald-400 resize-none" />
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="handleConvert" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors">批量转换</button>
          <button @click="handleCopy" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"><Copy :size="14" /></button>
          <button @click="handleExport" class="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"><Download :size="14" /></button>
        </div>
      </div>
    </div>
  </div>
</template>
