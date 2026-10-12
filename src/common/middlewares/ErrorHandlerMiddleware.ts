import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/index.js';
import { ApiResponseHelper } from '../utils/ApiResponseHelper.js';
import { EnvConfig } from '../../config/EnvConfig.js';

/**
 * Middleware POO para captura global de excepciones y errores de la API.
 */
export class ErrorHandlerMiddleware {
  public static handle(error: Error, _req: Request, res: Response, _next: NextFunction): void {
    if (error instanceof AppError) {
      ApiResponseHelper.error(res, error.message, error.statusCode, error.details);
      return;
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      ApiResponseHelper.error(res, 'El recurso ya existe o el registro está duplicado', 409, (error as unknown as { errors: unknown[] }).errors);
      return;
    }

    if (error.name === 'SequelizeValidationError') {
      ApiResponseHelper.error(res, 'Error en la validación de base de datos', 422, (error as unknown as { errors: unknown[] }).errors);
      return;
    }

    const isDevelopment = EnvConfig.NODE_ENV !== 'production';
    console.error('[UNHANDLED_ERROR]:', error);

    ApiResponseHelper.error(
      res,
      'Ocurrió un error interno en el servidor',
      500,
      isDevelopment ? { message: error.message, stack: error.stack } : undefined
    );
  }
}
