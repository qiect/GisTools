export const projections: Record<string, { name: string; proj4: string }> = {
  'EPSG:4326': { name: 'WGS 84', proj4: '+proj=longlat +datum=WGS84 +no_defs' },
  'EPSG:4490': { name: 'CGCS2000', proj4: '+proj=longlat +ellps=GRS80 +no_defs' },
  'EPSG:32650': { name: 'UTM Zone 50N', proj4: '+proj=utm +zone=50 +datum=WGS84 +units=m +no_defs' },
  'EPSG:32651': { name: 'UTM Zone 51N', proj4: '+proj=utm +zone=51 +datum=WGS84 +units=m +no_defs' },
  'EPSG:3857': { name: 'Web Mercator', proj4: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs' },
}
