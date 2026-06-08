export class Lightbox {
  constructor(element, { onFetchPost, onTagClick, onOpen, onClose, onToggleWatch, isWatched }) {
    this.element = element;
    this.current = null;
    this.posts = [];
    this.onFetchPost = onFetchPost;
    this.onTagClick = onTagClick || null;
    this.onOpen = onOpen || null;
    this.onClose = onClose || null;
    this.onToggleWatch = onToggleWatch || null;
    this.isWatched = isWatched || (() => false);
    this._onKey = this._onKey.bind(this);
    this._loading = false;
  }

  async open(post, allPosts = []) {
    this.current = { ...post };
    this.posts = allPosts;
    this._loading = true;
    this._render();
    this.element.querySelector('.lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this._onKey);

    if (this.onOpen) this.onOpen(post);

    try {
      const details = await this.onFetchPost(post.id);
      if (this.current && this.current.id === post.id) {
        Object.assign(this.current, details);
        this._loading = false;
        this._render();
      }
    } catch {
      this._loading = false;
    }
  }

  close() {
    const video = this.element.querySelector('.lightbox-video');
    const currentTime = video ? video.currentTime : null;
    if (video) video.pause();
    this.element.querySelector('.lightbox')?.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._onKey);
    if (this.onClose) this.onClose(currentTime);
    this.current = null;
  }

  _onKey(e) {
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowLeft') this._nav(-1);
    if (e.key === 'ArrowRight') this._nav(1);
  }

  _nav(dir) {
    if (!this.current || !this.posts.length) return;
    const video = this.element.querySelector('.lightbox-video');
    if (video) video.pause();
    const i = this.posts.findIndex(p => p.id === this.current.id);
    const next = i + dir;
    if (next >= 0 && next < this.posts.length) {
      this.open(this.posts[next], this.posts);
    }
  }

  _render() {
    const p = this.current;
    if (!p) return;

    const isVideo = p.file_ext === 'webm' || p.file_ext === 'mp4';
    const mediaUrl = isVideo ? (p.file_url || p.sample_url) : (p.file_url || p.sample_url || p.preview_url);
    const tags = (p.tags || '').split(' ');
    const i = this.posts.findIndex(x => x.id === p.id);
    const watched = this.isWatched(p.id);

    const meta = [];
    if (p.score != null) meta.push({ label: 'Score', value: p.score });
    if (p.rating) meta.push({ label: 'Rating', value: p.rating });
    if (p.source) {
      let sourceUrl = p.source;
      if (!/^https?:\/\//.test(sourceUrl)) sourceUrl = 'https://' + sourceUrl;
      let domain = '';
      try { domain = new URL(sourceUrl).hostname; } catch {}
      meta.push({ label: 'Source', value: sourceUrl, domain });
    }

    const mediaElement = isVideo
      ? `<video class="lightbox-video" controls autoplay loop playsinline src="${mediaUrl}"></video>`
      : `<img class="lightbox-img" src="${mediaUrl}" alt="${p.tags || ''}">`;

    this.element.innerHTML = `
      <div class="lightbox">
        <div class="lightbox-header">
          <span style="font-size:14px;opacity:0.7">${i + 1} / ${this.posts.length}</span>
          <div class="lightbox-nav">
            <button class="icon-btn lb-prev" aria-label="Previous" ${i <= 0 ? 'disabled' : ''}>
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <button class="icon-btn lb-next" aria-label="Next" ${i >= this.posts.length - 1 ? 'disabled' : ''}>
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
            <button class="icon-btn lb-info" aria-label="Toggle info">
              <span class="material-symbols-outlined">info</span>
            </button>
            <button class="icon-btn lb-watch" aria-label="Toggle watched" title="Toggle watched">
              <span class="material-symbols-outlined">${watched ? 'visibility' : 'visibility_off'}</span>
            </button>
            <button class="icon-btn lb-close" aria-label="Close">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div class="lightbox-scroll">
          <div class="lightbox-body">
            <button class="lightbox-nav-btn prev" ${i <= 0 ? 'disabled' : ''}>
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            ${mediaElement}
            <button class="lightbox-nav-btn next" ${i >= this.posts.length - 1 ? 'disabled' : ''}>
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div class="lightbox-footer">
            <div style="padding: 16px 20px;">
              <div class="lightbox-meta">
                ${meta.map(m => `
                <div class="lightbox-meta-item">
                  <span class="lightbox-meta-label">${m.label}</span>
                  <span class="lightbox-meta-value">${m.domain
                    ? `<a href="${m.value}" target="_blank" rel="noopener" class="lightbox-source-link"><span class="material-symbols-outlined">open_in_new</span>${m.value.length > 40 ? m.value.slice(0, 40) + '...' : m.value}<span class="lightbox-source-domain">${m.domain}</span></a>`
                    : m.value}</span>
                </div>`).join('')}
                ${this._loading ? '<span class="lightbox-meta-label" style="opacity:0.5">loading details...</span>' : ''}
              </div>
              <div class="lightbox-tags">${tags.filter(Boolean).map(t => `<span class="lightbox-tag" data-tag="${t}">${t}</span>`).join('')}</div>
            </div>
          </div>
        </div>
      </div>`;

    this.element.querySelector('.lb-close').addEventListener('click', () => this.close());
    this.element.querySelector('.lb-prev')?.addEventListener('click', () => this._nav(-1));
    this.element.querySelector('.lb-next')?.addEventListener('click', () => this._nav(1));
    this.element.querySelector('.lightbox-nav-btn.prev')?.addEventListener('click', () => this._nav(-1));
    this.element.querySelector('.lightbox-nav-btn.next')?.addEventListener('click', () => this._nav(1));
    this.element.querySelector('.lightbox-body')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.close();
    });

    const footer = this.element.querySelector('.lightbox-footer');
    const infoBtn = this.element.querySelector('.lb-info');
    infoBtn?.addEventListener('click', () => {
      footer.classList.toggle('visible');
      const icon = infoBtn.querySelector('.material-symbols-outlined');
      icon.textContent = footer.classList.contains('visible') ? 'info_i' : 'info';
    });

    const watchBtn = this.element.querySelector('.lb-watch');
    watchBtn?.addEventListener('click', () => {
      if (this.onToggleWatch && this.current) {
        this.onToggleWatch(this.current);
        const icon = watchBtn.querySelector('.material-symbols-outlined');
        const nowWatched = this.isWatched(this.current.id);
        icon.textContent = nowWatched ? 'visibility' : 'visibility_off';
      }
    });

    if (this.onTagClick) {
      this.element.querySelectorAll('.lightbox-tag').forEach(tagEl => {
        tagEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onTagClick(tagEl.dataset.tag);
          this.close();
        });
      });
    }
  }
}