import { Router } from 'express';
import { ProfessionalController } from '../controllers/ProfessionalController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import {
  SearchProfessionalsSchema,
  UpdateProfessionalProfileSchema
} from '../dtos/ProfessionalDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * @swagger
 * tags:
 *   - name: Professionals
 *     description: Búsqueda y gestión de perfiles profesionales.
 */

/**
 * Enrutador modular POO para el recurso de profesionales.
 */
export class ProfessionalRouter {
  private readonly router: Router;
  private readonly professionalController: ProfessionalController;
  private readonly authMiddleware: AuthMiddleware;

  constructor(professionalController: ProfessionalController, authMiddleware = new AuthMiddleware()) {
    this.router = Router();
    this.professionalController = professionalController;
    this.authMiddleware = authMiddleware;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /professionals:
     *   get:
     *     summary: Buscar profesionales con filtros
     *     tags: [Professionals]
     *     parameters:
     *       - in: query
     *         name: query
     *         schema: { type: string }
     *       - in: query
     *         name: category
     *         schema: { type: string }
     *       - in: query
     *         name: zone
     *         schema: { type: string }
     *       - in: query
     *         name: city
     *         schema: { type: string }
     *       - in: query
     *         name: isVerified
     *         schema: { type: boolean }
     *       - in: query
     *         name: isEmergencyAvailable
     *         schema: { type: boolean }
     *       - in: query
     *         name: minRating
     *         schema: { type: number }
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [rating, urgency, experience]
     *           default: rating
     *       - in: query
     *         name: page
     *         schema: { type: integer, default: 1 }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 12 }
     *     responses:
     *       200:
     *         description: Listado paginado de profesionales
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
     *                     meta:
     *                       $ref: '#/components/schemas/PaginationMeta'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
    this.router.get(
      '/',
      ValidationMiddleware.validateQuery(SearchProfessionalsSchema),
      AsyncHandler.wrap(this.professionalController.search)
    );

    /**
     * @swagger
     * /professionals/me:
     *   get:
     *     summary: Obtener mi perfil profesional
     *     description: Requiere rol PROFESSIONAL o ADMIN.
     *     tags: [Professionals]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Perfil profesional obtenido correctamente
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
     */
    this.router.get(
      '/me',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['PROFESSIONAL', 'ADMIN']),
      AsyncHandler.wrap(this.professionalController.getMe)
    );

    /**
     * @swagger
     * /professionals/me:
     *   put:
     *     summary: Actualizar mi perfil profesional
     *     description: Requiere rol PROFESSIONAL o ADMIN.
     *     tags: [Professionals]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               tradeCategory: { type: string, minLength: 2 }
     *               headline: { type: string, minLength: 5 }
     *               bio: { type: string, minLength: 10 }
     *               licenseNumber: { type: string }
     *               experienceYears: { type: integer, minimum: 0 }
     *               city: { type: string }
     *               zone: { type: string }
     *               address: { type: string }
     *               coverageRadiusKm: { type: integer, minimum: 1 }
     *               responseTime: { type: string }
     *               isEmergencyAvailable: { type: boolean }
     *               specialties:
     *                 type: array
     *                 items: { type: string }
     *     responses:
     *       200:
     *         description: Perfil profesional actualizado exitosamente
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
    this.router.put(
      '/me',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['PROFESSIONAL', 'ADMIN']),
      ValidationMiddleware.validateBody(UpdateProfessionalProfileSchema),
      AsyncHandler.wrap(this.professionalController.updateMe)
    );

    /**
     * @swagger
     * /professionals/{id}:
     *   get:
     *     summary: Obtener el detalle de un profesional
     *     tags: [Professionals]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *         description: ID del perfil profesional
     *     responses:
     *       200:
     *         description: Detalle del profesional obtenido correctamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get(
      '/:id',
      AsyncHandler.wrap(this.professionalController.getById)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}