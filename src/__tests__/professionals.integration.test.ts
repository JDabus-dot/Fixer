import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { AddressInfo } from 'node:net';
import { ProfessionalRouter } from '../modules/professionals/routes/ProfessionalRouter.js';
import { ProfessionalController } from '../modules/professionals/controllers/ProfessionalController.js';
import { ProfessionalService } from '../modules/professionals/services/ProfessionalService.js';
import {
  IProfessionalRepository,
  IProfessionalSearchFilters,
  IProfessionalSearchResult
} from '../modules/professionals/interfaces/IProfessionalRepository.js';
import { ProfessionalProfileModel } from '../modules/professionals/models/ProfessionalProfileModel.js';
import { ProfessionalProfileBuilder } from '../modules/professionals/builders/ProfessionalProfileBuilder.js';
import { AuthMiddleware } from '../common/middlewares/AuthMiddleware.js';
import { ErrorHandlerMiddleware } from '../common/middlewares/ErrorHandlerMiddleware.js';
import { TokenService } from '../common/utils/TokenService.js';
import { ReviewService } from '../modules/reviews/services/ReviewService.js';
import { IReviewRepository } from '../modules/reviews/interfaces/IReviewRepository.js';
import { ReviewModel } from '../modules/reviews/models/ReviewModel.js';
import { BadRequestError } from '../common/errors/index.js';

interface IInMemoryReview {
  id: string;
  clientId: string;
  professionalId: string;
  rating: number;
  serviceType: string;
  comment: string;
  isVerifiedVisit: boolean;
  createdAt: Date;
}

interface IInMemoryProfileRecord {
  id: string;
  userId: string;
  tradeCategory: string;
  headline: string;
  bio: string;
  licenseNumber: string;
  experienceYears: number;
  city: string;
  zone: string;
  address: string;
  coverageRadiusKm: number;
  responseTime: string;
  isEmergencyAvailable: boolean;
  isVerified: boolean;
  badgeLevel: string;
  ratingAverage: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  specialties: string[];
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    avatarUrl: string | null;
    role: 'PROFESSIONAL';
  };
}

/**
 * Repositorio en memoria con estado real para pruebas de integración sin PostgreSQL externo.
 */
class InMemoryProfessionalRepository implements IProfessionalRepository {
  public profiles: IInMemoryProfileRecord[] = [];
  public reviews: IInMemoryReview[] = [];

  public async findById(id: string): Promise<ProfessionalProfileModel | null> {
    const found = this.profiles.find((p) => p.id === id);
    return found ? ({ ...found } as unknown as ProfessionalProfileModel) : null;
  }

  public async findByIdWithDetails(id: string): Promise<ProfessionalProfileModel | null> {
    const found = this.profiles.find((p) => p.id === id);
    if (!found) return null;

    const profileReviews = this.reviews
      .filter((r) => r.professionalId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      ...found,
      reviews: profileReviews
    } as unknown as ProfessionalProfileModel;
  }

  public async findByUserId(userId: string): Promise<ProfessionalProfileModel | null> {
    const found = this.profiles.find((p) => p.userId === userId);
    return found ? ({ ...found } as unknown as ProfessionalProfileModel) : null;
  }

  public async findAll(): Promise<ProfessionalProfileModel[]> {
    return this.profiles as unknown as ProfessionalProfileModel[];
  }

  public async search(filters: IProfessionalSearchFilters): Promise<IProfessionalSearchResult> {
    let filtered = [...this.profiles];

    if (filters.query && filters.query.trim() !== '') {
      const q = filters.query.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.user.fullName.toLowerCase().includes(q) ||
          p.headline.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q) ||
          p.tradeCategory.toLowerCase().includes(q) ||
          p.licenseNumber.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category.trim() !== '') {
      const cat = filters.category.trim().toLowerCase();
      filtered = filtered.filter((p) => p.tradeCategory.toLowerCase().includes(cat));
    }

