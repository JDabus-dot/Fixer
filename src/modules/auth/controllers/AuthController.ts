import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { ApiResponseHelper } from '../../../common/utils/ApiResponseHelper.js';

/**
 * Controlador POO para endpoints de autenticación y seguridad.
 */
export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public register = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.authService.register(req.body);
    return ApiResponseHelper.created(res, result, 'Usuario registrado exitosamente');
  };

  public login = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.authService.login(req.body);
    return ApiResponseHelper.success(res, result, 'Inicio de sesión exitoso');
  };

  public verifyAccount = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.authService.verifyAccountForRecovery(req.body);
    return ApiResponseHelper.success(res, result, 'Cuenta verificada correctamente');
  };

  public resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const result = await this.authService.resetPassword(req.body);
    return ApiResponseHelper.success(res, result, result.message);
  };
}
