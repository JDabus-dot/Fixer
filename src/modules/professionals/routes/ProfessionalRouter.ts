import { Router } from 'express';
import { ProfessionalController } from '../controllers/ProfessionalController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import { SearchProfessionalsSchema, UpdateProfessionalProfileSchema } from '../dtos/ProfessionalDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

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
    // Búsqueda pública con filtros (Categoría, zona, disponibilidad hoy, matriculados, ordenamiento)
    this.router.get(
      '/',
      ValidationMiddleware.validateQuery(SearchProfessionalsSchema),
      AsyncHandler.wrap(this.professionalController.search)
    );

    // Perfil profesional del usuario autenticado
    this.router.get(
      '/me',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['PROFESSIONAL', 'ADMIN']),
      AsyncHandler.wrap(this.professionalController.getMe)
    );

    // Actualización de perfil profesional del usuario autenticado
    this.router.put(
      '/me',
      this.authMiddleware.authenticate,
      this.authMiddleware.authorize(['PROFESSIONAL', 'ADMIN']),
      ValidationMiddleware.validateBody(UpdateProfessionalProfileSchema),
      AsyncHandler.wrap(this.professionalController.updateMe)
    );

    // Detalle público de un profesional por ID (como Carlos Mendoza)
    this.router.get(
      '/:id',
      AsyncHandler.wrap(this.professionalController.getById)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
