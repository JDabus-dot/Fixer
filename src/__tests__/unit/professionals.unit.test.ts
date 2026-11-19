import { afterEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import { Op } from 'sequelize';
import {
  SearchProfessionalsSchema,
  UpdateProfessionalProfileSchema
} from '../../modules/professionals/dtos/ProfessionalDTOs.js';
import { ProfessionalProfileBuilder } from '../../modules/professionals/builders/ProfessionalProfileBuilder.js';
import { ProfessionalSearchQueryBuilder } from '../../modules/professionals/builders/ProfessionalSearchQueryBuilder.js';
import { ProfessionalService } from '../../modules/professionals/services/ProfessionalService.js';
import { ProfessionalRepository } from '../../modules/professionals/repositories/ProfessionalRepository.js';
import { ProfessionalController } from '../../modules/professionals/controllers/ProfessionalController.js';
import {
  IProfessionalRepository,
  IProfessionalSearchFilters,
  IProfessionalSearchResult
} from '../../modules/professionals/interfaces/IProfessionalRepository.js';
import { ProfessionalProfileModel } from '../../modules/professionals/models/ProfessionalProfileModel.js';
import { ReviewModel } from '../../modules/reviews/models/ReviewModel.js';
import { NotFoundError, UnauthorizedError } from '../../common/errors/index.js';
import { IAuthenticatedRequest } from '../../common/interfaces/index.js';

function createFakeProfile(overrides: Partial<ProfessionalProfileModel> = {}): ProfessionalProfileModel {
  return {
    id: 'prof-1',
    userId: 'user-1',
    tradeCategory: 'plomeria',
    headline: 'Plomero Matriculado de 1ª Categoría',
    bio: 'Más de 10 años realizando instalaciones sanitarias y de gas.',
    licenseNumber: 'MAT-48912',
    experienceYears: 10,
    city: 'Bahía Blanca',
    zone: 'Palermo',
    address: 'San Martín 228',
    coverageRadiusKm: 25,
    responseTime: '< 20 min',
    isEmergencyAvailable: true,
    isVerified: true,
    badgeLevel: 'Fixer Diamond',
    ratingAverage: 4.9,
    totalReviews: 12,
    fiveStarCount: 11,
    fourStarCount: 1,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
    specialties: ['Termofusión', 'Calderas'],
    ...overrides
  } as ProfessionalProfileModel;
}

function createRepositoryStub(overrides: Partial<IProfessionalRepository> = {}): IProfessionalRepository {
  return {
    findById: async () => null,
    findByIdWithDetails: async () => null,
    findByUserId: async () => null,
    findAll: async () => [],
    search: async () => ({ professionals: [], total: 0, totalPages: 0, page: 1, limit: 12 }),
    recalculateRatings: async () => undefined,
    create: async (item) => item as ProfessionalProfileModel,
    update: async () => null,
    delete: async () => false,
    ...overrides
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Unitario — DTOs de Prestadores (Zod)', () => {
  it('SearchProfessionalsSchema transforma query strings a booleanos, números, defaults y límites mínimos', () => {
    const parsed = SearchProfessionalsSchema.parse({
      query: 'gasista',
      isVerified: 'true',
      isEmergencyAvailable: 'false',
      minRating: '4.5',
      page: '0',
      limit: '-5'
    });

    assert.equal(parsed.query, 'gasista');
    assert.equal(parsed.isVerified, true);
    assert.equal(parsed.isEmergencyAvailable, false);
    assert.equal(parsed.minRating, 4.5);
    assert.equal(parsed.sortBy, 'rating');
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 1);
  });

  it('SearchProfessionalsSchema rechaza criterios de ordenamiento fuera del contrato', () => {
    const result = SearchProfessionalsSchema.safeParse({ sortBy: 'price-low' });
    assert.equal(result.success, false);
  });

  it('UpdateProfessionalProfileSchema valida reglas de longitud y rangos numéricos en actualizaciones parciales', () => {
    const valid = UpdateProfessionalProfileSchema.safeParse({
      headline: 'Electricista matriculado COPIME',
      experienceYears: 0,
      coverageRadiusKm: 15,
      specialties: ['Tableros', 'Trifásica']
    });
    assert.equal(valid.success, true);

    const invalid = UpdateProfessionalProfileSchema.safeParse({
      tradeCategory: 'a',
      headline: 'abc',
      bio: 'corta',
      experienceYears: -1,
      coverageRadiusKm: 0
    });
    assert.equal(invalid.success, false);
    if (!invalid.success) {
      const fields = invalid.error.errors.map((err) => err.path.join('.'));
      assert.deepEqual(
        fields.sort(),
        ['bio', 'coverageRadiusKm', 'experienceYears', 'headline', 'tradeCategory']
      );
    }
  });
});

