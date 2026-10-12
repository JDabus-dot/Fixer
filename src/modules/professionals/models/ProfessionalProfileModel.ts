import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface IProfessionalProfileAttributes {
  id: string;
  userId: string;
  tradeCategory: string;
  headline: string;
  bio: string;
  licenseNumber: string;
  experienceYears: number;
  city: string;
  zone: string;
  address: string;
  coverageRadiusKm: number;
  responseTime: string;
  isEmergencyAvailable: boolean;
  isVerified: boolean;
  badgeLevel: string;
  ratingAverage: number;
  totalReviews: number;
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  specialties: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type IProfessionalProfileCreationAttributes = Optional<
  IProfessionalProfileAttributes,
  | 'id'
  | 'coverageRadiusKm'
  | 'responseTime'
  | 'isEmergencyAvailable'
  | 'isVerified'
  | 'badgeLevel'
  | 'ratingAverage'
  | 'totalReviews'
  | 'fiveStarCount'
  | 'fourStarCount'
  | 'threeStarCount'
  | 'twoStarCount'
  | 'oneStarCount'
  | 'specialties'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Modelo Sequelize para el Perfil Profesional (Fixer).
 * Almacena información detallada del oficio, matrícula, cobertura y reputación.
 */
export class ProfessionalProfileModel
  extends Model<IProfessionalProfileAttributes, IProfessionalProfileCreationAttributes>
  implements IProfessionalProfileAttributes
{
  declare public id: string;
  declare public userId: string;
  declare public tradeCategory: string;
  declare public headline: string;
  declare public bio: string;
  declare public licenseNumber: string;
  declare public experienceYears: number;
  declare public city: string;
  declare public zone: string;
  declare public address: string;
  declare public coverageRadiusKm: number;
  declare public responseTime: string;
  declare public isEmergencyAvailable: boolean;
  declare public isVerified: boolean;
  declare public badgeLevel: string;
  declare public ratingAverage: number;
  declare public totalReviews: number;
  declare public fiveStarCount: number;
  declare public fourStarCount: number;
  declare public threeStarCount: number;
  declare public twoStarCount: number;
  declare public oneStarCount: number;
  declare public specialties: string[];

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): typeof ProfessionalProfileModel {
    ProfessionalProfileModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        tradeCategory: {
          type: DataTypes.STRING(80),
          allowNull: false
        },
        headline: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        bio: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        licenseNumber: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        experienceYears: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        zone: {
          type: DataTypes.STRING(120),
          allowNull: false
        },
        address: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        coverageRadiusKm: {
          type: DataTypes.INTEGER,
          defaultValue: 25
        },
        responseTime: {
          type: DataTypes.STRING(60),
          defaultValue: '< 30 min'
        },
        isEmergencyAvailable: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        badgeLevel: {
          type: DataTypes.STRING(50),
          defaultValue: 'Verificado Fixer'
        },
        ratingAverage: {
          type: DataTypes.DECIMAL(3, 2),
          defaultValue: 5.0
        },
        totalReviews: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        fiveStarCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        fourStarCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        threeStarCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        twoStarCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        oneStarCount: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        specialties: {
          type: DataTypes.JSONB,
          defaultValue: []
        }
      },
      {
        sequelize,
        tableName: 'professional_profiles',
        indexes: [
          { fields: ['trade_category'] },
          { fields: ['city'] },
          { fields: ['zone'] },
          { fields: ['is_verified'] },
          { fields: ['is_emergency_available'] },
          { fields: ['rating_average'] }
        ]
      }
    );
    return ProfessionalProfileModel;
  }
}
