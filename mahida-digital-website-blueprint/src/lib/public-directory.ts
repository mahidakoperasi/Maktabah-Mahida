import { z } from 'zod';

export const PUBLIC_DIRECTORY_KEY = 'public_directory';

function safeHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

const platformHosts: Record<string, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
};

const entry = {
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(100),
  sortOrder: z.number().int().min(0).max(100000),
  isVisible: z.boolean(),
};

export const socialLinkSchema = z.object({
  ...entry,
  platform: z.enum(['instagram', 'youtube', 'facebook', 'tiktok', 'x', 'lainnya']),
  url: z.string().trim().max(2048),
}).refine((item) => !item.url || safeHttpsUrl(item.url), 'URL media sosial harus menggunakan HTTPS')
  .refine((item) => !item.url || !safeHttpsUrl(item.url) || item.platform === 'lainnya' ||
    platformHosts[item.platform]?.includes(new URL(item.url).hostname.toLowerCase()),
  'Domain URL tidak sesuai dengan platform')
  .refine((item) => !item.isVisible || Boolean(item.url), 'Isi URL sebelum ditampilkan');

export const contactLinkSchema = z.object({
  ...entry,
  category: z.enum(['umum', 'pendaftaran', 'koperasi', 'lainnya']),
  channel: z.enum(['whatsapp', 'telepon', 'email', 'website']),
  value: z.string().trim().max(2048),
}).refine((item) => !(item.category === 'koperasi' && item.channel === 'whatsapp'),
  'WhatsApp koperasi dikelola melalui Pengaturan Koperasi')
  .refine((item) => !item.value || (
    item.channel === 'whatsapp' ? /^[1-9][0-9]{8,14}$/.test(item.value) :
    item.channel === 'telepon' ? /^\+?[0-9]{7,15}$/.test(item.value) :
    item.channel === 'email' ? z.email().safeParse(item.value).success :
    safeHttpsUrl(item.value)
  ), 'Format tujuan kontak tidak valid')
  .refine((item) => !item.isVisible || Boolean(item.value), 'Isi tujuan kontak sebelum ditampilkan');

export const publicDirectorySchema = z.object({
  socials: z.array(socialLinkSchema).max(30),
  contacts: z.array(contactLinkSchema).max(30),
  coopWhatsapp: z.object({
    label: z.string().trim().min(1).max(100),
    sortOrder: z.number().int().min(0).max(100000),
    isVisible: z.boolean(),
  }),
}).superRefine((value, ctx) => {
  const ids = [...value.socials, ...value.contacts].map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: 'custom', message: 'ID entri tidak boleh sama' });
  }
});

export type SocialLink = z.infer<typeof socialLinkSchema>;
export type ContactLink = z.infer<typeof contactLinkSchema>;
export type PublicDirectory = z.infer<typeof publicDirectorySchema>;

export const EMPTY_PUBLIC_DIRECTORY: PublicDirectory = {
  socials: [],
  contacts: [],
  coopWhatsapp: { label: 'Koperasi Mahida', sortOrder: 0, isVisible: false },
};
