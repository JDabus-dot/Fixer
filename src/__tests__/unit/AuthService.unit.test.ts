import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../modules/auth/services/AuthService.js';
import type { IUserRepository } from '../../modules/users/interfaces/IUserRepository.js';
import type { PasswordHasher } from '../../common/utils/PasswordHasher.js';
import type { TokenService } from '../../common/utils/TokenService.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../common/errors/index.js';

describe('AuthService - Tests unitarios', () => {
  const email = 'juan.martinez@example.com';
  const user = { id: 'user-1', email, isActive: true, passwordHash: 'hashed-pass', securityAnswerHash: 'hashed-ans' } as unknown as UserModel;

  let userRepository: { findByEmail: ReturnType<typeof vi.fn>; findByEmailWithPassword: ReturnType<typeof vi.fn>; existsByEmail: ReturnType<typeof vi.fn> };
  let passwordHasher: { compare: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn().mockResolvedValue(user),
      findByEmailWithPassword: vi.fn().mockResolvedValue(user),
      existsByEmail: vi.fn().mockResolvedValue(false)
    };
    passwordHasher = { compare: vi.fn().mockResolvedValue(true) };
    service = new AuthService(userRepository as unknown as IUserRepository, passwordHasher as unknown as PasswordHasher, { generateToken: vi.fn().mockReturnValue('token') } as unknown as TokenService);
  });

  describe('register', () => {
    // Email duplicado.
    it('lanza ConflictError si el email ya existe', async () => {
      userRepository.existsByEmail.mockResolvedValue(true);
      await expect(service.register({ email } as any)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    // Credenciales válidas.
    it('devuelve token con credenciales válidas', async () => {
      const result = await service.login({ email, password: 'Test123!', rememberMe: false });
      expect(result).toHaveProperty('token', 'token');
    });

    //cuenta inactiva
    it('lanza UnauthorizedError si el usuario está inactivo', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue({ ...user, isActive: false });
      await expect(service.login({ email, password: 'Test123!', rememberMe: false })).rejects.toBeInstanceOf(UnauthorizedError);
    });

    //contraseña incorrecta.
    it('lanza UnauthorizedError si la contraseña es incorrecta', async () => {
      passwordHasher.compare.mockResolvedValue(false);
      await expect(service.login({ email, password: 'Wrong', rememberMe: false })).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('verifyAccountForRecovery', () => {
    // Email no registrado.
    it('lanza NotFoundError si el email no existe', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.verifyAccountForRecovery({ email })).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('resetPassword', () => {
    // respuesta secreta incorrecta.
    it('lanza UnauthorizedError si la respuesta es incorrecta', async () => {
      passwordHasher.compare.mockResolvedValue(false);
      await expect(service.resetPassword({ email, securityAnswer: 'Wrong', newPassword: 'New123!' })).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});