## CSS Migration Mapping

Source: `global.css` (981 lines) → component-scoped `<style scoped>` sections.
Lines reference the original `global.css.bak`.

---

### global.css (kept — 57 lines)

| Lines    | Selector / Rule                        | Reason                                                        |
|----------|----------------------------------------|---------------------------------------------------------------|
| 1        | `@import './tokens.css'`              | Token import — must stay global                               |
| 3        | `*, *::before, *::after`              | Box-sizing reset                                              |
| 4        | `html, body`                          | Margin/padding reset                                          |
| 6–16     | `body`                                | Background, color, font, transition — app-wide                |
| —        | `::-webkit-scrollbar` (NEW)           | Global scrollbar styling (not in original, added for polish)  |
| 84–87    | `.material-symbols-outlined`          | Icon font settings — used by every component with icons       |
| 61–81    | `.icon-btn` (+ :hover, :focus, .active) | Shared across AppShell top-bar and Lightbox header          |
| 279–285  | `.content`                            | Main content area layout — AppShell-level but reusable        |

---

### AppShell.vue

| Lines    | Selector / Rule                         | Notes                                                       |
|----------|-----------------------------------------|-------------------------------------------------------------|
| 19–23   | `.app-shell`                            | Root flex column layout                                     |
| 26–36   | `.top-bar`                              | Sticky header bar                                           |
| 38–48   | `.top-bar-title`                        | Title text + brand font                                     |
| 50–52   | `.top-bar-title .material-symbols-outlined` | Title icon color override                              |
| 54–58   | `.top-bar-actions`                      | Action buttons container                                    |

---

### SearchBar.vue

| Lines     | Selector / Rule                          | Notes                                                    |
|-----------|------------------------------------------|----------------------------------------------------------|
| 90–94    | `.search-container`                      | Search section wrapper                                   |
| 96–102   | `.search-bar`                            | Flex row for input + button                              |
| 104–107  | `.search-input-wrap`                     | Relative wrapper for input + icon                        |
| 109–121  | `.search-input`                          | Text input styling                                       |
| 123–127  | `.search-input:focus`                    | Focus state                                              |
| 129      | `.search-input::placeholder`             | Placeholder color                                        |
| 131–138  | `.search-icon`                           | Absolute-positioned search icon                          |
| 140–159  | `.search-btn` (+ :hover, :focus-visible) | Submit button — **may be replaced by `v-btn`**           |
| 162–177  | `.autocomplete-dropdown` (+ .open)       | Dropdown positioning/show                                |
| 179–189  | `.autocomplete-item` (+ :hover, .active) | Dropdown item row                                        |
| 191      | `.autocomplete-label`                    | Item label text                                          |
| 192      | `.autocomplete-count`                    | Item count badge                                         |
| 195–202  | `.filter-row`                            | Flex-wrap container for filter chips                     |
| 204–228  | `.chip` (+ :hover, .active)              | Filter chip — **may be replaced by `v-chip`**            |
| 230–245  | `.chip-close` (+ :hover)                 | Chip dismiss button                                      |
| 248–255  | `.active-tags`                           | Active tag row                                           |
| 257–276  | `.tag-chip` (+ :hover)                   | Selected tag chip                                        |
| 874–878  | `@media (max-width: 639px)`             | Mobile: `.search-bar` column, `.search-btn` full-width   |
| 881–883  | `.search-help-btn`                       | Help toggle button                                       |
| 886–974  | `.search-syntax` through `.syntax-code-btn` | Search syntax help panel                             |
| 965–969  | `.syntax-row .date-chip`                 | Date chip sizing inside syntax help                      |
| 976–981  | `@media (max-width: 639px)`             | Mobile: `.syntax-row` wrap                               |

**Vuetify migration notes for SearchBar.vue:**
- `.search-btn` → `v-btn` with `color="primary"` and `rounded="pill"`
- `.chip` / `.filter-row` → `v-chip-group` + `v-chip` with filter props
- `.tag-chip` → `v-chip` with ` closable` and ` color="primary"`
- `.search-input` → `v-text-field` with `variant="outlined"` and `density="comfortable"`
- `.search-syntax` → could be a `v-card` with `v-expansion-panels` for collapsibility

---

### ImageGrid.vue

| Lines     | Selector / Rule                          | Notes                                                    |
|-----------|------------------------------------------|----------------------------------------------------------|
| 288–292  | `.image-grid`                            | CSS Grid layout (auto-fill, minmax)                      |
| 294–296  | `@media (min-width: 640px)`             | Tablet grid columns                                      |
| 298–300  | `@media (min-width: 1024px)`            | Desktop grid columns                                     |
| 303–317  | `.image-card` (+ :hover)                 | Card base + hover elevation                              |
| 319–325  | `.image-card-watched` (+ :hover)         | Dimmed appearance for watched items                      |
| 327–345  | `.image-card-watched-badge` (+ icon)     | Watched checkmark overlay                                |
| 347–352  | `.image-card img`                        | Cover-fit image inside card                              |
| 354–367  | `.image-card-overlay` (+ :hover)         | Gradient hover overlay                                   |
| 369–382  | `.image-card-score`                      | Score badge (top-left)                                   |
| 384–400  | `.image-card-rating` (+ variants)        | Rating badge (top-right) by severity                     |
| 402–422  | `.image-card-tags` + `.image-card-tag`   | Tag chips overlay (bottom)                               |
| 425–438  | `.image-card-play` (+ icon)              | Video play button overlay                                |
| 441–453  | `.image-card-ext`                        | File extension badge (bottom-right)                      |
| 456–481  | `.load-more-wrap` + `.load-more-btn`     | Load more button — **may be replaced by `v-btn`**        |
| 484–504  | `.skeleton-grid` + `.skeleton-card` + `@keyframes shimmer` | Loading skeleton placeholders              |
| 507–535  | `.empty-state` (+ h3, p, icon)           | Empty results display                                    |
| 538–566  | `.error-state` (+ h3, p, icon)           | Error display                                            |

