import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = new URL("./", import.meta.url).pathname;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": new URL("./src", import.meta.url).pathname
      }
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          changeOrigin: true,
          target: apiBaseUrl
        },
        "/oauth2": {
          changeOrigin: true,
          target: apiBaseUrl
        }
      }
    }
  };
});
