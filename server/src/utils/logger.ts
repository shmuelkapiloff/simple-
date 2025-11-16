import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});

// Enhanced logger with service context
export const log = {
  in: (service: string, func: string, ...data: any[]) => {
    logger.info({ service, func, data }, `🔄 ${service}.${func} - START`);
    return Date.now();
  },
  out: (service: string, func: string, startTime: number, result?: any) => {
    const duration = Date.now() - startTime;
    logger.info(
      { service, func, duration, result },
      `✅ ${service}.${func} - END (${duration}ms)`
    );
  },
  err: (service: string, func: string, startTime: number, error: any) => {
    const duration = Date.now() - startTime;
    logger.error(
      { service, func, duration, error },
      `❌ ${service}.${func} - ERROR (${duration}ms)`
    );
  },
  debug: (service: string, message: string, data?: any) => {
    logger.debug({ service, data }, message);
  },
  // Simple logging methods
  info: (message: string, data?: any) => logger.info({ data }, message),
  error: (message: string, data?: any) => logger.error({ data }, message),
  warn: (message: string, data?: any) => logger.warn({ data }, message),
};
