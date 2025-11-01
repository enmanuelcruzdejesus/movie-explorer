import Joi from 'joi'
import { GetRecommendationsSchema } from './types'

/* --------------- Recommendations route schema --------------- */

// GET /recommendations/{movie_id}
export const getRecommendationsSchema = Joi.object<GetRecommendationsSchema>({
  params: Joi.object({
    movie_id: Joi.string().min(1).required(),
  }),
  query: Joi.object({
    // e.g. en, en-US
    locale: Joi.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).default('en').optional(),
    // hard-cap at 5 as per requirements
    limit: Joi.number().integer().min(1).max(5).default(5).allow(null),
  }),
})
