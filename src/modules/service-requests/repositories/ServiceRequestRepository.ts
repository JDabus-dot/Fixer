import { ServiceRequestModel, ServiceRequestStatus } from '../models/ServiceRequestModel.js';
import { IServiceRequestRepository } from '../interfaces/IServiceRequestRepository.js';
import { UserModel } from '../../users/models/UserModel.js';
import { ProfessionalProfileModel } from '../../professionals/models/ProfessionalProfileModel.js';

/**
 * Implementación POO del repositorio de Solicitudes de Servicio con Sequelize.
 */
export class ServiceRequestRepository implements IServiceRequestRepository {
  public async findById(id: string): Promise<ServiceRequestModel | null> {
    return ServiceRequestModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: 'client',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        },
        {
          model: ProfessionalProfileModel,
          as: 'professional',
          include: [
            {
              model: UserModel,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
            }
          ]
        }
      ]
    });
  }

  public async findAll(filters?: Record<string, unknown>): Promise<ServiceRequestModel[]> {
    return ServiceRequestModel.findAll({
      where: filters,
      order: [['createdAt', 'DESC']]
    });
  }

  public async findByClientId(clientId: string): Promise<ServiceRequestModel[]> {
    return ServiceRequestModel.findAll({
      where: { clientId },
      include: [
        {
          model: ProfessionalProfileModel,
          as: 'professional',
          include: [
            {
              model: UserModel,
              as: 'user',
              attributes: ['id', 'fullName', 'phone']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  public async findByProfessionalId(professionalId: string): Promise<ServiceRequestModel[]> {
    return ServiceRequestModel.findAll({
      where: { professionalId },
      include: [
        {
          model: UserModel,
          as: 'client',
          attributes: ['id', 'fullName', 'email', 'phone', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  public async updateStatus(
    id: string,
    status: ServiceRequestStatus,
    reason?: string
  ): Promise<ServiceRequestModel | null> {
    const request = await ServiceRequestModel.findByPk(id);
    if (!request) return null;

    await request.update({
      status,
      cancellationReason: reason || request.cancellationReason
    });
    return request;
  }

  public async create(item: Partial<ServiceRequestModel>): Promise<ServiceRequestModel> {
    return ServiceRequestModel.create(item as any);
  }

  public async update(id: string, item: Partial<ServiceRequestModel>): Promise<ServiceRequestModel | null> {
    const request = await ServiceRequestModel.findByPk(id);
    if (!request) return null;
    await request.update(item);
    return request;
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await ServiceRequestModel.destroy({ where: { id } });
    return rows > 0;
  }
}
