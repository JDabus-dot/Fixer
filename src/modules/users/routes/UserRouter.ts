import { Router } from 'express';
import { UserController } from '../controllers/UserController.js';
import { AuthMiddleware } from '../../../common/middlewares/AuthMiddleware.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import { UpdateUserSchema } from '../dtos/UserDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gestión del perfil de usuario.
 */

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
    /**
     * @swagger
     * /users/me:
     *   get:
     *     summary: Obtener mi perfil
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Perfil obtenido correctamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     */
    this.router.get(
      '/me',
      this.authMiddleware.authenticate,
      AsyncHandler.wrap(this.userController.getMyProfile)
    );

    /**
     * @swagger
     * /users/me:
     *   patch:
     *     summary: Actualizar mi perfil
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               fullName: { type: string, minLength: 2 }
     *               phone: { type: string, minLength: 6 }
     *               avatarUrl: { type: string, format: uri, nullable: true }
     *     responses:
     *       200:
     *         description: Perfil actualizado correctamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SuccessResponse'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
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