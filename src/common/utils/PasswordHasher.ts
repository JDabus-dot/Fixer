import bcrypt from 'bcryptjs';

/**
 * Servicio de hashing de contraseñas bajo POO.
 * Encapsula la lógica de Bcrypt garantizando bajo acoplamiento.
 */
export class PasswordHasher {
  private readonly saltRounds: number;

  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  public async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, this.saltRounds);
  }

  public async compare(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }
}