**Vuetify migration notes for ImageGrid.vue:**
- `.load-more-btn` → `v-btn` with `variant="outlined"` and ` color="primary"`
- `.skeleton-*` → `v-skeleton-loader` component
- `.empty-state` → `v-empty-state` component
- `.image-card` → could become a custom component wrapping `v-card`
- `.image-card-rating` variants → could use Vuetify's `v-chip` with appropriate colors
- `.image-card-overlay` → could use `v-overlay` or `v-card-item` slots

---

### Lightbox.vue

| Lines     | Selector / Rule                          | Notes                                                    |
|-----------|------------------------------------------|----------------------------------------------------------|
| 569–578  | `.lightbox` (+ .open)                    | Full-screen fixed overlay                                |
| 580–591  | `.lightbox-header` (+ icon-btn overrides)| Header bar with navigation                               |
| 592–597  | `.lightbox-scroll`                       | Scrollable content area                                  |
| 599–607  | `.lightbox-body`                         | Centered media container                                 |
| 609–626  | `.lightbox-img` + `.lightbox-video`      | Media element sizing                                     |
| 628–648  | `.lightbox-nav-btn` (+ .prev, .next)     | Previous/next arrows                                     |
| 650–663  | `.lightbox-footer` (+ .visible)          | Collapsible info footer                                  |
| 665–685  | `.lightbox-meta*`                        | Metadata grid (resolution, score, etc.)                  |
| 687–713  | `.lightbox-tags` + `.lightbox-tag`       | Clickable tag list                                       |
| 715–741  | `.lightbox-source-link` + domain         | Source URL display                                       |

**Vuetify migration notes for Lightbox.vue:**
- `.lightbox` → `v-dialog` with `fullscreen` and `transition="dialog-bottom-transition"`
- `.lightbox-nav-btn` → `v-btn` with `icon` prop
- `.lightbox-tag` → `v-chip` with ` size="small"` and ` variant="outlined"`
- `.lightbox-meta-label/value` → `v-table` or structured list

---

### SettingsPanel.vue

| Lines     | Selector / Rule                          | Notes                                                    |
|-----------|------------------------------------------|----------------------------------------------------------|
| 744–755  | `.dialog-backdrop` (+ .open)             | Modal backdrop with blur                                 |
| 757–764  | `.dialog`                                | Dialog container                                         |
| 766–770  | `.dialog-header`                         | Header row                                               |
| 773–779  | `.dialog-title`                          | Title text                                               |
| 781      | `.dialog-body`                           | Content area padding                                     |
| 783–824  | `.field` (+ label, input, :focus, hint)  | Form field group — **may be replaced by `v-text-field`** |
| 826–831  | `.dialog-actions`                        | Button row (footer)                                      |
| 833–845  | `.btn-text` (+ :hover)                   | Text button — **may be replaced by `v-btn variant="text"`** |
| 847–859  | `.btn-filled` (+ :hover)                 | Filled button — **may be replaced by `v-btn variant="flat"`** |
| 861–871  | `.status-msg` (+ .show, .success, .error)| Inline status feedback — **may use `v-alert`**           |

**Vuetify migration notes for SettingsPanel.vue:**
- `.dialog-backdrop` + `.dialog` → `v-dialog` with ` max-width="440"`
- `.field` + `label` + `input` → `v-text-field` with ` variant="outlined"`
- `.btn-text` → `v-btn variant="text" color="primary"`
- `.btn-filled` → `v-btn variant="flat" color="primary"`
- `.status-msg` → `v-alert` with ` type="success"` / ` type="error"`
- `.dialog-header` + `.dialog-title` → `v-card-title` slot
- `.dialog-actions` → `v-card-actions`

---

### Summary Table

| Component         | Lines (original) | Selectors | Vuetify replacements                         |
|-------------------|------------------|-----------|----------------------------------------------|
| global.css        | 1–16, 61–87, 279–285 | 6     | — (resets + shared utilities)                |
| AppShell.vue      | 19–58            | 4         | — (layout, minimal Vuetify)                  |
| SearchBar.vue     | 89–276, 874–981 | 22        | v-btn, v-chip, v-chip-group, v-text-field    |
| ImageGrid.vue     | 288–566          | 18        | v-btn, v-skeleton-loader, v-empty-state      |
| Lightbox.vue      | 568–741          | 14        | v-dialog, v-btn, v-chip                      |
| SettingsPanel.vue | 743–871          | 12        | v-dialog, v-text-field, v-btn, v-alert       |

**Total: 981 lines → 7 categories (1 global + 5 components + media queries distributed)**
