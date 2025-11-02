import statusCodes from 'http-status-codes'

const {
  BAD_REQUEST,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  UNAUTHORIZED,
  UNPROCESSABLE_ENTITY,
} = statusCodes

export default class ApiError {
  /**
   * @param {code} status code of the error that needs to be returned.
   * @param {message} description summary of the encounted error.
   */
  constructor(
    public code: number,
    public message: string,
  ) {}

  /**
   * @param {msg}
   * @returns a 400 error Bad request.
   */
  static badRequest(msg: string): ApiError {
    return new ApiError(BAD_REQUEST, msg)
  }

  /**
   * @param {msg}
   * @returns a 401 error Unauthorized.
   */
  static unauthorized(msg: string): ApiError {
    return new ApiError(UNAUTHORIZED, msg)
  }

  /**
   * @param {msg}
   * @returns a 403 error Invalid credentials.
   */
  static forbidden(msg: string): ApiError {
    return new ApiError(FORBIDDEN, msg)
  }

  /**
   * @param {msg}
   * @returns a 404 Ressource not found or route not found.
   */
  static notFound(msg: string): ApiError {
    return new ApiError(NOT_FOUND, msg)
  }
  /**
   * @param {msg}
   * @returns a 422 validation error from validation middleware.
   */
  static validationError(msg: string): ApiError {
    return new ApiError(UNPROCESSABLE_ENTITY, msg)
  }

  /**
   * @param {msg}
   * @returns a 500 error Internal error.
   */
  static internal(msg: string): ApiError {
    return new ApiError(INTERNAL_SERVER_ERROR, msg)
  }
}