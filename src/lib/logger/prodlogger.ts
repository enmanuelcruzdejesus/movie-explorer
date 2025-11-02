import { createLogger, format, Logger, transports } from 'winston'

const { combine, errors, json, timestamp, splat, label } = format

export function buildProdLogger() {
  return (customName?: string): Logger =>
    createLogger({
      level: 'warn',
      format: combine(
        label({ label: customName ? customName : '' }),
        splat(),
        timestamp(),
        errors({ stack: true }),
        json(),
      ),
      defaultMeta: { service: 'rc-api' },
      transports: [new transports.Console()],
    })
}