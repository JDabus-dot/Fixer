import {
  IProfessionalProfileAttributes,
  IProfessionalProfileCreationAttributes,
  ProfessionalProfileModel
} from '../models/ProfessionalProfileModel.js';

export interface IReviewBreakdown {
  five?: number;
  four?: number;
  three?: number;
  two?: number;
  one?: number;
}

/**
 * Patrón Creacional: BUILDER para ProfessionalProfileModel.
 * Resuelve el antipatrón de Telescoping Constructor / Parameter Object Inflado,
 * permitiendo construir perfiles profesionales con más de 18 atributos
 * de forma fluida, legible y reutilizable en Seeders, Servicios y Tests.
 */
export class ProfessionalProfileBuilder {
  private profileData: Partial<IProfessionalProfileAttributes> = {
    coverageRadiusKm: 15,
    responseTime: '< 30 min',
    isEmergencyAvailable: false,
    isVerified: false,
    ratingAverage: 5.0,
    totalReviews: 0,
    fiveStarCount: 0,
    fourStarCount: 0,
    threeStarCount: 0,
    twoStarCount: 0,
    oneStarCount: 0,
    experienceYears: 1,
    tradeCategory: 'servicios-generales',
    headline: 'Profesional Fixer',
    bio: 'Profesional verificado en Fixer dispuesto a resolver requerimientos técnicos de calidad.',
    licenseNumber: 'En proceso de validación',
    city: 'Buenos Aires',
    zone: 'Cobertura a coordinar',
    address: 'Consultar cobertura',
    badgeLevel: 'Nuevo Profesional',
    specialties: []
  };

  constructor(userId?: string) {
    if (userId) {
      this.profileData.userId = userId;
    }
  }

  public withUserId(userId: string): this {
    this.profileData.userId = userId;
    return this;
  }

  public withTrade(
    category: string,
    headline: string,
    licenseNumber: string,
    experienceYears = 1
  ): this {
    this.profileData.tradeCategory = category;
    this.profileData.headline = headline;
    this.profileData.licenseNumber = licenseNumber;
    this.profileData.experienceYears = experienceYears;
    return this;
  }

  public withBio(bio: string): this {
    this.profileData.bio = bio;
    return this;
  }

  public withLocation(city: string, zone: string, address: string, radiusKm = 20): this {
    this.profileData.city = city;
    this.profileData.zone = zone;
    this.profileData.address = address;
    this.profileData.coverageRadiusKm = radiusKm;
    return this;
  }

  public withResponseTime(responseTime = '< 30 min'): this {
    this.profileData.responseTime = responseTime;
    return this;
  }

  public withEmergencyAvailability(responseTime = '< 20 min'): this {
    this.profileData.isEmergencyAvailable = true;
    this.profileData.responseTime = responseTime;
    return this;
  }

  public withReputation(
    rating: number,
    totalReviews: number,
    badge = 'Verificado Fixer',
    fiveStarCount = 0,
    fourStarCount = 0,
    threeStarCount = 0,
    twoStarCount = 0,
    oneStarCount = 0
  ): this {
    this.profileData.ratingAverage = rating;
    this.profileData.totalReviews = totalReviews;
    this.profileData.badgeLevel = badge;
    this.profileData.isVerified = true;
    this.profileData.fiveStarCount = fiveStarCount;
    this.profileData.fourStarCount = fourStarCount;
    this.profileData.threeStarCount = threeStarCount;
    this.profileData.twoStarCount = twoStarCount;
    this.profileData.oneStarCount = oneStarCount;
    return this;
  }

  public withReviewBreakdown(breakdown: IReviewBreakdown): this {
    if (breakdown.five !== undefined) this.profileData.fiveStarCount = breakdown.five;
    if (breakdown.four !== undefined) this.profileData.fourStarCount = breakdown.four;
    if (breakdown.three !== undefined) this.profileData.threeStarCount = breakdown.three;
    if (breakdown.two !== undefined) this.profileData.twoStarCount = breakdown.two;
    if (breakdown.one !== undefined) this.profileData.oneStarCount = breakdown.one;
    return this;
  }

  public withSpecialties(specialties: string[]): this {
    this.profileData.specialties = specialties;
    return this;
  }

  public setVerified(isVerified: boolean): this {
    this.profileData.isVerified = isVerified;
    return this;
  }

  public withBadge(badgeLevel: string): this {
    this.profileData.badgeLevel = badgeLevel;
    return this;
  }

  /**
   * Retorna los datos construidos en formato de atributos de creación.
   */
  public buildData(): IProfessionalProfileCreationAttributes {
    if (!this.profileData.userId) {
      throw new Error('El atributo userId es requerido para construir un ProfessionalProfile');
    }
    return { ...this.profileData } as IProfessionalProfileCreationAttributes;
  }

  /**
   * Persiste el objeto en base de datos utilizando el modelo Sequelize.
   */
  public async build(): Promise<ProfessionalProfileModel> {
    const data = this.buildData();
    return ProfessionalProfileModel.create(data as any);
  }
}
