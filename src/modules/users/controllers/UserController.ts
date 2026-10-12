import { Response } from 'express';
import { UserService } from '../services/UserService.js';
import { IAuthenticatedRequest } from '../../../common/interfaces/index.js';
import { ApiResponseHelper } from '../../../common/utils/ApiResponseHelper.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

/**
 * Controlador POO para endpoints de usuarios.
 */
export class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  public getMyProfile = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const profile = await this.userService.getProfile(req.user.id);
    return ApiResponseHelper.success(res, profile, 'Perfil obtenido correctamente');
  };

  public updateMyProfile = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const updated = await this.userService.updateProfile(req.user.id, req.body);
    return ApiResponseHelper.success(res, updated, 'Perfil actualizado correctamente');
  };
}
