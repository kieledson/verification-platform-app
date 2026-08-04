import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/logos/*.png', 'assets/farm-satellite.png'],
      manifest: {
        name: 'Verification Platform',
        short_name: 'VP Field',
        description: 'Seafood Watch Verification Platform — field assessment',
        theme_color: '#005E9B',
        background_color: '#FBFAE8',
        display: 'standalone',
        icons: [
          {
            src: 'assets/logos/sfw-mark-color.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        // The standard is bundled + cached explicitly; this just keeps the
        // app shell (JS/CSS/HTML) available offline.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
