// server/src/utils/quickLog.ts

// 🎯 הכי פשוט וחכם - בלי decorators מסובכים
export const log = {
  // לוג מהיר לכניסה לפונקציה
  in: (service: string, func: string, ...data: any[]) => {
    const time = new Date().toISOString().substr(11, 8);
    console.log(`\x1b[36m${time} [${service}] → ${func}\x1b[0m`, ...data);
    return Date.now();
  },

  // לוג מהיר ליציאה מוצלחת
  out: (service: string, func: string, startTime: number, result?: any) => {
    const time = new Date().toISOString().substr(11, 8);
    const duration = Date.now() - startTime;
    console.log(
      `\x1b[32m${time} [${service}] ✅ ${func} (${duration}ms)\x1b[0m`
    );
  },

  // לוג שגיאה
  err: (service: string, func: string, startTime: number, error: any) => {
    const time = new Date().toISOString().substr(11, 8);
    const duration = Date.now() - startTime;
    console.log(
      `\x1b[31m${time} [${service}] ❌ ${func} FAILED (${duration}ms)\x1b[0m`,
      error.message || error
    );
  },

  // לוג מותנה לדיבוג
  debug: (service: string, message: string, data?: any) => {
    if (process.env.DEBUG_MODE === "true") {
      const time = new Date().toISOString().substr(11, 8);
      console.log(
        `\x1b[35m${time} [${service}] 🔍 ${message}\x1b[0m`,
        data || ""
      );
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
