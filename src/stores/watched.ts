import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { DEV_TTL } from '@/constants/dev'
import type { Post } from '@/types'

const KEY_WATCHED = 'r34_watched'
const KEY_LIGHTBOX_POST = 'r34_lightbox_post'
const KEY_LIGHTBOX_POST_TS = 'r34_lightbox_post_ts'

interface WatchedEntry {
  id: number
  at: number
}

export const useWatchedStore = defineStore('watched', () => {
  // --- Load from localStorage ---
  function loadWatched(): WatchedEntry[] {
    try {
      const raw: unknown[] = JSON.parse(localStorage.getItem(KEY_WATCHED) || '[]')
      if (raw.length && typeof raw[0] === 'number') {
        // Migrate old format (number[]) to ({id, at}[])
        return (raw as number[]).map(id => ({ id, at: Date.now() }))
      }
      return raw.filter(
        (e): e is WatchedEntry =>
          typeof e === 'object' && e !== null &&
          typeof (e as Record<string, unknown>).id === 'number' &&
          typeof (e as Record<string, unknown>).at === 'number'
      )
    } catch { return [] }
  }
  const watched = ref<WatchedEntry[]>(loadWatched())

  const watchedIds = ref<Set<number>>(new Set(watched.value.map(w => w.id)))

  function addWatched(postId: number) {
    watched.value = watched.value.filter(w => w.id !== postId)
    watched.value.unshift({ id: postId, at: Date.now() })
    watchedIds.value.add(postId)
  }

  function removeWatched(postId: number) {
    watched.value = watched.value.filter(w => w.id !== postId)
    watchedIds.value.delete(postId)
  }

  function toggleWatched(postId: number) {
    if (isWatched(postId)) removeWatched(postId)
    else addWatched(postId)
  }

  function isWatched(postId: number): boolean {
    return watchedIds.value.has(postId)
  }

  // Persist
  function persist() {
    localStorage.setItem(KEY_WATCHED, JSON.stringify(watched.value))
  }

  watch(watched, persist, { deep: true })

  // --- Lightbox State ---
  interface LightboxSaved {
    post: Post
    _playbackTime: number | null
  }

  function getLightboxPost(): LightboxSaved | null {
    if (!import.meta.env.DEV) return null
    try {
      const ts = Number(localStorage.getItem(KEY_LIGHTBOX_POST_TS))
      if (!ts || Date.now() - ts > DEV_TTL) {
        localStorage.removeItem(KEY_LIGHTBOX_POST)
        localStorage.removeItem(KEY_LIGHTBOX_POST_TS)
        return null
      }
      return JSON.parse(localStorage.getItem(KEY_LIGHTBOX_POST) || 'null')
    } catch { return null }
  }

  function setLightboxPost(post: Post, playbackTime: number | null) {
    if (!import.meta.env.DEV) return
    localStorage.setItem(KEY_LIGHTBOX_POST, JSON.stringify({ post, _playbackTime: playbackTime }))
    localStorage.setItem(KEY_LIGHTBOX_POST_TS, String(Date.now()))
  }

  function clearLightboxPost() {
    localStorage.removeItem(KEY_LIGHTBOX_POST)
    localStorage.removeItem(KEY_LIGHTBOX_POST_TS)
  }

  return {
    watched, watchedIds,
    addWatched, removeWatched, toggleWatched, isWatched,
    getLightboxPost, setLightboxPost, clearLightboxPost,
  }
})
