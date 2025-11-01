import Joi from 'joi'
import { CreateFavoriteBody, UpdateFavoriteBody } from './types'

/* --------------- Favorites body schemas --------------- */
export const _createFavoriteBodySchema = Joi.object<CreateFavoriteBody>({
  movieId: Joi.string().min(1).required(),
  title: Joi.string().min(1).max(200),
  year: Joi.number().integer().min(1888).max(2100),
  genres: Joi.array().items(Joi.string().min(1).max(50)).max(10).unique(),
  posterUrl: Joi.string().uri(),
  notes: Joi.string().allow(null).max(1000),
  rating: Joi.number().min(0).max(10).allow(null),
})

export const _updateFavoriteBodySchema = Joi.object<UpdateFavoriteBody>({
  // @ts-expect-error: allow explicit forbid even though not in TS type
  movieId: Joi.forbidden(), // immutable
  title: Joi.string().min(1).max(200),
  year: Joi.number().integer().min(1888).max(2100),
  genres: Joi.array().items(Joi.string().min(1).max(50)).max(10).unique(),
  posterUrl: Joi.string().uri(),
  notes: Joi.string().allow(null).max(1000),
  rating: Joi.number().min(0).max(10).allow(null),
}).min(1)
