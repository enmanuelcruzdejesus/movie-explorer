import { NextFunction, Request, Response } from 'express'
import statusCodes from 'http-status-codes'
import { logger } from '../lib'
import { ApiError } from '../controllers'
import { UnauthorizedError } from 'express-jwt'

const { INTERNAL_SERVER_ERROR, UNAUTHORIZED } = statusCodes

const apiErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const log = logger('errorMiddleware')
  // Check if the server is running in the prod environment.
  const isProd = process.env.NODE_ENV?.includes('prod')

  // Add the stack trace only in the Dev & QA environments.
  const stack = !isProd ? err.stack : null

  // Set locals, only providing error in the Dev & QA environments.
  res.locals.message = err.message
  res.locals.error = !isProd ? err : {}

  // Build the error message.
  const message = stack ? { message: err.message, stack } : err.message

  // log untrace message
  log.error(JSON.stringify(message))

  // If error an instance of ApiError
  if (err instanceof ApiError) {
    res.status(err.code).json(message)
  } else if (err instanceof UnauthorizedError) {
    res.status(UNAUTHORIZED).send(err.message)
  } else {
    // Fallback to 500 error.
    res.status(INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      stack,
    })
  }
  return
}

export { apiErrorHandler }