import { afterEach, describe, it, vi } from 'vitest';
import assert from 'node:assert/strict';
import {
  CreateServiceRequestSchema,
  UpdateRequestStatusSchema
} from '../../modules/service-requests/dtos/ServiceRequestDTOs.js';
import {
  ServiceRequestFactory,
  StandardServiceRequestCreator,
  UrgentServiceRequestCreator
} from '../../modules/service-requests/factories/ServiceRequestFactory.js';
import { ServiceRequestService } from '../../modules/service-requests/services/ServiceRequestService.js';
import { ServiceRequestRepository } from '../../modules/service-requests/repositories/ServiceRequestRepository.js';
import { IServiceRequestRepository } from '../../modules/service-requests/interfaces/IServiceRequestRepository.js';
import { ServiceRequestModel } from '../../modules/service-requests/models/ServiceRequestModel.js';
import { IProfessionalRepository } from '../../modules/professionals/interfaces/IProfessionalRepository.js';
import { ProfessionalProfileModel } from '../../modules/professionals/models/ProfessionalProfileModel.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors/index.js';

const VALID_PROFESSIONAL_ID = '550e8400-e29b-41d4-a716-446655440000';

function createRequestRepoStub(
  overrides: Partial<IServiceRequestRepository> = {}
): IServiceRequestRepository {
  return {
    findById: async () => null,
    findAll: async () => [],
    findByClientId: async () => [],
    findByProfessionalId: async () => [],
    updateStatus: async () => null,
    create: async (item) => ({ id: 'req-1', ...item } as ServiceRequestModel),
    update: async () => null,
    delete: async () => false,
    ...overrides
  };
}

