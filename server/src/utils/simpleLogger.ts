// server/src/utils/simpleLogger.ts
type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

class SimpleLogger {
  private static colors = {
    INFO: "\x1b[36m", // כחול
    WARN: "\x1b[33m", // צהוב
    ERROR: "\x1b[31m", // אדום
    DEBUG: "\x1b[35m", // סגול
    SUCCESS: "\x1b[32m", // ירוק
    RESET: "\x1b[0m",
  };

  private static format(
    level: LogLevel,
    service: string,
    message: string,
    data?: any
  ): string {
    const timestamp = new Date().toISOString().substr(11, 12); // רק שעה
    const color = this.colors[level];
    const reset = this.colors.RESET;

    let result = `${color}${timestamp} [${service}] ${message}${reset}`;
    if (data) {
      result += ` ${JSON.stringify(data)}`;
    }
    return result;
  }

  static info(service: string, message: string, data?: any) {
    console.log(this.format("INFO", service, message, data));
  }

  static success(service: string, message: string, data?: any) {
    console.log(this.format("INFO", service, `✅ ${message}`, data));
  }

  static warn(service: string, message: string, data?: any) {
    console.log(this.format("WARN", service, `⚠️ ${message}`, data));
  }

  static error(service: string, message: string, error?: any) {
    console.log(
      this.format("ERROR", service, `❌ ${message}`, error?.message || error)
    );
  }

  static debug(service: string, message: string, data?: any) {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(this.format("DEBUG", service, `🔍 ${message}`, data));
    }
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
