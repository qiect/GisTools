<script setup lang="ts">
import { ref, inject } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { useGeocoding } from '../../composables/useGeocoding'
import { Search, MapPin, Loader2, X } from 'lucide-vue-next'
import type L from 'leaflet'

const store = useAppStore()
const getMap = inject<() => L.Map | null>('getMap')!
const { results, loading, search } = useGeocoding()
const query = ref('')

function handleSearch() {
  if (query.value.trim()) search(query.value.trim())
}

function handleSelect(lat: string, lon: string) {
  getMap()?.setView([parseFloat(lat), parseFloat(lon)], 14)
}

function handleCoordSearch() {
  const match = query.value.match(/^(-?\d+\.?\d*)\s*[,，\s]\s*(-?\d+\.?\d*)$/)
  if (match) {
    const [, lat, lng] = match
    getMap()?.setView([parseFloat(lat), parseFloat(lng)], 14)
  }
}
</script>

<template>
  <div class="absolute top-3 left-1/2 -translate-x-1/2 w-96">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl">
      <div class="flex items-center gap-2 p-2">
        <Search :size="16" class="text-gray-400 shrink-0" />
        <input
          v-model="query"
          @keydown.enter="handleSearch"
          type="text"
          placeholder="搜索地址或输入坐标（纬度, 经度）"
          class="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
        />
        <button @click="handleCoordSearch" class="text-xs text-emerald-400 hover:text-emerald-300 shrink-0">坐标定位</button>
        <button @click="handleSearch" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors shrink-0">
          <Loader2 v-if="loading" :size="14" class="animate-spin" />
          <span v-else>搜索</span>
        </button>
        <button @click="store.setToolMode('pan')" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white shrink-0">
          <X :size="14" />
        </button>
      </div>
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
