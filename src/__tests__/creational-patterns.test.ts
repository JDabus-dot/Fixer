import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProfessionalProfileBuilder } from '../modules/professionals/builders/ProfessionalProfileBuilder.js';
import { ProfessionalSearchQueryBuilder } from '../modules/professionals/builders/ProfessionalSearchQueryBuilder.js';
import {
  AccountFactory,
  AccountCreator,
  ClientAccountCreator,
  ProfessionalAccountCreator,
  ICreatedAccount
} from '../common/factories/AccountFactory.js';
import {
  ServiceRequestFactory,
  StandardServiceRequestCreator,
  UrgentServiceRequestCreator
} from '../modules/service-requests/factories/ServiceRequestFactory.js';
import { RegisterDTO } from '../modules/auth/dtos/AuthDTOs.js';
import { Op } from 'sequelize';

describe('Patrón Creacional: ProfessionalProfileBuilder', () => {
  it('debe arrojar error si se llama a buildData() sin userId', () => {
    const builder = new ProfessionalProfileBuilder();
    assert.throws(() => builder.buildData(), {
      message: 'El atributo userId es requerido para construir un ProfessionalProfile'
    });
  });

  it('debe construir un perfil con valores por defecto y el userId especificado', () => {
    const userId = '11111111-2222-3333-4444-555555555555';
    const builder = new ProfessionalProfileBuilder(userId);
    const data = builder.buildData();

    assert.equal(data.userId, userId);
    assert.equal(data.coverageRadiusKm, 15);
    assert.equal(data.basePrice, 10000);
    assert.equal(data.responseTime, '< 30 min');
    assert.equal(data.isEmergencyAvailable, false);
    assert.equal(data.isVerified, false);
    assert.equal(data.ratingAverage, 5.0);
    assert.equal(data.totalReviews, 0);
  });

  it('debe construir un perfil complejo de forma fluida paso a paso', () => {
    const userId = 'user-uuid-1234';
    const profile = new ProfessionalProfileBuilder(userId)
      .withTrade('plomeria', 'Plomería Integral & Gasista Matriculado', 'Matrícula Nº 48.912', 14)
      .withBio('Instalador matriculado con amplia experiencia en obras residenciales.')
      .withLocation('Bahía Blanca', 'Palermo y Zona Norte', 'San Martín 228', 25)
      .withPricing(18500, '< 20 min', true)
      .withEmergencyAvailability('< 20 min')
      .withReputation(4.9, 142, 'Fixer Diamond', 121, 17, 3, 1, 0)
      .withSpecialties(['Detección térmica', 'Termofusión', 'Calderas'])
      .buildData();

    assert.equal(profile.userId, userId);
    assert.equal(profile.tradeCategory, 'plomeria');
    assert.equal(profile.headline, 'Plomería Integral & Gasista Matriculado');
    assert.equal(profile.licenseNumber, 'Matrícula Nº 48.912');
    assert.equal(profile.experienceYears, 14);
    assert.equal(profile.city, 'Bahía Blanca');
    assert.equal(profile.zone, 'Palermo y Zona Norte');
    assert.equal(profile.address, 'San Martín 228');
    assert.equal(profile.coverageRadiusKm, 25);
    assert.equal(profile.basePrice, 18500);
    assert.equal(profile.responseTime, '< 20 min');
    assert.equal(profile.isEmergencyAvailable, true);
    assert.equal(profile.isVerified, true);
    assert.equal(profile.badgeLevel, 'Fixer Diamond');
    assert.equal(profile.ratingAverage, 4.9);
    assert.equal(profile.totalReviews, 142);
    assert.equal(profile.fiveStarCount, 121);
    assert.deepEqual(profile.specialties, ['Detección térmica', 'Termofusión', 'Calderas']);
  });
});

