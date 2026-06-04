<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { transformCoord, wgs84ToGcj02, gcj02ToWgs84, gcj02ToBd09, bd09ToGcj02 } from '../../utils/coordinate'
import { Crosshair, ArrowRightLeft, Copy, X } from 'lucide-vue-next'

type ChinaCoordSystem = 'WGS84' | 'GCJ02' | 'BD09'

const chinaSystems: { value: ChinaCoordSystem; label: string }[] = [
  { value: 'WGS84', label: 'WGS 84（GPS）' },
  { value: 'GCJ02', label: 'GCJ-02（高德/腾讯）' },
  { value: 'BD09', label: 'BD-09（百度）' },
]

const epsgSystems = [
  { value: 'EPSG:4326', label: 'WGS 84' },
  { value: 'EPSG:4490', label: 'CGCS2000' },
  { value: 'EPSG:3857', label: 'Web Mercator' },
  { value: 'EPSG:32650', label: 'UTM 50N' },
  { value: 'EPSG:32651', label: 'UTM 51N' },
]

const store = useAppStore()
const tab = ref<'china' | 'epsg'>('china')
const inputLng = ref('116.4074')
const inputLat = ref('39.9042')
const fromSystem = ref<ChinaCoordSystem>('WGS84')
const toSystem = ref<ChinaCoordSystem>('GCJ02')
const fromEpsg = ref('EPSG:4326')
const toEpsg = ref('EPSG:3857')
const result = ref<[number, number] | null>(null)
const copyFeedback = ref(false)

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
  const lng = parseFloat(inputLng.value)
  const lat = parseFloat(inputLat.value)
  if (isNaN(lng) || isNaN(lat)) return
  if (tab.value === 'china') {
    result.value = convertPoint(lng, lat, fromSystem.value, toSystem.value)
  } else {
    result.value = transformCoord([lng, lat], fromEpsg.value, toEpsg.value)
  }
}

function copyResult() {
  if (result.value) {
    navigator.clipboard.writeText(`${result.value[0]}, ${result.value[1]}`)
    copyFeedback.value = true
    setTimeout(() => { copyFeedback.value = false }, 1500)
  }
}
</script>

<template>
  <div class="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[380px]">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Crosshair :size="16" class="text-emerald-400" />
          <h3 class="text-sm font-semibold">坐标系转换</h3>
        </div>
        <button @click="store.setToolMode('pan')" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"><X :size="16" /></button>
      </div>

      <div class="flex gap-1 mb-3 bg-gray-900 rounded p-0.5">
        <button @click="tab = 'china'" :class="['flex-1 text-xs py-1.5 rounded transition-colors', tab === 'china' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white']">国测局坐标系</button>
        <button @click="tab = 'epsg'" :class="['flex-1 text-xs py-1.5 rounded transition-colors', tab === 'epsg' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white']">EPSG 投影转换</button>
      </div>

      <div class="space-y-3">
        <div class="flex gap-2">
          <div class="flex-1">
            <label class="text-xs text-gray-500">经度 / X</label>
            <input v-model="inputLng" type="text" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono" />
          </div>
          <div class="flex-1">
            <label class="text-xs text-gray-500">纬度 / Y</label>
            <input v-model="inputLat" type="text" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex-1">
            <label class="text-xs text-gray-500">源坐标系</label>
            <select v-if="tab === 'china'" v-model="fromSystem" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option v-for="s in chinaSystems" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <select v-else v-model="fromEpsg" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option v-for="s in epsgSystems" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <ArrowRightLeft :size="16" class="text-gray-500 mt-5" />
          <div class="flex-1">
            <label class="text-xs text-gray-500">目标坐标系</label>
            <select v-if="tab === 'china'" v-model="toSystem" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option v-for="s in chinaSystems" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <select v-else v-model="toEpsg" class="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm">
              <option v-for="s in epsgSystems" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>

        <button @click="handleConvert" class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors">转换</button>

        <div v-if="result" class="flex items-center gap-2 bg-gray-900 rounded px-3 py-2">
          <span class="text-sm font-mono text-emerald-400 flex-1">{{ result[0].toFixed(8) }}, {{ result[1].toFixed(8) }}</span>
          <button @click="copyResult" class="text-gray-400 hover:text-white">
            <Copy v-if="!copyFeedback" :size="14" />
            <span v-else class="text-emerald-400 text-xs">已复制</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
