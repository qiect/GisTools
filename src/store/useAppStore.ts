import { create } from 'zustand'
import type { AppState, ToolMode, GeoLayer, DrawFeature, MeasureResult } from '../types'

export const useAppStore = create<AppState>((set) => ({
  toolMode: 'pan',
  layers: [],
  activeLayerId: null,
  drawFeatures: [],
  measureResults: [],
  sidebarOpen: true,
  propertyPanelOpen: false,
  selectedFeature: null,

  setToolMode: (mode: ToolMode) => set({ toolMode: mode }),
  addLayer: (layer: GeoLayer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (id: string) => set((state) => ({ layers: state.layers.filter((l) => l.id !== id) })),
  toggleLayerVisibility: (id: string) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
    })),
  updateLayerOpacity: (id: string, opacity: number) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
    })),
  setActiveLayerId: (id: string | null) => set({ activeLayerId: id }),
  addDrawFeature: (feature: DrawFeature) =>
    set((state) => ({ drawFeatures: [...state.drawFeatures, feature] })),
  removeDrawFeature: (id: string) =>
    set((state) => ({ drawFeatures: state.drawFeatures.filter((f) => f.id !== id) })),
  addMeasureResult: (result: MeasureResult) =>
    set((state) => ({ measureResults: [...state.measureResults, result] })),
  clearMeasureResults: () => set({ measureResults: [] }),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setPropertyPanelOpen: (open: boolean) => set({ propertyPanelOpen: open }),
  setSelectedFeature: (feature: DrawFeature | null) => set({ selectedFeature: feature }),
}))

// 临时绘制点存储（非响应式）
export let drawTempPoints: [number, number][] = []
export let measureTempPoints: [number, number][] = []
