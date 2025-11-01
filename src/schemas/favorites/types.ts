/* --------------- Favorites types --------------- */
export type CreateFavoriteBody = {
  movieId: string
  title?: string
  year?: number
  genres?: string[]
  posterUrl?: string
  notes?: string | null
  rating?: number | null
}

export type UpdateFavoriteBody = {
  title?: string
  year?: number
  genres?: string[]
  posterUrl?: string
  notes?: string | null
  rating?: number | null
}

export type GetFavoritesSchema = {
  params: Record<string, never>
  query: {
    limit?: number | null
    cursor?: string | null
    order?: 'asc' | 'desc'
  }
}

export type PostFavoriteSchema = {
  body: CreateFavoriteBody
}

export type PutFavoriteSchema = {
  params: { id: string }
  body: UpdateFavoriteBody
}

export type DeleteFavoriteSchema = {
  params: { id: string }
}
