import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '../../modules/users/services/UserService.js';
import type { IUserRepository } from '../../modules/users/interfaces/IUserRepository.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';
import { NotFoundError } from '../../common/errors/index.js';

describe('UserService - Tests unitarios', () => {
  const userId = 'user-1';
  const user = { id: userId, fullName: 'Juan Martínez', email: 'juan.martinez@example.com' } as unknown as UserModel;

  let userRepository: {
    findById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let service: UserService;

  beforeEach(() => {
    userRepository = {
      findById: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user)
    };
    service = new UserService(userRepository as unknown as IUserRepository);
  });

  describe('getProfile', () => {
    // Devuelve el usuario.
    it('devuelve el usuario cuando existe', async () => {
      const result = await service.getProfile(userId);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe(user);
    });

    // Usuario no existe.
    it('lanza NotFoundError cuando el usuario no existe', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.getProfile('missing')).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('updateProfile', () => {
    it('lanza NotFoundError y NO actualiza si no existe', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.updateProfile('missing', { fullName: 'Test' })).rejects.toBeInstanceOf(NotFoundError);
      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
});