describe('Unitario — Builders de Prestadores (casos borde y combinación de filtros)', () => {
  it('ProfessionalSearchQueryBuilder ignora filtros vacíos o con solo espacios', () => {
    const options = new ProfessionalSearchQueryBuilder()
      .filterByText('   ')
      .filterByCategory('')
      .filterByZone('  ', '   ')
      .build();

    assert.deepEqual(options.where, {});
  });

  it('ProfessionalSearchQueryBuilder prioriza zone sobre city y usa city cuando zone no está presente', () => {
    const withZone = new ProfessionalSearchQueryBuilder()
      .filterByZone('Palermo', 'Bahía Blanca')
      .build().where as Record<string | symbol, unknown>;

    assert.ok(withZone[Op.or]);
    assert.equal(withZone.city, undefined);

    const onlyCity = new ProfessionalSearchQueryBuilder()
      .filterByZone(undefined, 'Córdoba')
      .build().where as Record<string | symbol, unknown>;

    assert.equal(onlyCity[Op.or], undefined);
    assert.deepEqual(onlyCity.city, { [Op.iLike]: '%Córdoba%' });
  });

  it('ProfessionalSearchQueryBuilder combina filterByZone y filterByText mediante Op.and sin perder condiciones', () => {
    const where = new ProfessionalSearchQueryBuilder()
      .filterByZone('Belgrano')
      .filterByText('Mendoza')
      .build().where as Record<string | symbol, unknown>;

    assert.equal(where[Op.or], undefined);
    assert.ok(Array.isArray(where[Op.and]));
    assert.equal((where[Op.and] as unknown[]).length, 2);
  });

  it('ProfessionalSearchQueryBuilder respeta valores falsy explícitos (false y 0) y clampa paginación inválida', () => {
    const builder = new ProfessionalSearchQueryBuilder()
      .onlyVerified(false)
      .onlyAvailableToday(false)
      .filterByMinRating(0)
      .paginate(0, -3);

    const where = builder.build().where as Record<string, unknown>;
    const pagination = builder.getPagination();

    assert.equal(where.isVerified, false);
    assert.equal(where.isEmergencyAvailable, false);
    assert.deepEqual(where.ratingAverage, { [Op.gte]: 0 });
    assert.deepEqual(pagination, { page: 1, limit: 1, offset: 0 });
  });

  it('ProfessionalProfileBuilder permite desglose parcial de estrellas y delegación limpia a build()', async () => {
    const createdModel = createFakeProfile({ userId: 'u-99' });
    const createMock = vi
      .spyOn(ProfessionalProfileModel, 'create')
      .mockImplementation((async () => createdModel) as never);

    const result = await new ProfessionalProfileBuilder()
      .withUserId('u-99')
      .withReviewBreakdown({ five: 10, four: 2, one: 1 })
      .setVerified(true)
      .withBadge('Fixer Pro')
      .build();

    assert.equal(result, createdModel);
    assert.equal(createMock.mock.calls.length, 1);
    const payload = createMock.mock.calls[0][0] as unknown as Record<string, unknown>;
    assert.equal(payload.userId, 'u-99');
    assert.equal(payload.fiveStarCount, 10);
    assert.equal(payload.fourStarCount, 2);
    assert.equal(payload.threeStarCount, 0);
    assert.equal(payload.oneStarCount, 1);
    assert.equal(payload.isVerified, true);
    assert.equal(payload.badgeLevel, 'Fixer Pro');
  });
});

