<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAppStore, getAllDrawFeaturesGeoJson } from '../../stores/appStore'
import { FileJson, RotateCcw, Copy, Check, X } from 'lucide-vue-next'
import JsonTreeNode from './JsonTreeNode.vue'

const store = useAppStore()

const editorText = ref('')
const copyFeedback = ref(false)

// 计算当前 GeoJSON
const currentGeoJson = computed(() => {
  if (store.drawFeatures.length > 0) {
    return getAllDrawFeaturesGeoJson(store.drawFeatures)
  }
  const geoLayers = store.layers.filter((l) => l.type === 'geojson')
  if (geoLayers.length > 0) {
    return {
      type: 'FeatureCollection' as const,
      features: geoLayers.flatMap((l: any) => (l.data as any).features || [l.data]),
    }
  }
  return { type: 'FeatureCollection', features: [] }
})

function resetEditor() {
  editorText.value = JSON.stringify(currentGeoJson.value, null, 2)
}

function copyToClipboard() {
  navigator.clipboard.writeText(editorText.value).then(() => {
    copyFeedback.value = true
    setTimeout(() => { copyFeedback.value = false }, 1500)
  })
}

// 监听绘制要素变化
watch(() => [...store.drawFeatures], () => {
  const geojson = getAllDrawFeaturesGeoJson(store.drawFeatures)
  if (geojson.features.length > 0) {
    editorText.value = JSON.stringify(geojson, null, 2)
  }
})

// 监听图层变化
watch(() => [...store.layers], () => {
  if (store.drawFeatures.length === 0) {
    resetEditor()
  }
})

resetEditor()

// ---- JSON 树形视图 ----
const collapsedPaths = ref(new Set<string>())

function toggleCollapse(path: string) {
  const s = new Set(collapsedPaths.value)
  if (s.has(path)) s.delete(path)
  else s.add(path)
  collapsedPaths.value = s
}

interface TreeNode {
  key: string
  path: string
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  value: any
  children?: { key: string; node: TreeNode }[]
  length?: number
}

function parseToTree(data: any, key: string, path: string): TreeNode {
  if (data === null || data === undefined) {
    return { key, path, type: 'null', value: data }
  }
  if (Array.isArray(data)) {
    const children = data.map((item, i) => ({
      key: String(i),
      node: parseToTree(item, String(i), `${path}[${i}]`),
    }))
    return { key, path, type: 'array', value: data, children, length: data.length }
  }
  if (typeof data === 'object') {
    const children = Object.entries(data).map(([k, v]) => ({
      key: k,
      node: parseToTree(v, k, `${path}.${k}`),
    }))
    return { key, path, type: 'object', value: data, children, length: children.length }
  }
  if (typeof data === 'string') return { key, path, type: 'string', value: data }
  if (typeof data === 'number') return { key, path, type: 'number', value: data }
  if (typeof data === 'boolean') return { key, path, type: 'boolean', value: data }
  return { key, path, type: 'null', value: data }
}

const treeData = computed(() => {
  try {
    const parsed = JSON.parse(editorText.value)
    return parseToTree(parsed, 'root', '$')
  } catch {
    return null
  }
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-3 py-1.5 border-b border-gray-700 shrink-0 min-h-[32px]">
      <div class="flex items-center gap-1.5">
        <FileJson :size="13" class="text-emerald-400" />
        <span class="text-[11px] font-medium text-gray-200">JSON 编辑器</span>
      </div>
      <div class="flex items-center gap-0.5">
        <button @click="resetEditor" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="重置">
          <RotateCcw :size="12" />
        </button>
        <button @click="copyToClipboard" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="复制">
          <Check v-if="copyFeedback" :size="12" class="text-emerald-400" />
          <Copy v-else :size="12" />
        </button>
        <button @click="store.setGeoEditorOpen(false)" class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white" title="关闭">
          <X :size="12" />
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-auto p-2 text-xs font-mono leading-relaxed bg-gray-900">
      <div v-if="treeData">
        <JsonTreeNode :node="treeData" :collapsed-paths="collapsedPaths" :depth="0" @toggle="toggleCollapse" />
      </div>
      <div v-else class="text-gray-500 text-center py-8">
        暂无数据
      </div>
    </div>
  </div>
</template>
