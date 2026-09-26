import { z } from 'zod';

export const createArticleInput = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.string().trim().min(1).max(1_000_000),
  excerpt: z.string().trim().max(2000).optional(),
  status: z.enum(['draft', 'published']).optional(),
  metaTitle: z.string().trim().max(500).optional(),
  metaDescription: z.string().trim().max(2000).optional(),
  featuredImage: z.string().trim().max(2048).optional(),
});

export const updateArticleInput = createArticleInput.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});
