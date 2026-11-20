import { IBaseRepository } from '../../../common/interfaces/index.js';
import { IUserAttributes, UserModel } from '../models/UserModel.js';

/**
 * Contrato de persistencia para la entidad Usuario (ISP).
 */
export interface IUserRepository extends IBaseRepository<UserModel, string> {
  findByEmail(email: string): Promise<UserModel | null>;
  findByEmailWithPassword(email: string): Promise<UserModel | null>;
  existsByEmail(email: string): Promise<boolean>;
}
