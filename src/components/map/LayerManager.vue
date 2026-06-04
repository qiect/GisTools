<script setup lang="ts">
import { useAppStore } from '../../stores/appStore'
import { Eye, EyeOff, Trash2, Layers } from 'lucide-vue-next'

const store = useAppStore()
</script>

<template>
  <div class="absolute bottom-3 left-3 z-[1000]">
    <div class="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl min-w-[260px]">
      <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
        <Layers :size="14" class="text-emerald-400" />
        <h3 class="text-sm font-semibold">图层管理</h3>
        <span class="text-xs text-gray-500 ml-auto">{{ store.layers.length }} 个图层</span>
      </div>

      <div v-if="store.layers.length === 0" class="px-3 py-4 text-sm text-gray-500 text-center">
        暂无图层，请导入数据或绘制要素
      </div>

      <div v-else class="max-h-64 overflow-y-auto">
        <div
          v-for="layer in store.layers" :key="layer.id"
          class="flex items-center gap-2 px-3 py-2 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-0"
        >
          <button @click="store.toggleLayerVisibility(layer.id)" class="text-gray-400 hover:text-white">
            <Eye v-if="layer.visible" :size="14" />
            <EyeOff v-else :size="14" />
          </button>
          <span :class="['flex-1 text-sm truncate', layer.visible ? 'text-gray-200' : 'text-gray-500']">
            {{ layer.name }}
          </span>
          <input
            type="range" min="0" max="1" step="0.1"
            :value="layer.opacity"
            @input="store.updateLayerOpacity(layer.id, parseFloat(($event.target as HTMLInputElement).value))"
            class="w-16 h-1 accent-emerald-500"
          />
          <button @click="store.removeLayer(layer.id)" class="text-gray-500 hover:text-red-400">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
