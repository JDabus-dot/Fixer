import { NextFunction, Response } from 'express';
import { IAuthenticatedRequest } from '../interfaces/index.js';
import { TokenService } from '../utils/TokenService.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

/**
 * Middleware POO para autenticación de tokens JWT y control de acceso basado en roles (RBAC).
 */
export class AuthMiddleware {
  private readonly tokenService: TokenService;

  constructor(tokenService = new TokenService()) {
    this.tokenService = tokenService;
  }

  public authenticate = (req: IAuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Se requiere un token de autenticación Bearer válido');
    }

    const token = authHeader.substring(7);
    const decoded = this.tokenService.verifyToken(token);
    req.user = decoded;
    next();
  };

  public optionalAuthenticate = (req: IAuthenticatedRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        req.user = this.tokenService.verifyToken(token);
      } catch {
        // Token inválido u omitido, se continúa sin autenticación
      }
    }
    next();
  };

  public authorize = (roles: Array<'CLIENT' | 'PROFESSIONAL' | 'ADMIN'>) => {
    return (req: IAuthenticatedRequest, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(`Acceso restringido a los siguientes roles: ${roles.join(', ')}`);
      }

      next();
    };
  };
}
