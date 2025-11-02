import { Request, Response } from 'express'
import statusCodes from 'http-status-codes'

const { NOT_FOUND } = statusCodes

export const notFound = (_req: Request, res: Response) => {
  const error = new Error()
  error.message = 'Not found'
  return res.status(NOT_FOUND).send(error.message)
}