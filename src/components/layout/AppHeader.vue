<script setup lang="ts">
import { useAppStore } from '../../stores/appStore'
import { Map, Menu, PanelRightOpen, PanelRightClose } from 'lucide-vue-next'

const store = useAppStore()
</script>

<template>
  <header class="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
    <div class="flex items-center gap-3">
      <button
        @click="store.setSidebarOpen(!store.sidebarOpen)"
        class="p-1.5 rounded hover:bg-gray-700 transition-colors"
      >
        <Menu :size="20" />
      </button>
      <div class="flex items-center gap-2">
        <Map :size="22" class="text-emerald-400" />
        <h1 class="text-lg font-bold tracking-wide">
          Gis<span class="text-emerald-400">Tools</span>
        </h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs text-gray-500 hidden sm:inline">在线GIS工具平台</span>
      <button
        @click="store.setPropertyPanelOpen(!store.propertyPanelOpen)"
        class="p-1.5 rounded hover:bg-gray-700 transition-colors"
        title="属性面板"
      >
        <PanelRightClose v-if="store.propertyPanelOpen" :size="18" />
        <PanelRightOpen v-else :size="18" />
      </button>
    </div>
  </header>
</template>
