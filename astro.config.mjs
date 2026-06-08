import { defineConfig } from "astro/config";

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
});
