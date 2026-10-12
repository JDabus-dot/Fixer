import { IUserRepository } from '../../users/interfaces/IUserRepository.js';
import { PasswordHasher } from '../../../common/utils/PasswordHasher.js';
import { TokenService } from '../../../common/utils/TokenService.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../../common/errors/index.js';
import { LoginDTO, RegisterDTO, ResetPasswordDTO, VerifyAccountDTO } from '../dtos/AuthDTOs.js';
import { ProfessionalProfileModel } from '../../professionals/models/ProfessionalProfileModel.js';
import { UserModel } from '../../users/models/UserModel.js';

export interface IAuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
    avatarUrl?: string | null;
    isPro: boolean;
  };
  token: string;
}

/**
 * Servicio POO de autenticación y seguridad.
 * Aplica SOLID inyectando repositorios y utilidades de cifrado.
 */
export class AuthService {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly tokenService: TokenService;

  constructor(
    userRepository: IUserRepository,
    passwordHasher = new PasswordHasher(),
    tokenService = new TokenService()
  ) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  public async register(dto: RegisterDTO): Promise<IAuthResponse> {
    const exists = await this.userRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictError('Ya existe una cuenta registrada con este correo electrónico');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const securityAnswerHash = await this.passwordHasher.hash(dto.securityAnswer.trim().toLowerCase());

    const role = dto.isPro ? 'PROFESSIONAL' : 'CLIENT';

    const newUser = await this.userRepository.create({
      fullName: dto.fullName,
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone,
      passwordHash,
      role,
      securityQuestion: dto.securityQuestion,
      securityAnswerHash,
      termsAccepted: true,
      isActive: true
    });

    // Si es profesional, crea su perfil base asociado
    if (dto.isPro) {
      await ProfessionalProfileModel.create({
        userId: newUser.id,
        tradeCategory: dto.tradeCategory || 'otro',
        headline: `Especialista en ${dto.tradeCategory || 'servicios generales'}`,
        bio: 'Profesional verificado en Fixer dispuesto a resolver requerimientos técnicos de calidad.',
        licenseNumber: 'En proceso de validación',
        experienceYears: 1,
        city: 'Buenos Aires',
        zone: 'Cobertura a coordinar',
        address: 'Consultar cobertura',
        coverageRadiusKm: 15,
        basePrice: 12000,
        responseTime: '< 30 min',
        isEmergencyAvailable: false,
        isVerified: false,
        badgeLevel: 'Nuevo Profesional',
        ratingAverage: 5.0,
        totalReviews: 0,
        specialties: [dto.tradeCategory || 'Mantenimiento General']
      });
    }

    const token = this.tokenService.generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName
    });

    return {
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        isPro: newUser.role === 'PROFESSIONAL'
      },
      token
    };
  }

  public async login(dto: LoginDTO): Promise<IAuthResponse> {
    const user = await this.userRepository.findByEmailWithPassword(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Credenciales incorrectas o cuenta inactiva');
    }

    const isMatch = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    const token = this.tokenService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName
    });

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isPro: user.role === 'PROFESSIONAL'
      },
      token
    };
  }

  /**
   * Endpoint de recuperación de contraseña:
   * Verifica la existencia del email y devuelve la pregunta de seguridad configurada.
   */
  public async verifyAccountForRecovery(dto: VerifyAccountDTO): Promise<{ email: string; securityQuestion: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundError('No se encontró ninguna cuenta asociada a este correo electrónico');
    }

    return {
      email: user.email,
      securityQuestion: user.securityQuestion
    };
  }

  /**
   * Endpoint para restablecer la contraseña validando la respuesta secreta.
   */
  public async resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new NotFoundError('No se encontró la cuenta');
    }

    const isAnswerCorrect = await this.passwordHasher.compare(
      dto.securityAnswer.trim().toLowerCase(),
      user.securityAnswerHash
    );

    if (!isAnswerCorrect) {
      throw new UnauthorizedError('La respuesta a la pregunta de seguridad es incorrecta');
    }

    const newPasswordHash = await this.passwordHasher.hash(dto.newPassword);
    await user.update({ passwordHash: newPasswordHash });

    return {
      message: 'Tu contraseña ha sido restablecida con éxito. Ya podés iniciar sesión.'
    };
  }
}
