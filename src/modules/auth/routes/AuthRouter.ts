import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { ValidationMiddleware } from '../../../common/middlewares/ValidationMiddleware.js';
import {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  VerifyAccountSchema
} from '../dtos/AuthDTOs.js';
import { AsyncHandler } from '../../../common/utils/AsyncHandler.js';

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticación y recuperación de cuentas.
 */

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
    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Registrar un usuario
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [fullName, email, phone, password, securityQuestion, securityAnswer]
     *             properties:
     *               fullName: { type: string, minLength: 3 }
     *               email: { type: string, format: email }
     *               phone: { type: string, minLength: 8 }
     *               password: { type: string, minLength: 8, format: password }
     *               securityQuestion: { type: string, minLength: 3 }
     *               securityAnswer: { type: string, minLength: 2 }
     *               isPro: { type: boolean, default: false }
     *               tradeCategory: { type: string }
     *     responses:
     *       201:
     *         description: Usuario registrado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       409:
     *         $ref: '#/components/responses/Conflict'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
    this.router.post(
      '/register',
      ValidationMiddleware.validateBody(RegisterSchema),
      AsyncHandler.wrap(this.authController.register)
    );

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Iniciar sesión y obtener un token JWT
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, password]
     *             properties:
     *               email: { type: string, format: email }
     *               password: { type: string, minLength: 1, format: password }
     *               rememberMe: { type: boolean, default: false }
     *     responses:
     *       200:
     *         description: Inicio de sesión exitoso
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AuthResponse'
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
    this.router.post(
      '/login',
      ValidationMiddleware.validateBody(LoginSchema),
      AsyncHandler.wrap(this.authController.login)
    );

    /**
     * @swagger
     * /auth/verify-account:
     *   post:
     *     summary: Verificar una cuenta y obtener su pregunta de seguridad
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email]
     *             properties:
     *               email: { type: string, format: email }
     *     responses:
     *       200:
     *         description: Cuenta verificada correctamente
     *         content:
     *           application/json:
     *             example:
     *               success: true
     *               message: Cuenta verificada correctamente
     *               data:
     *                 email: usuario@example.com
     *                 securityQuestion: ¿Cómo se llama tu mascota?
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
    this.router.post(
      '/verify-account',
      ValidationMiddleware.validateBody(VerifyAccountSchema),
      AsyncHandler.wrap(this.authController.verifyAccount)
    );

    /**
     * @swagger
     * /auth/reset-password:
     *   post:
     *     summary: Restablecer la contraseña
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [email, securityAnswer, newPassword]
     *             properties:
     *               email: { type: string, format: email }
     *               securityAnswer: { type: string, minLength: 1 }
     *               newPassword: { type: string, minLength: 8, format: password }
     *     responses:
     *       200:
     *         description: Contraseña restablecida correctamente
     *         content:
     *           application/json:
     *             example:
     *               success: true
     *               message: Tu contraseña ha sido restablecida con éxito.
     *               data:
     *                 message: Tu contraseña ha sido restablecida con éxito.
     *       401:
     *         $ref: '#/components/responses/Unauthorized'
     *       404:
     *         $ref: '#/components/responses/NotFound'
     *       422:
     *         $ref: '#/components/responses/ValidationError'
     */
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