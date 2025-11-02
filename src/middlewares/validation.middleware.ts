import { Response, NextFunction, Request } from 'express'
import Joi from 'joi'
import { ApiError } from '../controllers'
import { logger } from '../lib'

export type AuthPayload = {
  cc_id: string
  cc_uid: string
  eg_test: string
  dirCode: string
  rc_roles: string[]
  email: string
  first_name: string
  last_name: string
  name: string
  business_id: string
  tenant_id?: string
  user_id: string
  iss: string
  sub: string
  aud: string[]
  iat: number
  exp: number
  azp: string
  scope: string
  permissions: string[]
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ValidatedRequest<ValidationSchema = any> extends Request {
  auth: AuthPayload
  validatedParams: ValidationSchema
}

const log = logger('validationMiddle')
export function validate(schema: Joi.ObjectSchema, opts?: Joi.ValidationOptions) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const options: Joi.ValidationOptions = {
      abortEarly: false,
      stripUnknown: { arrays: true, objects: true },
      ...opts,
    }

    const { error, value } = schema.validate(
      { body: req.body, query: req.query, params: req.params },
      options,
    )
    if (error) {
      // log error for debugging
      log.error(error.message)
      // return a general message for security reasons
      throw ApiError.validationError('bad request')
    }
    (req as ValidatedRequest).validatedParams = value
    next()
  }
}