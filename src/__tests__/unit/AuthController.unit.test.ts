import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { AuthController } from '../../modules/auth/controllers/AuthController.js';
import type { AuthService } from '../../modules/auth/services/AuthService.js';

describe('AuthController - Tests unitarios', () => {
  let authService: { register: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> };
  let controller: AuthController;
  let res: { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };

  const authResponse = { user: { id: '1' }, token: 'jwt-token' };
  const buildRequest = (body: any = {}): Request => ({ body } as Request);

  beforeEach(() => {
    authService = { register: vi.fn().mockResolvedValue(authResponse), login: vi.fn().mockResolvedValue(authResponse) };
    controller = new AuthController(authService as unknown as AuthService);
    res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  });

  describe('register', () => {
    // 201 Created
    it('responde 201 con usuario y token', async () => {
      await controller.register(buildRequest(), res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: authResponse }));
    });
  });

  describe('login', () => {
    // 200 OK
    it('responde 200 con usuario y token', async () => {
      await controller.login(buildRequest(), res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});