import { IBaseRepository } from '../../../common/interfaces/index.js';
import { ServiceRequestModel, ServiceRequestStatus } from '../models/ServiceRequestModel.js';

export interface IServiceRequestRepository extends IBaseRepository<ServiceRequestModel, string> {
  findByClientId(clientId: string): Promise<ServiceRequestModel[]>;
  findByProfessionalId(professionalId: string): Promise<ServiceRequestModel[]>;
  updateStatus(id: string, status: ServiceRequestStatus, reason?: string): Promise<ServiceRequestModel | null>;
}
