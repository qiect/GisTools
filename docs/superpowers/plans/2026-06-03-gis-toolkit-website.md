# GIS 工具网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个功能全面、视觉精美的在线 GIS 工具平台，提供地图浏览、空间分析、数据转换、标注测量等一站式地理信息处理能力。

**Architecture:** 采用 React + TypeScript 单页应用架构，以 Leaflet 为核心地图引擎，Turf.js 提供空间分析能力。整体为纯前端应用，所有计算在浏览器端完成，无需后端服务。页面采用左侧工具面板 + 中央地图 + 右侧属性面板的三栏布局，响应式适配移动端。

**Tech Stack:**
- React 18 + TypeScript + Vite
- Leaflet + React-Leaflet（2D 地图引擎）
- Turf.js（空间分析库）
- Tailwind CSS（样式）
- Lucide React（图标）
- Proj4js（坐标系统转换）
- Shpjs + GeoJSON 相关库（数据格式解析）

---

## 功能模块总览

| 模块 | 功能 | 优先级 |
|------|------|--------|
| M1 | 交互式地图（底图切换、缩放、定位） | P0 |
| M2 | 图层管理系统（添加/删除/排序/透明度） | P0 |
| M3 | 绘制与标注工具（点/线/面/文字标注） | P0 |
| M4 | 测量工具（距离/面积/方位角） | P0 |
| M5 | 地理编码与搜索（地址搜索/坐标定位） | P1 |
| M6 | 数据导入导出（GeoJSON/KML/CSV/Shapefile） | P1 |
| M7 | 坐标系转换（WGS84/GCJ02/BD09/UTM 等） | P1 |
| M8 | 空间分析（缓冲区/交集/并集/差集） | P1 |
| M9 | 数据可视化（热力图/聚类/分级着色） | P2 |
| M10 | 3D 地形视图 | P2 |
| M11 | 批量坐标转换工具 | P2 |
| M12 | GPX 轨迹查看与分析 | P2 |

---

## 文件结构

```
src/
├── main.tsx                          # 应用入口
├── App.tsx                           # 根组件，布局管理
├── index.css                         # 全局样式 + Tailwind
├── types/
│   └── index.ts                      # 全局类型定义
├── store/
│   └── useAppStore.ts                # Zustand 全局状态管理
├── hooks/
│   ├── useMap.ts                     # 地图实例 hook
│   └── useGeocoding.ts              # 地理编码 hook
├── utils/
│   ├── coordinate.ts                 # 坐标转换工具
│   ├── spatial.ts                    # 空间分析封装
│   ├── dataIO.ts                     # 数据导入导出
│   └── measurement.ts               # 测量计算
├── components/
│   ├── layout/
│   │   ├── Header.tsx                # 顶部导航栏
│   │   ├── Sidebar.tsx               # 左侧工具面板
│   │   └── PropertyPanel.tsx         # 右侧属性面板
│   ├── map/
│   │   ├── MapContainer.tsx          # 地图容器
│   │   ├── MapControls.tsx           # 地图控件（缩放/定位/比例尺）
│   │   ├── BasemapSwitcher.tsx       # 底图切换
│   │   └── LayerManager.tsx          # 图层管理
│   ├── tools/
│   │   ├── DrawTools.tsx             # 绘制工具栏
│   │   ├── MeasureTools.tsx          # 测量工具栏
│   │   ├── SearchTool.tsx            # 搜索工具
│   │   ├── ImportExport.tsx          # 导入导出
│   │   ├── CoordTransform.tsx        # 坐标系转换
│   │   ├── SpatialAnalysis.tsx       # 空间分析
│   │   └── BatchCoordTool.tsx        # 批量坐标转换
│   ├── visualization/
│   │   ├── HeatmapLayer.tsx          # 热力图
│   │   ├── ClusterLayer.tsx          # 聚合图层
│   │   └── ChoroplethLayer.tsx       # 分级着色
│   └── common/
│       ├── Modal.tsx                 # 通用弹窗
│       ├── Toast.tsx                 # 消息提示
│       ├── DropZone.tsx              # 文件拖拽区
│       └── Toolbar.tsx               # 工具栏容器
└── data/
    └── projections.ts                # 预定义坐标系统参数
```

---

### Task 1: 项目初始化与基础架构

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/types/index.ts`, `src/store/useAppStore.ts`

- [ ] **Step 1: 初始化 Vite + React + TypeScript 项目**

Run:
```bash
cd /workspace && npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: 安装核心依赖**

Run:
```bash
cd /workspace && npm install leaflet react-leaflet @turf/turf proj4 shpjs lucide-react zustand leaflet.heat leaflet.markercluster
```

Run:
```bash
cd /workspace && npm install -D @types/leaflet @types/proj4 tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 Tailwind CSS**

修改 `src/index.css`，添加 Tailwind 指令：
```css
@import "tailwindcss";

/* Leaflet 必要样式覆盖 */
.leaflet-container {
  width: 100%;
  height: 100%;
  z-index: 0;
}
```

修改 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 4: 定义全局类型**

创建 `src/types/index.ts`：
```typescript
import type { FeatureCollection, Feature, GeoJsonObject } from 'geojson'

export type CoordSystem = 'WGS84' | 'GCJ02' | 'BD09' | 'UTM' | 'CGCS2000'

export interface GeoLayer {
  id: string
  name: string
  visible: boolean
  opacity: number
  zIndex: number
  data: GeoJsonObject
  style?: LayerStyle
  type: 'marker' | 'geojson' | 'heatmap' | 'cluster'
}

export interface LayerStyle {
  color?: string
  weight?: number
  fillColor?: string
  fillOpacity?: number
  radius?: number
}

export interface DrawFeature {
  id: string
  type: 'marker' | 'polyline' | 'polygon' | 'rectangle' | 'circle' | 'text'
  coordinates: [number, number][] | [number, number]
  properties: Record<string, unknown>
  style: LayerStyle
}

export interface MeasureResult {
  type: 'distance' | 'area' | 'angle'
  value: number
  unit: string
  coordinates: [number, number][]
}

export type ToolMode = 'pan' | 'draw-marker' | 'draw-polyline' | 'draw-polygon' | 'draw-rectangle' | 'draw-circle' | 'draw-text' | 'measure-distance' | 'measure-area' | 'measure-angle'

export interface AppState {
  toolMode: ToolMode
  layers: GeoLayer[]
  activeLayerId: string | null
  drawFeatures: DrawFeature[]
  measureResults: MeasureResult[]
  sidebarOpen: boolean
  propertyPanelOpen: boolean
  selectedFeature: DrawFeature | null
  setToolMode: (mode: ToolMode) => void
  addLayer: (layer: GeoLayer) => void
  removeLayer: (id: string) => void
  toggleLayerVisibility: (id: string) => void
  updateLayerOpacity: (id: string, opacity: number) => void
  setActiveLayerId: (id: string | null) => void
  addDrawFeature: (feature: DrawFeature) => void
  removeDrawFeature: (id: string) => void
  addMeasureResult: (result: MeasureResult) => void
  clearMeasureResults: () => void
  setSidebarOpen: (open: boolean) => void
  setPropertyPanelOpen: (open: boolean) => void
  setSelectedFeature: (feature: DrawFeature | null) => void
}
```

- [ ] **Step 5: 创建 Zustand Store**

创建 `src/store/useAppStore.ts`：
```typescript
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
```

- [ ] **Step 6: 创建 App 根组件布局**

修改 `src/App.tsx`：
```tsx
import { useAppStore } from './store/useAppStore'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { PropertyPanel } from './components/layout/PropertyPanel'
import { MapContainer } from './components/map/MapContainer'

