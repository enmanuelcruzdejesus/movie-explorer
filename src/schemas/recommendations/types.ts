/* --------------- Recommendations types --------------- */
export type GetRecommendationsSchema = {
  params: { movie_id: string }
  query: {
    locale?: string
    limit?: number | null // will default to 5 and capped at 5
  }
}
