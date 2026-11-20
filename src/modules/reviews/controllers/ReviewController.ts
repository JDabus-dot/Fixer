import { Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService.js';
import { IAuthenticatedRequest } from '../../../common/interfaces/index.js';
import { ApiResponseHelper } from '../../../common/utils/ApiResponseHelper.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

/**
 * Controlador POO para el recurso de reseñas y valoraciones.
 */
export class ReviewController {
  private readonly reviewService: ReviewService;

  constructor(reviewService: ReviewService) {
    this.reviewService = reviewService;
  }

  public create = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const review = await this.reviewService.createReview(req.user.id, req.body);
    return ApiResponseHelper.created(res, review, 'Reseña publicada exitosamente');
  };

  public getByProfessional = async (req: Request, res: Response): Promise<Response> => {
    const { professionalId } = req.params;
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    const reviews = await this.reviewService.getReviewsByProfessional(professionalId, limit, offset);
    return ApiResponseHelper.success(res, reviews, 'Reseñas obtenidas correctamente');
  };

  public reply = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params;
    const updated = await this.reviewService.replyToReview(id, req.user.id, req.body);
    return ApiResponseHelper.success(res, updated, 'Respuesta a la reseña guardada exitosamente');
  };
}
