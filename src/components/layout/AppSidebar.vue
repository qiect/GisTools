<script setup lang="ts">
import { useAppStore } from '../../stores/appStore'
import type { ToolMode } from '../../types'
import {
  Move, MapPin, PenTool, Pentagon, Square, Circle, Type,
  Search, Crosshair, Compass,
  Layers, Navigation, BarChart3,
  Eye, EyeOff, Trash2,
} from 'lucide-vue-next'

const store = useAppStore()

interface ToolItem {
  mode: ToolMode
  label: string
  icon: any
  group: string
}

const tools: ToolItem[] = [
  { mode: 'pan', label: '漫游', icon: Move, group: '基础' },
  { mode: 'draw-marker', label: '标注点', icon: MapPin, group: '绘制' },
  { mode: 'draw-polyline', label: '画线', icon: PenTool, group: '绘制' },
  { mode: 'draw-polygon', label: '画多边形', icon: Pentagon, group: '绘制' },
  { mode: 'draw-rectangle', label: '画矩形', icon: Square, group: '绘制' },
  { mode: 'draw-circle', label: '画圆', icon: Circle, group: '绘制' },
  { mode: 'draw-text', label: '文字标注', icon: Type, group: '绘制' },
]

const panelTools: { mode: ToolMode; label: string; icon: any }[] = [
  { mode: 'search', label: '搜索定位', icon: Search },
  { mode: 'coord-transform', label: '坐标转换', icon: Crosshair },
  { mode: 'spatial-analysis', label: '空间分析', icon: Compass },
  { mode: 'visualization', label: '数据可视化', icon: BarChart3 },
  { mode: 'batch-coord', label: '批量坐标转换', icon: Navigation },
]

const groups = ['基础', '绘制']
</script>

<template>
  <aside class="w-56 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden shrink-0">
    <!-- 工具区域 -->
    <div class="flex-1 overflow-y-auto">
      <div v-for="group in groups" :key="group" class="px-2 py-2">
        <div class="text-xs text-gray-500 uppercase tracking-wider px-2 mb-1">{{ group }}</div>
        <div class="space-y-0.5">
          <button
            v-for="tool in tools.filter(t => t.group === group)"
            :key="tool.mode"
            @click="store.setToolMode(tool.mode)"
            :class="[
              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors',
              store.toolMode === tool.mode
                ? 'bg-emerald-600/30 text-emerald-400'
                : 'text-gray-300 hover:bg-gray-700'
            ]"
          >
            <component :is="tool.icon" :size="18" />
            {{ tool.label }}
          </button>
        </div>
      </div>

      <div class="px-2 py-2 border-t border-gray-700">
        <div class="text-xs text-gray-500 uppercase tracking-wider px-2 mb-1">工具</div>
        <div class="space-y-0.5">
          <button
            v-for="tool in panelTools"
            :key="tool.mode"
            @click="store.setToolMode(tool.mode)"
            :class="[
              'w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors',
              store.toolMode === tool.mode
                ? 'bg-emerald-600/30 text-emerald-400'
                : 'text-gray-300 hover:bg-gray-700'
            ]"
          >
            <component :is="tool.icon" :size="18" />
            {{ tool.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- 图层管理 - 固定在底部 -->
    <div class="border-t border-gray-700 shrink-0">
      <div class="flex items-center gap-2 px-4 py-2">
        <Layers :size="14" class="text-emerald-400" />
        <span class="text-xs font-semibold text-gray-200">图层</span>
        <span class="text-[10px] text-gray-500 ml-auto">{{ store.layers.length }}</span>
      </div>
      <div v-if="store.layers.length === 0" class="px-4 pb-3 text-[11px] text-gray-500">
        暂无图层
      </div>
      <div v-else class="max-h-40 overflow-y-auto pb-1">
        <div
          v-for="layer in store.layers" :key="layer.id"
          class="flex items-center gap-1.5 px-3 py-1 hover:bg-gray-700/50"
        >
          <button @click="store.toggleLayerVisibility(layer.id)" class="shrink-0 text-gray-400 hover:text-white">
            <Eye v-if="layer.visible" :size="13" />
            <EyeOff v-else :size="13" />
          </button>
          <span :class="['flex-1 text-[11px] truncate', layer.visible ? 'text-gray-200' : 'text-gray-500']">
            {{ layer.name }}
          </span>
          <input
            type="range" min="0" max="1" step="0.1"
            :value="layer.opacity"
            @input="store.updateLayerOpacity(layer.id, parseFloat(($event.target as HTMLInputElement).value))"
            class="w-12 h-0.5 accent-emerald-500 shrink-0"
          />
          <button @click="store.removeLayer(layer.id)" class="shrink-0 text-gray-500 hover:text-red-400">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
