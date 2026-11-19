import { Router } from 'express';
import { ServiceRequestController } from '../controllers/ServiceRequestController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import {
  CreateServiceRequestSchema,
  UpdateRequestStatusSchema
} from '../dtos/ServiceRequestDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * @swagger
 * tags:
 *   - name: Service Requests
 *     description: Gestión de solicitudes de servicio.
 */

/**
 * Enrutador modular POO para el recurso de solicitudes de servicio.
 */
export class ServiceRequestRouter {
  private readonly router: Router;
  private readonly requestController: ServiceRequestController;
  private readonly authMiddleware: AuthMiddleware;

  constructor(requestController: ServiceRequestController, authMiddleware = new AuthMiddleware()) {
    this.router = Router();
    this.requestController = requestController;
    this.authMiddleware = authMiddleware;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /service-requests:
     *   post:
     *     summary: Crear una solicitud de servicio
     *     description: Permite crear solicitudes estándar o urgentes.
     *     tags: [Service Requests]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [professionalId, title, description, category, serviceAddress, zone]
     *             properties:
     *               professionalId: { type: string, format: uuid }
     *               title: { type: string, minLength: 5 }
     *               description: { type: string, minLength: 10 }
     *               category: { type: string, minLength: 2 }
     *               serviceAddress: { type: string, minLength: 5 }
     *               zone: { type: string, minLength: 2 }
     *               isUrgent: { type: boolean, default: false }
     *               scheduledDate: { type: string, format: date-time }
     *     responses:
     *       201:
     *         description: Solicitud de servicio enviada con éxito
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       400:
     *         description: No se permite solicitar un servicio a uno mismo
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
      ValidationMiddleware.validateBody(CreateServiceRequestSchema),
      AsyncHandler.wrap(this.requestController.create)
    );

    /**
     * @swagger
     * /service-requests/client/my-requests:
     *   get:
     *     summary: Obtener mis solicitudes como cliente
     *     tags: [Service Requests]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Solicitudes como cliente obtenidas correctamente
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
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     */
    this.router.get(
      '/client/my-requests',
      this.authMiddleware.authenticate,
      AsyncHandler.wrap(this.requestController.getMyClientRequests)
    );

    /**
     * @swagger
     * /service-requests/pro/my-requests:
     *   get:
     *     summary: Obtener mis solicitudes como profesional
     *     description: Requiere rol PROFESSIONAL o ADMIN.
     *     tags: [Service Requests]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Solicitudes asignadas obtenidas correctamente
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
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       403:
     *         $ref: '#/components/responses/Forbidden'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get(
      '/pro/my-requests',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['PROFESSIONAL', 'ADMIN']),
      AsyncHandler.wrap(this.requestController.getMyProRequests)
    );

    /**
     * @swagger
     * /service-requests/{id}/status:
     *   patch:
     *     summary: Actualizar el estado de una solicitud
     *     description: Solo el cliente de la solicitud o el profesional asignado pueden modificarla.
     *     tags: [Service Requests]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *         description: ID de la solicitud
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [status]
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [PENDING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED]
     *               reason: { type: string }
     *     responses:
     *       200:
     *         description: Estado de la solicitud actualizado correctamente
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
      '/:id/status',
      this.authMiddleware.authenticate,
      ValidationMiddleware.validateBody(UpdateRequestStatusSchema),
      AsyncHandler.wrap(this.requestController.updateStatus)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}