describe('Unitario — ProfessionalService', () => {
  it('search() delega los filtros al repositorio y retorna la respuesta paginada intacta', async () => {
    const expected: IProfessionalSearchResult = {
      professionals: [createFakeProfile()],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 12
    };
    let receivedFilters: IProfessionalSearchFilters | undefined;

    const service = new ProfessionalService(
      createRepositoryStub({
        search: async (filters) => {
          receivedFilters = filters;
          return expected;
        }
      })
    );

    const filters: IProfessionalSearchFilters = { category: 'plomeria', isVerified: true, page: 1, limit: 12 };
    const result = await service.search(filters);

    assert.deepEqual(receivedFilters, filters);
    assert.equal(result, expected);
  });

  it('getProfileById() retorna el detalle completo si existe y lanza NotFoundError si no existe', async () => {
    const fakeProfile = createFakeProfile({ id: 'prof-42' });
    const service = new ProfessionalService(
      createRepositoryStub({
        findByIdWithDetails: async (id) => (id === 'prof-42' ? fakeProfile : null)
      })
    );

    const found = await service.getProfileById('prof-42');
    assert.equal(found.id, 'prof-42');

    await assert.rejects(
      () => service.getProfileById('inexistente'),
      (err: unknown) => err instanceof NotFoundError && err.statusCode === 404
    );
  });

  it('getProfileByUserId() lanza NotFoundError cuando el usuario no posee perfil profesional', async () => {
    const service = new ProfessionalService(
      createRepositoryStub({
        findByUserId: async () => null
      })
    );

    await assert.rejects(
      () => service.getProfileByUserId('user-sin-perfil'),
      (err: unknown) =>
        err instanceof NotFoundError &&
        err.message === 'Perfil profesional no encontrado para este usuario'
    );
  });

  it('updateMyProfile() traduce userId a profile.id al persistir y falla con NotFoundError si no existe', async () => {
    const existing = createFakeProfile({ id: 'prof-77', userId: 'user-77' });
    const updated = createFakeProfile({ id: 'prof-77', userId: 'user-77', zone: 'Belgrano' });
    let updateArgs: { id: string; data: Partial<ProfessionalProfileModel> } | undefined;

    const service = new ProfessionalService(
      createRepositoryStub({
        findByUserId: async (userId) => (userId === 'user-77' ? existing : null),
        update: async (id, data) => {
          updateArgs = { id, data };
          return updated;
        }
      })
    );

    const result = await service.updateMyProfile('user-77', { zone: 'Belgrano' });
    assert.equal(result.zone, 'Belgrano');
    assert.deepEqual(updateArgs, { id: 'prof-77', data: { zone: 'Belgrano' } });

    await assert.rejects(
      () => service.updateMyProfile('otro-user', { zone: 'Centro' }),
      (err: unknown) => err instanceof NotFoundError && err.statusCode === 404
    );
  });
});