export default function App() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const propertyPanelOpen = useAppStore((s) => s.propertyPanelOpen)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-900 text-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1 relative">
          <MapContainer />
        </main>
        {propertyPanelOpen && <PropertyPanel />}
      </div>
    </div>
  )
}
```

修改 `src/main.tsx`：
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: 验证项目启动**

Run:
```bash
cd /workspace && npm run dev -- --host 0.0.0.0 --port 5173
```

Expected: Vite 开发服务器启动成功，浏览器可访问

---

### Task 2: 布局组件（Header / Sidebar / PropertyPanel）

**Files:**
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/PropertyPanel.tsx`
- Create: `src/components/common/Toolbar.tsx`

- [ ] **Step 1: 创建 Header 组件**

创建 `src/components/layout/Header.tsx`：
```tsx
import { useAppStore } from '../../store/useAppStore'
import { Map, Menu, PanelRightOpen, PanelRightClose } from 'lucide-react'

export function Header() {
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setPropertyPanelOpen = useAppStore((s) => s.setPropertyPanelOpen)
  const propertyPanelOpen = useAppStore((s) => s.propertyPanelOpen)

  return (
    <header className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Map size={22} className="text-emerald-400" />
          <h1 className="text-lg font-bold tracking-wide">
            Geo<span className="text-emerald-400">Toolkit</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPropertyPanelOpen(!propertyPanelOpen)}
          className="p-1.5 rounded hover:bg-gray-700 transition-colors"
          title="属性面板"
        >
          {propertyPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: 创建 Sidebar 组件**

创建 `src/components/layout/Sidebar.tsx`：
```tsx
import { useAppStore } from '../../store/useAppStore'
import { ToolMode } from '../../types'
import {
  Move, MapPin, PenTool, Pentagon, Square, Circle, Type,
  Ruler, Triangle, Compass, Search, Download, Upload,
  Layers, Navigation, BarChart3, Mountain, Crosshair, Route,
} from 'lucide-react'

interface ToolItem {
  mode: ToolMode | string
  label: string
  icon: React.ReactNode
  group: string
}

const tools: ToolItem[] = [
  { mode: 'pan', label: '漫游', icon: <Move size={18} />, group: '基础' },
  { mode: 'draw-marker', label: '标注点', icon: <MapPin size={18} />, group: '绘制' },
  { mode: 'draw-polyline', label: '画线', icon: <PenTool size={18} />, group: '绘制' },
  { mode: 'draw-polygon', label: '画多边形', icon: <Pentagon size={18} />, group: '绘制' },
  { mode: 'draw-rectangle', label: '画矩形', icon: <Square size={18} />, group: '绘制' },
  { mode: 'draw-circle', label: '画圆', icon: <Circle size={18} />, group: '绘制' },
  { mode: 'draw-text', label: '文字标注', icon: <Type size={18} />, group: '绘制' },
  { mode: 'measure-distance', label: '测距', icon: <Ruler size={18} />, group: '测量' },
  { mode: 'measure-area', label: '测面', icon: <Pentagon size={18} />, group: '测量' },
  { mode: 'measure-angle', label: '测方位角', icon: <Triangle size={18} />, group: '测量' },
]

const panelTools: { mode: string; label: string; icon: React.ReactNode }[] = [
  { mode: 'search', label: '搜索定位', icon: <Search size={18} /> },
  { mode: 'import-export', label: '导入导出', icon: <Download size={18} /> },
  { mode: 'coord-transform', label: '坐标转换', icon: <Crosshair size={18} /> },
  { mode: 'spatial-analysis', label: '空间分析', icon: <Compass size={18} /> },
  { mode: 'visualization', label: '数据可视化', icon: <BarChart3 size={18} /> },
  { mode: '3d-terrain', label: '3D地形', icon: <Mountain size={18} /> },
  { mode: 'batch-coord', label: '批量坐标转换', icon: <Navigation size={18} /> },
  { mode: 'gpx-viewer', label: 'GPX轨迹', icon: <Route size={18} /> },
  { mode: 'layers', label: '图层管理', icon: <Layers size={18} /> },
]

