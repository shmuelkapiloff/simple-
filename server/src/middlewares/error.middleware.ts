import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { fail } from "../utils/response";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error({ err }, "Unhandled error");
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json(fail(message));
}
