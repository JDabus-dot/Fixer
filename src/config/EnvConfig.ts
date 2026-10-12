import dotenv from 'dotenv';

// Carga las variables de entorno
dotenv.config();

/**
 * Clase POO para encapsular y tipar fuertemente la configuración de variables de entorno.
 * Aplica el principio de Responsabilidad Única (SRP).
 */
export class EnvConfig {
  public static readonly PORT: number = Number(process.env.PORT) || 3000;
  public static readonly NODE_ENV: string = process.env.NODE_ENV || 'development';

  public static readonly DB_HOST: string = process.env.DB_HOST || 'localhost';
  public static readonly DB_PORT: number = Number(process.env.DB_PORT) || 5432;
  public static readonly DB_NAME: string = process.env.DB_NAME || 'fixer_db';
  public static readonly DB_USER: string = process.env.DB_USER || 'postgres';
  public static readonly DB_PASSWORD: string = process.env.DB_PASSWORD || 'postgres';
  public static readonly DB_LOGGING: boolean = process.env.DB_LOGGING === 'true';

  public static readonly JWT_SECRET: string = process.env.JWT_SECRET || 'super_secret_jwt_key_fixer_trades_marketplace_2026';
  public static readonly JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

  public static readonly CORS_ORIGIN: string = process.env.CORS_ORIGIN || '*';
}
