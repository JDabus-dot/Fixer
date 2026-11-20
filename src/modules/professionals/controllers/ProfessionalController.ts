import { Request, Response } from 'express';
import { ProfessionalService } from '../services/ProfessionalService.js';
import { ApiResponseHelper } from '../../../common/utils/ApiResponseHelper.js';
import { IAuthenticatedRequest } from '../../../common/interfaces/index.js';
import { UnauthorizedError } from '../../../common/errors/index.js';
import { SearchProfessionalsDTO } from '../dtos/ProfessionalDTOs.js';

/**
 * Controlador POO para el recurso de profesionales.
 */
export class ProfessionalController {
  private readonly professionalService: ProfessionalService;

  constructor(professionalService: ProfessionalService) {
    this.professionalService = professionalService;
  }

  public search = async (req: Request, res: Response): Promise<Response> => {
    const filters = req.query as unknown as SearchProfessionalsDTO;
    const result = await this.professionalService.search(filters);

    return ApiResponseHelper.paginated(
      res,
      result.professionals,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      `Se encontraron ${result.total} profesionales`
    );
  };

  public getById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const profile = await this.professionalService.getProfileById(id);
    return ApiResponseHelper.success(res, profile, 'Detalle del profesional obtenido correctamente');
  };

  public getMe = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const profile = await this.professionalService.getProfileByUserId(req.user.id);
    return ApiResponseHelper.success(res, profile, 'Perfil profesional obtenido correctamente');
  };

  public updateMe = async (req: IAuthenticatedRequest, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const updated = await this.professionalService.updateMyProfile(req.user.id, req.body);
    return ApiResponseHelper.success(res, updated, 'Perfil profesional actualizado exitosamente');
  };
}
