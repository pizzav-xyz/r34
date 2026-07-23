# AGENTS.md — rule34-client

## Quick Reference

```bash
npm run dev        # Vite dev server (starts proxy automatically via start.sh)
npm run proxy      # Python proxy only (uv run proxy.py)
npm run build      # vue-tsc --noEmit && vite build
npm run test       # vitest --run
npm run test:watch # vitest (watch mode)
npm run type-check # vue-tsc --noEmit
```

## Architecture

- **Frontend**: Vue 3 + Vuetify 3 + Pinia + Vue Router + Vue Query (`src/`)
- **Proxy**: Python (`proxy.py`) — CORS proxy to rule34 API, rate-limited, date-tag resolution
- **Dev flow**: `start.sh` → tmux session → launches proxy → launches Vite; proxy port written to `.proxy-port`, Vite reads it for `/api` rewrite
- **Entry**: `index.html` → `src/main.ts` → `App.vue` → `AppShell.vue` + `router-view`
- **Routing**: Single route (`/` → `SearchView.vue`); catch-all redirects to `/`

## Key Conventions

- **Env vars**: Prefixed `R34_` (`R34_API_KEY`, `R34_USER_ID`, `R34_PROXY_PORT`)
- **Path alias**: `@` = `./src` (configured in both `vite.config.ts` and `tsconfig.json`)
- **TypeScript**: Strict — `noUnusedLocals`, `noUnusedParameters` enforced; `noEmit: true`
- **Tests**: Vitest + happy-dom, globals enabled, localStorage mocked in `tests/setup.ts`
- **E2E**: Playwright (Chromium) in `tests/e2e/` — requires dev server running on `:5173`
- **Build**: Must pass `vue-tsc --noEmit` before `vite build`

## Gotchas

- **Proxy must be running** for `/api` calls to work in dev; `start.sh` handles this
- `.proxy-port` is ephemeral (gitignored); don't reference it in code
- `.env` is gitignored — never commit secrets
- Coverage excludes `src/types/**` and `src/**/*.d.ts`
- **HMR is disabled** (`server.hmr: false` in vite.config.ts)
- **API client rate limits** to 2 req/sec (500ms interval) — both proxy and client enforce this
- **Vue Query caching**: staleTime 5min, gcTime 30min, no refetch on window focus

## Theming

- Material Design 3 tokens in `src/styles/tokens.css`
- Vuetify themes configured in `src/plugins/vuetify.ts` (light + dark)
- Manual theme override via `.theme-light` class on `<html>`

## Commit Style

- Frequent commits encouraged
- No conventional commit format enforced — keep messages clear and scoped
