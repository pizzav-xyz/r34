export type ThemeMode = 'system' | 'light' | 'dark'
export type WatchedMode = 'show' | 'dim' | 'hide'

export interface AccentColorVariant {
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
}

export interface AccentColor {
  id: string
  label: string
  light: AccentColorVariant
  dark: AccentColorVariant
}

export type AccentColorId = string
