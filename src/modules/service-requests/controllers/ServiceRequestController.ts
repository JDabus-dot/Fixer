import { Response } from 'express';
import { ServiceRequestService } from '../services/ServiceRequestService.js';
import { IAuthenticatedRequest } from '../../../common/interfaces/index.js';
import { ApiResponseHelper } from '../../../common/utils/ApiResponseHelper.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

/**
 * Controlador POO para el recurso de solicitudes de servicio.
 */
export class ServiceRequestController {
  private readonly requestService: ServiceRequestService;

  constructor(requestService: ServiceRequestService) {
    this.requestService = requestService;
  }

  public create = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const serviceRequest = await this.requestService.createRequest(req.user.id, req.body);
    return ApiResponseHelper.created(res, serviceRequest, 'Solicitud de servicio enviada con éxito');
  };

  public getMyClientRequests = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const requests = await this.requestService.getMyRequestsAsClient(req.user.id);
    return ApiResponseHelper.success(res, requests, 'Solicitudes como cliente obtenidas correctamente');
  };

  public getMyProRequests = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const requests = await this.requestService.getMyRequestsAsProfessional(req.user.id);
    return ApiResponseHelper.success(res, requests, 'Solicitudes asignadas como profesional obtenidas correctamente');
  };

  public updateStatus = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { id } = req.params;
    const updated = await this.requestService.updateStatus(id, req.user.id, req.body);
    return ApiResponseHelper.success(res, updated, 'Estado de la solicitud actualizado correctamente');
  };
}
