import { Logger } from 'winston'
import { buildDevLogger } from './devlogger'
import { buildProdLogger } from './prodlogger'

const logger: (customName?: string) => Logger =
  process.env.NODE_ENV === 'development' ? buildDevLogger() : buildProdLogger()

export { logger }