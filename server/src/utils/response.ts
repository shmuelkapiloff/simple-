export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
};

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function fail(message: string, errors?: any[]): ApiResponse<null> {
  return { success: false, message, errors: errors || [] };
}