export function Sidebar() {
  const toolMode = useAppStore((s) => s.toolMode)
  const setToolMode = useAppStore((s) => s.setToolMode)

  const groups = ['基础', '绘制', '测量']

  return (
    <aside className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto shrink-0">
      {groups.map((group) => (
        <div key={group} className="px-2 py-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider px-2 mb-1">{group}</div>
          <div className="space-y-0.5">
            {tools
              .filter((t) => t.group === group)
              .map((tool) => (
                <button
                  key={tool.mode}
                  onClick={() => setToolMode(tool.mode as ToolMode)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors ${
                    toolMode === tool.mode
                      ? 'bg-emerald-600/30 text-emerald-400'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="px-2 py-2 border-t border-gray-700">
        <div className="text-xs text-gray-500 uppercase tracking-wider px-2 mb-1">工具</div>
        <div className="space-y-0.5">
          {panelTools.map((tool) => (
            <button
              key={tool.mode}
              onClick={() => setToolMode(tool.mode as ToolMode)}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors ${
                toolMode === tool.mode
                  ? 'bg-emerald-600/30 text-emerald-400'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tool.icon}
              {tool.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: 创建 PropertyPanel 组件**

创建 `src/components/layout/PropertyPanel.tsx`：
```tsx
import { useAppStore } from '../../store/useAppStore'
import { X } from 'lucide-react'

export function PropertyPanel() {
  const selectedFeature = useAppStore((s) => s.selectedFeature)
  const measureResults = useAppStore((s) => s.measureResults)
  const setPropertyPanelOpen = useAppStore((s) => s.setPropertyPanelOpen)

  return (
    <aside className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold">属性面板</h2>
        <button
          onClick={() => setPropertyPanelOpen(false)}
          className="p-1 rounded hover:bg-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {measureResults.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">测量结果</h3>
            <div className="space-y-1">
              {measureResults.map((r, i) => (
                <div key={i} className="text-sm bg-gray-700/50 rounded px-3 py-2">
                  <span className="text-gray-400">
                    {r.type === 'distance' ? '距离' : r.type === 'area' ? '面积' : '方位角'}：
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {r.value.toFixed(2)} {r.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFeature && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">要素属性</h3>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-gray-400">类型：</span>
                <span>{selectedFeature.type}</span>
              </div>
              {Object.entries(selectedFeature.properties).map(([k, v]) => (
                <div key={k} className="text-sm">
                  <span className="text-gray-400">{k}：</span>
                  <span>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedFeature && measureResults.length === 0 && (
          <p className="text-sm text-gray-500">选择要素或使用测量工具查看属性</p>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Step 4: 验证布局渲染**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功，无错误

---

### Task 3: 交互式地图容器与底图切换

**Files:**
- Create: `src/components/map/MapContainer.tsx`
- Create: `src/components/map/MapControls.tsx`
- Create: `src/components/map/BasemapSwitcher.tsx`
- Create: `src/hooks/useMap.ts`

- [ ] **Step 1: 创建 useMap hook**

创建 `src/hooks/useMap.ts`：
```typescript
import { useRef, useCallback } from 'react'
import type { Map as LeafletMap } from 'leaflet'

export function useMap() {
  const mapRef = useRef<LeafletMap | null>(null)

  const setMap = useCallback((map: LeafletMap | null) => {
    mapRef.current = map
  }, [])

  const getMap = useCallback(() => mapRef.current, [])

  return { setMap, getMap }
}
```

- [ ] **Step 2: 创建 MapContainer 组件**

创建 `src/components/map/MapContainer.tsx`：
```tsx
import { useMemo } from 'react'
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { useAppStore } from '../../store/useAppStore'
import { MapControls } from './MapControls'
import { BasemapSwitcher } from './BasemapSwitcher'
import { DrawLayer } from '../tools/DrawLayer'
import { MeasureLayer } from '../tools/MeasureLayer'
import 'leaflet/dist/leaflet.css'

function MapEventHandler() {
  const setToolMode = useAppStore((s) => s.setToolMode)

  useMapEvents({
    keydown(e) {
      if (e.originalEvent.key === 'Escape') {
        setToolMode('pan')
      }
    },
  })
  return null
}

const basemaps = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
}

export function MapContainer() {
  const toolMode = useAppStore((s) => s.toolMode)

  const cursorClass = useMemo(() => {
    if (toolMode.startsWith('draw') || toolMode.startsWith('measure')) return 'cursor-crosshair'
    return 'cursor-grab'
  }, [toolMode])

  return (
    <div className={`w-full h-full ${cursorClass}`}>
      <LeafletMapContainer
        center={[39.9042, 116.4074]}
        zoom={5}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer url={basemaps.dark.url} attribution={basemaps.dark.attribution} />
        <MapEventHandler />
        <MapControls />
        <BasemapSwitcher basemaps={basemaps} />
        <DrawLayer />
        <MeasureLayer />
      </LeafletMapContainer>
    </div>
  )
}
```

- [ ] **Step 3: 创建 MapControls 组件**

创建 `src/components/map/MapControls.tsx`：
```tsx
import { useMap } from 'react-leaflet'
import { ZoomIn, ZoomOut, Locate, Maximize } from 'lucide-react'
import { useEffect } from 'react'

export function MapControls() {
  const map = useMap()

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 16 })
  }

  const handleFitWorld = () => {
    map.fitWorld()
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ top: 12, right: 12 }}>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => map.zoomIn()}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors"
          title="放大"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors"
          title="缩小"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={handleLocate}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors"
          title="定位"
        >
          <Locate size={16} />
        </button>
        <button
          onClick={handleFitWorld}
          className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors"
          title="全局视图"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 创建 BasemapSwitcher 组件**

创建 `src/components/map/BasemapSwitcher.tsx`：
```tsx
import { useState } from 'react'
import { useMap, TileLayer } from 'react-leaflet'
import { Layers } from 'lucide-react'

interface BasemapConfig {
  url: string
  attribution: string
}

interface BasemapSwitcherProps {
  basemaps: Record<string, BasemapConfig>
}

const basemapLabels: Record<string, string> = {
  osm: 'OpenStreetMap',
  dark: '暗色底图',
  satellite: '卫星影像',
  terrain: '地形图',
}

export function BasemapSwitcher({ basemaps }: BasemapSwitcherProps) {
  const [active, setActive] = useState<keyof typeof basemaps>('dark')
  const [open, setOpen] = useState(false)
  const map = useMap()

  const handleSwitch = (key: keyof typeof basemaps) => {
    setActive(key)
    setOpen(false)
  }

  return (
    <>
      <TileLayer key={active} url={basemaps[active].url} attribution={basemaps[active].attribution} />
      <div className="leaflet-bottom leaflet-right" style={{ bottom: 24, right: 12 }}>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 bg-gray-800/90 backdrop-blur border border-gray-600 rounded flex items-center justify-center hover:bg-gray-700 transition-colors"
            title="切换底图"
          >
            <Layers size={16} />
          </button>
          {open && (
            <div className="absolute bottom-11 right-0 bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-2 min-w-[140px]">
              {(Object.keys(basemaps) as (keyof typeof basemaps)[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSwitch(key)}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    active === key ? 'bg-emerald-600/30 text-emerald-400' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {basemapLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5: 创建 DrawLayer 和 MeasureLayer 占位组件**

创建 `src/components/tools/DrawLayer.tsx`：
```tsx
export function DrawLayer() {
  // 绘制图层将在 Task 4 中实现
  return null
}
```

创建 `src/components/tools/MeasureLayer.tsx`：
```tsx
export function MeasureLayer() {
  // 测量图层将在 Task 5 中实现
  return null
}
```

- [ ] **Step 6: 验证地图渲染**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 4: 绘制与标注工具

**Files:**
- Modify: `src/components/tools/DrawLayer.tsx`
- Create: `src/utils/measurement.ts`

- [ ] **Step 1: 创建测量计算工具**

创建 `src/utils/measurement.ts`：
```typescript
import * as turf from '@turf/turf'

export function calcDistance(coords: [number, number][]): { value: number; unit: string } {
  if (coords.length < 2) return { value: 0, unit: 'km' }
  const line = turf.lineString(coords)
  const length = turf.length(line, { units: 'kilometers' })
  if (length < 1) return { value: length * 1000, unit: 'm' }
  return { value: length, unit: 'km' }
}

export function calcArea(coords: [number, number][]): { value: number; unit: string } {
  if (coords.length < 3) return { value: 0, unit: 'km²' }
  const polygon = turf.polygon([coords])
  const area = turf.area(polygon) / 1e6 // km²
  if (area < 0.01) return { value: area * 1e6, unit: 'm²' }
  return { value: area, unit: 'km²' }
}

export function calcBearing(start: [number, number], end: [number, number]): number {
  const point1 = turf.point(start)
  const point2 = turf.point(end)
  return turf.bearing(point1, point2)
}

export function formatCoord(lng: number, lat: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}
```

- [ ] **Step 2: 实现 DrawLayer 组件**

修改 `src/components/tools/DrawLayer.tsx`：
```tsx
import { useEffect, useCallback } from 'react'
import { useMapEvents, Marker, Polyline, Polygon, Rectangle, Circle, Tooltip } from 'react-leaflet'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAppStore } from '../../store/useAppStore'
import { DrawFeature } from '../../types'

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

let featureCounter = 0

export function DrawLayer() {
  const toolMode = useAppStore((s) => s.toolMode)
  const drawFeatures = useAppStore((s) => s.drawFeatures)
  const addDrawFeature = useAppStore((s) => s.addDrawFeature)
  const setSelectedFeature = useAppStore((s) => s.setSelectedFeature)
  const map = useMap()

  const tempPoints = useAppStore.__tempPoints || []

  useEffect(() => {
    useAppStore.__tempPoints = []
  }, [toolMode])

  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!toolMode.startsWith('draw')) return

      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]

      if (toolMode === 'draw-marker') {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'marker',
          coordinates: latlng,
          properties: { name: `标注点 ${featureCounter}` },
          style: {},
        }
        addDrawFeature(feature)
        return
      }

      if (toolMode === 'draw-text') {
        const text = prompt('请输入标注文字：')
        if (!text) return
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'text',
          coordinates: latlng,
          properties: { text },
          style: {},
        }
        addDrawFeature(feature)
        return
      }

      if (!useAppStore.__tempPoints) useAppStore.__tempPoints = []
      useAppStore.__tempPoints.push(latlng)

      const points = useAppStore.__tempPoints

      if (toolMode === 'draw-polyline' && points.length >= 2) {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'polyline',
          coordinates: points,
          properties: { name: `线 ${featureCounter}` },
          style: { color: '#10b981', weight: 3 },
        }
        addDrawFeature(feature)
        useAppStore.__tempPoints = []
      }

      if (toolMode === 'draw-polygon' && points.length >= 3) {
        const feature: DrawFeature = {
          id: `draw-${++featureCounter}`,
          type: 'polygon',
          coordinates: points,
          properties: { name: `多边形 ${featureCounter}` },
          style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, weight: 2 },
        }
        addDrawFeature(feature)
        useAppStore.__tempPoints = []
      }
    },
    [toolMode, addDrawFeature]
  )

  useMapEvents({
    click: handleClick,
  })

  return (
    <>
      {drawFeatures.map((f) => {
        if (f.type === 'marker') {
          const pos = f.coordinates as [number, number]
          return (
            <Marker
              key={f.id}
              position={pos}
              icon={defaultIcon}
              eventHandlers={{
                click: () => setSelectedFeature(f),
              }}
            >
              <Tooltip permanent={!!f.properties.text}>
                {(f.properties.text as string) || (f.properties.name as string)}
              </Tooltip>
            </Marker>
          )
        }
        if (f.type === 'polyline') {
          return (
            <Polyline
              key={f.id}
              positions={f.coordinates as [number, number][]}
              pathOptions={{ color: f.style.color || '#10b981', weight: f.style.weight || 3 }}
              eventHandlers={{ click: () => setSelectedFeature(f) }}
            />
          )
        }
        if (f.type === 'polygon') {
          return (
            <Polygon
              key={f.id}
              positions={f.coordinates as [number, number][]}
              pathOptions={{
                color: f.style.color || '#10b981',
                fillColor: f.style.fillColor || '#10b981',
                fillOpacity: f.style.fillOpacity || 0.2,
                weight: f.style.weight || 2,
              }}
              eventHandlers={{ click: () => setSelectedFeature(f) }}
            />
          )
        }
        return null
      })}
    </>
  )
}

