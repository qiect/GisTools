<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from './stores/appStore'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import PropertyPanel from './components/layout/PropertyPanel.vue'
import GeoJsonEditor from './components/tools/GeoJsonEditor.vue'
import MapContainer from './components/map/MapContainer.vue'

const store = useAppStore()

const panelWidth = ref(320)
const isDragging = ref(false)

function onDragStart(e: MouseEvent) {
  isDragging.value = true
  const startX = e.clientX
  const startWidth = panelWidth.value

  function onMouseMove(ev: MouseEvent) {
    const delta = startX - ev.clientX
    panelWidth.value = Math.max(240, Math.min(600, startWidth + delta))
  }

  function onMouseUp() {
    isDragging.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-gray-900 text-white">
    <AppHeader />
    <div class="flex flex-1 overflow-hidden">
      <AppSidebar v-if="store.sidebarOpen" />
      <main class="flex-1 relative">
        <MapContainer />
        <!-- 属性面板：浮动在地图右侧 -->
        <PropertyPanel v-if="store.propertyPanelOpen" />
      </main>
      <!-- GeoJSON 编辑器：独立右侧面板，支持拖拽调整宽度 -->
      <aside
        v-if="store.geoEditorOpen"
        class="bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden shrink-0 relative"
        :style="{ width: panelWidth + 'px' }"
      >
        <!-- 拖拽条 -->
        <div
          class="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-500/50 transition-colors z-10"
          :class="{ 'bg-emerald-500/50': isDragging }"
          @mousedown="onDragStart"
        ></div>
        <GeoJsonEditor />
      </aside>
    </div>
  </div>
</template>
