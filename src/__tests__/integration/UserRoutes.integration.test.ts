import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { App } from '../../app.js';
import { TokenService } from '../../common/utils/TokenService.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';
import type { IAuthUserPayload } from '../../common/interfaces/index.js';


describe('UserRoutes - IntegraciÃ³n HTTP (Supertest)', () => {
  const userId = 'user-1';
  const authPayload: IAuthUserPayload = {
    id: userId,
    email: 'juan.martinez@example.com',
    role: 'CLIENT',
    fullName: 'Juan MartÃ­nez'
  };

  const user = {
    id: userId,
    fullName: 'Juan MartÃ­nez',
    email: 'juan.martinez@example.com',
    phone: '+5491122334455',
    role: 'CLIENT'
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

  let tokenService: TokenService;
  let validToken: string;
  let app: ReturnType<typeof buildApp>;

  function buildApp() {
    const instance = new App({
      userRepository: userRepository as never,
      professionalRepository: {} as never,
      reviewRepository: {} as never,
      serviceRequestRepository: {} as never
    });
    return instance.app;
  }

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

    tokenService = new TokenService();
    validToken = tokenService.generateToken(authPayload);

    app = buildApp();
  });

  // GET /api/v1/users : devolver el perfil del usuario autenticado.
  describe('GET /api/v1/users/me', () => {

    it('responde 401 si no se envÃ­a token', async () => {
      const res = await request(app).get('/api/v1/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(userRepository.findById).not.toHaveBeenCalled();
    });


    it('responde 401 si el token es invÃ¡lido', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(res.status).toBe(401);
      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    //token vÃ¡lido: 200 con formato estÃ¡ndar de la API.
    it('responde 200 con el perfil cuando el token es vÃ¡lido', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Perfil obtenido correctamente',
        data: expect.objectContaining({ id: userId, fullName: 'Juan MartÃ­nez' })
      });
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });
  });

  // PATCH /api/v1/users: actualizar el perfil del usuario autenticado (con validaciÃ³n Zod).
  describe('PATCH /api/v1/users/me', () => {

    it('responde 401 si no se envÃ­a token', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .send({ fullName: 'Nuevo Nombre' });

      expect(res.status).toBe(401);
      expect(userRepository.update).not.toHaveBeenCalled();
    });


    it('responde 422 si el body no cumple el esquema Zod', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ fullName: 'A' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    // Token + body vÃ¡lido
    it('responde 200 y actualiza el perfil con un body vÃ¡lido', async () => {
      const body = {
        fullName: 'Juan MartÃ­nez Actualizado',
        phone: '+5491199999999',
        avatarUrl: 'https://cdn.fixer.com/avatar.png'
      };

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send(body);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: expect.objectContaining({ id: userId })
      });
      expect(userRepository.update).toHaveBeenCalledWith(userId, body);
    });
  });
});
