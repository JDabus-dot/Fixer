import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../errors/index.js';

/**
 * Middleware POO para validación de contratos y DTOs mediante esquemas de Zod.
 */
export class ValidationMiddleware {
  public static validateBody(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const formattedErrors = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }));
          throw new ValidationError('Datos de entrada inválidos en el cuerpo de la petición', formattedErrors);
        }
        next(error);
      }
    };
  }

  public static validateQuery(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        req.query = schema.parse(req.query);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const formattedErrors = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }));
          throw new ValidationError('Parámetros de consulta (query) inválidos', formattedErrors);
        }
        next(error);
      }
    };
  }

  public static validateParams(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
      try {
        req.params = schema.parse(req.params);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const formattedErrors = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message
          }));
          throw new ValidationError('Parámetros de ruta inválidos', formattedErrors);
        }
        next(error);
      }
    };
  }
}