    if (filters.zone && filters.zone.trim() !== '') {
      const z = filters.zone.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.zone.toLowerCase().includes(z) ||
          p.city.toLowerCase().includes(z) ||
          p.address.toLowerCase().includes(z)
      );
    } else if (filters.city && filters.city.trim() !== '') {
      const c = filters.city.trim().toLowerCase();
      filtered = filtered.filter((p) => p.city.toLowerCase().includes(c));
    }

    if (filters.isVerified !== undefined) {
      filtered = filtered.filter((p) => p.isVerified === filters.isVerified);
    }

    if (filters.isEmergencyAvailable !== undefined) {
      filtered = filtered.filter((p) => p.isEmergencyAvailable === filters.isEmergencyAvailable);
    }

    if (filters.minRating !== undefined) {
      filtered = filtered.filter((p) => p.ratingAverage >= filters.minRating!);
    }

    filtered.sort((a, b) => {
      if (filters.sortBy === 'urgency') {
        if (a.isEmergencyAvailable !== b.isEmergencyAvailable) {
          return Number(b.isEmergencyAvailable) - Number(a.isEmergencyAvailable);
        }
        return b.ratingAverage - a.ratingAverage;
      }
      if (filters.sortBy === 'experience') {
        return b.experienceYears - a.experienceYears;
      }
      if (b.ratingAverage !== a.ratingAverage) {
        return b.ratingAverage - a.ratingAverage;
      }
      return b.totalReviews - a.totalReviews;
    });

    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.max(Number(filters.limit) || 12, 1);
    const offset = (page - 1) * limit;
    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      professionals: paginated as unknown as ProfessionalProfileModel[],
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit
    };
  }

  public async recalculateRatings(professionalId: string): Promise<void> {
    const profile = this.profiles.find((p) => p.id === professionalId);
    if (!profile) return;

    const profReviews = this.reviews.filter((r) => r.professionalId === professionalId);
    const totalReviews = profReviews.length;

    if (totalReviews === 0) {
      profile.ratingAverage = 5.0;
      profile.totalReviews = 0;
      profile.fiveStarCount = 0;
      profile.fourStarCount = 0;
      profile.threeStarCount = 0;
      profile.twoStarCount = 0;
      profile.oneStarCount = 0;
      return;
    }

    let sum = 0;
    let five = 0;
    let four = 0;
    let three = 0;
    let two = 0;
    let one = 0;

    for (const r of profReviews) {
      sum += r.rating;
      if (r.rating === 5) five++;
      else if (r.rating === 4) four++;
      else if (r.rating === 3) three++;
      else if (r.rating === 2) two++;
      else if (r.rating === 1) one++;
    }

    profile.ratingAverage = Number((sum / totalReviews).toFixed(2));
    profile.totalReviews = totalReviews;
    profile.fiveStarCount = five;
    profile.fourStarCount = four;
    profile.threeStarCount = three;
    profile.twoStarCount = two;
    profile.oneStarCount = one;
  }

  public async create(item: Partial<ProfessionalProfileModel>): Promise<ProfessionalProfileModel> {
    const created = item as unknown as IInMemoryProfileRecord;
    this.profiles.push(created);
    return created as unknown as ProfessionalProfileModel;
  }

  public async update(id: string, item: Partial<ProfessionalProfileModel>): Promise<ProfessionalProfileModel | null> {
    const idx = this.profiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.profiles[idx] = { ...this.profiles[idx], ...(item as Partial<IInMemoryProfileRecord>) };
    return { ...this.profiles[idx] } as unknown as ProfessionalProfileModel;
  }

  public async delete(id: string): Promise<boolean> {
    const beforeLen = this.profiles.length;
    this.profiles = this.profiles.filter((p) => p.id !== id);
    return this.profiles.length < beforeLen;
  }
}

