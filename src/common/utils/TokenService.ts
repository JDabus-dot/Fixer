import jwt from 'jsonwebtoken';
import { EnvConfig } from '../../config/EnvConfig.js';
import { IAuthUserPayload } from '../interfaces/index.js';
import { UnauthorizedError } from '../errors/index.js';

/**
 * Servicio POO para emisión y verificación de JSON Web Tokens.
 */
export class TokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(secret = EnvConfig.JWT_SECRET, expiresIn = EnvConfig.JWT_EXPIRES_IN) {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  public generateToken(payload: IAuthUserPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn
    } as jwt.SignOptions);
  }

  public verifyToken(token: string): IAuthUserPayload {
    try {
      return jwt.verify(token, this.secret) as IAuthUserPayload;
    } catch {
      throw new UnauthorizedError('Token de autenticación expirado o inválido');
    }
  }
}
