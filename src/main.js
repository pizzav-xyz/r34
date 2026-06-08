import './styles/tokens.css';
import './styles/global.css';
import { APIClient } from './api/client.js';
import { store } from './utils/store.js';
import { AppShell } from './components/AppShell.js';
import { SearchBar } from './components/SearchBar.js';
import { ImageGrid } from './components/ImageGrid.js';
import { Lightbox } from './components/Lightbox.js';
import { SettingsPanel } from './components/SettingsPanel.js';

const { apiKey: storedKey, userId: storedId } = store.getSettings();
const api = new APIClient(storedKey, storedId);
const savedState = import.meta.env.DEV ? store.getSearchState() : null;
let currentTags = savedState?.tags || '';
let currentRatings = savedState?.ratings || [];
let currentPage = 0;

function getWatchedSet() {
  return new Set(store.getWatched().map(w => w.id));
}

function syncWatchedImageGrid() {
  imageGrid.setWatchedState(store.getWatchedMode(), getWatchedSet());
}

function saveSearchState() {
  if (!import.meta.env.DEV) return;
  store.setSearchState({ tags: currentTags, ratings: currentRatings });
}



const app = document.getElementById('app');
app.innerHTML = `
  <div class="app-shell">
    <div id="app-shell"></div>
    <div id="search-bar"></div>
    <div class="content" id="content"></div>
  </div>
  <div id="lightbox"></div>
  <div id="settings-panel"></div>`;

const shell = new AppShell(document.getElementById('app-shell'), {
  onSafeModeToggle: () => {
    doSearch();
  },
  onWatchedModeToggle: () => {
    syncWatchedImageGrid();
    imageGrid.render();
  },
  onSettingsOpen: () => {
    const { apiKey, userId } = store.getSettings();
    settingsPanel.open({ apiKey, userId });
  },
});

const settingsPanel = new SettingsPanel(document.getElementById('settings-panel'), {
  onSave: (apiKey, userId) => {
    store.setSettings({ apiKey, userId });
    api.updateAuth(apiKey, userId);
    api.clearCache();
  },
  onTest: async (apiKey, userId) => {
    const url = new URL('/api/index.php', window.location.origin);
    url.searchParams.set('page', 'dapi');
    url.searchParams.set('s', 'post');
    url.searchParams.set('q', 'index');
    url.searchParams.set('json', '1');
    url.searchParams.set('limit', '1');
    if (apiKey) {
      url.searchParams.set('api_key', apiKey);
      if (userId) url.searchParams.set('user_id', userId);
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.trim() === '') throw new Error('Empty response');
    JSON.parse(text); // will throw if invalid
  },
});

const searchBar = new SearchBar(document.getElementById('search-bar'), {
  onSearch: ({ tags, ratings }) => {
    currentTags = tags;
    currentRatings = ratings;
    saveSearchState();
    doSearch();
  },
});

const imageGrid = new ImageGrid(document.getElementById('content'), {
  onCardClick: (post, all) => lightbox.open(post, all),
  onLoadMore: () => loadMore(),
});

const lightbox = new Lightbox(document.getElementById('lightbox'), {
  onFetchPost: (id) => api.getPost(id),
  onOpen: (post) => {
    store.addWatched(post.id);
    store.setLightboxPost(post, null);
    syncWatchedImageGrid();
    imageGrid.render();
  },
  onClose: (currentTime) => {
    const saved = store.getLightboxPost();
    if (saved) store.setLightboxPost(saved, currentTime);
    else store.clearLightboxPost();
  },
  onTagClick: (tag) => searchBar.addTagAndSearch(tag),
  onToggleWatch: (post) => {
    if (store.isWatched(post.id)) {
      store.removeWatched(post.id);
    } else {
      store.addWatched(post.id);
    }
    syncWatchedImageGrid();
    imageGrid.render();
  },
  isWatched: (postId) => store.isWatched(postId),
});

async function doSearch() {
  currentPage = 0;
  imageGrid.reset();
  imageGrid.setLoading(true);
  imageGrid.render();

  try {
    const posts = await api.search({ tags: currentTags, page: 0, ratings: currentRatings });
    imageGrid.setLoading(false);
    imageGrid.append(posts);
    imageGrid.render();
    restoreLightbox(posts);
  } catch (err) {
    imageGrid.setLoading(false);
    imageGrid.setError(err.message);
  }
}

function restoreLightbox(posts) {
  if (!import.meta.env.DEV) return;
  const saved = store.getLightboxPost();
  if (!saved) return;
  const match = posts.find(p => p.id === saved.id);
  if (!match) return;
  lightbox.open(match, posts);
  if (saved._playbackTime) {
    requestAnimationFrame(() => {
      const video = document.querySelector('.lightbox-video');
      if (!video) return;
      const seek = () => { video.currentTime = saved._playbackTime; };
      if (video.readyState >= 1) { seek(); return; }
      video.addEventListener('loadedmetadata', seek, { once: true });
    });
  }
}

async function loadMore() {
  currentPage++;
  imageGrid.setLoading(true);
  imageGrid.render();

  try {
    const posts = await api.search({ tags: currentTags, page: currentPage, ratings: currentRatings });
    imageGrid.setLoading(false);
    imageGrid.append(posts);
    imageGrid.render();
  } catch (err) {
    imageGrid.setLoading(false);
    imageGrid.setError(err.message);
  }
}

shell.render({ theme: store.getTheme(), safeMode: store.getSafeMode(), watchedMode: store.getWatchedMode() });
searchBar.render();
if (savedState) {
  searchBar.setTags(savedState.tags ? savedState.tags.split(' ').filter(Boolean) : []);
  searchBar.setRatings(savedState.ratings || []);
}
syncWatchedImageGrid();
doSearch();