describe('Unitario — ProfessionalRepository', () => {
  it('search() calcula totalPages correctamente a partir de count y limit', async () => {
    const rows = [createFakeProfile({ id: 'p1' }), createFakeProfile({ id: 'p2' })];
    vi.spyOn(ProfessionalProfileModel, 'findAndCountAll').mockImplementation((async () => ({
      count: 25,
      rows
    })) as never);

    const repo = new ProfessionalRepository();
    const result = await repo.search({ page: 2, limit: 10, category: 'plomeria' });

    assert.equal(result.total, 25);
    assert.equal(result.totalPages, 3);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 10);
    assert.equal(result.professionals.length, 2);
  });

  it('recalculateRatings() resetea métricas a valores iniciales (null y 0 reseñas) cuando no hay reseñas', async () => {
    vi.spyOn(ReviewModel, 'findAll').mockImplementation((async () => []) as never);
    const updateMock = vi
      .spyOn(ProfessionalProfileModel, 'update')
      .mockImplementation((async () => [1]) as never);

    const repo = new ProfessionalRepository();
    await repo.recalculateRatings('prof-1');

    assert.equal(updateMock.mock.calls.length, 1);
    const [values, options] = updateMock.mock.calls[0] as unknown as [
      Record<string, number | null>,
      { where: { id: string } }
    ];
    assert.deepEqual(values, {
      ratingAverage: null,
      totalReviews: 0,
      fiveStarCount: 0,
      fourStarCount: 0,
      threeStarCount: 0,
      twoStarCount: 0,
      oneStarCount: 0
    });
    assert.deepEqual(options, { where: { id: 'prof-1' } });
  });

  it('recalculateRatings() calcula promedio redondeado a 2 decimales y desglose exacto por estrella', async () => {
    vi.spyOn(ReviewModel, 'findAll').mockImplementation((async () => [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
      { rating: 2 },
      { rating: 1 },
      { rating: 5 }
    ] as ReviewModel[]) as never);
    const updateMock = vi
      .spyOn(ProfessionalProfileModel, 'update')
      .mockImplementation((async () => [1]) as never);

    const repo = new ProfessionalRepository();
    await repo.recalculateRatings('prof-2');

    assert.equal(updateMock.mock.calls.length, 1);
    const [values] = updateMock.mock.calls[0] as unknown as [Record<string, number>, unknown];
    // (5 + 5 + 4 + 3 + 2 + 1 + 5) / 7 = 25 / 7 = 3.5714... -> 3.57
    assert.equal(values.ratingAverage, 3.57);
    assert.equal(values.totalReviews, 7);
    assert.equal(values.fiveStarCount, 3);
    assert.equal(values.fourStarCount, 1);
    assert.equal(values.threeStarCount, 1);
    assert.equal(values.twoStarCount, 1);
    assert.equal(values.oneStarCount, 1);
  });

  it('update() retorna null si el perfil no existe o ejecuta instance.update() cuando existe', async () => {
    const repo = new ProfessionalRepository();

    vi.spyOn(ProfessionalProfileModel, 'findByPk').mockImplementation((async () => null) as never);
    const notFound = await repo.update('missing-id', { zone: 'Centro' });
    assert.equal(notFound, null);

    vi.restoreAllMocks();

    let updatedWith: unknown;
    const instanceStub = {
      id: 'prof-10',
      update: async (payload: unknown) => {
        updatedWith = payload;
        return instanceStub;
      }
    } as unknown as ProfessionalProfileModel;

    vi.spyOn(ProfessionalProfileModel, 'findByPk').mockImplementation((async () => instanceStub) as never);
    const updated = await repo.update('prof-10', { zone: 'Norte' });

    assert.equal(updated, instanceStub);
    assert.deepEqual(updatedWith, { zone: 'Norte' });
  });
});

describe('Unitario — ProfessionalController', () => {
  it('getMe y updateMe lanzan UnauthorizedError si no hay usuario autenticado en el request', async () => {
    const controller = new ProfessionalController(new ProfessionalService(createRepositoryStub()));
    const fakeRes = {} as never;

    await assert.rejects(
      () => controller.getMe({} as IAuthenticatedRequest, fakeRes),
      (err: unknown) => err instanceof UnauthorizedError && err.statusCode === 401
    );

    await assert.rejects(
      () => controller.updateMe({ body: { zone: 'Centro' } } as IAuthenticatedRequest, fakeRes),
      (err: unknown) => err instanceof UnauthorizedError && err.statusCode === 401
    );
  });

  it('search() empaqueta el resultado del servicio en respuesta paginada con meta y mensaje', async () => {
    const profile = createFakeProfile();
    const service = new ProfessionalService(
      createRepositoryStub({
        search: async () => ({
          professionals: [profile],
          total: 15,
          totalPages: 2,
          page: 1,
          limit: 10
        })
      })
    );
    const controller = new ProfessionalController(service);

    let statusCode = 0;
    let body: unknown;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        body = payload;
        return this;
      }
    } as never;

    await controller.search({ query: { page: 1, limit: 10 } } as never, res);

    assert.equal(statusCode, 200);
    assert.deepEqual(body, {
      success: true,
      message: 'Se encontraron 15 profesionales',
      data: [profile],
      meta: {
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2
      }
    });
  });
});
