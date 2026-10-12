import { FindAndCountOptions, Op, Order, Sequelize } from 'sequelize';
import { UserModel } from '../../users/models/UserModel.js';
import { IProfessionalProfileAttributes } from '../models/ProfessionalProfileModel.js';
import { IProfessionalSearchFilters } from '../interfaces/IProfessionalRepository.js';

export interface IPaginationMeta {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Patrón Creacional: BUILDER para consultas complejas de búsqueda de profesionales.
 * Aísla y desacopla la construcción dinámica de cláusulas WHERE, ordenamientos,
 * paginación y joins de Sequelize para mantener los repositorios limpios y testeables.
 */
export class ProfessionalSearchQueryBuilder {
  private whereClause: Record<string | symbol, unknown> = {};
  private orderClause: Order = [
    ['ratingAverage', 'DESC'],
    ['totalReviews', 'DESC']
  ];
  private page = 1;
  private limit = 12;
  private offset = 0;

  /**
   * Inicializa el builder opcionalmente aplicando filtros iniciales.
   */
  public static fromFilters(filters: IProfessionalSearchFilters): ProfessionalSearchQueryBuilder {
    return new ProfessionalSearchQueryBuilder()
      .filterByText(filters.query)
      .filterByCategory(filters.category)
      .filterByZone(filters.zone, filters.city)
      .onlyVerified(filters.isVerified)
      .onlyAvailableToday(filters.isEmergencyAvailable)
      .filterByMinRating(filters.minRating)
      .sortBy(filters.sortBy)
      .paginate(filters.page, filters.limit);
  }

  /**
   * Filtro por término de texto libre en nombres, titulares, biografía, oficio o matrícula.
   */
  public filterByText(query?: string): this {
    if (!query || query.trim() === '') {
      return this;
    }

    const q = `%${query.trim()}%`;
    const orConditions: Array<any> = [
      Sequelize.where(Sequelize.col('user.full_name'), { [Op.iLike]: q }),
      { headline: { [Op.iLike]: q } },
      { bio: { [Op.iLike]: q } },
      { tradeCategory: { [Op.iLike]: q } },
      { licenseNumber: { [Op.iLike]: q } }
    ];

    if (this.whereClause[Op.or]) {
      this.whereClause[Op.and] = [{ [Op.or]: this.whereClause[Op.or] }, { [Op.or]: orConditions }];
      delete this.whereClause[Op.or];
    } else {
      this.whereClause[Op.or] = orConditions;
    }

    return this;
  }

  /**
   * Filtro por categoría o especialidad de oficio.
   */
  public filterByCategory(category?: string): this {
    if (!category || category.trim() === '') {
      return this;
    }

    this.whereClause.tradeCategory = {
      [Op.iLike]: `%${category.trim()}%`
    };
    return this;
  }

  /**
   * Filtro por zona o ciudad.
   */
  public filterByZone(zone?: string, city?: string): this {
    if (zone && zone.trim() !== '') {
      this.whereClause[Op.or] = [
        { zone: { [Op.iLike]: `%${zone.trim()}%` } },
        { city: { [Op.iLike]: `%${zone.trim()}%` } },
        { address: { [Op.iLike]: `%${zone.trim()}%` } }
      ];
    } else if (city && city.trim() !== '') {
      this.whereClause.city = { [Op.iLike]: `%${city.trim()}%` };
    }
    return this;
  }

  /**
   * Filtro por estado de verificación oficial.
   */
  public onlyVerified(isVerified?: boolean): this {
    if (isVerified !== undefined) {
      this.whereClause.isVerified = isVerified;
    }
    return this;
  }

  /**
   * Filtro por disponibilidad para emergencias y urgencias hoy.
   */
  public onlyAvailableToday(isEmergencyAvailable?: boolean): this {
    if (isEmergencyAvailable !== undefined) {
      this.whereClause.isEmergencyAvailable = isEmergencyAvailable;
    }
    return this;
  }

  /**
   * Filtro por calificación promedio mínima (ej: 4.5+).
   */
  public filterByMinRating(minRating?: number): this {
    if (minRating !== undefined) {
      this.whereClause.ratingAverage = {
        [Op.gte]: minRating
      };
    }
    return this;
  }

  /**
   * Configuración dinámica del orden de resultados.
   */
  public sortBy(sortBy?: string): this {
    switch (sortBy) {
      case 'price-low':
        this.orderClause = [['basePrice', 'ASC']];
        break;
      case 'price-high':
        this.orderClause = [['basePrice', 'DESC']];
        break;
      case 'urgency':
        this.orderClause = [
          ['isEmergencyAvailable', 'DESC'],
          ['ratingAverage', 'DESC']
        ];
        break;
      case 'experience':
        this.orderClause = [['experienceYears', 'DESC']];
        break;
      case 'rating':
      default:
        this.orderClause = [
          ['ratingAverage', 'DESC'],
          ['totalReviews', 'DESC']
        ];
        break;
    }
    return this;
  }

  /**
   * Configuración de paginación (página y límite por página).
   */
  public paginate(page?: number, limit?: number): this {
    this.page = Math.max(Number(page) || 1, 1);
    this.limit = Math.max(Number(limit) || 12, 1);
    this.offset = (this.page - 1) * this.limit;
    return this;
  }

  /**
   * Retorna los metadatos de paginación calculados.
   */
  public getPagination(): IPaginationMeta {
    return {
      page: this.page,
      limit: this.limit,
      offset: this.offset
    };
  }

  /**
   * Construye el objeto completo de opciones para Sequelize findAndCountAll.
   */
  public build(): FindAndCountOptions<IProfessionalProfileAttributes> {
    return {
      where: this.whereClause,
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        }
      ],
      order: this.orderClause,
      limit: this.limit,
      offset: this.offset,
      subQuery: false,
      distinct: true
    };
  }
}
