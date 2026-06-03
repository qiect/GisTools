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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
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
