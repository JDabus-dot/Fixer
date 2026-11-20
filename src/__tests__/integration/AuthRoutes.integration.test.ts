import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { App } from '../../app.js';
import { PasswordHasher } from '../../common/utils/PasswordHasher.js';

describe('AuthRoutes - Integración HTTP (Supertest)', () => {
  const email = 'juan.martinez@example.com';
  const user = { id: 'user-1', email, isActive: true, passwordHash: 'hashed', securityAnswerHash: 'hashed' };

  let userRepository: Record<string, ReturnType<typeof vi.fn>>;
  let app: ReturnType<typeof buildApp>;

  function buildApp() {
    return new App({ userRepository: userRepository as never, professionalRepository: {} as never, reviewRepository: {} as never, serviceRequestRepository: {} as never }).app;
  }

  beforeEach(() => {
    vi.spyOn(PasswordHasher.prototype, 'compare').mockResolvedValue(true);

    userRepository = {
      existsByEmail: vi.fn().mockResolvedValue(false),
      findByEmail: vi.fn().mockResolvedValue(user),
      findByEmailWithPassword: vi.fn().mockResolvedValue(user)
    };
    app = buildApp();
  });

  describe('POST /api/v1/auth/register', () => {
    // Registro con credenciales inválidos
    it('responde 422 si el body no cumple el esquema', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'no-es-email' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    // Login con credenciales válidas
    it('responde 200 con token si las credenciales son vÃ¡lidas', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('token');
    });

    // Login  con credenciales inválidas
    it('responde 401 si las credenciales son invÃ¡lidas', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);
      const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'Wrong' });
      expect(res.status).toBe(401);
    });
  });
});
