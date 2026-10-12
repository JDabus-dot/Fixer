import {
  IProfessionalRepository,
  IProfessionalSearchFilters,
  IProfessionalSearchResult
} from '../interfaces/IProfessionalRepository.js';
import { NotFoundError } from '../../../common/errors/index.js';
import { UpdateProfessionalProfileDTO } from '../dtos/ProfessionalDTOs.js';
import { ProfessionalProfileModel } from '../models/ProfessionalProfileModel.js';

/**
 * Servicio POO para la lógica de negocio de especialistas y profesionales Fixer.
 */
export class ProfessionalService {
  private readonly professionalRepository: IProfessionalRepository;

  constructor(professionalRepository: IProfessionalRepository) {
    this.professionalRepository = professionalRepository;
  }

  public async search(filters: IProfessionalSearchFilters): Promise<IProfessionalSearchResult> {
    return this.professionalRepository.search(filters);
  }

  public async getProfileById(id: string): Promise<ProfessionalProfileModel> {
    const profile = await this.professionalRepository.findByIdWithDetails(id);
    if (!profile) {
      throw new NotFoundError('Profesional no encontrado');
    }
    return profile;
  }

  public async getProfileByUserId(userId: string): Promise<ProfessionalProfileModel> {
    const profile = await this.professionalRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Perfil profesional no encontrado para este usuario');
    }
    return profile;
  }

  public async updateMyProfile(
    userId: string,
    data: UpdateProfessionalProfileDTO
  ): Promise<ProfessionalProfileModel> {
    const profile = await this.professionalRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Perfil profesional no encontrado');
    }

    const updated = await this.professionalRepository.update(profile.id, data as Partial<ProfessionalProfileModel>);
    return updated!;
  }
}
