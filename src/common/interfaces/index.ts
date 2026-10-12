import { Request } from 'express';

/**
 * Contrato de respuesta estándar para la API REST.
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Interfaz genérica para la capa de persistencia (ISP y DIP).
 */
export interface IBaseRepository<T, ID = string | number> {
  findById(id: ID): Promise<T | null>;
  findAll(filters?: Record<string, unknown>): Promise<T[]>;
  create(item: Partial<T>): Promise<T>;
  update(id: ID, item: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

/**
 * Estructura de la información decodificada del JWT.
 */
export interface IAuthUserPayload {
  id: string;
  email: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  fullName: string;
}

/**
 * Extensión del Request de Express con la identidad del usuario logueado.
 */
export interface IAuthenticatedRequest extends Request {
  user?: IAuthUserPayload;
}
