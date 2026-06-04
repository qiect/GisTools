<script setup lang="ts">
import { ref, inject } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useGeocoding } from '../../composables/useGeocoding'
import { Search, MapPin, Loader2, X } from 'lucide-vue-next'
import L from 'leaflet'

const store = useAppStore()
const getMap = inject<() => L.Map | null>('getMap')!
const { results, loading, search } = useGeocoding()
const query = ref('')
const status = ref('')

let searchMarker: L.Marker | null = null

function handleSearch() {
  if (query.value.trim()) search(query.value.trim())
}

function handleSelect(lat: string, lon: string) {
  const map = getMap()
  if (!map) return
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lon)
  map.setView([latNum, lngNum], 14)
  // 添加定位标记
  if (searchMarker) map.removeLayer(searchMarker)
  searchMarker = L.marker([latNum, lngNum]).addTo(map)
  searchMarker.bindTooltip(`${latNum.toFixed(4)}, ${lngNum.toFixed(4)}`, { permanent: false }).openTooltip()
  status.value = ''
}

function handleCoordSearch() {
  const q = query.value.trim()
  // 支持多种格式：纬度,经度 或 经度,纬度
  const match = q.match(/^(-?\d+\.?\d*)\s*[,，\s]\s*(-?\d+\.?\d*)$/)
  if (!match) {
    status.value = '坐标格式错误，请输入：纬度,经度（如 39.9,116.4）'
    return
  }
  let [, v1, v2] = match
  let lat = parseFloat(v1)
  let lng = parseFloat(v2)
  // 如果纬度绝对值>90，说明用户输入的是 经度,纬度 格式，自动交换
  if (Math.abs(lat) > 90) {
    ;[lat, lng] = [lng, lat]
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    status.value = '坐标超出范围（纬度-90~90，经度-180~180）'
    return
  }
  const map = getMap()
  if (!map) return
  map.setView([lat, lng], 14)
  if (searchMarker) map.removeLayer(searchMarker)
  searchMarker = L.marker([lat, lng]).addTo(map)
  searchMarker.bindTooltip(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, { permanent: false }).openTooltip()
  status.value = `已定位: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
</script>

<template>
  <div class="absolute top-3 left-1/2 -translate-x-1/2 w-96 z-[1000]">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl">
      <div class="flex items-center gap-2 p-2">
        <Search :size="16" class="text-gray-400 shrink-0" />
        <input
          v-model="query"
          @keydown.enter="handleSearch"
          type="text"
          placeholder="搜索地址或输入坐标（如 39.9,116.4）"
          class="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
        />
        <button @click="handleCoordSearch" class="text-xs text-emerald-400 hover:text-emerald-300 shrink-0 whitespace-nowrap">坐标定位</button>
        <button @click="handleSearch" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors shrink-0">
          <Loader2 v-if="loading" :size="14" class="animate-spin" />
          <span v-else>搜索</span>
        </button>
        <button @click="store.setToolMode('pan')" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white shrink-0">
          <X :size="14" />
        </button>
      </div>
      <div v-if="status" class="px-3 py-1.5 text-xs text-emerald-400 border-t border-gray-700">{{ status }}</div>
      <div v-if="results.length > 0" class="border-t border-gray-700 max-h-60 overflow-y-auto">
        <button
          v-for="(r, i) in results" :key="i"
          @click="handleSelect(r.lat, r.lon)"
          class="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-300 flex items-start gap-2"
        >
          <MapPin :size="14" class="text-emerald-400 shrink-0 mt-0.5" />
          <span class="line-clamp-2">{{ r.display_name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
