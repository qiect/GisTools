import { useAppStore } from '../../store/useAppStore'
import type { ToolMode } from '../../types'
import {
  Move, MapPin, PenTool, Pentagon, Square, Circle, Type,
  Ruler, Triangle, Compass, Search, Download, Crosshair,
  Layers, Navigation, BarChart3, Mountain, Route,
} from 'lucide-react'

interface ToolItem {
  mode: ToolMode
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

const panelTools: { mode: ToolMode; label: string; icon: React.ReactNode }[] = [
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

const groups = ['基础', '绘制', '测量']

export function Sidebar() {
  const toolMode = useAppStore((s) => s.toolMode)
  const setToolMode = useAppStore((s) => s.setToolMode)

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
                  onClick={() => setToolMode(tool.mode)}
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
              onClick={() => setToolMode(tool.mode)}
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