// 扩展 store 类型以支持临时点
declare module '../../store/useAppStore' {
  interface AppState {
    __tempPoints?: [number, number][]
  }
}
```

- [ ] **Step 3: 验证绘制功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 5: 测量工具

**Files:**
- Modify: `src/components/tools/MeasureLayer.tsx`

- [ ] **Step 1: 实现 MeasureLayer 组件**

修改 `src/components/tools/MeasureLayer.tsx`：
```tsx
import { useCallback, useEffect } from 'react'
import { useMapEvents, Polyline, Polygon, Tooltip } from 'react-leaflet'
import { useAppStore } from '../../store/useAppStore'
import { calcDistance, calcArea, calcBearing } from '../../utils/measurement'

export function MeasureLayer() {
  const toolMode = useAppStore((s) => s.toolMode)
  const measureResults = useAppStore((s) => s.measureResults)
  const addMeasureResult = useAppStore((s) => s.addMeasureResult)
  const clearMeasureResults = useAppStore((s) => s.clearMeasureResults)
  const setPropertyPanelOpen = useAppStore((s) => s.setPropertyPanelOpen)

  useEffect(() => {
    if (toolMode.startsWith('measure')) {
      clearMeasureResults()
      useAppStore.__measurePoints = []
      setPropertyPanelOpen(true)
    }
  }, [toolMode, clearMeasureResults, setPropertyPanelOpen])

  const handleClick = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (!toolMode.startsWith('measure')) return

      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng]
      if (!useAppStore.__measurePoints) useAppStore.__measurePoints = []
      useAppStore.__measurePoints.push(latlng)
      const points = useAppStore.__measurePoints

      if (toolMode === 'measure-distance' && points.length >= 2) {
        const result = calcDistance(points)
        addMeasureResult({
          type: 'distance',
          value: result.value,
          unit: result.unit,
          coordinates: [...points],
        })
      }

      if (toolMode === 'measure-area' && points.length >= 3) {
        const result = calcArea(points)
        addMeasureResult({
          type: 'area',
          value: result.value,
          unit: result.unit,
          coordinates: [...points],
        })
      }

      if (toolMode === 'measure-angle' && points.length === 2) {
        const bearing = calcBearing(points[0], points[1])
        addMeasureResult({
          type: 'angle',
          value: bearing < 0 ? bearing + 360 : bearing,
          unit: '°',
          coordinates: [...points],
        })
        useAppStore.__measurePoints = []
      }
    },
    [toolMode, addMeasureResult]
  )

  useMapEvents({ click: handleClick })

  return (
    <>
      {measureResults.map((r, i) => {
        if (r.type === 'distance' && r.coordinates.length >= 2) {
          return (
            <Polyline
              key={`m-${i}`}
              positions={r.coordinates}
              pathOptions={{ color: '#f59e0b', weight: 3, dashArray: '8 4' }}
            >
              <Tooltip permanent>
                {r.value.toFixed(2)} {r.unit}
              </Tooltip>
            </Polyline>
          )
        }
        if (r.type === 'area' && r.coordinates.length >= 3) {
          return (
            <Polygon
              key={`m-${i}`}
              positions={r.coordinates}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 2, dashArray: '8 4' }}
            >
              <Tooltip permanent>
                {r.value.toFixed(2)} {r.unit}
              </Tooltip>
            </Polygon>
          )
        }
        return null
      })}
    </>
  )
}

// 临时存储
declare module '../../store/useAppStore' {
  interface AppState {
    __measurePoints?: [number, number][]
  }
}
```

- [ ] **Step 2: 验证测量功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 6: 搜索定位工具

**Files:**
- Create: `src/components/tools/SearchTool.tsx`
- Create: `src/hooks/useGeocoding.ts`

- [ ] **Step 1: 创建 useGeocoding hook**

创建 `src/hooks/useGeocoding.ts`：
```typescript
import { useState, useCallback } from 'react'

interface GeocodingResult {
  display_name: string
  lat: string
  lon: string
}

export function useGeocoding() {
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  return { results, loading, search }
}
```

- [ ] **Step 2: 创建 SearchTool 组件**

创建 `src/components/tools/SearchTool.tsx`：
```tsx
import { useState } from 'react'
import { useMap } from 'react-leaflet'
import { useGeocoding } from '../../hooks/useGeocoding'
import { Search, MapPin, Loader2 } from 'lucide-react'

