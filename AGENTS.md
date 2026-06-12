# Codex Instructions For This Repo

This repository is an Astro static personal site. Before answering project-specific questions or changing code/content, read `PROJECT_CONTEXT.md` first.

## First Steps

1. Read `PROJECT_CONTEXT.md`.
2. Inspect the current files related to the request.
3. Check `git status --short` before editing so existing user changes are not mistaken for your own.
4. Ignore generated/runtime folders such as `node_modules/`, `dist/`, `.astro/`, `.npm-cache/`, and `output/` unless the task is specifically about them.
5. In this Windows workspace, `rg.exe` can fail with `Access is denied`; use PowerShell native commands such as `Get-ChildItem`, `Select-String`, and `Get-Content -LiteralPath` for project exploration.

## Development Rules

- Prefer existing Astro component, content collection, and global CSS patterns.
- Keep project documentation in sync when architecture, routes, content schema, deployment, or progress changes.
- Use root-relative asset paths such as `/assets/posts/example.jpg`.
- Do not use local Windows absolute paths in Markdown content.
- Preserve the pixel-style visual direction unless the user explicitly asks for a redesign.
- Validate meaningful frontend changes with `npm run build`; use a local server for visual checks.
- On Windows, use `npm.cmd` if `npm.ps1` is blocked.
- Use PowerShell-native file search/read commands instead of relying on `rg` in this repository.

## Source Of Truth

- Architecture/progress: `PROJECT_CONTEXT.md`
- Authoring/publishing workflow: `README.md` and `PUBLISHING.md`
- Content schemas: `src/content.config.ts`
- Main homepage composition: `src/pages/index.astro`
- Visual system: `src/styles.css`
- Client behavior: `public/script.js`
- Deployment: `astro.config.mjs` and `netlify.toml`
