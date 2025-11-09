import { Response } from "express";

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
};

// Helper functions for sending responses
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  status: number = 200
): void {
  res.status(status).json({
    success: true,
    data,
    message,
  });
}

export function sendError(
  res: Response,
  message: string,
  status: number = 400,
  errors?: any[]
): void {
  res.status(status).json({
    success: false,
    message,
    errors: errors || [],
  });
}

// Legacy functions (keep for backward compatibility)
export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function fail(message: string, errors?: any[]): ApiResponse<null> {
  return { success: false, message, errors: errors || [] };
}
