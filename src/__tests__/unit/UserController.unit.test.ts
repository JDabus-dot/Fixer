import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { UserController } from '../../modules/users/controllers/UserController.js';
import type { UserService } from '../../modules/users/services/UserService.js';
import type { IAuthenticatedRequest } from '../../common/interfaces/index.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';
import { UnauthorizedError } from '../../common/errors/index.js';


describe('UserController - Tests unitarios', () => {
  const userId = 'user-1';
  const user = {
    id: userId,
    fullName: 'Juan MartÃ­nez',
    email: 'juan.martinez@example.com'
  } as unknown as UserModel;

  let userService: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
  };

  let controller: UserController;
  let res: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };

  const buildRequest = (overrides: Partial<IAuthenticatedRequest> = {}): IAuthenticatedRequest =>
    ({
      user: { id: userId, email: 'juan.martinez@example.com', role: 'CLIENT', fullName: 'Juan MartÃ­nez' },
      body: {},
      ...overrides
    }) as unknown as IAuthenticatedRequest;

  beforeEach(() => {
    userService = {
      getProfile: vi.fn().mockResolvedValue(user),
      updateProfile: vi.fn().mockResolvedValue(user)
    };

    controller = new UserController(userService as unknown as UserService);

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  // getMyProfile: devolver el perfil del usuario autenticado.
  describe('getMyProfile', () => {
    // Usuario autenticado â†’ 200 con formato estÃ¡ndar de la API.
    it('devuelve el perfil y responde con success', async () => {
      const req = buildRequest();

      await controller.getMyProfile(req, res as unknown as Response);

      expect(userService.getProfile).toHaveBeenCalledWith(userId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil obtenido correctamente',
        data: user
      });
    });


    it('lanza UnauthorizedError si no hay usuario autenticado', async () => {
      const req = buildRequest({ user: undefined });

      await expect(controller.getMyProfile(req, res as unknown as Response))
        .rejects.toBeInstanceOf(UnauthorizedError);

      expect(userService.getProfile).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  // updateMyProfile: actualizar el perfil del usuario autenticado.
  describe('updateMyProfile', () => {
    const body = {
      fullName: 'Juan MartÃ­nez Actualizado',
      phone: '+5491199999999',
      avatarUrl: 'https://cdn.fixer.com/avatar.png'
    };

    // Usuario autenticado + body :200 y se delega el body al service.
    it('actualiza el perfil y responde con success', async () => {
      const req = buildRequest({ body });

      await controller.updateMyProfile(req, res as unknown as Response);

      expect(userService.updateProfile).toHaveBeenCalledWith(userId, body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: user
      });
    });

    it('lanza UnauthorizedError si no hay usuario autenticado', async () => {
      const req = buildRequest({ user: undefined, body });

      await expect(controller.updateMyProfile(req, res as unknown as Response))
        .rejects.toBeInstanceOf(UnauthorizedError);

      expect(userService.updateProfile).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
