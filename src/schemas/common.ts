import Joi from 'joi'

/* --------------- Shared helpers --------------- */
export const FALSE = ['false', '0', 'no', 'n']
export const TRUE = ['true', '1', 'yes', 'y']

// ULID (26 chars, Crockford base32)
export const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/

// Accept either UUID v4 or ULID
export const IdSchema = Joi.alternatives().try(
  Joi.string().guid({ version: 'uuidv4' }),
  Joi.string().pattern(ULID_REGEX),
)
