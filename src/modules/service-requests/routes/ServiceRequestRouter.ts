import { Router } from 'express';
import { ServiceRequestController } from '../controllers/ServiceRequestController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import { CreateServiceRequestSchema, UpdateRequestStatusSchema } from '../dtos/ServiceRequestDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

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
    // Crear solicitud de servicio / presupuesto / urgencia (cliente autenticado)
    this.router.post(
      '/',
      this.authMiddleware.authenticate,
      ValidationMiddleware.validateBody(CreateServiceRequestSchema),
      AsyncHandler.wrap(this.requestController.create)
    );

    // Obtener solicitudes realizadas como cliente
    this.router.get(
      '/client/my-requests',
      this.authMiddleware.authenticate,
      AsyncHandler.wrap(this.requestController.getMyClientRequests)
    );

    // Obtener solicitudes asignadas como profesional
    this.router.get(
      '/pro/my-requests',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['PROFESSIONAL', 'ADMIN']),
      AsyncHandler.wrap(this.requestController.getMyProRequests)
    );

    // Cambiar estado de solicitud (Aceptar, Iniciar, Completar, Cancelar)
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