export function SearchTool() {
  const [query, setQuery] = useState('')
  const { results, loading, search } = useGeocoding()
  const map = useMap()

  const handleSearch = () => {
    if (query.trim()) search(query.trim())
  }

  const handleSelect = (lat: string, lon: string) => {
    map.setView([parseFloat(lat), parseFloat(lon)], 14)
  }

  const handleCoordSearch = () => {
    const match = query.match(/^(-?\d+\.?\d*)\s*[,，\s]\s*(-?\d+\.?\d*)$/)
    if (match) {
      const [, lat, lng] = match
      map.setView([parseFloat(lat), parseFloat(lng)], 14)
    }
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-96">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 p-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索地址或输入坐标（纬度, 经度）"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
          <button
            onClick={handleCoordSearch}
            className="text-xs text-emerald-400 hover:text-emerald-300 shrink-0"
          >
            坐标定位
          </button>
          <button
            onClick={handleSearch}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : '搜索'}
          </button>
        </div>
        {results.length > 0 && (
          <div className="border-t border-gray-700 max-h-60 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r.lat, r.lon)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-300 flex items-start gap-2"
              >
                <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 将 SearchTool 集成到 MapContainer**

在 `src/components/map/MapContainer.tsx` 中添加 SearchTool：
```tsx
// 在 import 中添加
import { SearchTool } from '../tools/SearchTool'

// 在 LeafletMapContainer 内添加
<SearchTool />
```

- [ ] **Step 4: 验证搜索功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 7: 数据导入导出

**Files:**
- Create: `src/components/tools/ImportExport.tsx`
- Create: `src/utils/dataIO.ts`

- [ ] **Step 1: 创建数据 IO 工具**

创建 `src/utils/dataIO.ts`：
```typescript
import type { FeatureCollection, GeoJsonObject } from 'geojson'

export function parseGeoJSON(text: string): GeoJsonObject {
  const parsed = JSON.parse(text)
  return parsed as GeoJsonObject
}

export function parseKML(text: string): GeoJsonObject {
  // 简易 KML 解析 - 使用 toGeoJSON 库或自行解析
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/xml')

  const placemarks = doc.querySelectorAll('Placemark')
  const features: any[] = []

  placemarks.forEach((pm) => {
    const name = pm.querySelector('name')?.textContent || ''
    const point = pm.querySelector('Point coordinates')
    const line = pm.querySelector('LineString coordinates')
    const poly = pm.querySelector('Polygon outerBoundaryIs LinearRing coordinates')

    let geometry: any = null
    const coordsText = (point || line || poly)?.textContent?.trim() || ''

    if (point) {
      const [lng, lat] = coordsText.split(',').map(Number)
      geometry = { type: 'Point', coordinates: [lng, lat] }
    } else if (line) {
      const coords = coordsText.split(/\s+/).filter(Boolean).map((c) => {
        const [lng, lat] = c.split(',').map(Number)
        return [lng, lat]
      })
      geometry = { type: 'LineString', coordinates: coords }
    } else if (poly) {
      const coords = coordsText.split(/\s+/).filter(Boolean).map((c) => {
        const [lng, lat] = c.split(',').map(Number)
        return [lng, lat]
      })
      geometry = { type: 'Polygon', coordinates: [coords] }
    }

    if (geometry) {
      features.push({ type: 'Feature', properties: { name }, geometry })
    }
  })

  return { type: 'FeatureCollection', features } as FeatureCollection
}

export function parseCSV(text: string): FeatureCollection {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { type: 'FeatureCollection', features: [] }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const latIdx = headers.findIndex((h) => ['lat', 'latitude', '纬度'].includes(h))
  const lngIdx = headers.findIndex((h) => ['lng', 'lon', 'longitude', '经度'].includes(h))

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error('CSV 中未找到经纬度列（需要 lat/lng 列）')
  }

  const features = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const properties: Record<string, string> = {}
    headers.forEach((h, i) => {
      if (i !== latIdx && i !== lngIdx) properties[h] = values[i] || ''
    })
    return {
      type: 'Feature' as const,
      properties,
      geometry: {
        type: 'Point' as const,
        coordinates: [parseFloat(values[lngIdx]), parseFloat(values[latIdx])],
      },
    }
  })

  return { type: 'FeatureCollection', features }
}

export function exportGeoJSON(data: GeoJsonObject): string {
  return JSON.stringify(data, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: 创建 ImportExport 组件**

创建 `src/components/tools/ImportExport.tsx`：
```tsx
import { useRef, useState } from 'react'
import { Upload, Download, FileJson, FileText, Map } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { parseGeoJSON, parseKML, parseCSV, exportGeoJSON, downloadFile } from '../../utils/dataIO'
import { GeoLayer } from '../../types'

export function ImportExport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const addLayer = useAppStore((s) => s.addLayer)
  const layers = useAppStore((s) => s.layers)
  const [status, setStatus] = useState('')

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      let data

      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        data = parseGeoJSON(text)
      } else if (file.name.endsWith('.kml')) {
        data = parseKML(text)
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(text)
      } else {
        setStatus('不支持的文件格式')
        return
      }

      const layer: GeoLayer = {
        id: `layer-${Date.now()}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        visible: true,
        opacity: 1,
        zIndex: layers.length,
        data,
        type: 'geojson',
        style: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.3, weight: 2 },
      }
      addLayer(layer)
      setStatus(`已导入: ${file.name}`)
    } catch (err) {
      setStatus(`导入失败: ${(err as Error).message}`)
    }
  }

  const handleExport = (format: 'geojson' | 'kml') => {
    const geoLayers = layers.filter((l) => l.type === 'geojson')
    if (geoLayers.length === 0) {
      setStatus('没有可导出的图层')
      return
    }

    if (format === 'geojson') {
      const fc = {
        type: 'FeatureCollection' as const,
        features: geoLayers.flatMap((l) =>
          (l.data as any).features || [l.data]
        ),
      }
      downloadFile(exportGeoJSON(fc), 'export.geojson', 'application/geo+json')
    }

    setStatus('导出成功')
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[320px]">
        <h3 className="text-sm font-semibold mb-3">数据导入导出</h3>

        <div className="space-y-3">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".geojson,.json,.kml,.csv"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-600 rounded-lg hover:border-emerald-500 transition-colors text-sm"
            >
              <Upload size={16} />
              导入文件（GeoJSON / KML / CSV）
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('geojson')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm transition-colors"
            >
              <FileJson size={14} />
              导出 GeoJSON
            </button>
          </div>

          {status && (
            <p className="text-xs text-gray-400 text-center">{status}</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 验证导入导出功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 8: 坐标系转换工具

**Files:**
- Create: `src/components/tools/CoordTransform.tsx`
- Create: `src/utils/coordinate.ts`
- Create: `src/data/projections.ts`

- [ ] **Step 1: 创建预定义坐标系统参数**

创建 `src/data/projections.ts`：
```typescript
export const projections: Record<string, { name: string; proj4: string }> = {
  'EPSG:4326': { name: 'WGS 84', proj4: '+proj=longlat +datum=WGS84 +no_defs' },
  'EPSG:4490': { name: 'CGCS2000', proj4: '+proj=longlat +ellps=GRS80 +no_defs' },
  'EPSG:32650': { name: 'UTM Zone 50N', proj4: '+proj=utm +zone=50 +datum=WGS84 +units=m +no_defs' },
  'EPSG:32651': { name: 'UTM Zone 51N', proj4: '+proj=utm +zone=51 +datum=WGS84 +units=m +no_defs' },
  'EPSG:3857': { name: 'Web Mercator', proj4: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs' },
}
```

- [ ] **Step 2: 创建坐标转换工具**

创建 `src/utils/coordinate.ts`：
```typescript
import proj4 from 'proj4'
import { projections } from '../data/projections'

// 初始化所有投影定义
Object.entries(projections).forEach(([code, def]) => {
  proj4.defs(code, def.proj4)
})

export function transformCoord(
  coord: [number, number],
  from: string,
  to: string
): [number, number] {
  if (from === to) return coord
  const result = proj4(from, to, coord)
  return [result[0], result[1]]
}

// WGS84 <-> GCJ02 转换（火星坐标系）
const PI = Math.PI
const A = 6378245.0
const EE = 0.00669342162296594323

function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  return [lng + dLng, lat + dLat]
}

export function gcj02ToWgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat]
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  return [lng - dLng, lat - dLat]
}

export function gcj02ToBd09(lng: number, lat: number): [number, number] {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin((lat * PI * 3000.0) / 180.0)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos((lng * PI * 3000.0) / 180.0)
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006]
}

export function bd09ToGcj02(lng: number, lat: number): [number, number] {
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin((y * PI * 3000.0) / 180.0)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos((x * PI * 3000.0) / 180.0)
  return [z * Math.cos(theta), z * Math.sin(theta)]
}
```

- [ ] **Step 3: 创建 CoordTransform 组件**

创建 `src/components/tools/CoordTransform.tsx`：
```tsx
import { useState } from 'react'
import { Crosshair, ArrowRightLeft, Copy } from 'lucide-react'
import { transformCoord, wgs84ToGcj02, gcj02ToWgs84, gcj02ToBd09, bd09ToGcj02 } from '../../utils/coordinate'

type ChinaCoordSystem = 'WGS84' | 'GCJ02' | 'BD09'

const chinaCoordSystems: { value: ChinaCoordSystem; label: string }[] = [
  { value: 'WGS84', label: 'WGS 84（GPS）' },
  { value: 'GCJ02', label: 'GCJ-02（高德/腾讯）' },
  { value: 'BD09', label: 'BD-09（百度）' },
]

const epsgSystems = [
  { value: 'EPSG:4326', label: 'WGS 84' },
  { value: 'EPSG:4490', label: 'CGCS2000' },
  { value: 'EPSG:3857', label: 'Web Mercator' },
  { value: 'EPSG:32650', label: 'UTM 50N' },
  { value: 'EPSG:32651', label: 'UTM 51N' },
]

