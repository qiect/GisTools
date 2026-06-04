import type { FeatureCollection, GeoJsonObject } from 'geojson'

export function parseGeoJSON(text: string): GeoJsonObject {
  return JSON.parse(text) as GeoJsonObject
}

export function parseKML(text: string): FeatureCollection {
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
    if (geometry) features.push({ type: 'Feature', properties: { name }, geometry })
  })

  return { type: 'FeatureCollection', features } as FeatureCollection
}

export function parseCSV(text: string): FeatureCollection {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { type: 'FeatureCollection', features: [] }
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const latIdx = headers.findIndex((h) => ['lat', 'latitude', '纬度'].includes(h))
  const lngIdx = headers.findIndex((h) => ['lng', 'lon', 'longitude', '经度'].includes(h))
  if (latIdx === -1 || lngIdx === -1) throw new Error('CSV 中未找到经纬度列（需要 lat/lng 列）')

  const features = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const properties: Record<string, string> = {}
    headers.forEach((h, i) => { if (i !== latIdx && i !== lngIdx) properties[h] = values[i] || '' })
    return {
      type: 'Feature' as const, properties,
      geometry: { type: 'Point' as const, coordinates: [parseFloat(values[lngIdx]), parseFloat(values[latIdx])] },
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
