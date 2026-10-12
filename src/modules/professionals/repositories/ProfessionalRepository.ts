import { ProfessionalProfileModel } from '../models/ProfessionalProfileModel.js';
import {
  IProfessionalRepository,
  IProfessionalSearchFilters,
  IProfessionalSearchResult
} from '../interfaces/IProfessionalRepository.js';
import { UserModel } from '../../users/models/UserModel.js';
import { ReviewModel } from '../../reviews/models/ReviewModel.js';
import { ProfessionalSearchQueryBuilder } from '../builders/ProfessionalSearchQueryBuilder.js';

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
    // Patrón Creacional: BUILDER para consultas complejas de búsqueda
    const queryBuilder = ProfessionalSearchQueryBuilder.fromFilters(filters);
    const queryOptions = queryBuilder.build();

    const { count, rows } = await ProfessionalProfileModel.findAndCountAll(queryOptions);
    const { page, limit } = queryBuilder.getPagination();

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
