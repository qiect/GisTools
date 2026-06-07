import * as turf from '@turf/turf'

// Leaflet 坐标 [lat, lng] → GeoJSON 坐标 [lng, lat]
function toGeoJSON(coords: [number, number][]): [number, number][] {
  return coords.map(([lat, lng]) => [lng, lat])
}

export function calcDistance(coords: [number, number][]): { value: number; unit: string } {
  if (coords.length < 2) return { value: 0, unit: 'km' }
  const line = turf.lineString(toGeoJSON(coords))
  const length = turf.length(line, { units: 'kilometers' })
  if (length < 1) return { value: length * 1000, unit: 'm' }
  return { value: length, unit: 'km' }
}

export function calcArea(coords: [number, number][]): { value: number; unit: string } {
  if (coords.length < 3) return { value: 0, unit: 'km²' }
  const geoCoords = toGeoJSON(coords)
  // turf.polygon 需要闭合环
  const ring = [...geoCoords, geoCoords[0]]
  const polygon = turf.polygon([ring])
  const area = turf.area(polygon) / 1e6
  if (area < 0.01) return { value: area * 1e6, unit: 'm²' }
  return { value: area, unit: 'km²' }
}

export function calcBearing(start: [number, number], end: [number, number]): number {
  const point1 = turf.point(toGeoJSON([start])[0])
  const point2 = turf.point(toGeoJSON([end])[0])
  return turf.bearing(point1, point2)
}
