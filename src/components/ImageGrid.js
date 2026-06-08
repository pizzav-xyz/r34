export class ImageGrid {
  constructor(element, { onCardClick, onLoadMore }) {
    this.element = element;
    this.onCardClick = onCardClick;
    this.onLoadMore = onLoadMore;
    this.posts = [];
    this.loading = false;
    this.hasMore = true;
    this.watchedMode = 'show';
    this.watchedSet = new Set();
  }

  setWatchedState(watchedMode, watchedSet) {
    this.watchedMode = watchedMode;
    this.watchedSet = watchedSet;
  }

  _visiblePosts() {
    if (this.watchedMode !== 'hide' || this.watchedSet.size === 0) return this.posts;
    return this.posts.filter(p => !this.watchedSet.has(p.id));
  }

  render() {
    if (this.loading && this.posts.length === 0) {
      this.element.innerHTML = `
        <div class="skeleton-grid">
          ${Array(12).fill('<div class="skeleton-card"></div>').join('')}
        </div>`;
      return;
    }

    const visible = this._visiblePosts();

    if (!this.loading && visible.length === 0) {
      this.element.innerHTML = `
        <div class="empty-state">
          <span class="material-symbols-outlined">search_off</span>
          <h3>No results</h3>
          <p>Try different tags or adjust your filters.</p>
        </div>`;
      return;
    }

    this.element.innerHTML = `
      <div class="image-grid">
        ${visible.map((p, i) => this._card(p, i)).join('')}
      </div>
      ${this.hasMore ? `
        <div class="load-more-wrap">
          <button id="load-more" class="load-more-btn" ${this.loading ? 'disabled' : ''}>
            ${this.loading ? 'Loading...' : 'Load more'}
          </button>
        </div>` : ''}
    `;

    this.element.querySelectorAll('.image-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = Number(card.dataset.index);
        this.onCardClick(visible[idx], visible);
      });
    });

    const btn = this.element.querySelector('#load-more');
    if (btn) btn.addEventListener('click', () => this.onLoadMore());
  }

  _card(post, index) {
    const img = post.sample_url || post.preview_url || '';
    const tags = (post.tags || '').split(' ').filter(Boolean).slice(0, 6);
    const isVideo = post.file_ext === 'webm' || post.file_ext === 'mp4';
    const isWatched = this.watchedSet.has(post.id);
    const watchedClass = isWatched && this.watchedMode === 'dim' ? ' image-card-watched' : '';
    return `
      <div class="image-card${watchedClass}" data-index="${index}">
        <img src="${img}" alt="" loading="lazy" onerror="this.style.display='none'">
        ${isVideo ? `<div class="image-card-play"><span class="material-symbols-outlined">play_circle</span></div>` : ''}
        ${isWatched && this.watchedMode === 'dim' ? `<div class="image-card-watched-badge"><span class="material-symbols-outlined">check_circle</span></div>` : ''}
        ${post.score != null ? `
        <span class="image-card-score">
          <span class="material-symbols-outlined" style="font-size:14px">arrow_upward</span>
          ${post.score}
        </span>` : ''}
        ${post.rating && post.rating !== 'unknown' ? `<span class="image-card-rating ${post.rating}">${post.rating}</span>` : ''}
        ${isVideo ? `<span class="image-card-ext">${post.file_ext.toUpperCase()}</span>` : ''}
        <div class="image-card-overlay">
          <div class="image-card-tags">${tags.map(t => `<span class="image-card-tag">${t}</span>`).join('')}</div>
        </div>
      </div>`;
  }

  append(newPosts) {
    this.posts = [...this.posts, ...newPosts];
    this.hasMore = newPosts.length >= 100;
  }

  reset() {
    this.posts = [];
    this.hasMore = true;
  }

  setLoading(loading) {
    this.loading = loading;
  }

  setError(msg) {
    this.element.innerHTML = `
      <div class="error-state">
        <span class="material-symbols-outlined">error</span>
        <h3>Something went wrong</h3>
        <p>${msg}</p>
      </div>`;
  }
}