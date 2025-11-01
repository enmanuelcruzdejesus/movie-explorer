import Joi from 'joi'
import { IdSchema } from '../common'
import {
  GetFavoritesSchema,
  PostFavoriteSchema,
  PutFavoriteSchema,
  DeleteFavoriteSchema,
} from './types'
import { _createFavoriteBodySchema, _updateFavoriteBodySchema } from './body'

/* --------------- Favorites route schemas --------------- */

// GET /favorites
export const getFavoritesSchema = Joi.object<GetFavoritesSchema>({
  params: Joi.object({}),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(25).allow(null),
    cursor: Joi.string().allow(null),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),
})

// POST /favorites
export const postFavoriteSchema = Joi.object<PostFavoriteSchema>({
  body: _createFavoriteBodySchema.required(),
})

// PUT /favorites/{id}
export const putFavoriteSchema = Joi.object<PutFavoriteSchema>({
  params: Joi.object({
    id: IdSchema.required(),
  }),
  body: _updateFavoriteBodySchema.required(),
})

// DELETE /favorites/{id}
export const deleteFavoriteSchema = Joi.object<DeleteFavoriteSchema>({
  params: Joi.object({
    id: IdSchema.required(),
  }),
})
