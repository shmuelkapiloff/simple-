import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const incomingId = (req.headers["x-request-id"] as string) || undefined;
  const requestId = incomingId || randomUUID();
  (req as any).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const start = Date.now();
  const requestId = (req as any).requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: duration,
        contentLength: res.getHeader("content-length"),
        userAgent: req.headers["user-agent"],
      },
      "HTTP Request"
    );
  });

  next();
}
