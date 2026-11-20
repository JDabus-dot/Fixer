import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface IUserAttributes {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  securityQuestion: string;
  securityAnswerHash: string;
  avatarUrl?: string | null;
  termsAccepted: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IUserCreationAttributes = Optional<
  IUserAttributes,
  'id' | 'avatarUrl' | 'isActive' | 'termsAccepted' | 'createdAt' | 'updatedAt'
>;

/**
 * Modelo Sequelize para la entidad Usuario.
 * Encapsula la persistencia y definición de campos de la tabla users.
 */
export class UserModel extends Model<IUserAttributes, IUserCreationAttributes> implements IUserAttributes {
  declare public id: string;
  declare public fullName: string;
  declare public email: string;
  declare public phone: string;
  declare public passwordHash: string;
  declare public role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  declare public securityQuestion: string;
  declare public securityAnswerHash: string;
  declare public avatarUrl: string | null;
  declare public termsAccepted: boolean;
  declare public isActive: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): typeof UserModel {
    UserModel.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        fullName: {
          type: DataTypes.STRING(120),
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        phone: {
          type: DataTypes.STRING(40),
          allowNull: false
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        role: {
          type: DataTypes.ENUM('CLIENT', 'PROFESSIONAL', 'ADMIN'),
          defaultValue: 'CLIENT',
          allowNull: false
        },
        securityQuestion: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        securityAnswerHash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        avatarUrl: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        termsAccepted: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }
      },
      {
        sequelize,
        tableName: 'users',
        indexes: [
          { unique: true, fields: ['email'] },
          { fields: ['role'] }
        ]
      }
    );
    return UserModel;
  }
}
