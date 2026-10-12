import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export type ServiceRequestStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface IServiceRequestAttributes {
  id: string;
  clientId: string;
  professionalId: string;
  title: string;
  description: string;
  category: string;
  serviceAddress: string;
  zone: string;
  isUrgent: boolean;
  scheduledDate?: Date | null;
  status: ServiceRequestStatus;
  cancellationReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IServiceRequestCreationAttributes = Optional<
  IServiceRequestAttributes,
  'id' | 'isUrgent' | 'scheduledDate' | 'status' | 'cancellationReason' | 'createdAt' | 'updatedAt'
>;

/**
 * Modelo Sequelize para las Solicitudes de Servicio y Urgencias.
 */
export class ServiceRequestModel
  extends Model<IServiceRequestAttributes, IServiceRequestCreationAttributes>
  implements IServiceRequestAttributes
{
  declare public id: string;
  declare public clientId: string;
  declare public professionalId: string;
  declare public title: string;
  declare public description: string;
  declare public category: string;
  declare public serviceAddress: string;
  declare public zone: string;
  declare public isUrgent: boolean;
  declare public scheduledDate: Date | null;
  declare public status: ServiceRequestStatus;
  declare public cancellationReason: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): typeof ServiceRequestModel {
    ServiceRequestModel.init(
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
        title: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        category: {
          type: DataTypes.STRING(80),
          allowNull: false
        },
        serviceAddress: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        zone: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        isUrgent: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        scheduledDate: {
          type: DataTypes.DATE,
          allowNull: true
        },
        status: {
          type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
          defaultValue: 'PENDING',
          allowNull: false
        },
        cancellationReason: {
          type: DataTypes.TEXT,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'service_requests',
        indexes: [
          { fields: ['client_id'] },
          { fields: ['professional_id'] },
          { fields: ['status'] },
          { fields: ['is_urgent'] }
        ]
      }
    );
    return ServiceRequestModel;
  }
}
