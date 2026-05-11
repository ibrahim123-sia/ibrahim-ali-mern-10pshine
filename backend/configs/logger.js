import pino from 'pino';

const isProd= process.env.NODE_ENV==='production';

const logger=pino({

    level: process.env.LOG_LEVEL || (isProd?"info":"debug"),
    base:{service:"backend"},
    timestamp:pino.stdTimeFunctions.isoTime,

    redact:{
        paths:[
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.token",
            "req.body.newPassword",
            "*.password",
            "*.token"
        ],
        censor:"[REDACTED]"
    },

    transport: isProd? undefined:{
        target:"pino-pretty",
        options:{
            colorize:true,
            translateTime:"SYS:HH:MM:ss.l",
            ignore:"hostname"
        }
    }

});

export default logger;