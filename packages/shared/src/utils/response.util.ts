import type { ApiResponse } from '../types'

export class ResponseUtil {
  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || '操作成功',
    }
  }

  static error(message: string, code?: string, details?: any[]): ApiResponse {
    return {
      success: false,
      error: {
        code: code || 'UNKNOWN_ERROR',
        message,
        details,
      },
    }
  }
}