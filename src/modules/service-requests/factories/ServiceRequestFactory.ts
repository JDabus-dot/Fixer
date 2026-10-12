import { ServiceRequestModel, IServiceRequestCreationAttributes } from '../models/ServiceRequestModel.js';
import { CreateServiceRequestDTO } from '../dtos/ServiceRequestDTOs.js';
import { IServiceRequestRepository } from '../interfaces/IServiceRequestRepository.js';

/**
 * Patrón Creacional: FACTORY METHOD (ServiceRequestCreator).
 * Desacopla y encapsula la creación de solicitudes de servicio,
 * orquestando diferentes comportamientos y valores por defecto
 * para solicitudes estándar vs urgencias.
 */
export abstract class ServiceRequestCreator {
  public abstract buildCreationAttributes(
    clientId: string,
    dto: CreateServiceRequestDTO
  ): IServiceRequestCreationAttributes;

  public async create(
    repository: IServiceRequestRepository,
    clientId: string,
    dto: CreateServiceRequestDTO
  ): Promise<ServiceRequestModel> {
    const attributes = this.buildCreationAttributes(clientId, dto);
    return repository.create(attributes);
  }
}

/**
 * Creador concreto para Solicitudes Estándar (Standard).
 */
export class StandardServiceRequestCreator extends ServiceRequestCreator {
  public buildCreationAttributes(
    clientId: string,
    dto: CreateServiceRequestDTO
  ): IServiceRequestCreationAttributes {
    return {
      clientId,
      professionalId: dto.professionalId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      serviceAddress: dto.serviceAddress,
      zone: dto.zone,
      isUrgent: false,
      scheduledDate: dto.scheduledDate || null,
      status: 'PENDING'
    };
  }
}

/**
 * Creador concreto para Solicitudes de Urgencia (Urgent).
 * Asigna prioridad inmediata y fecha actual por defecto si no se especifica.
 */
export class UrgentServiceRequestCreator extends ServiceRequestCreator {
  public buildCreationAttributes(
    clientId: string,
    dto: CreateServiceRequestDTO
  ): IServiceRequestCreationAttributes {
    return {
      clientId,
      professionalId: dto.professionalId,
      title: dto.title.startsWith('[URGENTE]') ? dto.title : `[URGENTE] ${dto.title}`,
      description: dto.description,
      category: dto.category,
      serviceAddress: dto.serviceAddress,
      zone: dto.zone,
      isUrgent: true,
      scheduledDate: dto.scheduledDate || new Date(),
      status: 'PENDING'
    };
  }
}

/**
 * Fábrica de Solicitudes de Servicio (ServiceRequestFactory).
 * Resuelve dinámicamente el creador apropiado según el requerimiento.
 */
export class ServiceRequestFactory {
  public static getCreator(isUrgent?: boolean): ServiceRequestCreator {
    return isUrgent ? new UrgentServiceRequestCreator() : new StandardServiceRequestCreator();
  }
}
