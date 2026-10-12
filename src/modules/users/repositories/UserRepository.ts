import { UserModel } from '../models/UserModel.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { ProfessionalProfileModel } from '../../professionals/models/ProfessionalProfileModel.js';

/**
 * Implementación POO del repositorio de Usuarios utilizando Sequelize.
 */
export class UserRepository implements IUserRepository {
  public async findById(id: string): Promise<UserModel | null> {
    return UserModel.findByPk(id, {
      attributes: { exclude: ['passwordHash', 'securityAnswerHash'] },
      include: [
        {
          model: ProfessionalProfileModel,
          as: 'professionalProfile'
        }
      ]
    });
  }

  public async findAll(filters?: Record<string, unknown>): Promise<UserModel[]> {
    return UserModel.findAll({
      where: filters,
      attributes: { exclude: ['passwordHash', 'securityAnswerHash'] }
    });
  }

  public async findByEmail(email: string): Promise<UserModel | null> {
    return UserModel.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: { exclude: ['passwordHash', 'securityAnswerHash'] },
      include: [
        {
          model: ProfessionalProfileModel,
          as: 'professionalProfile'
        }
      ]
    });
  }

  public async findByEmailWithPassword(email: string): Promise<UserModel | null> {
    return UserModel.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [
        {
          model: ProfessionalProfileModel,
          as: 'professionalProfile'
        }
      ]
    });
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.count({
      where: { email: email.toLowerCase().trim() }
    });
    return count > 0;
  }

  public async create(item: Partial<UserModel>): Promise<UserModel> {
    return UserModel.create(item as any);
  }

  public async update(id: string, item: Partial<UserModel>): Promise<UserModel | null> {
    const user = await UserModel.findByPk(id);
    if (!user) return null;
    await user.update(item);
    return user;
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await UserModel.destroy({ where: { id } });
    return rows > 0;
  }
}
