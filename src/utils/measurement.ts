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
  const area = turf.area(polygon) / 1e6
  if (area < 0.01) return { value: area * 1e6, unit: 'm²' }
  return { value: area, unit: 'km²' }
}

export function calcBearing(start: [number, number], end: [number, number]): number {
  const point1 = turf.point(start)
  const point2 = turf.point(end)
  return turf.bearing(point1, point2)
}
