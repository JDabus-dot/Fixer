import { Sequelize } from 'sequelize';
import { EnvConfig } from '../config/EnvConfig.js';

/**
 * Clase Singleton para gestionar la conexión a la base de datos PostgreSQL con Sequelize.
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private readonly sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize(
      EnvConfig.DB_NAME,
      EnvConfig.DB_USER,
      EnvConfig.DB_PASSWORD,
      {
        host: EnvConfig.DB_HOST,
        port: EnvConfig.DB_PORT,
        dialect: 'postgres',
        logging: EnvConfig.DB_LOGGING ? (msg: string) => console.log(`[SQL]: ${msg}`) : false,
        pool: {
          max: 15,
          min: 2,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true
        }
      }
    );
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getSequelize(): Sequelize {
    return this.sequelize;
  }

  public async authenticate(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('✅ Conexión a PostgreSQL establecida exitosamente.');
    } catch (error) {
      console.error('❌ Error conectando a PostgreSQL:', error);
      throw error;
    }
  }

  public async sync(alter = false): Promise<void> {
    try {
      await this.sequelize.sync({ alter });
      console.log('✅ Modelos sincronizados con PostgreSQL.');
    } catch (error) {
      console.error('❌ Error sincronizando modelos de Sequelize:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.sequelize.close();
    console.log('ℹ️ Conexión a PostgreSQL cerrada.');
  }
}
