export class SearchBar {
  constructor(element, { onSearch, onTagRemove }) {
    this.element = element;
    this.onSearch = onSearch;
    this.onTagRemove = onTagRemove;
    this.activeTags = [];
    this.activeRatings = [];
    this.acIndex = -1;
    this.debounceTimer = null;
    this.query = '';
  }

  render() {
    this.element.innerHTML = `
      <div class="search-container">
        <div class="search-bar">
          <div class="search-input-wrap">
            <span class="material-symbols-outlined search-icon">search</span>
            <input type="text" id="search-input" class="search-input" placeholder="Search tags..." autocomplete="off" spellcheck="false">
            <div id="ac-dropdown" class="autocomplete-dropdown"></div>
          </div>
          <button id="btn-search" class="search-btn">Search</button>
          <button id="btn-search-help" class="icon-btn search-help-btn" aria-label="Search syntax help" title="Search syntax help">
            <span class="material-symbols-outlined">help</span>
          </button>
        </div>
        <div id="active-tags" class="active-tags"></div>
        <div class="filter-row">
          <button class="chip rating-chip" data-rating="general">General</button>
          <button class="chip rating-chip" data-rating="sensitive">Sensitive</button>
          <button class="chip rating-chip" data-rating="questionable">Questionable</button>
          <button class="chip rating-chip" data-rating="explicit">Explicit</button>
          <button class="chip" id="btn-clear-filters" style="display:none">Clear filters</button>
        </div>
        <div id="search-syntax" class="search-syntax" style="display:none">
          <div class="syntax-section">
            <div class="syntax-section-title">Tags</div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="tag1 tag2"><code>tag1 tag2</code></button>
              <span>Search for posts that have <b>tag1</b> and <b>tag2</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="night~"><code>night~</code></button>
              <span>Fuzzy search for <b>night</b> &mdash; returns results like fight, bright, light, etc.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="tag1 ( tag2 ~ tag3 ~ tag4 )"><code>tag1 ( tag2 ~ tag3 ~ tag4 )</code></button>
              <span>Posts with <b>tag1</b> but also <b>tag2</b> OR <b>tag3</b> OR <b>tag4</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="-tag1"><code>-tag1</code></button>
              <span>Exclude posts that have <b>tag1</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="tag1*"><code>tag1*</code></button>
              <span>Tags that <b>begin with</b> tag1.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="*tag1"><code>*tag1</code></button>
              <span>Tags that <b>end with</b> tag1.</span>
            </div>
          </div>
          <div class="syntax-section">
            <div class="syntax-section-title">Metatags</div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="user:bob"><code>user:bob</code></button>
              <span>Posts uploaded by user <b>Bob</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="md5:foo"><code>md5:foo</code></button>
              <span>Posts with MD5 hash <b>foo</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="md5:foo*"><code>md5:foo*</code></button>
              <span>Posts whose MD5 <b>starts with</b> foo.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="rating:questionable"><code>rating:questionable</code></button>
              <span>Posts rated <b>questionable</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="-rating:questionable"><code>-rating:questionable</code></button>
              <span>Posts that are <b>not</b> rated questionable.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="width:&gt;=1000 height:&gt;1000"><code>width:&gt;=1000 height:&gt;1000</code></button>
              <span>Width &ge; 1000 <b>and</b> height &gt; 1000.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="score:&gt;=10"><code>score:&gt;=10</code></button>
              <span>Posts with score &ge; 10 (updated daily at 12AM CST).</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="fav:1"><code>fav:1</code></button>
              <span>Posts favorited by user <b>id 1</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="pool:2"><code>pool:2</code></button>
              <span>Posts in pool <b>id 2</b>.</span>
            </div>
          </div>
          <div class="syntax-section">
            <div class="syntax-section-title">Date Filtering</div>
            <div class="syntax-row">
              <button class="chip date-chip" data-date="day">24h</button>
              <span>Posts from the <b>last 24 hours</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="chip date-chip" data-date="2day">2d</button>
              <span>Posts from the <b>last 2 days</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="chip date-chip" data-date="3day">3d</button>
              <span>Posts from the <b>last 3 days</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="chip date-chip" data-date="week">1w</button>
              <span>Posts from the <b>last 7 days</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="chip date-chip" data-date="2week">2w</button>
              <span>Posts from the <b>last 14 days</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="chip date-chip" data-date="month">1m</button>
              <span>Posts from the <b>last 30 days</b>.</span>
            </div>
            <div class="syntax-row">
              <button class="chip date-chip" data-date="year">1y</button>
              <span>Posts from the <b>last 365 days</b>.</span>
            </div>
          </div>
          <div class="syntax-section">
            <div class="syntax-section-title">Sorting</div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="sort:random"><code>sort:random</code></button>
              <span>Random order on every refresh.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="sort:random:3456"><code>sort:random:3456</code></button>
              <span>Seeded random (0&ndash;10000) to persist results across refreshes.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="sort:updated:desc"><code>sort:updated:desc</code></button>
              <span>Order by most recently updated.</span>
            </div>
            <div class="syntax-row">
              <button class="syntax-code-btn" data-tag="sort:score:asc"><code>sort:score:asc</code></button>
              <span>Sort options: <b>id</b>, <b>score</b>, <b>rating</b>, <b>user</b>, <b>height</b>, <b>width</b>, <b>source</b>, <b>updated</b>. Use <b>asc</b> or <b>desc</b>.</span>
            </div>
          </div>
        </div>
      </div>`;
    this._bind();
  }

