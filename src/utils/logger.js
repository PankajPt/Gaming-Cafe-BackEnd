import winston from 'winston'

const { combine, timestamp, label, printf } = winston.format

const logFormat = printf(({timestamp, level, message})=>{
    const istTime = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata', 
        dateStyle: 'short', 
        timeStyle: 'medium',
        hourCycle: 'h23'
      }).format(new Date(timestamp)).replace(',', '');
    return `${istTime} [${level.toUpperCase()}]: ${message}`
})

const logger = winston.createLogger({
    level: 'error', //default set to error
    format: combine(timestamp(), logFormat),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'logs/error.log'})
    ]
})

const setLogLevel = (level) => {
    const logLevel = level.toLowerCase()
    if(['info', 'warn', 'error'].includes(logLevel)){
        logger.level = logLevel
        console.log(`Log level set to: ${level}`);
    } else {
        console.error('Invalid log level. Use "info", "warn", or "error".');
    }
}

setLogLevel(process.env.LOG_LEVEL)

export { logger, setLogLevel }