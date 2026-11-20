import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface IReviewAttributes {
  id: string;
  clientId: string;
  professionalId: string;
  rating: number;
  serviceType: string;
  comment: string;
  isVerifiedVisit: boolean;
  professionalReply?: string | null;
  repliedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IReviewCreationAttributes = Optional<
  IReviewAttributes,
  'id' | 'isVerifiedVisit' | 'professionalReply' | 'repliedAt' | 'createdAt' | 'updatedAt'
>;

/**
 * Modelo Sequelize para las Reseñas y Calificaciones de los clientes.
 */
export class ReviewModel extends Model<IReviewAttributes, IReviewCreationAttributes> implements IReviewAttributes {
  declare public id: string;
  declare public clientId: string;
  declare public professionalId: string;
  declare public rating: number;
  declare public serviceType: string;
  declare public comment: string;
  declare public isVerifiedVisit: boolean;
  declare public professionalReply: string | null;
  declare public repliedAt: Date | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): typeof ReviewModel {
    ReviewModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        clientId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        professionalId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'professional_profiles',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
            min: 1,
            max: 5
          }
        },
        serviceType: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        isVerifiedVisit: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        professionalReply: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        repliedAt: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'reviews',
        indexes: [
          { fields: ['professional_id'] },
          { fields: ['client_id'] },
          { fields: ['rating'] }
        ]
      }
    );
    return ReviewModel;
  }
}
