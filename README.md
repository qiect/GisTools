# GeoToolkit - 在线GIS工具平台

基于 Vue 3 + Leaflet + Turf.js 构建的在线地理信息系统工具平台，提供地图浏览、空间分析、数据转换、标注测量等一站式地理信息处理能力。

## 功能模块

| 模块 | 说明 |
|------|------|
| 交互式地图 | 4 种底图切换（OSM/暗色/卫星/地形）、缩放、定位、全局视图 |
| 绘制标注 | 标注点、画线、画多边形、画矩形、画圆、文字标注，支持实时预览 |
| 测量工具 | 距离测量、面积测量、方位角测量 |
| 搜索定位 | 地址搜索（Nominatim）+ 坐标直接定位 |
| 数据导入导出 | 支持 GeoJSON / KML / CSV 导入，GeoJSON 导出 |
| 坐标系转换 | WGS84 / GCJ-02 / BD-09 互转 + EPSG 投影转换（UTM / Web Mercator / CGCS2000） |
| 空间分析 | 缓冲区分析、凸包、质心计算、泰森多边形、TIN 三角网 |
| 数据可视化 | 热力图、聚合显示、分级着色 |
| 批量坐标转换 | 批量坐标系互转，支持复制和 CSV 导出 |
| 图层管理 | 图层显隐、透明度调节、删除 |

## 技术栈

- **Vue 3** + TypeScript + Composition API
- **Vite** 构建工具
- **Leaflet** 地图引擎
- **Turf.js** 空间分析
- **Proj4js** 坐标投影转换
- **Pinia** 状态管理
- **Tailwind CSS** 样式
- **Lucide Vue Next** 图标

## 项目结构

```
src/
├── main.ts                          # 应用入口
├── App.vue                          # 根组件
├── types/index.ts                   # 全局类型定义
├── stores/appStore.ts               # Pinia 状态管理
├── composables/useGeocoding.ts      # 地理编码 composable
├── utils/
│   ├── coordinate.ts                # 坐标转换（WGS84/GCJ02/BD09 + EPSG）
│   ├── spatial.ts                   # 空间分析封装
│   ├── measurement.ts               # 测量计算
│   └── dataIO.ts                    # 数据导入导出
├── data/projections.ts              # 预定义坐标系统参数
└── components/
    ├── layout/                      # 布局组件
    │   ├── AppHeader.vue
    │   ├── AppSidebar.vue
    │   └── PropertyPanel.vue
    ├── map/                         # 地图组件
    │   ├── MapContainer.vue
    │   └── LayerManager.vue
    └── tools/                       # 工具面板
        ├── SearchTool.vue
        ├── ImportExport.vue
        ├── CoordTransform.vue
        ├── SpatialAnalysis.vue
        ├── VisualizationPanel.vue
        └── BatchCoordTool.vue
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 部署

项目为纯前端应用，构建后生成静态文件，可部署到任意静态托管服务。

### GitHub Pages

项目已配置 GitHub Actions 自动部署，推送到 `main` 分支即可自动构建部署到 GitHub Pages。

### 手动部署

```bash
npm run build
# 将 dist/ 目录部署到静态服务器
```

## 坐标系说明

| 坐标系 | 说明 | 使用场景 |
|--------|------|---------|
| WGS 84 | GPS 原始坐标系 | 国际标准，GPS 设备 |
| GCJ-02 | 国测局加密坐标 | 高德地图、腾讯地图 |
| BD-09 | 百度加密坐标 | 百度地图 |

## License

MIT