function createProfessionalRepoStub(
  overrides: Partial<IProfessionalRepository> = {}
): IProfessionalRepository {
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

describe('Unitario — DTOs de Solicitudes de Servicio (Zod)', () => {
  it('U1: CreateServiceRequestSchema valida UUID y longitudes, aplica isUrgent=false por defecto y transforma scheduledDate a Date', () => {
    const isoDate = '2026-12-01T14:30:00.000Z';
    const parsed = CreateServiceRequestSchema.parse({
      professionalId: VALID_PROFESSIONAL_ID,
      title: 'Pérdida de agua en cocina',
      description: 'Pierde el flexible debajo de la mesada de forma continua.',
      category: 'plomeria',
      serviceAddress: 'Av. Colón 450',
      zone: 'Centro',
      scheduledDate: isoDate
    });

    assert.equal(parsed.professionalId, VALID_PROFESSIONAL_ID);
    assert.equal(parsed.isUrgent, false);
    assert.ok(parsed.scheduledDate instanceof Date);
    assert.equal(parsed.scheduledDate?.toISOString(), isoDate);

    const invalid = CreateServiceRequestSchema.safeParse({
      professionalId: 'id-no-uuid',
      title: 'abc',
      description: 'corto',
      category: 'a',
      serviceAddress: '123',
      zone: 'z'
    });

    assert.equal(invalid.success, false);
    if (!invalid.success) {
      const fields = invalid.error.errors.map((err) => err.path.join('.')).sort();
      assert.deepEqual(fields, [
        'category',
        'description',
        'professionalId',
        'serviceAddress',
        'title',
        'zone'
      ]);
    }
  });

  it('U2: UpdateRequestStatusSchema acepta únicamente los estados válidos del contrato y reason opcional', () => {
    const valid = UpdateRequestStatusSchema.safeParse({
      status: 'CANCELLED',
      reason: 'El cliente reprogramó la visita'
    });
    assert.equal(valid.success, true);

    const invalid = UpdateRequestStatusSchema.safeParse({
      status: 'REJECTED'
    });
    assert.equal(invalid.success, false);
  });
});

describe('Unitario — ServiceRequestFactory (Factory Method)', () => {
  it('U3: ServiceRequestFactory selecciona Standard o Urgent creator, asigna defaults y evita duplicar el prefijo [URGENTE]', () => {
    const baseDto = {
      professionalId: VALID_PROFESSIONAL_ID,
      title: 'Corte general en tablero',
      description: 'Saltó el disyuntor diferencial y no vuelve a levantar.',
      category: 'electricidad',
      serviceAddress: 'San Martín 228',
      zone: 'Centro',
      isUrgent: false
    };

    const standardCreator = ServiceRequestFactory.getCreator(false);
    assert.ok(standardCreator instanceof StandardServiceRequestCreator);
    const standardAttrs = standardCreator.buildCreationAttributes('client-1', baseDto);
    assert.equal(standardAttrs.isUrgent, false);
    assert.equal(standardAttrs.title, 'Corte general en tablero');
    assert.equal(standardAttrs.scheduledDate, null);
    assert.equal(standardAttrs.status, 'PENDING');

    const urgentCreator = ServiceRequestFactory.getCreator(true);
    assert.ok(urgentCreator instanceof UrgentServiceRequestCreator);
    const urgentAttrs = urgentCreator.buildCreationAttributes('client-1', {
      ...baseDto,
      isUrgent: true
    });
    assert.equal(urgentAttrs.isUrgent, true);
    assert.equal(urgentAttrs.title, '[URGENTE] Corte general en tablero');
    assert.ok(urgentAttrs.scheduledDate instanceof Date);
    assert.equal(urgentAttrs.status, 'PENDING');

    const alreadyPrefixed = urgentCreator.buildCreationAttributes('client-1', {
      ...baseDto,
      title: '[URGENTE] Corte general en tablero',
      isUrgent: true
    });
    assert.equal(alreadyPrefixed.title, '[URGENTE] Corte general en tablero');
  });
});

describe('Unitario — ServiceRequestService', () => {
  it('U4: createRequest() lanza NotFoundError si el profesional no existe, BadRequestError en auto-solicitud y persiste si es válido', async () => {
    const dto = {
      professionalId: VALID_PROFESSIONAL_ID,
      title: 'Instalación de termotanque',
      description: 'Reemplazo de termotanque a gas de 80 litros.',
      category: 'gas',
      serviceAddress: 'Sarmiento 910',
      zone: 'Microcentro',
      isUrgent: true
    };

    const serviceMissingPro = new ServiceRequestService(
      createRequestRepoStub(),
      createProfessionalRepoStub({ findById: async () => null })
    );

    await assert.rejects(
      () => serviceMissingPro.createRequest('client-1', dto),
      (err: unknown) => err instanceof NotFoundError && err.statusCode === 404
    );

    const proProfile = {
      id: VALID_PROFESSIONAL_ID,
      userId: 'user-pro-1'
    } as ProfessionalProfileModel;

    const serviceWithPro = new ServiceRequestService(
      createRequestRepoStub(),
      createProfessionalRepoStub({ findById: async () => proProfile })
    );

    // El mismo usuario profesional intenta solicitarse a sí mismo -> 400
    await assert.rejects(
      () => serviceWithPro.createRequest('user-pro-1', dto),
      (err: unknown) => err instanceof BadRequestError && err.statusCode === 400
    );

    // Cliente distinto -> crea la solicitud delegando en la fábrica
    const created = await serviceWithPro.createRequest('client-99', dto);
    assert.equal(created.clientId, 'client-99');
    assert.equal(created.professionalId, VALID_PROFESSIONAL_ID);
    assert.equal(created.isUrgent, true);
    assert.equal(created.title, '[URGENTE] Instalación de termotanque');
  });

  it('U5: getMyRequestsAsProfessional() resuelve userId a profile.id o lanza NotFoundError si no posee perfil', async () => {
    let queriedProId: string | undefined;
    const expectedList = [{ id: 'req-10', professionalId: 'prof-42' } as ServiceRequestModel];

    const service = new ServiceRequestService(
      createRequestRepoStub({
        findByProfessionalId: async (proId) => {
          queriedProId = proId;
          return expectedList;
        }
      }),
      createProfessionalRepoStub({
        findByUserId: async (userId) =>
          userId === 'user-pro-42'
            ? ({ id: 'prof-42', userId: 'user-pro-42' } as ProfessionalProfileModel)
            : null
      })
    );

    const list = await service.getMyRequestsAsProfessional('user-pro-42');
    assert.equal(queriedProId, 'prof-42');
    assert.equal(list, expectedList);

    await assert.rejects(
      () => service.getMyRequestsAsProfessional('user-sin-perfil'),
      (err: unknown) => err instanceof NotFoundError && err.statusCode === 404
    );
  });

  it('U6: updateStatus() permite cambios solo al cliente dueño o al profesional asignado y bloquea a terceros con ForbiddenError', async () => {
    const existingReq = {
      id: 'req-100',
      clientId: 'client-owner',
      professionalId: 'prof-assigned',
      status: 'PENDING'
    } as ServiceRequestModel;

    const service = new ServiceRequestService(
      createRequestRepoStub({
        findById: async (id) => (id === 'req-100' ? existingReq : null),
        updateStatus: async (id, status, reason) =>
          ({ ...existingReq, id, status, cancellationReason: reason ?? null } as ServiceRequestModel)
      }),
      createProfessionalRepoStub({
        findById: async (id) =>
          id === 'prof-assigned'
            ? ({ id: 'prof-assigned', userId: 'user-pro-assigned' } as ProfessionalProfileModel)
            : null
      })
    );

    // 1. Solicitud inexistente -> 404
    await assert.rejects(
      () => service.updateStatus('req-inexistente', 'client-owner', { status: 'CANCELLED' }),
      (err: unknown) => err instanceof NotFoundError && err.statusCode === 404
    );

    // 2. Tercero ajeno -> 403 Forbidden
    await assert.rejects(
      () => service.updateStatus('req-100', 'intruder-user', { status: 'CANCELLED' }),
      (err: unknown) => err instanceof ForbiddenError && err.statusCode === 403
    );

    // 3. Profesional asignado -> permitido
    const byPro = await service.updateStatus('req-100', 'user-pro-assigned', { status: 'ACCEPTED' });
    assert.equal(byPro.status, 'ACCEPTED');

    // 4. Cliente dueño -> permitido con motivo
    const byClient = await service.updateStatus('req-100', 'client-owner', {
      status: 'CANCELLED',
      reason: 'Solucionado'
    });
    assert.equal(byClient.status, 'CANCELLED');
    assert.equal(byClient.cancellationReason, 'Solucionado');
  });
});

describe('Unitario — ServiceRequestRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('U7: updateStatus() retorna null si no existe o actualiza el estado conservando cancellationReason previa cuando no se envía nueva', async () => {
    const repo = new ServiceRequestRepository();

    vi.spyOn(ServiceRequestModel, 'findByPk').mockImplementation((async () => null) as never);
    const missing = await repo.updateStatus('missing-id', 'ACCEPTED');
    assert.equal(missing, null);

    vi.restoreAllMocks();

    const payloads: Array<Record<string, unknown>> = [];
    const instanceStub = {
      id: 'req-200',
      status: 'PENDING',
      cancellationReason: 'Motivo previo',
      update: async (payload: Record<string, unknown>) => {
        payloads.push(payload);
        Object.assign(instanceStub, payload);
        return instanceStub;
      }
    } as unknown as ServiceRequestModel;

    vi.spyOn(ServiceRequestModel, 'findByPk').mockImplementation((async () => instanceStub) as never);

    // Sin nuevo reason -> preserva cancellationReason previa
    await repo.updateStatus('req-200', 'IN_PROGRESS');
    assert.deepEqual(payloads[0], {
      status: 'IN_PROGRESS',
      cancellationReason: 'Motivo previo'
    });

    // Con nuevo reason -> sobrescribe cancellationReason
    await repo.updateStatus('req-200', 'CANCELLED', 'Falta de repuestos');
    assert.deepEqual(payloads[1], {
      status: 'CANCELLED',
      cancellationReason: 'Falta de repuestos'
    });
  });
});