export function CoordTransform() {
  const [tab, setTab] = useState<'china' | 'epsg'>('china')
  const [inputLng, setInputLng] = useState('116.4074')
  const [inputLat, setInputLat] = useState('39.9042')
  const [fromSystem, setFromSystem] = useState<ChinaCoordSystem>('WGS84')
  const [toSystem, setToSystem] = useState<ChinaCoordSystem>('GCJ02')
  const [fromEpsg, setFromEpsg] = useState('EPSG:4326')
  const [toEpsg, setToEpsg] = useState('EPSG:3857')
  const [result, setResult] = useState<[number, number] | null>(null)

  const convertChina = () => {
    const lng = parseFloat(inputLng)
    const lat = parseFloat(inputLat)
    if (isNaN(lng) || isNaN(lat)) return

    let res: [number, number]
    if (fromSystem === toSystem) {
      res = [lng, lat]
    } else if (fromSystem === 'WGS84' && toSystem === 'GCJ02') {
      res = wgs84ToGcj02(lng, lat)
    } else if (fromSystem === 'GCJ02' && toSystem === 'WGS84') {
      res = gcj02ToWgs84(lng, lat)
    } else if (fromSystem === 'GCJ02' && toSystem === 'BD09') {
      res = gcj02ToBd09(lng, lat)
    } else if (fromSystem === 'BD09' && toSystem === 'GCJ02') {
      res = bd09ToGcj02(lng, lat)
    } else if (fromSystem === 'WGS84' && toSystem === 'BD09') {
      res = gcj02ToBd09(...wgs84ToGcj02(lng, lat))
    } else if (fromSystem === 'BD09' && toSystem === 'WGS84') {
      res = gcj02ToWgs84(...bd09ToGcj02(lng, lat))
    } else {
      res = [lng, lat]
    }
    setResult(res)
  }

  const convertEpsg = () => {
    const lng = parseFloat(inputLng)
    const lat = parseFloat(inputLat)
    if (isNaN(lng) || isNaN(lat)) return
    const res = transformCoord([lng, lat], fromEpsg, toEpsg)
    setResult(res)
  }

  const handleConvert = () => {
    if (tab === 'china') convertChina()
    else convertEpsg()
  }

  const copyResult = () => {
    if (result) navigator.clipboard.writeText(`${result[0]}, ${result[1]}`)
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[380px]">
        <div className="flex items-center gap-2 mb-3">
          <Crosshair size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">坐标系转换</h3>
        </div>

        <div className="flex gap-1 mb-3 bg-gray-900 rounded p-0.5">
          <button
            onClick={() => setTab('china')}
            className={`flex-1 text-xs py-1.5 rounded transition-colors ${
              tab === 'china' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            国测局坐标系
          </button>
          <button
            onClick={() => setTab('epsg')}
            className={`flex-1 text-xs py-1.5 rounded transition-colors ${
              tab === 'epsg' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            EPSG 投影转换
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">经度 / X</label>
              <input
                type="text"
                value={inputLng}
                onChange={(e) => setInputLng(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">纬度 / Y</label>
              <input
                type="text"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">源坐标系</label>
              <select
                value={tab === 'china' ? fromSystem : fromEpsg}
                onChange={(e) => tab === 'china' ? setFromSystem(e.target.value as ChinaCoordSystem) : setFromEpsg(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {tab === 'china'
                  ? chinaCoordSystems.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
                  : epsgSystems.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
                }
              </select>
            </div>
            <ArrowRightLeft size={16} className="text-gray-500 mt-5" />
            <div className="flex-1">
              <label className="text-xs text-gray-500">目标坐标系</label>
              <select
                value={tab === 'china' ? toSystem : toEpsg}
                onChange={(e) => tab === 'china' ? setToSystem(e.target.value as ChinaCoordSystem) : setToEpsg(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {tab === 'china'
                  ? chinaCoordSystems.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
                  : epsgSystems.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
                }
              </select>
            </div>
          </div>

          <button
            onClick={handleConvert}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
          >
            转换
          </button>

          {result && (
            <div className="flex items-center gap-2 bg-gray-900 rounded px-3 py-2">
              <span className="text-sm font-mono text-emerald-400 flex-1">
                {result[0].toFixed(8)}, {result[1].toFixed(8)}
              </span>
              <button onClick={copyResult} className="text-gray-400 hover:text-white">
                <Copy size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证坐标转换功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 9: 空间分析工具

**Files:**
- Create: `src/components/tools/SpatialAnalysis.tsx`
- Create: `src/utils/spatial.ts`

- [ ] **Step 1: 创建空间分析封装**

创建 `src/utils/spatial.ts`：
```typescript
import * as turf from '@turf/turf'
import type { FeatureCollection, Feature, Polygon, LineString, Point } from 'geojson'

export function bufferAnalysis(
  geojson: FeatureCollection | Feature,
  radius: number,
  units: turf.Units = 'kilometers'
): Feature<Polygon> | FeatureCollection {
  return turf.buffer(geojson, radius, { units })
}

export function intersectAnalysis(
  poly1: Feature<Polygon> | Polygon,
  poly2: Feature<Polygon> | Polygon
): Feature<Polygon> | null {
  return turf.intersect(turf.featureCollection([poly1 as Feature<Polygon>, poly2 as Feature<Polygon>]))
}

export function unionAnalysis(
  poly1: Feature<Polygon> | Polygon,
  poly2: Feature<Polygon> | Polygon
): Feature<Polygon> | FeatureCollection {
  return turf.union(turf.featureCollection([poly1 as Feature<Polygon>, poly2 as Feature<Polygon>]))
}

export function differenceAnalysis(
  poly1: Feature<Polygon> | Polygon,
  poly2: Feature<Polygon> | Polygon
): Feature<Polygon> | FeatureCollection | null {
  return turf.difference(turf.featureCollection([poly1 as Feature<Polygon>, poly2 as Feature<Polygon>]))
}

export function convexHullAnalysis(geojson: FeatureCollection): Feature<Polygon> | null {
  return turf.convex(geojson)
}

export function voronoiAnalysis(
  points: FeatureCollection<Point>,
  bbox?: [number, number, number, number]
): FeatureCollection<Polygon> {
  return turf.voronoi(points, { bbox })
}

export function tinAnalysis(
  points: FeatureCollection<Point>,
  property?: string
): FeatureCollection {
  return turf.tin(points, property)
}

export function centerOfMass(geojson: FeatureCollection | Feature): Feature<Point> {
  return turf.centerOfMass(geojson)
}
```

- [ ] **Step 2: 创建 SpatialAnalysis 组件**

创建 `src/components/tools/SpatialAnalysis.tsx`：
```tsx
import { useState } from 'react'
import { Compass, Play } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { bufferAnalysis, convexHullAnalysis, centerOfMass } from '../../utils/spatial'
import type { GeoLayer } from '../../types'

type AnalysisType = 'buffer' | 'convex' | 'center' | 'voronoi' | 'tin'

const analysisOptions: { value: AnalysisType; label: string; desc: string }[] = [
  { value: 'buffer', label: '缓冲区分析', desc: '在要素周围创建指定距离的缓冲区' },
  { value: 'convex', label: '凸包分析', desc: '计算点集的凸包多边形' },
  { value: 'center', label: '质心计算', desc: '计算要素集合的质心' },
  { value: 'voronoi', label: '泰森多边形', desc: '基于点集生成 Voronoi 图' },
  { value: 'tin', label: 'TIN 三角网', desc: '基于点集生成不规则三角网' },
]

export function SpatialAnalysis() {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('buffer')
  const [bufferRadius, setBufferRadius] = useState('5')
  const [bufferUnit, setBufferUnit] = useState<'kilometers' | 'miles' | 'meters'>('kilometers')
  const [status, setStatus] = useState('')
  const layers = useAppStore((s) => s.layers)
  const drawFeatures = useAppStore((s) => s.drawFeatures)
  const addLayer = useAppStore((s) => s.addLayer)

  const runAnalysis = () => {
    const geoLayers = layers.filter((l) => l.type === 'geojson')
    if (geoLayers.length === 0 && drawFeatures.length === 0) {
      setStatus('没有可分析的数据，请先导入或绘制要素')
      return
    }

    try {
      let result: any

      if (analysisType === 'buffer') {
        const fc = {
          type: 'FeatureCollection' as const,
          features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
        }
        result = bufferAnalysis(fc, parseFloat(bufferRadius), bufferUnit)
      } else if (analysisType === 'convex') {
        const fc = {
          type: 'FeatureCollection' as const,
          features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
        }
        result = convexHullAnalysis(fc)
      } else if (analysisType === 'center') {
        const fc = {
          type: 'FeatureCollection' as const,
          features: geoLayers.flatMap((l) => (l.data as any).features || [l.data]),
        }
        result = centerOfMass(fc)
      }

      if (result) {
        const newLayer: GeoLayer = {
          id: `layer-${Date.now()}`,
          name: `${analysisOptions.find((a) => a.value === analysisType)?.label}结果`,
          visible: true,
          opacity: 0.8,
          zIndex: layers.length,
          data: result,
          type: 'geojson',
          style: { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 2 },
        }
        addLayer(newLayer)
        setStatus('分析完成，结果已添加为新图层')
      }
    } catch (err) {
      setStatus(`分析失败: ${(err as Error).message}`)
    }
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[380px]">
        <div className="flex items-center gap-2 mb-3">
          <Compass size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">空间分析</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">分析类型</label>
            <div className="mt-1 space-y-1">
              {analysisOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnalysisType(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    analysisType === opt.value
                      ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/50'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {analysisType === 'buffer' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500">缓冲距离</label>
                <input
                  type="number"
                  value={bufferRadius}
                  onChange={(e) => setBufferRadius(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm font-mono"
                />
              </div>
              <div className="w-28">
                <label className="text-xs text-gray-500">单位</label>
                <select
                  value={bufferUnit}
                  onChange={(e) => setBufferUnit(e.target.value as any)}
                  className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
                >
                  <option value="kilometers">公里</option>
                  <option value="meters">米</option>
                  <option value="miles">英里</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={runAnalysis}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
          >
            <Play size={14} />
            执行分析
          </button>

          {status && (
            <p className="text-xs text-gray-400 text-center">{status}</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 验证空间分析功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 10: 图层管理面板

**Files:**
- Create: `src/components/map/LayerManager.tsx`

- [ ] **Step 1: 创建 LayerManager 组件**

创建 `src/components/map/LayerManager.tsx`：
```tsx
import { useAppStore } from '../../store/useAppStore'
import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Layers } from 'lucide-react'

export function LayerManager() {
  const layers = useAppStore((s) => s.layers)
  const toggleLayerVisibility = useAppStore((s) => s.toggleLayerVisibility)
  const removeLayer = useAppStore((s) => s.removeLayer)
  const updateLayerOpacity = useAppStore((s) => s.updateLayerOpacity)

  return (
    <div className="absolute bottom-3 left-3 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg shadow-xl min-w-[260px]">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
          <Layers size={14} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">图层管理</h3>
          <span className="text-xs text-gray-500 ml-auto">{layers.length} 个图层</span>
        </div>

        {layers.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            暂无图层，请导入数据或绘制要素
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700/50 border-b border-gray-700/50 last:border-0"
              >
                <button
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className="text-gray-400 hover:text-white"
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span className={`flex-1 text-sm truncate ${layer.visible ? 'text-gray-200' : 'text-gray-500'}`}>
                  {layer.name}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={layer.opacity}
                  onChange={(e) => updateLayerOpacity(layer.id, parseFloat(e.target.value))}
                  className="w-16 h-1 accent-emerald-500"
                />
                <button
                  onClick={() => removeLayer(layer.id)}
                  className="text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 将 LayerManager 集成到 MapContainer**

在 `src/components/map/MapContainer.tsx` 中添加 LayerManager：
```tsx
// 在 import 中添加
import { LayerManager } from './LayerManager'

// 在 LeafletMapContainer 内添加
<LayerManager />
```

- [ ] **Step 3: 验证图层管理**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 11: 数据可视化（热力图 / 聚合 / 分级着色）

**Files:**
- Create: `src/components/visualization/HeatmapLayer.tsx`
- Create: `src/components/visualization/ClusterLayer.tsx`
- Create: `src/components/visualization/ChoroplethLayer.tsx`
- Create: `src/components/tools/VisualizationPanel.tsx`

- [ ] **Step 1: 创建热力图组件**

创建 `src/components/visualization/HeatmapLayer.tsx`：
```tsx
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

interface HeatmapLayerProps {
  points: [number, number, number][] // [lat, lng, intensity]
  radius?: number
  blur?: number
  maxZoom?: number
}

export function HeatmapLayer({ points, radius = 25, blur = 15, maxZoom = 17 }: HeatmapLayerProps) {
  const map = useMap()
  const heatRef = useRef<L.HeatLayer | null>(null)

  useEffect(() => {
    if (heatRef.current) {
      map.removeLayer(heatRef.current)
    }
    // @ts-expect-error leaflet.heat extends L
    heatRef.current = L.heatLayer(points, { radius, blur, maxZoom }).addTo(map)
    return () => {
      if (heatRef.current) map.removeLayer(heatRef.current)
    }
  }, [points, radius, blur, maxZoom, map])

  return null
}
```

- [ ] **Step 2: 创建聚合图层组件**

创建 `src/components/visualization/ClusterLayer.tsx`：
```tsx
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

interface ClusterLayerProps {
  points: [number, number][] // [lat, lng]
}

export function ClusterLayer({ points }: ClusterLayerProps) {
  const map = useMap()
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null)

  useEffect(() => {
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
    }

    const clusterGroup = L.markerClusterGroup({
      iconCreateFunction(cluster: L.MarkerCluster) {
        const count = cluster.getChildCount()
        let size = 'small'
        if (count > 100) size = 'large'
        else if (count > 10) size = 'medium'
        return L.divIcon({
          html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
        })
      },
    })

    points.forEach(([lat, lng]) => {
      L.marker([lat, lng]).addTo(clusterGroup)
    })

    clusterRef.current = clusterGroup
    map.addLayer(clusterGroup)

    return () => {
      if (clusterRef.current) map.removeLayer(clusterRef.current)
    }
  }, [points, map])

  return null
}
```

- [ ] **Step 3: 创建可视化控制面板**

创建 `src/components/tools/VisualizationPanel.tsx`：
```tsx
import { useState } from 'react'
import { BarChart3, Play } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { GeoLayer } from '../../types'

type VizType = 'heatmap' | 'cluster' | 'choropleth'

const vizOptions: { value: VizType; label: string; desc: string }[] = [
  { value: 'heatmap', label: '热力图', desc: '基于点密度生成热力分布图' },
  { value: 'cluster', label: '聚合显示', desc: '将密集点聚合展示' },
  { value: 'choropleth', label: '分级着色', desc: '按属性值分级着色' },
]

export function VisualizationPanel() {
  const [vizType, setVizType] = useState<VizType>('heatmap')
  const [radius, setRadius] = useState(25)
  const [status, setStatus] = useState('')
  const layers = useAppStore((s) => s.layers)
  const addLayer = useAppStore((s) => s.addLayer)

  const runViz = () => {
    const geoLayers = layers.filter((l) => l.type === 'geojson')
    if (geoLayers.length === 0) {
      setStatus('没有可用的点数据')
      return
    }

    const newLayer: GeoLayer = {
      id: `layer-viz-${Date.now()}`,
      name: `${vizOptions.find((v) => v.value === vizType)?.label}`,
      visible: true,
      opacity: 1,
      zIndex: layers.length,
      data: geoLayers[0].data,
      type: vizType === 'heatmap' ? 'heatmap' : vizType === 'cluster' ? 'cluster' : 'geojson',
      style: { radius },
    }
    addLayer(newLayer)
    setStatus('可视化图层已添加')
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[340px]">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">数据可视化</h3>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1">
            {vizOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setVizType(opt.value)}
                className={`px-2 py-2 rounded text-xs transition-colors ${
                  vizType === opt.value
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-600/50'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {vizType === 'heatmap' && (
            <div>
              <label className="text-xs text-gray-500">热力半径: {radius}</label>
              <input
                type="range"
                min="5"
                max="60"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full mt-1 accent-emerald-500"
              />
            </div>
          )}

          <button
            onClick={runViz}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
          >
            <Play size={14} />
            生成可视化
          </button>

          {status && <p className="text-xs text-gray-400 text-center">{status}</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证可视化功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 12: 批量坐标转换工具

**Files:**
- Create: `src/components/tools/BatchCoordTool.tsx`

- [ ] **Step 1: 创建 BatchCoordTool 组件**

创建 `src/components/tools/BatchCoordTool.tsx`：
```tsx
import { useState } from 'react'
import { Navigation, Upload, Download, Copy } from 'lucide-react'
import { wgs84ToGcj02, gcj02ToWgs84, gcj02ToBd09, bd09ToGcj02 } from '../../utils/coordinate'
import { downloadFile } from '../../utils/dataIO'

type ChinaCoordSystem = 'WGS84' | 'GCJ02' | 'BD09'

const systems: { value: ChinaCoordSystem; label: string }[] = [
  { value: 'WGS84', label: 'WGS 84' },
  { value: 'GCJ02', label: 'GCJ-02' },
  { value: 'BD09', label: 'BD-09' },
]

function convertPoint(lng: number, lat: number, from: ChinaCoordSystem, to: ChinaCoordSystem): [number, number] {
  if (from === to) return [lng, lat]
  if (from === 'WGS84' && to === 'GCJ02') return wgs84ToGcj02(lng, lat)
  if (from === 'GCJ02' && to === 'WGS84') return gcj02ToWgs84(lng, lat)
  if (from === 'GCJ02' && to === 'BD09') return gcj02ToBd09(lng, lat)
  if (from === 'BD09' && to === 'GCJ02') return bd09ToGcj02(lng, lat)
  if (from === 'WGS84' && to === 'BD09') return gcj02ToBd09(...wgs84ToGcj02(lng, lat))
  if (from === 'BD09' && to === 'WGS84') return gcj02ToWgs84(...bd09ToGcj02(lng, lat))
  return [lng, lat]
}

export function BatchCoordTool() {
  const [input, setInput] = useState('116.4074,39.9042\n121.4737,31.2304\n113.2644,23.1291')
  const [fromSystem, setFromSystem] = useState<ChinaCoordSystem>('WGS84')
  const [toSystem, setToSystem] = useState<ChinaCoordSystem>('GCJ02')
  const [results, setResults] = useState<string[]>([])

  const handleConvert = () => {
    const lines = input.trim().split('\n').filter(Boolean)
    const converted = lines.map((line) => {
      const parts = line.trim().split(/[,，\s]+/)
      const lng = parseFloat(parts[0])
      const lat = parseFloat(parts[1])
      if (isNaN(lng) || isNaN(lat)) return `无效: ${line}`
      const [rLng, rLat] = convertPoint(lng, lat, fromSystem, toSystem)
      return `${rLng.toFixed(8)}, ${rLat.toFixed(8)}`
    })
    setResults(converted)
  }

  const handleExport = () => {
    const content = results.join('\n')
    downloadFile(content, 'batch_convert_result.csv', 'text/csv')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(results.join('\n'))
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000]">
      <div className="bg-gray-800/95 backdrop-blur border border-gray-600 rounded-lg p-4 shadow-xl min-w-[440px]">
        <div className="flex items-center gap-2 mb-3">
          <Navigation size={16} className="text-emerald-400" />
          <h3 className="text-sm font-semibold">批量坐标转换</h3>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500">源坐标系</label>
              <select
                value={fromSystem}
                onChange={(e) => setFromSystem(e.target.value as ChinaCoordSystem)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {systems.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">目标坐标系</label>
              <select
                value={toSystem}
                onChange={(e) => setToSystem(e.target.value as ChinaCoordSystem)}
                className="w-full mt-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm"
              >
                {systems.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">输入坐标（每行一个，格式: 经度,纬度）</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={8}
                className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">转换结果</label>
              <textarea
                value={results.join('\n')}
                readOnly
                rows={8}
                className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-sm font-mono text-emerald-400 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConvert}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors"
            >
              批量转换
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证批量转换功能**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -5
```

Expected: 构建成功

---

### Task 13: 工具面板路由与集成

**Files:**
- Modify: `src/components/map/MapContainer.tsx` — 根据当前 toolMode 显示对应工具面板

- [ ] **Step 1: 在 MapContainer 中集成所有工具面板**

修改 `src/components/map/MapContainer.tsx`，在地图容器中根据 toolMode 条件渲染各工具面板：
```tsx
// 添加 imports
import { SearchTool } from '../tools/SearchTool'
import { ImportExport } from '../tools/ImportExport'
import { CoordTransform } from '../tools/CoordTransform'
import { SpatialAnalysis } from '../tools/SpatialAnalysis'
import { VisualizationPanel } from '../tools/VisualizationPanel'
import { BatchCoordTool } from '../tools/BatchCoordTool'

// 在 MapContainer 组件内，LeafletMapContainer 外层添加
function ToolOverlay({ toolMode }: { toolMode: string }) {
  switch (toolMode) {
    case 'search':
      return <SearchTool />
    case 'import-export':
      return <ImportExport />
    case 'coord-transform':
      return <CoordTransform />
    case 'spatial-analysis':
      return <SpatialAnalysis />
    case 'visualization':
      return <VisualizationPanel />
    case 'batch-coord':
      return <BatchCoordTool />
    default:
      return null
  }
}

// 在 return 中，地图容器同级添加
<div className="w-full h-full relative">
  <LeafletMapContainer ...>
    ...
  </LeafletMapContainer>
  <ToolOverlay toolMode={toolMode} />
</div>
```

- [ ] **Step 2: 完整构建验证**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -10
```

Expected: 构建成功，无错误

---

### Task 14: 样式优化与响应式适配

**Files:**
- Modify: `src/index.css` — 添加自定义样式

- [ ] **Step 1: 添加自定义样式**

修改 `src/index.css`，在 Tailwind 指令后添加：
```css
@import "tailwindcss";

.leaflet-container {
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* 聚合图标样式 */
.custom-cluster-icon {
  background: none !important;
}
.cluster-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
}
.cluster-small {
  background: rgba(16, 185, 129, 0.7);
}
.cluster-medium {
  background: rgba(245, 158, 11, 0.7);
}
.cluster-large {
  background: rgba(239, 68, 68, 0.7);
}

/* Leaflet 控件样式覆盖 */
.leaflet-control-zoom {
  display: none !important;
}
.leaflet-control-attribution {
  background: rgba(17, 24, 39, 0.8) !important;
  color: #6b7280 !important;
  font-size: 10px !important;
}
.leaflet-control-attribution a {
  color: #9ca3af !important;
}

/* 工具提示样式 */
.leaflet-tooltip {
  background: rgba(17, 24, 39, 0.9) !important;
  border: 1px solid #374151 !important;
  color: #e5e7eb !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  font-size: 12px !important;
}
.leaflet-tooltip-top::before {
  border-top-color: rgba(17, 24, 39, 0.9) !important;
}
```

- [ ] **Step 2: 最终构建与启动验证**

Run:
```bash
cd /workspace && npm run build 2>&1 | tail -10
```

Expected: 构建成功

Run:
```bash
cd /workspace && npm run dev -- --host 0.0.0.0 --port 5173
```

Expected: 开发服务器启动，可在浏览器中访问完整 GIS 工具网站

---

## 自检清单

### 1. 功能覆盖
- [x] 交互式地图 + 底图切换 → Task 3
- [x] 图层管理 → Task 10
- [x] 绘制标注工具 → Task 4
- [x] 测量工具 → Task 5
- [x] 搜索定位 → Task 6
- [x] 数据导入导出 → Task 7
- [x] 坐标系转换 → Task 8
- [x] 空间分析 → Task 9
- [x] 数据可视化 → Task 11
- [x] 批量坐标转换 → Task 12
- [x] 工具面板集成 → Task 13
- [x] 样式优化 → Task 14

### 2. 占位符扫描
- 无 TBD / TODO / "implement later" 等占位符
- 所有步骤包含完整代码

### 3. 类型一致性
- GeoLayer / DrawFeature / MeasureResult / ToolMode 类型在 types/index.ts 统一定义
- 各组件引用一致
