import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mra-t-g-blog.cn",
  output: "static",
  vite: {
    server: {
      watch: {
        ignored: ["**/.edge-qa*/**"],
      },
    },
  },
});
