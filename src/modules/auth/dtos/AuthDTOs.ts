import { z } from 'zod';

export const RegisterSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Debe ser un correo electrónico válido'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 dígitos'),
  password: z.string().min(8, 'La contraseña debe contener al menos 8 caracteres'),
  securityQuestion: z.string().min(3, 'Debes seleccionar una pregunta secreta'),
  securityAnswer: z.string().min(2, 'La respuesta secreta no puede estar vacía'),
  isPro: z.boolean().default(false),
  tradeCategory: z.string().optional()
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
  rememberMe: z.boolean().optional().default(false)
});

export type LoginDTO = z.infer<typeof LoginSchema>;

export const VerifyAccountSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido')
});

export type VerifyAccountDTO = z.infer<typeof VerifyAccountSchema>;

export const ResetPasswordSchema = z.object({
  email: z.string().email('Debe ser un correo electrónico válido'),
  securityAnswer: z.string().min(1, 'La respuesta secreta es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
