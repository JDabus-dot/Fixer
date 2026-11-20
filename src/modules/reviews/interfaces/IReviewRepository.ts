import { IBaseRepository } from '../../../common/interfaces/index.js';
import { ReviewModel } from '../models/ReviewModel.js';

export interface IReviewRepository extends IBaseRepository<ReviewModel, string> {
  findByProfessionalId(professionalId: string, limit?: number, offset?: number): Promise<ReviewModel[]>;
  findByClientId(clientId: string): Promise<ReviewModel[]>;
  hasClientReviewed(clientId: string, professionalId: string): Promise<boolean>;
}
