import { UserModel } from '../../modules/users/models/UserModel.js';
import { ProfessionalProfileModel } from '../../modules/professionals/models/ProfessionalProfileModel.js';
import { RegisterDTO } from '../../modules/auth/dtos/AuthDTOs.js';
import { ProfessionalProfileBuilder } from '../../modules/professionals/builders/ProfessionalProfileBuilder.js';

export interface ICreatedAccount {
  user: UserModel;
  profile?: ProfessionalProfileModel;
}

/**
 * Patrón Creacional: FACTORY METHOD (AccountCreator).
 * Define la abstracción para la orquestación y creación de cuentas
 * desacoplando la lógica de autenticación de las jerarquías de entidades.
 */
export abstract class AccountCreator {
  public abstract createAccount(
    dto: RegisterDTO,
    passwordHash: string,
    securityAnswerHash: string
  ): Promise<ICreatedAccount>;
}

/**
 * Creador concreto para cuentas de Cliente (CLIENT).
 */
export class ClientAccountCreator extends AccountCreator {
  public async createAccount(
    dto: RegisterDTO,
    passwordHash: string,
    securityAnswerHash: string
  ): Promise<ICreatedAccount> {
    const user = await UserModel.create({
      fullName: dto.fullName,
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone,
      passwordHash,
      role: 'CLIENT',
      securityQuestion: dto.securityQuestion,
      securityAnswerHash,
      termsAccepted: true,
      isActive: true
    });
    return { user };
  }
}

/**
 * Creador concreto para cuentas de Profesional (PROFESSIONAL).
 * Orquesta la creación del usuario y construye de forma consistente
 * su perfil profesional dependiente mediante ProfessionalProfileBuilder.
 */
export class ProfessionalAccountCreator extends AccountCreator {
  public async createAccount(
    dto: RegisterDTO,
    passwordHash: string,
    securityAnswerHash: string
  ): Promise<ICreatedAccount> {
    const user = await UserModel.create({
      fullName: dto.fullName,
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone,
      passwordHash,
      role: 'PROFESSIONAL',
      securityQuestion: dto.securityQuestion,
      securityAnswerHash,
      termsAccepted: true,
      isActive: true
    });

    const trade = dto.tradeCategory || 'otro';
    const profile = await new ProfessionalProfileBuilder(user.id)
      .withTrade(
        trade,
        `Especialista en ${dto.tradeCategory || 'servicios generales'}`,
        'En proceso de validación',
        1
      )
      .withBio('Profesional verificado en Fixer dispuesto a resolver requerimientos técnicos de calidad.')
      .withLocation('Buenos Aires', 'Cobertura a coordinar', 'Consultar cobertura', 15)
      .withPricing(12000, '< 30 min', false)
      .withReputation(5.0, 0, 'Nuevo Profesional')
      .withSpecialties([dto.tradeCategory || 'Mantenimiento General'])
      .setVerified(false)
      .build();

    return { user, profile };
  }
}

/**
 * Fábrica de Cuentas (AccountFactory).
 * Resuelve y provee el creador correspondiente según el rol o indicador isPro.
 * Cumple con Open/Closed (OCP) permitiendo extender con nuevos roles
 * sin modificar el AuthService ni código cliente.
 */
export class AccountFactory {
  private static readonly creators: Map<string, () => AccountCreator> = new Map([
    ['CLIENT', () => new ClientAccountCreator()],
    ['PROFESSIONAL', () => new ProfessionalAccountCreator()]
  ]);

  /**
   * Permite registrar dinámicamente un nuevo creador de cuentas (OCP).
   */
  public static registerCreator(role: string, factoryFn: () => AccountCreator): void {
    this.creators.set(role.toUpperCase(), factoryFn);
  }

  /**
   * Obtiene la instancia del AccountCreator según el flag o rol.
   */
  public static getCreator(isProOrRole: boolean | string): AccountCreator {
    const roleKey =
      typeof isProOrRole === 'boolean'
        ? isProOrRole
          ? 'PROFESSIONAL'
          : 'CLIENT'
        : isProOrRole.toUpperCase();

    const factoryFn = this.creators.get(roleKey);
    if (!factoryFn) {
      return new ClientAccountCreator();
    }
    return factoryFn();
  }

  /**
   * Ejecuta directamente la creación a través del creador apropiado.
   */
  public static async createAccount(
    isProOrRole: boolean | string,
    dto: RegisterDTO,
    passwordHash: string,
    securityAnswerHash: string
  ): Promise<ICreatedAccount> {
    const creator = this.getCreator(isProOrRole);
    return creator.createAccount(dto, passwordHash, securityAnswerHash);
  }
}
