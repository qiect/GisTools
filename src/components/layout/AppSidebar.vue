<script setup lang="ts">
import { useAppStore } from '../../stores/appStore'
import type { ToolMode } from '../../types'
import {
  Move, MapPin, PenTool, Pentagon, Square, Circle, Type,
  Ruler, Triangle, Compass, Search, Download, Crosshair,
  Layers, Navigation, BarChart3, FileJson,
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
  { mode: 'measure-distance', label: '测距', icon: Ruler, group: '测量' },
  { mode: 'measure-area', label: '测面', icon: Triangle, group: '测量' },
  { mode: 'measure-angle', label: '测方位角', icon: Compass, group: '测量' },
]

const panelTools: { mode: ToolMode; label: string; icon: any }[] = [
  { mode: 'search', label: '搜索定位', icon: Search },
  { mode: 'import-export', label: '导入导出', icon: Download },
  { mode: 'coord-transform', label: '坐标转换', icon: Crosshair },
  { mode: 'spatial-analysis', label: '空间分析', icon: Compass },
  { mode: 'visualization', label: '数据可视化', icon: BarChart3 },
  { mode: 'batch-coord', label: '批量坐标转换', icon: Navigation },
  { mode: 'layers', label: '图层管理', icon: Layers },
]

const groups = ['基础', '绘制', '测量']
</script>

<template>
  <aside class="w-56 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto shrink-0">
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

    <div class="px-2 py-2 border-t border-gray-700 mt-auto">
      <div class="text-xs text-gray-500 uppercase tracking-wider px-2 mb-1">面板</div>
      <button
        @click="store.setGeoEditorOpen(!store.geoEditorOpen)"
        :class="[
          'w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors',
          store.geoEditorOpen
            ? 'bg-emerald-600/30 text-emerald-400'
            : 'text-gray-300 hover:bg-gray-700'
        ]"
      >
        <FileJson :size="18" />
        JSON 编辑器
      </button>
    </div>
  </aside>
</template>
