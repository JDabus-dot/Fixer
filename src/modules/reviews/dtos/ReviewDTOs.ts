import { z } from 'zod';

export const CreateReviewSchema = z.object({
  professionalId: z.string().uuid('ID de profesional inválido'),
  rating: z.number().int().min(1).max(5, 'La calificación debe estar entre 1 y 5'),
  serviceType: z.string().min(3, 'Debes especificar el tipo de servicio realizado'),
  comment: z.string().min(20, 'El testimonio debe contener al menos 20 caracteres'),
  isVerifiedVisit: z.boolean().default(true)
});

export type CreateReviewDTO = z.infer<typeof CreateReviewSchema>;

export const ReplyReviewSchema = z.object({
  reply: z.string().min(3, 'La respuesta debe tener al menos 3 caracteres')
});

export type ReplyReviewDTO = z.infer<typeof ReplyReviewSchema>;
