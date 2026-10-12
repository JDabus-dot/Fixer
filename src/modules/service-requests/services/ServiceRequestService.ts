import { IServiceRequestRepository } from '../interfaces/IServiceRequestRepository.js';
import { IProfessionalRepository } from '../../professionals/interfaces/IProfessionalRepository.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../../common/errors/index.js';
import { CreateServiceRequestDTO, UpdateRequestStatusDTO } from '../dtos/ServiceRequestDTOs.js';
import { ServiceRequestModel } from '../models/ServiceRequestModel.js';

/**
 * Servicio POO para la lógica de negocio de órdenes de servicio y cotizaciones.
 */
export class ServiceRequestService {
  private readonly requestRepository: IServiceRequestRepository;
  private readonly professionalRepository: IProfessionalRepository;

  constructor(
    requestRepository: IServiceRequestRepository,
    professionalRepository: IProfessionalRepository
  ) {
    this.requestRepository = requestRepository;
    this.professionalRepository = professionalRepository;
  }

  public async createRequest(clientId: string, dto: CreateServiceRequestDTO): Promise<ServiceRequestModel> {
    const professional = await this.professionalRepository.findById(dto.professionalId);
    if (!professional) {
      throw new NotFoundError('Profesional no encontrado');
    }

    if (professional.userId === clientId) {
      throw new BadRequestError('No podés solicitarte un servicio a vos mismo');
    }

    return this.requestRepository.create({
      clientId,
      professionalId: dto.professionalId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      serviceAddress: dto.serviceAddress,
      zone: dto.zone,
      isUrgent: dto.isUrgent,
      scheduledDate: dto.scheduledDate,
      estimatedBudget: dto.estimatedBudget || professional.basePrice,
      status: 'PENDING'
    });
  }

  public async getMyRequestsAsClient(clientId: string): Promise<ServiceRequestModel[]> {
    return this.requestRepository.findByClientId(clientId);
  }

  public async getMyRequestsAsProfessional(userId: string): Promise<ServiceRequestModel[]> {
    const profile = await this.professionalRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Perfil profesional no encontrado');
    }
    return this.requestRepository.findByProfessionalId(profile.id);
  }

  public async updateStatus(
    requestId: string,
    currentUserId: string,
    dto: UpdateRequestStatusDTO
  ): Promise<ServiceRequestModel> {
    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Solicitud de servicio no encontrada');
    }

    const professional = await this.professionalRepository.findById(request.professionalId);

    // Solo el cliente de la solicitud o el profesional asignado pueden cambiar el estado
    const isClient = request.clientId === currentUserId;
    const isPro = professional && professional.userId === currentUserId;

    if (!isClient && !isPro) {
      throw new ForbiddenError('No tenés permiso para modificar esta solicitud');
    }

    const updated = await this.requestRepository.updateStatus(requestId, dto.status, dto.reason);
    return updated!;
  }
}