describe('Patrón Creacional: ProfessionalSearchQueryBuilder', () => {
  it('debe generar opciones de búsqueda por defecto con orden y paginación', () => {
    const builder = new ProfessionalSearchQueryBuilder();
    const options = builder.build();
    const pagination = builder.getPagination();

    assert.equal(pagination.page, 1);
    assert.equal(pagination.limit, 12);
    assert.equal(pagination.offset, 0);
    assert.deepEqual(options.order, [
      ['ratingAverage', 'DESC'],
      ['totalReviews', 'DESC']
    ]);
  });

  it('debe configurar filtros por categoría, zona, verificación y urgencias', () => {
    const builder = new ProfessionalSearchQueryBuilder()
      .filterByCategory('electricidad')
      .filterByZone('Belgrano', 'CABA')
      .onlyVerified(true)
      .onlyAvailableToday(true)
      .filterByMinRating(4.5)
      .paginate(2, 10);

    const options = builder.build();
    const where = options.where as any;

    assert.ok(where.tradeCategory);
    assert.deepEqual(where.tradeCategory, { [Op.iLike]: '%electricidad%' });
    assert.equal(where.isVerified, true);
    assert.equal(where.isEmergencyAvailable, true);
    assert.deepEqual(where.ratingAverage, { [Op.gte]: 4.5 });

    const pagination = builder.getPagination();
    assert.equal(pagination.page, 2);
    assert.equal(pagination.limit, 10);
    assert.equal(pagination.offset, 10);
  });

  it('debe configurar ordenamiento por precio más bajo', () => {
    const builder = new ProfessionalSearchQueryBuilder().sortBy('price-low');
    const options = builder.build();
    assert.deepEqual(options.order, [['basePrice', 'ASC']]);
  });

  it('debe construir búsqueda mediante fromFilters', () => {
    const query = ProfessionalSearchQueryBuilder.fromFilters({
      query: 'Carlos',
      category: 'plomeria',
      sortBy: 'price-high',
      page: 1,
      limit: 5
    });

    const options = query.build();
    assert.deepEqual(options.order, [['basePrice', 'DESC']]);
    assert.equal(options.limit, 5);
  });
});

describe('Patrón Creacional: AccountFactory & AccountCreator', () => {
  it('debe resolver ClientAccountCreator para isPro=false o rol CLIENT', () => {
    const creatorFromBool = AccountFactory.getCreator(false);
    assert.ok(creatorFromBool instanceof ClientAccountCreator);

    const creatorFromRole = AccountFactory.getCreator('CLIENT');
    assert.ok(creatorFromRole instanceof ClientAccountCreator);
  });

  it('debe resolver ProfessionalAccountCreator para isPro=true o rol PROFESSIONAL', () => {
    const creatorFromBool = AccountFactory.getCreator(true);
    assert.ok(creatorFromBool instanceof ProfessionalAccountCreator);

    const creatorFromRole = AccountFactory.getCreator('PROFESSIONAL');
    assert.ok(creatorFromRole instanceof ProfessionalAccountCreator);
  });

  it('debe permitir extender con nuevos roles respetando OCP (Open/Closed Principle)', () => {
    class EnterpriseAccountCreator extends AccountCreator {
      public async createAccount(dto: RegisterDTO): Promise<ICreatedAccount> {
        return { user: { id: 'ent-1', role: 'ENTERPRISE' } as any };
      }
    }

    AccountFactory.registerCreator('ENTERPRISE', () => new EnterpriseAccountCreator());

    const enterpriseCreator = AccountFactory.getCreator('ENTERPRISE');
    assert.ok(enterpriseCreator instanceof EnterpriseAccountCreator);
  });
});

describe('Patrón Creacional: ServiceRequestFactory & ServiceRequestCreator', () => {
  it('debe resolver StandardServiceRequestCreator para solicitudes regulares', () => {
    const creator = ServiceRequestFactory.getCreator(false);
    assert.ok(creator instanceof StandardServiceRequestCreator);

    const attributes = creator.buildCreationAttributes(
      'client-1',
      {
        professionalId: 'pro-1',
        title: 'Reparación de canilla',
        description: 'Gotea agua',
        category: 'plomeria',
        serviceAddress: 'San Martín 100',
        zone: 'Centro',
        isUrgent: false
      },
      15000
    );

    assert.equal(attributes.isUrgent, false);
    assert.equal(attributes.title, 'Reparación de canilla');
    assert.equal(attributes.estimatedBudget, 15000);
  });

  it('debe resolver UrgentServiceRequestCreator para solicitudes urgentes', () => {
    const creator = ServiceRequestFactory.getCreator(true);
    assert.ok(creator instanceof UrgentServiceRequestCreator);

    const attributes = creator.buildCreationAttributes(
      'client-1',
      {
        professionalId: 'pro-1',
        title: 'Fuga de gas',
        description: 'Olor a gas en la cocina',
        category: 'gas',
        serviceAddress: 'San Martín 100',
        zone: 'Centro',
        isUrgent: true
      },
      20000
    );

    assert.equal(attributes.isUrgent, true);
    assert.ok(attributes.title.startsWith('[URGENTE]'));
    // Aplica recargo de urgencia por defecto (+25%)
    assert.equal(attributes.estimatedBudget, 25000);
    assert.ok(attributes.scheduledDate instanceof Date);
  });
});
