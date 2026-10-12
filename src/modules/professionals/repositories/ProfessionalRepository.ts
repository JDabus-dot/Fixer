import { Op, Order, Sequelize } from 'sequelize';
import { ProfessionalProfileModel } from '../models/ProfessionalProfileModel.js';
import {
  IProfessionalRepository,
  IProfessionalSearchFilters,
  IProfessionalSearchResult
} from '../interfaces/IProfessionalRepository.js';
import { UserModel } from '../../users/models/UserModel.js';
import { ReviewModel } from '../../reviews/models/ReviewModel.js';

/**
 * Implementación POO del repositorio de Profesionales utilizando Sequelize.
 */
export class ProfessionalRepository implements IProfessionalRepository {
  public async findById(id: string): Promise<ProfessionalProfileModel | null> {
    return ProfessionalProfileModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl', 'role']
        }
      ]
    });
  }

  public async findByIdWithDetails(id: string): Promise<ProfessionalProfileModel | null> {
    return ProfessionalProfileModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl', 'role']
        },
        {
          model: ReviewModel,
          as: 'reviews',
          include: [
            {
              model: UserModel,
              as: 'client',
              attributes: ['id', 'fullName', 'avatarUrl']
            }
          ],
          separate: true,
          order: [['createdAt', 'DESC']]
        }
      ]
    });
  }

  public async findByUserId(userId: string): Promise<ProfessionalProfileModel | null> {
    return ProfessionalProfileModel.findOne({
      where: { userId },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl', 'role']
        }
      ]
    });
  }

  public async findAll(filters?: Record<string, unknown>): Promise<ProfessionalProfileModel[]> {
    return ProfessionalProfileModel.findAll({
      where: filters,
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        }
      ]
    });
  }

  public async search(filters: IProfessionalSearchFilters): Promise<IProfessionalSearchResult> {
    const page = Math.max(Number(filters.page) || 1, 1);
    const limit = Math.max(Number(filters.limit) || 12, 1);
    const offset = (page - 1) * limit;

    const whereClause: Record<string | symbol, unknown> = {};

    // 1. Filtro por categoría de oficio (plomería, electricidad, gas, etc.)
    if (filters.category && filters.category.trim() !== '') {
      whereClause.tradeCategory = {
        [Op.iLike]: `%${filters.category.trim()}%`
      };
    }

    // 2. Filtro por zona o ciudad
    if (filters.zone && filters.zone.trim() !== '') {
      whereClause[Op.or] = [
        { zone: { [Op.iLike]: `%${filters.zone.trim()}%` } },
        { city: { [Op.iLike]: `%${filters.zone.trim()}%` } },
        { address: { [Op.iLike]: `%${filters.zone.trim()}%` } }
      ];
    } else if (filters.city && filters.city.trim() !== '') {
      whereClause.city = { [Op.iLike]: `%${filters.city.trim()}%` };
    }

    // 3. Filtros booleanos: Matriculados / Urgencias Hoy
    if (filters.isVerified !== undefined) {
      whereClause.isVerified = filters.isVerified;
    }

    if (filters.isEmergencyAvailable !== undefined) {
      whereClause.isEmergencyAvailable = filters.isEmergencyAvailable;
    }

    // 4. Filtro por calificación mínima (e.g. 4.8+)
    if (filters.minRating !== undefined) {
      whereClause.ratingAverage = {
        [Op.gte]: filters.minRating
      };
    }

    // 5. Búsqueda de texto libre (nombre, apellido, titular, especialidades, bio)
    if (filters.query && filters.query.trim() !== '') {
      const q = `%${filters.query.trim()}%`;
      const orConditions: Array<any> = [
        Sequelize.where(Sequelize.col('user.full_name'), { [Op.iLike]: q }),
        { headline: { [Op.iLike]: q } },
        { bio: { [Op.iLike]: q } },
        { tradeCategory: { [Op.iLike]: q } },
        { licenseNumber: { [Op.iLike]: q } }
      ];

      if (whereClause[Op.or]) {
        whereClause[Op.and] = [{ [Op.or]: whereClause[Op.or] }, { [Op.or]: orConditions }];
        delete whereClause[Op.or];
      } else {
        whereClause[Op.or] = orConditions;
      }
    }

    // 6. Ordenamiento
    let order: Order = [['ratingAverage', 'DESC']];
    switch (filters.sortBy) {
      case 'price-low':
        order = [['basePrice', 'ASC']];
        break;
      case 'price-high':
        order = [['basePrice', 'DESC']];
        break;
      case 'urgency':
        order = [
          ['isEmergencyAvailable', 'DESC'],
          ['ratingAverage', 'DESC']
        ];
        break;
      case 'experience':
        order = [['experienceYears', 'DESC']];
        break;
      case 'rating':
      default:
        order = [
          ['ratingAverage', 'DESC'],
          ['totalReviews', 'DESC']
        ];
        break;
    }

    const { count, rows } = await ProfessionalProfileModel.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        }
      ],
      order,
      limit,
      offset,
      subQuery: false,
      distinct: true
    });

    return {
      professionals: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      page,
      limit
    };
  }

  public async recalculateRatings(professionalId: string): Promise<void> {
    const reviews = await ReviewModel.findAll({
      where: { professionalId },
      attributes: ['rating']
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      await ProfessionalProfileModel.update(
        {
          ratingAverage: 5.0,
          totalReviews: 0,
          fiveStarCount: 0,
          fourStarCount: 0,
          threeStarCount: 0,
          twoStarCount: 0,
          oneStarCount: 0
        },
        { where: { id: professionalId } }
      );
      return;
    }

    let sum = 0;
    let fiveStarCount = 0;
    let fourStarCount = 0;
    let threeStarCount = 0;
    let twoStarCount = 0;
    let oneStarCount = 0;

    for (const r of reviews) {
      sum += r.rating;
      if (r.rating === 5) fiveStarCount++;
      else if (r.rating === 4) fourStarCount++;
      else if (r.rating === 3) threeStarCount++;
      else if (r.rating === 2) twoStarCount++;
      else if (r.rating === 1) oneStarCount++;
    }

    const ratingAverage = Number((sum / totalReviews).toFixed(2));

    await ProfessionalProfileModel.update(
      {
        ratingAverage,
        totalReviews,
        fiveStarCount,
        fourStarCount,
        threeStarCount,
        twoStarCount,
        oneStarCount
      },
      { where: { id: professionalId } }
    );
  }

  public async create(item: Partial<ProfessionalProfileModel>): Promise<ProfessionalProfileModel> {
    return ProfessionalProfileModel.create(item as any);
  }

  public async update(id: string, item: Partial<ProfessionalProfileModel>): Promise<ProfessionalProfileModel | null> {
    const profile = await ProfessionalProfileModel.findByPk(id);
    if (!profile) return null;
    await profile.update(item);
    return profile;
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await ProfessionalProfileModel.destroy({ where: { id } });
    return rows > 0;
  }
}
