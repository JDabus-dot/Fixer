import { ReviewModel } from '../models/ReviewModel.js';
import { IReviewRepository } from '../interfaces/IReviewRepository.js';
import { UserModel } from '../../users/models/UserModel.js';

/**
 * Implementación POO del repositorio de Reseñas con Sequelize.
 */
export class ReviewRepository implements IReviewRepository {
  public async findById(id: string): Promise<ReviewModel | null> {
    return ReviewModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: 'client',
          attributes: ['id', 'fullName', 'avatarUrl']
        }
      ]
    });
  }

  public async findAll(filters?: Record<string, unknown>): Promise<ReviewModel[]> {
    return ReviewModel.findAll({
      where: filters,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserModel,
          as: 'client',
          attributes: ['id', 'fullName', 'avatarUrl']
        }
      ]
    });
  }

  public async findByProfessionalId(professionalId: string, limit = 20, offset = 0): Promise<ReviewModel[]> {
    return ReviewModel.findAll({
      where: { professionalId },
      include: [
        {
          model: UserModel,
          as: 'client',
          attributes: ['id', 'fullName', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  public async findByClientId(clientId: string): Promise<ReviewModel[]> {
    return ReviewModel.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']]
    });
  }

  public async hasClientReviewed(clientId: string, professionalId: string): Promise<boolean> {
    const count = await ReviewModel.count({
      where: { clientId, professionalId }
    });
    return count > 0;
  }

  public async create(item: Partial<ReviewModel>): Promise<ReviewModel> {
    return ReviewModel.create(item as any);
  }

  public async update(id: string, item: Partial<ReviewModel>): Promise<ReviewModel | null> {
    const review = await ReviewModel.findByPk(id);
    if (!review) return null;
    await review.update(item);
    return review;
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await ReviewModel.destroy({ where: { id } });
    return rows > 0;
  }
}
