import { z } from 'zod';

export const CreateServiceRequestSchema = z.object({
  professionalId: z.string().uuid('ID de profesional inválido'),
  title: z.string().min(5, 'El título del requerimiento debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'Describe con mayor detalle el problema o servicio requerido'),
  category: z.string().min(2, 'La categoría del servicio es requerida'),
  serviceAddress: z.string().min(5, 'La dirección del servicio es requerida'),
  zone: z.string().min(2, 'La zona o barrio es requerido'),
  isUrgent: z.boolean().default(false),
  scheduledDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
});

export type CreateServiceRequestDTO = z.infer<typeof CreateServiceRequestSchema>;

export const UpdateRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  reason: z.string().optional()
});

export type UpdateRequestStatusDTO = z.infer<typeof UpdateRequestStatusSchema>;
