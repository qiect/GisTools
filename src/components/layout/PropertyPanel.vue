<script setup lang="ts">
import { useAppStore } from '../../stores/appStore'
import { X, MapPin, PenTool, Pentagon, Square, Circle, Type } from 'lucide-vue-next'

const store = useAppStore()

function typeLabel(type: string) {
  const map: Record<string, string> = {
    marker: '标注点', polyline: '线', polygon: '多边形',
    rectangle: '矩形', circle: '圆', text: '文字',
  }
  return map[type] || type
}

function typeIcon(type: string) {
  const map: Record<string, any> = {
    marker: MapPin, polyline: PenTool, polygon: Pentagon,
    rectangle: Square, circle: Circle, text: Type,
  }
  return map[type] || MapPin
}

function selectFeature(feature: any) {
  store.setSelectedFeature(feature)
}
</script>

<template>
  <aside class="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto shrink-0">
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
      <h2 class="text-sm font-semibold">属性面板</h2>
      <button @click="store.setPropertyPanelOpen(false)" class="p-1 rounded hover:bg-gray-700">
        <X :size="16" />
      </button>
    </div>

    <div class="p-4 space-y-4">
      <!-- 测量结果 -->
      <div v-if="store.measureResults.length > 0">
        <h3 class="text-xs text-gray-500 uppercase tracking-wider mb-2">测量结果</h3>
        <div class="space-y-1">
          <div v-for="(r, i) in store.measureResults" :key="i" class="text-sm bg-gray-700/50 rounded px-3 py-2">
            <span class="text-gray-400">
              {{ r.type === 'distance' ? '距离' : r.type === 'area' ? '面积' : '方位角' }}：
            </span>
            <span class="text-emerald-400 font-mono">{{ r.value.toFixed(2) }} {{ r.unit }}</span>
          </div>
        </div>
      </div>

      <!-- 绘制要素列表 -->
      <div v-if="store.drawFeatures.length > 0">
        <h3 class="text-xs text-gray-500 uppercase tracking-wider mb-2">绘制要素</h3>
        <div class="space-y-1 max-h-48 overflow-y-auto">
          <button
            v-for="feature in store.drawFeatures"
            :key="feature.id"
            @click="selectFeature(feature)"
            :class="[
              'w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors text-left',
              store.selectedFeature?.id === feature.id
                ? 'bg-emerald-600/30 text-emerald-400'
                : 'text-gray-300 hover:bg-gray-700'
            ]"
          >
            <component :is="typeIcon(feature.type)" :size="14" />
            <span class="flex-1 truncate">{{ feature.properties?.name || typeLabel(feature.type) }}</span>
            <span class="text-xs text-gray-500">{{ typeLabel(feature.type) }}</span>
          </button>
        </div>
      </div>

      <!-- 选中要素属性 -->
      <div v-if="store.selectedFeature">
        <h3 class="text-xs text-gray-500 uppercase tracking-wider mb-2">要素属性</h3>
        <div class="space-y-1">
          <div class="text-sm">
            <span class="text-gray-400">类型：</span>
            <span>{{ typeLabel(store.selectedFeature.type) }}</span>
          </div>
          <div v-if="Array.isArray(store.selectedFeature.coordinates)">
            <div class="text-sm">
              <span class="text-gray-400">坐标点数：</span>
              <span>{{ store.selectedFeature.coordinates.length }}</span>
            </div>
            <div v-if="store.selectedFeature.coordinates.length === 2 && typeof store.selectedFeature.coordinates[0] === 'number'" class="text-sm">
              <span class="text-gray-400">坐标：</span>
              <span class="font-mono text-xs">{{ (store.selectedFeature.coordinates as number[])[0].toFixed(6) }}, {{ (store.selectedFeature.coordinates as number[])[1].toFixed(6) }}</span>
            </div>
            <div v-else-if="store.selectedFeature.coordinates.length > 0 && Array.isArray(store.selectedFeature.coordinates[0])" class="text-sm">
              <span class="text-gray-400">首点坐标：</span>
              <span class="font-mono text-xs">{{ (store.selectedFeature.coordinates as number[][])[0][0].toFixed(6) }}, {{ (store.selectedFeature.coordinates as number[][])[0][1].toFixed(6) }}</span>
            </div>
          </div>
          <div v-for="(v, k) in store.selectedFeature.properties" :key="k" class="text-sm">
            <span class="text-gray-400">{{ k }}：</span>
            <span>{{ String(v) }}</span>
          </div>
        </div>
      </div>

      <p v-if="!store.selectedFeature && store.measureResults.length === 0 && store.drawFeatures.length === 0" class="text-sm text-gray-500">
        选择要素或使用测量工具查看属性
      </p>
    </div>
  </aside>
</template>
