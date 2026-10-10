const { z } = require('zod');

const createProductionSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    time: z.string().regex(/^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?$/, 'Invalid time format').optional(),
    yarn: z.string().min(1, 'Yarn description is required'),
    ends: z.number().int().positive('Ends must be a positive integer'),
    meter: z.number().positive('Meter must be a positive number'),
    panna: z.number().positive('Panna (beam width) must be a positive number'),
    total_beam: z.number().int().positive('Total beam must be a positive integer'),
    contact_name: z.string().optional(),
    whatsapp_number: z.string().optional(),
    machine_id: z.string().uuid().or(z.string()).optional(),
    notes: z.string().optional()
  })
});

const updateProductionSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    time: z.string().optional(),
    yarn: z.string().min(1).optional(),
    ends: z.number().int().positive().optional(),
    meter: z.number().positive().optional(),
    panna: z.number().positive().optional(),
    total_beam: z.number().int().positive().optional(),
    machine_id: z.string().uuid().or(z.string()).nullable().optional(),
    status: z.enum(['COMPLETED', 'PENDING', 'IN_PROGRESS', 'REJECTED']).optional(),
    notes: z.string().optional()
  })
});

const queryProductionSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    search: z.string().optional(),
    sortBy: z.enum(['date', 'created_at', 'yarn', 'meter', 'total_beam', 'contact_name']).optional().default('date'),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional().default('desc'),
    from: z.string().optional(),
    to: z.string().optional(),
    yarn: z.string().optional(),
    source: z.enum(['WHATSAPP', 'MANUAL', 'API', 'ALL']).optional(),
    status: z.enum(['COMPLETED', 'PENDING', 'IN_PROGRESS', 'REJECTED', 'ALL']).optional(),
    machineId: z.string().optional()
  })
});

module.exports = {
  createProductionSchema,
  updateProductionSchema,
  queryProductionSchema
};
