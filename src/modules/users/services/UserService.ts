import { IUserRepository } from '../interfaces/IUserRepository.js';
import { NotFoundError } from '../../../common/errors/index.js';
import { UpdateUserDTO } from '../dtos/UserDTOs.js';
import { UserModel } from '../models/UserModel.js';

/**
 * Servicio de negocio POO para la gestión de usuarios.
 * Recibe IUserRepository mediante inyección de dependencias en el constructor.
 */
export class UserService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  public async getProfile(userId: string): Promise<UserModel> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    return user;
  }

  public async updateProfile(userId: string, data: UpdateUserDTO): Promise<UserModel> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const updated = await this.userRepository.update(userId, data as Partial<UserModel>);
    return updated!;
  }
}
