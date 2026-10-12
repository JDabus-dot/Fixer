import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import { CreateReviewSchema, ReplyReviewSchema } from '../dtos/ReviewDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * Enrutador modular POO para el recurso de reseñas.
 */
export class ReviewRouter {
  private readonly router: Router;
  private readonly reviewController: ReviewController;
  private readonly authMiddleware: AuthMiddleware;

  constructor(reviewController: ReviewController, authMiddleware = new AuthMiddleware()) {
    this.router = Router();
    this.reviewController = reviewController;
    this.authMiddleware = authMiddleware;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Obtener reseñas públicas de un profesional
    this.router.get(
      '/professional/:professionalId',
      AsyncHandler.wrap(this.reviewController.getByProfessional)
    );

    // Publicar una nueva reseña (cliente autenticado)
    this.router.post(
      '/',
      this.authMiddleware.authenticate,
      ValidationMiddleware.validateBody(CreateReviewSchema),
      AsyncHandler.wrap(this.reviewController.create)
    );

    // Responder a una reseña (profesional autenticado)
    this.router.patch(
      '/:id/reply',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['PROFESSIONAL', 'ADMIN']),
      ValidationMiddleware.validateBody(ReplyReviewSchema),
      AsyncHandler.wrap(this.reviewController.reply)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
