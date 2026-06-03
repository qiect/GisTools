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
