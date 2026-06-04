import { ref } from 'vue'

interface GeocodingResult {
  display_name: string
  lat: string
  lon: string
}

export function useGeocoding() {
  const results = ref<GeocodingResult[]>([])
  const loading = ref(false)

  async function search(query: string) {
    loading.value = true
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
      results.value = await res.json()
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }

  return { results, loading, search }
}
