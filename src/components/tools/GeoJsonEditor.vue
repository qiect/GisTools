<script setup lang="ts">
import { ref, watch, inject } from 'vue'
import { useAppStore } from '../../stores/appStore'
import { FileJson, Play, RotateCcw, Copy, Check, X } from 'lucide-vue-next'

const store = useAppStore()
const getAllDrawFeaturesGeoJson = inject<() => any>('getAllDrawFeaturesGeoJson')
const applyGeoJsonToDrawFeatures = inject<(geojson: any) => void>('applyGeoJsonToDrawFeatures')

const editorText = ref('')
const errorMsg = ref('')
const copyFeedback = ref(false)

// 获取当前可编辑的 GeoJSON
function getCurrentGeoJson(): string {
  // 所有绘制要素
  if (store.drawFeatures.length > 0 && getAllDrawFeaturesGeoJson) {
    const fc = getAllDrawFeaturesGeoJson()
    if (fc.features.length > 0) return JSON.stringify(fc, null, 2)
  }

  // 导入的图层
  const geoLayers = store.layers.filter((l) => l.type === 'geojson')
  if (geoLayers.length > 0) {
    const fc = {
      type: 'FeatureCollection' as const,
      features: geoLayers.flatMap((l: any) => (l.data as any).features || [l.data]),
    }
    return JSON.stringify(fc, null, 2)
  }

  return '{\n  "type": "FeatureCollection",\n  "features": []\n}'
}

// 初始化编辑器内容
function resetEditor() {
  editorText.value = getCurrentGeoJson()
  errorMsg.value = ''
}

// 应用 GeoJSON 到地图
function applyGeoJson() {
  try {
    const parsed = JSON.parse(editorText.value)
    if (!parsed.type) {
      errorMsg.value = '无效的 GeoJSON：缺少 type 字段'
      return
    }

    if (applyGeoJsonToDrawFeatures) {
      applyGeoJsonToDrawFeatures(parsed)
      errorMsg.value = ''
    } else {
      errorMsg.value = '地图组件未就绪'
    }
  } catch (e: any) {
    errorMsg.value = `JSON 解析错误: ${e.message}`
  }
}

// 格式化 JSON
function formatJson() {
  try {
    const parsed = JSON.parse(editorText.value)
    editorText.value = JSON.stringify(parsed, null, 2)
    errorMsg.value = ''
  } catch (e: any) {
    errorMsg.value = `JSON 格式化失败: ${e.message}`
  }
}

// 复制到剪贴板
function copyToClipboard() {
  navigator.clipboard.writeText(editorText.value).then(() => {
    copyFeedback.value = true
    setTimeout(() => { copyFeedback.value = false }, 1500)
  })
}

// 监听绘制要素变化，自动更新编辑器
watch(() => [...store.drawFeatures], () => {
  if (getAllDrawFeaturesGeoJson) {
    const fc = getAllDrawFeaturesGeoJson()
    if (fc.features.length > 0) {
      editorText.value = JSON.stringify(fc, null, 2)
    }
  }
})

// 监听图层变化
watch(() => [...store.layers], () => {
  if (store.drawFeatures.length === 0) {
    resetEditor()
  }
})

// 初始化
resetEditor()
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
      <div class="flex items-center gap-2">
        <FileJson :size="14" class="text-emerald-400" />
        <h2 class="text-xs font-semibold">GeoJSON 编辑器</h2>
      </div>
      <div class="flex items-center gap-1">
        <button @click="resetEditor" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="重置">
          <RotateCcw :size="12" />
        </button>
        <button @click="formatJson" class="px-2 py-0.5 text-[10px] bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors">格式化</button>
        <button @click="copyToClipboard" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="复制">
          <Check v-if="copyFeedback" :size="12" class="text-emerald-400" />
          <Copy v-else :size="12" />
        </button>
        <button @click="applyGeoJson" class="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-emerald-600 hover:bg-emerald-500 rounded text-white transition-colors">
          <Play :size="10" /> 应用
        </button>
        <button @click="store.setGeoEditorOpen(false)" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="关闭">
          <X :size="12" />
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-hidden relative">
      <textarea
        v-model="editorText"
        class="w-full h-full bg-gray-900 text-gray-200 text-xs font-mono p-3 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-600/50 leading-relaxed"
        spellcheck="false"
        placeholder="在此输入或粘贴 GeoJSON..."
      ></textarea>
      <div v-if="errorMsg" class="absolute bottom-0 left-0 right-0 bg-red-900/90 text-red-200 text-[10px] px-3 py-1.5 border-t border-red-700">
        {{ errorMsg }}
      </div>
    </div>
  </div>
</template>
