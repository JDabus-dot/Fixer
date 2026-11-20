import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRepository } from '../../modules/users/repositories/UserRepository.js';
import { UserModel } from '../../modules/users/models/UserModel.js';

vi.mock('../../modules/users/models/UserModel.js', () => ({
  UserModel: { findByPk: vi.fn(), findOne: vi.fn(), count: vi.fn() }
}));
vi.mock('../../modules/professionals/models/ProfessionalProfileModel.js', () => ({ ProfessionalProfileModel: {} }));

describe('UserRepository - Integración (persistencia mockeada)', () => {
  const userId = 'user-1';
  const email = '  Juan@Example.com  ';
  const user = { id: userId, email: 'juan@example.com' } as unknown as UserModel;
  const excludeSensitive = { exclude: ['passwordHash', 'securityAnswerHash'] };
  let repository: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new UserRepository();
  });
  //Asegura capa de persistencia excluye hashes de contraseña y respuesta secreta
  describe('findById', () => {
    it('excluye hashes e incluye perfil', async () => {
      vi.mocked(UserModel.findByPk).mockResolvedValue(user);
      await repository.findById(userId);
      expect(UserModel.findByPk).toHaveBeenCalledWith(userId, expect.objectContaining({ attributes: excludeSensitive }));
    });
  });
  // normaliza el email
  describe('findByEmail', () => {
    it('normaliza el email antes de buscar', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(user);
      await repository.findByEmail(email);
      expect(UserModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'juan@example.com' } }));
    });
  });
  //verifica que no se excluyan hashes y falle silenciosamente si no encuentra el usuario
  describe('findByEmailWithPassword', () => {
    it('NO excluye hashes', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(user);
      await repository.findByEmailWithPassword(email);
      const callArgs = vi.mocked(UserModel.findOne).mock.calls[0][0] as Record<string, unknown>;
      expect(callArgs.attributes).toBeUndefined();
    });
  });

  describe('existsByEmail', () => {
    // True si count > 0.
    it('devuelve true cuando el email existe', async () => {
      vi.mocked(UserModel.count).mockResolvedValue(1);
      const result = await repository.existsByEmail(email);
      expect(result).toBe(true);
    });
  });
});