  _bind() {
    const input = this.element.querySelector('#search-input');
    const dropdown = this.element.querySelector('#ac-dropdown');

    input.addEventListener('input', (e) => {
      this.query = e.target.value;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this._fetchAutocomplete(this.query), 300);
    });

    input.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.autocomplete-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.acIndex = Math.min(this.acIndex + 1, items.length - 1);
        this._highlightAc(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.acIndex = Math.max(this.acIndex - 1, -1);
        this._highlightAc(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.acIndex >= 0 && items[this.acIndex]) {
          this._pickTag(items[this.acIndex].dataset.value);
        } else {
          this._submitSearch();
        }
      } else if (e.key === 'Escape') {
        dropdown.classList.remove('open');
        this.acIndex = -1;
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => dropdown.classList.remove('open'), 200);
    });

    this.element.querySelector('#btn-search').addEventListener('click', () => this._submitSearch());

    this.element.querySelector('#btn-search-help').addEventListener('click', () => {
      const panel = this.element.querySelector('#search-syntax');
      const isVisible = panel.style.display !== 'none';
      panel.style.display = isVisible ? 'none' : '';
    });

    this.element.querySelector('.filter-row').addEventListener('click', (e) => {
      const rc = e.target.closest('.rating-chip');
      if (rc) { this._toggleRating(rc.dataset.rating); return; }
      if (e.target.id === 'btn-clear-filters') this._clearAll();
    });

    this.element.querySelector('#search-syntax').addEventListener('click', (e) => {
      const dc = e.target.closest('.date-chip');
      if (dc) { e.preventDefault(); this._toggleDate(dc.dataset.date); return; }
      const mc = e.target.closest('.syntax-code-btn');
      if (mc) { e.preventDefault(); this._pickTag(mc.dataset.tag); return; }
    });
  }

  /* ---- ratings ---------------------------------------------------------- */

  _updateClearBtn() {
    const btn = this.element.querySelector('#btn-clear-filters');
    if (btn) btn.style.display = this.activeRatings.length > 0 || this.activeTags.length > 0 ? '' : 'none';
  }

  _toggleRating(rating) {
    if (this.activeRatings.includes(rating)) {
      this.activeRatings = this.activeRatings.filter(r => r !== rating);
    } else {
      this.activeRatings.push(rating);
    }
    this._updateRatingChips();
    this._updateClearBtn();
    this._submitSearch();
  }

  _clearAll() {
    this.activeRatings = [];
    this.activeTags = [];
    this._updateRatingChips();
    this._updateDateChips();
    this._renderTags();
    this._updateClearBtn();
    this._submitSearch();
  }

  _updateRatingChips() {
    this.element.querySelectorAll('.rating-chip').forEach(c => {
      c.classList.toggle('active', this.activeRatings.includes(c.dataset.rating));
    });
  }

  /* ---- date chips ------------------------------------------------------- */

  _toggleDate(tag) {
    const fullTag = `date:${tag}`;
    if (this.activeTags.includes(fullTag)) {
      this.removeTag(fullTag);
    } else {
      this.addTag(fullTag);
    }
    this._updateDateChips();
    this._updateClearBtn();
    this._submitSearch();
  }

  _updateDateChips() {
    this.element.querySelectorAll('.date-chip').forEach(c => {
      c.classList.toggle('active', this.activeTags.includes(`date:${c.dataset.date}`));
    });
  }

  /* ---- autocomplete ----------------------------------------------------- */

  async _fetchAutocomplete(query) {
    const dropdown = this.element.querySelector('#ac-dropdown');
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      dropdown.classList.remove('open');
      return;
    }
    
    try {
      const response = await fetch(`https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(trimmedQuery)}`);
      if (!response.ok) throw new Error(`Autocomplete request failed: ${response.status}`);

      const text = await response.text();
      if (this.query.trim() !== trimmedQuery) return;

      const results = this._parseAutocomplete(text).slice(0, 8);
      if (!results.length) {
        dropdown.classList.remove('open');
        return;
      }
      
      dropdown.innerHTML = results.map(r => {
        const value = this._escapeHtml(r.value);
        const label = this._escapeHtml(r.label);
        const count = Number.isFinite(r.count) ? `<span class="autocomplete-count">${r.count.toLocaleString()}</span>` : '';
        return `<div class="autocomplete-item" data-value="${value}">
          <span class="autocomplete-label">${label}</span>
          ${count}
        </div>`;
      }).join('');
      
      dropdown.classList.add('open');
      this.acIndex = -1;
      
      dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this._pickTag(item.dataset.value);
        });
      });
    } catch {
      dropdown.classList.remove('open');
    }
  }

  _parseAutocomplete(text) {
    if (!text || !text.trim()) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(item => this._normalizeAutocompleteItem(item)).filter(item => item.value);
      }
    } catch {}

    return text.split('\n').map(line => this._normalizeAutocompleteItem(line)).filter(item => item.value);
  }

  _normalizeAutocompleteItem(item) {
    if (typeof item === 'string') {
      const [labelPart, valuePart] = item.split('|');
      const rawLabel = (labelPart || '').trim();
      const countMatch = rawLabel.match(/\((\d+)\)$/);
      const label = rawLabel.replace(/\s*\(\d+\)$/, '').trim();
      const value = (valuePart || label).trim();
      return { label: label || value, value, count: countMatch ? Number(countMatch[1]) : null };
    }

    const value = String(item.value || item.label || item.name || item.tag || '').trim();
    const label = String(item.label || item.name || value).trim();
    const count = Number(item.count || item.post_count || item.posts);
    return { label, value, count: Number.isFinite(count) ? count : null };
  }

  _escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }[char]));
  }

  _highlightAc(items) {
    items.forEach((el, i) => el.classList.toggle('active', i === this.acIndex));
    if (this.acIndex >= 0 && items[this.acIndex]) {
      this.element.querySelector('#search-input').value = items[this.acIndex].dataset.value;
    }
  }

  _pickTag(tag) {
    const normalized = String(tag || '').trim();
    if (!normalized) return;
    if (!this.activeTags.includes(normalized)) {
      this.activeTags.push(normalized);
    }
    this.element.querySelector('#search-input').value = '';
    this.query = '';
    this.element.querySelector('#ac-dropdown').classList.remove('open');
    this._renderTags();
    this._submitSearch();
  }

  addTag(tag) {
    const normalized = String(tag || '').trim();
    if (!normalized || this.activeTags.includes(normalized)) return;
    this.activeTags.push(normalized);
    this._renderTags();
    this._updateDateChips();
  }

  addTagAndSearch(tag) {
    this.addTag(tag);
    this._submitSearch();
  }

  setTags(tags) {
    this.activeTags = Array.isArray(tags)
      ? [...new Set(tags.map(t => String(t || '').trim()).filter(Boolean))]
      : [];
    this._renderTags();
    this._updateDateChips();
  }

  setRatings(ratings) {
    this.activeRatings = Array.isArray(ratings) ? [...ratings] : [];
    this._updateRatingChips();
    this._updateClearBtn();
  }

  removeTag(tag) {
    this.activeTags = this.activeTags.filter(t => t !== tag);
    this._renderTags();
    this._updateDateChips();
    this._updateClearBtn();
    if (this.onTagRemove) {
      this.onTagRemove(tag);
    }
  }

  _renderTags() {
    const container = this.element.querySelector('#active-tags');
    container.innerHTML = this.activeTags.map(t =>
      `<button class="tag-chip" data-tag="${this._escapeHtml(t)}">${this._escapeHtml(t)} <span class="material-symbols-outlined" style="font-size:14px">close</span></button>`
    ).join('');
    
    container.querySelectorAll('.tag-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeTag(btn.dataset.tag);
      });
    });
  }

  _submitSearch() {
    const input = this.element.querySelector('#search-input');
    const manual = input.value.trim();
    if (manual && !this.activeTags.includes(manual)) {
      this.activeTags.push(manual);
    }
    input.value = '';
    this.query = '';
    this._renderTags();
    this._updateClearBtn();
    
    this.onSearch({
      tags: this.activeTags.join(' '),
      ratings: this.activeRatings
    });
  }
}
