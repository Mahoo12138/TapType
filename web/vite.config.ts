import { defineConfig } from "vite"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"

import { tanstackRouter } from '@tanstack/router-plugin/vite'

const devProxyServer = "http://127.0.0.1:3000";


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tanstackRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8500,
    proxy: {
      "^/api": {
        target: devProxyServer,
        xfwd: true,
      },
    },
  },
})
