import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { ACCENT_PALETTE, useSettingsStore } from '@/stores/settings'

describe('settings accent color', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults to purple when no accent is stored', () => {
    const settings = useSettingsStore()

    expect(settings.accentId).toBe('purple')
    expect(settings.accentColor.id).toBe('purple')
  })

  it('loads a valid stored accent', () => {
    localStorage.setItem('r34_accent', 'blue')

    const settings = useSettingsStore()

    expect(settings.accentId).toBe('blue')
    expect(settings.accentColor.label).toBe('Blue')
  })

  it('falls back to purple for an unknown stored accent', () => {
    localStorage.setItem('r34_accent', 'unknown')

    const settings = useSettingsStore()

    expect(settings.accentId).toBe('purple')
    expect(settings.accentColor.id).toBe('purple')
  })

  it('updates and persists accent changes', async () => {
    const settings = useSettingsStore()

    settings.setAccent('green')
    await nextTick()

    expect(settings.accentId).toBe('green')
    expect(settings.accentColor.label).toBe('Green')
    expect(localStorage.getItem('r34_accent')).toBe('green')
  })

  it('ignores invalid accent changes', async () => {
    const settings = useSettingsStore()

    settings.setAccent('blue')
    await nextTick()
    settings.setAccent('invalid')
    await nextTick()

    expect(settings.accentId).toBe('blue')
    expect(localStorage.getItem('r34_accent')).toBe('blue')
  })

  it('exposes the expected accent palette ids', () => {
    expect(ACCENT_PALETTE.map((accent) => accent.id)).toEqual([
      'purple',
      'deep-purple',
      'indigo',
      'blue',
      'light-blue',
      'cyan',
      'teal',
      'green',
      'light-green',
      'lime',
      'yellow',
      'amber',
      'orange',
      'deep-orange',
      'red',
      'pink',
      'brown',
      'blue-grey',
    ])
  })
})
