import { searchCache, autocompleteCache } from '../utils/cache.js';

export class APIClient {
  #apiKey;
  #userId;
  #apiPath = '/api/index.php';
  #autocompleteUrl = '/api/autocomplete.php?q=';
  #queue = [];
  #processing = false;
  #lastRequestTime = 0;
  #minRequestInterval = 500; // 2 req/sec = 500ms minimum interval

  constructor(apiKey = null, userId = null) {
    this.#apiKey = apiKey;
    this.#userId = userId;
  }

  async #processQueue() {
    if (this.#processing || this.#queue.length === 0) return;

    this.#processing = true;

    while (this.#queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.#lastRequestTime;

      if (timeSinceLast < this.#minRequestInterval) {
        await new Promise(resolve => {
          setTimeout(resolve, this.#minRequestInterval - timeSinceLast);
        });
      }

      const task = this.#queue.shift();
      try {
        const result = await this.#executeRequest(task.url, task.options);
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }

      this.#lastRequestTime = Date.now();
    }

    this.#processing = false;
  }

  #queuedRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ url, options, resolve, reject });
      this.#processQueue();
    });
  }

  async #executeRequest(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return [];
    }

    const data = await response.text();
    if (!data || data.trim() === '') {
      return [];
    }

    if (url.includes('autocomplete')) {
      return this.#parseAutocompleteResponse(data);
    }

    if (data.trimStart().startsWith('<?xml') || data.trimStart().startsWith('<error>')) {
      const msg = data.match(/<error>([^<]+)<\/error>/)?.[1] || 'Unknown API error';
      throw new Error(msg);
    }

    if (data.trimStart().startsWith('<!') || data.trimStart().startsWith('<html')) {
      throw new Error('Received HTML instead of API data — server may be down');
    }

    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new Error(`Unexpected response from server`);
    }

    if (typeof parsed === 'string') {
      throw new Error(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  }

  #parseAutocompleteResponse(data) {
    if (!data || data.trim() === '') {
      return [];
    }

    const lines = data.split('\n').filter(line => line.trim() !== '');
    return lines.map(line => {
      const match = line.match(/^([^\|]+)\|?([\s\S]*)$/);
      if (match) {
        return {
          label: match[1].trim(),
          value: match[2] ? match[2].trim() : match[1].trim()
        };
      }
      return { label: line.trim(), value: line.trim() };
    });
  }

  async search({ tags = '', page = 0, limit = 100, ratings = null } = {}) {
    const url = new URL(this.#apiPath, window.location.origin);
    const searchParams = new URLSearchParams();

    searchParams.set('page', 'dapi');
    searchParams.set('s', 'post');
    searchParams.set('q', 'index');
    searchParams.set('json', '1');

    if (tags) {
      const tagString = Array.isArray(tags) ? tags.join(' ') : tags;
      searchParams.set('tags', tagString.trim());
    }

    searchParams.set('limit', Math.min(limit, 1000).toString());
    searchParams.set('pid', page.toString());

    if (ratings && Array.isArray(ratings) && ratings.length > 0) {
      searchParams.set('rating', ratings.join(','));
    }

    if (this.#apiKey) {
      searchParams.set('api_key', this.#apiKey);
      if (this.#userId) {
        searchParams.set('user_id', this.#userId);
      }
    }

    url.search = searchParams.toString();
    const requestUrl = url.toString();

    const cached = searchCache.get(requestUrl);
    if (cached) return cached;

    const data = await this.#queuedRequest(requestUrl);

    const result = data.map(post => ({
      id: parseInt(post.id, 10) || null,
      tags: post.tags || '',
      score: parseInt(post.score, 10) || 0,
      rating: post.rating || '',
      file_url: post.file_url || '',
      preview_url: post.preview_url || '',
      sample_url: post.sample_url || '',
      width: parseInt(post.width, 10) || 0,
      height: parseInt(post.height, 10) || 0,
      source: post.source || '',
      created_at: post.created_at || '',
      owner: post.owner || '',
      file_ext: post.file_ext || (post.image || '').split('.').pop() || ''
    }));

    searchCache.set(requestUrl, result);

    return result;
  }

  async autocomplete(query) {
    if (!query || query.trim() === '') {
      return [];
    }

    const encodedQuery = encodeURIComponent(query.trim());
    const url = `${this.#autocompleteUrl}${encodedQuery}`;

    const cached = autocompleteCache.get(url);
    if (cached) return cached;

    const results = await this.#queuedRequest(url);
    const filtered = results.filter(item => item.label && item.value);

    autocompleteCache.set(url, filtered);

    return filtered;
  }

  hasAuth() {
    return !!(this.#apiKey && this.#userId);
  }

  updateAuth(apiKey, userId) {
    this.#apiKey = apiKey;
    this.#userId = userId;
  }

  clearCache() {
    searchCache.clear();
    autocompleteCache.clear();
  }
}