import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Split heavy, independently-cacheable libraries out of the main bundle.
// The landing page only needs React; Firebase, charts, Excel and ZIP code are
// fetched when a dashboard tab actually uses them.
function manualChunks(id) {
  if (!id.includes('node_modules')) return undefined
  if (id.includes('firebase')) return 'vendor-firebase'
  if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
  if (id.includes('xlsx')) return 'vendor-xlsx'
  if (id.includes('jszip') || id.includes('file-saver')) return 'vendor-files'
  if (id.includes('react') || id.includes('scheduler')) return 'vendor-react'
  return undefined
}

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
})
