import { IBaseRepository } from '../../../common/interfaces/index.js';
import { ProfessionalProfileModel } from '../models/ProfessionalProfileModel.js';

export interface IProfessionalSearchFilters {
  query?: string;
  category?: string;
  zone?: string;
  city?: string;
  isVerified?: boolean;
  isEmergencyAvailable?: boolean;
  minRating?: number;
  sortBy?: 'rating' | 'urgency' | 'experience';
  page?: number;
  limit?: number;
}

export interface IProfessionalSearchResult {
  professionals: ProfessionalProfileModel[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

/**
 * Contrato de repositorio para profesionales y especialistas Fixer (ISP).
 */
export interface IProfessionalRepository extends IBaseRepository<ProfessionalProfileModel, string> {
  search(filters: IProfessionalSearchFilters): Promise<IProfessionalSearchResult>;
  findByIdWithDetails(id: string): Promise<ProfessionalProfileModel | null>;
  findByUserId(userId: string): Promise<ProfessionalProfileModel | null>;
  recalculateRatings(professionalId: string): Promise<void>;
}
