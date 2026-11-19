import { describe, it } from 'vitest';
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

const VALID_PROFESSIONAL_ID = '550e8400-e29b-41d4-a716-446655440000';

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
