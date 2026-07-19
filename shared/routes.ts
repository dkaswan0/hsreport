import { z } from 'zod';
import { insertInspectionSchema, insertInspectionItemSchema, inspections, inspectionItems, faultLibrary } from './schema';

export type CreateInspectionRequest = z.infer<typeof insertInspectionSchema>;
export type UpdateInspectionRequest = Partial<z.infer<typeof insertInspectionSchema>>;
export type CreateInspectionItemRequest = z.infer<typeof insertInspectionItemSchema>;
export type UpdateInspectionItemRequest = Partial<z.infer<typeof insertInspectionItemSchema>>;

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  inspections: {
    list: {
      method: 'GET' as const,
      path: '/api/inspections',
      input: z.object({
        search: z.string().optional(),
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof inspections.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/inspections/:id',
      responses: {
        200: z.custom<typeof inspections.$inferSelect & { items: typeof inspectionItems.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/inspections',
      input: insertInspectionSchema,
      responses: {
        201: z.custom<typeof inspections.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/inspections/:id',
      input: insertInspectionSchema.partial(),
      responses: {
        200: z.custom<typeof inspections.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/inspections/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    deleteMultiple: {
      method: 'POST' as const,
      path: '/api/inspections/delete-multiple',
      input: z.object({ ids: z.array(z.number()) }),
      responses: {
        200: z.object({ deleted: z.number() }),
        400: errorSchemas.validation,
      },
    },
    generatePdf: {
      method: 'POST' as const,
      path: '/api/inspections/:id/pdf',
      responses: {
        200: z.object({ url: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  inspectionItems: {
    create: {
      method: 'POST' as const,
      path: '/api/inspections/:id/items',
      input: insertInspectionItemSchema.omit({ inspectionId: true }),
      responses: {
        201: z.custom<typeof inspectionItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/inspection-items/:id',
      input: insertInspectionItemSchema.partial().omit({ inspectionId: true }),
      responses: {
        200: z.custom<typeof inspectionItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/inspection-items/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  faultLibrary: {
    list: {
      method: 'GET' as const,
      path: '/api/fault-library',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof faultLibrary.$inferSelect>()),
      },
    },
    suggest: {
      method: 'POST' as const,
      path: '/api/fault-library/suggest',
      input: z.object({ query: z.string() }),
      responses: {
        200: z.object({
          faultName: z.string(),
          description: z.string(),
          severity: z.string(),
          solution: z.string()
        }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/fault-library/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
