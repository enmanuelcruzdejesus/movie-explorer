import { Logger, createLogger, format, transports } from 'winston'

const { colorize, combine, errors, printf, timestamp, splat, label } = format

export function buildDevLogger() {
  const logFormat = printf(({ level, message, stack, timestamp, label }) => {
    if (!label) {
      return `${timestamp} ${level} ${stack || message}`
    }
    return `${timestamp} ${level} ${label}.${stack || message}`
  })

  return (customName?: string): Logger =>
    createLogger({
      format: combine(
        label({ label: customName ? customName : '' }),
        splat(),
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat,
      ),
      transports: [new transports.Console()],
    })
}