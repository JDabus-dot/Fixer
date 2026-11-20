import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { UserController } from '../../modules/users/controllers/UserController.js';
import type { UserService } from '../../modules/users/services/UserService.js';
import type { IAuthenticatedRequest } from '../../common/interfaces/index.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';
import { UnauthorizedError } from '../../common/errors/index.js';

describe('UserController - Tests unitarios', () => {
  const userId = 'user-1';
  const user = { id: userId, fullName: 'Juan Martínez' } as unknown as UserModel;

  let userService: { getProfile: ReturnType<typeof vi.fn> };
  let controller: UserController;
  let res: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };

  const buildRequest = (overrides: Partial<IAuthenticatedRequest> = {}): IAuthenticatedRequest =>
    ({ user: { id: userId, email: 'test@test.com', role: 'CLIENT', fullName: 'Test' }, ...overrides }) as unknown as IAuthenticatedRequest;

  beforeEach(() => {
    userService = { getProfile: vi.fn().mockResolvedValue(user) };
    controller = new UserController(userService as unknown as UserService);
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  });

// Devuelve error porque no existe el usuario
  describe('getMyProfile', () => {
    it('lanza UnauthorizedError si no hay usuario', async () => {
      const req = buildRequest({ user: undefined });
      await expect(controller.getMyProfile(req, res as unknown as Response)).rejects.toBeInstanceOf(UnauthorizedError);
    });
// Devuelve el perfil con formato { success, data }
    it('devuelve el perfil con formato { success, data }', async () => {
      await controller.getMyProfile(buildRequest(), res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: user }));
    });
  });
});