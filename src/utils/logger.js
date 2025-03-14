import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors } = winston.format

const logFormat = printf(({timestamp, level, message, ...metadata})=>{
    const istTime = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata', 
        dateStyle: 'short', 
        timeStyle: 'medium',
        hourCycle: 'h23'
      }).format(new Date(timestamp)).replace(',', '');
    return `${istTime} [${level.toUpperCase()}]: ${message}\n${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''}`
})

const logger = winston.createLogger({
    level: 'error', //default set to error
    format: combine(timestamp(), errors({ stack: true}), logFormat),
    transports: [
        new winston.transports.Console(),
        new DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            maxSize: '5m',
            maxFiles: '20',
            zippedArchive: true
        })
    ]
})

const setLogLevel = (level) => {
    const logLevel = level?.toLowerCase()
    if(['info', 'warn', 'error'].includes(logLevel)){
        logger.level = logLevel
        console.log(`Log level set to: ${level}`);
    } else {
        console.error('Invalid log level. Use "info", "warn", or "error".');
    }
}

setLogLevel(process.env.LOG_LEVEL)

export { logger, setLogLevel }