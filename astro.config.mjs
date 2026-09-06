import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mra-t-g-blog.cn",
  output: "static",
  vite: {
    server: {
      proxy: { "/api/gaoxiao": "http://127.0.0.1:8791" },
      watch: {
        ignored: ["**/.edge-qa*/**"],
      },
    },
  },
});
