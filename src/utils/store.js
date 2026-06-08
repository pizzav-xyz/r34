const KEYS = {
  API_KEY: 'r34_api_key',
  USER_ID: 'r34_user_id',
  FAVORITES: 'r34_favorites',
  HISTORY: 'r34_history',
  THEME: 'r34_theme',
  SAFE_MODE: 'r34_safe_mode',
  WATCHED: 'r34_watched',
  HIDE_WATCHED: 'r34_hide_watched',
  SEARCH_STATE: 'r34_search_state',
  SEARCH_STATE_TS: 'r34_search_state_ts',
  LIGHTBOX_POST: 'r34_lightbox_post',
  LIGHTBOX_POST_TS: 'r34_lightbox_post_ts',
};

const DEV_TTL = 24 * 60 * 60 * 1000;

export const store = {
  getSettings() {
    return {
      apiKey: localStorage.getItem(KEYS.API_KEY) || '',
      userId: localStorage.getItem(KEYS.USER_ID) || '',
    };
  },

  setSettings({ apiKey, userId }) {
    localStorage.setItem(KEYS.API_KEY, apiKey);
    localStorage.setItem(KEYS.USER_ID, userId);
  },

  getFavorites() {
    try { return JSON.parse(localStorage.getItem(KEYS.FAVORITES)) || []; }
    catch { return []; }
  },

  addFavorite(post) {
    const favs = this.getFavorites();
    if (!favs.some(f => f.id === post.id)) {
      favs.unshift(post);
      localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
    }
  },

  removeFavorite(postId) {
    const favs = this.getFavorites().filter(f => f.id !== postId);
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(favs));
  },

  isFavorite(postId) {
    return this.getFavorites().some(f => f.id === postId);
  },

  getHistory() {
    try { return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || []; }
    catch { return []; }
  },

  addToHistory(post) {
    const hist = this.getHistory().filter(h => h.id !== post.id);
    hist.unshift(post);
    if (hist.length > 100) hist.length = 100;
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(hist));
  },

  clearHistory() {
    localStorage.removeItem(KEYS.HISTORY);
  },

  getTheme() {
    return localStorage.getItem(KEYS.THEME) || 'system';
  },

  setTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
  },

  getSafeMode() {
    return localStorage.getItem(KEYS.SAFE_MODE) === 'true';
  },

  setSafeMode(enabled) {
    localStorage.setItem(KEYS.SAFE_MODE, String(enabled));
  },

  getWatched() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEYS.WATCHED)) || [];
      if (raw.length && typeof raw[0] === 'number') {
        const migrated = raw.map(id => ({ id, at: Date.now() }));
        localStorage.setItem(KEYS.WATCHED, JSON.stringify(migrated));
        return migrated;
      }
      return raw;
    }
    catch { return []; }
  },

  addWatched(postId) {
    const watched = this.getWatched().filter(w => w.id !== postId);
    watched.unshift({ id: postId, at: Date.now() });
    localStorage.setItem(KEYS.WATCHED, JSON.stringify(watched));
  },

  removeWatched(postId) {
    const watched = this.getWatched().filter(w => w.id !== postId);
    localStorage.setItem(KEYS.WATCHED, JSON.stringify(watched));
  },

  isWatched(postId) {
    return this.getWatched().some(w => w.id === postId);
  },

  getWatchedMode() {
    const val = localStorage.getItem(KEYS.HIDE_WATCHED);
    if (val === 'true') return 'hide';
    if (val === 'false') return 'show';
    if (['show', 'dim', 'hide'].includes(val)) return val;
    return 'show';
  },

  setWatchedMode(mode) {
    localStorage.setItem(KEYS.HIDE_WATCHED, mode);
  },

  getSearchState() {
    try {
      const ts = Number(localStorage.getItem(KEYS.SEARCH_STATE_TS));
      if (!ts || Date.now() - ts > DEV_TTL) { localStorage.removeItem(KEYS.SEARCH_STATE); localStorage.removeItem(KEYS.SEARCH_STATE_TS); return null; }
      return JSON.parse(localStorage.getItem(KEYS.SEARCH_STATE)) || null;
    }
    catch { return null; }
  },

  setSearchState(state) {
    localStorage.setItem(KEYS.SEARCH_STATE, JSON.stringify(state));
    localStorage.setItem(KEYS.SEARCH_STATE_TS, String(Date.now()));
  },

  getLightboxPost() {
    try {
      const ts = Number(localStorage.getItem(KEYS.LIGHTBOX_POST_TS));
      if (!ts || Date.now() - ts > DEV_TTL) { localStorage.removeItem(KEYS.LIGHTBOX_POST); localStorage.removeItem(KEYS.LIGHTBOX_POST_TS); return null; }
      return JSON.parse(localStorage.getItem(KEYS.LIGHTBOX_POST)) || null;
    }
    catch { return null; }
  },

  setLightboxPost(post, currentTime) {
    localStorage.setItem(KEYS.LIGHTBOX_POST, JSON.stringify({ ...post, _playbackTime: currentTime }));
  },

  clearLightboxPost() {
    localStorage.removeItem(KEYS.LIGHTBOX_POST);
  },
};