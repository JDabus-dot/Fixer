import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { AuthController } from '../../modules/auth/controllers/AuthController.js';
import type { AuthService } from '../../modules/auth/services/AuthService.js';


describe('AuthController - Tests unitarios', () => {
  const authResponse = {
    user: {
      id: 'user-1',
      fullName: 'Juan Martínez',
      email: 'juan.martinez@example.com',
      phone: '+5491122334455',
      role: 'CLIENT',
      avatarUrl: null,
      isPro: false
    },
    token: 'jwt-token'
  };

  let authService: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    verifyAccountForRecovery: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };
  let controller: AuthController;
  let res: {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };

  const buildRequest = (body: Record<string, unknown> = {}): Request =>
    ({ body } as unknown as Request);

  beforeEach(() => {
    authService = {
      register: vi.fn().mockResolvedValue(authResponse),
      login: vi.fn().mockResolvedValue(authResponse),
      verifyAccountForRecovery: vi.fn().mockResolvedValue({
        email: 'juan.martinez@example.com',
        securityQuestion: '¿Ciudad natal?'
      }),
      resetPassword: vi.fn().mockResolvedValue({ message: 'Contraseña restablecida' })
    };
    controller = new AuthController(authService as unknown as AuthService);
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  // Registro
  describe('register', () => {
    // Body válido: 201 con usuario + token.
    it('responde 201 con usuario y token', async () => {
      const req = buildRequest({ email: 'juan.martinez@example.com' });

      await controller.register(req, res as unknown as Response);

      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: authResponse
      });
    });
  });

  // Login
  describe('login', () => {
    //credenciales válidas: 200 con usuario + token.
    it('responde 200 con usuario y token', async () => {
      const req = buildRequest({ email: 'juan.martinez@example.com', password: 'Password123!' });

      await controller.login(req, res as unknown as Response);

      expect(authService.login).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: authResponse
      });
    });
  });

  // Comprobar cuenta para recuperación de contraseña
  describe('verifyAccount', () => {
    // Email existe: 200 con email + pregunta secreta.
    it('responde 200 con email y pregunta secreta', async () => {
      const req = buildRequest({ email: 'juan.martinez@example.com' });

      await controller.verifyAccount(req, res as unknown as Response);

      expect(authService.verifyAccountForRecovery).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cuenta verificada correctamente',
        data: { email: 'juan.martinez@example.com', securityQuestion: '¿Ciudad natal?' }
      });
    });
  });

  //Cambiar contraseña
  describe('resetPassword', () => {
    // Respuesta correcta: 200 con mensaje.
    it('responde 200 con mensaje de confirmación', async () => {
      const req = buildRequest({
        email: 'juan.martinez@example.com',
        securityAnswer: 'Bahía Blanca',
        newPassword: 'NewPassword123!'
      });

      await controller.resetPassword(req, res as unknown as Response);

      expect(authService.resetPassword).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Contraseña restablecida',
        data: { message: 'Contraseña restablecida' }
      });
    });
  });
});