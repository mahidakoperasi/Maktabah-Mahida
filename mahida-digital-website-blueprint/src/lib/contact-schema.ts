import { z } from 'zod';
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  replyTo: z
    .string()
    .trim()
    .min(7)
    .max(200)
    .refine(
      (v) => z.email().safeParse(v).success || /^\+?[0-9 ()-]{7,25}$/.test(v),
      'Isi email atau nomor telepon yang valid',
    ),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).default(''),
});
