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
        <span className="text-xs text-gray-500 hidden sm:inline">在线GIS工具平台</span>
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
