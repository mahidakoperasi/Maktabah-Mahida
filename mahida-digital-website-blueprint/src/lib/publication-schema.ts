import { z } from 'zod';
import { contentSchema, mediaSchema, designPath, imageField } from './design-schema';
import { gallerySchema } from './gallery-schema';
export const pageDraftSchema = z.object({
  type: z.literal('page'),
  path: z.string().refine(designPath),
  title: z.string().trim().min(1).max(255),
  intro: z.string().max(2000),
  body: z.string().max(150000),
  content: contentSchema.nullable(),
  media: mediaSchema.nullable(),
});
export const publicationSchema = z.discriminatedUnion('type', [
  pageDraftSchema,
  z.object({
    type: z.literal('gallery'),
    id: z.number().int().positive(),
    data: gallerySchema,
  }),
  z.object({
    type: z.literal('announcement'),
    id: z.number().int().positive(),
    title: z.string().trim().min(1).max(500),
    excerpt: z.string().max(2000),
    content: z.string().trim().min(1).max(1000000),
    featuredImage: imageField,
  }),
]);
export type Publication = z.infer<typeof publicationSchema>;
export function publicationTarget(data: Publication) {
  return data.type === 'page' ? `page:${data.path}` : `${data.type}:${data.id}`;
}
export function validTarget(target: string) {
  return target.startsWith('page:')
    ? designPath(target.slice(5))
    : /^(gallery|announcement):[1-9]\d*$/.test(target);
}
