import { createContext, useContext } from 'react'
import type { Map as LeafletMap } from 'leaflet'

const MapInstanceContext = createContext<LeafletMap | null>(null)

export function MapInstanceProvider({
  map,
  children,
}: {
  map: LeafletMap | null
  children: React.ReactNode
}) {
  return <MapInstanceContext.Provider value={map}>{children}</MapInstanceContext.Provider>
}

export function useMapInstance(): LeafletMap | null {
  return useContext(MapInstanceContext)
}
