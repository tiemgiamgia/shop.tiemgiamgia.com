import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://shop.tiemgiamgia.com",
  output: "server",          // ✅ SSR
  adapter: cloudflare()      // ✅ Cloudflare adapter
});