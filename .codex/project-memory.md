# Project Memory: mratg-pixel-blog-astro

Codex should read `PROJECT_CONTEXT.md` before answering or editing this repository.

Current project identity: Astro 5 static pixel-style personal portfolio/blog for Mr.ATG, deployed only through Cloudflare Pages at `https://mra-t-g-blog.cn`.

Key source files:

- `PROJECT_CONTEXT.md`: global architecture and progress context.
- `AGENTS.md`: local Codex operating rules.
- `src/content.config.ts`: content collection schemas.
- `src/pages/index.astro`: homepage composition.
- `src/styles.css`: global visual system.
- `public/script.js`: client search, comments, engagement, and animations.
- `src/data/projects.ts`: project and research metadata.
- `astro.config.mjs` and `wrangler.jsonc`: Cloudflare Pages deployment config.

Important constraints:

- Treat `output/`, `dist/`, `.astro/`, `node_modules/`, `.npm-cache/`, and logs as generated/local artifacts.
- Comments and engagement use Cloudflare Pages Functions plus the `MRATG_ENGAGEMENT` KV binding, with `localStorage` as a browser fallback.
- Content assets should use root-relative `/assets/...` paths.
- Preserve existing working-tree changes unless the user explicitly asks to revert them.
- `rg.exe` may be blocked with `Access is denied` on this machine; use PowerShell native commands (`Get-ChildItem`, `Select-String`, `Get-Content -LiteralPath`) for file discovery and source reading.
