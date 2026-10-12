import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import { LoginSchema, RegisterSchema, ResetPasswordSchema, VerifyAccountSchema } from '../dtos/AuthDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * Enrutador modular POO para autenticación.
 */
export class AuthRouter {
  private readonly router: Router;
  private readonly authController: AuthController;

  constructor(authController: AuthController) {
    this.router = Router();
    this.authController = authController;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      '/register',
      ValidationMiddleware.validateBody(RegisterSchema),
      AsyncHandler.wrap(this.authController.register)
    );

    this.router.post(
      '/login',
      ValidationMiddleware.validateBody(LoginSchema),
      AsyncHandler.wrap(this.authController.login)
    );

    this.router.post(
      '/verify-account',
      ValidationMiddleware.validateBody(VerifyAccountSchema),
      AsyncHandler.wrap(this.authController.verifyAccount)
    );

    this.router.post(
      '/reset-password',
      ValidationMiddleware.validateBody(ResetPasswordSchema),
      AsyncHandler.wrap(this.authController.resetPassword)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
