import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import express from 'express';
import { ServiceRequestRouter } from '../../modules/service-requests/routes/ServiceRequestRouter.js';
import { ServiceRequestController } from '../../modules/service-requests/controllers/ServiceRequestController.js';
import { ServiceRequestService } from '../../modules/service-requests/services/ServiceRequestService.js';
import { IServiceRequestRepository } from '../../modules/service-requests/interfaces/IServiceRequestRepository.js';
import {
  ServiceRequestModel,
  ServiceRequestStatus
} from '../../modules/service-requests/models/ServiceRequestModel.js';
import { IProfessionalRepository } from '../../modules/professionals/interfaces/IProfessionalRepository.js';
import { ProfessionalProfileModel } from '../../modules/professionals/models/ProfessionalProfileModel.js';
import { AuthMiddleware } from '../../common/middlewares/AuthMiddleware.js';
import { ErrorHandlerMiddleware } from '../../common/middlewares/ErrorHandlerMiddleware.js';
import { TokenService } from '../../common/utils/TokenService.js';

const PRO_CARLOS_ID = '550e8400-e29b-41d4-a716-446655440001';
const PRO_ROBERTO_ID = '550e8400-e29b-41d4-a716-446655440002';

interface IInMemoryServiceRequestRecord {
  id: string;
  clientId: string;
  professionalId: string;
  title: string;
  description: string;
  category: string;
  serviceAddress: string;
  zone: string;
  isUrgent: boolean;
  scheduledDate: Date | null;
  status: ServiceRequestStatus;
  cancellationReason: string | null;
  createdAt: Date;
}

class InMemoryServiceRequestRepository implements IServiceRequestRepository {
  public requests: IInMemoryServiceRequestRecord[] = [];

  public async findById(id: string): Promise<ServiceRequestModel | null> {
    const found = this.requests.find((r) => r.id === id);
    return found ? ({ ...found } as unknown as ServiceRequestModel) : null;
  }

  public async findAll(): Promise<ServiceRequestModel[]> {
    return this.requests as unknown as ServiceRequestModel[];
  }

  public async findByClientId(clientId: string): Promise<ServiceRequestModel[]> {
    return this.requests.filter((r) => r.clientId === clientId) as unknown as ServiceRequestModel[];
  }

  public async findByProfessionalId(professionalId: string): Promise<ServiceRequestModel[]> {
    return this.requests.filter(
      (r) => r.professionalId === professionalId
    ) as unknown as ServiceRequestModel[];
  }

  public async updateStatus(
    id: string,
    status: ServiceRequestStatus,
    reason?: string
  ): Promise<ServiceRequestModel | null> {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    this.requests[idx] = {
      ...this.requests[idx],
      status,
      cancellationReason: reason || this.requests[idx].cancellationReason
    };
    return { ...this.requests[idx] } as unknown as ServiceRequestModel;
  }

  public async create(item: Partial<ServiceRequestModel>): Promise<ServiceRequestModel> {
    const created: IInMemoryServiceRequestRecord = {
      id: `req-${this.requests.length + 1}`,
      clientId: item.clientId!,
      professionalId: item.professionalId!,
      title: item.title!,
      description: item.description!,
      category: item.category!,
      serviceAddress: item.serviceAddress!,
      zone: item.zone!,
      isUrgent: Boolean(item.isUrgent),
      scheduledDate: item.scheduledDate ?? null,
      status: item.status ?? 'PENDING',
      cancellationReason: item.cancellationReason ?? null,
      createdAt: new Date()
    };
    this.requests.push(created);
    return { ...created } as unknown as ServiceRequestModel;
  }

  public async update(
    id: string,
    item: Partial<ServiceRequestModel>
  ): Promise<ServiceRequestModel | null> {
    const idx = this.requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.requests[idx] = {
      ...this.requests[idx],
      ...(item as Partial<IInMemoryServiceRequestRecord>)
    };
    return { ...this.requests[idx] } as unknown as ServiceRequestModel;
  }

