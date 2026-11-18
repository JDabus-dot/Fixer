import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRepository } from '../../modules/users/repositories/UserRepository.js';
import { UserModel } from '../../modules/users/models/UserModel.js';
import { ProfessionalProfileModel } from '../../modules/professionals/models/ProfessionalProfileModel.js';


vi.mock('../../modules/users/models/UserModel.js', () => ({
  UserModel: {
    findByPk: vi.fn(),
    findOne: vi.fn(),
    findAll: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn()
  }
}));

vi.mock('../../modules/professionals/models/ProfessionalProfileModel.js', () => ({
  ProfessionalProfileModel: {}
}));

describe('UserRepository - IntegraciÃ³n (persistencia mockeada)', () => {
  const userId = 'user-1';
  const email = '  Juan.Martinez@Example.com  ';

  const user = {
    id: userId,
    email: 'juan.martinez@example.com',
    passwordHash: 'hash',
    securityAnswerHash: 'answer-hash'
  } as unknown as UserModel;

  const excludeSensitive = {
    exclude: ['passwordHash', 'securityAnswerHash']
  };

  const includeProfile = [
    {
      model: ProfessionalProfileModel,
      as: 'professionalProfile'
    }
  ];

  let repository: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new UserRepository();
  });

  // findById: buscar por PK sin exponer hashes e incluyendo el perfil profesional.
  describe('findById', () => {
    it('busca por PK excluyendo los hashes e incluyendo el perfil profesional', async () => {
      vi.mocked(UserModel.findByPk).mockResolvedValue(user);

      const result = await repository.findById(userId);

      expect(UserModel.findByPk).toHaveBeenCalledWith(userId, {
        attributes: excludeSensitive,
        include: includeProfile
      });
      expect(result).toBe(user);
    });

    it('devuelve null si el usuario no existe', async () => {
      vi.mocked(UserModel.findByPk).mockResolvedValue(null);

      const result = await repository.findById('missing');

      expect(result).toBeNull();
    });
  });

  //  findAll:listar usuarios sin exponer hashes; los filtros se pasan tal cual.
  describe('findAll', () => {

    it('devuelve todos los usuarios excluyendo los hashes', async () => {
      vi.mocked(UserModel.findAll).mockResolvedValue([user]);

      const result = await repository.findAll();

      expect(UserModel.findAll).toHaveBeenCalledWith({
        where: undefined,
        attributes: excludeSensitive
      });
      expect(result).toEqual([user]);
    });

    it('aplica filtros cuando se pasan', async () => {
      vi.mocked(UserModel.findAll).mockResolvedValue([user]);
      const filters = { role: 'CLIENT' };

      await repository.findAll(filters);

      expect(UserModel.findAll).toHaveBeenCalledWith({
        where: filters,
        attributes: excludeSensitive
      });
    });
  });

  //findByEmail: buscar por email normalizado (minÃºsculas y sin espacios).
  describe('findByEmail', () => {
    it('normaliza el email a minÃºsculas y sin espacios', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(user);

      await repository.findByEmail(email);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: { email: 'juan.martinez@example.com' },
        attributes: excludeSensitive,
        include: includeProfile
      });
    });
  });

  // â”€â”€â”€ findByEmailWithPassword: variante para login; NO excluye hashes (los necesita para comparar).
  describe('findByEmailWithPassword', () => {

    it('NO excluye los hashes (necesarios para login)', async () => {
      vi.mocked(UserModel.findOne).mockResolvedValue(user);

      await repository.findByEmailWithPassword(email);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        where: { email: 'juan.martinez@example.com' },
        include: includeProfile
      });

      const callArgs = vi.mocked(UserModel.findOne).mock.calls[0][0] as Record<string, unknown>;
      expect(callArgs.attributes).toBeUndefined();
    });
  });

  // â”€â”€â”€ existsByEmail: saber si un email ya estÃ¡ registrado (usado en registro).
  describe('existsByEmail', () => {

    it('devuelve true cuando el email existe', async () => {
      vi.mocked(UserModel.count).mockResolvedValue(1);

      const result = await repository.existsByEmail(email);

      expect(UserModel.count).toHaveBeenCalledWith({
        where: { email: 'juan.martinez@example.com' }
      });
      expect(result).toBe(true);
    });


    it('devuelve false cuando el email no existe', async () => {
      vi.mocked(UserModel.count).mockResolvedValue(0);

      const result = await repository.existsByEmail(email);

      expect(result).toBe(false);
    });
  });

  // create: delegar la creaciÃ³n al modelo sin transformar el payload.
  describe('create', () => {
    // PASAMANOS: el payload llega intacto al modelo.
    it('crea un usuario a travÃ©s del modelo', async () => {
      vi.mocked(UserModel.create).mockResolvedValue(user);

      const payload = { email: 'juan.martinez@example.com', fullName: 'Juan MartÃ­nez' };
      const result = await repository.create(payload);

      expect(UserModel.create).toHaveBeenCalledWith(payload);
      expect(result).toBe(user);
    });
  });

  // update: buscar la instancia y actualizarla (para correr hooks de Sequelize).
  describe('update', () => {
    // patron find + update
    it('actualiza un usuario existente', async () => {
      const instance = { update: vi.fn().mockResolvedValue(user) };
      vi.mocked(UserModel.findByPk).mockResolvedValue(instance as unknown as UserModel);

      const changes = { fullName: 'Juan MartÃ­nez Actualizado' };
      const result = await repository.update(userId, changes);

      expect(UserModel.findByPk).toHaveBeenCalledWith(userId);
      expect(instance.update).toHaveBeenCalledWith(changes);
      expect(result).toBe(instance);
    });

    it('devuelve null si el usuario no existe', async () => {
      vi.mocked(UserModel.findByPk).mockResolvedValue(null);

      const result = await repository.update('missing', { fullName: 'X' });

      expect(result).toBeNull();
    });
  });

  //delete: devolver true/false segÃºn si se eliminÃ³ alguna fila.
  describe('delete', () => {
    // Se eliminÃ³ al menos una fila.
    it('devuelve true cuando elimina al menos una fila', async () => {
      vi.mocked(UserModel.destroy).mockResolvedValue(1);

      const result = await repository.delete(userId);

      expect(UserModel.destroy).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toBe(true);
    });

    // No habÃ­a nada que eliminar.
    it('devuelve false cuando no elimina ninguna fila', async () => {
      vi.mocked(UserModel.destroy).mockResolvedValue(0);

      const result = await repository.delete('missing');

      expect(result).toBe(false);
    });
  });
});
