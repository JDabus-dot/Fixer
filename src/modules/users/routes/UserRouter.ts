import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import { UpdateUserSchema } from '../dtos/UserDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * Enrutador modular POO para el recurso de usuarios.
 */
export class UserRouter {
  private readonly router: Router;
  private readonly userController: UserController;
  private readonly authMiddleware: AuthMiddleware;

  constructor(userController: UserController, authMiddleware = new AuthMiddleware()) {
    this.router = Router();
    this.userController = userController;
    this.authMiddleware = authMiddleware;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      '/me',
      this.authMiddleware.authenticate,
      AsyncHandler.wrap(this.userController.getMyProfile)
    );

    this.router.patch(
      '/me',
      this.authMiddleware.authenticate,
      ValidationMiddleware.validateBody(UpdateUserSchema),
      AsyncHandler.wrap(this.userController.updateMyProfile)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
