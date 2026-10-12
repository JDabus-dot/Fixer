import { z } from 'zod';

export const UpdateUserSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  phone: z.string().min(6, 'Número de teléfono inválido').optional(),
  avatarUrl: z.string().url('URL de avatar inválida').optional().nullable()
});

export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
