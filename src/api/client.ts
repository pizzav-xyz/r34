import { ofetch } from 'ofetch'
import type { Post, SearchParams, AutocompleteItem } from '@/types'
import { searchCache, autocompleteCache } from '@/utils/cache'
import {
  PAGE_SIZE as _PAGE_SIZE,
  MAX_LIMIT,
  MIN_REQUEST_INTERVAL,
  API_TIMEOUT,
  RETRY_COUNT,
} from '@/config'

export const PAGE_SIZE = _PAGE_SIZE

interface QueueEntry {
  fn: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}

/**
 * Typed API client for Rule34 endpoints.
 * Uses ofetch for requests with automatic retry/timeout.
 * Preserves request queue (500ms rate limit) and TTL cache from original client.js.
 */
export class APIClient {
  #apiKey: string
  #userId: string
  #fetch: typeof ofetch
  #queue: QueueEntry[] = []
  #processing = false
  #lastRequestTime = 0
  #minRequestInterval = MIN_REQUEST_INTERVAL

  constructor() {
    this.#apiKey = import.meta.env.R34_API_KEY || ''
    this.#userId = import.meta.env.R34_USER_ID || ''
    this.#fetch = ofetch.create({
      baseURL: '/api',
      retry: RETRY_COUNT,
      timeout: API_TIMEOUT,
    })
  }

  // ── Queue / Rate Limiting ──────────────────────────────────────────

  async #processQueue(): Promise<void> {
    if (this.#processing || this.#queue.length === 0) return

    this.#processing = true

    while (this.#queue.length > 0) {
      const now = Date.now()
      const timeSinceLast = now - this.#lastRequestTime

      if (timeSinceLast < this.#minRequestInterval) {
        await new Promise<void>(resolve => {
          setTimeout(resolve, this.#minRequestInterval - timeSinceLast)
        })
      }

      const task = this.#queue.shift()!
      try {
        const result = await task.fn()
        task.resolve(result)
      } catch (error) {
        task.reject(error)
      }

      this.#lastRequestTime = Date.now()
    }

    this.#processing = false
  }

  #queuedFetch<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.#queue.push({
        fn: fn as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      })
      this.#processQueue()
    })
  }

  // ── Response Parsing (text-mode, matching original #executeRequest) ─

  /**
   * Raw text fetch + parse, preserving original error-detection logic
   * (empty body, XML errors, HTML error pages, JSON parsing).
   */
  async #fetchRaw(url: string): Promise<unknown[]> {
    const data = await this.#fetch<string, 'text'>(url, { responseType: 'text' })

    if (!data || data.trim() === '') {
      return []
    }

    if (data.trimStart().startsWith('<?xml') || data.trimStart().startsWith('<error>')) {
      const msg = data.match(/<error>([^<]+)<\/error>/)?.[1] || 'Unknown API error'
      throw new Error(msg)
    }

    if (data.trimStart().startsWith('<!') || data.trimStart().startsWith('<html')) {
      throw new Error('Received HTML instead of API data — server may be down')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(data)
    } catch {
      throw new Error('Unexpected response from server')
    }

    if (typeof parsed === 'string') {
      throw new Error(parsed)
    }

    return Array.isArray(parsed) ? parsed : []
  }

  #parseAutocomplete(data: string): AutocompleteItem[] {
    if (!data || data.trim() === '') {
      return []
    }

    if (data.trimStart().startsWith('<!') || data.trimStart().startsWith('<html')) {
      return []
    }

    try {
      const parsed = JSON.parse(data)
      if (!Array.isArray(parsed)) return []

      return parsed.map(item => {
        const label = String(item.label || '')
        // Extract count from "tag (12345)" format
        const countMatch = label.match(/\((\d+)\)\s*$/)
        return {
          label: countMatch ? label.replace(/\s*\(\d+\)\s*$/, '') : label,
          value: String(item.value || label),
          count: countMatch ? parseInt(countMatch[1]) : null,
        }
      })
    } catch {
      return []
    }
  }

  // ── Public API ─────────────────────────────────────────────────────

  async search({
    tags = '',
    page = 0,
    limit = PAGE_SIZE,
    ratings,
  }: SearchParams = {}): Promise<Post[]> {
    const params: Record<string, string> = {
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: '1',
      limit: String(Math.min(limit, MAX_LIMIT)),
      pid: String(page),
    }

    if (tags) {
      params.tags = tags.trim()
    }

    if (ratings && ratings.length > 0) {
      params.rating = ratings.join(',')
    }

    if (this.#apiKey) {
      params.api_key = this.#apiKey
      if (this.#userId) {
        params.user_id = this.#userId
      }
    }

    const paramString = new URLSearchParams(params).toString()
    const cacheKey = paramString

    const cached = searchCache.get(cacheKey)
    if (cached) return cached

    const data = await this.#queuedFetch(() =>
      this.#fetchRaw(`/index.php?${paramString}`),
    )

    const result: Post[] = data.map(post => {
      const p = post as Record<string, unknown>
      return {
        id: parseInt(String(p.id), 10) || null,
        tags: String(p.tags || ''),
        score: parseInt(String(p.score), 10) || 0,
        rating: String(p.rating || ''),
        file_url: String(p.file_url || ''),
        preview_url: String(p.preview_url || ''),
        sample_url: String(p.sample_url || ''),
        width: parseInt(String(p.width), 10) || 0,
        height: parseInt(String(p.height), 10) || 0,
        source: String(p.source || ''),
        created_at: String(p.created_at || ''),
        owner: String(p.owner || ''),
        file_ext: String(p.file_ext || String(p.image || '').split('.').pop() || ''),
        video_duration: typeof p.video_duration === 'number' ? p.video_duration : null,
      }
    })

    searchCache.set(cacheKey, result)
    return result
  }

  async autocomplete(query: string): Promise<AutocompleteItem[]> {
    if (!query || query.trim() === '') {
      return []
    }

    const trimmed = query.trim()
    const encodedQuery = encodeURIComponent(trimmed)
    const cacheKey = `/autocomplete.php?q=${encodedQuery}`

    const cached = autocompleteCache.get(cacheKey)
    if (cached) return cached

    let data: string
    try {
      data = await this.#queuedFetch(() =>
        this.#fetch<string, 'text'>(`/autocomplete.php?q=${encodedQuery}`, {
          responseType: 'text',
        }),
      )
    } catch {
      return []
    }

    const results = this.#parseAutocomplete(data)
    const filtered = results.filter(item => item.label && item.value)

    autocompleteCache.set(cacheKey, filtered)
    return filtered
  }

  hasAuth(): boolean {
    return !!(this.#apiKey && this.#userId)
  }

  updateAuth(apiKey: string, userId: string): void {
    this.#apiKey = apiKey
    this.#userId = userId
  }

  clearCache(): void {
    searchCache.clear()
    autocompleteCache.clear()
  }
}

export const apiClient = new APIClient()
