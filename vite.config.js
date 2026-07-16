import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Relative asset paths: the built dist/ can be dropped into any directory
  // of a static webserver (root or subfolder) without configuration.
  base: './',
  plugins: [vue()],
  server: {
    // The Docker baseline run (npm run ci:test:update) reaches this dev
    // server from inside the container under this hostname.
    allowedHosts: ['host.docker.internal'],
  },
})
