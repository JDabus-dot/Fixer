import http from 'http';
import { App } from './app.js';
import { EnvConfig } from './config/EnvConfig.js';
import { DatabaseConnection } from './database/DatabaseConnection.js';
import { ModelRegistry } from './database/ModelRegistry.js';
import { DatabaseSeeder } from './database/DatabaseSeeder.js';

/**
 * Clase Server encargada del ciclo de vida y arranque del servidor HTTP y base de datos.
 */
export class Server {
  private server?: http.Server;
  private readonly appInstance: App;
  private readonly dbConnection: DatabaseConnection;

  constructor() {
    this.appInstance = new App();
    this.dbConnection = DatabaseConnection.getInstance();
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 Iniciando backend de Fixer Marketplace...');

      // 1. Inicializar conexión a PostgreSQL
      await this.dbConnection.authenticate();

      // 2. Registrar modelos y relaciones
      ModelRegistry.initModels(this.dbConnection.getSequelize());

      // 3. Sincronizar esquemas
      await this.dbConnection.sync();

      // 4. Poblar datos iniciales si la BD está vacía
      const seeder = new DatabaseSeeder();
      await seeder.seed();

      // 5. Iniciar servidor HTTP
      const port = EnvConfig.PORT;
      this.server = this.appInstance.app.listen(port, () => {
        console.log(`=======================================================`);
        console.log(`🔨 Fixer Marketplace Backend iniciado con éxito!`);
        console.log(`📡 URL Base: http://localhost:${port}/api/v1`);
        console.log(`🩺 Health Check: http://localhost:${port}/api/v1/health`);
        console.log(`🌍 Entorno: ${EnvConfig.NODE_ENV}`);
        console.log(`=======================================================`);
      });

      this.setupGracefulShutdown();
    } catch (error) {
      console.error('❌ Error fatal al iniciar el servidor:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const handleShutdown = async (signal: string) => {
      console.log(`\n🛑 Recibida señal ${signal}. Cerrando servidor graceful...`);

      if (this.server) {
        this.server.close(async () => {
          console.log('🔌 Servidor HTTP cerrado.');
          await this.dbConnection.close();
          console.log('👋 Apagado completado con éxito.');
          process.exit(0);
        });
      } else {
        await this.dbConnection.close();
        process.exit(0);
      }
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  }
}

// Punto de entrada de la aplicación
const server = new Server();
server.start();
