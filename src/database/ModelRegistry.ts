import { Sequelize } from 'sequelize';
import { UserModel } from '../modules/users/models/UserModel.js';
import { ProfessionalProfileModel } from '../modules/professionals/models/ProfessionalProfileModel.js';
import { ReviewModel } from '../modules/reviews/models/ReviewModel.js';
import { ServiceRequestModel } from '../modules/service-requests/models/ServiceRequestModel.js';

/**
 * Clase POO para inicializar modelos y establecer asociaciones relacionales en Sequelize.
 */
export class ModelRegistry {
  public static initModels(sequelize: Sequelize): void {
    // 1. Inicialización de entidades
    UserModel.initialize(sequelize);
    ProfessionalProfileModel.initialize(sequelize);
    ReviewModel.initialize(sequelize);
    ServiceRequestModel.initialize(sequelize);

    // 2. Asociación User <-> ProfessionalProfile (1 a 1)
    UserModel.hasOne(ProfessionalProfileModel, {
      as: 'professionalProfile',
      foreignKey: 'userId'
    });
    ProfessionalProfileModel.belongsTo(UserModel, {
      as: 'user',
      foreignKey: 'userId'
    });

    // 3. Asociación User <-> Review (1 a N - Cliente emisor)
    UserModel.hasMany(ReviewModel, {
      as: 'reviewsWritten',
      foreignKey: 'clientId'
    });
    ReviewModel.belongsTo(UserModel, {
      as: 'client',
      foreignKey: 'clientId'
    });

    // 4. Asociación ProfessionalProfile <-> Review (1 a N - Perfil calificado)
    ProfessionalProfileModel.hasMany(ReviewModel, {
      as: 'reviews',
      foreignKey: 'professionalId'
    });
    ReviewModel.belongsTo(ProfessionalProfileModel, {
      as: 'professional',
      foreignKey: 'professionalId'
    });

    // 5. Asociación User <-> ServiceRequest (1 a N - Solicitudes del cliente)
    UserModel.hasMany(ServiceRequestModel, {
      as: 'serviceRequests',
      foreignKey: 'clientId'
    });
    ServiceRequestModel.belongsTo(UserModel, {
      as: 'client',
      foreignKey: 'clientId'
    });

    // 6. Asociación ProfessionalProfile <-> ServiceRequest (1 a N - Pedidos asignados al Fixer)
    ProfessionalProfileModel.hasMany(ServiceRequestModel, {
      as: 'assignedRequests',
      foreignKey: 'professionalId'
    });
    ServiceRequestModel.belongsTo(ProfessionalProfileModel, {
      as: 'professional',
      foreignKey: 'professionalId'
    });

    console.log('✅ Modelos y asociaciones de Sequelize configurados.');
  }
}
