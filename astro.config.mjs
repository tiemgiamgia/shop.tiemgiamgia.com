import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({

  output: "server",          // 🔥 SSR MODE

  adapter: cloudflare(),     // 🔥 QUAN TRỌNG NHẤT

  site: "https://shop.tiemgiamgia.com"

});