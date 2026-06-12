import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://mratg.netlify.app",
  output: "static",

  vite: {
    server: {
      watch: {
        ignored: ["**/.edge-qa*/**"],
      },
    },
  },

  adapter: cloudflare()
});