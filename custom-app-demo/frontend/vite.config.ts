import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  console.log("dev api", env.VITE_DEV_API_URL);
  console.log("dev jwt cookie", env.VITE_DEV_JWT_COOKIE);
  return {
    plugins: [vue()],
    css: {
      postcss: "./postcss.config.js",
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/api/v1": {
          target: env.VITE_DEV_API_URL,
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, _req, _res) => {
              // Setzen Sie hier Ihr statisches Session-Cookie
              proxyReq.setHeader("Cookie", env.VITE_DEV_JWT_COOKIE as string);
            });
          },
        },
      },
    },
  };
});