  public async delete(id: string): Promise<boolean> {
    const beforeLen = this.requests.length;
    this.requests = this.requests.filter((r) => r.id !== id);
    return this.requests.length < beforeLen;
  }
}

function createInMemoryProRepository(): {
  profiles: Array<{ id: string; userId: string }>;
  repo: IProfessionalRepository;
} {
  const profiles = [
    { id: PRO_CARLOS_ID, userId: 'user-pro-1' },
    { id: PRO_ROBERTO_ID, userId: 'user-pro-2' }
  ];

  const repo: IProfessionalRepository = {
    findById: async (id) => {
      const found = profiles.find((p) => p.id === id);
      return found ? (found as unknown as ProfessionalProfileModel) : null;
    },
    findByIdWithDetails: async () => null,
    findByUserId: async (userId) => {
      const found = profiles.find((p) => p.userId === userId);
      return found ? (found as unknown as ProfessionalProfileModel) : null;
    },
    findAll: async () => [],
    search: async () => ({ professionals: [], total: 0, totalPages: 0, page: 1, limit: 12 }),
    recalculateRatings: async () => undefined,
    create: async (item) => item as ProfessionalProfileModel,
    update: async () => null,
    delete: async () => false
  };

  return { profiles, repo };
}

describe('Integración — Módulo de Solicitudes de Servicio (/api/v1/service-requests)', () => {
  let server: http.Server;
  let baseUrl: string;
  let requestRepository: InMemoryServiceRequestRepository;
  let tokenService: TokenService;

  beforeAll(async () => {
    requestRepository = new InMemoryServiceRequestRepository();
    tokenService = new TokenService();
    const { repo: proRepository } = createInMemoryProRepository();

    const authMiddleware = new AuthMiddleware(tokenService);
    const requestService = new ServiceRequestService(requestRepository, proRepository);
    const requestController = new ServiceRequestController(requestService);
    const requestRouter = new ServiceRequestRouter(requestController, authMiddleware);

    const app = express();
    app.use(express.json());
    app.use('/api/v1/service-requests', requestRouter.getRouter());
    app.use(ErrorHandlerMiddleware.handle);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}/api/v1/service-requests`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    requestRepository.requests = [];
  });

  it('I1: POST / aplica JWT (401), validación Zod (422), bloquea auto-solicitud (400) y crea órdenes estándar y urgentes (201)', async () => {
    // 1. Sin token -> 401
    const noAuthRes = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(noAuthRes.status, 401);

    const clientToken = tokenService.generateToken({
      id: 'client-1',
      email: 'cliente@fixer.com',
      role: 'CLIENT',
      fullName: 'Javier Rossi'
    });

    // 2. Body inválido (UUID mal formado y campos cortos) -> 422
    const invalidRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        professionalId: 'no-es-uuid',
        title: 'abc',
        description: 'corto',
        category: 'a',
        serviceAddress: '123',
        zone: 'z'
      })
    });
    assert.equal(invalidRes.status, 422);

    // 3. Auto-solicitud del propio profesional -> 400
    const proSelfToken = tokenService.generateToken({
      id: 'user-pro-1',
      email: 'carlos@fixer.com',
      role: 'PROFESSIONAL',
      fullName: 'Carlos Mendoza'
    });
    const selfReqRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${proSelfToken}`
      },
      body: JSON.stringify({
        professionalId: PRO_CARLOS_ID,
        title: 'Reparación de cañería',
        description: 'Pérdida importante debajo de la bacha de cocina.',
        category: 'plomeria',
        serviceAddress: 'San Martín 228',
        zone: 'Centro'
      })
    });
    assert.equal(selfReqRes.status, 400);

    // 4. Creación exitosa de solicitud urgente -> 201 con prefijo [URGENTE] y fecha autogenerada
    const urgentRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        professionalId: PRO_CARLOS_ID,
        title: 'Fuga de gas en cocina',
        description: 'Se percibe olor a gas cerca de la llave de paso principal.',
        category: 'gas',
        serviceAddress: 'Av. Colón 450',
        zone: 'Centro',
        isUrgent: true
      })
    });
    const urgentBody = (await urgentRes.json()) as {
      success: boolean;
      data: IInMemoryServiceRequestRecord;
    };

    assert.equal(urgentRes.status, 201);
    assert.equal(urgentBody.success, true);
    assert.equal(urgentBody.data.title, '[URGENTE] Fuga de gas en cocina');
    assert.equal(urgentBody.data.isUrgent, true);
    assert.equal(urgentBody.data.status, 'PENDING');
    assert.ok(urgentBody.data.scheduledDate);
  });

  it('I2: GET /client/my-requests y GET /pro/my-requests aplican RBAC (403 a CLIENT en ruta pro) y aíslan bandejas por usuario', async () => {
    const client1Token = tokenService.generateToken({
      id: 'client-1',
      email: 'cliente1@fixer.com',
      role: 'CLIENT',
      fullName: 'Javier Rossi'
    });
    const client2Token = tokenService.generateToken({
      id: 'client-2',
      email: 'cliente2@fixer.com',
      role: 'CLIENT',
      fullName: 'Lucía Fernández'
    });
    const proCarlosToken = tokenService.generateToken({
      id: 'user-pro-1',
      email: 'carlos@fixer.com',
      role: 'PROFESSIONAL',
      fullName: 'Carlos Mendoza'
    });

    // Cliente 1 crea solicitud para Carlos
    await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${client1Token}` },
      body: JSON.stringify({
        professionalId: PRO_CARLOS_ID,
        title: 'Cambio de grifería monocomando',
        description: 'Reemplazo de grifería en cocina y ajuste de flexibles.',
        category: 'plomeria',
        serviceAddress: 'San Martín 228',
        zone: 'Centro'
      })
    });

    // Cliente 2 crea solicitud para Roberto
    await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${client2Token}` },
      body: JSON.stringify({
        professionalId: PRO_ROBERTO_ID,
        title: 'Revisión de tablero eléctrico',
        description: 'Instalación de protector de tensión en tablero principal.',
        category: 'electricidad',
        serviceAddress: 'Av. Cabildo 1420',
        zone: 'Belgrano'
      })
    });

    // 1. Cliente 1 solo ve su propia solicitud
    const clientInboxRes = await fetch(`${baseUrl}/client/my-requests`, {
      headers: { Authorization: `Bearer ${client1Token}` }
    });
    const clientInboxBody = (await clientInboxRes.json()) as {
      success: boolean;
      data: IInMemoryServiceRequestRecord[];
    };
    assert.equal(clientInboxRes.status, 200);
    assert.equal(clientInboxBody.data.length, 1);
    assert.equal(clientInboxBody.data[0].professionalId, PRO_CARLOS_ID);

    // 2. Un usuario con rol CLIENT recibe 403 Forbidden en /pro/my-requests
    const forbiddenProRes = await fetch(`${baseUrl}/pro/my-requests`, {
      headers: { Authorization: `Bearer ${client1Token}` }
    });
    assert.equal(forbiddenProRes.status, 403);

    // 3. El profesional Carlos ve únicamente las solicitudes dirigidas a su perfil
    const proInboxRes = await fetch(`${baseUrl}/pro/my-requests`, {
      headers: { Authorization: `Bearer ${proCarlosToken}` }
    });
    const proInboxBody = (await proInboxRes.json()) as {
      success: boolean;
      data: IInMemoryServiceRequestRecord[];
    };
    assert.equal(proInboxRes.status, 200);
    assert.equal(proInboxBody.data.length, 1);
    assert.equal(proInboxBody.data[0].clientId, 'client-1');
  });
});
