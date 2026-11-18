// Explicit opt-in configuration for the Oracle + SSH tunnel test.
import baseConfig from './vite.config.js'

export default {
  ...baseConfig,
  server: {
    ...baseConfig.server,
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'https://matchwise-backend-monitoring-test.onrender.com',
        changeOrigin: true,
      },
    },
  },
}
