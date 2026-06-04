<script setup lang="ts">
import { useAppStore } from '../../stores/appStore'
import { X } from 'lucide-vue-next'

const store = useAppStore()
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

      <div v-if="store.selectedFeature">
        <h3 class="text-xs text-gray-500 uppercase tracking-wider mb-2">要素属性</h3>
        <div class="space-y-1">
          <div class="text-sm">
            <span class="text-gray-400">类型：</span>
            <span>{{ store.selectedFeature.type }}</span>
          </div>
          <div v-for="(v, k) in store.selectedFeature.properties" :key="k" class="text-sm">
            <span class="text-gray-400">{{ k }}：</span>
            <span>{{ String(v) }}</span>
          </div>
        </div>
      </div>

      <p v-if="!store.selectedFeature && store.measureResults.length === 0" class="text-sm text-gray-500">
        选择要素或使用测量工具查看属性
      </p>
    </div>
  </aside>
</template>
