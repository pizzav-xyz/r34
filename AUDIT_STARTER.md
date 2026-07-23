# Audit Starter — rule34-client

Copy and paste this into a new session to audit this project.

---

## Project

**rule34-client** — Vue 3 + TypeScript frontend with Python CORS proxy.

### Modules (use these for Agent 4)

| Module | Path | Description |
|--------|------|-------------|
| API Client | `src/api/client.ts` | Rate-limited API client with TTL cache, queue, response parsing |
| Composables | `src/composables/` | useTheme, useAPIClient, useLightbox, useVideoBuffer, useVideoDuration |
| Stores | `src/stores/` | settings (theme/accent/safe/watched), watched (post tracking, lightbox state) |
| Utils | `src/utils/` | cache.ts (TTLCache), durationFilter.ts (client-side video duration filtering) |
| Types | `src/types/` | TypeScript interfaces (Post, SearchParams, AutocompleteItem, Settings, AccentColor) |
| Components | `src/components/` | SearchBar, ImageGrid, ImageCard, Lightbox, VideoBufferControl, SettingsPanel, AppShell |
| Views | `src/views/` | SearchView (main orchestrator) |
| Plugins | `src/plugins/` | vuetify.ts (MD3 theming), vue-query.ts (QueryClient config), icons/ms.ts (Material Symbols) |
| Constants | `src/constants/` | accents.ts (18-color MD3 accent palette) |
| Styles | `src/styles/` | tokens.css (MD3 design tokens), global.css (reset + shared utilities) |
| Proxy | `proxy.py` | Python CORS proxy with rate limiting, date-tag resolution, video proxy |
| Dev Server | `start.sh` | tmux launcher (proxy + Vite) |
| Tests | `tests/` + `src/**/__tests__/` | Vitest unit tests, Playwright E2E |

### Tech Stack

- **Frontend**: Vue 3.5, Vuetify 3.12 (MD3 blueprint), Pinia, Vue Router, @tanstack/vue-query 5, @vueuse/core, ofetch, dayjs
- **Proxy**: Python 3.10+, curl_cffi, python-dotenv
- **Build**: Vite 4, vue-tsc 2, TypeScript 5.5 (strict)
- **Test**: Vitest 2, happy-dom, Playwright 1.52

---

## Prompt

Launch **4 parallel background subagents** to audit `/home/pizzav/Documents/r34/`. Each produces a written report. Do NOT let any agent modify code — audit only.

### Core principle (every agent must enforce this)

**1 clean approach beats 5 fallbacks.** Any function that uses multiple fallback strategies (try A, fallback to B, fallback to C...) is a red flag. The audit must flag every instance and recommend the single clean path that replaces the chain. This is the #1 thing to find.

---

### Agent 1 — Code Simplifier (`category: deep`)
Sweep every file in `/home/pizzav/Documents/r34/` for overcomplicated code. Flag functions over ~40 lines, nested conditionals >3 deep, duplicated logic across modules, and any code that can be replaced with a stdlib/library call.

**Specifically look for fallback chains** — functions with multiple try/catch, if/else fallback paths, or "try strategy A, if that fails try B" patterns. For each fallback chain found, state the single clean approach that replaces it.

**Vue-specific checks:**
- Components with >150 lines of template or >80 lines of script (should be split)
- Inline styles that should be extracted to scoped CSS
- Computed properties with side effects
- Watchers that could be computed properties
- Missing cleanup in onUnmounted/onBeforeUnmount

**Check file organization** — flag files over ~150 lines that contain multiple unrelated concerns. Recommend how to split monoliths into focused modules.

Include `file:line` for each finding. Output a numbered list grouped by severity (critical → trivial).

### Agent 2 — Dependency & Library Audit (`category: deep`)
Read every source file in `/home/pizzav/Documents/r34/` plus `package.json` and `proxy.py` (which declares inline dependencies via PEP 723). Map every import to its usage.

**Hand-rolled code to evaluate:**
- `src/utils/cache.ts` — TTLCache (could use lru-cache or quick-lru)
- `src/composables/useVideoDuration.ts` — offscreen video probing (no standard lib, but check if better pattern exists)
- `src/composables/useVideoBuffer.ts` — blob URL caching (check for memory leak patterns)
- `proxy.py` — DateResolver ID-rate estimation, rate limiting, CORS proxy (could use aiohttp/httpx, or a dedicated CORS proxy lib)

**For each dependency in package.json, check:**
- Is it actually used? (no phantom dependencies)
- Are there imports in code not in package.json?
- Version pins: too loose (^4.0.0 for vite) or too strict?
- Are `@tanstack/vue-virtual` and `@vueuse/core` fully utilized or mostly unused?
- Is `dayjs` used anywhere? (it's in dependencies)

**Also check proxy.py:**
- `curl_cffi` — is it necessary over `requests`/`httpx`? (check impersonate usage)
- Are there missing dependencies?

Output a markdown table: library name, what it replaces, assessment, and recommendation.

### Agent 3 — TODO & Dead Work Audit (`category: quick`)
Scan every source file in `/home/pizzav/Documents/r34/` for `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP`, `PLACEHOLDER`, and `WORKAROUND` comments. For each: file, line, the comment text, and whether the item appears still unresolved.

**Also check for:**
- Dead/unreachable code paths
- Commented-out blocks >5 lines
- Unused imports
- Dead fallback branches (else/catch paths that can never execute)
- Unused CSS classes (check `global.css` for `.content` duplication with `SearchView.vue`)
- Unused exports from composables/index.ts (useVideoBuffer, useVideoDuration not re-exported)
- `LoadingDetails` ref in Lightbox.vue that's never set to true

Output a numbered list grouped by file.

### Agent 4 — Completeness & Security Audit (`category: deep`)
Check each module listed above:

1. **Completeness** — Does each module have complete, runnable code or is any of it stubbed/incomplete?
2. **Type safety** — Are there `any` types, missing return types, or `@ts-ignore`?
3. **Hardcoded values** — URLs (`api.rule34.xxx`), secrets, timeouts (500ms rate limit, 15s API timeout, 3 concurrent buffer, 15 concurrent probes), cache sizes (50 entries, 100 entries) that should be configurable
4. **Security concerns:**
   - API key handling (in `import.meta.env`, passed to URL params, in proxy)
   - CORS: proxy sends `Access-Control-Allow-Origin: *` — is this intentional?
   - No input sanitization on tags before sending to API
   - No CSP headers
   - `.env` gitignored but `.proxy-port` is ephemeral (correct)
5. **Error handling** — Empty catch blocks, swallowed errors, missing error boundaries
6. **Dependency parity** — Do `package.json` and `proxy.py` inline deps match what code actually imports?
7. **Test coverage gaps** — No unit tests for API client, composables, utils, or components (only settings store accent test and smoke test)

Output a checklist with ✅/⚠️/❌ per item with `file:line` evidence.

---

After all 4 agents complete, merge their findings into one **Unified Audit Report**:

1. **Summary table** — Agent | Findings count | Critical count
2. **Deduplicated findings** — merge overlapping issues, keep the most detailed version
3. **Priority ranking** — sort all findings by impact: security > runtime breaks > code quality > style
4. **Fallback chain inventory** — for every multi-path code found, a table: Location | Current paths (N) | Recommended single clean path | Lines saved
5. **Action plan** — ordered list of what to fix first, with agent + finding # cross-references
6. **Pass/Fail** — Does this codebase ship? YES with caveats or NO with blockers.

Output the full report as markdown.
