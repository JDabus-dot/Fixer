import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserService } from '../../modules/users/services/UserService.js';
import type { IUserRepository } from '../../modules/users/interfaces/IUserRepository.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';
import { NotFoundError } from '../../common/errors/index.js';

describe('UserService - Tests unitarios', () => {
  const userId = 'user-1';

  const user = {
    id: userId,
    fullName: 'Juan MartÃ­nez',
    email: 'juan.martinez@example.com',
    phone: '+5491122334455',
    role: 'CLIENT',
    securityQuestion: 'Â¿Ciudad natal?',
    avatarUrl: null,
    termsAccepted: true,
    isActive: true
  } as unknown as UserModel;

  let userRepository: {
    findById: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    findByEmail: ReturnType<typeof vi.fn>;
    findByEmailWithPassword: ReturnType<typeof vi.fn>;
    existsByEmail: ReturnType<typeof vi.fn>;
  };

  let service: UserService;

  beforeEach(() => {
    userRepository = {
      findById: vi.fn().mockResolvedValue(user),
      findAll: vi.fn().mockResolvedValue([user]),
      update: vi.fn().mockResolvedValue(user),
      create: vi.fn().mockResolvedValue(user),
      delete: vi.fn().mockResolvedValue(true),
      findByEmail: vi.fn().mockResolvedValue(user),
      findByEmailWithPassword: vi.fn().mockResolvedValue(user),
      existsByEmail: vi.fn().mockResolvedValue(true)
    };

    service = new UserService(userRepository as unknown as IUserRepository);
  });

  // getProfile: obtener el perfil de un usuario por ID.
  describe('getProfile', () => {
    // El usuario existe: se devuelve el usuario consultado.
    it('devuelve el usuario cuando existe', async () => {
      const result = await service.getProfile(userId);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.findById).toHaveBeenCalledTimes(1);
      expect(result).toBe(user);
    });

    // El usuario no existe: NotFoundError (traducido a 404).
    it('lanza NotFoundError cuando el usuario no existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile('missing-user'))
        .rejects.toBeInstanceOf(NotFoundError);

      expect(userRepository.findById).toHaveBeenCalledWith('missing-user');
    });
  });

  // updateProfile: actualizar el perfil de un usuario existente.
  describe('updateProfile', () => {
    const dto = {
      fullName: 'Juan MartÃ­nez Actualizado',
      phone: '+5491199999999',
      avatarUrl: 'https://cdn.fixer.com/avatar.png'
    };

    // El usuario existe: se actualiza y se devuelve el actualizado.
    it('actualiza y devuelve el usuario cuando existe', async () => {
      const updatedUser = { ...user, ...dto } as unknown as UserModel;
      userRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, dto);

      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalledWith(userId, dto);
      expect(userRepository.update).toHaveBeenCalledTimes(1);
      expect(result).toBe(updatedUser);
    });


    it('pasa el DTO tal cual al repository.update', async () => {
      await service.updateProfile(userId, dto);

      expect(userRepository.update).toHaveBeenCalledWith(userId, dto);
    });

    // Usuario inexistente : no se actualiza.
    it('lanza NotFoundError cuando el usuario no existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.updateProfile('missing-user', dto))
        .rejects.toBeInstanceOf(NotFoundError);

      expect(userRepository.update).not.toHaveBeenCalled();
    });
  });
});
