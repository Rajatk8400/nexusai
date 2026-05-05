import winston from "winston";

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, module: mod, ...meta }) => {
    const metaStr = Object.keys(meta).length ? "\n" + JSON.stringify(meta, null, 2) : "";
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

const logger = winston.createLogger({
  level: process.env["LOG_LEVEL"] ?? "info",
  format: baseFormat,
  transports: [new winston.transports.Console()],
});

export function createLogger(module: string) {
  return {
    info: (msg: string, meta?: object) => logger.info(msg, { module, ...meta }),
    warn: (msg: string, meta?: object) => logger.warn(msg, { module, ...meta }),
    error: (msg: string, meta?: object) => logger.error(msg, { module, ...meta }),
    debug: (msg: string, meta?: object) => logger.debug(msg, { module, ...meta }),
  };
}
