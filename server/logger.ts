import { createLogger, format, LeveledLogMethod, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, json, colorize, align, errors } = format;

const timestampFormat = 'YYYY-MM-DD HH:mm:ss';

const infoLogger = createLogger({
  level: 'silly',
  transports: [
    new DailyRotateFile({
      filename: 'logs/logs/logs-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '60d',
      format: combine(timestamp({ format: timestampFormat }), json()),
    }),
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({
          format: timestampFormat,
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
      ),
    }),
  ],
});

const errorLogger = createLogger({
  level: 'error',
  transports: [
    new DailyRotateFile({
      level: 'error',
      filename: 'logs/errors/errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '60d',
      handleExceptions: true,
      handleRejections: true,
      format: combine(
        timestamp({ format: timestampFormat }),
        json(),
        errors({ stack: true })
      ),
    }),
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({
          format: timestampFormat,
        }),
        align(),
        printf(
          (info) =>
            `[${info.timestamp}] ${info.level}: ${
              info.shortMessage ?? info.message
            }`
        )
      ),
    }),
  ],
});

export const logger: { [key: string]: LeveledLogMethod } = {
  info: (...params) => infoLogger.info(...params),
  warn: (...params) => infoLogger.warn(...params),
  error: (...params) => errorLogger.error(...params),
};
