import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: "all",
    proxy: {
      "/v1": "http://localhost:3001",
      "/health": "http://localhost:3001",
      "/ready": "http://localhost:3001",
    },
  },
});
