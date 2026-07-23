export interface SearchParams {
  tags?: string
  page?: number
  limit?: number
  ratings?: string[]
}

export interface AutocompleteItem {
  label: string
  value: string
  count: number | null
}
