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
  <div class="absolute top-3 right-3 z-[1001] w-56 max-h-[50vh] bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-3 py-1.5 border-b border-gray-700 shrink-0">
      <h2 class="text-[11px] font-semibold">属性</h2>
      <button @click="store.setPropertyPanelOpen(false)" class="p-0.5 rounded hover:bg-gray-700 text-gray-400">
        <X :size="12" />
      </button>
    </div>
    <div class="p-2 space-y-2 overflow-y-auto text-[11px]">
      <!-- 测量结果 -->
      <div v-if="store.measureResults.length > 0">
        <div class="text-[9px] text-gray-500 uppercase tracking-wider mb-1">测量结果</div>
        <div class="space-y-0.5">
          <div v-for="(r, i) in store.measureResults" :key="i" class="bg-gray-700/50 rounded px-2 py-1">
            <span class="text-gray-400">
              {{ r.type === 'distance' ? '距离' : r.type === 'area' ? '面积' : '方位角' }}：
            </span>
            <span class="text-emerald-400 font-mono">{{ r.value.toFixed(2) }} {{ r.unit }}</span>
          </div>
        </div>
      </div>

      <!-- 绘制要素列表 -->
      <div v-if="store.drawFeatures.length > 0">
        <div class="text-[9px] text-gray-500 uppercase tracking-wider mb-1">绘制要素</div>
        <div class="space-y-0.5 max-h-24 overflow-y-auto">
          <button
            v-for="feature in store.drawFeatures"
            :key="feature.id"
            @click="selectFeature(feature)"
            :class="[
              'w-full flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors text-left',
              store.selectedFeature?.id === feature.id
                ? 'bg-emerald-600/30 text-emerald-400'
                : 'text-gray-300 hover:bg-gray-700'
            ]"
          >
            <component :is="typeIcon(feature.type)" :size="10" />
            <span class="flex-1 truncate">{{ feature.properties?.name || typeLabel(feature.type) }}</span>
          </button>
        </div>
      </div>

      <!-- 选中要素属性 -->
      <div v-if="store.selectedFeature">
        <div class="text-[9px] text-gray-500 uppercase tracking-wider mb-1">要素属性</div>
        <div class="space-y-0.5">
          <div>
            <span class="text-gray-400">类型：</span>
            <span>{{ typeLabel(store.selectedFeature.type) }}</span>
          </div>
          <div v-if="Array.isArray(store.selectedFeature.coordinates)">
            <div>
              <span class="text-gray-400">点数：</span>
              <span>{{ store.selectedFeature.coordinates.length }}</span>
            </div>
            <div v-if="store.selectedFeature.coordinates.length === 2 && typeof store.selectedFeature.coordinates[0] === 'number'" class="font-mono text-[10px] text-gray-400">
              {{ (store.selectedFeature.coordinates as number[])[0].toFixed(6) }}, {{ (store.selectedFeature.coordinates as number[])[1].toFixed(6) }}
            </div>
            <div v-else-if="store.selectedFeature.coordinates.length > 0 && Array.isArray(store.selectedFeature.coordinates[0])" class="font-mono text-[10px] text-gray-400">
              {{ (store.selectedFeature.coordinates as number[][])[0][0].toFixed(6) }}, {{ (store.selectedFeature.coordinates as number[][])[0][1].toFixed(6) }}
            </div>
          </div>
          <div v-for="(v, k) in store.selectedFeature.properties" :key="k">
            <span class="text-gray-400">{{ k }}：</span>
            <span>{{ String(v) }}</span>
          </div>
        </div>
      </div>

      <p v-if="!store.selectedFeature && store.measureResults.length === 0 && store.drawFeatures.length === 0" class="text-gray-500">
        选择要素查看属性
      </p>
    </div>
  </div>
</template>
