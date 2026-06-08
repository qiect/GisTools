import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/amap/road': {
        target: 'https://webrd01.is.autonavi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap\/road/, '/appmaptile'),
      },
      '/amap/sat': {
        target: 'https://webst01.is.autonavi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap\/sat/, '/appmaptile'),
      },
      '/amap/satlabel': {
        target: 'https://webst01.is.autonavi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap\/satlabel/, '/appmaptile'),
      },
      '/carto': {
        target: 'https://a.basemaps.cartocdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/carto/, ''),
      },
    },
  },
})
