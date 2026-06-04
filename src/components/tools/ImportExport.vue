<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { parseGeoJSON, parseKML, parseCSV, exportGeoJSON, downloadFile } from '../../utils/dataIO'
import type { GeoLayer } from '../../types'
import { Upload, FileJson, X } from 'lucide-vue-next'

const store = useAppStore()
const status = ref('')
const fileInputKey = ref(0) // 用于重置 input

async function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    let data
    if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) data = parseGeoJSON(text)
    else if (file.name.endsWith('.kml')) data = parseKML(text)
    else if (file.name.endsWith('.csv')) data = parseCSV(text)
    else { status.value = '不支持的文件格式'; return }

    const layer: GeoLayer = {
      id: `layer-${Date.now()}`, name: file.name.replace(/\.[^.]+$/, ''),
      visible: true, opacity: 1, zIndex: store.layers.length,
      data, type: 'geojson',
      style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3, weight: 2 },
    }
    store.addLayer(layer)
    status.value = `已导入: ${file.name}`
  } catch (err: any) {
    status.value = `导入失败: ${err.message}`
  }

  // 重置 input 以允许重复导入同一文件
  fileInputKey.value++
}

function handleExport() {
  const geoLayers = store.layers.filter((l) => l.type === 'geojson')
  if (geoLayers.length === 0) { status.value = '没有可导出的图层'; return }
  const fc = {
    type: 'FeatureCollection' as const,
    features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
  }
  downloadFile(exportGeoJSON(fc), 'export.geojson', 'application/geo+json')
  status.value = '导出成功'
}
</script>

<template>
  <div class="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[320px]">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold">数据导入导出</h3>
        <button @click="store.setToolMode('pan')" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white">
          <X :size="16" />
        </button>
      </div>
      <div class="space-y-3">
        <div>
          <input :key="fileInputKey" type="file" accept=".geojson,.json,.kml,.csv" @change="handleImport" class="hidden" :id="'file-input-' + fileInputKey" />
          <button @click="document.getElementById('file-input-' + fileInputKey)?.click()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-600 rounded-lg hover:border-emerald-500 transition-colors text-sm">
            <Upload :size="16" /> 导入文件（GeoJSON / KML / CSV）
          </button>
        </div>
        <button @click="handleExport" class="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors">
          <FileJson :size="14" /> 导出 GeoJSON
        </button>
        <p v-if="status" class="text-xs text-gray-400 text-center">{{ status }}</p>
      </div>
    </div>
  </div>
</template>
