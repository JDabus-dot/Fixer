import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { CreateServiceRequestSchema } from '../../modules/service-requests/dtos/ServiceRequestDTOs.js';

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
});
