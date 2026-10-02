import { z } from 'zod';

export const productionRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  time: z.string().optional(),
  yarn: z.string().min(1, 'Yarn count/specification is required'),
  ends: z.coerce.number().positive('Ends must be a positive integer'),
  meter: z.coerce.number().positive('Meter must be a positive number'),
  panna: z.coerce.number().positive('Panna (beam width) must be a positive number'),
  total_beam: z.coerce.number().int().positive('Total beam must be a positive integer'),
  contact_name: z.string().optional(),
  whatsapp_number: z.string().optional(),
  notes: z.string().optional()
});
