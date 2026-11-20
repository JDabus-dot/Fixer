import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { App } from '../../app.js';
import { TokenService } from '../../common/utils/TokenService.js';
import type { UserModel } from '../../modules/users/models/UserModel.js';

describe('UserRoutes - Integración HTTP (Supertest)', () => {
  const userId = 'user-1';
  const authPayload = { id: userId, email: 'juan.martinez@example.com', role: 'CLIENT' as const, fullName: 'Juan Martínez' };
  const user = { id: userId, fullName: 'Juan Martínez' } as unknown as UserModel;

  let userRepository: Record<string, ReturnType<typeof vi.fn>>;
  let validToken: string;
  let app: ReturnType<typeof buildApp>;

  function buildApp() {
    return new App({ userRepository: userRepository as never, professionalRepository: {} as never, reviewRepository: {} as never, serviceRequestRepository: {} as never }).app;
  }

  beforeEach(() => {
    userRepository = {
      findById: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user)
    };
    validToken = new TokenService().generateToken(authPayload);
    app = buildApp();
  });
//Se cubren los dos endopoints de usuario: GET y PATCH
  describe('GET /api/v1/users/me', () => {
    //sin token
    it('responde 401 si no se envía token', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });

    //token inválido.
    it('responde 401 si el token es inválido', async () => {
      const res = await request(app).get('/api/v1/users/me').set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(401);
    });

    // token válido.
    it('responde 200 con el perfil', async () => {
      const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${validToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id: userId });
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    //Evita datos basura en la BDD
    it('responde 422 si el body es inválido', async () => {
      const res = await request(app).patch('/api/v1/users/me').set('Authorization', `Bearer ${validToken}`).send({ fullName: 'A' });
      expect(res.status).toBe(422);
    });

    // Actualización exitosa.
    it('responde 200 con un body válido', async () => {
      const res = await request(app).patch('/api/v1/users/me').set('Authorization', `Bearer ${validToken}`).send({ fullName: 'Juan Actualizado' });
      expect(res.status).toBe(200);
    });
  });
});