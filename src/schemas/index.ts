export * from './common'

// Favorites
export * from './favorites/types'
export {
  getFavoritesSchema,
  postFavoriteSchema,
  putFavoriteSchema,
  deleteFavoriteSchema,
} from './favorites/routes'

// Recommendations
export * from './recommendations/types'
export { getRecommendationsSchema } from './recommendations/routes'
