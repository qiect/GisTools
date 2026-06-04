<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAppStore, getAllDrawFeaturesGeoJson } from '../../stores/appStore'
import { FileJson, Play, RotateCcw, Copy, Check, X } from 'lucide-vue-next'
import JsonTreeNode from './JsonTreeNode.vue'

const store = useAppStore()

const editorText = ref('')
const errorMsg = ref('')
const copyFeedback = ref(false)
const viewMode = ref<'tree' | 'text'>('tree')

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
  errorMsg.value = ''
}

function applyGeoJson() {
  try {
    const parsed = JSON.parse(editorText.value)
    if (!parsed.type) {
      errorMsg.value = '无效的 GeoJSON：缺少 type 字段'
      return
    }
    store.requestApplyGeoJson(parsed)
    errorMsg.value = ''
  } catch (e: any) {
    errorMsg.value = `JSON 解析错误: ${e.message}`
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(editorText.value)
    editorText.value = JSON.stringify(parsed, null, 2)
    errorMsg.value = ''
  } catch (e: any) {
    errorMsg.value = `JSON 格式化失败: ${e.message}`
  }
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
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700 shrink-0">
      <div class="flex items-center gap-2">
        <FileJson :size="14" class="text-emerald-400" />
        <h2 class="text-xs font-semibold">JSON 编辑器</h2>
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="viewMode = viewMode === 'tree' ? 'text' : 'tree'"
          class="px-2 py-0.5 text-[10px] rounded transition-colors"
          :class="viewMode === 'tree' ? 'bg-emerald-600/30 text-emerald-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
        >
          {{ viewMode === 'tree' ? '树形' : '文本' }}
        </button>
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

    <!-- 树形视图 -->
    <div v-if="viewMode === 'tree' && treeData" class="flex-1 overflow-auto p-2 text-xs font-mono leading-relaxed bg-gray-900">
      <JsonTreeNode :node="treeData" :collapsed-paths="collapsedPaths" :depth="0" @toggle="toggleCollapse" />
    </div>

    <!-- 文本视图 -->
    <div v-else class="flex-1 overflow-hidden relative">
      <textarea
        v-model="editorText"
        class="w-full h-full bg-gray-900 text-gray-200 text-xs font-mono p-3 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-600/50 leading-relaxed"
        spellcheck="false"
        placeholder="在此输入或粘贴 JSON..."
      ></textarea>
      <div v-if="errorMsg" class="absolute bottom-0 left-0 right-0 bg-red-900/90 text-red-200 text-[10px] px-3 py-1.5 border-t border-red-700">
        {{ errorMsg }}
      </div>
    </div>
  </div>
</template>
