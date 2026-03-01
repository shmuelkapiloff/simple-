import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Proxy disabled - using VITE_API_BASE_URL from .env.local
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:4001",
    //     changeOrigin: true,
    //   },
    // },
  },
});
