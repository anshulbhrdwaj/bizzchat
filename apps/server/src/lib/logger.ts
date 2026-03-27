import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bizchat-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          // Mask phone numbers in logs
          const safeMessage = typeof message === 'string'
            ? message.replace(/(\+?\d{2})\d{6,}(\d{2})/g, '$1****$2')
            : message
          return `${timestamp} [${level}]: ${safeMessage}${Object.keys(meta).length > 1 ? ' ' + JSON.stringify(meta) : ''}`
        })
      ),
    }),
  ],
})

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  )
  logger.add(
    new winston.transports.File({ filename: 'logs/combined.log' })
  )
}

export default logger
