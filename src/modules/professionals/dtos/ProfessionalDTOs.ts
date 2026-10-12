import { z } from 'zod';

export const SearchProfessionalsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  zone: z.string().optional(),
  city: z.string().optional(),
  isVerified: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  isEmergencyAvailable: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  minRating: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : Number(val))),
  sortBy: z.enum(['rating', 'price-low', 'price-high', 'urgency', 'experience']).optional().default('rating'),
  page: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? 1 : Math.max(Number(val), 1))),
  limit: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? 12 : Math.max(Number(val), 1)))
});

export type SearchProfessionalsDTO = z.infer<typeof SearchProfessionalsSchema>;

export const UpdateProfessionalProfileSchema = z.object({
  tradeCategory: z.string().min(2).optional(),
  headline: z.string().min(5).optional(),
  bio: z.string().min(10).optional(),
  licenseNumber: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  city: z.string().optional(),
  zone: z.string().optional(),
  address: z.string().optional(),
  coverageRadiusKm: z.number().int().min(1).optional(),
  basePrice: z.number().min(0).optional(),
  responseTime: z.string().optional(),
  isEmergencyAvailable: z.boolean().optional(),
  specialties: z.array(z.string()).optional()
});

export type UpdateProfessionalProfileDTO = z.infer<typeof UpdateProfessionalProfileSchema>;
