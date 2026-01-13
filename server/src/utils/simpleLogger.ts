// server/src/utils/simpleLogger.ts
import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info");

/**
 * Production-ready logger using Pino
 * Automatically handles JSON logging in production, pretty printing in development
 */
const pinoLogger = pino({
  level: LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  }),
});

/**
 * SimpleLogger - Backward compatible logger with production features
 * Integrates with Pino for structured logging
 */
class SimpleLogger {
  private static colors = {
    INFO: "\x1b[36m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
    DEBUG: "\x1b[35m",
    SUCCESS: "\x1b[32m",
    RESET: "\x1b[0m",
  };

  static info(service: string, message: string, data?: any) {
    pinoLogger.info({ service, ...data }, message);
  }

  static success(service: string, message: string, data?: any) {
    pinoLogger.info({ service, level: "success", ...data }, `✓ ${message}`);
  }

  static warn(service: string, message: string, data?: any) {
    pinoLogger.warn({ service, ...data }, message);
  }

  static error(service: string, message: string, error?: any) {
    const errorData =
      error instanceof Error
        ? {
            service,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
            },
          }
        : { service, error };

    pinoLogger.error(errorData, message);
  }

  static debug(service: string, message: string, data?: any) {
    pinoLogger.debug({ service, ...data }, message);
  }

  /**
   * Log performance metrics
   */
  static performance(
    service: string,
    operation: string,
    durationMs: number,
    data?: any
  ) {
    const level = durationMs > 1000 ? "warn" : "debug";
    pinoLogger[level](
      { service, operation, durationMs, ...data },
      `${operation} completed in ${durationMs}ms`
    );
  }

  /**
   * Log API request/response
   */
  static request(
    service: string,
    method: string,
    path: string,
    statusCode: number,
    durationMs: number
  ) {
    const level = statusCode >= 400 ? "warn" : "info";
    pinoLogger[level](
      { service, method, path, statusCode, durationMs },
      `${method} ${path} - ${statusCode} (${durationMs}ms)`
    );
  }

  /**
   * Log database operations
   */
  static database(
    service: string,
    operation: string,
    collection: string,
    durationMs: number,
    data?: any
  ) {
    pinoLogger.debug(
      { service, operation, collection, durationMs, ...data },
      `DB ${operation} on ${collection} (${durationMs}ms)`
    );
  }
}

// 🎯 הקסם - decorator לפונקציות!
export function logFunction(serviceName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();

      // לוג התחלה (קצר!)
      SimpleLogger.info(serviceName, `→ ${propertyKey}`, {
        params: args.length > 0 ? `${args.length} args` : "no args",
      });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // לוג הצלחה
        SimpleLogger.success(serviceName, `← ${propertyKey} (${duration}ms)`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        SimpleLogger.error(
          serviceName,
          `← ${propertyKey} FAILED (${duration}ms)`,
          error
        );
        throw error;
      }
    };

    return descriptor;
  };
}

// 🎯 עוד יותר פשוט - מחלקה שלמה
export function logClass(serviceName: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    // עבור על כל המתודות הסטטיות
    const staticMethodNames = Object.getOwnPropertyNames(constructor);

    staticMethodNames.forEach((methodName) => {
      if (
        methodName !== "length" &&
        methodName !== "name" &&
        methodName !== "prototype" &&
        typeof constructor[methodName as keyof typeof constructor] ===
          "function"
      ) {
        const originalMethod = constructor[
          methodName as keyof typeof constructor
        ] as Function;

        (constructor as any)[methodName] = function (...args: any[]) {
          const startTime = Date.now();
          SimpleLogger.info(serviceName, `→ ${methodName}`);

          try {
            const result = originalMethod.apply(this, args);

            if (result instanceof Promise) {
              return result
                .then((res) => {
                  const duration = Date.now() - startTime;
                  SimpleLogger.success(
                    serviceName,
                    `← ${methodName} (${duration}ms)`
                  );
                  return res;
                })
                .catch((error) => {
                  const duration = Date.now() - startTime;
                  SimpleLogger.error(
                    serviceName,
                    `← ${methodName} FAILED (${duration}ms)`,
                    error
                  );
                  throw error;
                });
            } else {
              const duration = Date.now() - startTime;
              SimpleLogger.success(
                serviceName,
                `← ${methodName} (${duration}ms)`
              );
              return result;
            }
          } catch (error) {
            const duration = Date.now() - startTime;
            SimpleLogger.error(
              serviceName,
              `← ${methodName} FAILED (${duration}ms)`,
              error
            );
            throw error;
          }
        };
      }
    });

    // עבור על מתודות instance
    const methodNames = Object.getOwnPropertyNames(constructor.prototype);

    methodNames.forEach((methodName) => {
      if (
        methodName !== "constructor" &&
        typeof constructor.prototype[methodName] === "function"
      ) {
        const originalMethod = constructor.prototype[methodName];

        constructor.prototype[methodName] = function (...args: any[]) {
          const startTime = Date.now();
          SimpleLogger.info(serviceName, `→ ${methodName}`);

          try {
            const result = originalMethod.apply(this, args);

            if (result instanceof Promise) {
              return result
                .then((res) => {
                  const duration = Date.now() - startTime;
                  SimpleLogger.success(
                    serviceName,
                    `← ${methodName} (${duration}ms)`
                  );
                  return res;
                })
                .catch((error) => {
                  const duration = Date.now() - startTime;
                  SimpleLogger.error(
                    serviceName,
                    `← ${methodName} FAILED (${duration}ms)`,
                    error
                  );
                  throw error;
                });
            } else {
              const duration = Date.now() - startTime;
              SimpleLogger.success(
                serviceName,
                `← ${methodName} (${duration}ms)`
              );
              return result;
            }
          } catch (error) {
            const duration = Date.now() - startTime;
            SimpleLogger.error(
              serviceName,
              `← ${methodName} FAILED (${duration}ms)`,
              error
            );
            throw error;
          }
        };
      }
    });

    return constructor;
  };
}

export { SimpleLogger as L };
