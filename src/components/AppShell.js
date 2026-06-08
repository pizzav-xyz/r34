import { store } from '../utils/store.js';

const WATCHED_MODES = ['show', 'dim', 'hide'];
const WATCHED_ICONS = { show: 'visibility', dim: 'visibility', hide: 'visibility_off' };
const WATCHED_LABELS = { show: 'Show all', dim: 'Dim watched', hide: 'Hide watched' };

export class AppShell {
  constructor(element, { onThemeToggle, onSafeModeToggle, onSettingsOpen, onWatchedModeToggle }) {
    this.element = element;
    this.onThemeToggle = onThemeToggle || (() => {});
    this.onSafeModeToggle = onSafeModeToggle || (() => {});
    this.onSettingsOpen = onSettingsOpen || (() => {});
    this.onWatchedModeToggle = onWatchedModeToggle || (() => {});
    this.currentTheme = store.getTheme();
    this.safeMode = store.getSafeMode();
    this.watchedMode = store.getWatchedMode();
    this._applyTheme();
  }

  render({ theme = this.currentTheme, safeMode = this.safeMode, watchedMode = this.watchedMode } = {}) {
    this.currentTheme = theme;
    this.safeMode = safeMode;
    this.watchedMode = watchedMode;
    this._applyTheme();

    const themeIcon = theme === 'dark' ? 'light_mode' : 'dark_mode';
    const watchedIcon = WATCHED_ICONS[watchedMode];
    const watchedLabel = WATCHED_LABELS[watchedMode];
    const isWatchedActive = watchedMode !== 'show';
    this.element.innerHTML = `
      <header class="top-bar">
        <div class="top-bar-title">
          <span class="material-symbols-outlined">explore</span>
          rule34
        </div>
        <div class="top-bar-actions">
          <button id="btn-hide-watched" class="icon-btn ${isWatchedActive ? 'active' : ''}" aria-label="${watchedLabel}" title="${watchedLabel}">
            <span class="material-symbols-outlined">${watchedIcon}</span>
          </button>
          <button id="btn-safe" class="icon-btn ${safeMode ? 'active' : ''}" aria-label="Safe mode" title="Safe mode">
            <span class="material-symbols-outlined">shield</span>
          </button>
          <button id="btn-theme" class="icon-btn" aria-label="Toggle theme" title="Toggle theme">
            <span class="material-symbols-outlined">${themeIcon}</span>
          </button>
          <button id="btn-settings" class="icon-btn" aria-label="Settings" title="Settings">
            <span class="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>`;

    this.element.querySelector('#btn-theme').addEventListener('click', () => this._cycleTheme());
    this.element.querySelector('#btn-safe').addEventListener('click', () => this._toggleSafeMode());
    this.element.querySelector('#btn-hide-watched').addEventListener('click', () => this._cycleWatchedMode());
    this.element.querySelector('#btn-settings').addEventListener('click', () => this.onSettingsOpen());
  }

  _cycleTheme() {
    const themes = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const newTheme = themes[(currentIndex + 1) % themes.length];

    this.currentTheme = newTheme;
    store.setTheme(newTheme);
    this._applyTheme();
    this.onThemeToggle(newTheme);
    this.render({ theme: newTheme, safeMode: this.safeMode });
  }

  _toggleSafeMode() {
    this.safeMode = !this.safeMode;
    store.setSafeMode(this.safeMode);
    this.onSafeModeToggle(this.safeMode);
    this.render({ theme: this.currentTheme, safeMode: this.safeMode });
  }

  _cycleWatchedMode() {
    const currentIndex = WATCHED_MODES.indexOf(this.watchedMode);
    const newMode = WATCHED_MODES[(currentIndex + 1) % WATCHED_MODES.length];
    this.watchedMode = newMode;
    store.setWatchedMode(newMode);
    this.onWatchedModeToggle(newMode);
    this.render({ theme: this.currentTheme, safeMode: this.safeMode, watchedMode: newMode });
  }

  _applyTheme() {
    const doc = document.documentElement;
    doc.classList.remove('theme-light', 'theme-dark');

    if (this.currentTheme === 'light') {
      doc.classList.add('theme-light');
    } else if (this.currentTheme === 'dark') {
      doc.classList.add('theme-dark');
    }
  }
}
