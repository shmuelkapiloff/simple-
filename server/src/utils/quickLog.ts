// server/src/utils/quickLog.ts
import { logger } from "./logger";

// 🎯 הכי פשוט וחכם - בלי decorators מסובכים
export const log = {
  // לוג מהיר לכניסה לפונקציה
  in: (service: string, func: string, ...data: any[]) => {
    logger.info({ service, func, data }, `→ ${service}.${func}`);
    return Date.now();
  },

  // לוג מהיר ליציאה מוצלחת
  out: (service: string, func: string, startTime: number, result?: any) => {
    const duration = Date.now() - startTime;
    logger.info(
      { service, func, duration },
      `✅ ${service}.${func} (${duration}ms)`
    );
  },

  // לוג שגיאה
  err: (service: string, func: string, startTime: number, error: any) => {
    const duration = Date.now() - startTime;
    logger.error(
      { service, func, duration, error: error.message || error },
      `❌ ${service}.${func} FAILED (${duration}ms)`
    );
  },

  // לוג מותנה לדיבוג
  debug: (service: string, message: string, data?: any) => {
    if (process.env.DEBUG_MODE === "true") {
      logger.debug({ service, data }, `🔍 ${message}`);
    }
  },
};

// 🎯 helper לעקיבה אוטומטית - 2 שורות בלבד!
export const track = (service: string, funcName: string) => {
  const startTime = log.in(service, funcName);
  return {
    success: (result?: any) => log.out(service, funcName, startTime, result),
    error: (error: any) => log.err(service, funcName, startTime, error),
  };
};
