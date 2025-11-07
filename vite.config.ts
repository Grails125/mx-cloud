/*
 * @Author: grails grails@clonebot.ai
 * @Date: 2025-11-06 15:25:34
 * @LastEditors: grails grails@clonebot.ai
 * @LastEditTime: 2025-11-06 17:13:39
 * @FilePath: \mx-cloud\vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vue-vendor": ["vue", "vue-router", "pinia"],
          "chart-vendor": ["echarts", "vue-echarts"],
          "crypto-vendor": ["crypto-js"],
        },
      },
    },
  },
});
