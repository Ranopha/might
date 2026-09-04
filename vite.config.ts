import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), '')
  const siteUrl = environment.VITE_CONVEX_SITE_URL
  const proxy: Record<string, string | ProxyOptions> | undefined = siteUrl
    ? { '/api': { target: siteUrl, changeOrigin: true, secure: true } }
    : undefined

  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
