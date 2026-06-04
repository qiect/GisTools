<script setup lang="ts">
import { useAppStore } from './stores/appStore'
import AppHeader from './components/layout/AppHeader.vue'
import AppSidebar from './components/layout/AppSidebar.vue'
import PropertyPanel from './components/layout/PropertyPanel.vue'
import MapContainer from './components/map/MapContainer.vue'

const store = useAppStore()
</script>

<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-gray-900 text-white">
    <AppHeader />
    <div class="flex flex-1 overflow-hidden">
      <AppSidebar v-if="store.sidebarOpen" />
      <main class="flex-1 relative">
        <MapContainer />
      </main>
      <PropertyPanel v-if="store.propertyPanelOpen" />
    </div>
  </div>
</template>
