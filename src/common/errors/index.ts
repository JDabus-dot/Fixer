/**
 * Clase base abstracta para errores controlados de la aplicación.
 * Demuestra herencia en POO y asegura el Principio de Sustitución de Liskov (LSP).
 */
export abstract class AppError extends Error {
  public abstract readonly statusCode: number;

  constructor(message: string, public readonly details?: unknown) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  public readonly statusCode = 400;

  constructor(message = 'Petición inválida o malformada', details?: unknown) {
    super(message, details);
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;

  constructor(message = 'No autorizado. Credenciales inválidas o ausentes', details?: unknown) {
    super(message, details);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;

  constructor(message = 'Acceso denegado a este recurso', details?: unknown) {
    super(message, details);
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;

  constructor(message = 'Recurso no encontrado', details?: unknown) {
    super(message, details);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;

  constructor(message = 'Conflicto con el estado actual del recurso', details?: unknown) {
    super(message, details);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 422;

  constructor(message = 'Error de validación de datos', details?: unknown) {
    super(message, details);
  }
}
