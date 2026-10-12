import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { EnvConfig } from './config/EnvConfig.js';
import { ErrorHandlerMiddleware } from './common/middlewares/ErrorHandlerMiddleware.js';
import { ApiResponseHelper } from './common/utils/ApiResponseHelper.js';
import { NotFoundError } from './common/errors/index.js';

// Repositorios
import { UserRepository } from './modules/users/repositories/UserRepository.js';
import { ProfessionalRepository } from './modules/professionals/repositories/ProfessionalRepository.js';
import { ReviewRepository } from './modules/reviews/repositories/ReviewRepository.js';
import { ServiceRequestRepository } from './modules/service-requests/repositories/ServiceRequestRepository.js';

// Servicios
import { UserService } from './modules/users/services/UserService.js';
import { AuthService } from './modules/auth/services/AuthService.js';
import { ProfessionalService } from './modules/professionals/services/ProfessionalService.js';
import { ReviewService } from './modules/reviews/services/ReviewService.js';
import { ServiceRequestService } from './modules/service-requests/services/ServiceRequestService.js';

// Controladores
import { UserController } from './modules/users/controllers/UserController.js';
import { AuthController } from './modules/auth/controllers/AuthController.js';
import { ProfessionalController } from './modules/professionals/controllers/ProfessionalController.js';
import { ReviewController } from './modules/reviews/controllers/ReviewController.js';
import { ServiceRequestController } from './modules/service-requests/controllers/ServiceRequestController.js';

// Enrutadores
import { UserRouter } from './modules/users/routes/UserRouter.js';
import { AuthRouter } from './modules/auth/routes/AuthRouter.js';
import { ProfessionalRouter } from './modules/professionals/routes/ProfessionalRouter.js';
import { ReviewRouter } from './modules/reviews/routes/ReviewRouter.js';
import { ServiceRequestRouter } from './modules/service-requests/routes/ServiceRequestRouter.js';
import { AuthMiddleware } from './common/middlewares/AuthMiddleware.js';

/**
 * Clase principal de la Aplicación Express bajo POO.
 * Encapsula la configuración de middlewares, inyección de dependencias y registro de rutas.
 */
export class App {
  public readonly app: Application;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: EnvConfig.CORS_ORIGIN,
        credentials: true
      })
    );
    this.app.use(morgan(EnvConfig.NODE_ENV === 'production' ? 'combined' : 'dev'));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // 1. Inyección de Dependencias (DIP)
    const userRepository = new UserRepository();
    const professionalRepository = new ProfessionalRepository();
    const reviewRepository = new ReviewRepository();
    const serviceRequestRepository = new ServiceRequestRepository();

    const authMiddleware = new AuthMiddleware();

    const userService = new UserService(userRepository);
    const authService = new AuthService(userRepository);
    const professionalService = new ProfessionalService(professionalRepository);
    const reviewService = new ReviewService(reviewRepository, professionalRepository);
    const serviceRequestService = new ServiceRequestService(serviceRequestRepository, professionalRepository);

    const userController = new UserController(userService);
    const authController = new AuthController(authService);
    const professionalController = new ProfessionalController(professionalService);
    const reviewController = new ReviewController(reviewService);
    const serviceRequestController = new ServiceRequestController(serviceRequestService);

    const userRouter = new UserRouter(userController, authMiddleware);
    const authRouter = new AuthRouter(authController);
    const professionalRouter = new ProfessionalRouter(professionalController, authMiddleware);
    const reviewRouter = new ReviewRouter(reviewController, authMiddleware);
    const serviceRequestRouter = new ServiceRequestRouter(serviceRequestController, authMiddleware);

    // 2. Ruta de Salud / Healthcheck para Docker y monitoreo
    this.app.get('/api/v1/health', (_req: Request, res: Response) => {
      ApiResponseHelper.success(
        res,
        {
          status: 'UP',
          timestamp: new Date().toISOString(),
          environment: EnvConfig.NODE_ENV,
          service: 'fixer-marketplace-backend'
        },
        'Fixer API funcionando correctamente'
      );
    });

    // 3. Montaje de rutas de la API v1
    this.app.use('/api/v1/auth', authRouter.getRouter());
    this.app.use('/api/v1/users', userRouter.getRouter());
    this.app.use('/api/v1/professionals', professionalRouter.getRouter());
    this.app.use('/api/v1/reviews', reviewRouter.getRouter());
    this.app.use('/api/v1/service-requests', serviceRequestRouter.getRouter());

    // 4. Ruta no encontrada (404)
    this.app.use((req: Request, _res: Response) => {
      throw new NotFoundError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    });
  }

  private setupErrorHandling(): void {
    this.app.use(ErrorHandlerMiddleware.handle);
  }
}
