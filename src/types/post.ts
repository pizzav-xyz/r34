/** A rule34 post returned from the API */
export interface Post {
  id: number | null
  tags: string
  score: number
  rating: string
  file_url: string
  preview_url: string
  sample_url: string
  width: number
  height: number
  source: string
  created_at: string
  owner: string
  file_ext: string
  video_duration: number | null
}
