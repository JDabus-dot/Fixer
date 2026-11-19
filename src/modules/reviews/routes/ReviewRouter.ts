import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import { CreateReviewSchema, ReplyReviewSchema } from '../dtos/ReviewDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: Gestión de reseñas y valoraciones.
 */

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
    /**
     * @swagger
     * /reviews/professional/{professionalId}:
     *   get:
     *     summary: Obtener las reseñas de un profesional
     *     tags: [Reviews]
     *     parameters:
     *       - in: path
     *         name: professionalId
     *         required: true
     *         schema: { type: string }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 20 }
     *       - in: query
     *         name: offset
     *         schema: { type: integer, default: 0 }
     *     responses:
     *       200:
     *         description: Reseñas obtenidas correctamente
     *         content:
     *           application/json:
     *             schema:
     *               allOf:
     *                 - $ref: '#/components/schemas/SuccessResponse'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: array
     *                       items: { type: object }
     */
    this.router.get(
      '/professional/:professionalId',
      AsyncHandler.wrap(this.reviewController.getByProfessional)
    );

    /**
     * @swagger
     * /reviews:
     *   post:
     *     summary: Publicar una reseña
     *     description: Actualiza las valoraciones del profesional. No permite calificar el perfil propio.
     *     tags: [Reviews]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [professionalId, rating, serviceType, comment]
     *             properties:
     *               professionalId: { type: string, format: uuid }
     *               rating: { type: integer, minimum: 1, maximum: 5 }
     *               serviceType: { type: string, minLength: 3 }
     *               comment: { type: string, minLength: 20 }
     *               isVerifiedVisit: { type: boolean, default: true }
     *     responses:
     *       201:
     *         description: Reseña publicada exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         description: No se permite publicar una reseña en el perfil propio
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
    this.router.post(
      '/',
      this.authMiddleware.authenticate,
      ValidationMiddleware.validateBody(CreateReviewSchema),
      AsyncHandler.wrap(this.reviewController.create)
    );

    /**
     * @swagger
     * /reviews/{id}/reply:
     *   patch:
     *     summary: Responder a una reseña
     *     description: Requiere rol PROFESSIONAL o ADMIN y ser el propietario del perfil evaluado.
     *     tags: [Reviews]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *         description: ID de la reseña
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [reply]
     *             properties:
     *               reply: { type: string, minLength: 3 }
     *     responses:
     *       200:
     *         description: Respuesta a la reseña guardada exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
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