describe('Integración — Módulo de Prestadores (/api/v1/professionals)', () => {
  let server: http.Server;
  let baseUrl: string;
  let repository: InMemoryProfessionalRepository;
  let tokenService: TokenService;

  before(async () => {
    repository = new InMemoryProfessionalRepository();
    tokenService = new TokenService();

    const authMiddleware = new AuthMiddleware(tokenService);
    const professionalService = new ProfessionalService(repository);
    const professionalController = new ProfessionalController(professionalService);
    const professionalRouter = new ProfessionalRouter(professionalController, authMiddleware);

    const app = express();
    app.use(express.json());
    app.use('/api/v1/professionals', professionalRouter.getRouter());
    app.use(ErrorHandlerMiddleware.handle);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}/api/v1/professionals`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    const carlosData = new ProfessionalProfileBuilder('user-pro-1')
      .withTrade('plomeria', 'Plomería Integral & Gasista', 'Matrícula 48.912', 14)
      .withBio('Instalador matriculado en obras residenciales y consorcios.')
      .withLocation('Bahía Blanca', 'Palermo y Zona Norte', 'San Martín 228', 25)
      .withEmergencyAvailability('< 20 min')
      .withReputation(4.9, 2, 'Fixer Diamond', 2, 0, 0, 0, 0)
      .withSpecialties(['Termofusión', 'Calderas'])
      .buildData();

    const robertoData = new ProfessionalProfileBuilder('user-pro-2')
      .withTrade('electricidad', 'Electricista COPIME', 'Matrícula 29.841', 11)
      .withBio('Tableros certificados y automatizaciones domiciliarias.')
      .withLocation('CABA', 'Belgrano', 'Av. Cabildo 1420', 20)
      .withEmergencyAvailability('< 15 min')
      .withReputation(4.8, 1, 'Fixer Pro', 1, 0, 0, 0, 0)
      .withSpecialties(['Tableros', 'Trifásica'])
      .buildData();

    const diegoData = new ProfessionalProfileBuilder('user-pro-3')
      .withTrade('plomeria', 'Plomería Residencial', 'En trámite', 3)
      .withBio('Reparaciones generales de grifería y cañerías en hogar.')
      .withLocation('CABA', 'Caballito', 'Rivadavia 5100', 10)
      .setVerified(false)
      .buildData();

    repository.profiles = [
      {
        ...(carlosData as unknown as IInMemoryProfileRecord),
        id: 'prof-carlos',
        user: {
          id: 'user-pro-1',
          fullName: 'Carlos Mendoza',
          email: 'carlos@fixer.com',
          phone: '+54 9 11 4455-8899',
          avatarUrl: null,
          role: 'PROFESSIONAL'
        }
      },
      {
        ...(robertoData as unknown as IInMemoryProfileRecord),
        id: 'prof-roberto',
        user: {
          id: 'user-pro-2',
          fullName: 'Roberto Gómez',
          email: 'roberto@fixer.com',
          phone: '+54 9 11 5566-7788',
          avatarUrl: null,
          role: 'PROFESSIONAL'
        }
      },
      {
        ...(diegoData as unknown as IInMemoryProfileRecord),
        id: 'prof-diego',
        user: {
          id: 'user-pro-3',
          fullName: 'Diego Pérez',
          email: 'diego@fixer.com',
          phone: '+54 9 11 1122-3344',
          avatarUrl: null,
          role: 'PROFESSIONAL'
        }
      }
    ];

    repository.reviews = [
      {
        id: 'rev-1',
        clientId: 'client-1',
        professionalId: 'prof-carlos',
        rating: 5,
        serviceType: 'Detección térmica',
        comment: 'Excelente servicio puntual.',
        isVerifiedVisit: true,
        createdAt: new Date('2026-01-10T10:00:00Z')
      },
      {
        id: 'rev-2',
        clientId: 'client-2',
        professionalId: 'prof-carlos',
        rating: 5,
        serviceType: 'Caldera dual',
        comment: 'Muy prolijo y claro con el presupuesto.',
        isVerifiedVisit: true,
        createdAt: new Date('2026-01-12T10:00:00Z')
      }
    ];
  });

  it('GET / permite búsqueda pública filtrada con coerción de query params, ordenamiento y paginación', async () => {
    const res = await fetch(
      `${baseUrl}?category=plomeria&isVerified=true&isEmergencyAvailable=true&minRating=4.8&sortBy=experience&page=1&limit=1`
    );
    const body = (await res.json()) as {
      success: boolean;
      data: IInMemoryProfileRecord[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    };

    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].id, 'prof-carlos');
    assert.deepEqual(body.meta, { page: 1, limit: 1, total: 1, totalPages: 1 });
  });

  it('GET / responde 422 estructurado cuando ValidationMiddleware detecta query params inválidos', async () => {
    const res = await fetch(`${baseUrl}?sortBy=invalido`);
    const body = (await res.json()) as {
      success: boolean;
      message: string;
      error: { details: Array<{ field: string; message: string }> };
    };

    assert.equal(res.status, 422);
    assert.equal(body.success, false);
    assert.equal(body.error.details[0].field, 'sortBy');
  });

  it('GET /:id devuelve el detalle completo con reseñas y responde 404 si el prestador no existe', async () => {
    const okRes = await fetch(`${baseUrl}/prof-carlos`);
    const okBody = (await okRes.json()) as {
      success: boolean;
      data: IInMemoryProfileRecord & { reviews: IInMemoryReview[] };
    };

    assert.equal(okRes.status, 200);
    assert.equal(okBody.success, true);
    assert.equal(okBody.data.user.fullName, 'Carlos Mendoza');
    assert.equal(okBody.data.reviews.length, 2);
    assert.equal(okBody.data.reviews[0].id, 'rev-2');

    const notFoundRes = await fetch(`${baseUrl}/id-inexistente`);
    const notFoundBody = (await notFoundRes.json()) as { success: boolean; message: string };

    assert.equal(notFoundRes.status, 404);
    assert.equal(notFoundBody.success, false);
    assert.equal(notFoundBody.message, 'Profesional no encontrado');
  });

  it('GET /me aplica autenticación JWT, RBAC (bloquea CLIENT, permite PROFESSIONAL/ADMIN) y precedencia sobre /:id', async () => {
    // 1. Sin token -> 401
    const noAuthRes = await fetch(`${baseUrl}/me`);
    assert.equal(noAuthRes.status, 401);

    // 2. Token inválido -> 401
    const badTokenRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: 'Bearer token.invalido.jwt' }
    });
    assert.equal(badTokenRes.status, 401);

    // 3. Rol CLIENT -> 403 Forbidden
    const clientToken = tokenService.generateToken({
      id: 'client-1',
      email: 'cliente@ejemplo.com',
      role: 'CLIENT',
      fullName: 'Javier Rossi'
    });
    const forbiddenRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    assert.equal(forbiddenRes.status, 403);

    // 4. Rol PROFESSIONAL -> 200 y resuelve /me sin caer en /:id
    const proToken = tokenService.generateToken({
      id: 'user-pro-1',
      email: 'carlos@fixer.com',
      role: 'PROFESSIONAL',
      fullName: 'Carlos Mendoza'
    });
    const okRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${proToken}` }
    });
    const okBody = (await okRes.json()) as { success: boolean; data: IInMemoryProfileRecord };

    assert.equal(okRes.status, 200);
    assert.equal(okBody.success, true);
    assert.equal(okBody.data.id, 'prof-carlos');
    assert.equal(okBody.data.userId, 'user-pro-1');

    // 5. Rol ADMIN autenticado sin perfil propio -> supera RBAC y llega al servicio devolviendo 404
    const adminToken = tokenService.generateToken({
      id: 'admin-1',
      email: 'admin@fixer.com',
      role: 'ADMIN',
      fullName: 'Admin Fixer'
    });
    const adminRes = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(adminRes.status, 404);
  });

  it('PUT /me valida el body, actualiza el perfil autenticado y refleja cambios en GET /:id preservando campos protegidos', async () => {
    const proToken = tokenService.generateToken({
      id: 'user-pro-2',
      email: 'roberto@fixer.com',
      role: 'PROFESSIONAL',
      fullName: 'Roberto Gómez'
    });

    // Body inválido -> 422 y no muta el perfil
    const invalidRes = await fetch(`${baseUrl}/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proToken}`
      },
      body: JSON.stringify({ headline: 'abc', coverageRadiusKm: 0 })
    });
    assert.equal(invalidRes.status, 422);

    // Actualización válida -> 200
    const updatePayload = {
      headline: 'Electricista Industrial y Domiciliario Matriculado',
      zone: 'Palermo y Colegiales',
      coverageRadiusKm: 35,
      isEmergencyAvailable: false,
      specialties: ['Tableros seccionales', 'Energía solar']
    };
    const updateRes = await fetch(`${baseUrl}/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proToken}`
      },
      body: JSON.stringify(updatePayload)
    });
    const updateBody = (await updateRes.json()) as { success: boolean; data: IInMemoryProfileRecord };

    assert.equal(updateRes.status, 200);
    assert.equal(updateBody.success, true);
    assert.equal(updateBody.data.headline, updatePayload.headline);

    // Verificación de persistencia vía lectura pública GET /:id
    const detailRes = await fetch(`${baseUrl}/prof-roberto`);
    const detailBody = (await detailRes.json()) as { success: boolean; data: IInMemoryProfileRecord };

    assert.equal(detailRes.status, 200);
    assert.equal(detailBody.data.headline, updatePayload.headline);
    assert.equal(detailBody.data.zone, 'Palermo y Colegiales');
    assert.equal(detailBody.data.coverageRadiusKm, 35);
    assert.equal(detailBody.data.isEmergencyAvailable, false);
    assert.deepEqual(detailBody.data.specialties, ['Tableros seccionales', 'Energía solar']);
    // Campos de reputación/verificación no se ven alterados
    assert.equal(detailBody.data.isVerified, true);
    assert.equal(detailBody.data.ratingAverage, 4.8);
  });

  it('Integración Prestadores <-> Reseñas: publicar reseña recalcula rating y desglose visibles en GET /:id, y bloquea auto-reseña', async () => {
    const reviewRepoStub: IReviewRepository = {
      findById: async () => null,
      findAll: async () => [],
      findByProfessionalId: async (profId) =>
        repository.reviews.filter((r) => r.professionalId === profId) as unknown as ReviewModel[],
      findByClientId: async (clientId) =>
        repository.reviews.filter((r) => r.clientId === clientId) as unknown as ReviewModel[],
      hasClientReviewed: async (clientId, profId) =>
        repository.reviews.some((r) => r.clientId === clientId && r.professionalId === profId),
      create: async (item) => {
        const created: IInMemoryReview = {
          id: `rev-${repository.reviews.length + 1}`,
          clientId: item.clientId!,
          professionalId: item.professionalId!,
          rating: item.rating!,
          serviceType: item.serviceType!,
          comment: item.comment!,
          isVerifiedVisit: Boolean(item.isVerifiedVisit),
          createdAt: new Date()
        };
        repository.reviews.push(created);
        return created as unknown as ReviewModel;
      },
      update: async () => null,
      delete: async () => false
    };

    const reviewService = new ReviewService(reviewRepoStub, repository);

    // 1. El propio prestador no puede auto-calificarse
    await assert.rejects(
      () =>
        reviewService.createReview('user-pro-1', {
          professionalId: 'prof-carlos',
          rating: 5,
          serviceType: 'Plomería',
          comment: 'Auto-reseña inválida de prueba',
          isVerifiedVisit: true
        }),
      (err: unknown) => err instanceof BadRequestError && err.statusCode === 400
    );

    // 2. Un cliente deja una reseña de 2 estrellas -> promedio pasa de (5+5)/2=5.0 a (5+5+2)/3=4.0
    await reviewService.createReview('client-99', {
      professionalId: 'prof-carlos',
      rating: 2,
      serviceType: 'Reparación de cañería',
      comment: 'Demoró más de lo acordado en llegar al domicilio.',
      isVerifiedVisit: true
    });

    const detailRes = await fetch(`${baseUrl}/prof-carlos`);
    const detailBody = (await detailRes.json()) as {
      success: boolean;
      data: IInMemoryProfileRecord & { reviews: IInMemoryReview[] };
    };

    assert.equal(detailRes.status, 200);
    assert.equal(detailBody.data.totalReviews, 3);
    assert.equal(detailBody.data.ratingAverage, 4);
    assert.equal(detailBody.data.fiveStarCount, 2);
    assert.equal(detailBody.data.twoStarCount, 1);
    assert.equal(detailBody.data.reviews.length, 3);
  });
});
