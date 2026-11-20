import { Response } from 'express';
import { IApiResponse } from '../interfaces/index.js';

/**
 * Clase utilitaria POO para unificar y estandarizar las respuestas JSON de la API.
 */
export class ApiResponseHelper {
  public static success<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data
    };
    return res.status(statusCode).json(response);
  }

  public static created<T>(res: Response, data: T, message = 'Recurso creado exitosamente'): Response {
    return this.success(res, data, message, 201);
  }

  public static paginated<T>(
    res: Response,
    data: T,
    meta: { page: number; limit: number; total: number; totalPages: number },
    message?: string
  ): Response {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data,
      meta
    };
    return res.status(200).json(response);
  }

  public static error(res: Response, message: string, statusCode = 500, details?: unknown): Response {
    const response: IApiResponse<null> = {
      success: false,
      message,
      error: {
        details
      }
    };
    return res.status(statusCode).json(response);
  }
}
