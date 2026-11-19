import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../modules/auth/services/AuthService.js';
import type { IUserRepository } from '../../modules/users/interfaces/IUserRepository.js';
import type { PasswordHasher } from '../../common/utils/PasswordHasher.js';
import type { TokenService } from '../../common/utils/TokenService.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';
import { AccountFactory } from '../../common/factories/AccountFactory.js';
import type { LoginDTO, RegisterDTO, ResetPasswordDTO, VerifyAccountDTO } from '../../modules/auth/dtos/AuthDTOs.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError
} from '../../common/errors/index.js';


describe('AuthService - Tests unitarios', () => {
  const userId = 'user-1';
  const email = 'juan.martinez@example.com';

  const user = {
    id: userId,
    fullName: 'Juan Martínez',
    email,
    phone: '+5491122334455',
    role: 'CLIENT',
    passwordHash: 'hashed-password',
    securityQuestion: '¿Ciudad natal?',
    securityAnswerHash: 'hashed-answer',
    avatarUrl: null,
    isActive: true,
    update: vi.fn().mockResolvedValue(undefined)
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
  let passwordHasher: {
    hash: ReturnType<typeof vi.fn>;
    compare: ReturnType<typeof vi.fn>;
  };
  let tokenService: {
    generateToken: ReturnType<typeof vi.fn>;
  };
  let service: AuthService;

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(user),
      findByEmailWithPassword: vi.fn().mockResolvedValue(user),
      existsByEmail: vi.fn().mockResolvedValue(false)
    };
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('hashed'),
      compare: vi.fn().mockResolvedValue(true)
    };
    tokenService = {
      generateToken: vi.fn().mockReturnValue('jwt-token')
    };
    service = new AuthService(
      userRepository as unknown as IUserRepository,
      passwordHasher as unknown as PasswordHasher,
      tokenService as unknown as TokenService
    );
  });

  // register
  describe('register', () => {
    const dto: RegisterDTO = {
  fullName: 'Juan Martínez',
  email,
  phone: '+5491122334455',
  password: 'Password123!',
  securityQuestion: '¿Ciudad natal?',
  securityAnswer: 'Bahía Blanca',
  isPro: false
};

    // Email libre: crea cuenta, hashea password y answer, genera token.
    it('registra un usuario y devuelve usuario + token', async () => {
      vi.spyOn(AccountFactory, 'createAccount').mockResolvedValue({ user } as never);

      const result = await service.register(dto);

      expect(userRepository.existsByEmail).toHaveBeenCalledWith(email);
      expect(passwordHasher.hash).toHaveBeenCalledWith(dto.password);
      expect(passwordHasher.hash).toHaveBeenCalledWith('bahía blanca');
      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user).toMatchObject({ id: userId, email, isPro: false });
    });

    // Email ya registrado: ConflictError.
    it('lanza ConflictError si el email ya está registrado', async () => {
      userRepository.existsByEmail.mockResolvedValue(true);

      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictError);
    });
  });

  // Login
  describe('login', () => {
    const dto: LoginDTO = { email, password: 'Password123!', rememberMe: false };

    // Usuario activo + password correcta: token.
    it('devuelve usuario + token con credenciales válidas', async () => {
      const result = await service.login(dto);

      expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(passwordHasher.compare).toHaveBeenCalledWith(dto.password, user.passwordHash);
      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user).toMatchObject({ id: userId, email });
    });

    // Usuario no existe: UnauthorizedError.
    it('lanza UnauthorizedError si el usuario no existe', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    // User inactivo : UnauthorizedError.
    it('lanza UnauthorizedError si el usuario está inactivo', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue({ ...user, isActive: false });

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    // password incorrecta: UnauthorizedError.
    it('lanza UnauthorizedError si la contraseña no coincide', async () => {
      passwordHasher.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('verifyAccountForRecovery', () => {
  const dto: VerifyAccountDTO = { email };

    // Email existe: devuelve email + pregunta secreta.
    it('devuelve email y pregunta secreta si la cuenta existe', async () => {
      const result = await service.verifyAccountForRecovery(dto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual({ email, securityQuestion: user.securityQuestion });
    });

    // Email no existe: NotFoundError.
    it('lanza NotFoundError si la cuenta no existe', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.verifyAccountForRecovery(dto)).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  // Cambiar contraseña
  describe('resetPassword', () => {
    const dto: ResetPasswordDTO = {
      email,
      securityAnswer: 'Bahía Blanca',
      newPassword: 'NewPassword123!'
    };

    // Respuesta correcta : actualiza hash de password.
    it('actualiza la contraseña si la respuesta secreta es correcta', async () => {
      const result = await service.resetPassword(dto);

      expect(passwordHasher.compare).toHaveBeenCalledWith('bahía blanca', user.securityAnswerHash);
      expect(passwordHasher.hash).toHaveBeenCalledWith(dto.newPassword);
      expect(user.update).toHaveBeenCalledWith({ passwordHash: 'hashed' });
      expect(result.message).toContain('restablecida');
    });

    //Usuario no existe: NotFoundError.
    it('lanza NotFoundError si la cuenta no existe', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(NotFoundError);
    });

    // Respuesta secreta incorrecta: UnauthorizedError y no actualiza.
    it('lanza UnauthorizedError si la respuesta secreta es incorrecta', async () => {
      passwordHasher.compare.mockResolvedValue(false);

      await expect(service.resetPassword(dto)).rejects.toBeInstanceOf(UnauthorizedError);
      expect(user.update).not.toHaveBeenCalled();
    });
  });
});